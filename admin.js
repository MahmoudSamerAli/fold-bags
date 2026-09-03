/* ==========================================
   FOLD — Admin Dashboard client
   Depends on functions/api/admin/* endpoints.
   ========================================== */
'use strict';

const API = {
  login: '/api/admin/login',
  orders: '/api/admin/orders',
  products: '/api/admin/products'
};

const TOKEN_KEY = 'fold_admin_token';
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENTS = ['unpaid', 'paid', 'refunded'];
const CATEGORY_LABELS = { crossbody: 'Crossbody', totes: 'Tote Bags', backpacks: 'Backpacks' };

let authToken = localStorage.getItem(TOKEN_KEY) || '';
let currentOrders = [];
let currentProducts = [];
let ordersPage = 1;
const PER = 30;
const prices = (n) => Number(n || 0).toLocaleString('en-EG') + ' EGP';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let editingColors = [];

function renderColorTags() {
  const container = document.getElementById('color-tags');
  if (!container) return;
  container.innerHTML = editingColors.map((c, i) =>
    `<span class="color-tag"><span class="swatch" style="background:${esc(c.hex)}"></span>${esc(c.name)}<button type="button" class="remove-color" data-index="${i}">&times;</button></span>`
  ).join('');
}

function addEditingColor(name, hex) {
  if (!name.trim()) return;
  editingColors.push({ name: name.trim(), hex });
  renderColorTags();
}

function removeEditingColor(index) {
  editingColors.splice(index, 1);
  renderColorTags();
}

