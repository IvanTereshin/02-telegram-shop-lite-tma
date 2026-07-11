import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { categories, deliveryWindows, demoOrders, demoProducts } from './data/catalog';
import { formatDate, formatPrice, statusMeta } from './lib/format';
import { loadState, saveState } from './lib/storage';
import {
  FREE_DELIVERY_MINIMUM,
  ORDER_MINIMUM,
  cartKey,
  getDeliveryFee,
  getUnitPrice,
  getVariant,
  normalizeCart,
  validateCheckout,
} from './lib/shop';
import type {
  AppSettings,
  CartItem,
  CategoryId,
  CheckoutForm,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  SortMode,
} from './types';

type View = 'shop' | 'favorites' | 'cart' | 'checkout' | 'orders' | 'admin';
type CatalogState = 'loading' | 'ready' | 'error';
type CheckoutErrors = ReturnType<typeof validateCheckout>;

const STORAGE = {
  cart: 'kamenka-cart-v3', favorites: 'kamenka-favorites-v1', orders: 'kamenka-orders-v3',
  checkout: 'kamenka-checkout-v2', settings: 'kamenka-settings-v1', products: 'kamenka-products-v1',
};

const defaultCheckout: CheckoutForm = {
  deliveryType: 'delivery', deliveryWindowId: 'today-evening', paymentMethod: 'demo-sbp',
  name: '', phone: '', address: '', comment: '',
};
const defaultSettings: AppSettings = {
  defaultPaymentMethod: 'demo-sbp', telegramUpdates: true, merchantLabel: 'Kamenka · demo store',
};
const statusFlow: OrderStatus[] = ['new', 'paid', 'packing', 'courier', 'pickupReady', 'done'];
const paymentMethods: Array<{ id: PaymentMethod; title: string; note: string }> = [
  { id: 'demo-sbp', title: 'СБП · демо', note: 'Симуляция подтверждения без банка и списания.' },
  { id: 'demo-card', title: 'Карта · демо', note: 'Локальная демонстрация, данные карты не запрашиваются.' },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function App() {
  const shellRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>('shop');
  const [products, setProducts] = useState(() => loadState(STORAGE.products, demoProducts));
  const [cart, setCart] = useState<CartItem[]>(() => normalizeCart(loadState(STORAGE.cart, []), demoProducts));
  const [favorites, setFavorites] = useState<string[]>(() => loadState(STORAGE.favorites, []));
  const [orders, setOrders] = useState<Order[]>(() => loadState(STORAGE.orders, demoOrders));
  const [checkout, setCheckout] = useState<CheckoutForm>(() => loadState(STORAGE.checkout, defaultCheckout));
  const [settings] = useState<AppSettings>(() => loadState(STORAGE.settings, defaultSettings));
  const [category, setCategory] = useState<CategoryId>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('featured');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [catalogState, setCatalogState] = useState<CatalogState>('loading');
  const [announcement, setAnnouncement] = useState('');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const shouldFail = new URLSearchParams(window.location.search).get('catalog') === 'error';
    const timer = window.setTimeout(() => setCatalogState(shouldFail ? 'error' : 'ready'), 520);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => saveState(STORAGE.products, products), [products]);
  useEffect(() => saveState(STORAGE.cart, cart), [cart]);
  useEffect(() => saveState(STORAGE.favorites, favorites), [favorites]);
  useEffect(() => saveState(STORAGE.orders, orders), [orders]);
  useEffect(() => saveState(STORAGE.checkout, checkout), [checkout]);
  useEffect(() => saveState(STORAGE.settings, settings), [settings]);

  useGSAP(() => {
    if (reducedMotion) return;
    gsap.fromTo('.screen > *', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .35, stagger: .025, ease: 'power2.out' });
  }, { dependencies: [view, reducedMotion], scope: shellRef, revertOnUpdate: true });

  const lines = useMemo(() => cart.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return [];
    const variant = getVariant(product, item.variantId);
    return [{ ...item, product, variant, unitPrice: getUnitPrice(product, item.variantId) }];
  }), [cart, products]);
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const discount = subtotal >= 4000 ? Math.round(subtotal * .07) : 0;
  const deliveryFee = getDeliveryFee(checkout.deliveryType, subtotal - discount);
  const total = subtotal - discount + deliveryFee;
  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = category === 'all' || product.categoryId === category;
      const queryMatch = !query || `${product.title} ${product.short} ${product.origin} ${product.tags.join(' ')}`.toLowerCase().includes(query);
      const favoritesMatch = view !== 'favorites' || favorites.includes(product.id);
      return categoryMatch && queryMatch && favoritesMatch;
    }).sort((a, b) => sort === 'priceAsc' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : sort === 'stock' ? b.stock - a.stock : b.featured - a.featured);
  }, [category, favorites, products, search, sort, view]);

  function addToCart(productId: string, variantId: string, quantity = 1) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product || product.stock < 1) return;
    const key = cartKey(productId, variantId);
    setCart((current) => {
      const item = current.find((candidate) => cartKey(candidate.productId, candidate.variantId) === key);
      if (!item) return [...current, { productId, variantId, quantity: Math.min(quantity, product.stock) }];
      return current.map((candidate) => cartKey(candidate.productId, candidate.variantId) === key
        ? { ...candidate, quantity: Math.min(candidate.quantity + quantity, product.stock) } : candidate);
    });
    setAnnouncement(`${product.title}, ${getVariant(product, variantId).label} добавлен в корзину.`);
  }

  function updateCart(productId: string, variantId: string, quantity: number) {
    const key = cartKey(productId, variantId);
    const stock = products.find((product) => product.id === productId)?.stock ?? 0;
    setCart((current) => quantity < 1 ? current.filter((item) => cartKey(item.productId, item.variantId) !== key)
      : current.map((item) => cartKey(item.productId, item.variantId) === key ? { ...item, quantity: Math.min(quantity, stock) } : item));
  }

  function updateOrderStatus(orderId: string, status: OrderStatus, source: 'customer' | 'merchant' = 'merchant') {
    const createdAt = new Date().toISOString();
    setOrders((current) => current.map((order) => order.id !== orderId ? order : {
      ...order,
      status,
      paymentStatus: status === 'cancelled' ? 'cancelled' : order.paymentStatus,
      activity: [...order.activity, {
        id: `${orderId}-${Date.now()}`, createdAt, status, source,
        title: statusMeta[status].title,
        note: source === 'customer' ? 'Заказ отменён покупателем до начала сборки.' : 'Статус изменён на экране магазина.',
      }],
    }));
    setAnnouncement(`Статус заказа ${orderId}: ${statusMeta[status].title}.`);
  }

  return (
    <main className="app-root">
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>
      <section className="phone-shell" aria-label="Демо-магазин Kamenka" ref={shellRef}>
        <header className="topbar">
          <button className="wordmark" type="button" onClick={() => setView('shop')} aria-label="Kamenka — открыть каталог">КАМЕНКА</button>
          <div className="topbar-meta"><span>Полевая лавка</span><strong>Новокузнецк</strong></div>
          <button className="bag-button" type="button" onClick={() => setView('cart')}>Корзина <strong>{cartCount}</strong></button>
        </header>
        <nav className="tabbar" aria-label="Основная навигация">
          <Nav active={view === 'shop'} label="Каталог" onClick={() => setView('shop')} />
          <Nav active={view === 'favorites'} label={`Избранное ${favorites.length || ''}`} onClick={() => setView('favorites')} />
          <Nav active={view === 'orders'} label="Статус заказа" onClick={() => setView('orders')} />
          <Nav active={view === 'admin'} label="Магазин" onClick={() => setView('admin')} />
        </nav>
        <div className="content" id="main-content" tabIndex={-1}>
          {(view === 'shop' || view === 'favorites') && <CatalogView
            state={catalogState} products={filteredProducts} favorites={favorites} category={category} search={search} sort={sort}
            isFavorites={view === 'favorites'} cartCount={cartCount} total={total}
            onRetry={() => { setCatalogState('loading'); window.setTimeout(() => setCatalogState('ready'), 420); }}
            onCategory={setCategory} onSearch={setSearch} onSort={setSort} onOpen={setSelectedProductId}
            onFavorite={(id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
            onAdd={(product) => addToCart(product.id, product.variants[0].id)} onCart={() => setView('cart')} />}
          {view === 'cart' && <CartView lines={lines} subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} total={total}
            deliveryType={checkout.deliveryType} onDelivery={(deliveryType) => setCheckout({ ...checkout, deliveryType })}
            onUpdate={updateCart} onCatalog={() => setView('shop')} onCheckout={() => setView('checkout')} />}
          {view === 'checkout' && <CheckoutView checkout={checkout} subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} total={total}
            lines={lines} orders={orders} onChange={setCheckout} onBack={() => setView('cart')}
            onComplete={(order) => { setOrders([order, ...orders]); setCart([]); setView('orders'); setAnnouncement(`Заказ ${order.id} создан.`); }} />}
          {view === 'orders' && <OrdersView orders={orders} onCancel={(id) => updateOrderStatus(id, 'cancelled', 'customer')} onCatalog={() => setView('shop')} />}
          {view === 'admin' && <AdminView orders={orders} products={products} label={settings.merchantLabel}
            onStatus={updateOrderStatus} onStock={(id, stock) => setProducts((current) => current.map((product) => product.id === id ? { ...product, stock: Math.max(0, stock) } : product))} />}
        </div>
        {selectedProduct && <ProductDialog product={selectedProduct} onClose={() => setSelectedProductId(null)} onAdd={addToCart} />}
        <p className="sr-only" aria-live="polite">{announcement}</p>
      </section>
    </main>
  );
}

