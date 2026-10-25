/* Реальные данные с metallstil.ru: названия моделей, фото, размеры, цвета и розничные цены всех товаров (по состоянию на 25.10.2026).
   Все числа у «Страйп 1н» тоже настоящие. Остальные характеристики, остатки и цена Тандем 1 (на сайте фабрики она по запросу) условные, у таких товаров стоит пометка demo.
   colorOpt описывает, ЧТО именно выбирает покупатель: цвет металла, цвет обивки и т.д.
   У механизмов и оснований цвета нет, поэтому у них colorOpt не задан и выбор не показывается. */

const CATS = {
  odnoyarus: { name: 'Одноярусные кровати', img: 'strajp-1n.jpg' },
  dvuhyarus: { name: 'Двухъярусные кровати', img: 'semejnaya.jpg' },
  malajziya: { name: 'Кровати Малайзия', img: 'garda-2.jpg' },
  transformery: { name: 'Кровати-трансформеры', img: 'bruno.jpg' },
  mehanizmy: { name: 'Механизмы трансформации', img: 'mech-tandem-1.jpg' },
  osnovaniya: { name: 'Ортопедические основания', img: 'osnovanie.jpg' },
};

const SWATCH = {
  'Черный': '#1b1f23', 'Белый': '#ffffff', 'Серебро': '#b9bec3', 'Серый': '#9aa0a6', 'Графит': '#4a4f55',
  'Бежевый': '#d8cbb5', 'Оливковый': '#7d8761', 'Венге': '#4a372f', 'Орех': '#7a5230', 'Синий': '#2f5fa8', 'Teddy': '#d9c9b0', 'Nebby': '#a4a8ad',
};

/* опция цвета: label подпись, items список цветов; gallery/pins у цвета, если есть своё фото */
function colorOpt(label, items) {
  return { label, items: items.map((i) => ({ swatch: SWATCH[i.name], ...i })) };
}

/* Цены с сайта фабрики. rows: [размер, цена] (одна цена на все цвета) или [размер, цена цвета 1, цена цвета 2, ...] */
function priced(rows, colors) {
  const cs = colors && colors.length ? colors : [''];
  return rows.flatMap((r) => cs.map((c, i) => ({ size: r[0], color: c, retail: r.length > 2 ? r[1 + i] : r[1] })));
}

const METAL = ['Черный', 'Белый'];

