'use client';
import { useState } from 'react';
import { useStore } from './store-provider';
import { ProductCard } from './product-card';
import type { Product } from '@/lib/types';

export function Catalog({ products, initialCollection = 'all', compact = false }: { products: Product[]; initialCollection?: string; compact?: boolean }) {
  const { brand, track, pilot } = useStore();
  const [collection, setCollection] = useState(initialCollection);
  const visible = collection === 'all' ? products : products.filter(p => p.collection === collection);
  return <section id="shop" className={`catalog section-wrap ${compact ? 'compact-catalog' : ''}`} aria-labelledby="shop-title">
    <div className="section-heading"><div><p className="eyebrow">{brand.catalog.eyebrow}</p><h2 id="shop-title">{compact ? 'Find your next favorite.' : brand.catalog.title}</h2></div><p className="catalog-description">{brand.catalog.description}</p></div>
    <div className="catalog-toolbar"><div className="collection-tabs" role="group" aria-label="Filter products by collection"><button aria-pressed={collection === 'all'} onClick={() => { setCollection('all'); track(); }}>All designs <span>{products.length.toString().padStart(2, '0')}</span></button>{brand.collections.filter(c => products.some(p => p.collection === c.slug)).map(c => <button key={c.slug} aria-pressed={collection === c.slug} onClick={() => { setCollection(c.slug); track(); }}>{c.eyebrow.toLowerCase()}</button>)}</div><span className="catalog-count" role="status">{visible.length} designs, plenty of personality.</span></div>
    {visible.length ? <div className="product-grid">{visible.map((product, index) => <ProductCard product={product} key={product.id} index={index} />)}</div> : <div className="empty-results"><h3>Nothing in this corner yet.</h3><button className="text-button" onClick={() => setCollection('all')}>See all designs</button></div>}
    <p className="catalog-footnote">{pilot.mode === 'live' ? 'Small goods. High spirits. Find your favorites in this drop.' : pilot.mode === 'test' ? 'Test checkout. No real payments or shipments.' : pilot.copy ? 'This drop is paused. Get in touch for help with existing orders.' : 'Concept artwork & illustrative prices. Your bag is a design preview.'}</p>
  </section>;
}
