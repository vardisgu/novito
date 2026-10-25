/* Маршрутизация: публичный сайт (public.js) и кабинет сотрудников (admin.js).
   Адреса на хэшах нужны только для демо без сервера, в боевой версии это обычные адреса (/catalog/, /product/..., /admin/). */
(() => {
  const { $, $$, store, S, curUser, START, loginUser, loginAs } = NV;

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
        $('#app').innerHTML = ADM.loginPage() + '<div class="toast" id="toast" role="status"></div>';
        document.body.classList.add('in-admin');
        $$('[data-fill]').forEach((e) => e.addEventListener('click', () => { $('#email').value = e.dataset.fill; $('#pass').value = DEMO_PASS; $('#loginErr').textContent = ''; }));
        $('#loginForm').addEventListener('submit', (ev) => {
          ev.preventDefault();
          const u = store.users.find((x) => x.email === $('#email').value.trim().toLowerCase());
          if (!u || $('#pass').value !== DEMO_PASS) { $('#loginErr').textContent = 'Неверная почта или пароль'; return; }
          loginUser(u); location.hash = START[u.role]; route();
        });
        window.scrollTo(0, 0);
        return;
      }
      if (!curUser()) { location.replace('#/admin'); return; }
      if (b === 'posts' && c === 'new') {
        if (!NV.can('blog')) { $('#app').innerHTML = ADM.shell(ADM.lock('Писать статьи могут редактор статей и администратор.'), 'posts'); ADM.bind('posts'); return; }
        const id = 'new-' + Date.now(); store.posts[id] = { title: 'Новая статья', date: new Date().toISOString().slice(0, 10), status: 'draft', body: ['Начните писать здесь.'] }; NV.persist(); location.replace('#/admin/posts/' + id); return;
      }
      const html = ADM.render(b, c);
      if (html === null) { location.replace(START[store.role]); return; }
      $('#app').innerHTML = ADM.shell(html, b);
      document.body.classList.add('in-admin');
      if (S.editing) document.body.classList.add('editing');
      ADM.bind(b, c);
      window.scrollTo(0, keepScroll === true ? y : 0);
      return;
    }

    $('#app').innerHTML = PUB.wrap(a, b);
    PUB.bind(a, b);
    NV.observeReveal();
    window.scrollTo(0, keepScroll === true ? y : 0);
  }
  ADM.route = route; PUB.route = route;

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal').forEach((m) => { m.hidden = true; }); });

  /* ссылки для показа: ?role=catalog входит сразу под нужной почтой */
  const qs = new URLSearchParams(location.search);
  if (ROLES[qs.get('role')] && qs.get('role') !== 'guest') loginAs(qs.get('role'));

  window.addEventListener('hashchange', route);
  route();
})();
