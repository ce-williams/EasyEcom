'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BagIcon, Arrow } from './artwork';
import { useStore } from './store-provider';

export function Header() {
  const { brand, count, openBag, track, pilot } = useStore();
  const [menu, setMenu] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => setMenu(false), [pathname]);
  return <>
    <div className="announcement"><span>{brand.announcement}</span><span className="preview-label">{pilot.mode === 'live' ? 'THE FIRST DROP' : pilot.mode === 'test' ? 'TEST CHECKOUT' : pilot.copy ? 'ORDERS PAUSED' : 'DESIGN PREVIEW'}</span></div>
    <header className="site-header"><div className="header-inner"><Link className="wordmark" href="/" aria-label={`${brand.name} home`}>{brand.wordmark}</Link><nav aria-label="Main navigation" className="desktop-nav">{brand.navigation.map(link => <Link href={link.href} key={link.href} onClick={track}>{link.label}</Link>)}</nav><div className="header-actions"><button className="menu-trigger" ref={trigger} aria-expanded={menu} aria-controls="mobile-navigation" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => { setMenu(!menu); track(); }}>{menu ? 'Close' : 'Menu'}</button><button className="bag-trigger" onClick={openBag} aria-label={`Open bag, ${count} items`}><BagIcon /><span className="bag-label">Bag</span><span className="bag-count">{count}</span></button></div></div></header>
    <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" hidden={!menu} onKeyDown={e => { if (e.key === 'Escape') { setMenu(false); trigger.current?.focus(); } }}>{brand.navigation.map(link => <Link href={link.href} key={link.href} onClick={() => { setMenu(false); track(); }}>{link.label}<Arrow /></Link>)}</nav>
  </>;
}
