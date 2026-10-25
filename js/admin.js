/* Кабинет сотрудников (адрес /admin): отдельная оболочка с боковым меню, меню зависит от роли. */
const ADM = (() => {
  const { $, $$, esc, num, rub, IMG, img, clone, store, persist, persistFailed, S, can, curUser, START, loginUser, logout, STATUS, getP, allProducts, visibleProducts, allPosts, getPost,
    fromPrice, patchProduct, ozonPrice, priceOf, total, itemLabel, orderHistory, setOrderStatus, log, toast, setPath, fdt, toDate, download, maskPhone } = NV;

  const NAV = [
    ['overview', 'Обзор', 'squares-four', 'users'],
    ['products', 'Товары', 'package', 'catalog'],
    ['orders', 'Заказы', 'receipt', 'orders'],
    ['leads', 'Заявки', 'phone-call', 'leads'],
    ['posts', 'Статьи', 'article', 'blog'],
    ['ozon', 'Ozon', 'arrows-clockwise', 'ozon'],
    ['seo', 'SEO и редиректы', 'magnifying-glass', 'seo'],
    ['users', 'Пользователи', 'users', 'users'],
    ['integrations', 'Подключения', 'plugs-connected', 'integrations'],
  ];
  const LOW = 10;

  function shell(html, active) {
    const role = ROLES[store.role];
    const me = curUser();
    const newCount = store.orders.filter((o) => o.status === 'new').length;
    const newLeads = store.leads.filter((l) => l.status === 'new').length;
    const badge = (k) => (k === 'orders' && newCount ? `<span class="cnt">${newCount}</span>` : k === 'leads' && newLeads ? `<span class="cnt">${newLeads}</span>` : '');
    const nav = NAV.filter(([, , , perm]) => can(perm)).map(([k, t, ic]) => `<a class="${active === k ? 'on' : ''}" href="#/admin/${k}"><i class="ph ph-${ic}"></i>${t}${badge(k)}</a>`).join('');
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
  const head = (title, sub, actions = '') => `<div class="adm-head"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="adm-actions">${actions}</div></div>`;
  const kindTag = (k) => `<span class="src ${({ Ozon: 'ozon', Telegram: 'tg', Сайт: 'site' }[k]) || 'site'}">${esc(k)}</span>`;

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

  /* ---------- обзор ---------- */
  const activeOrders = () => store.orders.filter((o) => o.status !== 'canceled');
  function dayBars(days = 14) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${NV.pad(d.getMonth() + 1)}-${NV.pad(d.getDate())}`;
      out.push({ key, label: `${NV.pad(d.getDate())}.${NV.pad(d.getMonth() + 1)}`, v: activeOrders().filter((o) => o.date.startsWith(key)).reduce((s, o) => s + total(o.items), 0) });
    }
    return out;
  }
  function chartSvg(bars) {
    const max = Math.max(1, ...bars.map((b) => b.v));
    const top = Math.ceil(max / 10000) * 10000 || 10000;
    const W = 700, H = 220, L = 52, B = 28, T = 10, bw = (W - L) / bars.length;
    const y = (v) => T + (H - T - B) * (1 - v / top);
    const grid = [0, 0.5, 1].map((k) => `<line x1="${L}" x2="${W}" y1="${y(top * k)}" y2="${y(top * k)}" class="gl"/><text x="${L - 6}" y="${y(top * k) + 4}" text-anchor="end" class="ga">${top * k >= 1000 ? Math.round(top * k / 1000) + ' тыс' : 0}</text>`).join('');
    const rects = bars.map((b, i) => `<rect x="${L + i * bw + 6}" y="${y(b.v)}" width="${bw - 12}" height="${Math.max(0, H - B - y(b.v))}" class="gb"><title>${b.label}: ${rub(b.v)}</title></rect>${i % 2 === 0 ? `<text x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle" class="ga">${b.label}</text>` : ''}`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Выручка по дням за 14 дней" class="chart">${grid}${rects}</svg>`;
  }
  function overview() {
    if (!can('users')) return lock('Обзор доступен только администратору.');
    const ords = activeOrders(); const sum = ords.reduce((s, o) => s + total(o.items), 0);
    const nNew = store.orders.filter((o) => o.status === 'new').length;
    const low = allProducts().filter((p) => (p.stock ?? 0) < LOW).sort((a, b) => a.stock - b.stock);
    const lastOzon = store.log.find((l) => l.kind === 'Ozon');
    const kpi = (t, v, sub) => `<div class="kpi"><span>${t}</span><b class="mono">${v}</b><small>${sub}</small></div>`;
    return `<div class="adm-page">${head('Обзор', 'Сводка по заказам, остаткам и синхронизации. Данные демо.')}
      <div class="kpis">${kpi('Выручка', rub(sum), 'без отменённых, все каналы')}${kpi('Заказы', ords.length, nNew + ' новых требуют внимания')}${kpi('Средний чек', ords.length ? rub(sum / ords.length) : '0 ₽', 'по всем каналам')}${kpi('Мало на складе', low.length, 'остаток меньше ' + LOW + ' шт')}</div>
      <div class="two">
        <div class="panel"><h2>Выручка по дням</h2>${chartSvg(dayBars())}</div>
        <div class="panel"><h2>Каналы</h2><div class="chlist">
          <div class="chrow"><span class="src site">Сайт</span><div><b>Витрина</b><small class="okc">Работает</small></div></div>
          <a class="chrow" href="#/admin/ozon"><span class="src ozon">Ozon</span><div><b>Синхронизация</b><small>${lastOzon ? 'последняя: ' + fdt(lastOzon.t) : 'ещё не запускалась'}</small></div></a>
          <a class="chrow" href="#/admin/integrations"><span class="src tg">Telegram</span><div><b>Уведомления менеджерам</b><small class="${store.integr.tg ? 'okc' : ''}">${store.integr.tg ? 'Подключено' : 'Выключено'}</small></div></a></div></div>
      </div>
      <div class="two">
        <div class="panel"><div class="ph-row"><h2>Последние заказы</h2><a class="btn sm" href="#/admin/orders">Все заказы</a></div><div style="overflow-x:auto"><table class="table flat"><thead><tr><th>№</th><th>Канал</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>
          ${store.orders.slice(0, 6).map((o) => `<tr><td><b class="mono">${esc(o.id)}</b><div class="muted" style="font-size:12px">${fdt(o.date)}</div></td><td>${kindTag(o.source)}</td><td class="mono">${rub(total(o.items))}</td><td><span class="st ${o.status === 'new' ? 'warn' : o.status === 'canceled' ? 'off' : 'on'}">${STATUS[o.status]}</span></td></tr>`).join('')}</tbody></table></div></div>
        <div class="panel"><h2>Заканчиваются на складе</h2>${low.length ? `<div class="lowlist">${low.map((p) => `<a href="#/admin/products/${p.id}"><img class="thumb" src="${img(p.img)}" alt=""><span><b>${esc(p.name)}</b><small class="muted">${esc(p.sku)}</small></span><b class="mono ${p.stock === 0 ? 'bad' : ''}">${p.stock} шт</b></a>`).join('')}</div>` : '<p class="muted">Все товары в достаточном количестве.</p>'}</div>
      </div>
      <div class="panel"><h2>Журнал событий</h2><div class="journal">${store.log.slice(0, 8).map((l) => `<div><span class="mono muted">${fdt(l.t)}</span>${kindTag(l.kind)}<span>${esc(l.msg)}</span></div>`).join('')}</div></div></div>`;
  }

  /* ---------- товары ---------- */
  function products() {
    if (!can('catalog')) return lock('Раздел «Товары» доступен менеджеру каталога и администратору.');
    return `<div class="adm-page">${head('Товары', 'Нажмите на товар, чтобы открыть его карточку и править прямо в ней. Остаток меняется в таблице.', '<a class="btn primary" href="#/admin/products/new"><i class="ph ph-plus"></i>Добавить товар</a>')}
      <div class="toolbar"><input id="pq" type="search" placeholder="Название или артикул" aria-label="Поиск"><select id="pc" aria-label="Категория"><option value="">Все категории</option>${Object.entries(CATS).map(([k, c]) => `<option value="${k}">${c.name}</option>`).join('')}</select>
        <select id="ps" aria-label="Остаток"><option value="">Любой остаток</option><option value="low">Мало (меньше ${LOW})</option><option value="zero">Нет в наличии</option></select><span class="muted" id="pn"></span></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th></th><th>Название</th><th>Артикул</th><th>Цена от</th><th>Остаток</th><th>Сайт</th><th>Ozon</th><th></th></tr></thead><tbody id="ptb"></tbody></table></div></div>`;
  }
  function drawProducts() {
    const q = $('#pq').value.trim().toLowerCase(), c = $('#pc').value, s = $('#ps').value;
    const list = allProducts().filter((p) => (!q || (p.name + p.sku).toLowerCase().includes(q)) && (!c || p.cat === c) && (!s || (s === 'low' ? p.stock < LOW : p.stock === 0)));
    $('#pn').textContent = 'Показано: ' + list.length;
    $('#ptb').innerHTML = list.map((p) => `<tr><td><img class="thumb" src="${img(p.img)}" alt=""></td><td><a href="#/admin/products/${p.id}"><b>${esc(p.name)}</b></a><div class="muted" style="font-size:13px">${CATS[p.cat].name}${p.channels.site === false ? ', скрыт с сайта' : ''}</div></td><td class="mono" style="font-size:13px">${esc(p.sku)}</td><td class="mono">${rub(fromPrice(p))}</td>
      <td><input class="stockin ${p.stock < LOW ? 'low' : ''}" data-stock="${p.id}" inputmode="numeric" value="${p.stock}" aria-label="Остаток ${esc(p.name)}"></td>
      ${['site', 'ozon'].map((k) => `<td><label class="sw" style="border:0;padding:0"><input type="checkbox" data-rowch="${p.id}:${k}" ${p.channels[k] ? 'checked' : ''}></label></td>`).join('')}
      <td><a class="btn sm" href="#/admin/products/${p.id}"><i class="ph ph-pencil-simple"></i>Править</a></td></tr>`).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:32px">Ничего не найдено</td></tr>';
    $$('[data-stock]').forEach((i) => i.addEventListener('change', () => {
      const n = Math.max(0, parseInt(i.value.replace(/\D/g, ''), 10) || 0); const p = getP(i.dataset.stock);
      patchProduct(p.id, { stock: n }); i.value = n; i.classList.toggle('low', n < LOW);
      if (p.channels.ozon && store.ozon.stock) log('Ozon', `Остаток «${p.name}» обновлён: ${n} шт`);
      toast('Остаток сохранён' + (p.channels.ozon && store.ozon.stock ? ', отправлен в Ozon' : ''));
    }));
    $$('[data-rowch]').forEach((i) => i.addEventListener('change', () => {
      const [id, k] = i.dataset.rowch.split(':'); const p = getP(id);
      patchProduct(id, { channels: { ...p.channels, [k]: i.checked } });
      toast(({ site: 'Сайт', ozon: 'Ozon' }[k]) + ': ' + (i.checked ? 'включено' : 'выключено') + ' для «' + p.name + '»');
    }));
  }

  /* ---------- редактор товара: выглядит как карточка, поля правятся на месте ---------- */
  function blankDraft() {
    return { isNew: true, cat: 'odnoyarus', name: 'Новый товар', lead: 'Короткое описание товара: чем он удобен покупателю.', gallery: [], colorGal: false, sku: 'NV-' + Math.random().toString(36).slice(2, 7).toUpperCase(), stock: 0,
      sizes: [{ size: '120×200', prices: { 'Черный': 0, 'Белый': 0 } }], colorLabel: 'Цвет металла', colors: ['Черный', 'Белый'],
      stats: [{ id: 's1', value: '100', unit: 'кг', label: 'нагрузка на место' }, { id: 's2', value: '1,5', unit: 'мм', label: 'толщина стали' }, { id: 's3', value: '1', unit: 'день', label: 'отгрузка из наличия' }, { id: 's4', value: '18', unit: 'мес', label: 'гарантия' }],
      specs: [['Характеристики', [['Материал', 'сталь, порошковая окраска'], ['Гарантия', '18 месяцев']]]], channels: { site: true, ozon: true } };
  }
  function draftFrom(p) {
    const rows = [];
    p.variants.forEach((v) => { let r = rows.find((x) => x.size === v.size); if (!r) { r = { size: v.size, prices: {} }; rows.push(r); } r.prices[v.color] = v.retail; });
    return { isNew: false, cat: p.cat, name: p.name, lead: p.lead, gallery: clone(p.gallery || [p.img]), colorGal: !!(p.colorOpt && p.colorOpt.items.some((i) => i.gallery)), sku: p.sku, stock: p.stock ?? 0,
      sizes: rows, colorLabel: p.colorOpt ? p.colorOpt.label : 'Без выбора цвета', colors: p.colorOpt ? p.colorOpt.items.map((i) => i.name) : [],
      stats: clone(p.stats), specs: clone(p.specs), channels: { site: p.channels.site !== false, ozon: !!p.channels.ozon } };
  }
  function productEditor(id) {
    if (!can('catalog')) return lock('Править товары могут менеджер каталога и администратор.');
    const base = id === 'new' ? null : getP(id);
    if (id !== 'new' && !base) return `<div class="adm-page"><div class="lockbox"><h1>Товар не найден</h1><a class="btn" href="#/admin/products">К списку товаров</a></div></div>`;
    S.editing = { type: 'product', id, base };
    S.draft = id === 'new' ? blankDraft() : draftFrom(base);
    S.touched = new Set();
    const d = S.draft;
    return `<div class="adm-page wide"><div class="crumbs"><a href="#/admin/products">Товары</a><span>/</span><span>${d.isNew ? 'Новый товар' : esc(base.name)}</span></div>
      <p class="edit-hint"><i class="ph ph-pencil-simple"></i>Так товар увидит покупатель. Нажмите на название, описание или цифры и правьте прямо здесь. Поля, которые можно менять, подчёркнуты.</p>
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
          <div class="twof"><div><label class="label" for="edSku">Артикул</label><input id="edSku" type="text" value="${esc(d.sku)}"></div><div><label class="label" for="edStock">Остаток, шт</label><input id="edStock" inputmode="numeric" value="${d.stock}"></div></div>
        </div>
      </div>
      <div class="stats">${d.stats.map((s, i) => `<div><b data-f="stats.${i}.value">${esc(s.value)}</b><em data-f="stats.${i}.unit">${esc(s.unit)}</em><span data-f="stats.${i}.label">${esc(s.label)}</span></div>`).join('')}</div>
      <h2 class="sec-title" style="margin:48px 0 0;font-size:28px">Характеристики</h2>
      <div class="spec-grid" id="specGrid"></div>
      <button class="btn sm ghost" id="addGroup" type="button" style="margin-top:12px">+ Группа характеристик</button>
      <aside class="publish" id="publish"><h4>${d.isNew ? 'Новый товар' : 'Публикация'}</h4><div class="changes" id="changes">Изменений нет</div>
        <label class="sw">Показывать на сайте<input type="checkbox" data-ch="site"></label><label class="sw">Выгрузить в Ozon<input type="checkbox" data-ch="ozon"></label>
        <div class="err" id="edErr" role="alert"></div>
        <div class="pub-actions"><button class="btn primary" id="saveP">${d.isNew ? 'Создать товар' : 'Сохранить'}</button><a class="btn" href="#/admin/products">Отмена</a></div>
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
    $('#edStage').innerHTML = d.gallery.length ? `<img class="main" src="${img(d.gallery[0])}" alt="">` : '<div class="nophoto"><i class="ph ph-image"></i><span>Добавьте фото товара</span></div>';
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
  /* цена у каждого размера задаётся для каждого цвета: у «Страйп 1» чёрная и белая кровати стоят по-разному */
  const priceCols = () => (S.draft.colorLabel === 'Без выбора цвета' || !S.draft.colors.length ? [''] : S.draft.colors);
  function syncPriceKeys() {
    const cols = priceCols();
    S.draft.sizes.forEach((r) => { const first = Object.values(r.prices).find((v) => v) || 0; const np = {}; cols.forEach((c) => { np[c] = r.prices[c] ?? first; }); r.prices = np; });
  }
  function renderSizes() {
    const d = S.draft; const cols = priceCols(); const named = cols[0] !== '';
    const tpl = `grid-template-columns:minmax(80px,1.3fr) repeat(${cols.length}, minmax(64px,1fr)) 32px`;
    $('#sizesEd').innerHTML = `<div class="szhead" style="${tpl}"><span>Размер</span>${cols.map((c) => `<span>${named ? esc(c) + ', ₽' : 'Цена, ₽'}</span>`).join('')}<span></span></div>`
      + d.sizes.map((s, i) => `<div class="szrow" style="${tpl}"><input data-sz="${i}:size" value="${esc(s.size)}" aria-label="Размер" placeholder="120×200">${cols.map((c, ci) => `<input data-sz="${i}:price:${ci}" inputmode="numeric" value="${s.prices[c] || ''}" aria-label="Цена ${esc(c)}" placeholder="Цена">`).join('')}<button class="icon" type="button" data-rmsz="${i}" aria-label="Убрать размер"><i class="ph ph-x"></i></button></div>`).join('');
    $$('[data-sz]').forEach((inp) => inp.addEventListener('input', () => {
      const [i, k, ci] = inp.dataset.sz.split(':');
      if (k === 'size') d.sizes[+i].size = inp.value.trim(); else d.sizes[+i].prices[cols[+ci]] = parseInt(inp.value.replace(/\D/g, ''), 10) || 0;
      markDirty('sizes');
    }));
    $$('[data-rmsz]').forEach((b) => b.addEventListener('click', () => { if (d.sizes.length > 1) { d.sizes.splice(+b.dataset.rmsz, 1); markDirty('sizes'); renderSizes(); } }));
  }
  function renderSpecs() {
    const d = S.draft; const g = $('#specGrid');
    g.innerHTML = d.specs.map((grp, gi) => `<div class="spec"><h3 data-f="specs.${gi}.0">${esc(grp[0])}</h3><dl>${grp[1].map((row, ri) => `<div class="sprow"><div><dt data-f="specs.${gi}.1.${ri}.0">${esc(row[0])}</dt><dd data-f="specs.${gi}.1.${ri}.1">${esc(row[1])}</dd></div><button class="icon" type="button" data-rmspec="${gi}:${ri}" aria-label="Убрать строку"><i class="ph ph-x"></i></button></div>`).join('')}</dl><div class="spec-actions"><button class="btn sm ghost" type="button" data-addspec="${gi}">+ Строка</button><button class="btn sm ghost danger" type="button" data-rmgroup="${gi}"><i class="ph ph-trash"></i>Удалить группу</button></div></div>`).join('');
    bindEditable(g);
    $$('[data-rmspec]').forEach((b) => b.addEventListener('click', () => { const [gi, ri] = b.dataset.rmspec.split(':').map(Number); d.specs[gi][1].splice(ri, 1); markDirty('specs'); renderSpecs(); }));
    $$('[data-addspec]').forEach((b) => b.addEventListener('click', () => { d.specs[+b.dataset.addspec][1].push(['Параметр', 'Значение']); markDirty('specs'); renderSpecs(); }));
    $$('[data-rmgroup]').forEach((b) => b.addEventListener('click', () => { d.specs.splice(+b.dataset.rmgroup, 1); markDirty('specs'); renderSpecs(); }));
  }
  function saveProduct() {
    const d = S.draft; const { id: eid, base } = S.editing; const err = $('#edErr');
    const sizes = d.sizes.filter((s) => s.size);
    if (!d.name.trim()) { err.textContent = 'Укажите название товара'; return; }
    const cols = priceCols();
    if (!sizes.length || sizes.some((s) => cols.some((c) => !s.prices[c]))) { err.textContent = 'У каждого размера должна быть цена для каждого цвета'; return; }
    if (!d.gallery.length) { err.textContent = 'Добавьте хотя бы одно фото'; return; }
    const colors = d.colorLabel === 'Без выбора цвета' ? [] : d.colors;
    const oldItems = base && base.colorOpt ? base.colorOpt.items : [];
    const items = colors.map((n) => oldItems.find((i) => i.name === n) || { name: n, swatch: SWATCH[n] || '#9AA0A6' });
    const variants = sizes.flatMap((s) => (colors.length ? colors : ['']).map((c) => ({ size: s.size, color: c, retail: s.prices[colors.length ? c : ''] })));
    const common = { cat: d.cat, name: d.name.trim(), lead: d.lead.trim(), sku: d.sku.trim() || 'NV-' + Date.now(), stock: Math.max(0, parseInt(String(d.stock).replace(/\D/g, ''), 10) || 0), colorOpt: colors.length ? { label: d.colorLabel, items } : null, variants, stats: d.stats, specs: d.specs, channels: d.channels };
    let newId = eid;
    if (d.isNew) { newId = 'p-' + Date.now(); store.custom[newId] = { id: newId, ...common, gallery: d.gallery, img: d.gallery[0], pins: [] }; }
    else if (store.custom[eid]) store.custom[eid] = { ...store.custom[eid], ...common, gallery: d.gallery, img: d.gallery[0] };
    else store.products[eid] = { ...common, ...(d.colorGal ? {} : { gallery: d.gallery, img: d.gallery[0] }) };
    persist();
    if (persistFailed()) { err.textContent = 'Браузер не смог сохранить: фото слишком тяжёлые. Уберите часть фото.'; return; }
    if (d.channels.ozon && store.ozon.prices) log('Ozon', `Карточка «${common.name}» отправлена на Ozon (цена ${rub(ozonPrice(Math.min(...variants.map((v) => v.retail))))})`);
    const where = ['site', 'ozon'].filter((k) => d.channels[k]).map((k) => ({ site: 'на сайте', ozon: 'в Ozon' }[k]));
    location.hash = '#/admin/products'; ADM.route();
    toast((d.isNew ? 'Товар создан. ' : 'Сохранено. ') + (where.length ? 'Появится ' + where.join(', ') : 'Нигде не показывается') + ' (демо)');
  }
  function bindProductEditor() {
    const d = S.draft;
    bindEditable($('.adm-page'));
    renderPhotos(); renderSizes(); renderSpecs();
    $('#edCat').addEventListener('change', (e) => { d.cat = e.target.value; markDirty('cat'); });
    $('#edSku').addEventListener('input', (e) => { d.sku = e.target.value; markDirty('sku'); });
    $('#edStock').addEventListener('input', (e) => { d.stock = e.target.value.replace(/\D/g, ''); markDirty('stock'); });
    $('#addSize').addEventListener('click', () => { d.sizes.push({ size: '', prices: Object.fromEntries(priceCols().map((c) => [c, 0])) }); markDirty('sizes'); renderSizes(); const l = $$('[data-sz$=":size"]'); if (l.length) l[l.length - 1].focus(); });
    $('#edColorLabel').addEventListener('change', (e) => { d.colorLabel = e.target.value; $('#edColors').disabled = d.colorLabel === 'Без выбора цвета'; markDirty('color'); syncPriceKeys(); renderSizes(); });
    $('#edColors').addEventListener('input', (e) => { d.colors = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); markDirty('color'); syncPriceKeys(); renderSizes(); });
    $('#addGroup').addEventListener('click', () => { d.specs.push(['Новая группа', [['Параметр', 'Значение']]]); markDirty('specs'); renderSpecs(); });
    $$('[data-ch]').forEach((i) => { i.checked = !!d.channels[i.dataset.ch]; i.addEventListener('change', () => { d.channels[i.dataset.ch] = i.checked; markDirty('ch.' + i.dataset.ch); }); });
    $('#saveP').addEventListener('click', saveProduct);
    const del = $('#delP'); if (del) del.addEventListener('click', () => {
      if (del.dataset.sure) { delete store.custom[S.editing.id]; persist(); location.hash = '#/admin/products'; ADM.route(); toast('Товар удалён'); return; }
      del.dataset.sure = '1'; del.textContent = 'Точно удалить? Нажмите ещё раз'; setTimeout(() => { del.dataset.sure = ''; del.textContent = 'Удалить товар'; }, 3500);
    });
  }

  /* ---------- заказы ---------- */
  const payName = (o) => o.pay;
  function orders() {
    if (!can('orders')) return lock('Раздел «Заказы» доступен менеджеру каталога и администратору.');
    return `<div class="adm-page">${head('Заказы', 'Сайт и Ozon в одном списке. Смените статус, и покупатель получит уведомление.', '<button class="btn" id="oCsv" type="button"><i class="ph ph-download-simple"></i>Экспорт CSV</button>')}
      <div class="toolbar"><div class="seg" id="oSrc"><button class="on" data-v="">Все</button><button data-v="Сайт">Сайт</button><button data-v="Ozon">Ozon</button></div>
        <select id="oSt" aria-label="Статус"><option value="">Все статусы</option>${Object.entries(STATUS).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
        <input id="oQ" type="search" placeholder="Номер, имя или телефон" aria-label="Поиск"><span class="muted" id="on"></span></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Номер</th><th>Покупатель</th><th>Канал</th><th>Оплата</th><th>Сумма</th><th>Статус</th><th></th></tr></thead><tbody id="otb"></tbody></table></div>
      <div class="modal" id="ordDrawer" hidden></div></div>`;
  }
  function drawOrders(src) {
    const st = $('#oSt').value, q = $('#oQ').value.trim().toLowerCase();
    const list = store.orders.filter((o) => (!src || o.source === src) && (!st || o.status === st) && (!q || (o.id + o.name + o.phone).toLowerCase().includes(q)));
    $('#on').textContent = 'Показано: ' + list.length;
    $('#otb').innerHTML = list.map((o) => `<tr><td><b class="mono">${esc(o.id)}</b><div class="muted" style="font-size:12px">${fdt(o.date)}</div></td><td>${esc(o.name)}<div class="muted" style="font-size:13px">${esc(o.phone)}</div></td><td>${kindTag(o.source)}</td>
      <td>${esc(payName(o))}${o.paid ? '' : '<div class="bad" style="font-size:12px">не оплачен</div>'}</td><td class="mono">${rub(total(o.items))}</td>
      <td><select data-ostatus="${o.id}" aria-label="Статус ${o.id}">${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><button class="btn sm" data-open="${o.id}" type="button">Открыть</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:32px">Заказов не найдено</td></tr>';
    $$('[data-ostatus]').forEach((s) => s.addEventListener('change', () => { const o = setOrderStatus(s.dataset.ostatus, s.value); toast('Заказ ' + o.id + ': ' + STATUS[o.status] + '. Покупателю отправлено уведомление (демо)'); }));
    $$('[data-open]').forEach((b) => b.addEventListener('click', () => openOrder(b.dataset.open, src)));
  }
  function openOrder(id, src) {
    const o = store.orders.find((x) => x.id === id); const dr = $('#ordDrawer');
    dr.hidden = false;
    dr.innerHTML = `<div class="modal-card wide" role="dialog" aria-modal="true" aria-label="Заказ ${esc(o.id)}">
      <div class="ph-row"><h3>Заказ ${esc(o.id)}</h3><button class="icon" id="odClose" aria-label="Закрыть"><i class="ph ph-x"></i></button></div>
      <div class="two3"><div><span class="label">Покупатель</span><b>${esc(o.name)}</b><br>${esc(o.phone)}${o.email ? '<br>' + esc(o.email) : ''}</div>
        <div><span class="label">Канал и оплата</span>${kindTag(o.source)} ${esc(o.pay)}<br><span class="${o.paid ? 'okc' : 'bad'}">${o.paid ? 'Оплачен' : 'Не оплачен'}</span></div>
        <div><span class="label">Получение</span>${esc(o.delivery)}${o.address ? '<br>' + esc(o.address) : o.city ? '<br>' + esc(o.city) : ''}</div></div>
      <span class="label" style="margin-top:16px">Состав</span>
      <div class="olines">${o.items.map((it) => { const p = getP(it.id); return `<div><img class="thumb" src="${img(p.img)}" alt=""><span><b>${esc(p.name)}</b><small class="muted">${esc(itemLabel(it))}, ${it.qty} шт, ${esc(p.sku)}</small></span><b class="mono">${rub(priceOf(it) * it.qty)}</b></div>`; }).join('')}</div>
      <div class="ctotal" style="margin-top:8px"><span>Итого</span><b class="mono">${rub(total(o.items))}</b></div>
      ${o.comment ? `<p class="muted" style="margin-top:8px">Комментарий: ${esc(o.comment)}</p>` : ''}
      <span class="label" style="margin-top:16px">История</span>
      <div class="hist">${orderHistory(o).map((h) => `<div><span class="mono muted">${fdt(h.t)}</span>${esc(h.text)}</div>`).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap"><select id="odSt" aria-label="Статус">${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <button class="btn" id="odPrint" type="button"><i class="ph ph-printer"></i>Печать</button><button class="btn primary" id="odDone" type="button" style="margin-left:auto">Готово</button></div></div>`;
    const close = () => { dr.hidden = true; drawOrders(src); };
    $('#odClose').addEventListener('click', close); $('#odDone').addEventListener('click', close);
    $('#odSt').addEventListener('change', (e) => { setOrderStatus(o.id, e.target.value); toast('Статус обновлён, покупатель получит уведомление'); openOrder(id, src); });
    $('#odPrint').addEventListener('click', () => { document.body.classList.add('print-order'); window.print(); document.body.classList.remove('print-order'); });
  }
  function bindOrders() {
    let src = '';
    drawOrders(src);
    $$('#oSrc button').forEach((b) => b.addEventListener('click', () => { src = b.dataset.v; $$('#oSrc button').forEach((x) => x.classList.toggle('on', x === b)); drawOrders(src); }));
    $('#oSt').addEventListener('input', () => drawOrders(src)); $('#oQ').addEventListener('input', () => drawOrders(src));
    $('#oCsv').addEventListener('click', () => download('orders.csv', 'Номер;Дата;Клиент;Телефон;Канал;Оплата;Сумма;Статус\n' + store.orders.map((o) => [o.id, o.date, o.name, o.phone, o.source, o.pay, total(o.items), STATUS[o.status]].join(';')).join('\n'), 'text/csv'));
  }

  /* ---------- заявки ---------- */
  const LSTAT = { new: 'Новая', work: 'В работе', done: 'Обработана' };
  function leads() {
    if (!can('leads')) return lock('Раздел «Заявки» доступен менеджеру каталога и администратору.');
    return `<div class="adm-page">${head('Заявки', 'Обратные звонки с сайта. Новая заявка приходит менеджерам в Telegram.')}
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Дата</th><th>Тип</th><th>Имя</th><th>Телефон</th><th>Комментарий</th><th>Статус</th></tr></thead><tbody>
      ${store.leads.map((l) => `<tr><td class="mono" style="font-size:13px">${fdt(l.t)}</td><td>${esc(l.type)}</td><td>${esc(l.name)}</td><td><a href="tel:${esc(l.phone.replace(/[^+\d]/g, ''))}" class="mono">${esc(l.phone)}</a></td><td class="muted">${esc(l.note) || '-'}</td>
      <td><select data-lead="${l.id}" aria-label="Статус заявки">${Object.entries(LSTAT).map(([k, t]) => `<option value="${k}" ${l.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:32px">Заявок пока нет</td></tr>'}
      </tbody></table></div></div>`;
  }

  /* ---------- Ozon ---------- */
  function ozonStatus(p, i) {
    if (!p.channels.ozon) return ['off', 'Не выгружается'];
    if (i % 7 === 3) return ['warn', 'На модерации Ozon'];
    if (i % 11 === 5) return ['bad', 'Ошибка: не заполнена обязательная характеристика'];
    return ['on', 'Синхронизирован'];
  }
  function ozon() {
    if (!can('ozon')) return lock('Раздел «Ozon» доступен менеджеру каталога и администратору.');
    const C = store.ozon; const P = allProducts();
    const sw = (k, on) => `<label class="sw"><span>${{ prices: 'Цены', stock: 'Остатки (склад продавца)', orders: 'Заказы с Ozon в общий список' }[k]}</span><input type="checkbox" data-o="${k}" ${on ? 'checked' : ''}></label>`;
    return `<div class="adm-page">${head('Ozon', 'Сайт главный: цены и остатки уходят на Ozon, заказы с Ozon приходят на сайт. Значения демо.', '<button class="btn primary" id="syncNow" type="button"><i class="ph ph-arrows-clockwise"></i>Синхронизировать сейчас</button>')}
      <div class="prog" id="prog" hidden><i></i></div>
      <div class="three">
        <div class="panel"><h2>Подключение</h2><div class="chrow"><span class="src ozon">Ozon</span><div><b>Подключено</b><small class="okc">API отвечает</small></div></div>
          <div class="kvs"><span>Client-Id</span><b class="mono">31•••842</b><span>API-ключ</span><b class="mono">••••••••••••</b></div><p class="muted" style="font-size:13px">Ключи хранятся только на сервере, в браузере их нет.</p></div>
        <div class="panel"><h2>Что синхронизировать</h2>${sw('prices', C.prices)}${sw('stock', C.stock)}${sw('orders', C.orders)}
          <div class="field" style="margin-top:12px"><label class="label" for="oInt">Как часто</label><select id="oInt"><option value="15" ${C.interval === 15 ? 'selected' : ''}>Каждые 15 минут</option><option value="30" ${C.interval === 30 ? 'selected' : ''}>Каждые 30 минут</option><option value="60" ${C.interval === 60 ? 'selected' : ''}>Раз в час</option></select></div></div>
        <div class="panel"><h2>Цена на Ozon</h2><div class="field"><label class="label" for="oMk">Наценка к цене сайта, %</label><input id="oMk" inputmode="numeric" value="${C.markup}"></div>
          <p class="muted" style="font-size:13px">Наценка покрывает комиссию площадки. Размер задаёт заказчик. 0 значит, что цена на Ozon равна цене на сайте.</p></div>
      </div>
      <div class="panel" style="margin-top:16px"><h2>Товары на Ozon</h2><p class="muted" style="font-size:13px">Статусы модерации в демо условные. В настоящей системе их присылает Ozon, и ошибки показываются здесь же.</p>
        <div style="overflow-x:auto"><table class="table flat"><thead><tr><th>Товар</th><th>Артикул</th><th>Цена сайта</th><th>Цена Ozon</th><th>Остаток</th><th>Статус</th></tr></thead><tbody>
        ${P.map((p, i) => { const [cls, t] = ozonStatus(p, i); const price = fromPrice(p); return `<tr><td><div class="pn"><img class="thumb" src="${img(p.img)}" alt=""><b>${esc(p.name)}</b></div></td><td class="mono" style="font-size:13px">${esc(p.sku)}</td><td class="mono">${rub(price)}</td><td class="mono">${p.channels.ozon ? '<b>' + rub(ozonPrice(price)) + '</b>' : '-'}</td><td class="mono ${p.stock < LOW ? 'bad' : ''}">${p.stock}</td><td><span class="st ${cls}">${t}</span></td></tr>`; }).join('')}</tbody></table></div></div>
      <div class="panel" style="margin-top:16px"><h2>Журнал Ozon</h2><div class="journal" id="ozLog">${store.log.filter((l) => l.kind === 'Ozon').slice(0, 10).map((l) => `<div><span class="mono muted">${fdt(l.t)}</span><span>${esc(l.msg)}</span></div>`).join('') || '<p class="muted">Записей пока нет</p>'}</div></div></div>`;
  }

  /* ---------- SEO и редиректы ---------- */
  const BASE = 'https://metallstil.ru';
  function seoPage() {
    if (!can('seo')) return lock('Раздел «SEO и редиректы» доступен только администратору.');
    const T = store.seo; const R = store.redirects;
    const p0 = getP('strajp-1n');
    const prev = (tpl) => tpl.replace('{название}', p0.name).replace('{цена}', rub(fromPrice(p0)));
    return `<div class="adm-page">${head('SEO и редиректы', 'Чтобы после переезда с WordPress не потерять позиции в Яндексе и Google.')}
      <div class="two">
        <div class="panel"><h2>Шаблоны мета-тегов</h2><p class="muted" style="font-size:13px">Подставляются на все карточки товаров. Доступно: {название}, {цена}.</p>
          <div class="field"><label class="label" for="sT">Заголовок (title)</label><input id="sT" value="${esc(T.titleTpl)}"></div>
          <div class="field" style="margin-top:12px"><label class="label" for="sD">Описание (description)</label><textarea id="sD" rows="3">${esc(T.descTpl)}</textarea></div>
          <div class="snip"><div class="u">${BASE} › product › strajp-1n</div><div class="t" id="sTp">${esc(prev(T.titleTpl))}</div><div class="d" id="sDp">${esc(prev(T.descTpl))}</div></div></div>
        <div class="panel"><h2>Аналитика</h2><div class="field"><label class="label" for="sM">Яндекс Метрика, номер счётчика</label><input id="sM" inputmode="numeric" value="${esc(T.metrika)}" placeholder="12345678"></div>
          <div class="field" style="margin-top:12px"><label class="label" for="sW">Яндекс Вебмастер, код подтверждения</label><input id="sW" value="${esc(T.webmaster)}"></div>
          <p class="muted" style="font-size:13px;margin-top:8px">Коды вставляются в сайт автоматически, после запуска их нужно только ввести один раз.</p></div>
      </div>
      <div class="panel" style="margin-top:16px"><div class="ph-row"><h2>Редиректы 301 со старого сайта (${R.length})</h2><div style="display:flex;gap:8px"><button class="btn sm" id="rHt" type="button">Скачать .htaccess</button><button class="btn sm" id="rNg" type="button">Скачать для nginx</button></div></div>
        <p class="muted" style="font-size:13px">Старые адреса WordPress ведут на новые. Без этого поисковик посчитает старые страницы удалёнными. Таблица собрана по реальным адресам metallstil.ru.</p>
        <form id="rAdd" class="radd" novalidate><input id="rOld" placeholder="/old-url/" aria-label="Старый адрес"><input id="rNew" placeholder="/new-url/" aria-label="Новый адрес"><button class="btn sm primary" type="submit">Добавить</button></form><div class="err" id="rErr"></div>
        <div style="overflow-x:auto;max-height:340px;overflow-y:auto"><table class="table flat"><thead><tr><th>Старый адрес</th><th>Новый адрес</th><th></th></tr></thead><tbody id="rtb">
        ${R.map(([a, b], i) => `<tr><td class="mono" style="font-size:13px">${esc(a)}</td><td class="mono" style="font-size:13px">${esc(b)}</td><td><button class="icon" data-rdel="${i}" aria-label="Удалить"><i class="ph ph-x"></i></button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="two" style="margin-top:16px">
        <div class="panel"><div class="ph-row"><h2>sitemap.xml</h2><button class="btn sm" id="smDl" type="button">Скачать</button></div><textarea class="code" id="smTx" rows="9" readonly>${esc(sitemapXml())}</textarea></div>
        <div class="panel"><div class="ph-row"><h2>robots.txt</h2><button class="btn sm" id="rbDl" type="button">Скачать</button></div><textarea class="code" id="rbTx" rows="9" readonly>${esc(robotsTxt())}</textarea></div>
      </div>
      <div class="panel" style="margin-top:16px"><div class="ph-row"><h2>Микроразметка Product</h2><select id="jsP" aria-label="Товар">${allProducts().map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
        <p class="muted" style="font-size:13px">Так товар описывается для Яндекса и Google: цена, наличие, артикул. Добавляется на каждую страницу автоматически.</p><textarea class="code" id="jsTx" rows="14" readonly></textarea></div></div>`;
  }
  function sitemapXml() {
    const urls = ['/', '/catalog/', '/blog/', '/contacts/', ...Object.keys(CATS).map((c) => `/catalog/${c}/`), ...allProducts().filter((p) => p.channels.site !== false).map((p) => `/product/${p.id}/`), ...allPosts().filter((p) => p.status === 'published').map((p) => `/blog/${p.id}/`)];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${BASE}${u}</loc></url>`).join('\n')}\n</urlset>`;
  }
  const robotsTxt = () => `User-agent: *\nDisallow: /admin/\nDisallow: /cart/\nDisallow: /checkout/\nDisallow: /*?\n\nUser-agent: Yandex\nClean-param: utm_source&utm_medium&utm_campaign&yclid&gclid\n\nSitemap: ${BASE}/sitemap.xml`;
  function jsonLd(id) {
    const p = getP(id);
    return JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, description: p.lead, image: p.gallery.filter((g) => !String(g).startsWith('data:')).map((g) => `${BASE}/img/${g}`),
      brand: { '@type': 'Brand', name: 'Новита' }, offers: { '@type': 'AggregateOffer', priceCurrency: 'RUB', lowPrice: fromPrice(p), highPrice: Math.max(...p.variants.map((v) => v.retail)), offerCount: p.variants.length, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url: `${BASE}/product/${p.id}/` } }, null, 2);
  }
  const htaccess = () => '# Редиректы со старого сайта (WordPress)\n' + store.redirects.filter(([a, b]) => a !== b).map(([a, b]) => `Redirect 301 ${a} ${b}`).join('\n');
  const nginxConf = () => '# Редиректы со старого сайта (WordPress)\n' + store.redirects.filter(([a, b]) => a !== b).map(([a, b]) => `location = ${a} { return 301 ${b}; }`).join('\n');

  /* ---------- статьи ---------- */
  function posts() {
    if (!can('blog')) return lock('Раздел «Статьи» доступен редактору статей и администратору.');
    return `<div class="adm-page">${head('Статьи', 'Нажмите на статью, чтобы править её прямо в тексте.', '<a class="btn primary" href="#/admin/posts/new"><i class="ph ph-plus"></i>Новая статья</a>')}
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Заголовок</th><th>Дата</th><th>Статус</th><th></th></tr></thead><tbody>
      ${allPosts().map((p) => `<tr><td><a href="#/admin/posts/${p.id}"><b>${esc(p.title)}</b></a></td><td class="mono" style="font-size:14px">${p.date}</td><td><span class="state ${p.status === 'published' ? 'pub' : ''}">${p.status === 'published' ? 'Опубликовано' : 'Черновик'}</span></td><td><a class="btn sm" href="#/admin/posts/${p.id}"><i class="ph ph-pencil-simple"></i>Править</a></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  function articleEditor(id) {
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
      if (status === 'published' && tg) log('Telegram', `Пост «${S.draft.title}» отправлен в канал @mebel_novita`);
      location.hash = '#/admin/posts'; ADM.route();
      if (status === 'draft') toast('Сохранено как черновик');
      else toast((when === 'Сейчас' ? 'Опубликовано: ' : 'Запланировано (' + when.toLowerCase() + '): ') + [sites ? 'сайт' : '', tg ? 'Telegram @mebel_novita' : ''].filter(Boolean).join(' и ') + ' (демо)');
    };
    $('#pubBtn').addEventListener('click', () => finish('published'));
    $('#draftBtn').addEventListener('click', () => finish('draft'));
  }

  /* ---------- пользователи и подключения ---------- */
  function users() {
    if (!can('users')) return lock('Раздел «Пользователи» доступен только администратору.');
    const me = store.user;
    return `<div class="adm-page">${head('Пользователи и роли', 'Администратор добавляет и удаляет сотрудников. Каждый видит только то, что нужно для его работы.')}
      <form id="addUser" class="adduser" novalidate><div><label class="label" for="newEmail">Почта нового сотрудника</label><input id="newEmail" type="email" style="width:100%"></div>
        <div><label class="label" for="newRole">Роль</label><select id="newRole">${['editor', 'catalog', 'admin'].map((r) => `<option value="${r}">${ROLES[r].label}</option>`).join('')}</select></div>
        <button class="btn primary" type="submit"><i class="ph ph-user-plus"></i>Добавить</button></form><div id="userErr" role="alert" class="err" style="font-size:14px;margin-top:8px"></div>
      <div style="overflow-x:auto"><table class="table"><thead><tr><th>Почта для входа</th><th>Роль</th><th>Что видит</th><th></th></tr></thead><tbody>
      ${store.users.map((u) => `<tr><td class="mono" style="font-size:14px">${esc(u.email)}${u.email === me ? ' <span class="muted">(вы)</span>' : ''}</td><td><select data-user="${u.id}">${['editor', 'catalog', 'admin'].map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${ROLES[r].label}</option>`).join('')}</select></td>
      <td><div class="scopes">${[['blog', 'Статьи'], ['catalog', 'Товары'], ['orders', 'Заказы'], ['leads', 'Заявки'], ['ozon', 'Ozon'], ['seo', 'SEO'], ['users', 'Пользователи'], ['integrations', 'Подключения']].map(([k, t]) => `<span class="st ${ROLES[u.role].can.includes(k) ? 'on' : 'off'}">${t}</span>`).join('')}</div></td>
      <td>${u.email === me ? '' : `<button class="btn sm ghost" data-deluser="${u.id}"><i class="ph ph-trash"></i>Удалить</button>`}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  function integrations() {
    if (!can('integrations')) return lock('Раздел «Подключения» доступен только администратору.');
    const I = store.integr, N = store.tgn;
    const sw = (k, t, on) => `<label class="sw"><span>${t}</span><input type="checkbox" data-tgn="${k}" ${on ? 'checked' : ''}></label>`;
    return `<div class="adm-page">${head('Подключения', 'Откуда и куда уходят данные. Все значения в демо условные.')}<div class="cards3">
      <div class="int"><h3>Telegram<span class="st ${I.tg ? 'on' : 'off'}">${I.tg ? 'Подключено' : 'Выключено'}</span></h3><div class="kv">Канал статей: <b>@mebel_novita</b></div>
        <div class="field"><label class="label" for="tgChat">Чат менеджеров</label><input id="tgChat" value="${esc(N.chat)}"></div>
        <span class="label" style="margin-top:6px">Уведомлять менеджеров о</span>${sw('orders', 'Новых заказах с сайта', N.orders)}${sw('ozonOrders', 'Заказах с Ozon', N.ozonOrders)}${sw('leads', 'Заявках на звонок', N.leads)}
        <button class="btn sm primary" data-int-toggle="tg">${I.tg ? 'Отключить' : 'Подключить'}</button></div>
      <div class="int"><h3>Ozon<span class="st ${I.ozon ? 'on' : 'off'}">${I.ozon ? 'Подключено' : 'Выключено'}</span></h3><div class="kv">Цены, остатки и заказы. Настройки и журнал в разделе Ozon.</div><a class="btn sm" href="#/admin/ozon">Открыть раздел Ozon</a></div>
      <div class="int"><h3>Онлайн-оплата<span class="st ${I.pay ? 'on' : 'off'}">${I.pay ? 'Подключено' : 'Не подключено'}</span></h3><div class="kv">Карты и СБП, чек по 54-ФЗ. Нужен договор эквайринга и онлайн-касса.</div><button class="btn sm primary" data-int-toggle="pay">${I.pay ? 'Отключить' : 'Подключить'}</button></div>
    </div></div>`;
  }

  /* ---------- привязка событий ---------- */
  function bind(b, c) {
    $$('[data-logout]').forEach((e) => e.addEventListener('click', () => { logout(); location.hash = '#/admin'; ADM.route(); toast('Вы вышли'); }));
    if (b === 'products' && c && S.editing && S.draft) bindProductEditor();
    else if (b === 'products' && !c && $('#ptb')) { drawProducts(); ['pq', 'pc', 'ps'].forEach((i) => $('#' + i).addEventListener('input', drawProducts)); }
    if (b === 'posts' && c && S.editing && S.draft) bindArticleEditor();
    if (b === 'orders' && $('#otb')) bindOrders();
    $$('[data-lead]').forEach((s) => s.addEventListener('change', () => { const l = store.leads.find((x) => x.id === s.dataset.lead); l.status = s.value; persist(); toast('Заявка: ' + LSTAT[l.status]); ADM.route(true); }));
    if (b === 'ozon' && $('#syncNow')) {
      $$('[data-o]').forEach((i) => i.addEventListener('change', () => { store.ozon[i.dataset.o] = i.checked; persist(); toast('Настройки Ozon сохранены'); }));
      $('#oInt').addEventListener('change', (e) => { store.ozon.interval = +e.target.value; persist(); toast('Интервал сохранён'); });
      $('#oMk').addEventListener('change', (e) => { store.ozon.markup = Math.max(0, Math.min(100, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)); persist(); toast('Наценка сохранена: цены на Ozon пересчитаны'); ADM.route(true); });
      $('#syncNow').addEventListener('click', () => {
        const pg = $('#prog'), bar = $('i', pg); pg.hidden = false; let w = 0;
        const n = allProducts().filter((p) => p.channels.ozon).length;
        const t = setInterval(() => { w += 25; bar.style.width = w + '%'; if (w >= 100) { clearInterval(t); pg.hidden = true; log('Ozon', `Ручная синхронизация: обновлено ${n} карточек, цены и остатки`); toast('Ozon: обновлено ' + n + ' товаров (демо)'); ADM.route(true); } }, 120);
      });
    }
    if (b === 'seo' && $('#sT')) {
      const p0 = getP('strajp-1n'); const prev = (tpl) => tpl.replace('{название}', p0.name).replace('{цена}', rub(fromPrice(p0)));
      $('#sT').addEventListener('input', (e) => { store.seo.titleTpl = e.target.value; persist(); $('#sTp').textContent = prev(e.target.value); });
      $('#sD').addEventListener('input', (e) => { store.seo.descTpl = e.target.value; persist(); $('#sDp').textContent = prev(e.target.value); });
      $('#sM').addEventListener('change', (e) => { store.seo.metrika = e.target.value; persist(); toast('Счётчик сохранён'); });
      $('#sW').addEventListener('change', (e) => { store.seo.webmaster = e.target.value; persist(); toast('Код сохранён'); });
      $('#rAdd').addEventListener('submit', (ev) => {
        ev.preventDefault(); const a = $('#rOld').value.trim(), n = $('#rNew').value.trim();
        if (!a.startsWith('/') || !n.startsWith('/')) { $('#rErr').textContent = 'Адреса должны начинаться с /'; return; }
        store.redirects.push([a, n]); persist(); ADM.route(true); toast('Редирект добавлен');
      });
      $$('[data-rdel]').forEach((x) => x.addEventListener('click', () => { store.redirects.splice(+x.dataset.rdel, 1); persist(); ADM.route(true); }));
      $('#rHt').addEventListener('click', () => download('.htaccess', htaccess()));
      $('#rNg').addEventListener('click', () => download('redirects.conf', nginxConf()));
      $('#smDl').addEventListener('click', () => download('sitemap.xml', sitemapXml(), 'application/xml'));
      $('#rbDl').addEventListener('click', () => download('robots.txt', robotsTxt()));
      const showLd = () => { $('#jsTx').value = jsonLd($('#jsP').value); };
      $('#jsP').addEventListener('change', showLd); showLd();
    }
    $$('[data-user]').forEach((s) => s.addEventListener('change', () => { const u = store.users.find((x) => x.id === +s.dataset.user); u.role = s.value; if (u.email === store.user) store.role = u.role; persist(); ADM.route(true); toast('Роль изменена: ' + u.email + ', ' + ROLES[u.role].label); }));
    const au = $('#addUser'); if (au) au.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = $('#newEmail').value.trim().toLowerCase(); const err = $('#userErr');
      if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Укажите почту полностью'; return; }
      if (store.users.some((u) => u.email === email)) { err.textContent = 'Такой сотрудник уже есть'; return; }
      store.users.push({ id: Date.now(), email, role: $('#newRole').value }); persist(); ADM.route(true);
      toast('Сотрудник добавлен. Приглашение отправлено на ' + email + ' (демо)');
    });
    $$('[data-deluser]').forEach((e) => e.addEventListener('click', () => { const u = store.users.find((x) => x.id === +e.dataset.deluser); store.users = store.users.filter((x) => x.id !== u.id); persist(); ADM.route(true); toast('Доступ закрыт: ' + u.email); }));
    $$('[data-tgn]').forEach((i) => i.addEventListener('change', () => { store.tgn[i.dataset.tgn] = i.checked; persist(); toast('Уведомления сохранены'); }));
    const tc = $('#tgChat'); if (tc) tc.addEventListener('change', (e) => { store.tgn.chat = e.target.value.trim() || '@novita_managers'; persist(); toast('Чат менеджеров сохранён'); });
    $$('[data-int-toggle]').forEach((e) => e.addEventListener('click', () => { const k = e.dataset.intToggle; store.integr[k] = !store.integr[k]; persist(); ADM.route(true); }));
  }

  function render(b, c) {
    if (b === 'overview') return overview();
    if (b === 'products') return c ? productEditor(c) : products();
    if (b === 'orders') return orders();
    if (b === 'leads') return leads();
    if (b === 'posts') return c ? articleEditor(c) : posts();
    if (b === 'ozon') return ozon();
    if (b === 'seo') return seoPage();
    if (b === 'users') return users();
    if (b === 'integrations') return integrations();
    return null;
  }
  return { shell, loginPage, render, bind, lock, route: () => {} };
})();
