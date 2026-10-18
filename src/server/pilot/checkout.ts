import { createHash } from 'node:crypto';
import type { Brand, CartLine } from '../../lib/types';
import type { PilotConfig } from './config';

export class PilotError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
export type StripeRequest = (path: string, params?: URLSearchParams, idempotencyKey?: string) => Promise<Record<string, unknown>>;

export function stripeClient(config: PilotConfig): StripeRequest {
  return async (path, params, idempotencyKey) => {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: params ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${config.key}`, 'Stripe-Version': '2025-02-24.acacia',
        ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: params?.toString(),
    });
    if (!response.ok) throw new PilotError('Checkout is temporarily unavailable. Your bag is saved; please try again.', 502);
    return await response.json();
  };
}

export function validatePilotBag(body: unknown, brand: Brand, config: PilotConfig): { lines: CartLine[]; attemptId: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PilotError('Invalid bag.');
  const { lines, attemptId } = body as { lines: unknown; attemptId: unknown };
  if (typeof attemptId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) throw new PilotError('Refresh the page and try checkout again.');
  if (!Array.isArray(lines) || !lines.length || lines.length > 30) throw new PilotError('Choose at least one item.');
  const seen = new Set<string>();
  const result = lines.map(raw => {
    if (!raw || typeof raw !== 'object') throw new PilotError('Invalid bag item.');
    const { productId, variantId, quantity } = raw;
    const product = brand.products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.id === variantId && v.available);
    if (!variant || !Object.hasOwn(config.prices, variant.id)) throw new PilotError('One of these options is not available in this drop. Remove it from your bag to continue.');
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20 || seen.has(variant.id)) throw new PilotError('Check the quantities in your bag.');
    seen.add(variant.id);
    return { productId: product!.id, variantId: variant.id, quantity };
  });
  return { lines: result.sort((a, b) => a.variantId.localeCompare(b.variantId)), attemptId };
}

export async function createPilotCheckout(body: unknown, brand: Brand, config: PilotConfig, stripe: StripeRequest) {
  if (!config.acceptingOrders) throw new PilotError('This drop is paused.', 503);
  const { lines, attemptId } = validatePilotBag(body, brand, config);
  // Prices come from Stripe, with a strict catalog match; never accept browser totals.
  const priceRecords = await Promise.all(lines.map(line => stripe(`prices/${config.prices[line.variantId]}?expand[]=product`)));
  for (const [i, price] of priceRecords.entries()) {
    const line = lines[i];
    const product = brand.products.find(p => p.id === line.productId)!;
    const variant = product.variants.find(v => v.id === line.variantId)!;
    const stripeProduct = price.product as { active?: boolean } | undefined;
    if (price.id !== config.prices[line.variantId] || !price.active || !stripeProduct?.active || price.type !== 'one_time' || price.billing_scheme !== 'per_unit' || price.transform_quantity || price.unit_amount !== variant.price || price.currency !== brand.currency.toLowerCase() || price.livemode !== (config.mode === 'live')) throw new PilotError('A price or product has changed. Please contact the shop before ordering.', 409);
  }
  const rate = await stripe(`shipping_rates/${config.shippingRate}`);
  const fixed = rate.fixed_amount as { currency?: string; amount?: number } | undefined;
  if (!rate.active || rate.livemode !== (config.mode === 'live') || rate.type !== 'fixed_amount' || fixed?.currency !== brand.currency.toLowerCase() || !Number.isSafeInteger(fixed?.amount) || fixed!.amount! < 0) throw new PilotError('Shipping is temporarily unavailable.', 409);
  const params = new URLSearchParams({
    mode: 'payment', 'payment_method_types[0]': 'card',
    success_url: `${config.siteUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.siteUrl}/cart`,
    'automatic_tax[enabled]': String(config.automaticTax),
    'shipping_options[0][shipping_rate]': config.shippingRate,
    'metadata[brand]': brand.id, 'metadata[fulfillment]': 'manual-pilot',
    'payment_intent_data[metadata][brand]': brand.id,
    'payment_intent_data[metadata][fulfillment]': 'manual-pilot',
    'custom_text[submit][message]': `We review each order before arranging production. Questions: ${config.copy.supportEmail}`,
  });
  // Use Stripe's default expiry so retries have identical idempotent parameters.
  // The runbook covers expiring outstanding sessions when the pilot is paused.
  config.countries.forEach((country, i) => params.set(`shipping_address_collection[allowed_countries][${i}]`, country));
  lines.forEach((line, i) => {
    params.set(`line_items[${i}][price]`, config.prices[line.variantId]);
    params.set(`line_items[${i}][quantity]`, String(line.quantity));
    params.set(`metadata[variant_${i}]`, `${line.variantId}:${line.quantity}`);
    params.set(`payment_intent_data[metadata][variant_${i}]`, `${line.variantId}:${line.quantity}`);
  });
  const key = createHash('sha256').update(JSON.stringify([brand.id, config.mode, lines, attemptId])).digest('hex');
  params.set('client_reference_id', `pilot-${key.slice(0, 24)}`);
  const session = await stripe('checkout/sessions', params, `pilot-${key}`);
  if (session.livemode !== (config.mode === 'live') || typeof session.url !== 'string') throw new PilotError('Could not open secure checkout.', 502);
  const url = new URL(session.url);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username || url.password || url.port) throw new PilotError('Could not open secure checkout.', 502);
  return { url: url.href };
}

export async function verifyPilotReturn(id: string, brand: Brand, config: PilotConfig, stripe: StripeRequest): Promise<'paid' | 'unconfirmed'> {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return 'unconfirmed';
  try {
    const session = await stripe(`checkout/sessions/${id}`);
    const metadata = session.metadata as Record<string, string> | undefined;
    return session.status === 'complete' && session.payment_status === 'paid' && session.mode === 'payment' && session.livemode === (config.mode === 'live') && metadata?.brand === brand.id && metadata.fulfillment === 'manual-pilot' ? 'paid' : 'unconfirmed';
  } catch { return 'unconfirmed'; }
}
