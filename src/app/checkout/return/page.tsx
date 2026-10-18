import Link from 'next/link';
import { getBrand } from '@/lib/brand';
import { readPilotConfig } from '@/server/pilot/config';
import { stripeClient, verifyPilotReturn } from '@/server/pilot/checkout';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout status', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const brand = getBrand();
  let state = 'unconfirmed'; let support: string | undefined; let test = false;
  try {
    const config = readPilotConfig(brand);
    if (config) {
      support = config.copy.supportEmail; test = config.mode === 'test';
      if (typeof session_id === 'string') state = await verifyPilotReturn(session_id, brand, config, stripeClient(config));
    }
  } catch { /* A return URL is never proof of payment. */ }
  const paid = state === 'paid';
  return <article className="section-wrap policy-page"><p className="eyebrow">{test ? 'TEST CHECKOUT' : 'GOOD COMPANY, NEXT STOP'}</p><h1>{paid ? test ? 'Test payment complete.' : 'Payment received.' : 'Let’s check on that payment.'}</h1><section><h2>{paid ? 'We’ll take it from here.' : 'Payment is not confirmed here.'}</h2><p>{paid ? test ? 'This was a Stripe test payment. No money was collected and nothing will be produced or shipped.' : 'Your payment has been verified with Stripe. We’ll review your selections and arrange production and shipping. Payment confirmation is separate from shipment confirmation.' : 'If you already paid, check your Stripe receipt or contact the shop before trying again. This page does not place an order or submit anything to a supplier.'}</p><p>Your bag has been kept in this browser. You don’t need to pay for the same order again.</p>{support && <p><a className="inline-link" href={`mailto:${support}`}>Contact {support}</a></p>}</section><Link className="button primary" href="/">Back to the shop →</Link></article>;
}
