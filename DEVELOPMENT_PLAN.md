# План разработки: Telegram Shop Lite TMA

## 1. Идея

Небольшой магазин, который открывается прямо в Telegram. Пользователь выбирает товары, добавляет их в корзину, оформляет заказ и получает обновления статуса в чате с ботом.

## 2. MVP

- Главная с подборками товаров.
- Каталог с категориями и поиском.
- Карточка товара.
- Корзина.
- Checkout: имя, телефон, адрес или самовывоз.
- Экран успешного заказа.
- История заказов.
- Админка: товары, остатки, заказы.

## 3. Роли

- Покупатель: смотрит каталог и оформляет заказ.
- Администратор: управляет товарами и заказами.

## 4. Основные экраны

1. Главная: баннер, категории, популярные товары.
2. Каталог: фильтры, сортировка, поиск.
3. Товар: фото, цена, описание, варианты, количество.
4. Корзина: список товаров, промокод, итог.
5. Checkout: доставка, контакт, комментарий.
6. Заказ создан: номер заказа, статус, кнопка "Открыть в боте".
7. Мои заказы: статусы и детали.
8. Админка: список заказов, смена статуса, остатки.

## 5. Данные

- `users`: telegram_id, name, username.
- `categories`: title, sort_order.
- `products`: title, description, price, old_price, category_id, image_url, stock.
- `product_variants`: product_id, title, price_delta, stock.
- `carts`: user_id, status.
- `cart_items`: cart_id, product_id, variant_id, quantity.
- `orders`: user_id, total, status, delivery_type, address, phone.
- `order_items`: order_id, product_id, title_snapshot, price_snapshot, quantity.
- `payments`: order_id, provider, status, amount.

## 6. Backend API

- `GET /catalog`
- `GET /products/:id`
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`
- `POST /orders`
- `GET /me/orders`
- `GET /admin/orders`
- `PATCH /admin/orders/:id/status`
- `POST /admin/products`

## 7. Telegram-интеграция

- Bot menu button: "Магазин".
- Авторизация по `initData`.
- Telegram Payments или интеграция с внешним провайдером.
- Уведомления о статусах: "принят", "собирается", "передан в доставку", "готов к выдаче".
- Inline-кнопка "Повторить заказ".

## 8. Технологии

- Frontend: React, Vite, TypeScript.
- State: TanStack Query + Zustand.
- Backend: Node.js + Fastify/NestJS.
- DB: PostgreSQL.
- Files: S3-compatible storage для изображений.
- Bot: grammY или Telegraf.

## 9. Этапы

### Этап 1. Каркас магазина

- Создать frontend/backend/bot.
- Подключить Telegram init data.
- Сверстать главную, каталог и карточку товара.

### Этап 2. Корзина и заказ

- Реализовать cart API.
- Добавить checkout.
- Создать заказ из корзины.
- Зафиксировать цены в `order_items`.

### Этап 3. Админка

- CRUD товаров.
- Управление остатками.
- Управление статусами заказов.

### Этап 4. Платежи и уведомления

- Добавить тестовый payment flow.
- Отправлять статусные сообщения через бота.
- Добавить повтор заказа.

### Этап 5. Портфолио-полировка

- Сгенерировать товарные фото.
- Добавить пустые состояния.
- Подготовить демо-каталог на 12-20 товаров.
- Сделать скриншоты полного пути покупки.

## 10. Критерии готовности

- Пользователь может оформить заказ из Telegram.
- Корзина сохраняется.
- Остатки уменьшаются после заказа.
- Админ видит заказ и меняет статус.
- Бот отправляет обновления.