const PRODUCTS = [
  {
    id: 'strajp-1n', cat: 'odnoyarus', name: 'Кровать Страйп 1н', hit: true, img: 'strajp-1n-2.jpg',
    lead: 'Одноярусная металлическая кровать с волнообразным изголовьем. Любой серийный образец меняется под ваш запрос.',
    colorOpt: colorOpt('Цвет металла', [
      { name: 'Черный', gallery: ['strajp-1n-6.jpg', 'strajp-1n-2.jpg', 'strajp-1n-5.jpg'],
        pins: [
          { x: 30, y: 27, title: 'Изголовье', text: 'Высота 96 см, труба D38 мм' },
          { x: 41, y: 79, title: 'Опоры', text: 'Металл, стойки D38 мм' },
          { x: 62, y: 52, title: 'Основание', text: 'Труба 50×25 мм, берёзовые ламели' },
          { x: 91, y: 63, title: 'Просвет', text: '28,5 см от пола до основания' },
        ] },
      { name: 'Белый', gallery: ['strajp-1n.jpg', 'strajp-1n-3.jpg', 'strajp-1n-4.jpg'],
        pins: [
          { x: 33, y: 29, title: 'Изголовье', text: 'Высота 96 см, труба D38 мм' },
          { x: 47, y: 68, title: 'Опоры', text: 'Металл, стойки D38 мм' },
          { x: 66, y: 55, title: 'Основание', text: 'Труба 50×25 мм, берёзовые ламели' },
          { x: 12, y: 60, title: 'Просвет', text: '28,5 см от пола до основания' },
        ] },
    ]),
    variants: [
      { size: '120×200', color: 'Черный', retail: 16550 },
      { size: '120×200', color: 'Белый', retail: 16550 },
      { size: '140×200', color: 'Черный', retail: 16950 },
      { size: '140×200', color: 'Белый', retail: 16950 },
      { size: '160×200', color: 'Черный', retail: 18150 },
      { size: '160×200', color: 'Белый', retail: 18150 },
      { size: '180×200', color: 'Черный', retail: 19150 },
      { size: '180×200', color: 'Белый', retail: 19150 },
    ],
    stats: [
      { id: 'head', value: '96', unit: 'см', label: 'высота изголовья' },
      { id: 'load', value: '120', unit: 'кг', label: 'нагрузка на место' },
      { id: 'clear', value: '28,5', unit: 'см', label: 'просвет от пола' },
      { id: 'warranty', value: '18', unit: 'мес', label: 'гарантия' },
    ],
    specs: [
      ['Размеры', [['Габариты, Ш×Д', '121,5-181,5 × 206,5 см'], ['Высота изножья', '38 см'], ['Высота матраса', '14-28 см']]],
      ['Конструкция', [['Основание', 'труба 50×25 мм, берёзовые ламели'], ['Стойки', 'труба D38 мм'], ['Ограничители матраса', '4 шт, металл'], ['Подъёмный механизм', 'нет']]],
      ['Упаковка', [['Места', '2 (рама и изголовье)'], ['Вес', '14-20 кг на место'], ['Ящик для белья', 'отдельно']]],
    ],
  },
  { id: 'strajp-1', cat: 'odnoyarus', name: 'Кровать Страйп 1', img: 'strajp-1.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный' }, { name: 'Белый', gallery: ['strajp-1.jpg'] }]),
    variants: priced([['120×200', 15850, 16150], ['140×200', 16150, 16750], ['160×200', 16750, 17800], ['180×200', 18700, 19250]], ['Черный', 'Белый']) },
  { id: 'strajp-5n', cat: 'odnoyarus', name: 'Кровать Страйп 5н', img: 'strajp-5n.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный' }, { name: 'Белый', gallery: ['strajp-5n.jpg'] }]),
    variants: priced([['120×200', 15600, 16100], ['140×200', 16100, 16500], ['160×200', 16500, 17600], ['180×200', 17600, 18500]], ['Черный', 'Белый']) },
  { id: 'kanzona', cat: 'odnoyarus', name: 'Кровать Канзона', img: 'kanzona.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный' }, { name: 'Белый', gallery: ['kanzona.jpg'] }]),
    variants: priced([['90×200', 14850, 15050], ['120×200', 16850, 17050], ['140×200', 17250, 17500], ['160×200', 17700, 17950], ['180×200', 19050, 19250]], ['Черный', 'Белый']) },
  { id: 'garda-2', cat: 'malajziya', name: 'Кровать Гарда 2', img: 'garda-2.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Белый' }, { name: 'Венге' }, { name: 'Орех' }]),
    variants: priced([['90×200', 20450], ['120×200', 25200], ['140×200', 25500], ['160×200', 25900], ['180×200', 27000]], ['Белый', 'Венге', 'Орех']) },
  { id: 'ofeliya-9', cat: 'malajziya', name: 'Кровать Офелия 9', img: 'ofeliya-9.jpg', demo: true, lead: 'Кровать серии «Малайзия». Цвет металла: венге.',
    variants: priced([['90×200', 18510], ['120×200', 20110], ['140×200', 20790], ['160×200', 21040], ['180×200', 22440]]) },
  { id: 'aleks', cat: 'dvuhyarus', name: 'Кровать «Алекс» чердак', img: 'aleks.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный' }, { name: 'Белый' }, { name: 'Синий' }]),
    variants: priced([['90×200', 18500]], ['Черный', 'Белый', 'Синий']) },
  { id: 'semejnaya', cat: 'dvuhyarus', name: 'Кровать двухъярусная «Семейная»', img: 'semejnaya.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный', gallery: ['semejnaya.jpg'] }, { name: 'Белый' }, { name: 'Серый' }]),
    variants: priced([['90×190 (120×190)', 24000, 25000, 24400], ['90×190 (140×190)', 25000, 26000, 25400]], ['Черный', 'Белый', 'Серый']) },
  { id: 'evropejskaya', cat: 'dvuhyarus', name: 'Кровать «Европейская» чердак', img: 'evropejskaya.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный', gallery: ['evropejskaya.jpg'] }, { name: 'Белый' }]),
    variants: priced([['90×180', 17900], ['90×200', 17900], ['90×210', 20900]], ['Черный', 'Белый']) },
  { id: 'tandem-5', cat: 'transformery', name: 'Диван-кровать Тандем 5', hit: true, img: 'tandem-5.jpg', fit: 'contain', demo: true, lead: 'Диван-трансформер в двухъярусную кровать за считанные минуты. Цвет металла: серый.',
    variants: priced([['80×200', 80500]]) },
  { id: 'tandem-1', cat: 'transformery', name: 'Диван-кровать Тандем 1 с нырком', img: 'bruno.jpg', demo: true, priceDemo: true, lead: 'Диван-кровать с выкатным местом. Цвет металла: серый. На сайте фабрики цена по запросу.',
    variants: priced([['90×200', 29900]]) },
  { id: 'bruno', cat: 'transformery', name: 'Диван Бруно', img: 'tandem-6.jpg', demo: true, lead: 'Диван с механизмом Lit. Ткань на выбор из каталогов.',
    colorOpt: colorOpt('Ткань', [{ name: 'Teddy' }, { name: 'Nebby' }]),
    variants: priced([['140×210', 52000]], ['Teddy', 'Nebby']) },
  { id: 'mech-tandem-1', cat: 'mehanizmy', name: 'Механизм Тандем 1 с нырком', img: 'mech-tandem-1.jpg', demo: true, variants: priced([['90×200', 18500], ['90×190', 18500], ['80×200', 18500], ['80×190', 18500]]) },
  { id: 'mech-tandem-4', cat: 'mehanizmy', name: 'Механизм Тандем 4', img: 'mech-tandem-4.jpg', demo: true, variants: priced([['80×190', 9550]]) },
  { id: 'osnovanie', cat: 'osnovaniya', name: 'Ортопедическое основание разборное', img: 'osnovanie.jpg', demo: true, variants: priced([['90×200', 3450], ['120×200', 5780], ['140×200', 5900], ['160×200', 6050], ['180×200', 6370], ['200×200', 7080]]) },
];

