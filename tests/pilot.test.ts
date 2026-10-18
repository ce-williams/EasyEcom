import assert from 'node:assert/strict';
import test from 'node:test';
import { getBrand } from '../src/lib/brand';
import { readPilotConfig, publicPilotStatus } from '../src/server/pilot/config';
import { createPilotCheckout, verifyPilotReturn, type StripeRequest } from '../src/server/pilot/checkout';
import { GET, POST } from '../src/app/api/pilot/route';

const brand = getBrand('apres');
const first = brand.products[0]; const second = brand.products[1];
const copy = { supportEmail: 'orders@example.test', shipping: 'Test shipping information.', returns: 'Test returns information.', productDetails: 'Test product specifications.', privacy: 'Test privacy information.', terms: 'Test ordering terms.' };
function environment(): Record<string, string | undefined> {
  return {
    PILOT_MODE: 'test', PILOT_ACCEPTING_ORDERS: 'true', PILOT_BRAND: 'apres', STRIPE_SECRET_KEY: 'sk_test_fake',
    PILOT_SITE_URL: 'http://127.0.0.1:3000',
    PILOT_PRICE_IDS_JSON: JSON.stringify({ [first.variants[0].id]: 'price_first', [second.variants[0].id]: 'price_second' }),
    PILOT_SHIPPING_RATE_ID: 'shr_test', PILOT_ALLOWED_COUNTRIES: 'US',
    PILOT_AUTOMATIC_TAX: 'false', PILOT_PUBLIC_COPY_JSON: JSON.stringify(copy),
  };
}
const bag = () => ({ lines: [{ productId: first.id, variantId: first.variants[0].id, quantity: 2 }, { productId: second.id, variantId: second.variants[0].id, quantity: 1 }], attemptId: '12345678-1234-4123-8123-123456789abc' });
function mockStripe(change?: (path: string, record: Record<string, unknown>) => Record<string, unknown>) {
  const calls: { path: string; params?: URLSearchParams; key?: string }[] = [];
  const request: StripeRequest = async (path, params, key) => {
    calls.push({ path, params, key });
    let record: Record<string, unknown>;
    if (path.startsWith('prices/')) record = { id: path.includes('first') ? 'price_first' : 'price_second', active: true, type: 'one_time', billing_scheme: 'per_unit', unit_amount: 500, currency: 'usd', livemode: false, product: { active: true } };
    else if (path.startsWith('shipping_rates/')) record = { active: true, livemode: false, type: 'fixed_amount', fixed_amount: { amount: 400, currency: 'usd' } };
    else record = { url: 'https://checkout.stripe.com/c/pay/cs_test_mock', livemode: false };
    return change ? change(path, record) : record;
  };
  return { calls, request };
}

test('pilot is off by default and exposes no key or private price mapping publicly', () => {
  assert.equal(readPilotConfig(brand, {}), null);
  assert.deepEqual(publicPilotStatus(brand, {}), { mode: 'preview', variantIds: [] });
  const status = publicPilotStatus(brand, environment());
  assert.equal(status.mode, 'test'); assert.equal(status.variantIds.length, 2);
  assert.ok(!JSON.stringify(status).includes('sk_test'));
  assert.ok(!JSON.stringify(status).includes('price_first'));
  assert.deepEqual(publicPilotStatus(brand, { PILOT_MODE: 'test' }), { mode: 'paused', variantIds: [] });
  const forcedPoc = { ...environment(), NEXT_PUBLIC_POC_MODE: 'true', PILOT_MODE: 'live', STRIPE_SECRET_KEY: 'sk_live_fake', PILOT_LAUNCH_APPROVED: 'true' };
  assert.equal(readPilotConfig(brand, forcedPoc), null);
  assert.deepEqual(publicPilotStatus(brand, forcedPoc), { mode: 'preview', variantIds: [] });
});

