import type { OrderStatus } from '../types';

export const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return currency.format(value).replace('RUB', '₽');
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export const statusMeta: Record<OrderStatus, { title: string; tone: string; botText: string }> = {
  new: {
    title: 'Новый',
    tone: 'blue',
    botText: 'Бот подтвердит заказ после проверки контактов.',
  },
  paid: {
    title: 'Оплачен',
    tone: 'green',
    botText: 'Оплата прошла. Бот отправит чек и номер заказа.',
  },
  packing: {
    title: 'Собирается',
    tone: 'amber',
    botText: 'Команда собирает заказ и проверяет наличие.',
  },
  courier: {
    title: 'В доставке',
    tone: 'violet',
    botText: 'Курьер получил заказ. Статус придет в Telegram.',
  },
  pickupReady: {
    title: 'Готов к выдаче',
    tone: 'teal',
    botText: 'Можно забрать заказ в пункте самовывоза.',
  },
  done: {
    title: 'Завершен',
    tone: 'gray',
    botText: 'Заказ закрыт. Можно повторить покупку из истории.',
  },
  cancelled: {
    title: 'Отменён',
    tone: 'red',
    botText: 'Заказ отменён до начала сборки.',
  },
};