function Nav({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button className={active ? 'tab active' : 'tab'} type="button" aria-current={active ? 'page' : undefined} onClick={onClick}>{label}</button>;
}

type CatalogProps = {
  state: CatalogState; products: Product[]; favorites: string[]; category: CategoryId; search: string; sort: SortMode;
  isFavorites: boolean; cartCount: number; total: number; onRetry: () => void; onCategory: (id: CategoryId) => void;
  onSearch: (value: string) => void; onSort: (value: SortMode) => void; onOpen: (id: string) => void;
  onFavorite: (id: string) => void; onAdd: (product: Product) => void; onCart: () => void;
};

function CatalogView(props: CatalogProps) {
  if (props.state === 'loading') return <div className="screen"><SectionTitle index="01" title="Каталог" subtitle="Собираем свежий каталог…" /><div className="catalog-loading" aria-live="polite">Загрузка товаров</div></div>;
  if (props.state === 'error') return <div className="screen"><EmptyState title="Каталог не загрузился" text="Это тестируемое демо-состояние. Данные не потеряны." action="Повторить" onAction={props.onRetry} /></div>;
  return <div className="screen catalog-screen">
    <section className="editorial-intro">
      <p>Field notes · выпуск 07/26</p>
      <h1>{props.isFavorites ? 'Сохранённое для тихого утра.' : 'Кофе и вещи для медленных домашних ритуалов.'}</h1>
      <span>{props.isFavorites ? 'Ваш личный список остаётся на этом устройстве.' : 'Обжариваем небольшими партиями. Доставляем по Новокузнецку или готовим к самовывозу.'}</span>
    </section>
    <section className="service-ledger" aria-label="Условия заказа">
      <div><span>Доставка</span><strong>290 ₽</strong><small>бесплатно от {formatPrice(FREE_DELIVERY_MINIMUM)}</small></div>
      <div><span>Минимум</span><strong>{formatPrice(ORDER_MINIMUM)}</strong><small>для курьера и самовывоза</small></div>
      <div><span>Следующий слот</span><strong>18:00–21:00</strong><small>сегодня</small></div>
    </section>
    <div className="catalog-tools">
      <label className="search-box"><span>Поиск по полевым заметкам</span><input value={props.search} onChange={(e) => props.onSearch(e.target.value)} placeholder="Эфиопия, фарфор, набор" /></label>
      <label className="sort-box"><span>Порядок</span><select value={props.sort} onChange={(e) => props.onSort(e.target.value as SortMode)}><option value="featured">Выбор лавки</option><option value="priceAsc">Цена ↑</option><option value="priceDesc">Цена ↓</option><option value="stock">По наличию</option></select></label>
    </div>
    <div className="category-row" aria-label="Категории"><button className={props.category === 'all' ? 'chip active' : 'chip'} onClick={() => props.onCategory('all')}>Все</button>{categories.map((item) => <button className={props.category === item.id ? 'chip active' : 'chip'} key={item.id} onClick={() => props.onCategory(item.id)}>{item.title}</button>)}</div>
    <section className="product-grid" aria-label="Каталог товаров">{props.products.map((product, index) => <ProductCard key={product.id} product={product} index={index} favorite={props.favorites.includes(product.id)} onFavorite={() => props.onFavorite(product.id)} onOpen={() => props.onOpen(product.id)} onAdd={() => props.onAdd(product)} />)}</section>
    {props.products.length === 0 && <EmptyState title={props.isFavorites ? 'Пока ничего не сохранено' : 'Ничего не найдено'} text={props.isFavorites ? 'Отмечайте товары в каталоге — они появятся здесь.' : 'Измените запрос или выберите другую категорию.'} action={props.isFavorites ? 'Открыть каталог' : undefined} onAction={props.isFavorites ? () => window.location.reload() : undefined} />}
    {props.cartCount > 0 && <button className="floating-cart" onClick={props.onCart}><span>{props.cartCount} поз.</span><strong>Корзина · {formatPrice(props.total)}</strong></button>}
  </div>;
}

function ProductCard({ product, index, favorite, onFavorite, onOpen, onAdd }: { product: Product; index: number; favorite: boolean; onFavorite: () => void; onOpen: () => void; onAdd: () => void }) {
  return <article className={`product-card product-card-${index % 4}`}>
    <button className="product-image-button" onClick={onOpen}><ImageFallback src={product.image} title={product.title} className="product-image" /><span className="catalog-number">{String(index + 1).padStart(2, '0')}</span></button>
    <button className={favorite ? 'favorite-button active' : 'favorite-button'} aria-pressed={favorite} aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'} onClick={onFavorite}>{favorite ? 'Сохранено' : 'Сохранить'}</button>
    <button className="product-info" onClick={onOpen}><span className="product-meta">{product.origin}</span><h2>{product.title}</h2><p>{product.short}</p></button>
    <div className="product-footer"><div><strong>от {formatPrice(product.price)}</strong><span>{product.stock} в наличии</span></div><button className="icon-button" disabled={!product.stock} onClick={onAdd}>{product.stock ? 'В корзину' : 'Нет в наличии'}</button></div>
  </article>;
}

function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (id: string, variantId: string) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null); const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null); const [variantId, setVariantId] = useState(product.variants[0].id);
  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement; closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialogRef.current) {
        const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')];
        if (!controls.length) return; const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey); return () => { document.removeEventListener('keydown', handleKey); returnFocusRef.current?.focus(); };
  }, [onClose]);
  const variant = getVariant(product, variantId);
  return <div className="drawer-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
    <div className="product-drawer" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
      <button className="dialog-close" ref={closeRef} onClick={onClose} aria-label="Закрыть">Закрыть</button>
      <ImageFallback src={product.image} title="" className="detail-image" />
      <div className="detail-header"><div><p>{product.origin}</p><h2 id="product-dialog-title">{product.title}</h2></div><strong>{formatPrice(product.price + variant.priceDelta)}</strong></div>
      <p className="detail-description">{product.description}</p>
      <fieldset className="variant-panel"><legend>Выберите вариант</legend>{product.variants.map((item) => <label className={item.id === variantId ? 'variant-option selected' : 'variant-option'} key={item.id}><input type="radio" name="variant" value={item.id} checked={item.id === variantId} onChange={() => setVariantId(item.id)} /><span><strong>{item.label}</strong><small>{item.note}</small></span><b>{item.priceDelta ? `+ ${formatPrice(item.priceDelta)}` : formatPrice(product.price)}</b></label>)}</fieldset>
      <button className="primary-button" disabled={!product.stock} onClick={() => { onAdd(product.id, variantId); onClose(); }}>Добавить · {formatPrice(product.price + variant.priceDelta)}</button>
    </div>
  </div>;
}

