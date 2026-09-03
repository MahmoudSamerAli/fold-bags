/* ==========================================
   FOLD — Main JavaScript
   Static storefront, Cash on Delivery only.
   ========================================== */
'use strict';

/* ==================== CONFIG ==================== */
const WHATSAPP_NUMBER = '201027993246';
const FREE_SHIPPING_MIN = 1000;
const SHIPPING_FEE = 50;

/* ==================== THEME ==================== */
const THEME_KEY = 'fold_theme';
const getSavedTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; }; };
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
};
const toggleTheme = () => applyTheme(getSavedTheme() === 'dark' ? 'light' : 'dark');

function updateToggleButtons() {
  const active = getSavedTheme() === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach(b => {
    const label = b.querySelector('.theme-toggle-label');
    if (label) label.textContent = active ? 'Light' : 'Dark';
    b.setAttribute('aria-pressed', active);
  });
}

function injectThemeToggle() {
  const host = document.querySelector('.header-actions');
  if (!host || document.querySelector('[data-theme-toggle]')) return;
  const active = getSavedTheme() === 'dark';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  btn.setAttribute('data-theme-toggle', '');
  btn.setAttribute('aria-pressed', active);
  btn.setAttribute('aria-label', 'Toggle light/dark mode');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span class="theme-toggle-label">' + (active ? 'Light' : 'Dark') + '</span>';
  btn.addEventListener('click', () => { toggleTheme(); updateToggleButtons(); });
  host.insertBefore(btn, host.firstChild);
}

function initTheme() {
  applyTheme(getSavedTheme());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectThemeToggle(); updateToggleButtons(); });
  } else {
    injectThemeToggle();
    updateToggleButtons();
  }
}
initTheme();

/* ==================== PRODUCTS ==================== */
// Products now come from the public /api/products endpoint (D1-backed).
// data/products.js (FOLD_PRODUCTS) is kept as the offline fallback / seed.
let products = (typeof FOLD_PRODUCTS !== 'undefined') ? FOLD_PRODUCTS.slice() : [];
let catalogLoaded = false;
const CATEGORIES = (typeof FOLD_CATEGORIES !== 'undefined') ? FOLD_CATEGORIES : [
  { slug: 'all', label: 'All Products' },
  { slug: 'backpacks', label: 'Backpacks' },
  { slug: 'totes', label: 'Tote Bags' },
  { slug: 'crossbody', label: 'Crossbody' }
];
const getProductById = (id) => products.find(p => p.id === Number(id));

async function initCatalog() {
  if (catalogLoaded) return products;
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length) {
        products = data.products;
      }
    }
  } catch (e) {
    // Offline or API unavailable — keep the bundled FOLD_PRODUCTS fallback.
  }
  catalogLoaded = true;
  return products;
}

