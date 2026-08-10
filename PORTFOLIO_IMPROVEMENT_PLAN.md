# План развития — Telegram Shop Lite TMA

## Фактическое состояние

Сейчас это качественный frontend-demo specialty-витрины Kamenka: каталог, поиск,
сортировка, варианты, избранное, корзина, доставка, inline validation, demo-payment,
order timeline и merchant operations. Variant входит в identity корзины и snapshot
заказа; минимальная сумма, доставка и stock cap покрыты unit-тестами.

Все данные и admin-действия живут в `localStorage`. Нет server reservation,
Telegram auth, платежного webhook, общей картины остатков и защиты merchant view.
Главный пункт текущего портфельного плана — ограниченный drop — ещё не реализован:
нет даты открытия, waitlist, атомарного резерва, per-user limit и перехода sold out.

## Покупатель, задача и коммерческий результат

- Покупатель при развитии: локальный бренд с ограниченными коллекциями или
  specialty-дропами, которому нужен быстрый канал продаж внутри Telegram.
- Задача покупателя: открыть drop, собрать спрос до старта и продать ограниченный
  остаток без oversell и повторного списания.
- Задача клиента: понять условия дропа, занять очередь, купить доступный вариант и
  видеть честный статус заказа.
- Измеримый результат: конверсия waitlist → purchase, доля проданного остатка,
  отсутствие oversell/duplicate checkout и время распродажи дропа.

## Decision gate — flash-sale или merge/archive

До следующей разработки владелец принимает одно из двух решений.

### Вариант A — flash-sale vertical storefront

Оставить Kamenka отдельным репозиторием только при реализации уникального flow:
`анонс → waitlist → открытие → reserve → payment intent → sold out → fulfillment`.
Этот сценарий не должен дублировать основной `tma-shop`: он использует typed API
commerce-движка, но отвечает за campaign/drop experience.

### Вариант B — merge/archive — рекомендуется по умолчанию

Если ограниченный drop не нужен, перенести удачные specialty-art-direction,
variant snapshot, validation и order timeline в `tma-shop`; затем выпустить финальный
Release, добавить migration note и архивировать этот репозиторий с явной ссылкой.

Этот вариант сильнее для портфолио, пока нет подтверждённого покупателя limited-drop:
он убирает дублирование и концентрирует commerce-доказательства в одном флагмане.
Вариант A выбирать только после фиксации конкретного бренда/дропа и метрики пилота.

**Gate пройден**, когда в README одним абзацем объяснено отличие от `tma-shop`,
зафиксированы покупатель и метрика, а acceptance matrix выбранного пути согласована.
Без этого новые экраны, анимации и платежные mock-и не разрабатывать.

## P0 — ограниченный drop end-to-end

- Ввести `Drop`, `DropVariant`, `InventoryReservation`, `WaitlistEntry`, `Cart`,
  `OrderIntent`, `Order`, `CustomerLimit` и typed API-контракт.
- Поддержать состояния `announced`, `waitlist`, `open`, `reserved`, `sold-out`,
  `payment-pending`, `payment-failed`, `paid`, `expired`.
- Создавать короткоживущий резерв атомарно; expiry возвращает остаток в продажу.
- Защитить checkout idempotency key и лимит покупки на Telegram user id.
- Добавить Stars/payment sandbox adapter; до проверенного webhook весь flow явно
  маркировать `SIMULATED`.
- Показывать покупателю order status, а merchant — очередь заказов, резервы,
  истекающие payment intents и waitlist conversion.

### Критерии приёмки P0

- Параллельные запросы на последний товар дают один reserve и один sold-out/conflict.
- Повторный checkout не создаёт второй order intent и не уменьшает stock повторно.
- Неоплаченный резерв истекает и возвращает товар; оплаченный не возвращается.
- Per-user limit действует на backend, а не только блокирует кнопку.
- Waitlist entry уникальна для пользователя и дропа; уведомление не отправляется без
  opt-in и не дублируется.
- Проверены loading, empty, reconnect, sold out, payment pending/failed, повторное
  действие и 360–430 px.

## P1 — рост конверсии и merchant operations

- Referral links и промокоды с атомарными лимитами использования.
- Сегменты waitlist, controlled release waves и opt-in уведомления с frequency cap.
- Webhook-события и синхронизация статусов с основным `tma-shop` backend.
- Merchant export и метрики: waitlist conversion, reserve expiry, payment failure,
  sell-through и источник заказа.

## P2 — тиражирование кампаний

- Шаблоны дропа, branded-настройки, несколько складов и каналы продаж.
- Reconciliation заказов/платежей, audit, monitoring, backup/restore и runbook.

## Дизайн без ИИ-слопа

- Сохранить Kamenka как конкретный specialty-бренд; главный визуальный объект —
  коллекция и дефицит, а не универсальная сетка одинаковых карточек.
- Строить ритм вокруг campaign hero, времени открытия, реального остатка и sold-out
  перехода. Не добавлять purple/blue glow, glassmorphism и «магические» CTA.
- Один акцент, минимум pills и rounded containers; состояние оплаты/резерва важнее
  декоративной анимации.
- Merchant view делать таблицей/очередью с фильтрами, TTL резерва и историей, а не
  набором выдуманных KPI-карточек.
- Проверить клавиатуру, focus, контраст, reduced motion и mobile viewport.

## Open-source референсы

- [Medusa](https://github.com/medusajs/medusa) — изучить cart/order/payment workflows,
  idempotent operations и разделение pending payment от paid. Не переносить весь
  commerce framework в Mini App.
- [Saleor](https://github.com/saleor/saleor) — взять паттерны stock, checkout,
  promotions и payment orchestration. Не копировать enterprise dashboard и GraphQL
  модель целиком.
- [Vendure](https://github.com/vendurehq/vendure) — изучить order state machine,
  stock и role-gated merchant operations. Не воспроизводить plugin platform до P0.

## GitHub и доказательства

- README должен начинаться с отличия от `tma-shop`, покупателя, live demo и одного
  screenshot/GIF полного drop flow.
- Чётко разделить frontend demo, simulated payment и доказанные backend-инварианты.
- Добавить license, `.env.example`, CI `lint + typecheck + unit + integration + build`,
  description, Homepage и topics.
- Для варианта A выпустить Release только после concurrent-reservation test и browser
  QA; для варианта B — финальный Release с migration note и archive notice.
- Не публиковать реальные товары, контакты, токены или платёжные данные в fixtures.
