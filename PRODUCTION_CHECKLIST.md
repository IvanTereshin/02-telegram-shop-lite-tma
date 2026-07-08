# Production checklist

## Payment architecture

- Keep `TELEGRAM_BOT_TOKEN`, `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY` only on the backend.
- Mini App should request a payment session from the backend and receive only an invoice link or `confirmation_url`.
- Telegram Stars flow: use `XTR` for digital goods, gifts, subscriptions or certificates sold inside Telegram.
- YooKassa flow: create the payment on the backend, redirect the customer to confirmation, then update the order from webhook.
- SBP flow: create a YooKassa payment with method type `sbp`; the customer confirms it in a bank app.

## Required backend endpoints

- `POST /api/payments/telegram-stars/invoice`
- `POST /api/payments/yookassa/checkout`
- `POST /api/payments/yookassa/sbp`
- `POST /api/payments/webhook/yookassa`
- `POST /api/telegram/pre-checkout`

## Launch checks

- Validate Telegram init data on every backend request.
- Use idempotency keys for YooKassa payment creation.
- Store `paymentStatus`, provider id and order status separately.
- Send fiscal receipt only after confirmed paid webhook.
- Test mobile widths: 320, 360, 390 and 430 px.

## References

- Telegram Stars payments: https://core.telegram.org/bots/payments-stars
- Telegram Mini Apps: https://core.telegram.org/bots/webapps
- YooKassa API: https://yookassa.ru/developers/api
- YooKassa SBP: https://yookassa.ru/developers/payment-acceptance/integration-scenarios/manual-integration/other/sbp
