'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { money } from '@/lib/brand';
import { useStore } from './store-provider';
import { Sticker } from './artwork';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { brand, add, track, ready, canPurchase } = useStore();
  const [variantId, setVariantId] = useState(product.variants.find(v => v.available)?.id ?? product.variants[0].id);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const variant = product.variants.find(v => v.id === variantId)!;
  const choose = (id: string) => { track(); setVariantId(id); setError(''); };
  return <article className="product-card" data-product-id={product.id}>
    <Link href={`/products/${product.slug}`} className="product-art" style={{ background: product.background, '--art-angle': `${[-8, 6, -5, 7][index % 4]}deg` } as React.CSSProperties} aria-label={`View ${product.name}`} onClick={track}>
      {product.badge && <span className="merch-badge">{product.badge}</span>}<Sticker artwork={product.artwork} name={product.name} /><span className="view-product">A closer look ↗</span>
    </Link>
    <div className="product-meta"><Link href={`/products/${product.slug}`} onClick={track}><h3>{product.name}</h3></Link><span className="product-price">{money(variant.price, brand)}</span></div>
    <div className="product-options">{product.variants.length > 1 ? <div role="group" aria-label={`Finish for ${product.name}`} className="variant-options">{product.variants.map(v => <button key={v.id} aria-pressed={v.id === variantId} disabled={!v.available || pending} onClick={() => choose(v.id)}>{v.label.split(' · ')[0]}{!v.available ? ' · sold out' : ''}</button>)}</div> : <span className="variant-note">{variant.label}</span>}</div>
    <button className="quick-add" disabled={pending || !variant.available || !ready || !canPurchase(variantId)} data-variant-id={variantId} aria-label={`Quick add ${product.name}`} onClick={async () => { if (pending) return; setPending(true); setError(''); try { await add(product, variantId); } catch (e) { setError((e as Error).message); } finally { setPending(false); } }}>{pending ? 'Adding…' : !variant.available ? 'Sold out' : !canPurchase(variantId) ? 'Not available yet' : 'Quick add'}<span aria-hidden="true">{pending ? '…' : '+'}</span></button>
    {error && <p className="field-error" role="alert">{error}</p>}
  </article>;
}
