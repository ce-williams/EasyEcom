'use client';
import { useStore } from './store-provider';
import Link from 'next/link';
import type { Brand } from '@/lib/types';
import { Arrow, Spark } from './artwork';
export function Footer({ brand }: { brand: Brand }) {
  const { pilot } = useStore();
  return <footer className="site-footer"><div className="footer-top"><div><Link className="wordmark" href="/">{brand.wordmark}</Link><p>{brand.tagline}</p></div><div className="footer-links"><div><span className="eyebrow">COME ON IN</span><Link href="/#shop">Shop the collection</Link><Link href="/about">Our story</Link><Link href="/#collections">Collections</Link></div><div><span className="eyebrow">THE USEFUL STUFF</span><Link href="/pages/shipping">Shipping & returns</Link><Link href="/pages/contact">Get in touch</Link><Link href="/pages/privacy">Privacy</Link><Link href="/pages/terms">Terms</Link></div></div><Link className="back-top" href="#top" aria-label="Back to top"><Arrow diagonal /></Link></div><div className="footer-signoff"><span>{brand.tagline}</span><Spark /></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {brand.name}</span><span>{pilot.mode === 'live' ? 'Small drop. Secure checkout with Stripe.' : pilot.mode === 'test' ? 'Test checkout. No real payments or shipments.' : pilot.copy ? 'Orders paused. Existing orders still supported.' : 'Design preview. No live orders.'}</span><Link href="/pages/accessibility">Accessibility</Link></div></footer>;
}
