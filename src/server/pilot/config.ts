import type { Brand } from '../../lib/types';
import type { PilotCopy, PilotStatus } from '../../lib/pilot';

export type PilotConfig = {
  mode: 'test' | 'live'; key: string; siteUrl: string;
  prices: Record<string, string>; shippingRate: string; countries: string[];
  automaticTax: boolean; copy: PilotCopy; acceptingOrders: boolean;
};

export function readPilotConfig(brand: Brand, env: Record<string, string | undefined> = process.env): PilotConfig | null {
  if (typeof window !== 'undefined') throw new Error('Pilot configuration is server-only.');
  const mode = env.PILOT_MODE ?? 'off';
  if (mode === 'off') return null;
  if (mode !== 'test' && mode !== 'live') throw new Error('Invalid pilot mode.');
  if (env.PILOT_BRAND !== brand.id) throw new Error('Pilot brand does not match this storefront.');
  const key = env.STRIPE_SECRET_KEY ?? '';
  if (!new RegExp(`^(sk|rk)_${mode}_[A-Za-z0-9]+$`).test(key)) throw new Error('Stripe key and pilot mode must match.');
  const site = new URL(env.PILOT_SITE_URL ?? '');
  if (site.username || site.password || site.search || site.hash || site.pathname !== '/' || (site.protocol !== 'https:' && !(mode === 'test' && site.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(site.hostname)))) throw new Error('Use a valid storefront origin.');
  const prices: unknown = JSON.parse(env.PILOT_PRICE_IDS_JSON ?? '{}');
  if (!prices || typeof prices !== 'object' || Array.isArray(prices)) throw new Error('Invalid price mappings.');
  const available = new Set(brand.products.flatMap(p => p.variants.filter(v => v.available).map(v => v.id)));
  const mappings = Object.entries(prices);
  if (!mappings.length || mappings.some(([id, price]) => !available.has(id) || typeof price !== 'string' || !/^price_[A-Za-z0-9]+$/.test(price)) || new Set(mappings.map(([, price]) => price)).size !== mappings.length) throw new Error('Map each pilot variant to its own Stripe Price.');
  const shippingRate = env.PILOT_SHIPPING_RATE_ID ?? '';
  if (!/^shr_[A-Za-z0-9]+$/.test(shippingRate)) throw new Error('A Stripe shipping rate is required, including for free shipping.');
  const countries = (env.PILOT_ALLOWED_COUNTRIES ?? '').split(',').map(c => c.trim()).filter(Boolean);
  if (!countries.length || countries.some(c => !/^[A-Z]{2}$/.test(c)) || new Set(countries).size !== countries.length) throw new Error('Explicit shipping countries are required.');
  if (!['true', 'false'].includes(env.PILOT_AUTOMATIC_TAX ?? '')) throw new Error('Choose an explicit tax configuration.');
  const copy = JSON.parse(env.PILOT_PUBLIC_COPY_JSON ?? '{}') as PilotCopy;
  if (!copy || typeof copy !== 'object' || ['supportEmail', 'shipping', 'returns', 'productDetails', 'privacy', 'terms'].some(k => typeof copy[k as keyof PilotCopy] !== 'string' || !copy[k as keyof PilotCopy].trim())) throw new Error('Publish contact, product and policy information before checkout.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(copy.supportEmail) || /[\r\n]/.test(copy.supportEmail)) throw new Error('Provide a valid support email.');
  if (mode === 'live' && env.PILOT_LAUNCH_APPROVED !== 'true') throw new Error('Live launch review is incomplete.');
  return { mode, key, siteUrl: site.origin, prices: prices as Record<string, string>, shippingRate, countries, automaticTax: env.PILOT_AUTOMATIC_TAX === 'true', copy, acceptingOrders: env.PILOT_ACCEPTING_ORDERS === 'true' };
}

export function publicPilotStatus(brand: Brand, env: Record<string, string | undefined> = process.env): PilotStatus {
  try {
    const config = readPilotConfig(brand, env);
    return config ? { mode: config.acceptingOrders ? config.mode : 'paused', variantIds: Object.keys(config.prices), copy: config.copy } : { mode: 'preview', variantIds: [] };
  } catch {
    // Do not expose private configuration or silently fall back to demo checkout.
    return { mode: 'paused', variantIds: [] };
  }
}
