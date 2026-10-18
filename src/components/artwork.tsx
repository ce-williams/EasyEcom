import { useId } from 'react';
import type { Artwork } from '@/lib/types';

export function Sticker({ artwork: a, name, className = '' }: { artwork: Artwork; name: string; className?: string }) {
  const id = useId();
  const lineSize = a.lines.length > 2 ? 44 : 48;
  const start = a.lines.length > 2 ? 137 : 157;
  const shapes = {
    road: <path d="M72 65 Q200 90 328 65 L328 231 Q328 278 200 313 Q72 278 72 231Z" />,
    oval: <ellipse cx="200" cy="180" rx="166" ry="131" />,
    circle: <circle cx="200" cy="180" r="143" />,
    ticket: <path d="M65 53 H335 V145 Q309 145 309 171 Q309 197 335 197 V307 H65 V197 Q91 197 91 171 Q91 145 65 145Z" />,
    arch: <path d="M64 304 V173 A136 136 0 0 1 336 173 V304Z" />,
    burst: <path d="m200 28 30 24 37-10 21 32 39 5 7 38 32 22-9 37 18 35-25 29-3 39-38 11-20 34-38-6-31 24-31-24-38 6-20-34-38-11-3-39-25-29 18-35-9-37 32-22 7-38 39-5 21-32 37 10Z" />,
  };
  return <svg className={`sticker ${className}`} viewBox="0 0 400 360" role="img" aria-labelledby={id}>
    <title id={id}>{`${name} — concept artwork`}</title>
    <g fill={a.paper} stroke="#FFFCF2" strokeWidth="15" strokeLinejoin="round">{shapes[a.shape]}</g>
    <g fill="none" stroke={a.ink} strokeWidth="1.5" opacity=".55" transform="translate(18 17) scale(.91)">{shapes[a.shape]}</g>
    <g fill={a.ink} textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontWeight="800" letterSpacing="-1.5">
      {a.lines.map((line, i) => <text key={line} x="200" y={a.shape === 'road' && a.lines.includes('I–70') ? (i ? 233 : 146) : start + i * 44} fontSize={line === 'I–70' ? 80 : lineSize} textLength={Math.min(262, line.length * (line === 'I–70' ? 43 : 26))} lengthAdjust="spacingAndGlyphs">{line}</text>)}
    </g>
    <text x="200" y={a.lines.includes('I–70') ? 270 : a.lines.length > 2 ? 263 : 254} fill={a.ink} textAnchor="middle" fontSize="10" fontWeight="600" fontFamily="var(--font-body), sans-serif" letterSpacing="1.1" textLength={Math.min(225, a.caption.length * 6)} lengthAdjust="spacingAndGlyphs">{a.caption}</text>
    {a.motif === 'spark' && <g fill={a.ink}><path d="m200 70 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" /></g>}
    {a.motif === 'tree' && <g fill={a.ink}><path d="m200 64-13 20h7l-15 20h42l-15-20h7Z" /><path d="M197 100h6v10h-6Z" /></g>}
    {a.motif === 'sun' && <g fill="none" stroke={a.ink} strokeWidth="3"><path d="M179 95a21 21 0 0 1 42 0m-50 5h58m-29-34v-9m-26 17-6-7m58 7 6-7" /></g>}
    {a.motif === 'lift' && <g fill="none" stroke={a.ink} strokeWidth="2.5"><path d="m169 78 65-16m-33 9v15h18v18h-36V86h18m-18 18v9m36-9v9" /></g>}
  </svg>;
}

export function Arrow({ diagonal = false, className = '' }: { diagonal?: boolean; className?: string }) {
  return <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function BagIcon() { return <svg width="21" height="23" viewBox="0 0 24 26" fill="none" aria-hidden="true"><path d="M4 8h16l1 16H3L4 8Z" stroke="currentColor" strokeWidth="1.5" /><path d="M8 10V6a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" /></svg>; }

export function Spark({ className = '' }: { className?: string }) { return <svg className={className} width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><path d="m24 0 5 16 15-8-8 16 12 5-17 3 1 16-11-13L8 44l6-17L0 21l17-3Z" fill="currentColor" /></svg>; }
