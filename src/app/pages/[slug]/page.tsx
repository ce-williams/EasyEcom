import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBrand } from '@/lib/brand';
import { publicPilotStatus } from '@/server/pilot/config';
export const dynamic = 'force-dynamic';
const content: Record<string, { title: string; lead: string; sections: { title: string; text: string }[] }> = {
  shipping: { title: 'The journey to your doorstep.', lead: 'Shipping & returns', sections: [{ title: 'A quick note about this preview', text: 'The shop is currently a design preview. Products, prices, and finish options are illustrative. We’re not accepting orders or taking payments.' }, { title: 'Shipping', text: 'Available destinations, shipping rates, delivery estimates, and dispatch times will be published here before the store opens. No free-shipping or delivery guarantee is active in this preview.' }, { title: 'Returns & order support', text: 'Return eligibility, time windows, damaged-order support, and contact details will be added after approval. Nothing in this preview changes your statutory rights.' }] },
  contact: { title: 'Good company starts with hello.', lead: 'Get in touch', sections: [{ title: 'We’re getting things ready', text: 'Customer support contact details will appear here before launch. This preview doesn’t collect messages, email addresses, or other personal information.' }, { title: 'Looking for the shop?', text: 'The full concept collection is ready to explore. Add your favorites to the demo bag to try the shopping experience.' }] },
  privacy: { title: 'A little privacy, please.', lead: 'Privacy preview', sections: [{ title: 'What this preview stores', text: 'Your demo bag is saved in your browser’s local storage so it is still there when you return. It contains product identifiers, variant identifiers, and quantities. Remove all bag items to clear your saved selections.' }, { title: 'No live commerce or analytics', text: 'This design preview does not collect payments, contact information, or analytics events. Fonts are served locally. A complete privacy policy will be reviewed before any live services are connected.' }] },
  terms: { title: 'A few ground rules.', lead: 'Preview terms', sections: [{ title: 'An invitation to explore', text: 'This site demonstrates a storefront design. Product artwork, prices, specifications, and availability are illustrative and do not represent an offer to sell. No order is placed through the demo checkout.' }, { title: 'Before launch', text: 'Commercial terms, product specifications, fulfillment policies, and business details will be reviewed and published before real orders are accepted.' }] },
  accessibility: { title: 'Good design welcomes everyone.', lead: 'Accessibility', sections: [{ title: 'Made to be explored your way', text: 'The design includes keyboard navigation, visible focus indicators, text labels, a native dialog for the bag, and reduced-motion support. Product options are available without hovering.' }, { title: 'A work in progress', text: 'Accessibility is being evaluated as the storefront takes shape. We have not completed a formal conformance audit. A support contact will be provided before launch.' }] },
};
export function generateStaticParams() { return Object.keys(content).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: content[slug]?.lead ?? 'Not found' }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = content[slug]; if (!base) notFound();
  const pilot = publicPilotStatus(getBrand());
  const copy = pilot.copy;
  const sections = copy && slug === 'shipping' ? [{ title: 'Shipping', text: copy.shipping }, { title: 'Returns & support', text: copy.returns }]
    : copy && slug === 'contact' ? [{ title: 'Get in touch', text: `For order support, email ${copy.supportEmail}.` }]
    : copy && slug === 'privacy' ? [{ title: 'Your information', text: copy.privacy }]
    : copy && slug === 'terms' ? [{ title: 'Ordering from us', text: copy.terms }]
    : base.sections;
  return <article className="section-wrap policy-page"><Link href="/" className="inline-link">← Back to the shop</Link><p className="eyebrow">{copy ? base.lead.replace('preview', '').trim() : base.lead}</p><h1>{base.title}</h1>{pilot.mode === 'test' && <p>Test store: no real payments, production or shipping.</p>}{sections.map(s => <section key={s.title}><h2>{s.title}</h2><p>{s.text}</p></section>)}{copy && <p><a className="inline-link" href={`mailto:${copy.supportEmail}`}>Contact {copy.supportEmail}</a></p>}<Link href="/#shop" className="button primary">Explore the collection →</Link></article>;
}
