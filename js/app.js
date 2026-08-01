/* ============================================================
   極光特調 Aurora Drinks — 應用程式主邏輯
   ============================================================ */
'use strict';

/* ---------- 菜單資料（5 系列 / 20 品項）---------- */
const menuData = [
  {
    id: 'series-1',
    name: '星河氣泡果茶系列',
    short: '星河氣泡',
    desc: '以水果、氣泡、冰茶為主，口感清爽，視覺顏色鮮明。',
    drinks: [
      { id: 1, name: '紫晶星河葡萄氣泡飲', flavor: '紫葡萄、氣泡水、葡萄果肉', price: 190 },
      { id: 2, name: '龍王藍柑橘冰茶', flavor: '藍柑橘、檸檬、柳橙、茶', price: 200 },
      { id: 3, name: '熔岩草莓香檳冰飲', flavor: '草莓、無酒精香檳氣泡飲', price: 250 },
      { id: 4, name: '火焰紅寶石石榴氣泡飲', flavor: '石榴、覆盆莓、氣泡水', price: 210 }
    ]
  },
  {
    id: 'series-2',
    name: '果香奶霜系列',
    short: '果香奶霜',
    desc: '水果茶搭配奶蓋、雪霜或奶香元素，清爽中帶有濃郁感。',
    drinks: [
      { id: 5, name: '翡翠麝香青提雪霜', flavor: '奢華特調麝香青葡萄、奶油雪霜', price: 195 },
      { id: 6, name: '鎏金雲頂白桃奶蓋', flavor: '白桃果茶、鹹甜奶蓋', price: 220 },
      { id: 7, name: '黃金鳳凰芒果雲霜', flavor: '愛文芒果、香草奶霜', price: 260 },
      { id: 8, name: '紫藤花園白葡萄奶霜', flavor: '白葡萄、紫藤花香、淡紫奶霜', price: 235 }
    ]
  },
  {
    id: 'series-3',
    name: '奢華奶茶歐蕾系列',
    short: '奶茶歐蕾',
    desc: '以奶茶、鮮奶及珍珠為主，味道柔和濃郁，適合喜歡奶香的客人。',
    drinks: [
      { id: 9,  name: '伯爵金箔海鹽奶霜', flavor: '伯爵奶茶、海鹽奶霜、珍珠', price: 230 },
      { id: 10, name: '玫瑰珍珠極光歐蕾', flavor: '玫瑰鮮奶、莓果、玫瑰珍珠', price: 210 },
      { id: 11, name: '櫻花琥珀燕窩奶茶', flavor: '櫻花奶茶、琥珀珍珠、燕窩', price: 280 },
      { id: 12, name: '人魚之淚海洋椰奶', flavor: '蝶豆花、椰奶、荔枝、水晶珍珠', price: 230 }
    ]
  },
  {
    id: 'series-4',
    name: '精品咖啡可可系列',
    short: '咖啡可可',
    desc: '以咖啡、巧克力或濃郁乳香為主，風味偏厚重、成熟。',
    drinks: [
      { id: 13, name: '黑鑽松露可可冰沙', flavor: '黑可可、巧克力、黑松露風味', price: 260 },
      { id: 14, name: '焦糖火山布蕾拿鐵', flavor: '咖啡、布蕾奶霜、焦糖', price: 240 },
      { id: 15, name: '焦糖太陽蛋布丁奶茶', flavor: '黑糖奶茶、布丁、珍珠、焦糖', price: 205 },
      { id: 16, name: '帝王榴槤金磚奶昔', flavor: '榴槤、椰奶冰淇淋、奶昔', price: 320 }
    ]
  },
  {
    id: 'series-5',
    name: '夢幻冰沙甜點系列',
    short: '冰沙甜點',
    desc: '造型偏夢幻、趣味或甜點感，適合拍照打卡與社群宣傳。',
    drinks: [
      { id: 17, name: '月蝕黑曜石荔枝冰茶', flavor: '竹炭荔枝茶、荔枝、水晶凍', price: 220 },
      { id: 18, name: '銀河棉花糖藍莓歐蕾', flavor: '藍莓鮮奶、優格、棉花糖', price: 225 },
      { id: 19, name: '女王皇冠莓果紅茶', flavor: '綜合莓果、紅茶、玫瑰奶霜', price: 250 },
      { id: 20, name: '極地鑽石薄荷冰沙', flavor: '薄荷、青檸、水晶凍', price: 215 }
    ]
  }
];

