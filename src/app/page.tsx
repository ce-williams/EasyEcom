import { getBrand } from '@/lib/brand';
import { Home } from '@/components/home';
export default function Page() { return <Home brand={getBrand()} />; }
