import { getBrand } from '@/lib/brand';
import { Catalog } from '@/components/catalog';
export const metadata = { title: 'Shop all' };
export default function Page() { return <Catalog products={getBrand().products} />; }