type CartLine = CartItem & { product: Product; variant: Product['variants'][number]; unitPrice: number };
function CartView({ lines, subtotal, discount, deliveryFee, total, deliveryType, onDelivery, onUpdate, onCatalog, onCheckout }: { lines: CartLine[]; subtotal: number; discount: number; deliveryFee: number; total: number; deliveryType: CheckoutForm['deliveryType']; onDelivery: (value: CheckoutForm['deliveryType']) => void; onUpdate: (id: string, variant: string, quantity: number) => void; onCatalog: () => void; onCheckout: () => void }) {
  if (!lines.length) return <div className="screen"><SectionTitle index="02" title="Корзина" subtitle="Здесь появятся выбранные варианты." /><EmptyState title="Корзина пустая" text="Вернитесь в каталог и соберите заказ." action="Открыть каталог" onAction={onCatalog} /></div>;
  const minimumLeft = Math.max(0, ORDER_MINIMUM - subtotal); const freeLeft = Math.max(0, FREE_DELIVERY_MINIMUM - (subtotal - discount));
  return <div className="screen"><SectionTitle index="02" title="Корзина" subtitle="Проверяем вариант, количество и стоимость до оформления." />
    <div className="cart-list">{lines.map((line) => <article className="cart-item" key={cartKey(line.productId, line.variantId)}><ImageFallback src={line.product.image} title="" className="cart-image" /><div><h2>{line.product.title}</h2><p>{line.variant.label} · {formatPrice(line.unitPrice)}</p><div className="stepper"><button onClick={() => onUpdate(line.productId, line.variantId, line.quantity - 1)} aria-label="Уменьшить">−</button><strong>{line.quantity}</strong><button disabled={line.quantity >= line.product.stock} onClick={() => onUpdate(line.productId, line.variantId, line.quantity + 1)} aria-label="Увеличить">+</button><button className="remove-button" onClick={() => onUpdate(line.productId, line.variantId, 0)}>Удалить</button></div></div></article>)}</div>
    <section className="fulfilment-panel"><h2>Получение</h2><div className="delivery-toggle"><button className={deliveryType === 'delivery' ? 'active' : ''} onClick={() => onDelivery('delivery')}>Курьер · от 290 ₽</button><button className={deliveryType === 'pickup' ? 'active' : ''} onClick={() => onDelivery('pickup')}>Самовывоз · 0 ₽</button></div><p>{deliveryType === 'delivery' ? freeLeft ? `До бесплатной доставки ещё ${formatPrice(freeLeft)}.` : 'Бесплатная доставка применена.' : 'Каменка, пр. Металлургов, 18. Ежедневно 10:00–20:00.'}</p></section>
    <OrderSummary subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} total={total} />
    {minimumLeft > 0 && <p className="minimum-note" role="status">Добавьте ещё на {formatPrice(minimumLeft)} до минимальной суммы заказа.</p>}
    <button className="primary-button sticky-action" disabled={minimumLeft > 0} onClick={onCheckout}>Оформить заказ · {formatPrice(total)}</button>
  </div>;
}