/* ---------- 狀態 ---------- */
const CART_KEY = 'aurora_cart_v1';
const ORDER_KEY = 'aurora_pending_orders_v1';

let cart = [];
let allDrinksFlattened = [];
let currentCheckoutStep = 1;
let selectedPayment = '信用卡';
let lastFocused = null;

/* ============================================================
   工具
   ============================================================ */

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** 商品圖路徑：1–10 為 png，11 起為 jpg */
function getImagePath(id) {
  return id <= 10
    ? `./picture/${String(id).padStart(2, '0')}.png`
    : `./picture/${id}.jpg`;
}

/** 產生本地 SVG 佔位圖（離線也能顯示，不依賴外部服務） */
function makePlaceholder(name, w = 400, h = 500) {
  const label = String(name).slice(0, 10);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1a1a1a"/><stop offset="100%" stop-color="#0a0a0a"/>
  </linearGradient>
  <radialGradient id="r" cx="50%" cy="35%" r="55%">
    <stop offset="0%" stop-color="#d98f22" stop-opacity=".22"/>
    <stop offset="100%" stop-color="#d98f22" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect width="${w}" height="${h}" fill="url(#r)"/>
<g fill="none" stroke="#d98f22" stroke-opacity=".55" stroke-width="3">
  <path d="M${w * 0.36} ${h * 0.3}h${w * 0.28}l-${w * 0.05} ${h * 0.26}h-${w * 0.18}z"/>
  <path d="M${w * 0.5} ${h * 0.56}v${h * 0.12}"/>
  <path d="M${w * 0.42} ${h * 0.68}h${w * 0.16}"/>
</g>
<text x="50%" y="${h * 0.84}" text-anchor="middle" fill="#e3a939" font-size="${Math.round(w * 0.058)}"
      font-family="'Noto Sans TC','PingFang TC',sans-serif" opacity=".9">${esc(label)}</text>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s+/g, ' '));
}

/** 購物車空狀態 */
const EMPTY_CART_HTML = `
  <div class="text-center text-gray-600 mt-16 sm:mt-20 flex flex-col items-center" id="empty-cart-msg">
    <div class="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mb-4 border border-gray-800">
      <i class="fa-solid fa-wine-glass-empty text-3xl text-gray-500"></i>
    </div>
    <p class="text-lg font-medium">購物車尚無特調</p>
    <p class="text-sm mt-2 text-gray-500">快去挑選您的專屬飲品吧</p>
  </div>`;

/** 鎖住/釋放背景捲動 */
let scrollLockCount = 0;
function lockScroll(on) {
  scrollLockCount = Math.max(0, scrollLockCount + (on ? 1 : -1));
  document.documentElement.style.overflow = scrollLockCount > 0 ? 'hidden' : '';
}

/* ============================================================
   購物車儲存（PWA 離線續用）
   ============================================================ */
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* 私密瀏覽模式 */ }
}
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cart = parsed.filter(i => allDrinksFlattened.some(d => d.id === i.id));
    }
  } catch (e) { cart = []; }
}

/* ============================================================
   初始化
   ============================================================ */
function initApp() {
  menuData.forEach(series => {
    series.drinks.forEach(drink => {
      allDrinksFlattened.push({ ...drink, category: series.name });
    });
  });

  renderCategoryTags();
  renderMenu();
  loadCart();
  updateCartUI();

  document.getElementById('year').textContent = new Date().getFullYear();
  document.body.classList.add('has-mobile-bar');

  bindGlobalEvents();
  handleLaunchParams();
}