/* Остатки условные: в демо их нет в данных фабрики */
const STOCK = { 'strajp-1n': 42, 'strajp-1': 18, 'strajp-5n': 25, kanzona: 9, 'garda-2': 14, 'ofeliya-9': 6, aleks: 11, semejnaya: 8, evropejskaya: 0, 'tandem-5': 5, 'tandem-1': 12, bruno: 7, 'mech-tandem-1': 120, 'mech-tandem-4': 64, osnovanie: 3 };

PRODUCTS.forEach((p) => {
  if (!p.lead) p.lead = 'Модель из каталога фабрики «Новита». Размеры и цвет можно изменить под заказ.';
  if (!p.gallery) p.gallery = [p.img];
  if (!p.stats) p.stats = [
    { id: 'load', value: '100', unit: 'кг', label: 'нагрузка на место' },
    { id: 'steel', value: '1,5', unit: 'мм', label: 'толщина стали' },
    { id: 'ship', value: '1', unit: 'день', label: 'отгрузка из наличия' },
    { id: 'warranty', value: '18', unit: 'мес', label: 'гарантия' },
  ];
  if (!p.pins) p.pins = [];
  if (!p.specs) p.specs = [
    ['Конструкция', [['Материал', 'сталь, порошковая окраска'], ['Основание', 'металлические опоры']]],
    ['Условия', [['Отгрузка', 'в день обращения из наличия'], ['Гарантия', '18 месяцев']]],
  ];
  p.channels = { site: true, ozon: p.cat !== 'mehanizmy' };
  p.sku = 'NV-' + p.id.toUpperCase().replace(/[^A-Z0-9]+/g, '-');
  p.stock = STOCK[p.id] ?? 20;
});