test('pilot validates account mode, brand, origin, mapping, shipping and merchant decisions', () => {
  for (const patch of [
    { PILOT_MODE: 'bogus' }, { PILOT_BRAND: 'desk' }, { STRIPE_SECRET_KEY: 'sk_live_fake' },
    { PILOT_SITE_URL: 'http://shop.example.com' }, { PILOT_SITE_URL: 'https://user:pass@example.com' },
    { PILOT_SITE_URL: 'https://example.com/other' }, { PILOT_PRICE_IDS_JSON: '{}' },
    { PILOT_PRICE_IDS_JSON: JSON.stringify({ unknown: 'price_first' }) },
    { PILOT_PRICE_IDS_JSON: JSON.stringify({ [first.variants[0].id]: 'price_first', [second.variants[0].id]: 'price_first' }) },
    { PILOT_SHIPPING_RATE_ID: '' }, { PILOT_ALLOWED_COUNTRIES: '' }, { PILOT_AUTOMATIC_TAX: '' },
    { PILOT_PUBLIC_COPY_JSON: '{}' }, { PILOT_PUBLIC_COPY_JSON: JSON.stringify({ ...copy, supportEmail: 'bad\nmail@example.test' }) },
  ]) assert.throws(() => readPilotConfig(brand, { ...environment(), ...patch }));
  const live = { ...environment(), PILOT_MODE: 'live', STRIPE_SECRET_KEY: 'sk_live_fake', PILOT_SITE_URL: 'https://example.com' };
  assert.throws(() => readPilotConfig(brand, live));
  assert.equal(readPilotConfig(brand, { ...live, PILOT_LAUNCH_APPROVED: 'true' })?.mode, 'live');
});

test('mixed bag uses approved Stripe Prices, shipping collection, card payment and manual fulfillment metadata', async () => {
  const stripe = mockStripe();
  await createPilotCheckout({ ...bag(), total: 1, price: 1 }, brand, readPilotConfig(brand, environment())!, stripe.request);
  const params = stripe.calls.find(c => c.path === 'checkout/sessions')!.params!;
  assert.equal(params.get('line_items[0][price]'), 'price_first');
  assert.equal(params.get('line_items[0][quantity]'), '2');
  assert.equal(params.get('line_items[1][price]'), 'price_second');
  assert.equal(params.get('shipping_address_collection[allowed_countries][0]'), 'US');
  assert.equal(params.get('shipping_options[0][shipping_rate]'), 'shr_test');
  assert.equal(params.get('payment_method_types[0]'), 'card');
  assert.equal(params.get('metadata[fulfillment]'), 'manual-pilot');
  assert.equal(params.get('metadata[variant_0]'), `${first.variants[0].id}:2`);
  assert.ok(params.get('success_url')!.includes('{CHECKOUT_SESSION_ID}'));
  assert.equal(params.has('line_items[0][price_data][unit_amount]'), false);
});

test('invalid or unavailable bag rejects the entire request before any Stripe call', async () => {
  const config = readPilotConfig(brand, environment())!;
  const paused = readPilotConfig(brand, { ...environment(), PILOT_ACCEPTING_ORDERS: 'false' })!;
  const pausedStripe = mockStripe();
  await assert.rejects(createPilotCheckout(bag(), brand, paused, pausedStripe.request));
  assert.equal(pausedStripe.calls.length, 0);
  assert.equal(publicPilotStatus(brand, { ...environment(), PILOT_ACCEPTING_ORDERS: 'false' }).mode, 'paused');
  for (const body of [null, { ...bag(), attemptId: 'fake' }, { ...bag(), lines: [] }, { ...bag(), lines: [...bag().lines, bag().lines[0]] }, ...[0, -1, 1.5, 21].map(quantity => ({ ...bag(), lines: [{ ...bag().lines[0], quantity }] })), { ...bag(), lines: [{ ...bag().lines[0], variantId: brand.products[2].variants[0].id }] }, { ...bag(), lines: [{ ...bag().lines[0], productId: second.id }] }]) {
    const stripe = mockStripe();
    await assert.rejects(createPilotCheckout(body, brand, config, stripe.request));
    assert.equal(stripe.calls.length, 0);
  }
});

test('Stripe price, availability, currency, price model or mode drift cannot create a session', async () => {
  const config = readPilotConfig(brand, environment())!;
  for (const patch of [{ id: 'price_wrong' }, { unit_amount: 1 }, { currency: 'eur' }, { livemode: true }, { active: false }, { product: { active: false } }, { type: 'recurring' }, { billing_scheme: 'tiered' }, { transform_quantity: { divide_by: 10 } }]) {
    const stripe = mockStripe((path, record) => path.startsWith('prices/') ? { ...record, ...patch } : record);
    await assert.rejects(createPilotCheckout(bag(), brand, config, stripe.request));
    assert.equal(stripe.calls.some(c => c.path === 'checkout/sessions'), false);
  }
});

