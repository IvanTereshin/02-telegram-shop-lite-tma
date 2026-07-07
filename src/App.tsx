import { useEffect, useMemo, useState } from 'react';
import { categories, demoOrders, demoProducts } from './data/catalog';
import { formatDate, formatPrice, statusMeta } from './lib/format';
import { loadState, saveState } from './lib/storage';
import type {
  CartItem,
  CategoryId,
  CheckoutForm,
  Order,
  OrderStatus,
  Product,
  SortMode,
} from './types';

type View = 'shop' | 'cart' | 'checkout' | 'success' | 'orders' | 'admin';

const STORAGE_KEYS = {
  products: 'telegram-shop-lite-products-v1',
  cart: 'telegram-shop-lite-cart-v1',
  orders: 'telegram-shop-lite-orders-v1',
  checkout: 'telegram-shop-lite-checkout-v1',
};

const defaultCheckout: CheckoutForm = {
  deliveryType: 'delivery',
  name: 'Иван',
  phone: '+7 900 120-40-20',
  address: 'Новокузнецк, ул. Кирова, 55',
  comment: '',
};

const statusFlow: OrderStatus[] = ['new', 'paid', 'packing', 'courier', 'pickupReady', 'done'];

function getInitialProducts() {
  return loadState<Product[]>(STORAGE_KEYS.products, demoProducts);
}

function getInitialOrders() {
  return loadState<Order[]>(STORAGE_KEYS.orders, demoOrders);
}

function getInitialCart() {
  return loadState<CartItem[]>(STORAGE_KEYS.cart, []);
}

function getInitialCheckout() {
  return loadState<CheckoutForm>(STORAGE_KEYS.checkout, defaultCheckout);
}

