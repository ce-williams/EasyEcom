import { getBrand } from '@/lib/brand';
import { ProductDetail } from '@/components/product-detail';
import { notFound } from 'next/navigation';
export function generateStaticParams() { return getBrand().products.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const product = getBrand().products.find(p => p.slug === slug); return { title: product?.name ?? 'Product not found', description: product?.description }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const product = getBrand().products.find(p => p.slug === slug); if (!product) notFound(); return <ProductDetail product={product} />; }
