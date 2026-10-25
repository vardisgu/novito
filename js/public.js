/* Публичный сайт для покупателей: каталог, карточка, корзина, оплата, блог, контакты. */
const PUB = (() => {
  const { $, $$, esc, num, rub, reduce, IMG, img, store, persist, S, can, START, STATUS, STEPS, getP, allProducts, visibleProducts, allPosts, getPost, fromPrice, patchProduct, inStock,
    priceOf, total, cartCount, addToCart, itemLabel, nextOrderId, log, toast, countUp, maskPhone } = NV;

  const cartBtn = () => `<i class="ph ph-shopping-cart"></i>Корзина${cartCount() ? `<span class="cnt">${cartCount()}</span>` : ''}`;
  function header() {
    const r = location.hash || '#/';
    const on = (p) => (r.startsWith(p) ? 'on' : '');
    return `<header class="header"><div class="wrap">
      <a class="brand" href="#/"><img src="${IMG}logo.webp" alt="Новита, фабрика механизмов"></a>
      <nav class="nav"><a class="${on('#/catalog')}" href="#/catalog">Каталог</a><a class="${on('#/blog')}" href="#/blog">Блог</a><a class="${on('#/contacts')}" href="#/contacts">Контакты</a></nav>
      <form class="hsearch" id="hsearch" role="search"><i class="ph ph-magnifying-glass"></i><input id="hq" type="search" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу"></form>
      <span class="tel">+7 (843) 512-00-08</span>
      <a class="btn sm cartbtn" href="#/cart">${cartBtn()}</a>
    </div></header>`;
  }
  /* для вошедшего сотрудника: одна понятная плашка, а не второе меню */
  function staffPill(a, b) {
    if (!store.user) return '';
    let edit = '';
    if (a === 'p' && can('catalog')) edit = `<a class="primary" href="#/admin/products/${b}"><i class="ph ph-pencil-simple"></i>Править в кабинете</a>`;
    if (a === 'blog' && b && can('blog')) edit = `<a class="primary" href="#/admin/posts/${b}"><i class="ph ph-pencil-simple"></i>Править в кабинете</a>`;
    return `<div class="staffpill"><span>Это публичный сайт. Править здесь нельзя.</span>${edit}<a href="${START[store.role]}">В кабинет</a></div>`;
  }
  function footer() {
    return `<footer class="footer"><div class="wrap">
      <div><a class="brand" href="#/"><img src="${IMG}logo.webp" alt="Новита, фабрика механизмов"></a><p class="muted" style="margin-top:12px;max-width:36ch">Фабрика механизмов и мебели для здорового сна. Работаем с 1998 года.</p></div>
      <div><h4>Адрес</h4><p>Казань, ул. Рахимова, 8, корп. 9</p><p class="muted">Салон в ТЦ «Мегга-мебель», 3 этаж</p></div>
      <div><h4>Связь</h4><a class="mono" href="#/contacts">+7 (843) 512-00-08</a><a href="#/contacts">info@metallstil.ru</a><a href="#/contacts">Telegram @mebel_novita</a><button class="linkbtn" data-callback type="button">Заказать звонок</button><a href="#/privacy" class="muted">Политика конфиденциальности</a></div>
    </div></footer>`;
  }
  const callbackModal = () => `<div class="modal" id="cbModal" hidden><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="cbTitle">
      <h3 id="cbTitle">Заказать звонок</h3><p class="muted">Перезвоним в рабочее время, 07:30-19:30 по Москве.</p>
      <form id="cbForm" novalidate style="display:grid;gap:12px">
        <div class="field"><label class="label" for="cbName">Имя</label><input id="cbName" type="text" autocomplete="name"><div class="err" data-err="cbName"></div></div>
        <div class="field"><label class="label" for="cbPhone">Телефон</label><input id="cbPhone" type="tel" autocomplete="tel" placeholder="+7"><div class="err" data-err="cbPhone"></div></div>
        <p class="muted" style="font-size:12px">Нажимая кнопку, вы соглашаетесь с <a href="#/privacy" style="text-decoration:underline">политикой конфиденциальности</a>.</p>
        <div style="display:flex;gap:8px"><button class="btn primary" type="submit" style="flex:1">Жду звонка</button><button class="btn" type="button" id="cbCancel">Отмена</button></div></form></div></div>`;
  const cookieBar = () => (store.cookie ? '' : `<div class="cookie" id="cookieBar" role="region" aria-label="Cookie"><span>Сайт использует cookie, чтобы корзина и фильтры работали. Продолжая, вы соглашаетесь с <a href="#/privacy" style="text-decoration:underline">политикой</a>.</span><button class="btn sm primary" id="cookieOk" type="button">Понятно</button></div>`);

  function pcard(p, cls = '') {
    const hit = p.hit ? '<span class="tag">Хит</span>' : '';
    const demo = p.demo ? '<span class="tag demo" style="left:auto;right:12px">демо-цена</span>' : '';
    const stock = !inStock(p) ? '<span class="tag order">Под заказ</span>' : '';
    return `<a class="pcard ${cls}" href="#/p/${p.id}" data-reveal>
      <div class="pic">${hit}${stock}${demo}<img class="${p.fit || ''}" src="${img(p.img)}" alt="${esc(p.name)}" loading="lazy"></div>
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
        <div class="cta"><a class="btn primary" href="#/catalog">Смотреть каталог</a><button class="btn" data-callback type="button">Заказать звонок</button></div></div>
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

  /* каталог: категория, поиск, наличие, сортировка */
  const SORTS = { pop: 'Сначала популярные', cheap: 'Сначала дешевле', rich: 'Сначала дороже', name: 'По названию' };
  function catalogList(cat) {
    const q = S.q.trim().toLowerCase();
    let list = visibleProducts().filter((p) => (!cat || p.cat === cat) && (!q || (p.name + ' ' + p.sku).toLowerCase().includes(q)) && (!S.onlyStock || inStock(p)));
    if (S.sort === 'cheap') list.sort((a, b) => fromPrice(a) - fromPrice(b));
    if (S.sort === 'rich') list.sort((a, b) => fromPrice(b) - fromPrice(a));
    if (S.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    if (S.sort === 'pop') list.sort((a, b) => (b.hit ? 1 : 0) - (a.hit ? 1 : 0));
    return list;
  }
  function catalog(cat) {
    const cname = cat && CATS[cat] ? CATS[cat].name : 'Каталог';
    const chips = `<a class="chip ${!cat ? 'on' : ''}" href="#/catalog">Все</a>` + Object.entries(CATS).map(([k, c]) => `<a class="chip ${cat === k ? 'on' : ''}" href="#/catalog/${k}">${c.name}</a>`).join('');
    return `<div class="wrap page-pad"><h1>${cname}</h1><p class="muted" id="ccount"></p>
      <div class="chips" style="margin:24px 0 16px">${chips}</div>
      <div class="ctools"><label class="csearch"><i class="ph ph-magnifying-glass"></i><input id="cq" type="search" placeholder="Название или артикул" value="${esc(S.q)}" aria-label="Поиск"></label>
        <select id="csort" aria-label="Сортировка">${Object.entries(SORTS).map(([k, t]) => `<option value="${k}" ${S.sort === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <label class="sw inline"><input type="checkbox" id="conly" ${S.onlyStock ? 'checked' : ''}>Только в наличии</label></div>
      <div class="grid-cards" id="cgrid"></div></div>`;
  }
  function drawCatalog(cat) {
    const list = catalogList(cat);
    $('#ccount').textContent = list.length ? `${list.length} моделей, отгрузка в день заказа из наличия.` : 'Ничего не найдено.';
    $('#cgrid').innerHTML = list.length ? list.map((p) => pcard(p)).join('') : `<div class="empty"><b>Ничего не найдено</b><p class="muted">Измените запрос или уберите фильтры.</p><button class="btn" id="cReset" type="button">Сбросить</button></div>`;
    NV.observeReveal();
    const r = $('#cReset'); if (r) r.addEventListener('click', () => { S.q = ''; S.onlyStock = false; S.sort = 'pop'; PUB.route(); });
  }

  function availability(p) {
    if (!inStock(p)) return '<i class="ph ph-clock"></i> Под заказ, срок изготовления от двух недель';
    if (p.stock <= 5) return `<i class="ph ph-check-circle"></i> В наличии, осталось ${p.stock} шт, отгрузка в день заказа`;
    return '<i class="ph ph-check-circle"></i> В наличии, отгрузка в день заказа';
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
          <div class="optp">${availability(p)}</div>
          <div class="actions"><button class="btn primary" data-buy>Купить</button><button class="btn" data-cart><i class="ph ph-shopping-cart"></i>В корзину</button></div>
          <span class="muted" style="font-size:13px">Артикул ${esc(p.sku)}</span></div>
      </div>
    </div>
    <div class="stats" data-reveal>${p.stats.map((s) => `<div><b data-count>${esc(s.value)}</b><em>${esc(s.unit)}</em><span>${esc(s.label)}</span></div>`).join('')}</div>
    ${p.specs.length ? `<h2 class="sec-title" style="margin:56px 0 0;font-size:28px" data-reveal>Характеристики</h2>
    <div class="spec-grid" data-reveal>${p.specs.map(([t, rows]) => `<div class="spec"><h3>${esc(t)}</h3><dl>${rows.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl></div>`).join('')}</div>` : ''}
    ${p.demo ? '<p class="demo-note" style="margin-top:16px">Демо: цены и характеристики этой модели условные.</p>' : ''}
    <h2 class="sec-title" style="margin:64px 0 24px;font-size:28px">Другие модели</h2>
    <div class="grid-cards" style="padding-bottom:96px">${more.map((x) => pcard(x)).join('')}</div></div>`;
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
    const made = store.cart.some((it) => !inStock(getP(it.id)));
    return `<div class="wrap page-pad"><h1>Оформление заказа</h1>
      <div class="checkout">
        <form id="checkoutForm" novalidate>
          <fieldset><legend>Контакты</legend>${f('fName', 'Имя', 'text', 'autocomplete="name"')}${f('fPhone', 'Телефон', 'tel', 'autocomplete="tel" placeholder="+7"')}${f('fEmail', 'Почта для чека', 'email', 'autocomplete="email"')}</fieldset>
          <fieldset><legend>Получение</legend>
            <div class="radios"><label class="radio"><input type="radio" name="deliv" value="Доставка" checked><span><b>Доставка по России</b><small>Транспортной компанией, стоимость рассчитаем после заказа</small></span></label>
            <label class="radio"><input type="radio" name="deliv" value="Самовывоз"><span><b>Самовывоз в Казани</b><small>ул. Рахимова, 8, корп. 9</small></span></label></div>
            <div id="addrBox">${f('fCity', 'Город', 'text', 'autocomplete="address-level2"')}${f('fStreet', 'Улица, дом, квартира', 'text', 'autocomplete="street-address"')}</div></fieldset>
          <fieldset><legend>Оплата</legend><div class="radios"><label class="radio"><input type="radio" name="pay" value="Картой" checked><span><b>Банковской картой</b><small>Visa, Mastercard, МИР</small></span></label>
            <label class="radio"><input type="radio" name="pay" value="СБП"><span><b>Система быстрых платежей</b><small>По QR-коду или в приложении банка</small></span></label></div></fieldset>
          <div class="field"><label class="label" for="fComment">Комментарий к заказу</label><input id="fComment" type="text"></div>
          <label class="radio" style="margin:4px 0 16px"><input type="checkbox" id="fAgree"><span><small>Я согласен на обработку персональных данных по <a href="#/privacy" style="text-decoration:underline">политике конфиденциальности</a></small></span></label>
          <div class="err" data-err="fAgree" style="margin:-8px 0 12px"></div>
          <button class="btn primary big" type="submit" id="payBtn">Оплатить ${rub(total(store.cart))}</button>
        </form>
        <aside class="summary"><h3>Ваш заказ</h3>${items}${made ? '<p class="muted" style="font-size:13px"><i class="ph ph-clock"></i> Часть товаров под заказ: изготовление от двух недель.</p>' : ''}<div class="ctotal"><span>Итого</span><b class="mono">${rub(total(store.cart))}</b></div><a href="#/cart" class="link-arrow" style="margin-top:12px">Изменить корзину</a></aside>
      </div>
      <div class="modal" id="payModal" hidden><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="payTitle">
        <span class="demo-note">Демо: так выглядит страница банка</span><h3 id="payTitle">Оплата заказа</h3>
        <div class="mono" style="font-size:32px" id="payAmount"></div><p class="muted" id="payHow"></p>
        <div style="display:flex;gap:8px;margin-top:8px"><button class="btn primary" id="payConfirm" style="flex:1">Подтвердить оплату</button><button class="btn" id="payCancel">Отмена</button></div></div></div></div>`;
  }

  /* заказ создаётся, остатки списываются, события идут в журнал (Ozon, Telegram) */
  function createOrder(c) {
    const id = nextOrderId();
    const items = store.cart.map((it) => ({ ...it }));
    const sum = total(items);
    const made = items.some((it) => !inStock(getP(it.id)));
    store.orders.unshift({ id, date: NV.nowStr(), source: 'Сайт', status: made ? 'production' : 'new', paid: true, items, ...c });
    items.forEach((it) => {
      const p = getP(it.id); const left = Math.max(0, (p.stock ?? 0) - it.qty);
      patchProduct(p.id, { stock: left });
      if (p.channels.ozon && store.ozon.stock) log('Ozon', `Остаток «${p.name}» обновлён: ${left} шт`);
    });
    log('Сайт', `Новый заказ ${id} на ${rub(sum)}`);
    if (store.tgn.orders) log('Telegram', `Уведомление менеджерам (${store.tgn.chat}): новый заказ ${id}`);
    store.cart = []; persist();
    return id;
  }
  function bindCheckout() {
    const form = $('#checkoutForm'); if (!form) return;
    maskPhone($('#fPhone'));
    const addr = $('#addrBox');
    $$('input[name="deliv"]').forEach((r) => r.addEventListener('change', () => { addr.hidden = r.value === 'Самовывоз' && r.checked; }));
    const setErr = (id, msg) => { $(`[data-err="${id}"]`).textContent = msg; const el = $('#' + id); if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const v = (id) => $('#' + id).value.trim();
      const delivery = form.querySelector('input[name="deliv"]:checked').value;
      let ok = true;
      ok = setErr('fName', v('fName').length < 2 ? 'Укажите имя' : '') && ok;
      ok = setErr('fPhone', v('fPhone').replace(/\D/g, '').length < 11 ? 'Укажите телефон полностью' : '') && ok;
      ok = setErr('fEmail', /^\S+@\S+\.\S+$/.test(v('fEmail')) ? '' : 'Укажите почту, на неё придёт чек') && ok;
      ok = setErr('fCity', delivery === 'Доставка' && !v('fCity') ? 'Укажите город' : '') && ok;
      ok = setErr('fStreet', delivery === 'Доставка' && !v('fStreet') ? 'Укажите адрес' : '') && ok;
      ok = setErr('fAgree', $('#fAgree').checked ? '' : 'Нужно согласие на обработку данных') && ok;
      if (!ok) { const bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
      const pay = form.querySelector('input[name="pay"]:checked').value;
      S.checkout = { name: v('fName'), phone: v('fPhone'), email: v('fEmail'), city: delivery === 'Доставка' ? v('fCity') : 'Казань', address: delivery === 'Доставка' ? v('fCity') + ', ' + v('fStreet') : '', delivery, pay, comment: v('fComment') };
      $('#payAmount').textContent = rub(total(store.cart));
      $('#payHow').textContent = pay === 'СБП' ? 'Отсканируйте код или подтвердите платёж в приложении вашего банка.' : 'Введите данные карты на защищённой странице банка.';
      $('#payModal').hidden = false; $('#payConfirm').focus();
    });
    $('#payCancel').addEventListener('click', () => { $('#payModal').hidden = true; });
    $('#payConfirm').addEventListener('click', () => { const id = createOrder(S.checkout); location.hash = '#/order/' + id; });
  }

  function orderPage(id) {
    const o = store.orders.find((x) => x.id === id);
    if (!o) return `<div class="wrap lock"><h1>Заказ не найден</h1><a class="btn" href="#/catalog">В каталог</a></div>`;
    const at = STEPS.indexOf(o.status);
    const line = o.status === 'canceled' ? '<p class="state" style="color:#B3261E;border-color:#B3261E;display:inline-block">Заказ отменён</p>' : `<ol class="timeline steps5">${STEPS.map((s, i) => `<li class="${i <= at ? 'done' : ''}">${STATUS[s]}</li>`).join('')}</ol>`;
    return `<div class="wrap page-pad" style="max-width:760px"><span class="state ${o.paid ? 'pub' : ''}">${o.paid ? 'Оплачено' : 'Не оплачено'}</span><h1 style="margin-top:12px">Заказ ${esc(o.id)}</h1>
      <p class="muted" style="margin:8px 0 24px">Чек отправлен на ${esc(o.email || 'вашу почту')}. Мы позвоним по номеру ${esc(o.phone)}, чтобы подтвердить детали.</p>
      ${line}
      <div class="summary" style="position:static;margin-top:24px">${o.items.map((it) => { const p = getP(it.id); return `<div class="srow"><img src="${img(p.img)}" alt=""><div><b>${esc(p.name)}</b><span class="muted">${esc(itemLabel(it))}, ${it.qty} шт</span></div><span class="mono">${rub(priceOf(it) * it.qty)}</span></div>`; }).join('')}<div class="ctotal"><span>Сумма</span><b class="mono">${rub(total(o.items))}</b></div>
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
    if (!p || p.status !== 'published') return notFound();
    return `<div class="wrap"><div class="crumbs"><a href="#/blog">Блог</a><span>/</span><span>${esc(p.title)}</span></div>
      <div class="article single"><div><h1>${esc(p.title)}</h1><div class="body">${p.body.map((t) => `<p>${esc(t)}</p>`).join('')}</div></div></div></div>`;
  }
  function contacts() {
    return `<div class="wrap page-pad"><h1>Контакты</h1><div class="cards3">
      <div class="int"><h3>Адрес</h3><p>Казань, ул. Рахимова, 8, корп. 9</p><p class="muted">Салон мебели: ТЦ «Мегга-мебель», 3 этаж, 4 линия</p></div>
      <div class="int"><h3>Телефоны</h3><p class="mono">+7 (843) 512-00-08</p><p class="mono">+7 (843) 512-00-87</p><p class="mono">+7 (904) 668-94-12</p></div>
      <div class="int"><h3>Онлайн</h3><p>info@metallstil.ru</p><p>Telegram: @mebel_novita</p><p class="muted">Пн-Пт, 07:30-19:30 по Москве</p><button class="btn sm" data-callback type="button" style="margin-top:8px">Заказать звонок</button></div></div></div>`;
  }
  function privacy() {
    return `<div class="wrap page-pad" style="max-width:820px"><h1>Политика конфиденциальности</h1>
      <p class="demo-note">Шаблон для демо. Реквизиты оператора и текст необходимо согласовать с юристом.</p>
      <div class="prose"><h3>1. Оператор</h3><p>Оператор персональных данных: [полное название организации], ИНН [указать], адрес: Казань, ул. Рахимова, 8, корп. 9.</p>
      <h3>2. Какие данные мы собираем</h3><p>Имя, телефон, адрес электронной почты и адрес доставки, которые вы указываете при оформлении заказа или заявки на звонок.</p>
      <h3>3. Зачем мы их используем</h3><p>Чтобы обработать и доставить заказ, отправить чек, связаться с вами по заказу и ответить на заявку.</p>
      <h3>4. Хранение и передача</h3><p>Данные хранятся на серверах на территории Российской Федерации. Мы передаём их только службам доставки и платёжному сервису в объёме, нужном для исполнения заказа.</p>
      <h3>5. Ваши права</h3><p>Вы можете запросить доступ к данным, их исправление или удаление, написав на info@metallstil.ru.</p>
      <h3>6. Cookie</h3><p>Сайт использует cookie для работы корзины и фильтров каталога.</p></div></div>`;
  }
  function notFound() {
    return `<div class="wrap lock"><h1>Страница не найдена</h1><p>Возможно, адрес изменился. Загляните в каталог или воспользуйтесь поиском.</p><div style="display:flex;gap:8px;justify-content:center"><a class="btn primary" href="#/catalog">В каталог</a><a class="btn" href="#/">На главную</a></div></div>`;
  }

  /* точка входа для router */
  function render(a, b) {
    if (!a) return home();
    if (a === 'catalog') return catalog(b);
    if (a === 'p') return product(b);
    if (a === 'cart') return cartPage();
    if (a === 'checkout') return checkoutPage();
    if (a === 'order') return orderPage(b);
    if (a === 'blog') return b ? article(b) : blogList();
    if (a === 'contacts') return contacts();
    if (a === 'privacy') return privacy();
    return notFound();
  }
  function wrap(a, b) {
    return header() + `<main>${render(a, b)}</main>` + footer() + staffPill(a, b) + callbackModal() + cookieBar() + '<div class="toast" id="toast" role="status"></div>';
  }

  function bindCallback() {
    const m = $('#cbModal'); if (!m) return;
    maskPhone($('#cbPhone'));
    $$('[data-callback]').forEach((b) => b.addEventListener('click', () => { m.hidden = false; $('#cbName').focus(); }));
    $('#cbCancel').addEventListener('click', () => { m.hidden = true; });
    $('#cbForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = $('#cbName').value.trim(), phone = $('#cbPhone').value;
      $('[data-err="cbName"]').textContent = name.length < 2 ? 'Укажите имя' : '';
      $('[data-err="cbPhone"]').textContent = phone.replace(/\D/g, '').length < 11 ? 'Укажите телефон полностью' : '';
      if (name.length < 2 || phone.replace(/\D/g, '').length < 11) return;
      store.leads.unshift({ id: 'L-' + (store.leads.length + 4), t: NV.nowStr(), type: 'Звонок', name, phone, status: 'new', note: '' }); persist();
      if (store.tgn.leads) log('Telegram', `Уведомление менеджерам (${store.tgn.chat}): заявка на звонок`);
      m.hidden = true; $('#cbForm').reset(); toast('Заявка принята. Перезвоним в течение 5 минут в рабочее время');
    });
  }

  function bind(a, b) {
    const hs = $('#hsearch');
    if (hs) hs.addEventListener('submit', (ev) => { ev.preventDefault(); S.q = $('#hq').value; location.hash = '#/catalog'; PUB.route(); });
    bindCallback();
    const ck = $('#cookieOk'); if (ck) ck.addEventListener('click', () => { store.cookie = true; persist(); $('#cookieBar').remove(); });
    $$('[data-qty]').forEach((e) => e.addEventListener('click', () => { const [i, d] = e.dataset.qty.split(':').map(Number); const it = store.cart[i]; it.qty = Math.max(1, it.qty + d); persist(); PUB.route(true); }));
    $$('[data-rm]').forEach((e) => e.addEventListener('click', () => { store.cart.splice(+e.dataset.rm, 1); persist(); PUB.route(true); }));
    bindCheckout();
    if (a === 'catalog') {
      drawCatalog(b);
      $('#cq').addEventListener('input', (e) => { S.q = e.target.value; drawCatalog(b); });
      $('#csort').addEventListener('change', (e) => { S.sort = e.target.value; drawCatalog(b); });
      $('#conly').addEventListener('change', (e) => { S.onlyStock = e.target.checked; drawCatalog(b); });
    }
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
    $$('[data-count]').forEach((el) => { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { countUp(el); io.disconnect(); } }); io.observe(el); });
  }

  return { wrap, bind, route: () => {} };
})();
