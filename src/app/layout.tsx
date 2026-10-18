import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { getBrand } from '@/lib/brand';
import { StoreProvider } from '@/components/store-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { publicPilotStatus } from '@/server/pilot/config';
import './globals.css';

const display = localFont({ src: '../../public/fonts/bricolage.woff2', display: 'swap', variable: '--font-bricolage', weight: '400 800' });
const body = localFont({ src: '../../public/fonts/dm-sans.woff2', display: 'swap', variable: '--font-dm', weight: '400 700' });
const brand = getBrand();
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { default: `${brand.name} — ${brand.tagline}`, template: `%s | ${brand.name}` }, description: brand.hero.description, robots: { index: false, follow: false } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = brand.theme;
  return <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}><body id="top" data-brand={brand.id} data-card-shape={theme.cardShape} style={{ '--paper': theme.paper, '--ink': theme.ink, '--accent': theme.accent, '--hero': theme.hero, '--muted': theme.muted, '--line': theme.line, '--font-display': theme.display === 'DM Sans' ? 'var(--font-dm)' : 'var(--font-bricolage)', '--font-body': 'var(--font-dm)' } as React.CSSProperties}><a href="#main" className="skip-link">Skip to content</a><StoreProvider brand={brand} initialPilot={publicPilotStatus(brand)}><Header /><main id="main">{children}</main><Footer brand={brand} /></StoreProvider></body></html>;
}