function CheckoutView({ checkout, subtotal, discount, deliveryFee, total, lines, orders, onChange, onBack, onComplete }: { checkout: CheckoutForm; subtotal: number; discount: number; deliveryFee: number; total: number; lines: CartLine[]; orders: Order[]; onChange: (form: CheckoutForm) => void; onBack: () => void; onComplete: (order: Order) => void }) {
  const [errors, setErrors] = useState<CheckoutErrors>({}); const [paid, setPaid] = useState(false); const [paying, setPaying] = useState(false);
  const update = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => { onChange({ ...checkout, [key]: value }); setErrors((current) => ({ ...current, [key]: undefined })); setPaid(false); };
  const submit = () => {
    const nextErrors = validateCheckout(checkout); setErrors(nextErrors); if (Object.keys(nextErrors).length || !paid || !lines.length) return;
    const now = new Date().toISOString(); const id = `KM-${String(2050 + orders.length).padStart(4, '0')}`;
    const deliveryWindow = checkout.deliveryType === 'pickup' ? 'Самовывоз · ежедневно 10:00–20:00' : deliveryWindows.find((item) => item.id === checkout.deliveryWindowId)?.label ?? '';
    onComplete({ id, createdAt: now, status: 'paid', paymentMethod: checkout.paymentMethod, paymentStatus: 'demo-paid', deliveryType: checkout.deliveryType, deliveryWindow,
      contactName: checkout.name.trim(), phone: checkout.phone.trim(), address: checkout.deliveryType === 'pickup' ? 'Каменка, пр. Металлургов, 18' : checkout.address.trim(), comment: checkout.comment.trim(),
      items: lines.map((line) => ({ productId: line.productId, title: line.product.title, variantId: line.variantId, variantLabel: line.variant.label, unitPrice: line.unitPrice, quantity: line.quantity })),
      activity: [{ id: `${id}-created`, createdAt: now, status: 'paid', title: 'Заказ создан', note: 'Демо-оплата подтверждена локально. Реального списания не было.', source: 'demo' }],
      subtotal, discount, deliveryFee, total });
  };
  return <div className="screen checkout-screen"><button className="link-button" onClick={onBack}>← Назад в корзину</button><SectionTitle index="03" title="Оформление" subtitle="Один экран, прозрачный итог и ошибки рядом с полями." />
    <div className="checkout-steps"><span className="done">1 · Получение</span><span>2 · Контакты</span><span className={paid ? 'done' : ''}>3 · Демо-оплата</span></div>
    <div className="delivery-toggle"><button className={checkout.deliveryType === 'delivery' ? 'active' : ''} onClick={() => update('deliveryType', 'delivery')}>Доставка</button><button className={checkout.deliveryType === 'pickup' ? 'active' : ''} onClick={() => update('deliveryType', 'pickup')}>Самовывоз</button></div>
    {checkout.deliveryType === 'delivery' && <fieldset className="window-list"><legend>Интервал доставки</legend>{deliveryWindows.map((window) => <label key={window.id} className={checkout.deliveryWindowId === window.id ? 'selected' : ''}><input type="radio" name="window" checked={checkout.deliveryWindowId === window.id} onChange={() => update('deliveryWindowId', window.id)} /><span><strong>{window.label}</strong><small>{window.note}</small></span></label>)}{errors.deliveryWindowId && <p className="field-error">{errors.deliveryWindowId}</p>}</fieldset>}
    <div className="form-grid"><TextField id="name" label="Имя" value={checkout.name} error={errors.name} autoComplete="name" onChange={(value) => update('name', value)} /><TextField id="phone" label="Телефон" value={checkout.phone} error={errors.phone} autoComplete="tel" onChange={(value) => update('phone', value)} />{checkout.deliveryType === 'delivery' && <TextField id="address" label="Адрес" value={checkout.address} error={errors.address} autoComplete="street-address" onChange={(value) => update('address', value)} />}<label className="field"><span>Комментарий · необязательно</span><textarea value={checkout.comment} onChange={(e) => update('comment', e.target.value)} placeholder="Домофон, ориентир или пожелание" /></label></div>
    <OrderSummary subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} total={total} />
    <section className="payment-note"><div><strong>Демо-оплата</strong><span>Реальный платёжный провайдер не подключён. Деньги и данные карты не обрабатываются.</span></div><div className="payment-methods">{paymentMethods.map((method) => <button role="radio" aria-checked={checkout.paymentMethod === method.id} className={checkout.paymentMethod === method.id ? 'active' : ''} key={method.id} onClick={() => update('paymentMethod', method.id)}><strong>{method.title}</strong><span>{method.note}</span></button>)}</div><button className="secondary-button" disabled={paying || paid} onClick={() => { const next = validateCheckout(checkout); setErrors(next); if (Object.keys(next).length) return; setPaying(true); window.setTimeout(() => { setPaid(true); setPaying(false); }, 480); }}>{paying ? 'Подтверждаем…' : paid ? 'Демо-оплата подтверждена' : `Подтвердить демо-оплату · ${formatPrice(total)}`}</button></section>
    <button className="primary-button sticky-action" disabled={!paid} onClick={submit}>Создать заказ</button>
  </div>;
}

