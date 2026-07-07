# Telegram Shop Lite TMA

Production-ready demo Telegram Mini App магазина на React + Vite + TypeScript.

Первый экран - не лендинг, а рабочий мобильный магазин: каталог, поиск, категории, сортировка, карточки товаров и быстрый переход в корзину.

## Что готово

- Telegram Mini App shell: mobile-first, safe area, поддержка `tg-theme-*` CSS variables.
- Каталог на 12 реалистичных товаров: категории, поиск, сортировка, цены, остатки.
- Детали товара в bottom drawer.
- Корзина: изменение количества, удаление, промокод `TMA10`, доставка и итог.
- Stock validation: нельзя добавить больше, чем есть на складе.
- Checkout: доставка/самовывоз, имя, телефон, адрес, комментарий.
- Success screen после заказа.
- История заказов со статусами и текстом для Telegram-бота.
- Админ-экран: изменение статуса заказа и остатков товаров.
- Local mock API/state через `localStorage`: корзина, заказы, товары и checkout сохраняются после перезагрузки.
- Fallback для изображений: если файлов в `public/assets` нет, UI показывает аккуратную градиентную заглушку без битых картинок.

## Стек

- React 19
- Vite 6
- TypeScript
- ESLint 9
- CSS без тяжелого UI-kit

## Запуск

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Линт:

```bash
npm run lint
```

## Demo Flow

1. Открой каталог.
2. Используй поиск, категорию или сортировку.
3. Открой товар и добавь его в корзину.
4. В корзине измени количество и проверь, что оно не превышает stock.
5. Примени промокод `TMA10`.
6. Перейди в checkout, выбери доставку или самовывоз.
7. Создай заказ.
8. Открой историю заказов.
9. Перейди в `Admin`, поменяй статус заказа и остатки товаров.

## Изображения

Папка подготовлена:

```text
public/assets/
```

Можно добавить или заменить файлы:

- `shop-hero.png`
- `product-tea.png`
- `product-bottle.png`
- `product-notebook.png`
- `product-candle.png`
- `product-bag.png`
- `product-kit.png`

Если файла нет, компонент `ImageFallback` покажет красивую заглушку с аббревиатурой товара.

## Production Notes

- Сейчас backend заменен локальным состоянием в `localStorage`.
- Для production нужно заменить local state на API:
  - `GET /catalog`
  - `GET /cart`
  - `PATCH /cart/items/:id`
  - `POST /orders`
  - `GET /me/orders`
  - `GET /admin/orders`
  - `PATCH /admin/orders/:id/status`
  - `PATCH /admin/products/:id/stock`
- Остатки нужно проверять на backend при создании заказа, а не только на клиенте.
- Цены нужно фиксировать в `order_items`, как сделано в demo snapshot.
- Telegram `initData` нужно валидировать на backend.
- Админ-экран в production должен быть закрыт ролью администратора.

## Telegram Payments Notes

Для реальной оплаты можно подключить:

- Telegram Payments invoice через Bot API.
- Внешний payment provider, если нужен свой checkout.

Рекомендуемый flow:

1. Mini App создает order draft.
2. Backend проверяет stock и фиксирует цены.
3. Backend создает invoice/payment session.
4. Пользователь оплачивает.
5. Webhook меняет статус заказа.
6. Bot отправляет сообщение о статусе: принят, оплачен, собирается, в доставке или готов к выдаче.

## Структура

```text
src/
  App.tsx             # app shell, screens, state actions
  data/catalog.ts    # категории, товары, seed orders
  lib/format.ts      # цена, дата, статусы
  lib/storage.ts     # localStorage helpers
  styles.css         # mobile-first UI
```