/* ==================== HELPERS ==================== */
const formatPrice = (price) => price.toLocaleString('en-EG') + ' EGP';

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.innerHTML = `<span class="toast-accent">${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
}

function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '#';
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

/* ==================== CART ==================== */
const Cart = {
  getItems() { try { return JSON.parse(localStorage.getItem('fold_cart')) || []; } catch { return []; } },
  saveItems(items) {
    localStorage.setItem('fold_cart', JSON.stringify(items));
    this.updateUI();
    document.dispatchEvent(new CustomEvent('cart-updated'));
  },

  add(product, color, size, qty = 1) {
    const items = this.getItems();
    const existing = items.find(i => i.id === product.id && i.color === color && i.size === size);
    if (existing) existing.qty += qty;
    else items.push({ id: product.id, name: product.name, price: product.price, image: product.image, color, size, qty });
    this.saveItems(items);
    showToast(`${product.name} added to cart`);
  },

  remove(index) { const items = this.getItems(); items.splice(index, 1); this.saveItems(items); },

  updateQty(index, qty) {
    const items = this.getItems();
    if (qty <= 0) items.splice(index, 1);
    else items[index].qty = qty;
    this.saveItems(items);
  },

  getCount() { return this.getItems().reduce((s, i) => s + i.qty, 0); },
  getSubtotal() { return this.getItems().reduce((s, i) => s + i.price * i.qty, 0); },
  getShipping() { return this.getSubtotal() >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE; },
  getTotal() { return this.getSubtotal() + this.getShipping(); },
  clear() { localStorage.removeItem('fold_cart'); this.updateUI(); },

  updateUI() { this.updateBadge(); this.renderDrawer(); this.renderCartPage(); this.renderCheckoutSummary(); },

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = this.getCount();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  },

  renderDrawer() {
    const container = document.getElementById('cart-drawer-items');
    const totalEl = document.getElementById('cart-drawer-total');
    if (!container) return;
    const items = this.getItems();
    if (items.length === 0) {
      container.innerHTML = `<div class="cart-drawer-empty"><p>Your cart is empty</p><a href="shop.html" class="btn btn-outline btn-sm">Shop Now</a></div>`;
      if (totalEl) totalEl.textContent = '0 EGP';
      return;
    }
    container.innerHTML = items.map((item, i) => `
      <div class="cart-drawer-item">
        <img src="${item.image}" alt="${item.name}" class="cart-drawer-item-image">
        <div class="cart-drawer-item-details">
          <div class="cart-drawer-item-name">${item.name}</div>
          <div class="cart-drawer-item-variant">${item.color}${item.size ? ', ' + item.size : ''}</div>
          <div class="cart-drawer-item-bottom">
            <div class="cart-drawer-item-qty">
              <button onclick="Cart.updateQty(${i}, ${item.qty - 1})">−</button>
              <span>${item.qty}</span>
              <button onclick="Cart.updateQty(${i}, ${item.qty + 1})">+</button>
            </div>
            <span class="cart-drawer-item-price">${formatPrice(item.price * item.qty)}</span>
          </div>
          <button class="cart-drawer-item-remove" onclick="Cart.remove(${i})">Remove</button>
        </div>
      </div>
    `).join('');
    if (totalEl) totalEl.textContent = formatPrice(this.getTotal());
  },

  openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  renderCartPage() {
    const container = document.getElementById('cart-page-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    const emptyEl = document.getElementById('cart-empty');
    const layoutEl = document.getElementById('cart-layout');
    if (!container) return;
    const items = this.getItems();
    if (items.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (layoutEl) layoutEl.style.display = 'none';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    if (layoutEl) layoutEl.style.display = 'grid';
    container.innerHTML = items.map((item, i) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h3>${item.name}</h3>
          <p>${item.color}${item.size ? ' — ' + item.size : ''}</p>
          <div class="cart-item-actions">
            <div class="cart-item-qty">
              <button onclick="Cart.updateQty(${i}, ${item.qty - 1})">−</button>
              <span>${item.qty}</span>
              <button onclick="Cart.updateQty(${i}, ${item.qty + 1})">+</button>
            </div>
            <button class="cart-item-remove" onclick="Cart.remove(${i})">Remove</button>
          </div>
        </div>
        <div class="cart-item-total">${formatPrice(item.price * item.qty)}</div>
      </div>
    `).join('');
    if (subtotalEl) subtotalEl.textContent = formatPrice(this.getSubtotal());
    if (shippingEl) shippingEl.textContent = this.getShipping() === 0 ? 'Free' : formatPrice(this.getShipping());
    if (totalEl) totalEl.textContent = formatPrice(this.getTotal());
  },

  renderCheckoutSummary() {
    const container = document.getElementById('checkout-summary-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');
    if (!container) return;
    const items = this.getItems();
    if (items.length === 0) {
      container.innerHTML = '<p style="color: var(--text-light);">Your cart is empty</p>';
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="checkout-summary-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="checkout-summary-item-info">
          <h4>${item.name}</h4>
          <p>${item.color}${item.size ? ', ' + item.size : ''} × ${item.qty}</p>
        </div>
        <span class="checkout-summary-item-price">${formatPrice(item.price * item.qty)}</span>
      </div>
    `).join('');
    if (subtotalEl) subtotalEl.textContent = formatPrice(this.getSubtotal());
    if (shippingEl) shippingEl.textContent = this.getShipping() === 0 ? 'Free' : formatPrice(this.getShipping());
    if (totalEl) totalEl.textContent = formatPrice(this.getTotal());
  }
};

/* ==================== WISHLIST ==================== */
const Wishlist = {
  getItems() { try { return JSON.parse(localStorage.getItem('fold_wishlist')) || []; } catch { return []; } },
  saveItems(items) { localStorage.setItem('fold_wishlist', JSON.stringify(items)); },
  toggle(productId) {
    let items = this.getItems();
    const idx = items.indexOf(productId);
    if (idx > -1) items.splice(idx, 1);
    else items.push(productId);
    this.saveItems(items);
    this.updateUI(productId);
    return idx === -1;
  },
  has(productId) { return this.getItems().includes(productId); },
  updateUI(productId) {
    document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`).forEach(btn => {
      btn.classList.toggle('active', this.has(productId));
    });
  }
};