function App() {
  const [view, setView] = useState<View>('shop');
  const [products, setProducts] = useState<Product[]>(getInitialProducts);
  const [cart, setCart] = useState<CartItem[]>(getInitialCart);
  const [orders, setOrders] = useState<Order[]>(getInitialOrders);
  const [checkout, setCheckout] = useState<CheckoutForm>(getInitialCheckout);
  const [category, setCategory] = useState<CategoryId>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('popular');
  const [promo, setPromo] = useState('TMA10');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => saveState(STORAGE_KEYS.products, products), [products]);
  useEffect(() => saveState(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => saveState(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => saveState(STORAGE_KEYS.checkout, checkout), [checkout]);

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesCategory = category === 'all' || product.categoryId === category;
      const matchesSearch =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.short.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });

    return result.sort((a, b) => {
      if (sort === 'priceAsc') return a.price - b.price;
      if (sort === 'priceDesc') return b.price - a.price;
      if (sort === 'stock') return b.stock - a.stock;
      return b.popular - a.popular;
    });
  }, [category, products, search, sort]);

  const cartLines = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((current) => current.id === item.productId);
          return product ? { product, quantity: item.quantity } : null;
        })
        .filter((line): line is { product: Product; quantity: number } => Boolean(line)),
    [cart, products],
  );

  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discount = promo.trim().toUpperCase() === 'TMA10' ? Math.round(subtotal * 0.1) : 0;
  const deliveryFee = checkout.deliveryType === 'delivery' && subtotal - discount < 2500 ? 290 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const lastOrder = orders.find((order) => order.id === lastOrderId) ?? null;

  function addToCart(productId: string, quantity = 1) {
    const product = products.find((current) => current.id === productId);
    if (!product || product.stock <= 0) return;

    setCart((currentCart) => {
      const currentItem = currentCart.find((item) => item.productId === productId);
      const currentQuantity = currentItem?.quantity ?? 0;
      const nextQuantity = Math.min(product.stock, currentQuantity + quantity);

      if (currentItem) {
        return currentCart.map((item) =>
          item.productId === productId ? { ...item, quantity: nextQuantity } : item,
        );
      }

      return [...currentCart, { productId, quantity: nextQuantity }];
    });
  }

  function updateCart(productId: string, quantity: number) {
    const product = products.find((current) => current.id === productId);
    if (!product || quantity <= 0) {
      setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.min(quantity, product.stock) } : item,
      ),
    );
  }

  function placeOrder() {
    if (cartLines.length === 0) return;

    const orderId = `TS-${Math.floor(2100 + Math.random() * 8000)}`;
    const order: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'new',
      deliveryType: checkout.deliveryType,
      contactName: checkout.name,
      phone: checkout.phone,
      address:
        checkout.deliveryType === 'pickup' ? 'Пункт выдачи: ТРЦ Планета, 1 этаж' : checkout.address,
      comment: checkout.comment,
      items: cartLines.map((line) => ({
        productId: line.product.id,
        title: line.product.title,
        price: line.product.price,
        quantity: line.quantity,
      })),
      subtotal,
      discount,
      deliveryFee,
      total,
    };

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const line = cartLines.find((item) => item.product.id === product.id);
        return line ? { ...product, stock: Math.max(0, product.stock - line.quantity) } : product;
      }),
    );
    setOrders((currentOrders) => [order, ...currentOrders]);
    setCart([]);
    setLastOrderId(orderId);
    setView('success');
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );
  }

  function updateStock(productId: string, stock: number) {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId ? { ...product, stock: Math.max(0, stock) } : product,
      ),
    );
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          const product = products.find((current) => current.id === item.productId);
          if (item.productId !== productId || !product) return item;
          return { ...item, quantity: Math.min(item.quantity, Math.max(0, stock)) };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  const checkoutReady =
    checkout.name.trim().length > 1 &&
    checkout.phone.trim().length > 5 &&
    (checkout.deliveryType === 'pickup' || checkout.address.trim().length > 5);

  return (
    <main className="app-root">
      <section className="phone-shell" aria-label="Telegram Shop Lite">
        <header className="topbar">
          <div>
            <p className="tg-caption">Telegram Mini App</p>
            <h1>Shop Lite</h1>
          </div>
          <button className="ghost-button" type="button" onClick={() => setView('admin')}>
            Admin
          </button>
        </header>

        <nav className="tabbar" aria-label="Основная навигация">
          <NavButton active={view === 'shop'} label="Каталог" onClick={() => setView('shop')} />
          <NavButton active={view === 'cart'} label={`Корзина ${cartCount || ''}`} onClick={() => setView('cart')} />
          <NavButton active={view === 'orders'} label="Заказы" onClick={() => setView('orders')} />
        </nav>

        <div className="content">
          {view === 'shop' && (
            <CatalogView
              cartCount={cartCount}
              category={category}
              products={filteredProducts}
              search={search}
              sort={sort}
              total={total}
              onAdd={addToCart}
              onCategoryChange={setCategory}
              onOpenCart={() => setView('cart')}
              onOpenProduct={setSelectedProductId}
              onSearchChange={setSearch}
              onSortChange={setSort}
            />
          )}

          {view === 'cart' && (
            <CartView
              cartLines={cartLines}
              deliveryFee={deliveryFee}
              discount={discount}
              promo={promo}
              subtotal={subtotal}
              total={total}
              onCheckout={() => setView('checkout')}
              onPromoChange={setPromo}
              onUpdateCart={updateCart}
            />
          )}

          {view === 'checkout' && (
            <CheckoutView
              checkout={checkout}
              checkoutReady={checkoutReady}
              deliveryFee={deliveryFee}
              discount={discount}
              subtotal={subtotal}
              total={total}
              onBack={() => setView('cart')}
              onChange={setCheckout}
              onPlaceOrder={placeOrder}
            />
          )}

          {view === 'success' && (
            <SuccessView
              order={lastOrder}
              onCatalog={() => setView('shop')}
              onOrders={() => setView('orders')}
            />
          )}

          {view === 'orders' && <OrdersView orders={orders} />}

          {view === 'admin' && (
            <AdminView
              orders={orders}
              products={products}
              onBack={() => setView('shop')}
              onStatusChange={updateOrderStatus}
              onStockChange={updateStock}
            />
          )}
        </div>

        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            cartQuantity={cart.find((item) => item.productId === selectedProduct.id)?.quantity ?? 0}
            onAdd={addToCart}
            onClose={() => setSelectedProductId(null)}
          />
        )}
      </section>
    </main>
  );
}

