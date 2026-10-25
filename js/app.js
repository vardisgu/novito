/* Демо сайта фабрики «Новита». Без сборки: открывается как обычный сайт, состояние хранится в localStorage.
   Два отдельных интерфейса:
   1) публичный сайт для покупателей (каталог, карточка, корзина, оплата);
   2) кабинет сотрудников по адресу /admin со своим меню, правкой товаров, заказами, статьями и пользователями. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => new Intl.NumberFormat('ru-RU').format(n).replace(/ /g, ' ');
  const rub = (n) => num(n) + ' ₽';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = 'img/';
  const img = (n) => (n && String(n).startsWith('data:') ? n : IMG + n);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- состояние ---------- */
  const KEY = 'nv-demo-v4';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { store = {}; }
  store.role ||= 'guest';
  store.user ||= null; /* почта вошедшего сотрудника */
  store.products ||= {}; /* правки существующих товаров */
  store.custom ||= {}; /* товары, созданные в кабинете */
  store.posts ||= {};
  store.cart ||= [];
  store.orders ||= ORDERS.map((o) => ({ ...o }));
  store.users ||= USERS.map((u) => ({ ...u }));
  store.integr ||= { ozon: true, tg: true, pay: true, ozonSync: 'сегодня, 09:12', autosync: true };
  let persistFailed = false;
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); persistFailed = false; } catch { persistFailed = true; }
  };

  const S = { sel: null, draft: null, touched: new Set(), imgIdx: 0, checkout: null, editing: null };
  const can = (k) => ROLES[store.role].can.includes(k);
  const curUser = () => store.users.find((u) => u.email === store.user);
  const START = { editor: '#/admin/posts', catalog: '#/admin/products', admin: '#/admin/overview' };
  function loginUser(u) { store.user = u.email; store.role = u.role; persist(); }
  function logout() { store.user = null; store.role = 'guest'; persist(); }
  function loginAs(role) { const u = store.users.find((x) => x.role === role); if (u) loginUser(u); return u; }

  const STATUS = { new: 'Новый', assembling: 'Собирается', shipped: 'Отправлен', done: 'Выполнен' };

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

  /* корзина и заказы */
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

  /* ======================================================================
     ПУБЛИЧНЫЙ САЙТ
     ====================================================================== */
  const cartBtn = () => `<i class="ph ph-shopping-cart"></i>Корзина${cartCount() ? `<span class="cnt">${cartCount()}</span>` : ''}`;
  function header() {
    const r = location.hash || '#/';
    const on = (p) => (r.startsWith(p) ? 'on' : '');
    return `<header class="header"><div class="wrap">
      <a class="brand" href="#/"><img src="${IMG}logo.webp" alt="Новита, фабрика механизмов"></a>
      <nav class="nav"><a class="${on('#/catalog')}" href="#/catalog">Каталог</a><a class="${on('#/blog')}" href="#/blog">Блог</a><a class="${on('#/contacts')}" href="#/contacts">Контакты</a></nav>
      <span class="tel">+7 (843) 512-00-08</span>
      <a class="btn sm cartbtn" href="#/cart">${cartBtn()}</a>
    </div></header>`;
  }
  /* для вошедшего сотрудника на публичных страницах: одна понятная плашка, а не второе меню */
  function staffPill(a, b) {
    if (!store.user) return '';
    let edit = '';
    if (a === 'p' && can('catalog')) edit = `<a class="primary" href="#/admin/products/${b}"><i class="ph ph-pencil-simple"></i>Править в кабинете</a>`;
    if (a === 'blog' && b && b !== 'new' && can('blog')) edit = `<a class="primary" href="#/admin/posts/${b}"><i class="ph ph-pencil-simple"></i>Править в кабинете</a>`;
    return `<div class="staffpill"><span>Это публичный сайт. Править здесь нельзя.</span>${edit}<a href="${START[store.role]}">В кабинет</a></div>`;
  }
  function footer() {
    return `<footer class="footer"><div class="wrap">
      <div><a class="brand" href="#/"><img src="${IMG}logo.webp" alt="Новита, фабрика механизмов"></a><p class="muted" style="margin-top:12px;max-width:36ch">Фабрика механизмов и мебели для здорового сна. Работаем с 1998 года.</p></div>
      <div><h4>Адрес</h4><p>Казань, ул. Рахимова, 8, корп. 9</p><p class="muted">Салон в ТЦ «Мегга-мебель», 3 этаж</p></div>
      <div><h4>Связь</h4><a class="mono" href="#/contacts">+7 (843) 512-00-08</a><a href="#/contacts">info@metallstil.ru</a><a href="#/contacts">Telegram @mebel_novita</a></div>
    </div></footer>`;
  }
  function pcard(p, cls = '') {
    const hit = p.hit ? '<span class="tag">Хит</span>' : '';
    const demo = p.demo ? '<span class="tag demo" style="left:auto;right:12px">демо-цена</span>' : '';
    return `<a class="pcard ${cls}" href="#/p/${p.id}" data-reveal>
      <div class="pic">${hit}${demo}<img class="${p.fit || ''}" src="${img(p.img)}" alt="${esc(p.name)}" loading="lazy"></div>
      <div class="body"><h3>${esc(p.name)}</h3><div class="price"><small>от </small>${rub(fromPrice(p))}</div></div></a>`;
  }

  function home() {
    const big = getP('strajp-1n');
    const vis = visibleProducts();
    const count = (c) => vis.filter((p) => p.cat === c).length;
    const tile = (cls, c) => `<a class="tile ${cls}" href="#/catalog/${c}" data-reveal><img src="${IMG}${CATS[c].img}" alt="" loading="lazy"><div class="cap"><h3>${CATS[c].name}</h3><span>${count(c)} моделей</span></div></a>`;
    const side = ['tandem-5', 'kanzona'].map(getP).filter((p) => p && p.channels.site !== false);
    return `
    <section class="hero"><div class="wrap grid">
      <div data-reveal><h1>Металлические кровати и <em>механизмы</em> из Казани</h1>
        <p class="lead">Фабрика «Новита» делает кровати, механизмы трансформации и основания. Отгрузка в день заказа из наличия.</p>
        <div class="cta"><a class="btn primary" href="#/catalog">Смотреть каталог</a></div></div>
      <div class="visual" data-reveal><div class="photo"><img src="${IMG}strajp-1n-2.jpg" alt="Кровать Страйп 1н с чёрным изголовьем"></div>
        <a class="chip-card" href="#/p/strajp-1n"><div><b>Страйп 1н</b><span>Одноярусная, 120-180 см</span></div><div class="price">${rub(fromPrice(big))}</div></a></div>
    </div></section>

    <section class="block"><div class="wrap"><h2 class="sec-title" data-reveal>Каталог</h2>
      <div class="bento">${tile('a', 'dvuhyarus')}${tile('b', 'odnoyarus')}${tile('c', 'malajziya')}${tile('d', 'transformery')}${tile('e', 'mehanizmy')}${tile('f', 'osnovaniya')}</div></div></section>

    <section class="block" style="padding-top:0"><div class="wrap">
      <div class="sec-head" data-reveal><h2 class="sec-title">Хиты продаж</h2><a class="link-arrow" href="#/catalog">Весь каталог <i class="ph ph-arrow-right"></i></a></div>
      <div class="hits">
        <a class="pcard big" href="#/p/strajp-1n" data-reveal>
          <div class="pic"><span class="tag">Хит</span><img src="${IMG}strajp-1n-2.jpg" alt="" loading="lazy"></div>
          <div class="body"><div><h3>${esc(big.name)}</h3><p class="muted" style="margin-top:10px">${esc(big.lead)}</p>
            <ul class="specline">${big.stats.map((s) => `<li>${esc(s.value)} ${esc(s.unit)} ${esc(s.label)}</li>`).join('')}</ul></div>
            <div><div class="price mono" style="font-size:28px"><small style="font-size:16px">от </small>${rub(fromPrice(big))}</div><span class="btn primary" style="margin-top:14px">Открыть карточку <i class="ph ph-arrow-right"></i></span></div></div></a>
        <div class="stack">${side.map((p) => pcard(p, 'wide')).join('')}</div>
      </div></div></section>

    <section class="block" style="padding-top:0"><div class="wrap facts">
      <div data-reveal><h2 class="sec-title" style="margin-bottom:0">Делаем сами в Казани</h2><p>Фабрика работает с 1998 года. Любой серийный образец меняем под ваш запрос: размер, цвет, комплектацию.</p><a class="btn primary" href="#/catalog">Выбрать модель</a></div>
      <div class="nums" data-reveal><div class="num"><b>2500</b><span>кв. м производства</span></div><div class="num"><b>5000+</b><span>изделий в месяц</span></div><div class="num"><b>18</b><span>месяцев гарантии</span></div></div>
    </div></section>`;
  }

  function catalog(cat) {
    const list = visibleProducts().filter((p) => !cat || p.cat === cat);
    const chips = `<a class="chip ${!cat ? 'on' : ''}" href="#/catalog">Все</a>` + Object.entries(CATS).map(([k, c]) => `<a class="chip ${cat === k ? 'on' : ''}" href="#/catalog/${k}">${c.name}</a>`).join('');
    return `<div class="wrap page-pad"><h1>${cat && CATS[cat] ? CATS[cat].name : 'Каталог'}</h1><p class="muted">${list.length} моделей, отгрузка в день заказа из наличия.</p>
      <div class="chips" style="margin:24px 0">${chips}</div><div class="grid-cards">${list.map((p) => pcard(p)).join('')}</div></div>`;
  }

  function product(id) {
    const p = getP(id);
    if (!p || p.channels.site === false) return `<div class="wrap lock"><h1>Товар не найден</h1><a class="btn" href="#/catalog">В каталог</a></div>`;
    if (!S.sel || !p.variants.some((v) => v.size === S.sel.size && v.color === S.sel.color)) S.sel = { size: p.variants[0].size, color: p.variants[0].color };
    const sizes = [...new Set(p.variants.map((v) => v.size))];
    const v = p.variants.find((x) => x.size === S.sel.size && x.color === S.sel.color) || p.variants[0];
    const colorBlock = p.colorOpt
      ? `<div><span class="label">${esc(p.colorOpt.label)}: <b id="colorName" style="color:var(--ink)">${esc(S.sel.color)}</b></span><div class="chips" id="colors">${p.colorOpt.items.map((c) => `<button class="chip color ${c.name === S.sel.color ? 'on' : ''}" data-color="${esc(c.name)}" title="${esc(c.name)}"><i style="background:${c.swatch}"></i>${esc(c.name)}</button>`).join('')}</div></div>`
      : '';
    const others = visibleProducts().filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 3);
    const more = others.length ? others : visibleProducts().filter((x) => x.id !== p.id).slice(0, 3);
    return `<div class="wrap"><div class="crumbs"><a href="#/catalog">Каталог</a><span>/</span><a href="#/catalog/${p.cat}">${CATS[p.cat].name}</a><span>/</span><span>${esc(p.name)}</span></div>
    <div class="pp">
      <div class="stage-wrap">
        <div class="stage" id="stage"><img class="main ${p.fit || ''}" id="mainImg" alt="${esc(p.name)}">
          <div id="pins"></div><span class="hint" id="hint"></span></div>
        <div class="thumbs" id="thumbs"></div>
      </div>
      <div class="info">
        <h1>${esc(p.name)}</h1>
        <p class="lead">${esc(p.lead)}</p>
        <div><span class="label">Размер, см</span><div class="chips" id="sizes">${sizes.map((s) => `<button class="chip ${s === S.sel.size ? 'on' : ''}" data-size="${s}">${s}</button>`).join('')}</div></div>
        ${colorBlock}
        <div class="pricebox"><span class="label" style="margin:0">Цена</span>
          <div class="retail"><span id="retail">${num(v.retail)}</span> ₽</div>
          <div class="optp"><i class="ph ph-check-circle"></i> В наличии, отгрузка в день заказа</div>
          <div class="actions"><button class="btn primary" data-buy>Купить</button><button class="btn" data-cart><i class="ph ph-shopping-cart"></i>В корзину</button></div></div>
      </div>
    </div>
    <div class="stats" data-reveal>${p.stats.map((s) => `<div><b data-count>${esc(s.value)}</b><em>${esc(s.unit)}</em><span>${esc(s.label)}</span></div>`).join('')}</div>
    <h2 class="sec-title" style="margin:56px 0 0;font-size:28px" data-reveal>Характеристики</h2>
    <div class="spec-grid" data-reveal>${p.specs.map(([t, rows]) => `<div class="spec"><h3>${esc(t)}</h3><dl>${rows.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl></div>`).join('')}</div>
    ${p.demo ? '<p class="demo-note" style="margin-top:16px">Демо: цены и характеристики этой модели условные.</p>' : ''}
    <h2 class="sec-title" style="margin:64px 0 24px;font-size:28px">Другие модели</h2>
    <div class="grid-cards" style="padding-bottom:96px">${more.map((x) => pcard(x)).join('')}</div></div>`;
  }

  function cartPage() {
    if (!store.cart.length) return `<div class="wrap lock"><h1>Корзина пуста</h1><p>Выберите кровать или механизм в каталоге.</p><a class="btn primary" href="#/catalog">В каталог</a></div>`;
    const rows = store.cart.map((it, i) => { const p = getP(it.id); return `<div class="crow">
      <img src="${img(p.img)}" alt="">
      <div class="cinfo"><a href="#/p/${p.id}"><b>${esc(p.name)}</b></a><span class="muted">${esc(itemLabel(it))}</span></div>
      <div class="qty"><button data-qty="${i}:-1" aria-label="Меньше">-</button><span class="mono">${it.qty}</span><button data-qty="${i}:1" aria-label="Больше">+</button></div>
      <div class="mono cprice">${rub(priceOf(it) * it.qty)}</div>
      <button class="icon" data-rm="${i}" aria-label="Удалить"><i class="ph ph-x"></i></button></div>`; }).join('');
    return `<div class="wrap page-pad"><h1>Корзина</h1><div class="cart">${rows}</div>
      <div class="ctotal"><span>Итого</span><b class="mono">${rub(total(store.cart))}</b></div>
      <div class="cactions"><a class="btn" href="#/catalog">Продолжить покупки</a><a class="btn primary" href="#/checkout">Оформить заказ</a></div></div>`;
  }

  function checkoutPage() {
    if (!store.cart.length) return `<div class="wrap lock"><h1>Корзина пуста</h1><p>Добавьте товар, чтобы оформить заказ.</p><a class="btn primary" href="#/catalog">В каталог</a></div>`;
    const f = (id, label, type = 'text', extra = '') => `<div class="field"><label class="label" for="${id}">${label}</label><input id="${id}" type="${type}" ${extra}><div class="err" data-err="${id}"></div></div>`;
    const items = store.cart.map((it) => { const p = getP(it.id); return `<div class="srow"><img src="${img(p.img)}" alt=""><div><b>${esc(p.name)}</b><span class="muted">${esc(itemLabel(it))}, ${it.qty} шт</span></div><span class="mono">${rub(priceOf(it) * it.qty)}</span></div>`; }).join('');
    return `<div class="wrap page-pad"><h1>Оформление заказа</h1>
      <div class="checkout">
        <form id="checkoutForm" novalidate>
          <fieldset><legend>Контакты</legend>${f('fName', 'Имя', 'text', 'autocomplete="name"')}${f('fPhone', 'Телефон', 'tel', 'autocomplete="tel" placeholder="+7"')}${f('fEmail', 'Почта для чека', 'email', 'autocomplete="email"')}</fieldset>
          <fieldset><legend>Получение</legend>
            <div class="radios"><label class="radio"><input type="radio" name="deliv" value="Доставка" checked><span><b>Доставка по России</b><small>Стоимость рассчитаем после заказа</small></span></label>
            <label class="radio"><input type="radio" name="deliv" value="Самовывоз"><span><b>Самовывоз в Казани</b><small>ул. Рахимова, 8, корп. 9</small></span></label></div>
            <div id="addrBox">${f('fCity', 'Город', 'text', 'autocomplete="address-level2"')}${f('fStreet', 'Улица, дом, квартира', 'text', 'autocomplete="street-address"')}</div></fieldset>
          <fieldset><legend>Оплата</legend><div class="radios"><label class="radio"><input type="radio" name="pay" value="Картой" checked><span><b>Банковской картой</b><small>Visa, Mastercard, МИР</small></span></label>
            <label class="radio"><input type="radio" name="pay" value="СБП"><span><b>Система быстрых платежей</b><small>По QR-коду или в приложении банка</small></span></label></div></fieldset>
          <div class="field"><label class="label" for="fComment">Комментарий к заказу</label><input id="fComment" type="text"></div>
          <button class="btn primary big" type="submit" id="payBtn">Оплатить ${rub(total(store.cart))}</button>
        </form>
        <aside class="summary"><h3>Ваш заказ</h3>${items}<div class="ctotal"><span>Итого</span><b class="mono">${rub(total(store.cart))}</b></div><a href="#/cart" class="link-arrow" style="margin-top:12px">Изменить корзину</a></aside>
      </div>
      <div class="modal" id="payModal" hidden><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="payTitle">
        <span class="demo-note">Демо: так выглядит страница банка</span><h3 id="payTitle">Оплата заказа</h3>
        <div class="mono" style="font-size:32px" id="payAmount"></div><p class="muted" id="payHow"></p>
        <div style="display:flex;gap:8px;margin-top:8px"><button class="btn primary" id="payConfirm" style="flex:1">Подтвердить оплату</button><button class="btn" id="payCancel">Отмена</button></div></div></div></div>`;
  }

  function orderPage(id) {
    const o = store.orders.find((x) => x.id === id);
    if (!o) return `<div class="wrap lock"><h1>Заказ не найден</h1><a class="btn" href="#/catalog">В каталог</a></div>`;
    const steps = Object.keys(STATUS);
    const at = steps.indexOf(o.status);
    return `<div class="wrap page-pad" style="max-width:760px"><span class="state pub">Оплачено</span><h1 style="margin-top:12px">Спасибо, заказ ${esc(o.id)} принят</h1>
      <p class="muted" style="margin:8px 0 24px">Чек отправлен на ${esc(o.email || 'вашу почту')}. Мы позвоним по номеру ${esc(o.phone)}, чтобы подтвердить детали.</p>
      <ol class="timeline">${steps.map((s, i) => `<li class="${i <= at ? 'done' : ''}">${STATUS[s]}</li>`).join('')}</ol>
      <div class="summary" style="position:static;margin-top:24px">${o.items.map((it) => { const p = getP(it.id); return `<div class="srow"><img src="${img(p.img)}" alt=""><div><b>${esc(p.name)}</b><span class="muted">${esc(itemLabel(it))}, ${it.qty} шт</span></div><span class="mono">${rub(priceOf(it) * it.qty)}</span></div>`; }).join('')}<div class="ctotal"><span>Оплачено</span><b class="mono">${rub(total(o.items))}</b></div>
      <p class="muted" style="font-size:14px">${esc(o.delivery)}${o.address ? ': ' + esc(o.address) : ''}. Оплата: ${esc(o.pay)}.</p></div>
      <a class="btn" href="#/catalog" style="margin-top:24px">Вернуться в каталог</a></div>`;
  }

  function blogList() {
    const list = allPosts().filter((p) => p.status === 'published');
    return `<div class="wrap page-pad"><h1>Блог</h1><p class="muted">Советы по выбору кроватей и механизмов.</p>
      <div class="posts" style="margin-top:24px">${list.map((p) => `<a class="post" href="#/blog/${p.id}" data-reveal><h3>${esc(p.title)}</h3><p>${esc(p.body[0] || '')}</p><div class="meta"><span>${p.date}</span></div></a>`).join('')}</div></div>`;
  }
  function article(id) {
    const p = getPost(id);
    if (!p || p.status !== 'published') return `<div class="wrap lock"><h1>Статья не найдена</h1><a class="btn" href="#/blog">В блог</a></div>`;
    return `<div class="wrap"><div class="crumbs"><a href="#/blog">Блог</a><span>/</span><span>${esc(p.title)}</span></div>
      <div class="article single"><div><h1>${esc(p.title)}</h1><div class="body">${p.body.map((t) => `<p>${esc(t)}</p>`).join('')}</div></div></div></div>`;
  }
  function contacts() {
    return `<div class="wrap page-pad"><h1>Контакты</h1><div class="cards3">
      <div class="int"><h3>Адрес</h3><p>Казань, ул. Рахимова, 8, корп. 9</p><p class="muted">Салон мебели: ТЦ «Мегга-мебель», 3 этаж, 4 линия</p></div>
      <div class="int"><h3>Телефоны</h3><p class="mono">+7 (843) 512-00-08</p><p class="mono">+7 (843) 512-00-87</p><p class="mono">+7 (904) 668-94-12</p></div>
      <div class="int"><h3>Онлайн</h3><p>info@metallstil.ru</p><p>Telegram: @mebel_novita</p><p class="muted">Пн-Пт, 07:30-19:30 по Москве</p></div></div></div>`;
  }

  /* фото, миниатюры и точки зависят от выбранного цвета. Если фото в этом цвете нет, остаётся прежнее и об этом сказано в подписи. */
  function renderStage(p) {
    const opt = p.colorOpt;
    const item = opt && opt.items.find((i) => i.name === S.sel.color);
    const gal = (item && item.gallery) || p.gallery;
    const pins = item ? (item.pins || []) : (p.pins || []);
    const shown = opt ? opt.items.find((i) => i.gallery) : null;
    const missing = opt && item && !item.gallery && shown;
    const el = $('#mainImg');
    const i = Math.min(S.imgIdx, gal.length - 1);
    const src = img(gal[i]);
    if (el.getAttribute('src') !== src) {
      el.style.opacity = 0;
      setTimeout(() => { el.src = src; el.style.opacity = 1; }, el.getAttribute('src') ? 160 : 0);
    }
    $('#pins').innerHTML = i === 0 ? pins.map((pn, k) => `<div class="pin ${pn.x > 55 ? 'flip' : ''}" style="left:${pn.x}%;top:${pn.y}%"><button class="dot" aria-label="${esc(pn.title)}">${k + 1}</button><div class="tip"><b>${esc(pn.title)}</b>${esc(pn.text)}</div></div>`).join('') : '';
    $$('#pins .dot').forEach((d) => d.addEventListener('click', () => d.parentElement.classList.toggle('open')));
    $('#hint').innerHTML = missing
      ? `<i class="ph ph-info"></i> Фото пока в цвете «${esc(shown.name)}»`
      : `<i class="ph ph-cursor-click"></i> ${pins.length && i === 0 ? 'Нажмите на точки' : 'Фото модели'}`;
    const th = $('#thumbs');
    th.style.display = gal.length > 1 ? '' : 'none';
    th.innerHTML = gal.length > 1 ? gal.map((g, k) => `<button class="${k === i ? 'on' : ''}" data-img="${k}" aria-label="Фото ${k + 1}"><img src="${img(g)}" alt=""></button>`).join('') : '';
    $$('[data-img]').forEach((b) => b.addEventListener('click', () => { S.imgIdx = +b.dataset.img; renderStage(p); }));
  }

  /* оформление заказа: проверка формы и имитация страницы банка */
  function bindCheckout() {
    const form = $('#checkoutForm'); if (!form) return;
    const addr = $('#addrBox');
    $$('input[name="deliv"]').forEach((r) => r.addEventListener('change', () => { addr.hidden = r.value === 'Самовывоз' && r.checked; }));
    const setErr = (id, msg) => { $(`[data-err="${id}"]`).textContent = msg; $('#' + id).setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const v = (id) => $('#' + id).value.trim();
      const delivery = form.querySelector('input[name="deliv"]:checked').value;
      let ok = true;
      ok = setErr('fName', v('fName').length < 2 ? 'Укажите имя' : '') && ok;
      ok = setErr('fPhone', v('fPhone').replace(/\D/g, '').length < 10 ? 'Укажите телефон полностью' : '') && ok;
      ok = setErr('fEmail', /^\S+@\S+\.\S+$/.test(v('fEmail')) ? '' : 'Укажите почту, на неё придёт чек') && ok;
      ok = setErr('fCity', delivery === 'Доставка' && !v('fCity') ? 'Укажите город' : '') && ok;
      ok = setErr('fStreet', delivery === 'Доставка' && !v('fStreet') ? 'Укажите адрес' : '') && ok;
      if (!ok) { const bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
      const pay = form.querySelector('input[name="pay"]:checked').value;
      S.checkout = { name: v('fName'), phone: v('fPhone'), email: v('fEmail'), city: delivery === 'Доставка' ? v('fCity') : 'Казань', address: delivery === 'Доставка' ? v('fCity') + ', ' + v('fStreet') : '', delivery, pay, comment: v('fComment') };
      $('#payAmount').textContent = rub(total(store.cart));
      $('#payHow').textContent = pay === 'СБП' ? 'Отсканируйте код или подтвердите платёж в приложении вашего банка.' : 'Введите данные карты на защищённой странице банка.';
      $('#payModal').hidden = false; $('#payConfirm').focus();
    });
    $('#payCancel').addEventListener('click', () => { $('#payModal').hidden = true; });
    $('#payConfirm').addEventListener('click', () => {
      const c = S.checkout; const id = nextOrderId();
      const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
      store.orders.unshift({ id, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`, source: 'Сайт', status: 'new', paid: true, items: store.cart.map((it) => ({ ...it })), ...c });
      store.cart = []; persist(); location.hash = '#/order/' + id;
    });
  }

  function bindPublic(a, b) {
    $$('[data-qty]').forEach((e) => e.addEventListener('click', () => { const [i, d] = e.dataset.qty.split(':').map(Number); const it = store.cart[i]; it.qty = Math.max(1, it.qty + d); persist(); route(true); }));
    $$('[data-rm]').forEach((e) => e.addEventListener('click', () => { store.cart.splice(+e.dataset.rm, 1); persist(); route(true); }));
    bindCheckout();
    if (a === 'p') {
      const p = getP(b); if (!p || p.channels.site === false) return;
      const upd = () => { const v = p.variants.find((x) => x.size === S.sel.size && x.color === S.sel.color) || p.variants[0]; $('#retail').textContent = num(v.retail); };
      $$('[data-size]').forEach((e) => e.addEventListener('click', () => { S.sel.size = e.dataset.size; $$('[data-size]').forEach((x) => x.classList.toggle('on', x === e)); upd(); }));
      $$('[data-color]').forEach((e) => e.addEventListener('click', () => {
        S.sel.color = e.dataset.color; S.imgIdx = 0;
        $$('[data-color]').forEach((x) => x.classList.toggle('on', x === e));
        const cn = $('#colorName'); if (cn) cn.textContent = S.sel.color;
        upd(); renderStage(p);
      }));
      renderStage(p);
      $('[data-buy]').addEventListener('click', () => { addToCart(p.id, S.sel.size, S.sel.color); location.hash = '#/checkout'; });
      $('[data-cart]').addEventListener('click', () => { addToCart(p.id, S.sel.size, S.sel.color); const cb = $('.cartbtn'); if (cb) cb.innerHTML = cartBtn(); toast('Добавлено в корзину'); });
      const stage = $('#stage');
      if (!reduce && stage) {
        const el = $('#mainImg');
        stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 4}deg) scale(1.04)`; });
        stage.addEventListener('pointerleave', () => { el.style.transform = ''; });
      }
    }
  }

  /* ======================================================================
     КАБИНЕТ СОТРУДНИКОВ (/admin): отдельная оболочка с боковым меню
     ====================================================================== */
  const NAV = [
    ['overview', 'Обзор', 'squares-four', 'users'],
    ['products', 'Товары', 'package', 'catalog'],
    ['orders', 'Заказы', 'receipt', 'orders'],
    ['posts', 'Статьи', 'article', 'blog'],
    ['users', 'Пользователи', 'users', 'users'],
    ['integrations', 'Подключения', 'plugs-connected', 'integrations'],
  ];
  function adminShell(html, active) {
    const role = ROLES[store.role];
    const me = curUser();
    const newCount = store.orders.filter((o) => o.status === 'new').length;
    const nav = NAV.filter(([, , , perm]) => can(perm)).map(([k, t, ic]) => `<a class="${active === k ? 'on' : ''}" href="#/admin/${k}"><i class="ph ph-${ic}"></i>${t}${k === 'orders' && newCount ? `<span class="cnt">${newCount}</span>` : ''}</a>`).join('');
    return `<div class="adm">
      <aside class="adm-side">
        <a class="adm-brand" href="${START[store.role]}"><img src="${IMG}logo.webp" alt="Новита"><span>Кабинет</span></a>
        <nav>${nav}</nav>
        <div class="adm-foot">
          <div class="who"><b>${role.label}</b><span class="mono">${esc(me ? me.email : '')}</span></div>
          <a class="adm-link" href="#/" target="_blank" rel="noopener"><i class="ph ph-arrow-square-out"></i>Открыть сайт</a>
          <button class="adm-link" data-logout><i class="ph ph-sign-out"></i>Выйти</button>
        </div>
      </aside>
      <main class="adm-main">${html}</main>
    </div><div class="toast" id="toast" role="status"></div>`;
  }
  const lock = (msg) => `<div class="adm-page"><div class="lockbox"><h1>Нет доступа</h1><p>${msg}</p><p class="muted">Этот раздел не входит в вашу роль. Нужный пункт ищите в меню слева.</p></div></div>`;
  function loginPage() {
    return `<div class="login-screen"><div class="login-card">
      <img src="${IMG}logo.webp" alt="Новита" class="login-logo"><h1>Вход в кабинет</h1><p class="muted">Для сотрудников фабрики. Разделы зависят от вашей почты.</p>
      <form id="loginForm" novalidate>
        <div><label class="label" for="email">Почта</label><input id="email" type="email" autocomplete="username" required></div>
        <div><label class="label" for="pass">Пароль</label><input id="pass" type="password" autocomplete="current-password" required></div>
        <div id="loginErr" role="alert" class="err" style="font-size:14px"></div>
        <button class="btn primary big" type="submit">Войти</button>
      </form>
      <div style="margin-top:24px"><span class="label">Демо-доступ, пароль ${DEMO_PASS}</span><div style="display:grid;gap:8px">
      ${store.users.map((u) => `<button class="btn ghost" data-fill="${esc(u.email)}" style="justify-content:space-between"><span>${esc(u.email)}</span><span class="muted">${ROLES[u.role].label}</span></button>`).join('')}</div></div>
      <a class="muted" href="#/" style="display:inline-block;margin-top:20px;font-size:14px">Вернуться на сайт</a></div></div>`;
  }

  function adminOverview() {
    if (!can('users')) return lock('Обзор доступен только администратору.');
    const nNew = store.orders.filter((o) => o.status === 'new').length;
    const drafts = allPosts().filter((p) => p.status !== 'published').length;
    const card = (n, t, href, ic) => `<a class="ov" href="${href}"><i class="ph ph-${ic}"></i><b class="mono">${n}</b><span>${t}</span></a>`;
    return `<div class="adm-page"><div class="adm-head"><h1>Обзор</h1></div><div class="ovgrid">
      ${card(nNew, 'новых заказов', '#/admin/orders', 'receipt')}${card(visibleProducts().length, 'товаров на сайте', '#/admin/products', 'package')}
      ${card(drafts, 'черновиков статей', '#/admin/posts', 'article')}${card(store.users.length, 'сотрудников', '#/admin/users', 'users')}</div>
      <p class="muted" style="margin-top:24px">Ozon: последняя синхронизация ${esc(store.integr.ozonSync)}.</p></div>`;
  }
  function adminProducts() {
    if (!can('catalog')) return lock('Раздел «Товары» доступен менеджеру каталога и администратору.');
    return `<div class="adm-page"><div class="adm-head"><div><h1>Товары</h1><p class="muted">Нажмите на товар, чтобы открыть его карточку и править прямо в ней.</p></div><a class="btn primary" href="#/admin/products/new"><i class="ph ph-plus"></i>Добавить товар</a></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th></th><th>Название</th><th>Цена от</th><th>Сайт</th><th>Ozon</th><th></th></tr></thead><tbody>
      ${allProducts().map((p) => `<tr><td><img class="thumb" src="${img(p.img)}" alt=""></td><td><a href="#/admin/products/${p.id}"><b>${esc(p.name)}</b></a><div class="muted" style="font-size:13px">${CATS[p.cat].name}${p.channels.site === false ? ', скрыт с сайта' : ''}</div></td><td class="mono">${rub(fromPrice(p))}</td>
        ${['site', 'ozon'].map((k) => `<td><label class="sw" style="border:0;padding:0"><input type="checkbox" data-rowch="${p.id}:${k}" ${p.channels[k] ? 'checked' : ''}></label></td>`).join('')}
        <td><a class="btn sm" href="#/admin/products/${p.id}"><i class="ph ph-pencil-simple"></i>Править</a></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }

  /* ---------- редактор товара: выглядит как карточка, поля правятся на месте ---------- */
  function blankDraft() {
    return { isNew: true, cat: 'odnoyarus', name: 'Новый товар', lead: 'Короткое описание товара: чем он удобен покупателю.', gallery: [], colorGal: false,
      sizes: [{ size: '120×200', price: 0 }], colorLabel: 'Цвет металла', colors: ['Черный', 'Белый'],
      stats: [{ id: 's1', value: '100', unit: 'кг', label: 'нагрузка на место' }, { id: 's2', value: '1,5', unit: 'мм', label: 'толщина стали' }, { id: 's3', value: '1', unit: 'день', label: 'отгрузка из наличия' }, { id: 's4', value: '18', unit: 'мес', label: 'гарантия' }],
      specs: [['Характеристики', [['Материал', 'сталь, порошковая окраска'], ['Гарантия', '18 месяцев']]]], channels: { site: true, ozon: true } };
  }
  function draftFrom(p) {
    const seen = new Map();
    p.variants.forEach((v) => { if (!seen.has(v.size)) seen.set(v.size, v.retail); });
    return { isNew: false, cat: p.cat, name: p.name, lead: p.lead, gallery: clone(p.gallery || [p.img]), colorGal: !!(p.colorOpt && p.colorOpt.items.some((i) => i.gallery)),
      sizes: [...seen].map(([size, price]) => ({ size, price })), colorLabel: p.colorOpt ? p.colorOpt.label : 'Без выбора цвета', colors: p.colorOpt ? p.colorOpt.items.map((i) => i.name) : [],
      stats: clone(p.stats), specs: clone(p.specs), channels: clone(p.channels) };
  }
  function adminProductEditor(id) {
    if (!can('catalog')) return lock('Править товары могут менеджер каталога и администратор.');
    const base = id === 'new' ? null : getP(id);
    if (id !== 'new' && !base) return `<div class="adm-page"><div class="lockbox"><h1>Товар не найден</h1><a class="btn" href="#/admin/products">К списку товаров</a></div></div>`;
    S.editing = { type: 'product', id, base };
    S.draft = id === 'new' ? blankDraft() : draftFrom(base);
    S.touched = new Set();
    const d = S.draft;
    return `<div class="adm-page wide"><div class="crumbs"><a href="#/admin/products">Товары</a><span>/</span><span>${d.isNew ? 'Новый товар' : esc(base.name)}</span></div>
      <p class="edit-hint"><i class="ph ph-pencil-simple"></i>Так товар увидит покупатель. Нажмите на название, описание или цифры и правьте прямо здесь. Рамки показывают, что можно менять.</p>
      <div class="pp">
        <div class="stage-wrap"><div class="stage" id="edStage"></div><div class="thumbs" id="edThumbs"></div>
          <div id="photoTools"></div></div>
        <div class="info">
          <div><label class="label" for="edCat">Категория</label><select id="edCat">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${d.cat === k ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
          <h1 data-f="name">${esc(d.name)}</h1>
          <p class="lead" data-f="lead">${esc(d.lead)}</p>
          <div><span class="label">Размеры и цены</span><div id="sizesEd"></div><button class="btn sm ghost" id="addSize" type="button">+ Размер</button></div>
          <div><label class="label" for="edColorLabel">Что выбирает покупатель</label>
            <select id="edColorLabel">${['Цвет металла', 'Цвет обивки', 'Цвет боковин', 'Без выбора цвета'].map((t) => `<option ${d.colorLabel === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
            <input id="edColors" type="text" placeholder="Цвета через запятую" value="${esc(d.colors.join(', '))}" style="margin-top:8px;width:100%" ${d.colorLabel === 'Без выбора цвета' ? 'disabled' : ''}>
            <p class="muted" style="font-size:13px;margin-top:4px">У механизмов и оснований выбирайте «Без выбора цвета».</p></div>
        </div>
      </div>
      <div class="stats">${d.stats.map((s, i) => `<div><b data-f="stats.${i}.value">${esc(s.value)}</b><em data-f="stats.${i}.unit">${esc(s.unit)}</em><span data-f="stats.${i}.label">${esc(s.label)}</span></div>`).join('')}</div>
      <h2 class="sec-title" style="margin:48px 0 0;font-size:28px">Характеристики</h2>
      <div class="spec-grid" id="specGrid"></div>
      <button class="btn sm ghost" id="addGroup" type="button" style="margin-top:12px">+ Группа характеристик</button>
      <aside class="publish" id="publish"><h4>${d.isNew ? 'Новый товар' : 'Публикация'}</h4><div class="changes" id="changes">Изменений нет</div>
        <label class="sw">Показывать на сайте<input type="checkbox" data-ch="site"></label><label class="sw">Выгрузить в Ozon<input type="checkbox" data-ch="ozon"></label>
        <div class="err" id="edErr" role="alert"></div>
        <div style="display:flex;gap:8px"><button class="btn primary" id="saveP" style="flex:1">${d.isNew ? 'Создать товар' : 'Сохранить'}</button><a class="btn" href="#/admin/products">Отмена</a></div>
        ${!d.isNew && store.custom[id] ? '<button class="btn sm ghost" id="delP" type="button">Удалить товар</button>' : ''}</aside></div>`;
  }
  const markDirty = (key) => { S.touched.add(key); const c = $('#changes'); if (c) c.innerHTML = `Изменено: <b>${S.touched.size}</b>`; };
  function bindEditable(root) {
    $$('[data-f]', root).forEach((el) => {
      el.setAttribute('contenteditable', 'true');
      el.addEventListener('paste', (ev) => { ev.preventDefault(); document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain')); });
      el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && S.editing && S.editing.type === 'product') { ev.preventDefault(); el.blur(); } });
      el.addEventListener('input', () => { setPath(S.draft, el.dataset.f, el.textContent.trim()); markDirty(el.dataset.f); if (S.editing.type === 'article') syncArticle(); });
    });
  }
  function renderPhotos() {
    const d = S.draft;
    const stage = $('#edStage');
    stage.innerHTML = d.gallery.length ? `<img class="main" src="${img(d.gallery[0])}" alt="">` : '<div class="nophoto"><i class="ph ph-image"></i><span>Добавьте фото товара</span></div>';
    $('#edThumbs').innerHTML = d.gallery.length > 1 ? d.gallery.map((g, i) => `<button class="${i === 0 ? 'on' : ''}" data-mk="${i}" title="Сделать главным"><img src="${img(g)}" alt=""></button>`).join('') : '';
    $('#photoTools').innerHTML = d.colorGal
      ? '<p class="muted" style="font-size:13px">У этого товара фото настроены отдельно по цветам, их менять здесь пока нельзя.</p>'
      : `<div class="ptools"><label class="btn sm" for="photoIn"><i class="ph ph-image"></i>Добавить фото</label><input type="file" id="photoIn" accept="image/*" multiple hidden>${d.gallery.length ? '<button class="btn sm ghost" id="rmPhoto" type="button">Убрать главное</button>' : ''}</div>`;
    $$('[data-mk]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.mk; d.gallery.unshift(d.gallery.splice(i, 1)[0]); markDirty('photo'); renderPhotos(); }));
    const rm = $('#rmPhoto'); if (rm) rm.addEventListener('click', () => { d.gallery.shift(); markDirty('photo'); renderPhotos(); });
    const inp = $('#photoIn'); if (inp) inp.addEventListener('change', async () => {
      for (const f of [...inp.files]) { const url = await shrink(f); if (url) d.gallery.push(url); }
      markDirty('photo'); renderPhotos();
    });
  }
  /* фото уменьшается до 1200 px, чтобы поместиться в память браузера */
  function shrink(file) {
    return new Promise((res) => {
      const rd = new FileReader();
      rd.onerror = () => res(null);
      rd.onload = () => {
        const im = new Image();
        im.onerror = () => res(null);
        im.onload = () => {
          const k = Math.min(1, 1200 / Math.max(im.width, im.height));
          const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.8));
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }
  function renderSizes() {
    const d = S.draft;
    $('#sizesEd').innerHTML = d.sizes.map((s, i) => `<div class="szrow"><input data-sz="${i}:size" value="${esc(s.size)}" aria-label="Размер" placeholder="120×200"><input data-sz="${i}:price" inputmode="numeric" value="${s.price || ''}" aria-label="Цена" placeholder="Цена"><span>₽</span><button class="icon" type="button" data-rmsz="${i}" aria-label="Убрать размер"><i class="ph ph-x"></i></button></div>`).join('');
    $$('[data-sz]').forEach((inp) => inp.addEventListener('input', () => { const [i, k] = inp.dataset.sz.split(':'); d.sizes[+i][k] = k === 'price' ? parseInt(inp.value.replace(/\D/g, ''), 10) || 0 : inp.value.trim(); markDirty('sizes'); }));
    $$('[data-rmsz]').forEach((b) => b.addEventListener('click', () => { if (d.sizes.length > 1) { d.sizes.splice(+b.dataset.rmsz, 1); markDirty('sizes'); renderSizes(); } }));
  }
  function renderSpecs() {
    const d = S.draft; const g = $('#specGrid');
    g.innerHTML = d.specs.map((grp, gi) => `<div class="spec"><h3 data-f="specs.${gi}.0">${esc(grp[0])}</h3><dl>${grp[1].map((row, ri) => `<div class="sprow"><div><dt data-f="specs.${gi}.1.${ri}.0">${esc(row[0])}</dt><dd data-f="specs.${gi}.1.${ri}.1">${esc(row[1])}</dd></div><button class="icon" type="button" data-rmspec="${gi}:${ri}" aria-label="Убрать строку"><i class="ph ph-x"></i></button></div>`).join('')}</dl><button class="btn sm ghost" type="button" data-addspec="${gi}">+ Строка</button></div>`).join('');
    bindEditable(g);
    $$('[data-rmspec]').forEach((b) => b.addEventListener('click', () => { const [gi, ri] = b.dataset.rmspec.split(':').map(Number); d.specs[gi][1].splice(ri, 1); markDirty('specs'); renderSpecs(); }));
    $$('[data-addspec]').forEach((b) => b.addEventListener('click', () => { d.specs[+b.dataset.addspec][1].push(['Параметр', 'Значение']); markDirty('specs'); renderSpecs(); }));
  }
  function saveProduct() {
    const d = S.draft; const { id: eid, base } = S.editing; const err = $('#edErr');
    const sizes = d.sizes.filter((s) => s.size);
    if (!d.name.trim()) { err.textContent = 'Укажите название товара'; return; }
    if (!sizes.length || sizes.some((s) => !s.price)) { err.textContent = 'У каждого размера должна быть цена'; return; }
    if (!d.gallery.length) { err.textContent = 'Добавьте хотя бы одно фото'; return; }
    const colors = d.colorLabel === 'Без выбора цвета' ? [] : d.colors;
    const oldItems = base && base.colorOpt ? base.colorOpt.items : [];
    const items = colors.map((n) => oldItems.find((i) => i.name === n) || { name: n, swatch: SWATCH[n] || '#9AA0A6' });
    const variants = sizes.flatMap((s) => (colors.length ? colors : ['']).map((c) => ({ size: s.size, color: c, retail: s.price })));
    const common = { cat: d.cat, name: d.name.trim(), lead: d.lead.trim(), colorOpt: colors.length ? { label: d.colorLabel, items } : null, variants, stats: d.stats, specs: d.specs, channels: d.channels };
    let newId = eid;
    if (d.isNew) {
      newId = 'p-' + Date.now();
      store.custom[newId] = { id: newId, ...common, gallery: d.gallery, img: d.gallery[0], pins: [] };
    } else if (store.custom[eid]) {
      store.custom[eid] = { ...store.custom[eid], ...common, gallery: d.gallery, img: d.gallery[0] };
    } else {
      store.products[eid] = { ...common, ...(d.colorGal ? {} : { gallery: d.gallery, img: d.gallery[0] }) };
    }
    persist();
    if (persistFailed) { err.textContent = 'Браузер не смог сохранить: фото слишком тяжёлые. Уберите часть фото.'; return; }
    const where = ['site', 'ozon'].filter((k) => d.channels[k]).map((k) => ({ site: 'на сайте', ozon: 'в Ozon' }[k]));
    location.hash = '#/admin/products'; route();
    toast((d.isNew ? 'Товар создан. ' : 'Сохранено. ') + (where.length ? 'Появится ' + where.join(', ') : 'Нигде не показывается') + ' (демо)');
  }
  function bindProductEditor() {
    const d = S.draft;
    bindEditable($('.adm-page'));
    renderPhotos(); renderSizes(); renderSpecs();
    $('#edCat').addEventListener('change', (e) => { d.cat = e.target.value; markDirty('cat'); });
    $('#addSize').addEventListener('click', () => { d.sizes.push({ size: '', price: 0 }); markDirty('sizes'); renderSizes(); const l = $$('[data-sz$=":size"]'); if (l.length) l[l.length - 1].focus(); });
    $('#edColorLabel').addEventListener('change', (e) => { d.colorLabel = e.target.value; $('#edColors').disabled = d.colorLabel === 'Без выбора цвета'; markDirty('color'); });
    $('#edColors').addEventListener('input', (e) => { d.colors = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); markDirty('color'); });
    $('#addGroup').addEventListener('click', () => { d.specs.push(['Новая группа', [['Параметр', 'Значение']]]); markDirty('specs'); renderSpecs(); });
    $$('[data-ch]').forEach((i) => { i.checked = !!d.channels[i.dataset.ch]; i.addEventListener('change', () => { d.channels[i.dataset.ch] = i.checked; markDirty('ch.' + i.dataset.ch); }); });
    $('#saveP').addEventListener('click', saveProduct);
    const del = $('#delP'); if (del) del.addEventListener('click', () => {
      if (del.dataset.sure) { delete store.custom[S.editing.id]; persist(); location.hash = '#/admin/products'; route(); toast('Товар удалён'); return; }
      del.dataset.sure = '1'; del.textContent = 'Точно удалить? Нажмите ещё раз'; setTimeout(() => { del.dataset.sure = ''; del.textContent = 'Удалить товар'; }, 3500);
    });
  }

  /* ---------- заказы, статьи, пользователи, подключения ---------- */
  function adminOrders() {
    if (!can('orders')) return lock('Раздел «Заказы» доступен менеджеру каталога и администратору.');
    return `<div class="adm-page"><div class="adm-head"><div><h1>Заказы</h1><p class="muted">Заказы с сайта и из Ozon в одном списке. Смените статус, и покупатель получит уведомление.</p></div></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Номер</th><th>Источник</th><th>Покупатель</th><th>Состав</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>
      ${store.orders.map((o) => `<tr><td><b class="mono">${esc(o.id)}</b><div class="muted" style="font-size:13px">${esc(o.date)}</div></td><td>${esc(o.source)}</td><td>${esc(o.name)}<div class="muted" style="font-size:13px">${esc(o.phone)}, ${esc(o.city || '')}</div></td>
      <td>${o.items.map((it) => `${esc(getP(it.id).name)}<div class="muted" style="font-size:13px">${esc(itemLabel(it))}, ${it.qty} шт</div>`).join('')}</td><td class="mono">${rub(total(o.items))}<div class="muted" style="font-size:13px">${o.paid ? 'оплачен' : 'не оплачен'}</div></td>
      <td><select data-ostatus="${o.id}">${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  function adminPosts() {
    if (!can('blog')) return lock('Раздел «Статьи» доступен редактору статей и администратору.');
    return `<div class="adm-page"><div class="adm-head"><div><h1>Статьи</h1><p class="muted">Нажмите на статью, чтобы править её прямо в тексте.</p></div><a class="btn primary" href="#/admin/posts/new"><i class="ph ph-plus"></i>Новая статья</a></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Заголовок</th><th>Дата</th><th>Статус</th><th></th></tr></thead><tbody>
      ${allPosts().map((p) => `<tr><td><a href="#/admin/posts/${p.id}"><b>${esc(p.title)}</b></a></td><td class="mono" style="font-size:14px">${p.date}</td><td><span class="state ${p.status === 'published' ? 'pub' : ''}">${p.status === 'published' ? 'Опубликовано' : 'Черновик'}</span></td><td><a class="btn sm" href="#/admin/posts/${p.id}"><i class="ph ph-pencil-simple"></i>Править</a></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  function adminArticleEditor(id) {
    if (!can('blog')) return lock('Писать статьи могут редактор статей и администратор.');
    const p = getPost(id);
    if (!p) return `<div class="adm-page"><div class="lockbox"><h1>Статья не найдена</h1><a class="btn" href="#/admin/posts">К списку статей</a></div></div>`;
    S.editing = { type: 'article', id }; S.draft = { title: p.title, body: clone(p.body) }; S.touched = new Set();
    return `<div class="adm-page wide"><div class="crumbs"><a href="#/admin/posts">Статьи</a><span>/</span><span>${esc(p.title)}</span></div>
      <p class="edit-hint"><i class="ph ph-pencil-simple"></i>Пишите прямо в тексте. Справа выберите, где опубликовать.</p>
      <div class="article"><div><span class="state ${p.status === 'published' ? 'pub' : ''}" style="display:inline-block;margin-bottom:16px">${p.status === 'published' ? 'Опубликовано' : 'Черновик'}</span>
        <h1 data-f="title">${esc(p.title)}</h1><div class="body" id="abody">${p.body.map((t, i) => `<p data-f="body.${i}">${esc(t)}</p>`).join('')}</div>
        <button class="btn sm ghost" id="addPara" type="button">+ Абзац</button></div>
        <aside class="side" id="pubside"><h4 style="margin:0">Публикация</h4>
          <label class="sw">Сайт<input type="checkbox" id="chSite" checked></label><label class="sw">Telegram-канал<input type="checkbox" id="chTg" checked></label>
          <div><span class="label">Когда</span><select id="when" style="width:100%"><option>Сейчас</option><option>Сегодня в 18:00</option><option>Завтра в 10:00</option></select></div>
          <div class="tgprev" id="tgprev"></div>
          <div style="display:flex;gap:8px"><button class="btn primary" id="pubBtn" style="flex:1">Опубликовать</button><button class="btn" id="draftBtn">В черновик</button></div></aside></div></div>`;
  }
  function syncArticle() {
    const t = $('#tgprev'); if (!t || !S.draft) return;
    const first = S.draft.body[0] || '';
    t.innerHTML = `<b>${esc(S.draft.title)}</b><span>${esc(first.slice(0, 110))}${first.length > 110 ? '...' : ''}</span><a href="#/blog">Читать на сайте</a>`;
  }
  function bindArticleEditor() {
    const id = S.editing.id;
    bindEditable($('.adm-page')); syncArticle();
    $('#addPara').addEventListener('click', () => {
      const i = S.draft.body.length; S.draft.body.push('Новый абзац'); const el = document.createElement('p'); el.dataset.f = 'body.' + i; el.textContent = 'Новый абзац'; $('#abody').appendChild(el);
      bindEditable($('#abody')); el.focus(); document.execCommand('selectAll');
    });
    const finish = (status) => {
      const sites = $('#chSite').checked, tg = $('#chTg').checked, when = $('#when').value;
      const prev = getPost(id);
      store.posts[id] = { title: S.draft.title, body: S.draft.body.filter(Boolean), date: prev.date, status }; persist();
      location.hash = '#/admin/posts'; route();
      if (status === 'draft') toast('Сохранено как черновик');
      else toast((when === 'Сейчас' ? 'Опубликовано: ' : 'Запланировано (' + when.toLowerCase() + '): ') + [sites ? 'сайт' : '', tg ? 'Telegram @mebel_novita' : ''].filter(Boolean).join(' и ') + ' (демо)');
    };
    $('#pubBtn').addEventListener('click', () => finish('published'));
    $('#draftBtn').addEventListener('click', () => finish('draft'));
  }
  function adminUsers() {
    if (!can('users')) return lock('Раздел «Пользователи» доступен только администратору.');
    const me = store.user;
    return `<div class="adm-page"><div class="adm-head"><div><h1>Пользователи и роли</h1><p class="muted">Администратор добавляет и удаляет сотрудников. Каждый видит только то, что нужно для его работы.</p></div></div>
      <form id="addUser" class="adduser" novalidate><div><label class="label" for="newEmail">Почта нового сотрудника</label><input id="newEmail" type="email" style="width:100%"></div>
        <div><label class="label" for="newRole">Роль</label><select id="newRole">${['editor', 'catalog', 'admin'].map((r) => `<option value="${r}">${ROLES[r].label}</option>`).join('')}</select></div>
        <button class="btn primary" type="submit"><i class="ph ph-user-plus"></i>Добавить</button></form><div id="userErr" role="alert" class="err" style="font-size:14px;margin-top:8px"></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Почта для входа</th><th>Роль</th><th>Что видит</th><th></th></tr></thead><tbody>
      ${store.users.map((u) => `<tr><td class="mono" style="font-size:14px">${esc(u.email)}${u.email === me ? ' <span class="muted">(вы)</span>' : ''}</td><td><select data-user="${u.id}">${['editor', 'catalog', 'admin'].map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLES[r].label}</option>`).join('')}</select></td>
      <td><div class="scopes">${[['blog', 'Статьи'], ['catalog', 'Товары'], ['orders', 'Заказы'], ['users', 'Пользователи'], ['integrations', 'Подключения']].map(([k, t]) => `<span class="st ${ROLES[u.role].can.includes(k) ? 'on' : 'off'}">${t}</span>`).join('')}</div></td>
      <td>${u.email === me ? '' : `<button class="btn sm ghost" data-deluser="${u.id}"><i class="ph ph-trash"></i>Удалить</button>`}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  function adminIntegr() {
    if (!can('integrations')) return lock('Раздел «Подключения» доступен только администратору.');
    const I = store.integr;
    return `<div class="adm-page"><div class="adm-head"><div><h1>Подключения</h1><p class="muted">Откуда и куда уходят данные. Все значения в демо условные.</p></div></div><div class="cards3">
      <div class="int"><h3>Ozon<span class="st ${I.ozon ? 'on' : 'off'}">${I.ozon ? 'Подключено' : 'Выключено'}</span></h3><div class="kv">Client-Id: <b>31•••842</b></div><div class="kv">Последняя синхронизация: <b id="syncT">${esc(I.ozonSync)}</b></div>
        <label class="sw">Обновлять автоматически<input type="checkbox" data-int="autosync" ${I.autosync ? 'checked' : ''}></label><button class="btn sm" id="syncNow"><i class="ph ph-arrows-clockwise"></i>Синхронизировать сейчас</button></div>
      <div class="int"><h3>Telegram<span class="st ${I.tg ? 'on' : 'off'}">${I.tg ? 'Подключено' : 'Выключено'}</span></h3><div class="kv">Канал: <b>@mebel_novita</b></div><div class="kv">Бот публикует статьи блога по кнопке «Опубликовать».</div></div>
      <div class="int"><h3>Онлайн-оплата<span class="st ${I.pay ? 'on' : 'off'}">${I.pay ? 'Подключено' : 'Не подключено'}</span></h3><div class="kv">Карты и СБП, чек по 54-ФЗ. Нужен договор эквайринга и онлайн-касса.</div><button class="btn sm primary" data-int-toggle="pay">${I.pay ? 'Отключить' : 'Подключить'}</button></div>
    </div></div>`;
  }

  function bindAdmin(b, c) {
    $$('[data-logout]').forEach((e) => e.addEventListener('click', () => { logout(); location.hash = '#/admin'; route(); toast('Вы вышли'); }));
    if (b === 'products' && c && S.editing && S.draft) bindProductEditor();
    if (b === 'posts' && c && S.editing && S.draft) bindArticleEditor();
    $$('[data-rowch]').forEach((i) => i.addEventListener('change', () => {
      const [id, k] = i.dataset.rowch.split(':'); const p = getP(id);
      const ch = { ...p.channels, [k]: i.checked };
      if (store.custom[id]) store.custom[id].channels = ch; else store.products[id] = { ...(store.products[id] || {}), channels: ch };
      persist();
      toast(({ site: 'Сайт', ozon: 'Ozon' }[k]) + ': ' + (i.checked ? 'включено' : 'выключено') + ' для «' + p.name + '»');
    }));
    $$('[data-ostatus]').forEach((s) => s.addEventListener('change', () => { const o = store.orders.find((x) => x.id === s.dataset.ostatus); o.status = s.value; persist(); toast('Заказ ' + o.id + ': ' + STATUS[o.status] + '. Покупателю отправлено уведомление (демо)'); }));
    $$('[data-user]').forEach((s) => s.addEventListener('change', () => { const u = store.users.find((x) => x.id === +s.dataset.user); u.role = s.value; if (u.email === store.user) store.role = u.role; persist(); route(true); toast('Роль изменена: ' + u.email + ', ' + ROLES[u.role].label); }));
    const au = $('#addUser'); if (au) au.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = $('#newEmail').value.trim().toLowerCase(); const err = $('#userErr');
      if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Укажите почту полностью'; return; }
      if (store.users.some((u) => u.email === email)) { err.textContent = 'Такой сотрудник уже есть'; return; }
      store.users.push({ id: Date.now(), email, role: $('#newRole').value }); persist(); route(true);
      toast('Сотрудник добавлен. Приглашение отправлено на ' + email + ' (демо)');
    });
    $$('[data-deluser]').forEach((e) => e.addEventListener('click', () => { const u = store.users.find((x) => x.id === +e.dataset.deluser); store.users = store.users.filter((x) => x.id !== u.id); persist(); route(true); toast('Доступ закрыт: ' + u.email); }));
    const sn = $('#syncNow'); if (sn) sn.addEventListener('click', () => { store.integr.ozonSync = 'только что'; persist(); $('#syncT').textContent = 'только что'; toast('Ozon: обновлено ' + allProducts().filter((p) => p.channels.ozon).length + ' цен и остатков (демо)'); });
    $$('[data-int]').forEach((i) => i.addEventListener('change', () => { store.integr[i.dataset.int] = i.checked; persist(); }));
    $$('[data-int-toggle]').forEach((e) => e.addEventListener('click', () => { const k = e.dataset.intToggle; store.integr[k] = !store.integr[k]; persist(); route(true); }));
  }

  /* ---------- рендер и маршрутизация ---------- */
  function route(keepScroll) {
    const y = window.scrollY;
    const h = (location.hash || '#/').slice(1);
    const [, a, b, c] = h.split('/');
    S.draft = null; S.touched = new Set(); S.imgIdx = 0; S.editing = null;
    document.body.classList.remove('editing', 'in-admin');

    if (a === 'login') { location.replace('#/admin'); return; }
    if (a === 'admin') {
      if (!b) {
        if (curUser()) { location.replace(START[store.role]); return; }
        $('#app').innerHTML = loginPage() + '<div class="toast" id="toast" role="status"></div>';
        document.body.classList.add('in-admin');
        const lf = $('#loginForm');
        $$('[data-fill]').forEach((e) => e.addEventListener('click', () => { $('#email').value = e.dataset.fill; $('#pass').value = DEMO_PASS; $('#loginErr').textContent = ''; }));
        lf.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const u = store.users.find((x) => x.email === $('#email').value.trim().toLowerCase());
          if (!u || $('#pass').value !== DEMO_PASS) { $('#loginErr').textContent = 'Неверная почта или пароль'; return; }
          loginUser(u); location.hash = START[u.role]; route();
        });
        window.scrollTo(0, 0);
        return;
      }
      if (!curUser()) { location.replace('#/admin'); return; }
      let html;
      if (b === 'overview') html = adminOverview();
      else if (b === 'products') html = c ? adminProductEditor(c) : adminProducts();
      else if (b === 'orders') html = adminOrders();
      else if (b === 'posts' && c === 'new') {
        if (!can('blog')) html = lock('Писать статьи могут редактор статей и администратор.');
        else { const id = 'new-' + Date.now(); store.posts[id] = { title: 'Новая статья', date: new Date().toISOString().slice(0, 10), status: 'draft', body: ['Начните писать здесь.'] }; persist(); location.replace('#/admin/posts/' + id); return; }
      }
      else if (b === 'posts') html = c ? adminArticleEditor(c) : adminPosts();
      else if (b === 'users') html = adminUsers();
      else if (b === 'integrations') html = adminIntegr();
      else { location.replace(START[store.role]); return; }
      $('#app').innerHTML = adminShell(html, b);
      document.body.classList.add('in-admin');
      if (S.editing) document.body.classList.add('editing');
      bindAdmin(b, c);
      window.scrollTo(0, keepScroll === true ? y : 0);
      return;
    }

    let html;
    if (!a) html = home();
    else if (a === 'catalog') html = catalog(b);
    else if (a === 'p') html = product(b);
    else if (a === 'cart') html = cartPage();
    else if (a === 'checkout') html = checkoutPage();
    else if (a === 'order') html = orderPage(b);
    else if (a === 'blog' && b) html = article(b);
    else if (a === 'blog') html = blogList();
    else if (a === 'contacts') html = contacts();
    else html = home();
    $('#app').innerHTML = header() + `<main>${html}</main>` + footer() + staffPill(a, b) + '<div class="toast" id="toast" role="status"></div>';
    bindPublic(a, b);
    observeReveal();
    $$('[data-count]').forEach((el) => { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { countUp(el); io.disconnect(); } }); io.observe(el); });
    window.scrollTo(0, keepScroll === true ? y : 0);
  }

  /* ссылки для показа: ?role=catalog входит сразу под нужной почтой */
  const qs = new URLSearchParams(location.search);
  if (ROLES[qs.get('role')] && qs.get('role') !== 'guest') loginAs(qs.get('role'));

  window.addEventListener('hashchange', route);
  route();
})();
