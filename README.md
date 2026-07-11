# Telegram Shop Lite TMA

Коммерческое frontend-демо Telegram Mini App магазина на React + Vite + TypeScript.

Первый экран — рабочая specialty-витрина Kamenka: каталог, варианты товара, корзина, доставка, демо-оплата, отслеживание заказа и merchant operations.

## Что готово

- Mobile-first shell с safe area, keyboard focus, skip-link, aria-live и reduced motion.
- Редакционный каталог specialty coffee: поиск, категории, сортировка, варианты и остатки.
- Доступный product dialog: вариант влияет на цену и попадает в snapshot корзины и заказа.
- Избранное, корзина, товары, checkout и заказы сохраняются в `localStorage`.
- Прозрачные правила: минимум заказа, порог бесплатной доставки, самовывоз и интервалы курьера.
- Одноэкранный checkout с inline validation, autofill и видимым итогом.
- Честная демо-оплата без запросов к банку, списания и обработки реквизитов карты.
- Activity timeline и отмена заказа до начала сборки.
- Merchant operations: очередь, статусы, журнал изменений и остатки.
- Loading, empty и тестируемое error/retry состояние (`?catalog=error`).

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

Полная проверка:

```bash
npm run check
```

Линт:

```bash
npm run lint
```

## Demo Flow

1. Открой товар, выбери вариант и добавь его в корзину.
2. Добери минимальную сумму, выбери доставку или самовывоз.
3. Введи контактные данные и выбери интервал.
4. Подтверди явно маркированную демо-оплату и создай заказ.
5. Проверь variant snapshot и activity timeline в истории.
6. Отмени заказ до сборки или измени его статус на экране `Магазин`.

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

- Это frontend-демо: backend заменён локальным состоянием в `localStorage`.
- Демо не валидирует Telegram `initData`, не резервирует остатки между пользователями и не проводит платежи.
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
  lib/shop.ts        # цены, доставка, validation и нормализация корзины
  styles.css         # mobile-first UI
```
