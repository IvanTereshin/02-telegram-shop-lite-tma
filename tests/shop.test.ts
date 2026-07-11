import assert from 'node:assert/strict';
import test from 'node:test';
import { demoProducts } from '../src/data/catalog.ts';
import {
  FREE_DELIVERY_MINIMUM,
  cartKey,
  getDeliveryFee,
  getUnitPrice,
  normalizeCart,
  validateCheckout,
} from '../src/lib/shop.ts';

test('variant is part of the cart identity and price snapshot', () => {
  const coffee = demoProducts.find((product) => product.id === 'ethiopia-guji');
  assert.ok(coffee);
  assert.notEqual(cartKey(coffee.id, 'beans-250'), cartKey(coffee.id, 'beans-1000'));
  assert.equal(getUnitPrice(coffee, 'beans-1000'), coffee.price + 2160);
});

test('cart normalization rejects missing products and caps stock', () => {
  const [product] = demoProducts;
  const normalized = normalizeCart([
    { productId: product.id, variantId: 'missing', quantity: 99 },
    { productId: 'missing', variantId: 'none', quantity: 1 },
  ], demoProducts);
  assert.deepEqual(normalized, [{
    productId: product.id,
    variantId: product.variants[0].id,
    quantity: product.stock,
  }]);
});

test('delivery fee and checkout validation preserve commercial rules', () => {
  assert.equal(getDeliveryFee('pickup', 0), 0);
  assert.equal(getDeliveryFee('delivery', FREE_DELIVERY_MINIMUM - 1), 290);
  assert.equal(getDeliveryFee('delivery', FREE_DELIVERY_MINIMUM), 0);

  const errors = validateCheckout({
    deliveryType: 'delivery',
    deliveryWindowId: '',
    paymentMethod: 'demo-sbp',
    name: 'И',
    phone: '123',
    address: 'дом',
    comment: '',
  });
  assert.deepEqual(Object.keys(errors).sort(), ['address', 'deliveryWindowId', 'name', 'phone']);
});
