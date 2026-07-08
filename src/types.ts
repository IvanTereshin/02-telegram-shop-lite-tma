export type CategoryId = 'all' | 'drinks' | 'home' | 'stationery' | 'bags' | 'sets';

export type DeliveryType = 'delivery' | 'pickup';

export type PaymentMethod = 'telegram-stars' | 'sbp' | 'yookassa';

export type PaymentMode = 'test' | 'production';

export type PaymentStatus = 'draft' | 'invoice' | 'paid';

export type SortMode = 'popular' | 'priceAsc' | 'priceDesc' | 'stock';

export type OrderStatus = 'new' | 'paid' | 'packing' | 'courier' | 'pickupReady' | 'done';

export interface Category {
  id: Exclude<CategoryId, 'all'>;
  title: string;
  shortTitle: string;
}

export interface Product {
  id: string;
  title: string;
  categoryId: Exclude<CategoryId, 'all'>;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  short: string;
  description: string;
  tags: string[];
  rating: number;
  weight: string;
  popular: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CheckoutForm {
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  name: string;
  phone: string;
  address: string;
  comment: string;
}

export interface AppSettings {
  paymentMode: PaymentMode;
  defaultPaymentMethod: PaymentMethod;
  fiscalReceipts: boolean;
  telegramUpdates: boolean;
  merchantLabel: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProviderId: string;
  deliveryType: DeliveryType;
  contactName: string;
  phone: string;
  address: string;
  comment: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}
