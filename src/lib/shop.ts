import type { CartItem, CheckoutForm, Product } from '../types';

export const FREE_DELIVERY_MINIMUM = 2500;
export const ORDER_MINIMUM = 1200;

export function cartKey(productId: string, variantId: string) {
  return `${productId}::${variantId}`;
}

export function getVariant(product: Product, variantId: string) {
  return product.variants.find((variant) => variant.id === variantId) ?? product.variants[0];
}

export function getUnitPrice(product: Product, variantId: string) {
  return product.price + getVariant(product, variantId).priceDelta;
}

export function getDeliveryFee(deliveryType: CheckoutForm['deliveryType'], subtotalAfterDiscount: number) {
  if (deliveryType === 'pickup' || subtotalAfterDiscount >= FREE_DELIVERY_MINIMUM) return 0;
  return 290;
}

export function validateCheckout(form: CheckoutForm) {
  const errors: Partial<Record<'name' | 'phone' | 'address' | 'deliveryWindowId', string>> = {};
  if (form.name.trim().length < 2) errors.name = 'Укажите имя — минимум 2 символа.';
  if (!/^\+?[\d\s()-]{10,}$/.test(form.phone.trim())) errors.phone = 'Введите телефон с кодом города или страны.';
  if (form.deliveryType === 'delivery' && form.address.trim().length < 8) errors.address = 'Укажите улицу, дом и квартиру или офис.';
  if (form.deliveryType === 'delivery' && !form.deliveryWindowId) errors.deliveryWindowId = 'Выберите интервал доставки.';
  return errors;
}

export function normalizeCart(items: CartItem[], products: Product[]) {
  return items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product || product.stock < 1) return [];
    const variantId = product.variants.some((variant) => variant.id === item.variantId)
      ? item.variantId
      : product.variants[0].id;
    return [{ ...item, variantId, quantity: Math.min(Math.max(1, item.quantity), product.stock) }];
  });
}
