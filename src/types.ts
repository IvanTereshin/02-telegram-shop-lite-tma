export type CategoryId = 'all' | 'coffee' | 'brew' | 'home' | 'paper' | 'sets';
export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'demo-card' | 'demo-sbp';
export type SortMode = 'featured' | 'priceAsc' | 'priceDesc' | 'stock';
export type OrderStatus = 'new' | 'paid' | 'packing' | 'courier' | 'pickupReady' | 'done' | 'cancelled';

export interface Category {
  id: Exclude<CategoryId, 'all'>;
  title: string;
  shortTitle: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  note: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  title: string;
  categoryId: Exclude<CategoryId, 'all'>;
  price: number;
  stock: number;
  image: string;
  short: string;
  description: string;
  tags: string[];
  origin: string;
  featured: number;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CheckoutForm {
  deliveryType: DeliveryType;
  deliveryWindowId: string;
  paymentMethod: PaymentMethod;
  name: string;
  phone: string;
  address: string;
  comment: string;
}

export interface AppSettings {
  defaultPaymentMethod: PaymentMethod;
  telegramUpdates: boolean;
  merchantLabel: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  variantId: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderActivity {
  id: string;
  createdAt: string;
  status: OrderStatus;
  title: string;
  note: string;
  source: 'customer' | 'merchant' | 'demo';
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'demo-paid' | 'cancelled';
  deliveryType: DeliveryType;
  deliveryWindow: string;
  contactName: string;
  phone: string;
  address: string;
  comment: string;
  items: OrderItem[];
  activity: OrderActivity[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}
