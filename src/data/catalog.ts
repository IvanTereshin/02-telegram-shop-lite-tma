import type { Category, Order, Product } from '../types';

export const categories: Category[] = [
  { id: 'coffee', title: 'Кофе', shortTitle: 'Coffee' },
  { id: 'brew', title: 'Заваривание', shortTitle: 'Brew' },
  { id: 'home', title: 'Для дома', shortTitle: 'Home' },
  { id: 'paper', title: 'Бумага', shortTitle: 'Paper' },
  { id: 'sets', title: 'Наборы', shortTitle: 'Sets' },
];

export const deliveryWindows = [
  { id: 'today-evening', label: 'Сегодня · 18:00–21:00', note: 'Курьер по Новокузнецку' },
  { id: 'tomorrow-day', label: 'Завтра · 12:00–16:00', note: 'Можно изменить адрес до сборки' },
  { id: 'tomorrow-evening', label: 'Завтра · 17:00–21:00', note: 'Уведомление перед выездом' },
];

const variants = {
  beans: [
    { id: 'beans-250', label: 'Зёрна · 250 г', note: 'Для домашней кофемолки', priceDelta: 0 },
    { id: 'filter-250', label: 'Помол под фильтр · 250 г', note: 'V60, капельная кофеварка', priceDelta: 0 },
    { id: 'beans-1000', label: 'Зёрна · 1 кг', note: 'Запас на 4–6 недель', priceDelta: 2160 },
  ],
  object: (label: string) => [
    { id: 'standard', label, note: 'Базовая комплектация', priceDelta: 0 },
    { id: 'gift', label: `${label} · в бумаге`, note: 'Ручная упаковка и карточка', priceDelta: 190 },
  ],
};

export const demoProducts: Product[] = [
  {
    id: 'ethiopia-guji', title: 'Эфиопия Гуджи', categoryId: 'coffee', price: 890, stock: 18,
    image: '/assets/product-tea.png', short: 'Персик, бергамот, красный чай.',
    description: 'Светлая обжарка для фильтра. Сладкая и прозрачная чашка без навязчивой кислотности.',
    tags: ['светлая обжарка', 'filter'], origin: 'Гуджи · 2100 м', featured: 100, variants: variants.beans,
  },
  {
    id: 'brazil-serra', title: 'Бразилия Серра Негра', categoryId: 'coffee', price: 760, stock: 24,
    image: '/assets/product-bag.png', short: 'Какао, фундук, жёлтая слива.',
    description: 'Спокойный ежедневный кофе для эспрессо, турки и автоматической кофемашины.',
    tags: ['средняя обжарка', 'espresso'], origin: 'Минас-Жерайс · 1100 м', featured: 96, variants: variants.beans,
  },
  {
    id: 'kenya-kiriga', title: 'Кения Кирига', categoryId: 'coffee', price: 990, stock: 7,
    image: '/assets/product-tea.png', short: 'Чёрная смородина, шиповник, карамель.',
    description: 'Яркий сезонный лот для воронки и аэропресса. Отслеживаемый микролот, небольшая партия.',
    tags: ['микролот', 'limited'], origin: 'Кириньяга · 1750 м', featured: 92, variants: variants.beans,
  },
  {
    id: 'dripper-stone', title: 'Воронка Stone 02', categoryId: 'brew', price: 2190, stock: 9,
    image: '/assets/product-bottle.png', short: 'Фарфор, ровный пролив, 1–4 чашки.',
    description: 'Тяжёлая фарфоровая воронка с устойчивым основанием. Подходит для стандартных фильтров 02.',
    tags: ['фарфор', 'ручная работа'], origin: 'Кузнецкая серия', featured: 88, variants: variants.object('Белый фарфор'),
  },
  {
    id: 'linen-cloth', title: 'Льняная салфетка Field', categoryId: 'home', price: 690, stock: 14,
    image: '/assets/product-candle.png', short: 'Плотный лён для кофейного стола.',
    description: 'Мягкая после первой стирки, быстро сохнет и спокойно стареет. Размер 45 × 45 см.',
    tags: ['100% лён', '45 × 45'], origin: 'Малая серия', featured: 74, variants: variants.object('Серо-зелёная'),
  },
  {
    id: 'brew-notes', title: 'Журнал заваривания №01', categoryId: 'paper', price: 540, stock: 31,
    image: '/assets/product-notebook.png', short: '48 рецептов, сетка и поле для вкуса.',
    description: 'Небольшой рабочий журнал для повторяемых рецептов. Лежит раскрытым и не боится карандаша.',
    tags: ['A6', '96 страниц'], origin: 'Kamenka Press', featured: 82, variants: variants.object('Синяя обложка'),
  },
  {
    id: 'morning-field-set', title: 'Набор Morning Field', categoryId: 'sets', price: 3490, stock: 5,
    image: '/assets/product-kit.png', short: 'Кофе, воронка и журнал в одной коробке.',
    description: 'Готовый старт для ручного заваривания: Бразилия 250 г, Stone 02 и журнал рецептов.',
    tags: ['3 предмета', 'подарок'], origin: 'Собрано в Каменке', featured: 99,
    variants: [
      { id: 'brazil', label: 'С Бразилией', note: 'Какао и фундук', priceDelta: 0 },
      { id: 'ethiopia', label: 'С Эфиопией', note: 'Персик и бергамот', priceDelta: 130 },
    ],
  },
];

export const demoOrders: Order[] = [
  {
    id: 'KM-2048', createdAt: '2026-07-11T08:30:00.000Z', status: 'packing', paymentMethod: 'demo-sbp',
    paymentStatus: 'demo-paid', deliveryType: 'delivery', deliveryWindow: 'Сегодня · 18:00–21:00',
    contactName: 'Иван', phone: '+7 900 120-40-20', address: 'Новокузнецк, ул. Кирова, 55', comment: 'Позвонить за 10 минут.',
    items: [
      { productId: 'morning-field-set', title: 'Набор Morning Field', variantId: 'ethiopia', variantLabel: 'С Эфиопией', unitPrice: 3620, quantity: 1 },
    ],
    activity: [
      { id: 'a1', createdAt: '2026-07-11T08:30:00.000Z', status: 'paid', title: 'Демо-оплата подтверждена', note: 'Платёж симулирован локально.', source: 'demo' },
      { id: 'a2', createdAt: '2026-07-11T08:42:00.000Z', status: 'packing', title: 'Заказ собирается', note: 'Магазин подтвердил наличие.', source: 'merchant' },
    ],
    subtotal: 3620, discount: 0, deliveryFee: 0, total: 3620,
  },
];
