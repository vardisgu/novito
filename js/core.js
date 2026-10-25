/* Ядро демо: состояние, права, товары, заказы, журнал. Общее для публичного сайта (public.js) и кабинета (admin.js).
   Состояние хранится в localStorage браузера. В настоящем проекте всё это отдаёт сервер. */
const NV = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => new Intl.NumberFormat('ru-RU').format(n).replace(/ /g, ' ');
  const rub = (n) => num(Math.round(n)) + ' ₽';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = 'img/';
  const img = (n) => (n && String(n).startsWith('data:') ? n : IMG + n);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');
  const nowStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const toDate = (str) => new Date(String(str).replace(' ', 'T'));
  const fdt = (str) => toDate(str).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  /* ---------- состояние ---------- */
  const KEY = 'nv-demo-v5';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { store = {}; }
  store.role ||= 'guest';
  store.user ||= null; /* почта вошедшего сотрудника */
  store.products ||= {}; /* правки существующих товаров */
  store.custom ||= {}; /* товары, созданные в кабинете */
  store.posts ||= {};
  store.cart ||= [];
  store.orders ||= ORDERS.map((o) => ({ ...o }));
  store.leads ||= LEADS.map((l) => ({ ...l }));
  store.log ||= SYNC_LOG.map((l) => ({ ...l }));
  store.users ||= USERS.map((u) => ({ ...u }));
  store.integr ||= { ozon: true, tg: true, pay: true };
  store.ozon ||= { markup: 0, prices: true, stock: true, orders: true, interval: 30 };
  store.tgn ||= { orders: true, ozonOrders: true, leads: true, chat: '@novita_managers' };
  store.redirects ||= OLD_URLS.map((r) => [...r]);
  store.seo ||= { titleTpl: '{название} купить в Казани от {цена} | Новита', descTpl: '{название}. Производство в Казани, гарантия 18 месяцев, отгрузка в день заказа из наличия.', metrika: '', webmaster: '' };
  store.cookie ||= false;
  let persistFailed = false;
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); persistFailed = false; } catch { persistFailed = true; } };

  const S = { sel: null, draft: null, touched: new Set(), imgIdx: 0, checkout: null, editing: null, q: '', sort: 'pop', onlyStock: false };
  const can = (k) => ROLES[store.role].can.includes(k);
  const curUser = () => store.users.find((u) => u.email === store.user);
  const START = { editor: '#/admin/posts', catalog: '#/admin/products', admin: '#/admin/overview' };
  function loginUser(u) { store.user = u.email; store.role = u.role; persist(); }
  function logout() { store.user = null; store.role = 'guest'; persist(); }
  function loginAs(role) { const u = store.users.find((x) => x.role === role); if (u) loginUser(u); return u; }

  const STATUS = { new: 'Новый', production: 'В производстве', assembling: 'Собирается', shipped: 'Отправлен', done: 'Выполнен', canceled: 'Отменён' };
  const STEPS = ['new', 'production', 'assembling', 'shipped', 'done'];

  /* ---------- товары, статьи ---------- */
  const getP = (id) => {
    if (store.custom[id]) return store.custom[id];
    const base = PRODUCTS.find((p) => p.id === id);
    return base ? { ...base, ...(store.products[id] || {}) } : null;
  };
  const allProducts = () => [...PRODUCTS.map((b) => getP(b.id)), ...Object.values(store.custom)];
  const visibleProducts = () => allProducts().filter((p) => p.channels.site !== false);
  const allPosts = () => {
    const base = POSTS.map((p) => ({ ...p, ...(store.posts[p.id] || {}) }));
    const extra = Object.entries(store.posts).filter(([id]) => id.startsWith('new-')).map(([id, p]) => ({ id, ...p }));
    return [...extra, ...base];
  };
  const getPost = (id) => allPosts().find((p) => p.id === id);
  const fromPrice = (p) => Math.min(...p.variants.map((v) => v.retail));
  function patchProduct(id, patch) {
    if (store.custom[id]) store.custom[id] = { ...store.custom[id], ...patch };
    else store.products[id] = { ...(store.products[id] || {}), ...patch };
    persist();
  }
  const inStock = (p) => (p.stock ?? 0) > 0;
  const ozonPrice = (price) => Math.round(price * (1 + (store.ozon.markup || 0) / 100));

  /* ---------- корзина и заказы ---------- */
  const priceOf = (it) => { const p = getP(it.id); const v = p.variants.find((x) => x.size === it.size && x.color === it.color); return v ? v.retail : fromPrice(p); };
  const total = (items) => items.reduce((s, it) => s + priceOf(it) * it.qty, 0);
  const cartCount = () => store.cart.reduce((s, it) => s + it.qty, 0);
  function addToCart(id, size, color) {
    const ex = store.cart.find((it) => it.id === id && it.size === size && it.color === color);
    if (ex) ex.qty += 1; else store.cart.push({ id, size, color, qty: 1 });
    persist();
  }
  const itemLabel = (it) => [it.size, it.color].filter(Boolean).join(', ');
  const nextOrderId = () => 'NV-' + (Math.max(1041, ...store.orders.map((o) => parseInt(o.id.slice(3), 10) || 0)) + 1);
  const orderHistory = (o) => o.history || [{ t: o.date, text: 'Заказ создан' }, ...(o.paid ? [{ t: o.date, text: 'Оплата получена, чек отправлен' }] : [])];
  function setOrderStatus(id, status) {
    const o = store.orders.find((x) => x.id === id); if (!o || o.status === status) return o;
    o.history = [...orderHistory(o), { t: nowStr(), text: 'Статус: ' + STATUS[status] }];
    o.status = status; persist();
    log('Сайт', `Заказ ${o.id}: статус «${STATUS[status]}», покупателю отправлено уведомление`);
    return o;
  }
  function log(kind, msg) { store.log.unshift({ t: nowStr(), kind, msg }); store.log = store.log.slice(0, 80); persist(); }

  /* ---------- утилиты UI ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
  }
  function setPath(obj, path, val) {
    const parts = path.split('.');
    let o = obj;
    parts.slice(0, -1).forEach((k) => { o = o[k]; });
    o[parts[parts.length - 1]] = val;
  }
  function observeReveal() {
    const items = $$('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    items.forEach((i, n) => { i.style.setProperty('--d', `${(n % 4) * 70}ms`); io.observe(i); });
  }
  function countUp(el) {
    const raw = el.textContent.trim();
    const target = parseFloat(raw.replace(',', '.'));
    if (reduce || Number.isNaN(target)) return;
    const dec = raw.includes(',') ? raw.split(',')[1].length : 0;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 800);
      const v = target * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec).replace('.', ',');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  /* маска телефона: +7 (900) 000-00-00 */
  function maskPhone(el) {
    el.addEventListener('input', () => {
      let d = el.value.replace(/\D/g, '');
      if (d.startsWith('8') || d.startsWith('7')) d = d.slice(1);
      d = d.slice(0, 10);
      let out = '+7';
      if (d.length) out += ' (' + d.slice(0, 3);
      if (d.length >= 3) out += ')';
      if (d.length > 3) out += ' ' + d.slice(3, 6);
      if (d.length > 6) out += '-' + d.slice(6, 8);
      if (d.length > 8) out += '-' + d.slice(8, 10);
      el.value = d.length ? out : '';
    });
  }
  function download(name, text, type = 'text/plain') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: type + ';charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  return {
    $, $$, esc, num, rub, reduce, IMG, img, clone, pad, nowStr, toDate, fdt, store, persist, persistFailed: () => persistFailed, S, can, curUser, START, loginUser, logout, loginAs,
    STATUS, STEPS, getP, allProducts, visibleProducts, allPosts, getPost, fromPrice, patchProduct, inStock, ozonPrice, priceOf, total, cartCount, addToCart, itemLabel,
    nextOrderId, orderHistory, setOrderStatus, log, toast, setPath, observeReveal, countUp, maskPhone, download,
  };
})();