test('shipping drift and non-Stripe redirect responses fail closed', async () => {
  const config = readPilotConfig(brand, environment())!;
  for (const patch of [{ active: false }, { livemode: true }, { fixed_amount: { currency: 'eur', amount: 400 } }, { fixed_amount: { currency: 'usd', amount: -1 } }]) {
    const stripe = mockStripe((path, record) => path.startsWith('shipping_rates/') ? { ...record, ...patch } : record);
    await assert.rejects(createPilotCheckout(bag(), brand, config, stripe.request));
    assert.equal(stripe.calls.some(c => c.path === 'checkout/sessions'), false);
  }
  const stripe = mockStripe((path, record) => path === 'checkout/sessions' ? { ...record, url: 'https://checkout.stripe.com.evil.example/pay' } : record);
  await assert.rejects(createPilotCheckout(bag(), brand, config, stripe.request));
});

test('same attempt and bag produce identical Stripe parameters/key on retry; changed bag uses a different key', async () => {
  const config = readPilotConfig(brand, environment())!; const stripe = mockStripe();
  await createPilotCheckout(bag(), brand, config, stripe.request);
  await createPilotCheckout({ ...bag(), lines: [...bag().lines].reverse() }, brand, config, stripe.request);
  await createPilotCheckout({ ...bag(), lines: [{ ...bag().lines[0], quantity: 3 }] }, brand, config, stripe.request);
  const sessions = stripe.calls.filter(c => c.path === 'checkout/sessions');
  assert.equal(sessions[0].key, sessions[1].key);
  assert.equal(sessions[0].params!.toString(), sessions[1].params!.toString());
  assert.notEqual(sessions[0].key, sessions[2].key);
});

test('return page verifies paid state, mode and brand with Stripe; query strings do not assert success', async () => {
  const config = readPilotConfig(brand, environment())!;
  const paid = { status: 'complete', payment_status: 'paid', mode: 'payment', livemode: false, metadata: { brand: brand.id, fulfillment: 'manual-pilot' } };
  assert.equal(await verifyPilotReturn('cs_test_abc', brand, config, async () => paid), 'paid');
  for (const patch of [{ status: 'open' }, { payment_status: 'unpaid' }, { livemode: true }, { metadata: { brand: 'desk', fulfillment: 'manual-pilot' } }, { metadata: { brand: brand.id, fulfillment: 'other' } }]) assert.equal(await verifyPilotReturn('cs_test_abc', brand, config, async () => ({ ...paid, ...patch })), 'unconfirmed');
  assert.equal(await verifyPilotReturn('paid=true', brand, config, async () => { throw new Error('must not call'); }), 'unconfirmed');
  assert.equal(await verifyPilotReturn('cs_test_abc', brand, config, async () => { throw new Error('network'); }), 'unconfirmed');
});

test('HTTP checkout boundary blocks disabled, cross-origin, wrong-format, oversized and invalid bag requests without a charge', async () => {
  const saved = { ...process.env };
  try {
    for (const key of Object.keys(process.env)) if (key.startsWith('PILOT_') || key === 'STRIPE_SECRET_KEY') delete process.env[key];
    process.env.NEXT_PUBLIC_STORE_BRAND = 'apres';
    const response = GET();
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await response.json()).mode, 'preview');
    const makeRequest = (body: string, origin = 'http://127.0.0.1:3000', type = 'application/json') => new Request('http://127.0.0.1:3000/api/pilot', { method: 'POST', headers: { origin, 'Content-Type': type }, body });
    assert.equal((await POST(makeRequest('{}'))).status, 503);
    Object.assign(process.env, environment());
    assert.equal((await POST(makeRequest('{}', 'https://other.example'))).status, 403);
    assert.equal((await POST(makeRequest('{}', undefined, 'text/plain'))).status, 415);
    assert.equal((await POST(makeRequest('x'.repeat(8193)))).status, 413);
    assert.equal((await POST(makeRequest('not json'))).status, 400);
    assert.equal((await POST(makeRequest(JSON.stringify({ ...bag(), lines: [] })))).status, 400);
    process.env.PILOT_ACCEPTING_ORDERS = 'false';
    assert.equal((await POST(makeRequest(JSON.stringify(bag())))).status, 503);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