interface NavButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function NavButton({ active, label, onClick }: NavButtonProps) {
  return (
    <button className={active ? 'tab active' : 'tab'} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

interface CatalogViewProps {
  cartCount: number;
  category: CategoryId;
  products: Product[];
  search: string;
  sort: SortMode;
  total: number;
  onAdd: (productId: string) => void;
  onCategoryChange: (category: CategoryId) => void;
  onOpenCart: () => void;
  onOpenProduct: (productId: string) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
}

function CatalogView({
  cartCount,
  category,
  products,
  search,
  sort,
  total,
  onAdd,
  onCategoryChange,
  onOpenCart,
  onOpenProduct,
  onSearchChange,
  onSortChange,
}: CatalogViewProps) {
  return (
    <div className="screen">
      <section className="shop-hero">
        <ImageFallback src="/assets/shop-hero.png" title="Shop Lite" className="hero-media" />
        <div className="hero-copy">
          <p>Сегодня в магазине</p>
          <strong>12 товаров для дома, работы и подарков</strong>
          <span>Доставка от 45 минут · самовывоз без очереди</span>
        </div>
      </section>

      <div className="search-row">
        <label className="search-box">
          <span>Поиск</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="чай, сумка, набор"
          />
        </label>
        <label className="sort-box">
          <span>Сортировка</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value as SortMode)}>
            <option value="popular">Популярное</option>
            <option value="priceAsc">Сначала дешевле</option>
            <option value="priceDesc">Сначала дороже</option>
            <option value="stock">По остаткам</option>
          </select>
        </label>
      </div>

      <div className="category-row" role="list" aria-label="Категории">
        <button
          className={category === 'all' ? 'chip active' : 'chip'}
          type="button"
          onClick={() => onCategoryChange('all')}
        >
          Все
        </button>
        {categories.map((item) => (
          <button
            className={category === item.id ? 'chip active' : 'chip'}
            key={item.id}
            type="button"
            onClick={() => onCategoryChange(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>

      <section className="product-grid" aria-label="Каталог товаров">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={() => onAdd(product.id)}
            onOpen={() => onOpenProduct(product.id)}
          />
        ))}
      </section>

      {products.length === 0 && (
        <EmptyState title="Ничего не найдено" text="Попробуй другой запрос или категорию." />
      )}

      {cartCount > 0 && (
        <button className="floating-cart" type="button" onClick={onOpenCart}>
          <span>{cartCount} товара</span>
          <strong>{formatPrice(total)}</strong>
        </button>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
  onOpen: () => void;
}

function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
  const soldOut = product.stock === 0;

  return (
    <article className={soldOut ? 'product-card sold-out' : 'product-card'}>
      <button className="product-image-button" type="button" onClick={onOpen}>
        <ImageFallback src={product.image} title={product.title} className="product-image" />
      </button>
      <button className="product-info" type="button" onClick={onOpen}>
        <span className="product-meta">
          {product.weight} · ★ {product.rating}
        </span>
        <h2>{product.title}</h2>
        <p>{product.short}</p>
      </button>
      <div className="product-footer">
        <div>
          <strong>{formatPrice(product.price)}</strong>
          {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
        </div>
        <button className="icon-button" type="button" disabled={soldOut} onClick={onAdd}>
          {soldOut ? 'Нет' : '+'}
        </button>
      </div>
    </article>
  );
}

interface ProductDetailProps {
  product: Product;
  cartQuantity: number;
  onAdd: (productId: string) => void;
  onClose: () => void;
}

function ProductDetail({ product, cartQuantity, onAdd, onClose }: ProductDetailProps) {
  const canAdd = cartQuantity < product.stock;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="product-drawer" aria-label="Детали товара" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-handle" />
        <ImageFallback src={product.image} title={product.title} className="detail-image" />
        <div className="detail-header">
          <div>
            <p>{categories.find((item) => item.id === product.categoryId)?.title}</p>
            <h2>{product.title}</h2>
          </div>
          <strong>{formatPrice(product.price)}</strong>
        </div>
        <p className="detail-description">{product.description}</p>
        <div className="tag-row">
          {product.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="stock-note">
          <span>Остаток</span>
          <strong>{product.stock} шт.</strong>
        </div>
        <button className="primary-button" type="button" disabled={!canAdd} onClick={() => onAdd(product.id)}>
          {canAdd ? 'Добавить в корзину' : 'Максимум в корзине'}
        </button>
      </aside>
    </div>
  );
}

interface CartViewProps {
  cartLines: Array<{ product: Product; quantity: number }>;
  deliveryFee: number;
  discount: number;
  promo: string;
  subtotal: number;
  total: number;
  onCheckout: () => void;
  onPromoChange: (value: string) => void;
  onUpdateCart: (productId: string, quantity: number) => void;
}

function CartView({
  cartLines,
  deliveryFee,
  discount,
  promo,
  subtotal,
  total,
  onCheckout,
  onPromoChange,
  onUpdateCart,
}: CartViewProps) {
  if (cartLines.length === 0) {
    return (
      <div className="screen">
        <EmptyState title="Корзина пустая" text="Добавь товары из каталога. Остатки будут проверены автоматически." />
      </div>
    );
  }

  return (
    <div className="screen">
      <SectionTitle title="Корзина" subtitle="Количество нельзя сделать больше доступного остатка." />
      <div className="cart-list">
        {cartLines.map(({ product, quantity }) => (
          <article className="cart-item" key={product.id}>
            <ImageFallback src={product.image} title={product.title} className="cart-image" />
            <div>
              <h2>{product.title}</h2>
              <p>{formatPrice(product.price)} · остаток {product.stock}</p>
              <div className="stepper">
                <button type="button" onClick={() => onUpdateCart(product.id, quantity - 1)}>
                  -
                </button>
                <strong>{quantity}</strong>
                <button
                  type="button"
                  disabled={quantity >= product.stock}
                  onClick={() => onUpdateCart(product.id, quantity + 1)}
                >
                  +
                </button>
                <button className="remove-button" type="button" onClick={() => onUpdateCart(product.id, 0)}>
                  Удалить
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <label className="promo-box">
        <span>Промокод</span>
        <input value={promo} onChange={(event) => onPromoChange(event.target.value)} placeholder="TMA10" />
      </label>

      <OrderSummary subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} total={total} />

      <button className="primary-button sticky-action" type="button" onClick={onCheckout}>
        Оформить заказ
      </button>
    </div>
  );
}

interface CheckoutViewProps {
  checkout: CheckoutForm;
  checkoutReady: boolean;
  deliveryFee: number;
  discount: number;
  subtotal: number;
  total: number;
  onBack: () => void;
  onChange: (value: CheckoutForm) => void;
  onPlaceOrder: () => void;
}

function CheckoutView({
  checkout,
  checkoutReady,
  deliveryFee,
  discount,
  subtotal,
  total,
  onBack,
  onChange,
  onPlaceOrder,
}: CheckoutViewProps) {
  function updateField<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    onChange({ ...checkout, [key]: value });
  }

  return (
    <div className="screen">
      <button className="link-button" type="button" onClick={onBack}>
        Назад в корзину
      </button>
      <SectionTitle title="Checkout" subtitle="Минимум шагов: контакт, способ получения и комментарий." />

      <div className="delivery-toggle" role="group" aria-label="Способ получения">
        <DeliveryButton
          active={checkout.deliveryType === 'delivery'}
          label="Доставка"
          onClick={() => updateField('deliveryType', 'delivery')}
        />
        <DeliveryButton
          active={checkout.deliveryType === 'pickup'}
          label="Самовывоз"
          onClick={() => updateField('deliveryType', 'pickup')}
        />
      </div>

      <div className="form-grid">
        <TextField label="Имя" value={checkout.name} onChange={(value) => updateField('name', value)} />
        <TextField label="Телефон" value={checkout.phone} onChange={(value) => updateField('phone', value)} />
        {checkout.deliveryType === 'delivery' && (
          <TextField label="Адрес" value={checkout.address} onChange={(value) => updateField('address', value)} />
        )}
        <label className="field">
          <span>Комментарий</span>
          <textarea
            value={checkout.comment}
            onChange={(event) => updateField('comment', event.target.value)}
            placeholder="Домофон, удобное время, замена товара"
          />
        </label>
      </div>

      <OrderSummary subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} total={total} />

      <div className="payment-note">
        <strong>Demo payment</strong>
        <span>В production здесь будет Telegram Payments invoice или внешний provider.</span>
      </div>

      <button className="primary-button sticky-action" type="button" disabled={!checkoutReady} onClick={onPlaceOrder}>
        Создать заказ · {formatPrice(total)}
      </button>
    </div>
  );
}

interface DeliveryButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function DeliveryButton({ active, label, onClick }: DeliveryButtonProps) {
  return (
    <button className={active ? 'delivery-button active' : 'delivery-button'} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

interface SuccessViewProps {
  order: Order | null;
  onCatalog: () => void;
  onOrders: () => void;
}

function SuccessView({ order, onCatalog, onOrders }: SuccessViewProps) {
  return (
    <div className="screen success-screen">
      <div className="success-mark">✓</div>
      <h2>Заказ создан</h2>
      <p>
        {order ? `${order.id} · ${formatPrice(order.total)}` : 'Новый заказ появится в истории.'}
      </p>
      <div className="telegram-status">
        <strong>Статус уйдет в Telegram</strong>
        <span>Бот отправит номер заказа, чек и следующие обновления.</span>
      </div>
      <button className="primary-button" type="button" onClick={onOrders}>
        Открыть историю
      </button>
      <button className="secondary-button" type="button" onClick={onCatalog}>
        Вернуться в каталог
      </button>
    </div>
  );
}

function OrdersView({ orders }: { orders: Order[] }) {
  return (
    <div className="screen">
      <SectionTitle title="Мои заказы" subtitle="Такой статус можно отправлять пользователю через Telegram-бота." />
      <div className="orders-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-head">
              <div>
                <h2>{order.id}</h2>
                <p>{formatDate(order.createdAt)}</p>
              </div>
              <StatusPill status={order.status} />
            </div>
            <div className="order-items">
              {order.items.map((item) => (
                <span key={`${order.id}-${item.productId}`}>
                  {item.title} × {item.quantity}
                </span>
              ))}
            </div>
            <div className="order-footer">
              <strong>{formatPrice(order.total)}</strong>
              <span>{statusMeta[order.status].botText}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

interface AdminViewProps {
  orders: Order[];
  products: Product[];
  onBack: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onStockChange: (productId: string, stock: number) => void;
}

function AdminView({ orders, products, onBack, onStatusChange, onStockChange }: AdminViewProps) {
  return (
    <div className="screen">
      <button className="link-button" type="button" onClick={onBack}>
        Назад в магазин
      </button>
      <SectionTitle title="Админ-экран" subtitle="Статусы заказов и остатки меняются локально, как в демо API." />

      <section className="admin-section">
        <h2>Заказы</h2>
        <div className="admin-list">
          {orders.map((order) => (
            <article className="admin-order" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <span>{formatPrice(order.total)} · {order.items.length} поз.</span>
              </div>
              <select value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}>
                {statusFlow.map((status) => (
                  <option key={status} value={status}>
                    {statusMeta[status].title}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Остатки</h2>
        <div className="stock-list">
          {products.map((product) => (
            <label className="stock-row" key={product.id}>
              <span>{product.title}</span>
              <input
                min="0"
                type="number"
                value={product.stock}
                onChange={(event) => onStockChange(product.id, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface OrderSummaryProps {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

function OrderSummary({ subtotal, discount, deliveryFee, total }: OrderSummaryProps) {
  return (
    <section className="summary" aria-label="Итог заказа">
      <SummaryRow label="Товары" value={subtotal} />
      <SummaryRow label="Скидка" value={-discount} />
      <SummaryRow label="Доставка" value={deliveryFee} />
      <div className="summary-total">
        <span>Итого</span>
        <strong>{formatPrice(total)}</strong>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{formatPrice(value)}</strong>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`status-pill ${statusMeta[status].tone}`}>{statusMeta[status].title}</span>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="section-title">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </section>
  );
}

function ImageFallback({ src, title, className }: { src: string; title: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (failed) {
    return (
      <div className={`${className} image-fallback`} aria-label={title}>
        <span>{initials}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={title} onError={() => setFailed(true)} />;
}

export default App;