const POSTS = [
  { id: 'dvuhyarusnaya-dlya-detej', title: 'Как выбрать двухъярусную кровать для детей', date: '2026-09-12', status: 'published',
    body: ['Для детской комнаты важнее всего безопасность: высокие бортики на втором ярусе, устойчивая лестница и нагрузка не ниже 100 кг на спальное место.', 'Проверьте высоту между ярусами. Взрослому нужно хотя бы 80 см, чтобы сесть на нижней кровати, а ребёнку на втором ярусе нужно расстояние до потолка не меньше 70 см.'] },
  { id: 'vidy-mehanizmov', title: 'Виды механизмов для диванов', date: '2026-08-28', status: 'published',
    body: ['Механизм определяет, как диван раскладывается и сколько места под него нужно. «Нырок» выкатывается вперёд, а затем раскладывается вверх, поэтому у стены нужен небольшой зазор.', 'Для ежедневного сна подойдут механизмы с ортопедическим основанием на ламелях. Для гостевого дивана достаточно более простой рамы.'] },
  { id: 'krovati-transformery', title: 'Кровати-трансформеры: виды и особенности', date: '2026-08-05', status: 'published',
    body: ['Трансформер экономит площадь: днём это диван, ночью кровать, а в двухъярусном варианте ещё и второе спальное место.', 'Перед покупкой уточните нагрузку на механизм, толщину металла и срок гарантии на сам механизм, а не только на обивку.'] },
  { id: 'podemnyj-mehanizm', title: 'Как выбрать кровать с подъёмным механизмом', date: '2026-07-19', status: 'published',
    body: ['Подъёмное основание открывает большой ящик для белья. Смотрите на тип привода: газлифты поднимают основание плавно и держат его в любом положении.', 'Учтите, что высота матраса влияет на ход механизма: слишком толстый матрас может мешать подъёму.'] },
  { id: 'top-8-sovetov', title: 'ТОП 8 советов, как выбрать хорошую кровать', date: '2026-07-02', status: 'published',
    body: ['Начните с размера: между краем кровати и стеной оставьте не меньше 60 см. Затем решите, какое основание вам нужно: ламели или жёсткий щит.', 'Остальное зависит от задач: хранение вещей, частота использования и вес спящих.'] },
];

/* Сотрудники. В демо роль определяется по почте при входе в /admin, пароль у всех один (DEMO_PASS).
   В настоящем проекте это делает сервер: проверяет пароль и выдаёт права по роли из базы. */
const DEMO_PASS = 'novita';
const USERS = [
  { id: 1, email: 'redactor@novita.demo', role: 'editor' },
  { id: 2, email: 'catalog@novita.demo', role: 'catalog' },
  { id: 3, email: 'admin@novita.demo', role: 'admin' },
];