function OrdersView({ orders, onCancel, onCatalog }: { orders: Order[]; onCancel: (id: string) => void; onCatalog: () => void }) {
  return <div className="screen"><SectionTitle index="04" title="Статус заказа" subtitle="Источник и время каждого изменения видны в журнале." />{!orders.length && <EmptyState title="Заказов ещё нет" text="После демо-оплаты заказ появится здесь." action="Открыть каталог" onAction={onCatalog} />}<div className="orders-list">{orders.map((order) => { const canCancel = order.status === 'new' || order.status === 'paid'; return <article className="order-card" key={order.id}><div className="order-head"><div><h2>{order.id}</h2><p>{formatDate(order.createdAt)} · {order.deliveryWindow}</p></div><StatusPill status={order.status} /></div><div className="order-items">{order.items.map((item) => <span key={`${item.productId}-${item.variantId}`}>{item.title} · {item.variantLabel} × {item.quantity}</span>)}</div><div className="order-footer"><strong>{formatPrice(order.total)}</strong><span>{order.address}</span></div><OrderTracking order={order} />{canCancel && <button className="danger-button" onClick={() => onCancel(order.id)}>Отменить заказ</button>}{!canCancel && order.status !== 'cancelled' && <p className="order-policy">Отмена доступна до начала сборки. Сейчас свяжитесь с магазином.</p>}</article>; })}</div></div>;
}

