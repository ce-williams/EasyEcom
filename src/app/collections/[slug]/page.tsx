import { getBrand } from '@/lib/brand';
import { Catalog } from '@/components/catalog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
export function generateStaticParams() { return getBrand().collections.map(c => ({ slug: c.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: getBrand().collections.find(c => c.slug === slug)?.name ?? 'Collection not found' }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const brand = getBrand(); const collection = brand.collections.find(c => c.slug === slug); if (!collection) notFound(); return <><section className="collection-intro" style={{ background: collection.color }}><div className="section-wrap"><Link className="inline-link" href="/#shop">← All designs</Link><p className="eyebrow">{collection.eyebrow}</p><h1>{collection.name}</h1><p>{collection.description}</p></div></section><Catalog products={brand.products.filter(p => p.collection === slug)} compact /></>; }