/* ==================== PRODUCT CARDS ==================== */
function renderProductCards(productsArr, container) {
  if (!container) return;
  const wishlistedIds = Wishlist.getItems();
  container.innerHTML = productsArr.map(p => {
    const isWish = wishlistedIds.includes(p.id);
    return `
    <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-card-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <button class="wishlist-btn${isWish ? ' active' : ''}" data-id="${p.id}"
          onclick="event.stopPropagation(); Wishlist.toggle(${p.id})" aria-label="Add to wishlist">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${isWish ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <button class="btn btn-primary btn-sm add-to-cart-btn"
          onclick="event.stopPropagation(); quickAdd(${p.id})" data-id="${p.id}">Add to Cart</button>
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${p.brand}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">${formatPrice(p.price)}</div>
      </div>
    </div>`;
  }).join('');
}

function quickAdd(productId) {
  const product = getProductById(productId);
  if (!product) return;
  const color = product.colors[0].name;
  const size = product.sizes[0];
  Cart.add(product, color, size, 1);
}

/* ==================== WHATSAPP (COD) ==================== */
function buildWhatsAppMessage(customerName, customerPhone, address, city, items, total) {
  const itemLines = items.map((item, i) => {
    const variant = [item.color, item.size].filter(Boolean).join(', ');
    return `${i + 1}. ${item.name}${variant ? ' (' + variant + ')' : ''} x ${item.qty} - ${formatPrice(item.price * item.qty)}`;
  }).join('\n');
  const fullAddress = address + (city ? ', ' + city : '');
  const message = [
    '*New Order - Fold (Cash on Delivery)*',
    '',
    `*Customer:* ${customerName}`,
    `*Phone:* ${customerPhone}`,
    `*Address:* ${fullAddress}`,
    `*Payment:* Cash on Delivery`,
    '',
    '*Items:*',
    itemLines,
    '',
    `*Subtotal:* ${formatPrice(Cart.getSubtotal())}`,
    `*Delivery:* ${Cart.getShipping() === 0 ? 'Free' : formatPrice(Cart.getShipping())}`,
    `*Total:* ${formatPrice(total)}`
  ].join('\n');
  return message;
}