/** 支援 manifest shortcuts：?action=cart 直接開啟購物車 */
function handleLaunchParams() {
  const params = new URLSearchParams(location.search);

  if (params.get('action') === 'cart' && cart.length) {
    setTimeout(openCart, 400);
  }

  if (params.get('source') === 'pwa') {
    gtag('event', 'pwa_open', { source: 'shortcut_or_icon' });
  }

  // Service Worker 背景同步觸發的補送
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data && e.data.type === 'FLUSH_ORDERS') flushQueuedOrders();
    });
  }
}

function bindGlobalEvents() {
  // ESC 關閉最上層視窗
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (isSheetOpen('product-modal')) return closeProductModal();
    if (isSheetOpen('checkout-modal')) return closeCheckout();
    if (!document.getElementById('cart-sidebar').classList.contains('translate-x-full')) closeCart();
  });

  // 分類籤：捲動時高亮目前區塊
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        document.querySelectorAll('#category-tags a').forEach(a => {
          a.classList.toggle('chip-active', a.dataset.target === en.target.id);
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('main section[id^="series-"]').forEach(s => obs.observe(s));
  }
}

/* ============================================================
   畫面繪製
   ============================================================ */
function renderCategoryTags() {
  document.getElementById('category-tags').innerHTML = menuData.map((series, i) => `
    <a href="#${series.id}" data-target="${series.id}"
       class="px-4 sm:px-5 py-2.5 rounded-full bg-dark-800 border border-gray-700 text-sm font-medium text-gray-300 hover:border-gold-500 hover:text-gold-400 hover:bg-dark-900 transition-all whitespace-nowrap">
      ${i + 1}. ${esc(series.short)}
    </a>
  `).join('');
}

function renderMenu() {
  const container = document.getElementById('menu-container');

  container.innerHTML = menuData.map(series => `
    <section id="${series.id}" class="mb-14 md:mb-20 scroll-mt-24 md:scroll-mt-28">
      <div class="mb-6 md:mb-10 flex flex-col items-center md:items-start text-center md:text-left border-b border-gray-800 pb-4">
        <h2 class="fluid-h2 font-black font-serif text-white mb-2 md:mb-3 flex items-center gap-3">
          <i class="fa-solid fa-gem text-gold-500 text-base md:text-xl"></i>${esc(series.name)}
        </h2>
        <p class="text-gray-400 text-sm md:text-base md:ml-9 max-w-2xl">${esc(series.desc)}</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-8">
        ${series.drinks.map(drink => productCard(drink)).join('')}
      </div>
    </section>
  `).join('');
}

function productCard(drink) {
  const img = getImagePath(drink.id);
  const fallback = makePlaceholder(drink.name, 400, 500);

  return `
    <article class="bg-dark-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(217,143,34,0.2)] transition-shadow duration-300 border border-gray-800 hover:border-gold-900 group flex flex-col relative">
      <div class="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-bl from-gold-500/20 to-transparent z-10 pointer-events-none"></div>

      <button type="button" onclick="openProductModal(${drink.id})"
              class="card-media relative w-full overflow-hidden bg-dark-950 block text-left"
              aria-label="查看 ${esc(drink.name)} 詳情">
        <img src="${img}" alt="${esc(drink.name)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.src='${fallback}';"
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out">
        <span class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></span>
        <span class="absolute bottom-3 left-0 w-full hidden md:flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <span class="text-gold-300 font-medium border border-gold-500/50 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full text-sm flex items-center gap-2">
            <i class="fa-solid fa-magnifying-glass-plus"></i> 探索細節
          </span>
        </span>
      </button>

      <div class="p-3 sm:p-5 lg:p-6 flex flex-col flex-grow relative z-10 bg-dark-900">
        <h3 class="font-bold text-sm sm:text-lg lg:text-xl font-serif text-white leading-snug mb-1.5 sm:mb-2 line-clamp-2 cursor-pointer hover:text-gold-400 transition-colors"
            onclick="openProductModal(${drink.id})">${esc(drink.name)}</h3>
        <p class="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-5 flex-grow line-clamp-2 font-light">${esc(drink.flavor)}</p>

        <div class="flex items-center justify-between gap-2 mt-auto pt-3 sm:pt-4 border-t border-gray-800">
          <span class="font-black text-base sm:text-xl text-gold-400 whitespace-nowrap">NT$ ${drink.price}</span>
          <button type="button" onclick="addToCart(${drink.id}, event)" aria-label="將 ${esc(drink.name)} 加入購物車"
                  class="bg-gold-500 text-dark-900 w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-gold-400 hover:shadow-[0_0_15px_rgba(217,143,34,0.6)] transition-all active:scale-95">
            <i class="fa-solid fa-plus text-base sm:text-lg"></i>
          </button>
        </div>
      </div>
    </article>`;
}

