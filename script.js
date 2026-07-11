/* ==========================================
   FOLD — Main JavaScript
   ========================================== */
'use strict';

// ==================== 1. CART MODULE ====================

const Cart = {
  getItems() {
    try {
      return JSON.parse(localStorage.getItem('fold_cart')) || [];
    } catch {
      return [];
    }
  },

  saveItems(items) {
    localStorage.setItem('fold_cart', JSON.stringify(items));
    this.updateUI();
    document.dispatchEvent(new CustomEvent('cart-updated'));
  },

  add(product, color, size, qty = 1) {
    const items = this.getItems();
    const existing = items.find(
      item => item.id === product.id && item.color === color && item.size === size
    );

    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        color: color,
        size: size,
        qty: qty
      });
    }

    this.saveItems(items);
    this.showToast(`${product.name} added to cart`);
  },

  remove(index) {
    const items = this.getItems();
    items.splice(index, 1);
    this.saveItems(items);
  },

  updateQty(index, qty) {
    const items = this.getItems();
    if (qty <= 0) {
      items.splice(index, 1);
    } else {
      items[index].qty = qty;
    }
    this.saveItems(items);
  },

  getCount() {
    return this.getItems().reduce((sum, item) => sum + item.qty, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  getShipping() {
    const sub = this.getSubtotal();
    return sub >= 1000 ? 0 : 50;
  },

  getTotal() {
    return this.getSubtotal() + this.getShipping();
  },

  clear() {
    localStorage.removeItem('fold_cart');
    this.updateUI();
  },

  showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.innerHTML = `Added to cart — <span class="toast-accent">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  },

  updateUI() {
    this.updateBadge();
    this.renderDrawer();
    this.renderCartPage();
    this.renderCheckoutSummary();
  },

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = this.getCount();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  },

  // -- Cart Drawer --
  renderDrawer() {
    const container = document.getElementById('cart-drawer-items');
    const totalEl = document.getElementById('cart-drawer-total');
    if (!container) return;

    const items = this.getItems();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-drawer-empty">
          <p>Your cart is empty</p>
          <a href="shop.html" class="btn btn-outline btn-sm">Shop Now</a>
        </div>
      `;
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

  // -- Cart Page --
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

  // -- Checkout Summary --
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

// ==================== 2. WISHLIST MODULE ====================

const Wishlist = {
  getItems() {
    try {
      return JSON.parse(localStorage.getItem('fold_wishlist')) || [];
    } catch {
      return [];
    }
  },

  saveItems(items) {
    localStorage.setItem('fold_wishlist', JSON.stringify(items));
  },

  toggle(productId) {
    let items = this.getItems();
    const idx = items.indexOf(productId);
    if (idx > -1) {
      items.splice(idx, 1);
    } else {
      items.push(productId);
    }
    this.saveItems(items);
    this.updateUI(productId);
    return idx === -1;
  },

  has(productId) {
    return this.getItems().includes(productId);
  },

  updateUI(productId) {
    document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`).forEach(btn => {
      btn.classList.toggle('active', this.has(productId));
    });
  }
};

// ==================== 3. UI HELPERS ====================

function formatPrice(price) {
  return price.toLocaleString('en-EG') + ' EGP';
}

function getProductById(id) {
  return products.find(p => p.id === Number(id));
}

function getProductsByCategory(category) {
  if (!category || category === 'all') return products;
  return products.filter(p => p.category === category);
}

function renderSkeletonGrid(container, count = 6) {
  if (!container) return;
  container.innerHTML = '<div class="skeleton-grid">' + Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton-card-image"></div>
      <div class="skeleton-card-body">
        <div class="skeleton-line shorter"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('') + '</div>';
}

function renderProductCards(productsArr, container) {
  if (!container) return '';
  const wishlistedIds = Wishlist.getItems();

  container.innerHTML = productsArr.map(p => {
    const isWishlisted = wishlistedIds.includes(p.id);
    return `
    <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-card-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <button class="wishlist-btn${isWishlisted ? ' active' : ''}" data-id="${p.id}"
          onclick="event.stopPropagation(); Wishlist.toggle(${p.id})"
          aria-label="Add to wishlist">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button class="btn btn-primary btn-sm add-to-cart-btn" 
          onclick="event.stopPropagation(); quickAdd(${p.id})"
          data-id="${p.id}">
          Add to Cart
        </button>
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${p.category}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-price">${formatPrice(p.price)}</div>
      </div>
    </div>
  `}).join('');
}

function quickAdd(productId) {
  const product = getProductById(productId);
  if (!product) return;
  const color = product.colors[0].name;
  const size = product.sizes ? product.sizes[0] : 'S';
  Cart.add(product, color, size, 1);
}

function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '#';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==================== 4. WHATSAPP INTEGRATION ====================

const WHATSAPP_NUMBER = '201027993246';
const INSTAPAY_PHONE = '01X XXX XXX XX';
const INSTAPAY_NAME = 'Your Name Here';

function generateWhatsAppUrl(customerName, customerPhone, address, items, total, paymentMethod) {
  const itemLines = items.map((item, i) => {
    const variant = item.color || '';
    const size = item.size || '';
    const details = [variant, size].filter(Boolean).join(', ');
    return `${i + 1}. ${item.name}${details ? ' (' + details + ')' : ''} x ${item.qty} - ${formatPrice(item.price * item.qty)}`;
  }).join('\n');

  const message = [
    '*New Order - Fold*',
    '',
    `*Customer:* ${customerName}`,
    `*Phone:* ${customerPhone}`,
    `*Address:* ${address}`,
    `*Payment:* ${paymentMethod === 'instapay' ? 'InstaPay' : 'Cash on Delivery'}`,
    '',
    '*Items:*',
    itemLines,
    '',
    `*Subtotal:* ${formatPrice(Cart.getSubtotal())}`,
    `*Delivery:* ${Cart.getShipping() === 0 ? 'Free' : formatPrice(Cart.getShipping())}`,
    `*Total:* ${formatPrice(total)}`
  ].join('\n');

  return `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}

function openWhatsApp(waUrl) {
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(navigator.userAgent);
  if (isMobile) {
    window.open(waUrl, '_blank');
  } else {
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ==================== 5. LIGHTBOX ====================

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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ==================== 6. PAGE-SPECIFIC INIT ====================

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

  // Read URL params on load
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get('category');
  if (urlCategory) {
    activeCategory = urlCategory;
  }

  function filterProducts() {
    let filtered = [...products];

    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (activePriceRange) {
      filtered = filtered.filter(p =>
        p.price >= activePriceRange.min && p.price <= activePriceRange.max
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    renderProductCards(filtered, grid);
  }

  // Activate URL category button
  if (urlCategory) {
    categoryBtns.forEach(btn => {
      if (btn.dataset.category === urlCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  search.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    filterProducts();
  });

  sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    filterProducts();
  });

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      filterProducts();
    });
  });

  priceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      priceBtns.forEach(b => b.classList.remove('active'));

      if (wasActive) {
        activePriceRange = null;
      } else {
        btn.classList.add('active');
        const min = parseInt(btn.dataset.min);
        const max = parseInt(btn.dataset.max);
        activePriceRange = { min, max };
      }
      filterProducts();
    });
  });

  // Show skeleton, then render with a tiny delay so it shows
  renderSkeletonGrid(grid);
  requestAnimationFrame(() => filterProducts());
}

