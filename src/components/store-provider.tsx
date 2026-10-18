'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Brand, CartLine, Product } from '@/lib/types';
import type { PilotStatus } from '@/lib/pilot';
import { addLine, cartItems, hydrateCart, setQuantity, subtotal } from '@/lib/cart';
import { money } from '@/lib/brand';
import { Arrow, Sticker } from './artwork';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type Context = {
  brand: Brand; lines: CartLine[]; count: number; ready: boolean; interactions: number;
  pilot: PilotStatus; checkoutPending: boolean; checkoutError: string;
  canPurchase: (variantId: string) => boolean;
  add: (product: Product, variantId: string) => Promise<void>;
  update: (variantId: string, quantity: number) => void;
  openBag: () => void; beginCheckout: () => void; track: () => void; announce: (message: string) => void;
};
const StoreContext = createContext<Context | null>(null);
export function useStore() { const value = useContext(StoreContext); if (!value) throw new Error('Store provider missing'); return value; }

export function StoreProvider({ brand, initialPilot, children }: { brand: Brand; initialPilot: PilotStatus; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [interactions, setInteractions] = useState(0);
  const [pilot, setPilot] = useState<PilotStatus>(initialPilot);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const checkoutLock = useRef(false);
  const attempt = useRef<{ bag: string; id: string } | null>(null);
  const countRef = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const storageKey = `easyecom:${brand.id}:demo-bag:v1`;
  useEffect(() => {
    let active = true;
    fetch('/api/pilot', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Checkout status unavailable');
      const status = await response.json() as PilotStatus;
      if (active) setPilot(status);
    }).catch(() => { if (active) setPilot({ mode: 'paused', variantIds: [] }); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    try { setLines(hydrateCart(JSON.parse(localStorage.getItem(storageKey) ?? '[]'), brand.products)); } catch { setLines([]); }
    setReady(true);
  }, [storageKey, brand.products]);
  useEffect(() => { if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(lines)); } catch { /* A usable session bag remains available when storage is restricted. */ } } }, [ready, lines, storageKey]);
  useEffect(() => { const sync = (e: StorageEvent) => { if (e.key === storageKey) { try { setLines(hydrateCart(JSON.parse(e.newValue ?? '[]'), brand.products)); } catch { setLines([]); } } }; window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, [storageKey, brand.products]);
  useEffect(() => { if (dialog.current?.open) dialog.current.close(); }, [pathname]);
  useEffect(() => () => { document.body.style.overflow = ''; }, []);
  const track = useCallback(() => { countRef.current += 1; setInteractions(countRef.current); }, []);
  const open = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.current?.open) { dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }
  };
  const openBag = () => { track(); open(); };
  const canPurchase = (variantId: string) => pilot.mode === 'preview' || ((pilot.mode === 'test' || pilot.mode === 'live') && pilot.variantIds.includes(variantId));
  const add = async (product: Product, variantId: string) => {
    track();
    if (!ready) throw new Error('Your bag is getting ready. Please try again.');
    if (!canPurchase(variantId)) throw new Error('This option is not available in the current drop.');
    // Local bag selections are revalidated against Stripe on the server at checkout.
    const next = addLine(lines, product, variantId);
    setLines(next); setMessage(`${product.name} added to your bag.`); open();
  };
  const update = (variantId: string, quantity: number) => {
    setCheckoutError('');
    try { setLines(prev => setQuantity(prev, variantId, quantity)); setMessage(quantity ? 'Bag updated.' : 'Item removed.'); } catch (error) { setMessage((error as Error).message); }
  };
  const beginCheckout = async () => {
    if (!lines.length || checkoutLock.current) return;
    track(); setCheckoutError('');
    if (pilot.mode === 'preview') { dialog.current?.close(); router.push('/checkout'); return; }
    if (pilot.mode === 'paused') { setCheckoutError('Checkout is currently unavailable. Your bag is saved.'); return; }
    checkoutLock.current = true; setCheckoutPending(true);
    try {
      const bag = JSON.stringify(lines);
      if (attempt.current?.bag !== bag) attempt.current = { bag, id: crypto.randomUUID() };
      const response = await fetch('/api/pilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines, attemptId: attempt.current.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Checkout could not open. Please try again.');
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Secure checkout could not open.');
      window.location.assign(url.href);
    } catch (error) { setCheckoutError(error instanceof Error ? error.message : 'Checkout could not open. Your bag is saved.'); }
    finally { checkoutLock.current = false; setCheckoutPending(false); }
  };
  const items = cartItems(lines, brand.products);
  const count = items.reduce((sum, line) => sum + line.quantity, 0);
  const value = { brand, lines, count, ready, interactions, pilot, canPurchase, checkoutPending, checkoutError, add, update, openBag, beginCheckout, track, announce: setMessage };
  return <StoreContext.Provider value={value}>
    {children}
    <p className="sr-only" role="status" aria-live="polite">{message}</p>
    <dialog className="bag-dialog" ref={dialog} aria-labelledby="bag-title" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onClose={() => { document.body.style.overflow = ''; opener.current?.focus(); }}>
      <div className="bag-panel">
        <div className="bag-head"><div><p className="eyebrow">GOOD CHOICES, BY THE WAY.</p><h2 id="bag-title">Your bag <span>({count})</span></h2></div><button className="close-button" aria-label="Close bag" onClick={() => dialog.current?.close()} autoFocus>×</button></div>
        {items.length ? <>
          <div className="bag-items">{items.map(line => <div className="bag-line" key={line.variantId}>
            <div className="bag-art" style={{ background: line.product.background }}><Sticker artwork={line.product.artwork} name={line.product.name} /></div>
            <div className="bag-line-copy"><Link href={`/products/${line.product.slug}`}>{line.product.name}</Link><p>{line.variant.label}</p><strong>{money(line.variant.price * line.quantity, brand)}</strong><div className="line-actions"><div className="quantity"><button aria-label={`Decrease quantity of ${line.product.name}`} onClick={() => update(line.variantId, line.quantity - 1)}>−</button><span aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span><button aria-label={`Increase quantity of ${line.product.name}`} disabled={line.quantity >= 20} onClick={() => update(line.variantId, line.quantity + 1)}>+</button></div><button className="remove" onClick={() => update(line.variantId, 0)} aria-label={`Remove ${line.product.name}`}>Remove</button></div></div>
          </div>)}</div>
          <div className="bag-bottom"><div className="subtotal"><span>Subtotal</span><strong>{money(subtotal(items), brand)}</strong></div><p className="fine-print">Shipping and taxes calculated at checkout.</p><button className="button primary checkout-button" disabled={checkoutPending || pilot.mode === 'paused'} onClick={beginCheckout}>{checkoutPending ? 'Opening secure checkout…' : pilot.mode === 'paused' ? 'Checkout unavailable' : 'Checkout'} <Arrow /></button>{checkoutError && <p className="field-error" role="alert">{checkoutError}</p>}<button className="continue-shopping" onClick={() => dialog.current?.close()}>A little more browsing</button><p className="demo-note">{pilot.mode === 'preview' ? 'Design preview · no payment will be taken.' : pilot.mode === 'test' ? 'Test checkout · no real payment or shipment.' : pilot.mode === 'live' ? 'Secure payment with Stripe. Orders reviewed before production.' : 'Checkout paused. Your selections are saved.'}</p></div>
        </> : <div className="empty-bag"><span className="empty-mark">:)</span><h3>A little empty.<br />A lot of potential.</h3><p>Your next favorite is waiting in the shop.</p><button className="button primary" onClick={() => { dialog.current?.close(); router.push('/#shop'); }}>Find your favorite <Arrow /></button></div>}
      </div>
    </dialog>
  </StoreContext.Provider>;
}
