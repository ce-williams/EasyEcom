'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="section-wrap empty-page"><p className="eyebrow">A SMALL DETOUR</p><h1>Let’s try that again.</h1><p>Something interrupted this page. Your saved demo bag stays in this browser.</p><div className="error-actions"><button className="button primary" onClick={reset}>Try again</button><Link className="button" href="/">Back to the shop</Link></div></section>;
}