function AdminView({ orders, products, label, onStatus, onStock }: { orders: Order[]; products: Product[]; label: string; onStatus: (id: string, status: OrderStatus) => void; onStock: (id: string, stock: number) => void }) {
  const openOrders = orders.filter((order) => !['done', 'cancelled'].includes(order.status));
  return <div className="screen admin-screen"><SectionTitle index="M" title="Заказы магазина" subtitle={`${label}. Локальная демонстрация операций без backend.`} /><section className="operations-strip"><div><span>Активные</span><strong>{openOrders.length}</strong></div><div><span>К сборке</span><strong>{orders.filter((order) => order.status === 'paid').length}</strong></div><div><span>Низкий остаток</span><strong>{products.filter((product) => product.stock < 8).length}</strong></div></section><section className="admin-section"><h2>Очередь</h2>{orders.map((order) => <article className="admin-order" key={order.id}><div><strong>{order.id}</strong><span>{order.contactName} · {formatPrice(order.total)}</span><small>{order.items.map((item) => `${item.title} / ${item.variantLabel}`).join(', ')}</small></div><select aria-label={`Статус заказа ${order.id}`} value={order.status} disabled={order.status === 'cancelled'} onChange={(e) => onStatus(order.id, e.target.value as OrderStatus)}>{statusFlow.map((status) => <option key={status} value={status}>{statusMeta[status].title}</option>)}{order.status === 'cancelled' && <option value="cancelled">Отменён</option>}</select></article>)}</section><section className="admin-section"><h2>Остатки</h2><div className="stock-list">{products.map((product) => <label className="stock-row" key={product.id}><span>{product.title}<small>{product.origin}</small></span><input type="number" min="0" value={product.stock} onChange={(e) => onStock(product.id, Number(e.target.value))} /></label>)}</div></section></div>;
}