/* ============================================================
   GA4 電子商務事件
   ============================================================ */
function cartItems() {
  return cart.map(item => ({
    item_id: String(item.id),
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity: item.quantity
  }));
}
function cartValue() {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
function singleItem(item, quantity) {
  return [{
    item_id: String(item.id), item_name: item.name,
    item_category: item.category, price: item.price, quantity
  }];
}

function ga4_viewItem(item)  { gtag('event', 'view_item',  { currency: 'TWD', value: item.price, items: singleItem(item, 1) }); }
function ga4_addToCart(i, q = 1) { gtag('event', 'add_to_cart', { currency: 'TWD', value: i.price * q, items: singleItem(i, q) }); }
function ga4_removeFromCart(i, q) { gtag('event', 'remove_from_cart', { currency: 'TWD', value: i.price * q, items: singleItem(i, q) }); }
function ga4_viewCart() {
  if (!cart.length) return;
  gtag('event', 'view_cart', { currency: 'TWD', value: cartValue(), items: cartItems() });
}
function ga4_beginCheckout() { gtag('event', 'begin_checkout', { currency: 'TWD', value: cartValue(), items: cartItems() }); }
function ga4_addPaymentInfo(type) {
  gtag('event', 'add_payment_info', { currency: 'TWD', value: cartValue(), payment_type: type, items: cartItems() });
}
function ga4_purchase(id, type) {
  gtag('event', 'purchase', {
    transaction_id: id, value: cartValue(), currency: 'TWD', payment_type: type, items: cartItems()
  });
}

/* ============================================================
   通用抽屜（sheet）控制
   ============================================================ */
function isSheetOpen(id) {
  return document.getElementById(id).classList.contains('is-open');
}
function openSheet(id) {
  lastFocused = document.activeElement;
  document.getElementById(id).classList.add('is-open');
  lockScroll(true);
}
function closeSheet(id) {
  document.getElementById(id).classList.remove('is-open');
  lockScroll(false);
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

/* ============================================================
   商品詳情
   ============================================================ */
function openProductModal(id) {
  const p = allDrinksFlattened.find(d => d.id === id);
  if (!p) return;

  ga4_viewItem(p);

  document.getElementById('product-modal-content').innerHTML = `
    <div class="flex flex-col md:flex-row">
      <button type="button" onclick="closeProductModal()" aria-label="關閉"
              class="absolute top-3 right-3 z-20 bg-dark-900/80 hover:bg-gold-500 hover:text-dark-900 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors border border-gray-700">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>

      <div class="w-full md:w-1/2 relative bg-black flex items-center justify-center overflow-hidden aspect-[4/3] md:aspect-auto md:min-h-[420px]">
        <div class="absolute inset-0 bg-gold-900/20 blur-3xl rounded-full scale-150"></div>
        <img src="${getImagePath(p.id)}" alt="${esc(p.name)}" decoding="async"
             onerror="this.onerror=null;this.src='${makePlaceholder(p.name, 800, 800)}';"
             class="w-full h-full object-cover md:object-contain relative z-10 md:max-h-[70vh]">
      </div>

      <div class="w-full md:w-1/2 p-5 sm:p-8 md:p-10 flex flex-col justify-center bg-dark-900">
        <span class="text-[11px] sm:text-xs font-bold text-dark-900 bg-gold-500 px-3 py-1.5 rounded-full mb-3 sm:mb-4 inline-flex w-max tracking-widest">
          <i class="fa-solid fa-star mr-1 text-[10px] self-center"></i>${esc(p.category)}
        </span>

        <h2 class="text-2xl sm:text-3xl md:text-4xl font-black font-serif text-white mb-3 sm:mb-4 leading-tight">${esc(p.name)}</h2>

        <div class="bg-dark-800 rounded-xl p-4 sm:p-5 border border-gray-800 mb-6 sm:mb-8">
          <p class="text-gray-300 flex items-start gap-3 leading-relaxed text-sm sm:text-base">
            <i class="fa-solid fa-droplet text-gold-400 mt-1 shrink-0"></i>
            <span><strong class="text-white block mb-1">主要風味萃取：</strong>${esc(p.flavor)}</span>
          </p>
        </div>

        <div class="mt-auto">
          <div class="flex items-end justify-between mb-5">
            <span class="text-gray-400 text-sm mb-1">專屬尊榮價</span>
            <span class="text-3xl sm:text-4xl font-black gold-gradient-text">NT$ ${p.price}</span>
          </div>
          <button type="button" onclick="addToCart(${p.id}); closeProductModal();"
                  class="w-full bg-gold-500 text-dark-900 py-4 rounded-xl font-bold text-base sm:text-lg shadow-[0_0_15px_rgba(217,143,34,0.3)] hover:shadow-[0_0_25px_rgba(217,143,34,0.6)] transition-all active:scale-95 flex items-center justify-center gap-3">
            <i class="fa-solid fa-cart-plus"></i> 加入購物車
          </button>
        </div>
      </div>
    </div>`;

  openSheet('product-modal');
}

function closeProductModal() { closeSheet('product-modal'); }

/* ============================================================
   購物車操作
   ============================================================ */
function addToCart(id, event = null) {
  if (event) event.stopPropagation();

  const product = allDrinksFlattened.find(d => d.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });

  ga4_addToCart(product, 1);
  updateCartUI();
  showToast(`已將 ${product.name} 放入購物車`);

  const icon = document.querySelector('#cart-count');
  if (icon) {
    icon.classList.add('scale-125');
    setTimeout(() => icon.classList.remove('scale-125'), 200);
  }
}

function removeFromCart(id) {
  const idx = cart.findIndex(i => i.id === id);
  if (idx > -1) {
    ga4_removeFromCart(cart[idx], cart[idx].quantity);
    cart.splice(idx, 1);
    updateCartUI();
  }
}

function changeQuantity(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  if (delta > 0) {
    item.quantity += 1;
    ga4_addToCart(item, 1);
  } else if (item.quantity > 1) {
    item.quantity -= 1;
    ga4_removeFromCart(item, 1);
  } else {
    return removeFromCart(id);
  }
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cartValue();

  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-total').textContent = `NT$ ${total.toLocaleString('zh-TW')}`;
  document.getElementById('checkout-btn').disabled = cart.length === 0;

  // 手機底部列
  document.getElementById('mobile-bar-count').textContent =
    count === 0 ? '購物車是空的' : `${count} 項商品`;
  document.getElementById('mobile-bar-total').textContent = `NT$ ${total.toLocaleString('zh-TW')}`;
  document.getElementById('mobile-bar').classList.toggle('is-visible', count > 0);

  const list = document.getElementById('cart-items');

  if (cart.length === 0) {
    list.innerHTML = EMPTY_CART_HTML;
  } else {
    list.innerHTML = cart.map(item => `
      <div class="flex items-center gap-3 sm:gap-4 bg-dark-800 p-3 sm:p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
        <img src="${getImagePath(item.id)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.src='${makePlaceholder(item.name, 100, 100)}';"
             class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 object-cover rounded-lg border border-gray-700">
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-sm text-white line-clamp-1 mb-1">${esc(item.name)}</h4>
          <div class="text-gold-400 font-bold text-sm">NT$ ${item.price}</div>
          <div class="flex items-center gap-3 mt-2">
            <div class="flex items-center bg-dark-900 rounded-lg border border-gray-700 overflow-hidden">
              <button type="button" onclick="changeQuantity(${item.id}, -1)" aria-label="減少數量"
                      class="tap-sm w-9 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">−</button>
              <span class="w-8 text-center text-sm font-medium text-white">${item.quantity}</span>
              <button type="button" onclick="changeQuantity(${item.id}, 1)" aria-label="增加數量"
                      class="tap-sm w-9 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">+</button>
            </div>
          </div>
        </div>
        <button type="button" onclick="removeFromCart(${item.id})" aria-label="移除 ${esc(item.name)}"
                class="w-10 h-10 shrink-0 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');
  }

  saveCart();
}

function openCart() {
  lastFocused = document.activeElement;
  document.getElementById('cart-overlay').classList.remove('hidden');
  requestAnimationFrame(() => {
    document.getElementById('cart-overlay').classList.remove('opacity-0');
    document.getElementById('cart-sidebar').classList.remove('translate-x-full');
  });
  lockScroll(true);
  ga4_viewCart();
}

function closeCart() {
  document.getElementById('cart-overlay').classList.add('opacity-0');
  document.getElementById('cart-sidebar').classList.add('translate-x-full');
  setTimeout(() => document.getElementById('cart-overlay').classList.add('hidden'), 300);
  lockScroll(false);
}

/* ============================================================
   結帳流程
   ============================================================ */
function startCheckout() {
  if (!cart.length) return;
  closeCart();
  ga4_beginCheckout();

  currentCheckoutStep = 1;
  selectedPayment = '信用卡';
  updateCheckoutUI();
  document.getElementById('checkout-final-total').textContent = `NT$ ${cartValue().toLocaleString('zh-TW')}`;

  openSheet('checkout-modal');
}

function closeCheckout() { closeSheet('checkout-modal'); }

function nextCheckoutStep() {
  if (currentCheckoutStep !== 1) return;

  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const address = document.getElementById('checkout-address').value.trim();

  if (!name)    return showToast('請填寫收件人姓名', 'error');
  if (!phone)   return showToast('請填寫聯絡電話', 'error');
  if (!address) return showToast('請填寫外送地址', 'error');

  ga4_addPaymentInfo(selectedPayment);
  currentCheckoutStep = 2;
  updateCheckoutUI();
}

function prevCheckoutStep() {
  if (currentCheckoutStep === 2) {
    currentCheckoutStep = 1;
    updateCheckoutUI();
  }
}

function selectPayment(type) {
  selectedPayment = type;

  const cc = document.getElementById('pay-cc');
  const line = document.getElementById('pay-line');

  [cc, line].forEach(el => {
    el.classList.remove('border-gold-500', 'bg-gold-900/20');
    el.classList.add('border-gray-700', 'bg-dark-800');
    const chk = el.querySelector('.check-icon');
    if (chk) chk.remove();
  });

  const sel = type === '信用卡' ? cc : line;
  sel.classList.remove('border-gray-700', 'bg-dark-800');
  sel.classList.add('border-gold-500', 'bg-gold-900/20');
  sel.insertAdjacentHTML('beforeend',
    '<span class="absolute top-2 right-2 text-gold-500 text-sm check-icon"><i class="fa-solid fa-circle-check"></i></span>');
  sel.querySelector('input').checked = true;

  ga4_addPaymentInfo(type);
}

function updateCheckoutUI() {
  const steps = [1, 2, 3].map(n => document.getElementById(`checkout-step-${n}`));
  steps.forEach(s => s.classList.add('hidden'));

  const progress = document.getElementById('checkout-progress');
  const title = document.getElementById('checkout-title');
  const closeBtn = document.getElementById('checkout-close-btn');

  steps[currentCheckoutStep - 1].classList.remove('hidden');

  if (currentCheckoutStep === 1) {
    progress.style.width = '50%';
    title.textContent = '填寫配送資訊';
    closeBtn.classList.remove('hidden');
  } else if (currentCheckoutStep === 2) {
    progress.style.width = '100%';
    title.textContent = '選擇尊榮付款方式';
    closeBtn.classList.remove('hidden');
  } else {
    title.textContent = '';
    closeBtn.classList.add('hidden');
  }
}

function completePurchase() {
  const transactionId = 'LXR_' + Math.random().toString(36).slice(2, 11).toUpperCase();

  ga4_purchase(transactionId, selectedPayment);

  const order = {
    id: transactionId,
    payment: selectedPayment,
    name: document.getElementById('checkout-name').value.trim(),
    phone: document.getElementById('checkout-phone').value.trim(),
    address: document.getElementById('checkout-address').value.trim(),
    items: cartItems(),
    total: cartValue(),
    createdAt: new Date().toISOString(),
    offline: !navigator.onLine
  };

  const note = document.getElementById('order-note');
  document.getElementById('order-id').textContent = `訂單編號 ${transactionId}`;

  // 先把畫面切到完成頁，不讓客人等資料庫回應
  note.textContent = navigator.onLine
    ? '專屬騎士將火速為您送達指定地址'
    : '目前離線，訂單已暫存於裝置，恢復連線後將自動送出。';

  currentCheckoutStep = 3;
  updateCheckoutUI();

  cart = [];
  updateCartUI();

  // 背景寫入 Supabase；失敗或離線就排入佇列等下次補送
  if (typeof Orders !== 'undefined' && Orders.isConfigured()) {
    Orders.save(order).then(ok => {
      if (!ok) {
        queueOrder(order);
        if (currentCheckoutStep === 3) {
          note.textContent = '訂單已暫存於裝置，恢復連線後將自動送出。';
        }
      }
    });
  } else if (!navigator.onLine) {
    queueOrder(order);
  }
}

function queueOrder(order) {
  try {
    const list = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
    list.push(order);
    localStorage.setItem(ORDER_KEY, JSON.stringify(list));
  } catch (e) { /* 忽略 */ }

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(reg => reg.sync.register('sync-orders'))
      .catch(() => {});
  }
}

async function flushQueuedOrders() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]'); } catch (e) { return; }
  if (!list.length || !navigator.onLine) return;

  // 有接 Supabase：真的送出去，只清掉成功的那幾筆
  if (typeof Orders !== 'undefined' && Orders.isConfigured()) {
    const sentIds = await Orders.saveMany(list);
    if (!sentIds.length) return;   // 全失敗就保留佇列，下次再試

    const remaining = list.filter(o => !sentIds.includes(o.id));
    try {
      if (remaining.length) localStorage.setItem(ORDER_KEY, JSON.stringify(remaining));
      else localStorage.removeItem(ORDER_KEY);
    } catch (e) { /* 忽略 */ }

    showToast(`已補送 ${sentIds.length} 筆離線訂單`);
    return;
  }

  // 沒接資料庫：僅補送 GA4 事件後清空
  list.forEach(o => {
    gtag('event', 'purchase', {
      transaction_id: o.id, value: o.total, currency: 'TWD',
      payment_type: o.payment, items: o.items
    });
  });
  try { localStorage.removeItem(ORDER_KEY); } catch (e) { /* 忽略 */ }
  showToast(`已補送 ${list.length} 筆離線訂單`);
}

function finishAndClose() {
  closeCheckout();
  ['checkout-name', 'checkout-phone', 'checkout-address']
    .forEach(id => { document.getElementById(id).value = ''; });
}

/* ============================================================
   Toast
   ============================================================ */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  const icon = type === 'success'
    ? '<i class="fa-solid fa-circle-check text-gold-500"></i>'
    : '<i class="fa-solid fa-circle-exclamation text-red-500"></i>';

  toast.className =
    `bg-dark-800 px-4 sm:px-5 py-3.5 rounded-xl shadow-2xl border-l-4 ${
      type === 'success' ? 'border-gold-500' : 'border-red-500'
    } flex items-center gap-3 toast-enter pointer-events-auto border-y border-r border-gray-700`;
  toast.innerHTML = `${icon}<span class="text-sm font-medium text-white flex-1">${esc(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.cssText = 'opacity:0;transform:translateY(20px);transition:all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ---------- 啟動 ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