function openWhatsApp(message) {
  const encoded = encodeURIComponent(message);
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(navigator.userAgent);

  // Mobile: deep-link straight into the WhatsApp app
  // Desktop: open WhatsApp Web directly (no intermediate page)
  const url = isMobile
    ? `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;

  if (isMobile) {
    window.open(url, '_blank');
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/* ==================== SAVE ORDER (Cloudflare D1) ==================== */
async function saveOrderApi(payload) {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) return;
  } catch (e) { /* offline fallback: proceed anyway */ }
}

/* ==================== PAGE: CHECKOUT (COD only) ==================== */
function initCheckoutPage() {
  const form = document.getElementById('checkout-form');
  const totalDisplay = document.getElementById('checkout-total-display');
  if (!form) return;
  Cart.renderCheckoutSummary();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('place-order-btn');
    if (submitBtn.disabled) return;

    let valid = true;
    const name = document.getElementById('cust-name');
    const phone = document.getElementById('cust-phone');
    const city = document.getElementById('cust-city');
    const address = document.getElementById('cust-address');

    [name, phone, address].forEach(el => el && el.closest('.form-group').classList.remove('error'));

    if (!name.value.trim()) { name.closest('.form-group').classList.add('error'); valid = false; }
    if (!/^(?:\+20|0)1[0-9]{9}$/.test(phone.value.trim())) {
      phone.closest('.form-group').classList.add('error');
      phone.closest('.form-group').querySelector('.error-text').textContent = 'Enter a valid Egyptian phone number';
      valid = false;
    }
    if (!address.value.trim()) { address.closest('.form-group').classList.add('error'); valid = false; }

    const items = Cart.getItems();
    if (items.length === 0) { showToast('Your cart is empty'); return; }

    if (!valid) return;

    const orderId = generateOrderId();
    const payload = {
      order_id: orderId,
      customer_name: name.value.trim(),
      customer_phone: phone.value.trim(),
      city: city.value.trim(),
      address: address.value.trim(),
      payment_method: 'cod',
      items,
      subtotal: Cart.getSubtotal(),
      shipping: Cart.getShipping(),
      total: Cart.getTotal()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing Order...';

    sessionStorage.setItem('fold_last_order', JSON.stringify({ items, total: Cart.getTotal() }));

    const waMsg = buildWhatsAppMessage(payload.customer_name, payload.customer_phone, payload.address, payload.city, items, payload.total);

    await saveOrderApi(payload);   // store in D1 (non-blocking on failure)
    Cart.clear();
    openWhatsApp(waMsg);
    window.location.href = `confirmation.html?order=${encodeURIComponent(orderId)}&total=${payload.total}`;
  });

  const updateTotal = () => {
    if (totalDisplay) totalDisplay.textContent = formatPrice(Cart.getTotal());
  };
  updateTotal();
  document.addEventListener('cart-updated', updateTotal);
}

/* ==================== PAGE: CONFIRMATION (COD) ==================== */
function initConfirmationPage() {
  const container = document.getElementById('confirmation-content');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order') || '#FOLD-2026';
  const total = params.get('total');
  const saved = JSON.parse(sessionStorage.getItem('fold_last_order') || '{}');
  const items = saved.items || [];
  sessionStorage.removeItem('fold_last_order');

  container.innerHTML = `
    <div class="confirmation-content">
      <div class="confirmation-icon">✓</div>
      <h1>Thank You!</h1>
      <p class="order-number">Order <strong>${orderId}</strong></p>
      <p>Your order has been placed successfully. We've sent the details via WhatsApp and will confirm shortly. You'll pay <strong>Cash on Delivery</strong> when your order arrives.</p>
      <div class="confirmation-details">
        <h3>Order Summary</h3>
        ${items.length > 0 ? items.map(item => `
          <div class="confirmation-item"><span>${item.name} (${item.color}${item.size ? ', ' + item.size : ''}) × ${item.qty}</span><span>${formatPrice(item.price * item.qty)}</span></div>
        `).join('') : '<p style="color: var(--text-light);">Order details have been sent.</p>'}
        <div class="confirmation-item" style="font-weight:600;border-top:1px solid var(--border);padding-top:.75rem;margin-top:.5rem;"><span>Total</span><span>${total ? formatPrice(Number(total)) : ''}</span></div>
      </div>
      <div class="notice">Payment method: <strong>Cash on Delivery</strong>. No online payment is required for this order.</div>
      <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
    </div>
  `;
}

/* ==================== PAGE: SHOP ==================== */
function initShopPage() {
  const grid = document.getElementById('shop-grid');
  const search = document.getElementById('filter-search');
  const sortSelect = document.getElementById('filter-sort');
  const categoryBtns = document.querySelectorAll('.filter-categories .filter-btn');
  const priceBtns = document.querySelectorAll('.filter-prices .filter-btn');
  if (!grid) return;

  let activeCategory = 'all';
  let activePriceRange = null;
  let searchQuery = '';
  let sortBy = 'default';

  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get('category');
  if (urlCategory) activeCategory = urlCategory;

  function filterProducts() {
    let filtered = [...products];
    if (activeCategory !== 'all') filtered = filtered.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (activePriceRange) filtered = filtered.filter(p => p.price >= activePriceRange.min && p.price <= activePriceRange.max);
    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    renderProductCards(filtered, grid);
  }

  if (urlCategory) {
    categoryBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.category === urlCategory));
  }

  search.addEventListener('input', (e) => { searchQuery = e.target.value; filterProducts(); });
  sortSelect.addEventListener('change', (e) => { sortBy = e.target.value; filterProducts(); });
  categoryBtns.forEach(btn => btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    filterProducts();
  }));
  priceBtns.forEach(btn => btn.addEventListener('click', () => {
    const wasActive = btn.classList.contains('active');
    priceBtns.forEach(b => b.classList.remove('active'));
    if (wasActive) activePriceRange = null;
    else {
      btn.classList.add('active');
      activePriceRange = { min: parseInt(btn.dataset.min), max: parseInt(btn.dataset.max) };
    }
    filterProducts();
  }));

  filterProducts();
}

/* ==================== PAGE: PRODUCT DETAIL ==================== */
function initProductPage() {
  const container = document.getElementById('product-detail');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get('id'));
  if (!product) {
    container.innerHTML = '<div class="text-center" style="padding:4rem 1rem;"><h2>Product not found</h2><a href="shop.html" class="btn btn-outline mt-3">Back to Shop</a></div>';
    return;
  }

  let selectedColor = product.colors[0].name;
  let selectedSize = product.sizes[0];
  let quantity = 1;

  function renderProduct() {
    const imagesHtml = `<img src="${product.image}" alt="${product.name}" class="product-thumbnail active" onclick="switchImage(this, '${product.image}')">`;
    const colorsHtml = product.colors.map(c =>
      `<button class="color-swatch${c.name === selectedColor ? ' active' : ''}" style="background:${c.hex}" title="${c.name}" onclick="selectColor('${c.name}', this)"></button>`
    ).join('');
    const sizesHtml = product.sizes.map(s =>
      `<button class="size-btn${s === selectedSize ? ' active' : ''}" onclick="selectSize('${s}', this)">${s}</button>`
    ).join('');

    container.innerHTML = `
      <div class="product-images">
        <div class="product-main-image" onclick="openLightbox(document.getElementById('main-image').src)">
          <img src="${product.image}" alt="${product.name}" id="main-image">
        </div>
        <div class="product-thumbnails"></div>
      </div>
      <div class="product-info">
        <div class="product-info-category">${product.brand} · ${product.category}</div>
        <h1>${product.name}</h1>
        <div class="product-info-price">${formatPrice(product.price)}</div>
        <div class="product-info-stock"><span class="stock-ok">In Stock</span></div>
        <p class="product-info-description">${product.description}</p>
        <div class="product-options">
          <div class="option-group">
            <span class="option-label">Color: ${selectedColor}</span>
            <div class="color-swatches">${colorsHtml}</div>
          </div>
          <div class="option-group">
            <span class="option-label">Size</span>
            <div class="size-options">${sizesHtml}</div>
          </div>
          <div class="option-group">
            <span class="option-label">Quantity</span>
            <div class="quantity-selector">
              <button class="quantity-btn" onclick="updateQty(-1)">−</button>
              <input type="number" class="quantity-input" value="${quantity}" min="1" max="99" id="qty-input" onchange="setQty(this.value)">
              <button class="quantity-btn" onclick="updateQty(1)">+</button>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:.75rem;">
          <button class="btn btn-primary add-to-cart-detail" onclick="addFromDetail()" style="flex:1;">Add to Cart — ${formatPrice(product.price * quantity)}</button>
          <button class="wishlist-btn-detail${Wishlist.has(product.id) ? ' active' : ''}" onclick="Wishlist.toggle(${product.id}); this.classList.toggle('active');" aria-label="Toggle wishlist">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="${Wishlist.has(product.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    `;
    const thumbRow = container.querySelector('.product-thumbnails');
    if (thumbRow) thumbRow.innerHTML = imagesHtml;

    window.switchImage = function(el, src) {
      document.querySelectorAll('.product-thumbnail').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('main-image').src = src;
    };
    window.selectColor = function(color, el) {
      selectedColor = color;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
      const label = document.querySelector('.product-options .option-group .option-label');
      if (label) label.textContent = `Color: ${color}`;
    };
    window.selectSize = function(size, el) {
      selectedSize = size;
      document.querySelectorAll('.size-btn').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
    };
    window.updateQty = function(delta) {
      const input = document.getElementById('qty-input');
      let val = (parseInt(input.value) || 1) + delta;
      if (val < 1) val = 1;
      input.value = val;
      quantity = val;
      updateDetailButton();
    };
    window.setQty = function(val) {
      let v = parseInt(val);
      if (isNaN(v) || v < 1) v = 1;
      quantity = v;
      document.getElementById('qty-input').value = v;
      updateDetailButton();
    };
    window.addFromDetail = function() {
      Cart.add(product, selectedColor, selectedSize, quantity);
    };
    function updateDetailButton() {
      const btn = document.querySelector('.add-to-cart-detail');
      if (btn) btn.textContent = `Add to Cart — ${formatPrice(product.price * quantity)}`;
    }
  }

  renderProduct();

  const relatedGrid = document.getElementById('related-grid');
  if (relatedGrid) {
    const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    renderProductCards(related, relatedGrid);
  }
}

