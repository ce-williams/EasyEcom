import assert from 'node:assert/strict';
import test from 'node:test';
import { getBrand, validateBrand, money } from '../src/lib/brand';
import { addLine, cartItems, hydrateCart, setQuantity, subtotal } from '../src/lib/cart';

test('both brands validate and have independent catalog/identity boundaries', () => {
  const apres = getBrand('apres'); const desk = getBrand('desk');
  assert.equal(apres.products.length, 12);
  assert.equal(desk.products.length, 3);
  assert.notEqual(apres.theme.cardShape, desk.theme.cardShape);
  assert.equal(desk.products.some(p => /colorado|ski|decal/i.test(p.name)), false);
  assert.throws(() => getBrand('unknown'));
  assert.throws(() => validateBrand({ ...apres, products: [...apres.products, apres.products[0]] }));
});

test('all launch products and variants fit direct inline purchase selection', () => {
  const brand = getBrand();
  const purchasable = brand.products.flatMap(p => p.variants.filter(v => v.available));
  assert.equal(purchasable.length, 14);
  for (const product of brand.products) {
    assert.ok(product.variants.length <= 3);
    for (const variant of product.variants) {
      assert.equal(addLine([], product, variant.id)[0].variantId, variant.id);
    }
  }
});

test('tampered saved cart cannot supply prices, invalid IDs, fractions or excessive quantities', () => {
  const brand = getBrand(); const product = brand.products[0]; const variant = product.variants[0];
  const lines = hydrateCart([{ productId: product.id, variantId: variant.id, quantity: 99, price: 1 }, { productId: 'unknown', variantId: variant.id, quantity: 2 }, { productId: product.id, variantId: 'bogus', quantity: 2 }, { productId: product.id, variantId: variant.id, quantity: .5 }], brand.products);
  assert.equal(lines.length, 1); assert.equal(lines[0].quantity, 20);
  assert.equal(subtotal(cartItems(lines, brand.products)), 10000);
  assert.deepEqual(hydrateCart({ bad: true }, brand.products), []);
});

test('variant lines remain separate, quantities merge and removal changes exact subtotal', () => {
  const brand = getBrand(); const product = brand.products[1];
  let lines = addLine([], product, product.variants[0].id);
  lines = addLine(lines, product, product.variants[1].id);
  lines = addLine(lines, product, product.variants[0].id);
  assert.equal(lines.length, 2);
  assert.equal(subtotal(cartItems(lines, brand.products)), 1550);
  lines = setQuantity(lines, product.variants[0].id, 0);
  assert.equal(subtotal(cartItems(lines, brand.products)), 550);
  assert.throws(() => setQuantity(lines, product.variants[1].id, 21));
  assert.throws(() => setQuantity(lines, product.variants[1].id, -1));
});

test('unavailable variants and excessive add operations are rejected', () => {
  const product = getBrand().products[0]; const id = product.variants[0].id;
  assert.throws(() => addLine([], { ...product, variants: [{ ...product.variants[0], available: false }] }, id));
  assert.throws(() => addLine([{ productId: product.id, variantId: id, quantity: 20 }], product, id));
});

test('currency formatting preserves variant cents', () => {
  assert.equal(money(500, getBrand()), '$5');
  assert.equal(money(550, getBrand()), '$5.50');
});
