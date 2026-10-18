import { getBrand } from '@/lib/brand';
import { publicPilotStatus, readPilotConfig } from '@/server/pilot/config';
import { createPilotCheckout, PilotError, stripeClient } from '@/server/pilot/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
export function GET() { return Response.json(publicPilotStatus(getBrand()), { headers }); }

export async function POST(request: Request) {
  try {
    const brand = getBrand();
    const config = readPilotConfig(brand);
    if (!config) throw new PilotError('The shop is not accepting payments yet.', 503);
    if (!config.acceptingOrders) throw new PilotError('This drop is paused. Existing orders are still being handled; please contact the shop for help.', 503);
    if (request.headers.get('origin') !== config.siteUrl) throw new PilotError('Please open checkout from the shop.', 403);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new PilotError('Invalid checkout request.', 415);
    // Check the stream as well as Content-Length; untrusted requests can omit it.
    const reader = request.body?.getReader();
    if (!reader) throw new PilotError('Invalid checkout request.');
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.length;
      if (length > 8192) { await reader.cancel(); throw new PilotError('Bag is too large.', 413); }
      chunks.push(value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new PilotError('Invalid checkout request.'); }
    return Response.json(await createPilotCheckout(body, brand, config, stripeClient(config)), { headers });
  } catch (error) {
    // No secrets, addresses, raw Stripe errors or payment records in responses/logs.
    return Response.json({ error: error instanceof PilotError ? error.message : 'Checkout is unavailable. Please contact the shop or try again later.' }, { status: error instanceof PilotError ? error.status : 503, headers });
  }
}