/* ==================== PAGE: HOME ==================== */
function initIndexPage() {
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) {
    renderProductCards(products.slice(0, 6), featuredGrid);
  }
  const catGrid = document.getElementById('category-grid');
  if (catGrid) {
    const cats = CATEGORIES.filter(c => c.slug !== 'all');
    catGrid.innerHTML = cats.map(cat => {
      const image = products.find(p => p.category === cat.slug);
      const count = products.filter(p => p.category === cat.slug).length;
      return `
        <a href="shop.html?category=${cat.slug}" class="category-card">
          <img src="${image ? image.image : products[0].image}" alt="${cat.label}" loading="lazy">
          <div class="category-card-overlay">
            <div class="category-card-title">${cat.label}</div>
            <div class="category-card-count">${count} Products</div>
          </div>
        </a>`;
    }).join('');
  }
}

/* ==================== PAGE: FAQ ==================== */
function initFaqPage() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => item.classList.toggle('active'));
  });
}

/* ==================== PAGE: CONTACT ==================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    const text = `*New Inquiry - Fold*\n\n*Name:* ${name || 'Not provided'}\n*Email:* ${email || 'Not provided'}\n*Message:* ${message || 'Not provided'}`;
    openWhatsApp(text);
    showToast('Message sent via WhatsApp!');
    form.reset();
  });
}

/* ==================== LIGHTBOX ==================== */
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('active');
  document.body.style.overflow = '';
}