/* Заказы для примера. Даты считаются от сегодняшнего дня, чтобы график в кабинете не выглядел пустым. */
function ago(days, hour, min) {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, min, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const ORDERS = [
  { id: 'NV-1041', date: ago(0, 9, 20), source: 'Сайт', status: 'new', name: 'Покупатель 1', phone: '+7 (900) 000-00-01', city: 'Казань', delivery: 'Доставка', address: 'Казань, ул. Примерная, 1', pay: 'Картой', paid: true, items: [{ id: 'kanzona', size: '160×200', color: 'Белый', qty: 1 }] },
  { id: 'NV-1040', date: ago(1, 12, 5), source: 'Ozon', status: 'shipped', name: 'Покупатель 2', phone: '+7 (900) 000-00-02', city: 'Самара', delivery: 'Ozon', pay: 'Ozon', paid: true, items: [{ id: 'strajp-1n', size: '140×200', color: 'Черный', qty: 1 }] },
  { id: 'NV-1039', date: ago(1, 16, 40), source: 'Сайт', status: 'assembling', name: 'Покупатель 3', phone: '+7 (900) 000-00-03', city: 'Казань', delivery: 'Самовывоз', pay: 'СБП', paid: true, items: [{ id: 'osnovanie', size: '160×200', color: '', qty: 2 }] },
  { id: 'NV-1038', date: ago(2, 11, 15), source: 'Ozon', status: 'done', name: 'Покупатель 4', phone: '+7 (900) 000-00-04', city: 'Москва', delivery: 'Ozon', pay: 'Ozon', paid: true, items: [{ id: 'strajp-1n', size: '120×200', color: 'Белый', qty: 1 }] },
  { id: 'NV-1037', date: ago(3, 14, 30), source: 'Сайт', status: 'production', name: 'Покупатель 5', phone: '+7 (900) 000-00-05', city: 'Набережные Челны', delivery: 'Доставка', address: 'Набережные Челны, пр. Примерный, 5', pay: 'Картой', paid: true, items: [{ id: 'semejnaya', size: '90×190 (120×190)', color: 'Черный', qty: 1 }] },
  { id: 'NV-1036', date: ago(4, 10, 10), source: 'Сайт', status: 'done', name: 'Покупатель 6', phone: '+7 (900) 000-00-06', city: 'Казань', delivery: 'Самовывоз', pay: 'СБП', paid: true, items: [{ id: 'strajp-5n', size: '140×200', color: 'Белый', qty: 1 }] },
  { id: 'NV-1035', date: ago(5, 18, 45), source: 'Ozon', status: 'done', name: 'Покупатель 7', phone: '+7 (900) 000-00-07', city: 'Уфа', delivery: 'Ozon', pay: 'Ozon', paid: true, items: [{ id: 'mech-tandem-4', size: '80×190', color: '', qty: 3 }] },
  { id: 'NV-1034', date: ago(7, 13, 25), source: 'Сайт', status: 'canceled', name: 'Покупатель 8', phone: '+7 (900) 000-00-08', city: 'Казань', delivery: 'Доставка', address: 'Казань, ул. Примерная, 8', pay: 'Картой', paid: false, items: [{ id: 'garda-2', size: '160×200', color: 'Белый', qty: 1 }] },
  { id: 'NV-1033', date: ago(8, 9, 50), source: 'Сайт', status: 'done', name: 'Покупатель 9', phone: '+7 (900) 000-00-09', city: 'Чебоксары', delivery: 'Доставка', address: 'Чебоксары, ул. Примерная, 9', pay: 'Картой', paid: true, items: [{ id: 'tandem-5', size: '80×200', color: '', qty: 1 }] },
  { id: 'NV-1032', date: ago(10, 15, 0), source: 'Ozon', status: 'done', name: 'Покупатель 10', phone: '+7 (900) 000-00-10', city: 'Екатеринбург', delivery: 'Ozon', pay: 'Ozon', paid: true, items: [{ id: 'strajp-1n', size: '160×200', color: 'Черный', qty: 2 }] },
  { id: 'NV-1031', date: ago(12, 12, 30), source: 'Сайт', status: 'done', name: 'Покупатель 11', phone: '+7 (900) 000-00-11', city: 'Казань', delivery: 'Самовывоз', pay: 'СБП', paid: true, items: [{ id: 'evropejskaya', size: '90×200', color: 'Черный', qty: 1 }] },
];

/* Заявки на звонок (форма на сайте) */
const LEADS = [
  { id: 'L-3', t: ago(0, 10, 12), type: 'Звонок', name: 'Покупатель 12', phone: '+7 (900) 000-00-12', status: 'new', note: 'Хочу уточнить размер' },
  { id: 'L-2', t: ago(2, 17, 3), type: 'Звонок', name: 'Покупатель 13', phone: '+7 (900) 000-00-13', status: 'done', note: '' },
];

/* Журнал синхронизаций и событий */
const SYNC_LOG = [
  { t: ago(0, 9, 0), kind: 'Ozon', msg: 'Синхронизация: цены и остатки обновлены' },
  { t: ago(1, 9, 0), kind: 'Ozon', msg: 'Синхронизация: цены и остатки обновлены' },
  { t: ago(1, 12, 6), kind: 'Ozon', msg: 'Новый заказ NV-1040 загружен с Ozon' },
];

/* Старые адреса WordPress (metallstil.ru) и куда они должны вести на новом сайте.
   Нужны, чтобы после переезда не потерять позиции в Яндексе и Google. */
const OLD_URLS = [
  ['/catalog/odnoyarusnye-metallicheskie-krovati/', '/catalog/odnoyarus/'],
  ['/catalog/dvuhyarusnye-metallicheskie-krovati/', '/catalog/dvuhyarus/'],
  ['/catalog/krovati-malajziya/', '/catalog/malajziya/'],
  ['/catalog/krovati-transformery/', '/catalog/transformery/'],
  ['/catalog/mehanizmy-transformatsii/', '/catalog/mehanizmy/'],
  ['/catalog/ortopedicheskie-osnovaniya/', '/catalog/osnovaniya/'],
  ['/catalog/odnoyarusnye-metallicheskie-krovati/krovat-strajp-1n/', '/product/strajp-1n/'],
  ['/catalog/odnoyarusnye-metallicheskie-krovati/krovat-sirajp/', '/product/strajp-1/'],
  ['/catalog/odnoyarusnye-metallicheskie-krovati/krovat-strajp-5n/', '/product/strajp-5n/'],
  ['/catalog/odnoyarusnye-metallicheskie-krovati/krovat-kanzona/', '/product/kanzona/'],
  ['/catalog/krovati-malajziya/krovat-garda-2/', '/product/garda-2/'],
  ['/catalog/krovati-malajziya/krovat-ofeliya-9/', '/product/ofeliya-9/'],
  ['/catalog/dvuhyarusnye-metallicheskie-krovati/krovat-dvuhyarusnaya-semejnaya/', '/product/semejnaya/'],
  ['/catalog/dvuhyarusnye-metallicheskie-krovati/krovat-dvuhyarusnaya-aleks-cherdak/', '/product/aleks/'],
  ['/catalog/dvuhyarusnye-metallicheskie-krovati/krovat-dvuhyarusnaya-evropejskaya-cherdak/', '/product/evropejskaya/'],
  ['/catalog/dvuhyarusnye-metallicheskie-krovati/divan-krovat-tandem-5/', '/product/tandem-5/'],
  ['/catalog/krovati-transformery/divan-bruno/', '/product/bruno/'],
  ['/catalog/mehanizmy-transformatsii/mehanizm-tandem-1-s-nyrkom-80-190/', '/product/mech-tandem-1/'],
  ['/catalog/mehanizmy-transformatsii/mehanizm-tandem-4/', '/product/mech-tandem-4/'],
  ['/catalog/ortopedicheskie-osnovaniya/ortopedicheskoe-osnovanie-razbornoe-2/', '/product/osnovanie/'],
  ['/blog/kak-vybrat-dvuhyarusnuyu-krovat-dlya-detej/', '/blog/dvuhyarusnaya-dlya-detej/'],
  ['/blog/vidy-mehanizmov-dlya-divanov/', '/blog/vidy-mehanizmov/'],
  ['/blog/krovati-transformery-vidy-i-osobennosti/', '/blog/krovati-transformery/'],
  ['/blog/kak-vybrat-krovat-s-podemnym-mehanizmom/', '/blog/podemnyj-mehanizm/'],
  ['/blog/top-8-sovetov-kak-pravilno-vybrat-horoshuyu-krovat/', '/blog/top-8-sovetov/'],
  ['/contacts/', '/contacts/'],
];

const ROLES = {
  guest: { label: 'Посетитель', can: [], note: 'Видит сайт так, как его видят покупатели.' },
  editor: { label: 'Редактор статей', can: ['blog'], note: 'Пишет и публикует статьи. Каталога и настроек не видит.' },
  catalog: { label: 'Менеджер каталога', can: ['catalog', 'orders', 'leads', 'ozon'], note: 'Правит товары, ведёт заказы и заявки, следит за Ozon. Блога и настроек не видит.' },
  admin: { label: 'Администратор', can: ['blog', 'catalog', 'orders', 'leads', 'ozon', 'seo', 'users', 'integrations'], note: 'Видит всё: контент, пользователей и подключения.' },
};
