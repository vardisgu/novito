/* Демо-данные. Реальные: названия моделей, фото и все числа у «Страйп 1н» (с metallstil.ru).
   Остальные цены и характеристики условные, у таких товаров стоит пометка demo.
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
  'Бежевый': '#d8cbb5', 'Оливковый': '#7d8761',
};

/* опция цвета: label подпись, items список цветов; gallery/pins у цвета, если есть своё фото */
function colorOpt(label, items) {
  return { label, items: items.map((i) => ({ swatch: SWATCH[i.name], ...i })) };
}

function variants(sizes, base, colors) {
  const cs = colors && colors.length ? colors : [''];
  const out = [];
  sizes.forEach((s, i) => cs.forEach((c) => {
    out.push({ size: s, color: c, retail: base + i * 400 });
  }));
  return out;
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
    colorOpt: colorOpt('Цвет металла', [{ name: 'Белый', gallery: ['strajp-1.jpg'] }, { name: 'Черный' }]),
    variants: variants(['120×200', '140×200', '160×200'], 15900, ['Белый', 'Черный']) },
  { id: 'strajp-5n', cat: 'odnoyarus', name: 'Кровать Страйп 5н', img: 'strajp-5n.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Белый', gallery: ['strajp-5n.jpg'] }, { name: 'Черный' }]),
    variants: variants(['120×200', '140×200', '160×200'], 17200, ['Белый', 'Черный']) },
  { id: 'kanzona', cat: 'odnoyarus', name: 'Кровать Канзона', img: 'kanzona.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Белый', gallery: ['kanzona.jpg'] }, { name: 'Черный' }]),
    variants: variants(['140×200', '160×200', '180×200'], 19800, ['Белый', 'Черный']) },
  { id: 'garda-2', cat: 'malajziya', name: 'Кровать Гарда 2', img: 'garda-2.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный', gallery: ['garda-2.jpg'] }, { name: 'Белый' }]),
    variants: variants(['140×200', '160×200'], 21400, ['Черный', 'Белый']) },
  { id: 'ofeliya-9', cat: 'malajziya', name: 'Кровать Офелия 9', img: 'ofeliya-9.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Белый', gallery: ['ofeliya-9.jpg'] }, { name: 'Черный' }]),
    variants: variants(['140×200', '160×200'], 22900, ['Белый', 'Черный']) },
  { id: 'aleks', cat: 'dvuhyarus', name: 'Кровать «Алекс» чердак', img: 'aleks.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Серебро', gallery: ['aleks.jpg'] }, { name: 'Черный' }]),
    variants: variants(['90×200'], 24500, ['Серебро', 'Черный']) },
  { id: 'semejnaya', cat: 'dvuhyarus', name: 'Кровать двухъярусная «Семейная»', img: 'semejnaya.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный', gallery: ['semejnaya.jpg'] }, { name: 'Белый' }]),
    variants: variants(['90×200'], 27900, ['Черный', 'Белый']) },
  { id: 'evropejskaya', cat: 'dvuhyarus', name: 'Кровать «Европейская» чердак', img: 'evropejskaya.jpg', demo: true,
    colorOpt: colorOpt('Цвет металла', [{ name: 'Черный', gallery: ['evropejskaya.jpg'] }, { name: 'Белый' }]),
    variants: variants(['90×200'], 23700, ['Черный', 'Белый']) },
  { id: 'tandem-5', cat: 'transformery', name: 'Диван-кровать Тандем 5', hit: true, img: 'tandem-5.jpg', fit: 'contain', demo: true,
    colorOpt: colorOpt('Цвет обивки', [{ name: 'Оливковый', gallery: ['tandem-5.jpg'] }, { name: 'Серый' }, { name: 'Бежевый' }]),
    variants: variants(['100×200'], 48900, ['Оливковый', 'Серый', 'Бежевый']) },
  { id: 'tandem-1', cat: 'transformery', name: 'Диван-кровать Тандем 1 с нырком', img: 'bruno.jpg', demo: true,
    colorOpt: colorOpt('Цвет боковин', [{ name: 'Бежевый', gallery: ['bruno.jpg'] }, { name: 'Белый' }]),
    variants: variants(['80×190', '90×200'], 29900, ['Бежевый', 'Белый']) },
  { id: 'bruno', cat: 'transformery', name: 'Диван Бруно', img: 'tandem-6.jpg', demo: true,
    colorOpt: colorOpt('Цвет обивки', [{ name: 'Серый', gallery: ['tandem-6.jpg'] }, { name: 'Графит' }, { name: 'Бежевый' }]),
    variants: variants(['140×210'], 38600, ['Серый', 'Графит', 'Бежевый']) },
  { id: 'mech-tandem-1', cat: 'mehanizmy', name: 'Механизм Тандем 1 с нырком', img: 'mech-tandem-1.jpg', demo: true, variants: variants(['80×190'], 8900) },
  { id: 'mech-tandem-4', cat: 'mehanizmy', name: 'Механизм Тандем 4', img: 'mech-tandem-4.jpg', demo: true, variants: variants(['80×190'], 7400) },
  { id: 'osnovanie', cat: 'osnovaniya', name: 'Ортопедическое основание разборное', img: 'osnovanie.jpg', demo: true, variants: variants(['140×200', '160×200'], 6900) },
];

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
  p.channels = { site: true, ozon: p.cat !== 'mehanizmy', tg: !!p.hit };
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

/* Заказы для примера. Новые заказы с сайта добавляются сверху. */
const ORDERS = [
  { id: 'NV-1041', date: '2026-10-24 18:20', source: 'Сайт', status: 'new', name: 'Покупатель 1', phone: '+7 900 000-00-01', city: 'Казань', delivery: 'Доставка', pay: 'Картой', paid: true, items: [{ id: 'kanzona', size: '160×200', color: 'Белый', qty: 1 }] },
  { id: 'NV-1040', date: '2026-10-24 12:05', source: 'Ozon', status: 'shipped', name: 'Покупатель 2', phone: '+7 900 000-00-02', city: 'Самара', delivery: 'Ozon', pay: 'Ozon', paid: true, items: [{ id: 'strajp-1n', size: '140×200', color: 'Черный', qty: 1 }] },
  { id: 'NV-1039', date: '2026-10-23 16:40', source: 'Сайт', status: 'assembling', name: 'Покупатель 3', phone: '+7 900 000-00-03', city: 'Казань', delivery: 'Самовывоз', pay: 'СБП', paid: true, items: [{ id: 'osnovanie', size: '160×200', color: '', qty: 2 }] },
];

const ROLES = {
  guest: { label: 'Посетитель', can: [], note: 'Видит сайт так, как его видят покупатели.' },
  editor: { label: 'Редактор статей', can: ['blog'], note: 'Пишет и публикует статьи. Каталога и настроек не видит.' },
  catalog: { label: 'Менеджер каталога', can: ['catalog', 'orders'], note: 'Правит карточки товаров и ведёт заказы. Блога и настроек не видит.' },
  admin: { label: 'Администратор', can: ['blog', 'catalog', 'orders', 'users', 'integrations'], note: 'Видит всё: контент, пользователей и подключения.' },
};
