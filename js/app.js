/* Демо сайта фабрики «Новита». Без сборки: открывается как обычный сайт, состояние хранится в localStorage. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => new Intl.NumberFormat('ru-RU').format(n).replace(/ /g, ' ');
  const rub = (n) => num(n) + ' ₽';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = 'img/';

  /* ---------- состояние ---------- */
  const KEY = 'nv-demo-v1';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { store = {}; }
  store.role ||= 'guest';
  store.products ||= {};
  store.posts ||= {};
  store.users ||= USERS.map((u) => ({ ...u }));
  store.integr ||= { ozon: true, tg: true, pay: false, ozonSync: 'сегодня, 09:12', autosync: true };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* демо работает и без хранилища */ } };

  const S = { edit: false, sel: null, draft: null, touched: new Set(), img: 0 };
  const can = (k) => ROLES[store.role].can.includes(k);

  const getP = (id) => {
    const base = PRODUCTS.find((p) => p.id === id);
    return base ? { ...base, ...(store.products[id] || {}) } : null;
  };
  const allPosts = () => {
    const base = POSTS.map((p) => ({ ...p, ...(store.posts[p.id] || {}) }));
    const extra = Object.entries(store.posts).filter(([id]) => id.startsWith('new-')).map(([id, p]) => ({ id, ...p }));
    return [...extra, ...base];
  };
  const getPost = (id) => allPosts().find((p) => p.id === id);
  const fromPrice = (p) => Math.min(...p.variants.map((v) => v.retail));

  /* ---------- утилиты UI ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
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

  /* ---------- общие куски ---------- */
  function header() {
    const r = location.hash || '#/';
    const on = (p) => (r.startsWith(p) ? 'on' : '');
    return `<header class="header"><div class="wrap">
      <a class="brand" href="#/"><i></i>НОВИТА</a>
      <nav class="nav"><a class="${on('#/catalog')}" href="#/catalog">Каталог</a><a class="${on('#/blog')}" href="#/blog">Блог</a><a class="${on('#/contacts')}" href="#/contacts">Контакты</a></nav>
      <span class="tel">+7 (843) 512-00-08</span>
      <button class="btn primary sm" data-price>Запросить прайс</button>
    </div></header>`;
  }
  function adminbar() {
    if (store.role === 'guest') return '';
    const role = ROLES[store.role];
    const r = location.hash || '#/';
    const lnk = (h, t, ic) => `<a class="${r.startsWith(h) ? 'on' : ''}" href="${h}"><i class="ph ph-${ic}"></i>${t}</a>`;
    let links = '';
    if (store.role === 'editor') links = lnk('#/blog', 'Статьи', 'article') + `<a href="#/blog/new" data-newpost><i class="ph ph-plus"></i>Новая статья</a>`;
    if (store.role === 'catalog') links = lnk('#/admin/products', 'Товары', 'package');
    if (store.role === 'admin') links = lnk('#/admin/products', 'Товары', 'package') + lnk('#/blog', 'Статьи', 'article') + lnk('#/admin/users', 'Пользователи', 'users') + lnk('#/admin/integrations', 'Подключения', 'plugs-connected');
    const editable = (r.startsWith('#/p/') && can('catalog')) || (r.startsWith('#/blog/') && can('blog'));
    const toggle = editable ? `<button id="editToggle" class="${S.edit ? 'on' : ''}"><i class="ph ph-pencil-simple"></i>${S.edit ? 'Выйти из правки' : 'Режим правки'}</button>` : '';
    return `<div class="adminbar"><div class="wrap"><b>${role.label}</b><span class="note">${role.note}</span><nav>${links}${toggle}</nav></div></div>`;
  }
  function dock() {
    const btn = (k) => `<button data-role="${k}" class="${store.role === k ? 'on' : ''}">${ROLES[k].label}</button>`;
    return `<div class="dock"><span class="t">ДЕМО: смотреть сайт как</span><div class="row">${['guest', 'editor', 'catalog', 'admin'].map(btn).join('')}<button class="reset" data-reset>Сбросить</button></div></div>`;
  }
  function footer() {
    return `<footer class="footer"><div class="wrap">
      <div><a class="brand" href="#/"><i></i>НОВИТА</a><p class="muted" style="margin-top:12px;max-width:36ch">Фабрика механизмов и мебели для здорового сна. Работаем с 1998 года.</p></div>
      <div><h4>Адрес</h4><p>Казань, ул. Рахимова, 8, корп. 9</p><p class="muted">Салон в ТЦ «Мегга-мебель», 3 этаж</p></div>
      <div><h4>Связь</h4><a class="mono" href="#/contacts">+7 (843) 512-00-08</a><a href="#/contacts">info@metallstil.ru</a><a href="#/contacts">Telegram @mebel_novita</a></div>
    </div></footer>`;
  }
  function pcard(p, cls = '') {
    const hit = p.hit ? '<span class="tag">Хит</span>' : '';
    const demo = p.demo ? '<span class="tag demo" style="left:auto;right:12px">демо-цена</span>' : '';
    return `<a class="pcard ${cls}" href="#/p/${p.id}" data-reveal>
      <div class="pic">${hit}${demo}<img class="${p.fit || ''}" src="${IMG}${p.img}" alt="${esc(p.name)}" loading="lazy"></div>
      <div class="body"><h3>${esc(p.name)}</h3><div class="price"><small>от </small>${rub(fromPrice(p))}</div></div></a>`;
  }

  /* ---------- страницы ---------- */
  function home() {
    const big = getP('strajp-1n');
    const count = (c) => PRODUCTS.filter((p) => p.cat === c).length;
    const tile = (cls, c) => `<a class="tile ${cls}" href="#/catalog/${c}" data-reveal><img src="${IMG}${CATS[c].img}" alt="" loading="lazy"><div class="cap"><h3>${CATS[c].name}</h3><span>${count(c)} моделей</span></div></a>`;
    return `
    <section class="hero"><div class="wrap grid">
      <div data-reveal><h1>Металлические кровати и <em>механизмы</em> из Казани</h1>
        <p class="lead">Фабрика «Новита» делает кровати, механизмы трансформации и основания. Отгрузка в день обращения из наличия.</p>
        <div class="cta"><a class="btn primary" href="#/catalog">Смотреть каталог</a><button class="btn" data-price>Запросить прайс</button></div></div>
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
        <div class="stack">${pcard(getP('tandem-5'), 'wide')}${pcard(getP('kanzona'), 'wide')}</div>
      </div></div></section>

    <section class="block" style="padding-top:0"><div class="wrap facts">
      <div data-reveal><h2 class="sec-title" style="margin-bottom:0">Работаем с оптом по всей России</h2><p>Более 1000 клиентов уже заказывают у нас кровати и механизмы. Любой серийный образец меняем под ваш запрос: размер, цвет, комплектацию.</p><button class="btn primary" data-price>Запросить прайс</button></div>
      <div class="nums" data-reveal><div class="num"><b>2500</b><span>кв. м производства</span></div><div class="num"><b>5000+</b><span>изделий в месяц</span></div><div class="num"><b>18</b><span>месяцев гарантии</span></div></div>
    </div></section>`;
  }

  function catalog(cat) {
    const list = PRODUCTS.filter((p) => !cat || p.cat === cat).map((p) => getP(p.id));
    const chips = `<a class="chip ${!cat ? 'on' : ''}" href="#/catalog">Все</a>` + Object.entries(CATS).map(([k, c]) => `<a class="chip ${cat === k ? 'on' : ''}" href="#/catalog/${k}">${c.name}</a>`).join('');
    return `<div class="wrap page-pad"><h1>${cat ? CATS[cat].name : 'Каталог'}</h1><p class="muted">${list.length} моделей. Цены розничные, оптовые видны после регистрации.</p>
      <div class="chips" style="margin:24px 0">${chips}</div><div class="grid-cards">${list.map((p) => pcard(p)).join('')}</div></div>`;
  }

  function product(id) {
    const p = getP(id);
    if (!p) return `<div class="wrap lock"><h1>Товар не найден</h1><a class="btn" href="#/catalog">В каталог</a></div>`;
    if (!S.sel || !p.variants.some((v) => v.size === S.sel.size && v.color === S.sel.color)) S.sel = { size: p.variants[0].size, color: p.variants[0].color };
    const sizes = [...new Set(p.variants.map((v) => v.size))];
    const v = p.variants.find((x) => x.size === S.sel.size && x.color === S.sel.color) || p.variants[0];
    const colorBlock = p.colorOpt
      ? `<div><span class="label">${esc(p.colorOpt.label)}: <b id="colorName" style="color:var(--ink)">${esc(S.sel.color)}</b></span><div class="chips" id="colors">${p.colorOpt.items.map((c) => `<button class="chip color ${c.name === S.sel.color ? 'on' : ''}" data-color="${esc(c.name)}" title="${esc(c.name)}"><i style="background:${c.swatch}"></i>${esc(c.name)}</button>`).join('')}</div></div>`
      : '';
    const ch = p.channels;
    const st = (k, t) => `<span class="st ${ch[k] ? 'on' : 'off'}"><i class="ph ph-${ch[k] ? 'check-circle' : 'minus-circle'}"></i>${t}</span>`;
    return `<div class="wrap"><div class="crumbs"><a href="#/catalog">Каталог</a><span>/</span><a href="#/catalog/${p.cat}">${CATS[p.cat].name}</a><span>/</span><span>${esc(p.name)}</span></div>
    <div class="pp">
      <div class="stage-wrap">
        <div class="stage" id="stage"><img class="main ${p.fit || ''}" id="mainImg" alt="${esc(p.name)}">
          <div id="pins"></div><span class="hint" id="hint"></span></div>
        <div class="thumbs" id="thumbs"></div>
      </div>
      <div class="info">
        <div class="status">${st('site', 'Сайт')}${st('ozon', 'Ozon')}${st('tg', 'Telegram')}${p.demo ? '<span class="demo-note">демо-данные</span>' : ''}</div>
        <h1 data-f="name">${esc(p.name)}</h1>
        <p class="lead" data-f="lead">${esc(p.lead)}</p>
        <div><span class="label">Размер, см</span><div class="chips" id="sizes">${sizes.map((s) => `<button class="chip ${s === S.sel.size ? 'on' : ''}" data-size="${s}">${s}</button>`).join('')}</div></div>
        ${colorBlock}
        <div class="pricebox"><span class="label" style="margin:0">Розничная цена</span>
          <div class="retail"><span data-f="price.retail" id="retail">${num(v.retail)}</span> ₽</div>
          <div class="optp">Опт: <span data-f="price.opt" id="opt">${num(v.opt)}</span> ₽ для зарегистрированных</div>
          <div class="actions"><button class="btn primary" data-price>Оставить заявку</button><button class="btn" data-toast="Инструкция по сборке скачана (демо)"><i class="ph ph-file-pdf"></i>Инструкция</button></div></div>
      </div>
    </div>
    <div class="stats" data-reveal>${p.stats.map((s, i) => `<div><b data-count data-f="stats.${i}.value">${esc(s.value)}</b><em>${esc(s.unit)}</em><span data-f="stats.${i}.label">${esc(s.label)}</span></div>`).join('')}</div>
    <h2 class="sec-title" style="margin:56px 0 0;font-size:28px" data-reveal>Характеристики</h2>
    <div class="spec-grid" data-reveal>${p.specs.map(([t, rows]) => `<div class="spec"><h3>${t}</h3><dl>${rows.map(([k, val]) => `<div><dt>${k}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl></div>`).join('')}</div>
    <h2 class="sec-title" style="margin:64px 0 24px;font-size:28px">Другие модели</h2>
    <div class="grid-cards" style="padding-bottom:96px">${PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 3).map((x) => pcard(getP(x.id))).join('') || PRODUCTS.filter((x) => x.id !== p.id).slice(0, 3).map((x) => pcard(getP(x.id))).join('')}</div></div>
    <aside class="publish" id="publish"><h4>Публикация</h4><div class="changes" id="changes">Изменений нет</div>
      <label class="sw">Сайт<input type="checkbox" data-ch="site"></label><label class="sw">Ozon<input type="checkbox" data-ch="ozon"></label><label class="sw">Telegram-канал<input type="checkbox" data-ch="tg"></label>
      <div class="muted" id="chnote" style="font-size:13px"></div>
      <div style="display:flex;gap:8px"><button class="btn primary" id="saveP" style="flex:1">Сохранить</button><button class="btn" id="cancelP">Отмена</button></div></aside>`;
  }

  function blogList() {
    const list = allPosts().filter((p) => p.status === 'published' || can('blog'));
    return `<div class="wrap page-pad"><div class="sec-head"><div><h1>Блог</h1><p class="muted">Советы по выбору кроватей и механизмов.</p></div>${can('blog') ? '<a class="btn primary" href="#/blog/new" data-newpost><i class="ph ph-plus"></i>Новая статья</a>' : ''}</div>
      <div class="posts">${list.map((p) => `<a class="post" href="#/blog/${p.id}" data-reveal><h3>${esc(p.title)}</h3><p>${esc(p.body[0] || '')}</p><div class="meta"><span>${p.date}</span><span class="state ${p.status === 'published' ? 'pub' : ''}">${p.status === 'published' ? 'Опубликовано' : 'Черновик'}</span></div></a>`).join('')}</div></div>`;
  }
  function article(id) {
    const p = getPost(id);
    if (!p) return `<div class="wrap lock"><h1>Статья не найдена</h1><a class="btn" href="#/blog">В блог</a></div>`;
    return `<div class="wrap"><div class="crumbs"><a href="#/blog">Блог</a><span>/</span><span>${esc(p.title)}</span></div>
      <div class="article"><div><span class="state ${p.status === 'published' ? 'pub' : ''}" style="display:inline-block;margin-bottom:16px">${p.status === 'published' ? 'Опубликовано' : 'Черновик'}</span>
        <h1 data-f="title">${esc(p.title)}</h1><div class="body" id="abody">${p.body.map((t, i) => `<p data-f="body.${i}">${esc(t)}</p>`).join('')}</div>
        <button class="btn sm ghost" id="addPara" style="display:none">+ Абзац</button></div>
        <aside class="side" id="pubside"><h4 style="margin:0">Публикация</h4>
          <label class="sw">Сайт<input type="checkbox" id="chSite" checked></label><label class="sw">Telegram-канал<input type="checkbox" id="chTg" checked></label>
          <div><span class="label">Когда</span><select id="when" style="width:100%"><option>Сейчас</option><option>Сегодня в 18:00</option><option>Завтра в 10:00</option></select></div>
          <div class="tgprev" id="tgprev"></div>
          <div style="display:flex;gap:8px"><button class="btn primary" id="pubBtn" style="flex:1">Опубликовать</button><button class="btn" id="draftBtn">В черновик</button></div></aside></div></div>`;
  }

  function lock(msg) {
    return `<div class="wrap lock"><h1>Нет доступа</h1><p>${msg}</p><p class="muted" style="font-size:14px">В демо роль меняется в плашке слева внизу.</p></div>`;
  }
  function adminProducts() {
    if (!can('catalog')) return lock('Раздел «Товары» доступен менеджеру каталога и администратору.');
    return `<div class="wrap page-pad"><h1>Товары</h1><p class="muted">Нажмите «Править», карточка откроется в режиме правки. Каналы включаются прямо в списке.</p>
      <div class="scroll" style="overflow-x:auto"><table class="table"><thead><tr><th></th><th>Название</th><th>Розница от</th><th>Сайт</th><th>Ozon</th><th>Telegram</th><th></th></tr></thead><tbody>
      ${PRODUCTS.map((b) => { const p = getP(b.id); return `<tr><td><img class="thumb" src="${IMG}${p.img}" alt=""></td><td><b>${esc(p.name)}</b><div class="muted" style="font-size:13px">${CATS[p.cat].name}</div></td><td class="mono">${rub(fromPrice(p))}</td>
        ${['site', 'ozon', 'tg'].map((k) => `<td><label class="sw" style="border:0;padding:0"><input type="checkbox" data-rowch="${p.id}:${k}" ${p.channels[k] ? 'checked' : ''}></label></td>`).join('')}
        <td><a class="btn sm" href="#/p/${p.id}" data-autoedit><i class="ph ph-pencil-simple"></i>Править</a></td></tr>`; }).join('')}
      </tbody></table></div></div>`;
  }
  function adminUsers() {
    if (!can('users')) return lock('Раздел «Пользователи» доступен только администратору.');
    return `<div class="wrap page-pad"><div class="sec-head"><div><h1>Пользователи и роли</h1><p class="muted">Каждый сотрудник видит только то, что нужно для его работы.</p></div><button class="btn primary" data-toast="Приглашение отправлено (демо)"><i class="ph ph-user-plus"></i>Пригласить</button></div>
      <table class="table"><thead><tr><th>Сотрудник</th><th>Роль</th><th>Что видит</th></tr></thead><tbody>
      ${store.users.map((u) => `<tr><td><b>${esc(u.name)}</b></td><td><select data-user="${u.id}">${['editor', 'catalog', 'admin'].map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLES[r].label}</option>`).join('')}</select></td>
      <td><div class="scopes">${[['blog', 'Статьи'], ['catalog', 'Товары'], ['users', 'Пользователи'], ['integrations', 'Подключения']].map(([k, t]) => `<span class="st ${ROLES[u.role].can.includes(k) ? 'on' : 'off'}">${t}</span>`).join('')}</div></td></tr>`).join('')}
      </tbody></table></div>`;
  }
  function adminIntegr() {
    if (!can('integrations')) return lock('Раздел «Подключения» доступен только администратору.');
    const I = store.integr;
    return `<div class="wrap page-pad"><h1>Подключения</h1><p class="muted">Откуда и куда уходят данные. Все значения в демо условные.</p><div class="cards3">
      <div class="int"><h3>Ozon<span class="st ${I.ozon ? 'on' : 'off'}">${I.ozon ? 'Подключено' : 'Выключено'}</span></h3><div class="kv">Client-Id: <b>31•••842</b></div><div class="kv">Последняя синхронизация: <b id="syncT">${esc(I.ozonSync)}</b></div>
        <label class="sw">Обновлять автоматически<input type="checkbox" data-int="autosync" ${I.autosync ? 'checked' : ''}></label><button class="btn sm" id="syncNow"><i class="ph ph-arrows-clockwise"></i>Синхронизировать сейчас</button></div>
      <div class="int"><h3>Telegram<span class="st ${I.tg ? 'on' : 'off'}">${I.tg ? 'Подключено' : 'Выключено'}</span></h3><div class="kv">Канал: <b>@mebel_novita</b></div><div class="kv">Бот публикует статьи и новинки по кнопке «Опубликовать».</div></div>
      <div class="int"><h3>Онлайн-оплата<span class="st ${I.pay ? 'on' : 'off'}">${I.pay ? 'Подключено' : 'Не подключено'}</span></h3><div class="kv">Карты и СБП, чек по 54-ФЗ. Нужен договор эквайринга и онлайн-касса.</div><button class="btn sm primary" data-int-toggle="pay">${I.pay ? 'Отключить' : 'Подключить'}</button></div>
    </div></div>`;
  }
  function contacts() {
    return `<div class="wrap page-pad"><h1>Контакты</h1><div class="cards3">
      <div class="int"><h3>Адрес</h3><p>Казань, ул. Рахимова, 8, корп. 9</p><p class="muted">Салон мебели: ТЦ «Мегга-мебель», 3 этаж, 4 линия</p></div>
      <div class="int"><h3>Телефоны</h3><p class="mono">+7 (843) 512-00-08</p><p class="mono">+7 (843) 512-00-87</p><p class="mono">+7 (904) 668-94-12</p></div>
      <div class="int"><h3>Онлайн</h3><p>info@metallstil.ru</p><p>Telegram: @mebel_novita</p><p class="muted">Пн-Пт, 07:30-19:30 по Москве</p></div></div></div>`;
  }

  /* ---------- рендер и маршрутизация ---------- */
  function route(keepScroll) {
    const y = window.scrollY;
    const h = (location.hash || '#/').slice(1);
    const [, a, b] = h.split('/');
    const auto = S.autoEdit; S.autoEdit = false;
    S.edit = false; S.draft = null; S.touched = new Set(); S.img = 0;
    let html;
    if (!a) html = home();
    else if (a === 'catalog') html = catalog(b);
    else if (a === 'p') html = product(b);
    else if (a === 'blog' && b === 'new') {
      if (!can('blog')) html = lock('Писать статьи могут редактор статей и администратор.');
      else { const id = 'new-' + Date.now(); store.posts[id] = { title: 'Новая статья', date: new Date().toISOString().slice(0, 10), status: 'draft', body: ['Начните писать здесь.'] }; persist(); location.replace('#/blog/' + id); S.autoEdit = true; return; }
    }
    else if (a === 'blog' && b) html = article(b);
    else if (a === 'blog') html = blogList();
    else if (a === 'admin' && b === 'products') html = adminProducts();
    else if (a === 'admin' && b === 'users') html = adminUsers();
    else if (a === 'admin' && b === 'integrations') html = adminIntegr();
    else if (a === 'contacts') html = contacts();
    else html = home();
    $('#app').innerHTML = header() + adminbar() + `<main>${html}</main>` + footer() + dock() + `<div class="toast" id="toast" role="status"></div>`;
    document.body.classList.remove('editing');
    bind(a, b);
    if (auto) setEdit(true, a, b);
    observeReveal();
    $$('[data-count]').forEach((el) => { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && !S.edit) { countUp(el); io.disconnect(); } }); io.observe(el); });
    window.scrollTo(0, keepScroll === true ? y : 0);
  }

  /* режим правки */
  function setEdit(on, a, b) {
    S.edit = on;
    document.body.classList.toggle('editing', on);
    const tg = $('#editToggle'); if (tg) { tg.classList.toggle('on', on); tg.innerHTML = `<i class="ph ph-pencil-simple"></i>${on ? 'Выйти из правки' : 'Режим правки'}`; }
    $$('[data-f]').forEach((el) => { if (on) el.setAttribute('contenteditable', 'true'); else el.removeAttribute('contenteditable'); });
    const addPara = $('#addPara'); if (addPara) addPara.style.display = on ? '' : 'none';
    if (on) {
      S.touched = new Set();
      if (a === 'p') { const p = getP(b); S.draft = JSON.parse(JSON.stringify({ name: p.name, lead: p.lead, variants: p.variants, stats: p.stats, channels: p.channels })); syncPanel(); }
      if (a === 'blog') { const p = getPost(b); S.draft = JSON.parse(JSON.stringify({ title: p.title, body: p.body })); syncArticle(); }
      const first = $('[data-f]'); if (first) first.focus();
    }
  }
  function syncPanel() {
    const n = S.touched.size;
    $('#changes').innerHTML = n ? `Изменено полей: <b>${n}</b>` : 'Изменений нет';
    $$('[data-ch]').forEach((i) => { i.checked = !!S.draft.channels[i.dataset.ch]; });
    const priceTouched = [...S.touched].some((t) => t.startsWith('price'));
    $('#chnote').textContent = priceTouched && S.draft.channels.ozon ? 'Розничная цена также обновится в Ozon.' : '';
  }
  function syncArticle() {
    const title = S.draft ? S.draft.title : '';
    const first = S.draft ? (S.draft.body[0] || '') : '';
    $('#tgprev').innerHTML = `<b>${esc(title)}</b><span>${esc(first.slice(0, 110))}${first.length > 110 ? '...' : ''}</span><a href="#">Читать на сайте</a>`;
  }
  function selVariant() { return S.draft.variants.find((x) => x.size === S.sel.size && x.color === S.sel.color); }

  /* фото, миниатюры и точки зависят от выбранного цвета. Если фото в этом цвете нет, остаётся прежнее и об этом сказано в подписи. */
  function renderStage(p) {
    const opt = p.colorOpt;
    const item = opt && opt.items.find((i) => i.name === S.sel.color);
    const gal = (item && item.gallery) || p.gallery;
    const pins = item ? (item.pins || []) : p.pins;
    const shown = opt ? opt.items.find((i) => i.gallery) : null;
    const missing = opt && item && !item.gallery && shown;
    const img = $('#mainImg');
    const i = Math.min(S.img, gal.length - 1);
    const src = IMG + gal[i];
    if (img.getAttribute('src') !== src) {
      img.style.opacity = 0;
      setTimeout(() => { img.src = src; img.style.opacity = 1; }, img.getAttribute('src') ? 160 : 0);
    }
    $('#pins').innerHTML = i === 0 ? pins.map((pn, k) => `<div class="pin ${pn.x > 55 ? 'flip' : ''}" style="left:${pn.x}%;top:${pn.y}%"><button class="dot" aria-label="${esc(pn.title)}">${k + 1}</button><div class="tip"><b>${esc(pn.title)}</b>${esc(pn.text)}</div></div>`).join('') : '';
    $$('#pins .dot').forEach((d) => d.addEventListener('click', () => d.parentElement.classList.toggle('open')));
    $('#hint').innerHTML = missing
      ? `<i class="ph ph-info"></i> Фото пока в цвете «${esc(shown.name)}»`
      : `<i class="ph ph-cursor-click"></i> ${pins.length && i === 0 ? 'Нажмите на точки' : 'Фото модели'}`;
    const th = $('#thumbs');
    th.style.display = gal.length > 1 ? '' : 'none';
    th.innerHTML = gal.length > 1 ? gal.map((g, k) => `<button class="${k === i ? 'on' : ''}" data-img="${k}" aria-label="Фото ${k + 1}"><img src="${IMG}${g}" alt=""></button>`).join('') : '';
    $$('[data-img]').forEach((b) => b.addEventListener('click', () => { S.img = +b.dataset.img; renderStage(p); }));
  }

  function bind(a, b) {
    /* общие */
    $$('[data-price]').forEach((e) => e.addEventListener('click', () => toast('Заявка принята. Менеджер перезвонит в течение 5 минут (демо)')));
    $$('[data-toast]').forEach((e) => e.addEventListener('click', () => toast(e.dataset.toast)));
    $$('[data-role]').forEach((e) => e.addEventListener('click', () => { store.role = e.dataset.role; persist(); const h = location.hash || '#/'; if (store.role === 'guest' && h.startsWith('#/admin')) location.hash = '#/'; route(); }));
    const rs = $('[data-reset]'); if (rs) rs.addEventListener('click', () => { store = {}; try { localStorage.removeItem(KEY); } catch { /* нет хранилища */ } location.hash = '#/'; location.reload(); });
    $$('[data-autoedit]').forEach((e) => e.addEventListener('click', () => { S.autoEdit = true; }));
    const et = $('#editToggle'); if (et) et.addEventListener('click', () => setEdit(!S.edit, a, b));

    /* поля с contenteditable: общий обработчик */
    $$('[data-f]').forEach((el) => {
      el.addEventListener('paste', (ev) => { ev.preventDefault(); document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain')); });
      el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && a === 'p') { ev.preventDefault(); el.blur(); } });
      el.addEventListener('input', () => {
        if (!S.edit || !S.draft) return;
        const f = el.dataset.f;
        if (a === 'p') {
          if (f === 'price.retail' || f === 'price.opt') { selVariant()[f === 'price.retail' ? 'retail' : 'opt'] = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0; }
          else setPath(S.draft, f, el.textContent.trim());
          S.touched.add(f); syncPanel();
        } else if (a === 'blog') { setPath(S.draft, f, el.textContent); S.touched.add(f); syncArticle(); }
      });
      el.addEventListener('blur', () => {
        if (a === 'p' && S.draft && (el.dataset.f === 'price.retail' || el.dataset.f === 'price.opt')) { const v = selVariant(); el.textContent = num(el.dataset.f === 'price.retail' ? v.retail : v.opt); }
      });
    });

    if (a === 'p') {
      const p = getP(b);
      const upd = () => {
        const v = (S.edit ? S.draft.variants : p.variants).find((x) => x.size === S.sel.size && x.color === S.sel.color) || p.variants[0];
        $('#retail').textContent = num(v.retail); $('#opt').textContent = num(v.opt);
      };
      $$('[data-size]').forEach((e) => e.addEventListener('click', () => { S.sel.size = e.dataset.size; $$('[data-size]').forEach((x) => x.classList.toggle('on', x === e)); upd(); }));
      $$('[data-color]').forEach((e) => e.addEventListener('click', () => {
        S.sel.color = e.dataset.color; S.img = 0;
        $$('[data-color]').forEach((x) => x.classList.toggle('on', x === e));
        const cn = $('#colorName'); if (cn) cn.textContent = S.sel.color;
        upd(); renderStage(p);
      }));
      renderStage(p);
      const stage = $('#stage');
      if (!reduce && stage) {
        const img = $('#mainImg');
        stage.addEventListener('pointermove', (e) => { if (S.edit) return; const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5; img.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 4}deg) scale(1.04)`; });
        stage.addEventListener('pointerleave', () => { img.style.transform = ''; });
      }
      $$('[data-ch]').forEach((i) => i.addEventListener('change', () => { if (!S.draft) return; S.draft.channels[i.dataset.ch] = i.checked; S.touched.add('ch.' + i.dataset.ch); syncPanel(); }));
      const cancel = $('#cancelP'); if (cancel) cancel.addEventListener('click', () => route(true));
      const saveP = $('#saveP'); if (saveP) saveP.addEventListener('click', () => {
        store.products[b] = JSON.parse(JSON.stringify(S.draft)); persist();
        const ch = S.draft.channels; const where = ['site', 'ozon', 'tg'].filter((k) => ch[k]).map((k) => ({ site: 'сайте', ozon: 'Ozon', tg: 'Telegram' }[k]));
        route(true);
        toast('Сохранено. Обновится: ' + (where.join(', ') || 'нигде (всё выключено)') + ' (демо)');
      });
    }

    if (a === 'blog' && b && b !== 'new') {
      const ap = $('#addPara'); if (ap) ap.addEventListener('click', () => {
        const i = S.draft.body.length; S.draft.body.push('Новый абзац'); const el = document.createElement('p'); el.dataset.f = 'body.' + i; el.textContent = 'Новый абзац'; el.setAttribute('contenteditable', 'true'); $('#abody').appendChild(el);
        el.addEventListener('input', () => { S.draft.body[i] = el.textContent; S.touched.add('body.' + i); syncArticle(); }); el.focus(); document.execCommand('selectAll');
      });
      const finish = (status) => {
        const sites = $('#chSite').checked, tg = $('#chTg').checked, when = $('#when').value;
        const prev = getPost(b);
        store.posts[b] = { title: S.draft.title, body: S.draft.body.filter(Boolean), date: prev.date, status }; persist(); route(true);
        if (status === 'draft') toast('Сохранено как черновик');
        else toast((when === 'Сейчас' ? 'Опубликовано: ' : 'Запланировано (' + when.toLowerCase() + '): ') + [sites ? 'сайт' : '', tg ? 'Telegram @mebel_novita' : ''].filter(Boolean).join(' и ') + ' (демо)');
      };
      const pb = $('#pubBtn'); if (pb) pb.addEventListener('click', () => finish('published'));
      const db = $('#draftBtn'); if (db) db.addEventListener('click', () => finish('draft'));
    }

    $$('[data-rowch]').forEach((i) => i.addEventListener('change', () => {
      const [id, k] = i.dataset.rowch.split(':'); const p = getP(id);
      store.products[id] = { ...(store.products[id] || {}), channels: { ...p.channels, [k]: i.checked } }; persist();
      toast(({ site: 'Сайт', ozon: 'Ozon', tg: 'Telegram' }[k]) + ': ' + (i.checked ? 'включено' : 'выключено') + ' для «' + p.name + '»');
    }));
    $$('[data-user]').forEach((s) => s.addEventListener('change', () => { const u = store.users.find((x) => x.id === +s.dataset.user); u.role = s.value; persist(); route(); toast('Роль изменена: ' + u.name + ', ' + ROLES[u.role].label); }));
    const sn = $('#syncNow'); if (sn) sn.addEventListener('click', () => { store.integr.ozonSync = 'только что'; persist(); $('#syncT').textContent = 'только что'; toast('Ozon: обновлено 14 цен и 14 остатков (демо)'); });
    $$('[data-int]').forEach((i) => i.addEventListener('change', () => { store.integr[i.dataset.int] = i.checked; persist(); }));
    $$('[data-int-toggle]').forEach((e) => e.addEventListener('click', () => { const k = e.dataset.intToggle; store.integr[k] = !store.integr[k]; persist(); route(); }));
  }

  /* ссылки для показа: ?role=catalog открывает сайт сразу в нужной роли, &edit=1 включает режим правки */
  const qs = new URLSearchParams(location.search);
  if (ROLES[qs.get('role')]) { store.role = qs.get('role'); persist(); }
  if (qs.get('edit') === '1') S.autoEdit = true;

  window.addEventListener('hashchange', route);
  route();
})();