function TextField({ id, label, value, error, autoComplete, onChange }: { id: string; label: string; value: string; error?: string; autoComplete: string; onChange: (value: string) => void }) {
  const errorId = `${id}-error`; return <label className="field" htmlFor={id}><span>{label}</span><input id={id} value={value} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={(e) => onChange(e.target.value)} />{error && <small className="field-error" id={errorId}>{error}</small>}</label>;
}
function OrderSummary({ subtotal, discount, deliveryFee, total }: { subtotal: number; discount: number; deliveryFee: number; total: number }) { return <section className="summary" aria-label="Итог заказа"><Summary label="Товары" value={subtotal} /><Summary label="Скидка от 4 000 ₽" value={-discount} /><Summary label="Доставка" value={deliveryFee} /><div className="summary-total"><span>Итого</span><strong>{formatPrice(total)}</strong></div></section>; }
function Summary({ label, value }: { label: string; value: number }) { return <div className="summary-row"><span>{label}</span><strong>{value === 0 ? '0 ₽' : formatPrice(value)}</strong></div>; }
function StatusPill({ status }: { status: OrderStatus }) { return <span className={`status-pill ${statusMeta[status].tone}`}>{statusMeta[status].title}</span>; }
function OrderTracking({ order }: { order: Order }) { return <section className="activity-timeline" aria-label="История заказа"><h3>Активность</h3>{[...order.activity].reverse().map((item) => <div key={item.id}><i /><span><strong>{item.title}</strong><small>{formatDate(item.createdAt)} · {item.source === 'merchant' ? 'магазин' : item.source === 'customer' ? 'покупатель' : 'демо'}</small><p>{item.note}</p></span></div>)}</section>; }
function SectionTitle({ index, title, subtitle }: { index: string; title: string; subtitle: string }) { return <header className="section-title"><span>{index}</span><div><h1>{title}</h1><p>{subtitle}</p></div></header>; }
function EmptyState({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) { return <section className="empty-state"><strong>{title}</strong><span>{text}</span>{action && onAction && <button className="secondary-button" onClick={onAction}>{action}</button>}</section>; }
function ImageFallback({ src, title, className }: { src: string; title: string; className: string }) { const [failed, setFailed] = useState(false); return failed ? <div className={`${className} image-fallback`} aria-label={title || undefined}><span>К</span></div> : <img className={className} src={src} alt={title} onError={() => setFailed(true)} />; }

export default App;