function showToast(msg) {
  const t = document.getElementById('admin-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

async function api(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (authToken) headers.Authorization = 'Bearer ' + authToken;
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
  return res;
}

function handleUnauthorized() {
  logout();
  showToast('Session expired — sign in again');
}

function logout() {
  authToken = '';
  localStorage.removeItem(TOKEN_KEY);
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('admin-view').style.display = 'none';
}

/* ==================== LOGIN ==================== */
async function doLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  err.textContent = '';
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const res = await fetch(API.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('password').value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    authToken = data.token;
    localStorage.setItem(TOKEN_KEY, authToken);
    enterDashboard();
  } catch (ex) {
    err.textContent = ex.message || 'Invalid password';
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

function enterDashboard() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('admin-view').style.display = 'block';
  document.getElementById('password').value = '';
  switchPanel('orders');
  refreshAll();
}

function switchPanel(name) {
  document.querySelectorAll('.admin-nav button').forEach((b) => b.classList.toggle('active', b.dataset.panel === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + name));
}

/* ==================== ORDERS ==================== */
async function loadOrders() {
  const search = document.getElementById('order-search').value.trim();
  const status = document.getElementById('order-status-filter').value;
  const payment = document.getElementById('order-payment-filter').value;
  const params = new URLSearchParams({ page: String(ordersPage), per: String(PER) });
  if (search) params.set('q', search);
  if (status) params.set('status', status);
  if (payment) params.set('payment', payment);

  const res = await api(`${API.orders}?${params.toString()}`);
  const data = await res.json();
  currentOrders = data.orders || [];
  renderOrders(currentOrders);
  renderOrderStats(data.total || 0, data.stats || {});
  renderPager(Math.ceil((data.total || 0) / PER));
}

const orderBadge = (s) => `<span class="badge b-${s || 'pending'}">${(s || 'pending').toUpperCase()}</span>`;
const payBadge = (s) => `<span class="badge b-${s || 'unpaid'}">${(s || 'unpaid').toUpperCase()}</span>`;

function renderOrders(orders) {
  const tbody = document.getElementById('orders-tbody');
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="8" class="muted">No orders yet.</td></tr>'; return; }
  tbody.innerHTML = orders.map((o) => {
    const itemsText = Array.isArray(o.items) && o.items.length
      ? o.items.map((it) => `${esc(it.name)} x${it.qty}`).join(', ')
      : '—';
    const opts = STATUSES.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('');
    const payOpts = PAYMENTS.map((s) => `<option value="${s}" ${o.payment_status === s ? 'selected' : ''}>${s}</option>`).join('');
    return `
      <tr data-order="${esc(o.order_id)}">
        <td><strong>#${esc(o.order_id)}</strong></td>
        <td>
          <strong>${esc(o.customer_name)}</strong><br>
          <a href="https://wa.me/${esc(String(o.customer_phone).replace(/[^0-9]/g, ''))}" target="_blank" rel="noopener">${esc(o.customer_phone)}</a>
          ${o.address ? '<div class="muted" style="font-size:.78rem">' + esc(o.address) + (o.city ? ', ' + esc(o.city) : '') + '</div>' : ''}
        </td>
        <td style="max-width:220px">${itemsText}</td>
        <td><strong>${prices(o.total)}</strong></td>
        <td><span class="badge b-cod">COD</span></td>
        <td>
          <select data-field="status" class="order-status" style="margin-bottom:.3rem">${opts}</select>
          <br>
          <select data-field="payment_status" class="order-paystatus">${payOpts}</select>
        </td>
        <td class="muted">${esc((o.created_at || '').slice(0, 16)).replace('T', ' ')}</td>
        <td>${payBadge(o.payment_status)}</td>
      </tr>`;
  }).join('');
}

function renderOrderStats(total, stats) {
  const paid = stats.paid || 0, unpaid = stats.unpaid || 0, refunded = stats.refunded || 0;
  const outstanding = Number(stats.outstanding) || 0;
  document.getElementById('order-stats').innerHTML = `
    <div class="stat-card"><div class="num">${total}</div><div class="lbl">Total orders</div></div>
    <div class="stat-card"><div class="num">${paid}</div><div class="lbl">Paid</div></div>
    <div class="stat-card"><div class="num">${unpaid}</div><div class="lbl">Unpaid</div></div>
    <div class="stat-card"><div class="num">${refunded}</div><div class="lbl">Refunded</div></div>
    <div class="stat-card"><div class="num">${prices(outstanding)}</div><div class="lbl">Outstanding (COD)</div></div>`;
}

function renderPager(pages) {
  const wrap = document.getElementById('orders-pager');
  wrap.innerHTML = `
    <button class="btn btn-outline" id="prev-page" ${ordersPage <= 1 ? 'disabled' : ''}>← Prev</button>
    <span class="muted" style="margin:0 .6rem">Page ${ordersPage} of ${pages || 1}</span>
    <button class="btn btn-outline" id="next-page" ${ordersPage >= pages ? 'disabled' : ''}>Next →</button>`;
  const prev = document.getElementById('prev-page'); if (prev) prev.onclick = () => { ordersPage--; loadOrders(); };
  const next = document.getElementById('next-page'); if (next) next.onclick = () => { ordersPage++; loadOrders(); };
}

async function updateOrderField(orderId, field, value) {
  const patch = { order_id: orderId };
  patch[field] = value;
  try {
    const res = await api(API.orders, { method: 'PATCH', body: JSON.stringify(patch) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not update');
    showToast('Order updated');
  } catch (ex) {
    showToast(ex.message || 'Update failed');
    loadOrders();
  }
}

document.addEventListener('change', (e) => {
  const g = e.target.getAttribute('data-field');
  if (!g) return;
  const tr = e.target.closest('tr[data-order]');
  if (!tr) return;
  updateOrderField(tr.dataset.order, g, e.target.value);
});

/* ==================== PRODUCTS ==================== */
async function loadProducts() {
  const res = await api(API.products);
  const data = await res.json();
  currentProducts = data.products || [];
  renderProducts();
}

function renderProducts() {
  const search = (document.getElementById('product-search').value || '').toLowerCase().trim();
  const cat = document.getElementById('product-cat-filter').value;
  const showInactive = document.getElementById('show-inactive').checked;

  let list = currentProducts.filter((p) => {
    if (!showInactive && !p.active) return false;
    if (cat && p.category !== cat) return false;
    if (search && !(String(p.name).toLowerCase().includes(search) || String(p.brand).toLowerCase().includes(search))) return false;
    return true;
  });

  const tbody = document.getElementById('products-tbody');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="7" class="muted">No products.</td></tr>'; return; }
  tbody.innerHTML = list.map((p) => {
    const s = Number(p.stock);
    const stockClass = s <= 0 ? 'qty-badge' : (s <= 3 ? 'qty-badge-low' : '');
    const stockColor = s <= 0 ? 'var(--red)' : (s <= 3 ? '#c98a2d' : '');
    const stockTag = s <= 0 ? ' <span class="badge b-cancelled">OUT</span>' : (s <= 3 ? ' <span class="badge b-pending">LOW</span>' : '');
    return `
    <tr data-pid="${p.id}">
      <td>${p.image ? `<img class="thumb" src="${esc(p.image)}" alt="" onerror="this.style.visibility='hidden'">` : ''}</td>
      <td>
        <strong>${esc(p.name)}</strong>
        ${p.brand ? '<div class="muted" style="font-size:.78rem">' + esc(p.brand) + '</div>' : ''}
      </td>
      <td>${CATEGORY_LABELS[p.category] || p.category}</td>
      <td>${prices(p.price)}${p.old_price ? ' <span class="muted" style="text-decoration:line-through">' + prices(p.old_price) + '</span>' : ''}</td>
      <td class="${stockClass}" style="color:${stockColor}">${p.stock}${stockTag}</td>
      <td>${p.active ? '<span class="badge b-paid">ACTIVE</span>' : '<span class="badge b-cancelled">HIDDEN</span>'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline" data-act="edit" data-id="${p.id}">Edit</button>
        <button class="btn btn-outline" data-act="${p.active ? 'hide' : 'show'}" data-id="${p.id}">${p.active ? 'Hide' : 'Show'}</button>
      </td>
    </tr>`;
  }).join('');
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === 'edit') { openProductModal(currentProducts.find((p) => p.id === id)); return; }
  if (btn.dataset.act === 'hide') { await toggleProduct(id, false); return; }
  if (btn.dataset.act === 'show') { await toggleProduct(id, true); return; }
});

async function toggleProduct(id, active) {
  try {
    const res = await api(`${API.products}/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    showToast(active ? 'Product shown on store' : 'Product hidden from store');
    loadProducts();
  } catch (ex) { showToast(ex.message || 'Update failed'); }
}

/* ---------- Product modal ---------- */
function openProductModal(p) {
  document.getElementById('product-modal-title').textContent = p ? 'Edit Product' : 'Add Product';
  document.getElementById('p-id').value = p ? p.id : '';
  document.getElementById('p-name').value = p ? p.name : '';
  document.getElementById('p-brand').value = p ? p.brand : '';
  document.getElementById('p-category').value = p ? p.category : 'crossbody';
  document.getElementById('p-price').value = p ? p.price : '';
  document.getElementById('p-old-price').value = p && p.old_price ? p.old_price : '';
  document.getElementById('p-stock').value = p ? p.stock : 0;
  document.getElementById('p-image').value = p ? p.image : '';
  document.getElementById('p-description').value = p ? p.description : '';
  editingColors = p && Array.isArray(p.colors) ? p.colors.map(c => ({ ...c })) : [];
  document.getElementById('p-sizes').value = p && Array.isArray(p.sizes) ? p.sizes.join(', ') : 'OS';
  renderColorTags();
  document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() { document.getElementById('product-modal').classList.remove('open'); }

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('p-id').value;
  const payload = {
    name: document.getElementById('p-name').value.trim(),
    brand: document.getElementById('p-brand').value.trim(),
    category: document.getElementById('p-category').value,
    price: Number(document.getElementById('p-price').value),
    old_price: document.getElementById('p-old-price').value === '' ? null : Number(document.getElementById('p-old-price').value),
    stock: Number(document.getElementById('p-stock').value || 0),
    image: document.getElementById('p-image').value.trim(),
    description: document.getElementById('p-description').value.trim(),
    colors: editingColors.length ? editingColors : [{ name: 'Default', hex: '#111111' }],
    sizes: document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(Boolean)
  };
  try {
    const url = id ? `${API.products}/${id}` : API.products;
    const res = await api(url, {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    showToast(id ? 'Product updated' : 'Product added');
    closeProductModal();
    loadProducts();
  } catch (ex) { showToast(ex.message || 'Save failed'); }
}

/* ==================== PAYMENTS ==================== */
async function loadPayments() {
  const res = await api(`${API.orders}?per=100`);
  const data = await res.json();
  currentOrders = data.orders || [];
  renderPayments(currentOrders);
  const total = currentOrders.reduce((a, o) => a + (Number(o.total) || 0), 0);
  const paid = currentOrders.filter((o) => o.payment_status === 'paid').reduce((a, o) => a + (Number(o.total) || 0), 0);
  const outstanding = currentOrders.filter((o) => o.payment_status !== 'paid' && o.payment_status !== 'refunded').length;
  document.getElementById('payment-stats').innerHTML = `
    <div class="stat-card"><div class="num">${prices(total)}</div><div class="lbl">COD expected</div></div>
    <div class="stat-card"><div class="num">${prices(paid)}</div><div class="lbl">Collected</div></div>
    <div class="stat-card"><div class="num">${outstanding}</div><div class="lbl">Awaiting collection</div></div>`;
}

function renderPayments(orders) {
  const tbody = document.getElementById('payments-tbody');
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="6" class="muted">No orders yet.</td></tr>'; return; }
  tbody.innerHTML = orders.map((o) => `
    <tr data-order="${esc(o.order_id)}">
      <td><strong>#${esc(o.order_id)}</strong></td>
      <td>${esc(o.customer_name)}</td>
      <td><strong>${prices(o.total)}</strong></td>
      <td><span class="badge b-cod">COD</span></td>
      <td>
        <select data-field="payment_status" class="order-paystatus">
          ${PAYMENTS.map((s) => `<option value="${s}" ${o.payment_status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td class="muted">${esc((o.created_at || '').slice(0, 16)).replace('T', ' ')}</td>
    </tr>`).join('');
}

/* ==================== INIT ==================== */
function refreshAll() { loadOrders(); loadProducts(); loadPayments(); }

document.addEventListener('DOMContentLoaded', () => {
  if (authToken) enterDashboard();

  document.getElementById('login-form').addEventListener('submit', doLogin);
  document.getElementById('logout-btn').addEventListener('click', () => { logout(); showToast('Logged out'); });

  document.querySelectorAll('.admin-nav button').forEach((b) => b.addEventListener('click', () => {
    switchPanel(b.dataset.panel);
    if (b.dataset.panel === 'orders') { ordersPage = 1; loadOrders(); }
    if (b.dataset.panel === 'products') loadProducts();
    if (b.dataset.panel === 'payments') loadPayments();
  }));

  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal(null));
  document.getElementById('product-cancel').addEventListener('click', closeProductModal);
  document.getElementById('product-modal').addEventListener('click', (e) => { if (e.target.id === 'product-modal') closeProductModal(); });
  document.getElementById('product-form').addEventListener('submit', saveProduct);

  document.getElementById('add-color-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('color-name');
    const hexInput = document.getElementById('color-hex');
    addEditingColor(nameInput.value, hexInput.value);
    nameInput.value = '';
    nameInput.focus();
  });
  document.getElementById('color-tags').addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-color');
    if (btn) removeEditingColor(Number(btn.dataset.index));
  });

  const bounce = () => { ordersPage = 1; loadOrders(); };
  document.getElementById('order-search').addEventListener('input', bounce);
  document.getElementById('order-status-filter').addEventListener('change', bounce);
  document.getElementById('order-payment-filter').addEventListener('change', bounce);
  document.getElementById('product-search').addEventListener('input', renderProducts);
  document.getElementById('product-cat-filter').addEventListener('change', renderProducts);
  document.getElementById('show-inactive').addEventListener('change', renderProducts);
});
