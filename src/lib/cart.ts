import type { CartItem, CartLine, Product } from './types';
export const MAX_QUANTITY = 20;

export function hydrateCart(value: unknown, products: Product[]): CartLine[] {
  if (!Array.isArray(value)) return [];
  const result: CartLine[] = [];
  for (const raw of value.slice(0, 60)) {
    if (!raw || typeof raw !== 'object') continue;
    const line = raw as CartLine;
    const product = products.find(p => p.id === line.productId);
    const variant = product?.variants.find(v => v.id === line.variantId && v.available);
    if (!variant || !Number.isInteger(line.quantity) || line.quantity < 1) continue;
    const existing = result.find(l => l.variantId === line.variantId);
    if (existing) existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + line.quantity);
    else result.push({ productId: product!.id, variantId: variant.id, quantity: Math.min(MAX_QUANTITY, line.quantity) });
  }
  return result;
}

export function cartItems(lines: CartLine[], products: Product[]): CartItem[] {
  return hydrateCart(lines, products).map(line => {
    const product = products.find(p => p.id === line.productId)!;
    return { ...line, product, variant: product.variants.find(v => v.id === line.variantId)! };
  });
}

export function addLine(lines: CartLine[], product: Product, variantId: string): CartLine[] {
  if (!product.variants.some(v => v.id === variantId && v.available)) throw new Error('That option is unavailable. Please choose another.');
  const existing = lines.find(l => l.variantId === variantId);
  if (existing && existing.quantity >= MAX_QUANTITY) throw new Error(`The demo bag allows up to ${MAX_QUANTITY} of each item.`);
  return existing ? lines.map(l => l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l) : [...lines, { productId: product.id, variantId, quantity: 1 }];
}

export function setQuantity(lines: CartLine[], variantId: string, quantity: number): CartLine[] {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) throw new Error('Invalid quantity.');
  return quantity === 0 ? lines.filter(l => l.variantId !== variantId) : lines.map(l => l.variantId === variantId ? { ...l, quantity } : l);
}

export function subtotal(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + line.variant.price * line.quantity, 0);
}
