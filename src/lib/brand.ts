import { apres } from '../brands/apres';
import { desk } from '../brands/desk';
import type { Brand } from './types';

export function validateBrand(brand: Brand): Brand {
  if (!brand.id || !brand.name || !brand.products.length) throw new Error('A brand needs an identity and catalog.');
  const ids = new Set<string>();
  const variants = new Set<string>();
  for (const product of brand.products) {
    if (ids.has(product.id)) throw new Error(`Duplicate product ${product.id}`);
    ids.add(product.id);
    if (!brand.collections.some(c => c.slug === product.collection)) throw new Error('Unknown collection.');
    if (!product.variants.length) throw new Error('Products need variants.');
    if (product.variants.length > 3) throw new Error('Use at most three visible options to preserve the interaction budget.');
    for (const variant of product.variants) {
      if (variants.has(variant.id) || !Number.isSafeInteger(variant.price) || variant.price < 0) throw new Error('Invalid variant.');
      variants.add(variant.id);
    }
  }
  for (const id of brand.hero.products) if (!ids.has(id)) throw new Error('Hero product does not exist.');
  return brand;
}

export function getBrand(id = process.env.NEXT_PUBLIC_STORE_BRAND ?? 'apres'): Brand {
  if (id !== 'apres' && id !== 'desk') throw new Error(`Unknown store brand: ${id}`);
  return validateBrand(id === 'desk' ? desk : apres);
}

export function money(amount: number, brand: Pick<Brand, 'currency' | 'locale'>): string {
  return new Intl.NumberFormat(brand.locale, { style: 'currency', currency: brand.currency, maximumFractionDigits: amount % 100 ? 2 : 0 }).format(amount / 100);
}
