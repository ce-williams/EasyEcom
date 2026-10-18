import Link from 'next/link';
import type { Brand } from '@/lib/types';
import { Arrow, Spark, Sticker } from './artwork';
import { Catalog } from './catalog';

export function Hero({ brand }: { brand: Brand }) {
  return <section className="hero"><div className="hero-inner"><div className="hero-copy"><p className="eyebrow">{brand.hero.eyebrow}<span className="tiny-spark">✳</span></p><h1>{brand.hero.lines.map(line => <span key={line}>{line}</span>)}</h1><div className="hero-under"><p>{brand.hero.description}</p><Link className="hero-link" href="#shop">{brand.hero.cta}<Arrow /></Link></div></div><div className="hero-art" aria-label="Featured concept artwork">{brand.hero.products.map((id, i) => { const p = brand.products.find(p => p.id === id)!; return <div className={`hero-sticker hero-sticker-${i}`} key={id}><Sticker artwork={p.artwork} name={p.name} /></div>; })}<span className="hero-art-note">{brand.hero.note}</span><Spark className="hero-spark" /></div></div></section>;
}

export function Collections({ brand }: { brand: Brand }) {
  return <section className="collections section-wrap" id="collections" aria-labelledby="collections-title"><div className="section-heading"><div><p className="eyebrow">{brand.collectionCopy.eyebrow}</p><h2 id="collections-title">{brand.collectionCopy.title}</h2></div><span className="eyebrow">{brand.collectionCopy.note}</span></div><div className="collection-grid">{brand.collections.map(c => { const p = brand.products.find(p => p.collection === c.slug)!; return <Link className="collection-tile" key={c.slug} href={`/collections/${c.slug}`} style={{ background: c.color }}><div className="collection-tile-top"><span className="eyebrow">{c.eyebrow}</span><Arrow diagonal /></div><div className="collection-art"><Sticker artwork={p.artwork} name={p.name} /></div><h3>{c.name}</h3><p>{c.description}</p></Link>; })}</div></section>;
}

export function Story({ brand }: { brand: Brand }) {
  return <section className="story section-wrap"><div className="story-poster" aria-hidden="true"><span className="poster-small">{brand.hero.note}</span><span className="poster-big">{brand.tagline}</span><Spark /><span className="poster-wordmark">{brand.wordmark}</span></div><div className="story-copy"><p className="eyebrow">{brand.story.eyebrow}</p><h2>{brand.story.title.split('\n').map(line => <span key={line}>{line}</span>)}</h2><p>{brand.story.description}</p><Link className="inline-link" href="/about">A little about us<Arrow /></Link><span className="story-footnote">{brand.story.footnote}</span></div></section>;
}

export function Home({ brand }: { brand: Brand }) { return <><Hero brand={brand} /><Catalog products={brand.products} /><Collections brand={brand} /><Story brand={brand} /></>; }
