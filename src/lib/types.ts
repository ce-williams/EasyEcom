export type Collection = { slug: string; name: string; eyebrow: string; description: string; color: string };
export type Artwork = {
  shape: 'road' | 'oval' | 'circle' | 'ticket' | 'arch' | 'burst';
  lines: string[]; caption: string; paper: string; ink: string; accent: string;
  motif?: 'spark' | 'lift' | 'tree' | 'sun';
};
export type Variant = { id: string; label: string; price: number; available: boolean };
export type Product = {
  id: string; slug: string; name: string; collection: string; description: string;
  background: string; artwork: Artwork; variants: Variant[]; featured?: boolean; badge?: string;
};
export type Brand = {
  id: string; name: string; wordmark: string; currency: string; locale: string;
  tagline: string; announcement: string;
  theme: { paper: string; ink: string; accent: string; hero: string; muted: string; line: string; display: string; body: string; cardShape: 'arch' | 'square' };
  navigation: { label: string; href: string }[];
  hero: { eyebrow: string; lines: string[]; description: string; cta: string; products: string[]; note: string };
  catalog: { eyebrow: string; title: string; description: string };
  collectionCopy: { eyebrow: string; title: string; note: string };
  story: { eyebrow: string; title: string; description: string; footnote: string };
  collections: Collection[]; products: Product[];
};
export type CartLine = { productId: string; variantId: string; quantity: number };
export type CartItem = CartLine & { product: Product; variant: Variant };