/* ==================== GENERAL INIT ==================== */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('active');
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileNav.classList.remove('active');
  }));
}

function initCartDrawer() {
  const cartBtn = document.getElementById('cart-btn');
  const closeBtn = document.getElementById('cart-close');
  const overlay = document.getElementById('cart-overlay');
  if (!cartBtn) return;
  cartBtn.addEventListener('click', () => Cart.openDrawer());
  if (closeBtn) closeBtn.addEventListener('click', () => Cart.closeDrawer());
  if (overlay) overlay.addEventListener('click', () => Cart.closeDrawer());
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(link => {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
}

/* ==================== INIT ON LOAD ==================== */
document.addEventListener('DOMContentLoaded', async () => {
  Cart.updateUI();
  initMobileNav();
  initCartDrawer();
  setActiveNav();

  const page = window.location.pathname.split('/').pop() || 'index.html';

  // Only product-dependent pages need the catalog loaded before rendering.
  const needCatalog = ['index.html', '', 'shop.html', 'product.html', 'cart.html'].includes(page);

  if (needCatalog) {
    const loader = document.querySelector('.catalog-loading');
    if (loader) loader.style.display = 'block';
    await initCatalog();
  }

  if (page === 'index.html' || page === '') initIndexPage();
  if (page === 'shop.html') initShopPage();
  if (page === 'product.html') initProductPage();
  if (page === 'cart.html') Cart.renderCartPage();
  if (page === 'checkout.html') initCheckoutPage();
  if (page === 'confirmation.html') initConfirmationPage();
  if (page === 'faq.html') initFaqPage();
  if (page === 'contact.html') initContactForm();

  const nForm = document.getElementById('newsletter-form');
  if (nForm) nForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Thanks for subscribing!');
    nForm.reset();
  });
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
document.addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