function initProductPage() {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const product = getProductById(productId);

  if (!product) {
    container.innerHTML = '<div class="text-center" style="padding: 4rem 1rem;"><h2>Product not found</h2><a href="shop.html" class="btn btn-outline mt-3">Back to Shop</a></div>';
    return;
  }

  let selectedColor = product.colors[0].name;
  let selectedSize = product.sizes ? product.sizes[0] : 'S';
  let quantity = 1;

  function renderProduct() {
    const imagesHtml = product.images.map((img, i) =>
      `<img src="${img}" alt="${product.name}" class="product-thumbnail${i === 0 ? ' active' : ''}" onclick="switchImage(this, '${img}')">`
    ).join('');

    const colorsHtml = product.colors.map(c =>
      `<button class="color-swatch${c.name === selectedColor ? ' active' : ''}" style="background: ${c.hex}" title="${c.name}" onclick="selectColor('${c.name}', this)"></button>`
    ).join('');

    const sizesHtml = product.sizes.map(s =>
      `<button class="size-btn${s === selectedSize ? ' active' : ''}" onclick="selectSize('${s}', this)">${s}</button>`
    ).join('');

    container.innerHTML = `
      <div class="product-images">
        <div class="product-main-image" onclick="openLightbox(document.getElementById('main-image').src)" style="cursor: zoom-in;">
          <img src="${product.image}" alt="${product.name}" id="main-image">
        </div>
        <div class="product-thumbnails">${imagesHtml}</div>
      </div>
      <div class="product-info">
        <div class="product-info-category">${product.category}</div>
        <h1>${product.name}</h1>
        <div class="product-info-price">${formatPrice(product.price)}</div>
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
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-primary add-to-cart-detail" onclick="addFromDetail()" style="flex: 1; margin-bottom: 0;">Add to Cart — ${formatPrice(product.price * quantity)}</button>
          <button class="wishlist-btn-detail${Wishlist.has(product.id) ? ' active' : ''}" onclick="Wishlist.toggle(${product.id}); this.classList.toggle('active');" aria-label="Toggle wishlist">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="${Wishlist.has(product.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Expose functions globally for onclick
    window.switchImage = function(el, src) {
      document.querySelectorAll('.product-thumbnail').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('main-image').src = src;
    };

    window.selectColor = function(color, el) {
      selectedColor = color;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
      const label = document.querySelector('.option-group:first-child .option-label');
      if (label) label.textContent = `Color: ${color}`;
    };

    window.selectSize = function(size, el) {
      selectedSize = size;
      document.querySelectorAll('.size-btn').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
    };

    window.updateQty = function(delta) {
      const input = document.getElementById('qty-input');
      let val = parseInt(input.value) + delta;
      if (val < 1) val = 1;
      if (val > 99) val = 99;
      input.value = val;
      quantity = val;
      const btn = document.querySelector('.add-to-cart-detail');
      if (btn) btn.textContent = `Add to Cart — ${formatPrice(product.price * quantity)}`;
    };

    window.setQty = function(val) {
      let v = parseInt(val);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 99) v = 99;
      quantity = v;
      document.getElementById('qty-input').value = v;
      const btn = document.querySelector('.add-to-cart-detail');
      if (btn) btn.textContent = `Add to Cart — ${formatPrice(product.price * quantity)}`;
    };

    window.addFromDetail = function() {
      Cart.add(product, selectedColor, selectedSize, quantity);
    };
  }

  renderProduct();
}

function initCheckoutPage() {
  const form = document.getElementById('checkout-form');
  const submitBtn = document.getElementById('place-order-btn');
  if (!form) return;

  Cart.renderCheckoutSummary();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;

    const name = document.getElementById('cust-name');
    const phone = document.getElementById('cust-phone');
    const address = document.getElementById('cust-address');

    [name, phone, address].forEach(el => el.closest('.form-group').classList.remove('error'));

    if (!name.value.trim()) {
      name.closest('.form-group').classList.add('error');
      valid = false;
    }

    if (!phone.value.trim()) {
      phone.closest('.form-group').classList.add('error');
      valid = false;
    }

    if (!address.value.trim()) {
      address.closest('.form-group').classList.add('error');
      valid = false;
    }

    if (!valid) return;

    const items = Cart.getItems();
    if (items.length === 0) {
      Cart.showToast('Your cart is empty');
      return;
    }

    const paymentEl = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentEl ? paymentEl.value : 'cod';

    const total = Cart.getTotal();
    const waUrl = generateWhatsAppUrl(
      name.value.trim(),
      phone.value.trim(),
      address.value.trim(),
      items,
      total,
      paymentMethod
    );

    const orderId = generateOrderId();
    const confirmationUrl = `confirmation.html?order=${encodeURIComponent(orderId)}&total=${total}&payment=${paymentMethod}`;

    openWhatsApp(waUrl);
    Cart.clear();
    window.location.href = confirmationUrl;
  });
}

function initConfirmationPage() {
  const container = document.getElementById('confirmation-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order') || '#FOLD-2026';
  const total = params.get('total');
  const payment = params.get('payment');

  const items = Cart.getItems();

  let paymentHtml = '';
  if (payment === 'instapay') {
    paymentHtml = `
      <div class="instapay-details">
        <h3>Pay via InstaPay</h3>
        <p>Send the exact amount and use your order number as reference.</p>
        <div class="instapay-qr-placeholder">QR code placeholder<br>Replace with images/instapay-qr.png</div>
        <div class="instapay-account">
          <div class="instapay-row">
            <span>Account</span>
            <strong>${INSTAPAY_PHONE}</strong>
          </div>
          <div class="instapay-row">
            <span>Name</span>
            <strong>${INSTAPAY_NAME}</strong>
          </div>
          <div class="instapay-row">
            <span>Amount</span>
            <strong>${total ? formatPrice(Number(total)) : ''}</strong>
          </div>
          <div class="instapay-row">
            <span>Reference</span>
            <strong>${orderId}</strong>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="confirmation-icon">✓</div>
    <h1>Thank You!</h1>
    <p class="order-number">Order <strong>${orderId}</strong></p>
    <p>Your order has been sent via WhatsApp. We\u2019ll confirm your order shortly.</p>
    <div class="confirmation-details">
      <h3>Order Summary</h3>
      ${items.length > 0 ? items.map(item => `
        <div class="confirmation-item">
          <span>${item.name} (${item.color}${item.size ? ', ' + item.size : ''}) \u00d7 ${item.qty}</span>
          <span>${formatPrice(item.price * item.qty)}</span>
        </div>
      `).join('') : '<p style="color: var(--text-light);">Order details have been sent to WhatsApp.</p>'}
      <div class="confirmation-item" style="font-weight: 600; border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.5rem;">
        <span>Total</span>
        <span>${total ? formatPrice(Number(total)) : ''}</span>
      </div>
    </div>
    ${paymentHtml}
    <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
  `;
}

function initFaqPage() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = 'Thank you! We\u2019ll get back to you soon.';
    Cart.showToast(msg);
    form.reset();
  });
}

// ==================== 7. GENERAL INIT ====================

function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('active');
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('active');
    });
  });
}

function initCartDrawer() {
  const cartBtn = document.getElementById('cart-btn');
  const closeBtn = document.getElementById('cart-close');
  const overlay = document.getElementById('cart-overlay');

  cartBtn.addEventListener('click', () => Cart.openDrawer());
  closeBtn.addEventListener('click', () => Cart.closeDrawer());
  overlay.addEventListener('click', () => Cart.closeDrawer());
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page) link.classList.add('active');
    if (page === 'index.html' && href === 'index.html') link.classList.add('active');
  });
}

// ==================== 8. INIT ON LOAD ====================

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateUI();
  initMobileNav();
  initCartDrawer();
  setActiveNav();

  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'shop.html') initShopPage();
  if (page === 'product.html') initProductPage();
  if (page === 'cart.html') Cart.renderCartPage();
  if (page === 'checkout.html') initCheckoutPage();
  if (page === 'confirmation.html') initConfirmationPage();
  if (page === 'faq.html') initFaqPage();
  if (page === 'contact.html') initContactForm();

  // Newsletter
  const nForm = document.getElementById('newsletter-form');
  if (nForm) {
    nForm.addEventListener('submit', (e) => {
      e.preventDefault();
      Cart.showToast('Thanks for subscribing!');
      nForm.reset();
    });
  }
});
