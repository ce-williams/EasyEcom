import { getBrand } from '@/lib/brand';
import { Story, Collections } from '@/components/home';
export const metadata = { title: 'Our story' };
export default function Page() { const brand = getBrand(); return <><section className="about-intro section-wrap"><p className="eyebrow">WELCOME TO {brand.name.toUpperCase()}</p><h1>{brand.tagline}</h1><p>{brand.hero.description}</p></section><Story brand={brand} /><Collections brand={brand} /></>; }
