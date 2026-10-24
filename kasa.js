/* ============================================================
   BEAUTY GAMES — каса майстра
   ------------------------------------------------------------
   Для тих, кому фізично боляче рахувати гроші. Після кожної
   клієнтки — один тап по послузі. Каса сама розкладає оплату:
   частина на матеріали, частина на податок, з решти спершу
   збирається оренда, а все, що зверху, — «твої».

   Слів «прибуток» і «собівартість» на екрані немає навмисно:
   людина бачить одну цифру і кілька «конвертів, які не чіпати».

   Дані живуть у localStorage (bg_kasa) і нікуди не йдуть.
   Перенести на інший телефон — через «Зберегти копію в файл».
   Мова — uk/ru, словник нижче; українська — джерело.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- словник ---------- */
  var T = {
    uk: {
      'title': 'Каса майстра — Beauty Games',
      'settings': 'Налаштування',
      'ob.kick1': 'Хвилинка знайомства · 1 / 4',
      'ob.h1': 'Чим ти займаєшся?',
      'ob.s1': 'Нічого рахувати не треба. Відповідаєш на чотири питання — і далі просто тапаєш після кожної клієнтки.',
      'ob.cur': 'Валюта',
      'ob.kick2': '2 / 4',
      'ob.h2': 'Твої послуги і ціни',
      'ob.s2': 'Тапни ті, що робиш найчастіше, і впиши ціну. Це будуть кнопки, якими ти записуватимеш клієнток.',
      'ob.addSvc': '+ своя послуга',
      'ob.svcName': 'Назва послуги',
      'ob.svcPrice': 'Ціна',
      'ob.kick3': '3 / 4',
      'ob.h3': 'Що йде не тобі',
      'ob.s3': 'Приблизно — це нормально. Потім можна поправити.',
      'ob.rent': 'Оренда кабінету або місця за місяць',
      'ob.rentNo': 'Не плачу',
      'ob.rentYes': 'Плачу',
      'ob.mat': 'Скільки йде на матеріали з однієї клієнтки?',
      'ob.matLow': 'Мало',
      'ob.matMid': 'Як у всіх',
      'ob.matHigh': 'Багато',
      'ob.matHint': 'Відкладатимемо приблизно {p}% з кожної оплати — на гель, фарбу, одноразове. Купила матеріали — гроші візьмуться звідси.',
      'ob.kick4': '4 / 4',
      'ob.h4': 'Податки і мрія',
      'ob.s4': 'Податок відкладемо автоматично, щоб він не став сюрпризом.',
      'ob.tax': 'Податки',
      'ob.taxNone': 'Не плачу',
      'ob.taxPct': 'Відсоток',
      'ob.taxFix': 'Фіксована сума',
      'ob.perMonth': 'на місяць',
      'ob.goal': 'Скільки хочеш мати собі за місяць?',
      'ob.goalHint': 'Необов’язково. Покажемо, скільки лишилося до мети.',
      'ob.back': 'Назад',
      'ob.next': 'Далі',
      'ob.finish': 'Готово, до каси',
      'err.dir': 'Обери свій напрямок',
      'err.svc': 'Додай хоча б одну послугу з ціною',
      'err.price': 'Впиши ціну для кожної послуги',
      'err.rent': 'Впиши, скільки платиш за оренду',
      'err.taxPct': 'Обери відсоток податку',
      'err.taxFix': 'Впиши суму податку на місяць',

      'app.yours': 'Твої в цьому місяці',
      'app.yoursPast': 'Твої за цей місяць',
      'app.client': 'Клієнтка',
      'app.expense': 'Витрата',
      'app.envH': 'Ці гроші не чіпай',
      'app.envS': 'вони вже чиїсь',
      'app.story': 'Підсумок для сторіс',
      'app.privacy': 'Усі цифри зберігаються тільки в твоєму телефоні й нікуди не надсилаються.',
      'app.first': 'Запиши першу клієнтку — і тут з’явиться твоя сума.',
      'app.short': 'Спершу збираємо на оренду й платежі: лишилося {x}. Далі все — твоє.',
      'app.ok': 'Це можна спокійно витрачати на себе.',
      'app.goalT': 'До мети {g} лишилося {x}',
      'app.goalDone': 'Мету {g} виконано. Ти молодець!',
      'app.total': 'Прийшло на картку: <b>{x}</b> · клієнток: <b>{n}</b>',
      'app.tips': ' · чайові: <b>{x}</b>',
      'app.empty': 'Тут з’являтимуться записи. Скасувати будь-який можна хрестиком.',
      'env.mat': 'Матеріали',
      'env.matS': 'відкладено з оплат · куплено на {x}',
      'env.matOver': 'купила більше, ніж відкладали — різницю вже знято з твоїх',
      'env.tax': 'Податок',
      'env.taxPctS': '{p}% з кожної оплати',
      'env.taxFixS': 'зібрано з {x}',
      'env.rent': 'Оренда',
      'env.rentS': 'зібрано з {x}',
      'env.other': 'Інші витрати',
      'env.otherS': 'реклама, навчання, інструмент',
      'env.none': 'Тут поки порожньо: усе, що приходить, — твоє.',
      'day.today': 'Сьогодні',
      'day.yday': 'Вчора',

      'cl.h': 'Що зробила?',
      'cl.s': 'Один тап — і записано.',
      'cl.other': 'Інша сума або чайові',
      'cl.sum': 'Сума',
      'cl.tip': 'Чайові',
      'cl.save': 'Записати',
      'cl.custom': 'Інша послуга',
      'cl.tipOnly': 'Чайові',

      'ex.h': 'На що пішли гроші?',
      'ex.mat': 'Матеріали',
      'ex.ads': 'Реклама',
      'ex.edu': 'Навчання',
      'ex.tool': 'Інструмент',
      'ex.other': 'Інше',
      'ex.matHint': 'Візьмемо з конверта «матеріали» — твої не зменшаться, поки не витратиш більше, ніж відкладено.',
      'ex.otherHint': 'Віднімемо з твоїх.',

      'st.week': 'Тиждень',
      'st.month': 'Місяць',
      'st.hint': 'Зроби скриншот — і в сторіс. Відмітиш @beauty_games.pro — передамо привіт.',
      'st.myWeek': 'Мій тиждень',
      'st.myMonth': 'Мій місяць',
      'st.yours': 'чистими — собі',
      'st.came': 'прийшло за роботу',
      'st.clients': 'клієнток',
      'st.avg': 'середній чек',
      'st.tag': 'Рахую з Касою майстра · @beauty_games.pro',

      'set.h': 'Налаштування',
      'set.redo': 'Змінити послуги, ціни, витрати',
      'set.backup': 'Зберегти копію в файл',
      'set.restore': 'Відновити з файлу',
      'set.backupHint': 'Копія знадобиться, якщо зміниш телефон або почистиш браузер.',
      'set.reset': 'Стерти все і почати заново',
      'set.resetQ': 'Точно стерти всі записи й налаштування? Це не можна скасувати.',
      'set.restored': 'Копію відновлено',
      'set.badFile': 'Це не схоже на копію каси',

      'toast.added': '+{x} · твоїх уже {y}',
      'toast.short': '+{x} · до оренди лишилося {y}',
      'toast.exp': 'Записано −{x}',
      'toast.del': 'Запис видалено',
      'toast.undo': 'Скасувати',

      'dir.Броу-майстер': 'Брови',
      'dir.Лашмейкер': 'Вії',
      'dir.Нігтьовий сервіс': 'Нігті',
      'dir.Перманент': 'Перманент',
      'dir.Візажист': 'Макіяж',
      'dir.Перукар-стиліст': 'Перукар',
      'dir.Нарощування волосся': 'Нарощення',
      'dir.Косметологія': 'Косметолог',
      'dir.Масажист': 'Масаж',
      'dir.Лазерне видалення': 'Лазер',
      'dir.Депіляція': 'Депіляція',
      'dir.Подологія': 'Подологія',

      'months': ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
      'monthsGen': ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
      'locale': 'uk-UA'
    },
    ru: {
      'title': 'Касса мастера — Beauty Games',
      'settings': 'Настройки',
      'ob.kick1': 'Минутка знакомства · 1 / 4',
      'ob.h1': 'Чем ты занимаешься?',
      'ob.s1': 'Ничего считать не нужно. Отвечаешь на четыре вопроса — и дальше просто тапаешь после каждой клиентки.',
      'ob.cur': 'Валюта',
      'ob.kick2': '2 / 4',
      'ob.h2': 'Твои услуги и цены',
      'ob.s2': 'Тапни те, что делаешь чаще всего, и впиши цену. Это будут кнопки, которыми ты будешь записывать клиенток.',
      'ob.addSvc': '+ своя услуга',
      'ob.svcName': 'Название услуги',
      'ob.svcPrice': 'Цена',
      'ob.kick3': '3 / 4',
      'ob.h3': 'Что уходит не тебе',
      'ob.s3': 'Примерно — это нормально. Потом можно поправить.',
      'ob.rent': 'Аренда кабинета или места в месяц',
      'ob.rentNo': 'Не плачу',
      'ob.rentYes': 'Плачу',
      'ob.mat': 'Сколько уходит на материалы с одной клиентки?',
      'ob.matLow': 'Мало',
      'ob.matMid': 'Как у всех',
      'ob.matHigh': 'Много',
      'ob.matHint': 'Будем откладывать примерно {p}% с каждой оплаты — на гель, краску, одноразовое. Купила материалы — деньги возьмутся отсюда.',
      'ob.kick4': '4 / 4',
      'ob.h4': 'Налоги и мечта',
      'ob.s4': 'Налог отложим автоматически, чтобы он не стал сюрпризом.',
      'ob.tax': 'Налоги',
      'ob.taxNone': 'Не плачу',
      'ob.taxPct': 'Процент',
      'ob.taxFix': 'Фиксированная сумма',
      'ob.perMonth': 'в месяц',
      'ob.goal': 'Сколько хочешь иметь себе за месяц?',
      'ob.goalHint': 'Необязательно. Покажем, сколько осталось до цели.',
      'ob.back': 'Назад',
      'ob.next': 'Дальше',
      'ob.finish': 'Готово, к кассе',
      'err.dir': 'Выбери своё направление',
      'err.svc': 'Добавь хотя бы одну услугу с ценой',
      'err.price': 'Впиши цену для каждой услуги',
      'err.rent': 'Впиши, сколько платишь за аренду',
      'err.taxPct': 'Выбери процент налога',
      'err.taxFix': 'Впиши сумму налога в месяц',

      'app.yours': 'Твои в этом месяце',
      'app.yoursPast': 'Твои за этот месяц',
      'app.client': 'Клиентка',
      'app.expense': 'Трата',
      'app.envH': 'Эти деньги не трогай',
      'app.envS': 'они уже чьи-то',
      'app.story': 'Итог для сторис',
      'app.privacy': 'Все цифры хранятся только в твоём телефоне и никуда не отправляются.',
      'app.first': 'Запиши первую клиентку — и здесь появится твоя сумма.',
      'app.short': 'Сначала собираем на аренду и платежи: осталось {x}. Дальше всё — твоё.',
      'app.ok': 'Это можно спокойно тратить на себя.',
      'app.goalT': 'До цели {g} осталось {x}',
      'app.goalDone': 'Цель {g} выполнена. Ты молодец!',
      'app.total': 'Пришло на карту: <b>{x}</b> · клиенток: <b>{n}</b>',
      'app.tips': ' · чаевые: <b>{x}</b>',
      'app.empty': 'Здесь будут появляться записи. Отменить любую можно крестиком.',
      'env.mat': 'Материалы',
      'env.matS': 'отложено с оплат · куплено на {x}',
      'env.matOver': 'купила больше, чем откладывали — разницу уже сняли с твоих',
      'env.tax': 'Налог',
      'env.taxPctS': '{p}% с каждой оплаты',
      'env.taxFixS': 'собрано из {x}',
      'env.rent': 'Аренда',
      'env.rentS': 'собрано из {x}',
      'env.other': 'Другие траты',
      'env.otherS': 'реклама, обучение, инструмент',
      'env.none': 'Здесь пока пусто: всё, что приходит, — твоё.',
      'day.today': 'Сегодня',
      'day.yday': 'Вчера',

      'cl.h': 'Что сделала?',
      'cl.s': 'Один тап — и записано.',
      'cl.other': 'Другая сумма или чаевые',
      'cl.sum': 'Сумма',
      'cl.tip': 'Чаевые',
      'cl.save': 'Записать',
      'cl.custom': 'Другая услуга',
      'cl.tipOnly': 'Чаевые',

      'ex.h': 'На что ушли деньги?',
      'ex.mat': 'Материалы',
      'ex.ads': 'Реклама',
      'ex.edu': 'Обучение',
      'ex.tool': 'Инструмент',
      'ex.other': 'Другое',
      'ex.matHint': 'Возьмём из конверта «материалы» — твои не уменьшатся, пока не потратишь больше, чем отложено.',
      'ex.otherHint': 'Вычтем из твоих.',

      'st.week': 'Неделя',
      'st.month': 'Месяц',
      'st.hint': 'Сделай скриншот — и в сторис. Отметишь @beauty_games.pro — передадим привет.',
      'st.myWeek': 'Моя неделя',
      'st.myMonth': 'Мой месяц',
      'st.yours': 'чистыми — себе',
      'st.came': 'пришло за работу',
      'st.clients': 'клиенток',
      'st.avg': 'средний чек',
      'st.tag': 'Считаю с Кассой мастера · @beauty_games.pro',

      'set.h': 'Настройки',
      'set.redo': 'Изменить услуги, цены, расходы',
      'set.backup': 'Сохранить копию в файл',
      'set.restore': 'Восстановить из файла',
      'set.backupHint': 'Копия пригодится, если сменишь телефон или почистишь браузер.',
      'set.reset': 'Стереть всё и начать заново',
      'set.resetQ': 'Точно стереть все записи и настройки? Это нельзя отменить.',
      'set.restored': 'Копия восстановлена',
      'set.badFile': 'Это не похоже на копию кассы',

      'toast.added': '+{x} · твоих уже {y}',
      'toast.short': '+{x} · до аренды осталось {y}',
      'toast.exp': 'Записано −{x}',
      'toast.del': 'Запись удалена',
      'toast.undo': 'Отменить',

      'dir.Броу-майстер': 'Брови',
      'dir.Лашмейкер': 'Ресницы',
      'dir.Нігтьовий сервіс': 'Ногти',
      'dir.Перманент': 'Перманент',
      'dir.Візажист': 'Макияж',
      'dir.Перукар-стиліст': 'Парикмахер',
      'dir.Нарощування волосся': 'Наращивание',
      'dir.Косметологія': 'Косметолог',
      'dir.Масажист': 'Массаж',
      'dir.Лазерне видалення': 'Лазер',
      'dir.Депіляція': 'Депиляция',
      'dir.Подологія': 'Подология',

      'months': ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      'monthsGen': ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
      'locale': 'ru-RU'
    }
  };

  /* Напрямки — ті самі ключі, що в калькуляторі й на головній (bg_character).
     mat — звична частка матеріалів у чеку для «як у всіх».
     sug — підказки послуг: [укр, рос]. */
  var DIRS = [
    ['Броу-майстер', 'i-brow', .10, [['Корекція брів', 'Коррекция бровей'], ['Корекція + фарбування', 'Коррекция + окрашивание'], ['Ламінування брів', 'Ламинирование бровей'], ['Брови + вії', 'Брови + ресницы']]],
    ['Лашмейкер', 'i-lash', .12, [['Класика', 'Классика'], ['2D', '2D'], ['Об’єм', 'Объём'], ['Корекція', 'Коррекция'], ['Ламінування вій', 'Ламинирование ресниц']]],
    ['Нігтьовий сервіс', 'i-nails', .12, [['Манікюр з покриттям', 'Маникюр с покрытием'], ['Манікюр без покриття', 'Маникюр без покрытия'], ['Нарощування', 'Наращивание'], ['Педикюр', 'Педикюр'], ['Корекція', 'Коррекция']]],
    ['Перманент', 'i-pmu', .07, [['Пудрові брови', 'Пудровые брови'], ['Губи', 'Губы'], ['Стрілки', 'Стрелки'], ['Корекція', 'Коррекция']]],
    ['Візажист', 'i-makeup', .08, [['Денний макіяж', 'Дневной макияж'], ['Вечірній макіяж', 'Вечерний макияж'], ['Весільний макіяж', 'Свадебный макияж'], ['Макіяж + зачіска', 'Макияж + причёска']]],
    ['Перукар-стиліст', 'i-hair', .18, [['Стрижка', 'Стрижка'], ['Стрижка + укладка', 'Стрижка + укладка'], ['Фарбування', 'Окрашивание'], ['Складне фарбування', 'Сложное окрашивание'], ['Догляд', 'Уход']]],
    ['Нарощування волосся', 'i-extension', .35, [['Нарощування', 'Наращивание'], ['Корекція', 'Коррекция'], ['Зняття', 'Снятие']]],
    ['Косметологія', 'i-skin', .20, [['Чистка', 'Чистка'], ['Пілінг', 'Пилинг'], ['Догляд', 'Уход'], ['Ін’єкції', 'Инъекции']]],
    ['Масажист', 'i-massage', .04, [['Масаж спини', 'Массаж спины'], ['Загальний масаж', 'Общий массаж'], ['Антицелюлітний', 'Антицеллюлитный'], ['Лімфодренаж', 'Лимфодренаж']]],
    ['Лазерне видалення', 'i-laser', .03, [['Пахви', 'Подмышки'], ['Бікіні', 'Бикини'], ['Ноги', 'Ноги'], ['Комплекс', 'Комплекс']]],
    ['Депіляція', 'i-wax', .10, [['Пахви', 'Подмышки'], ['Бікіні', 'Бикини'], ['Ноги', 'Ноги'], ['Комплекс', 'Комплекс']]],
    ['Подологія', 'i-podo', .10, [['Медичний педикюр', 'Медицинский педикюр'], ['Врослий ніготь', 'Вросший ноготь'], ['Тріщини', 'Трещины'], ['Мозолі', 'Мозоли']]]
  ];
  var MAT_K = { low: .6, mid: 1, high: 1.6 };

  /* ---------- стан ---------- */
  var state = null;
  try { state = JSON.parse(store.get('bg_kasa') || 'null'); } catch (e) { state = null; }
  if (!state || typeof state !== 'object') state = {};
  if (!state.entries) state.entries = [];
  if (!state.svcs) state.svcs = [];
  if (!state.lang) state.lang = /^ru/i.test(navigator.language || '') ? 'ru' : 'uk';
  if (!state.cur) {
    var fromCalc = null;
    try { fromCalc = (JSON.parse(store.get('bg_calc') || '{}') || {}).cur; } catch (e) {}
    state.cur = fromCalc || '€';
  }
  if (!state.dir) {
    var fromMain = (store.get('bg_character') || '').split('|')[0];
    if (DIRS.some(function (d) { return d[0] === fromMain; })) state.dir = fromMain;
  }
  if (!state.mat) state.mat = 'mid';
  if (!state.taxMode) state.taxMode = 'none';

  var save = function () { store.set('bg_kasa', JSON.stringify(state)); };

  /* ---------- дрібниці ---------- */
  var t = function (k, v) {
    var s = (T[state.lang] || T.uk)[k];
    if (s == null) s = T.uk[k];
    if (s == null) return k;
    if (v && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, function (m, n) { return v[n] != null ? v[n] : m; });
    return s;
  };
  var num = function (v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.'));
    return isFinite(n) && n > 0 ? n : 0;
  };
  var money = function (n) {
    var r = Math.round(n);
    return r.toLocaleString(t('locale')) + ' ' + state.cur;
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var dirInfo = function (k) {
    for (var i = 0; i < DIRS.length; i++) if (DIRS[i][0] === k) return DIRS[i];
    return null;
  };
  var matPct = function () {
    var d = dirInfo(state.dir);
    return (d ? d[2] : .1) * (MAT_K[state.mat] || 1);
  };
  var taxPct = function () { return state.taxMode === 'pct' ? (num(state.taxPct) / 100) : 0; };
  var uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  /* ---------- розрахунок ---------- */
  /* Порядок такий: з кожної оплати відкладаються матеріали й податок-відсоток,
     з того, що лишилось, спершу збираються оренда й фіксовані платежі,
     а все зверху — твоє. Куплені матеріали йдуть з конверта; якщо купила
     більше, ніж відклали, різниця виходить з твоїх. */
  function calc(list) {
    var r = { n: 0, inc: 0, tips: 0, matRes: 0, matSpent: 0, other: 0 };
    list.forEach(function (e) {
      if (e.k === 'c') {
        if (e.a > 0) r.n++;
        r.inc += e.a || 0;
        r.tips += e.tip || 0;
        r.matRes += (e.a || 0) * (e.m != null ? e.m : matPct());
      } else if (e.k === 'e') {
        if (e.cat === 'mat') r.matSpent += e.a; else r.other += e.a;
      }
    });
    r.mat = Math.max(r.matRes, r.matSpent);
    r.tax = (r.inc + r.tips) * taxPct();
    r.rent = num(state.rent);
    r.taxFix = state.taxMode === 'fix' ? num(state.taxFix) : 0;
    r.avail = r.inc + r.tips - r.mat - r.tax - r.other;
    var pool = Math.max(0, r.avail);
    r.rentGot = Math.min(r.rent, pool);
    r.taxFixGot = Math.min(r.taxFix, pool - r.rentGot);
    r.yours = r.avail - r.rent - r.taxFix;
    return r;
  }

  var ym = function (d) { return d.getFullYear() * 12 + d.getMonth(); };
  var inMonth = function (key) {
    return state.entries.filter(function (e) { return ym(new Date(e.t)) === key; });
  };

  /* ---------- мова ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.title = t('title');
    $$('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    $$('[data-ta]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-ta'))); });
    $$('.kasa-lang [data-lang]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-lang') === state.lang); });
    $$('[data-cur]').forEach(function (el) { el.textContent = state.cur; });
    renderDirs();
    if (!$('#kOnb').hidden) { obShow(obStep); }
    if (!$('#kApp').hidden) render();
  }
  $$('.kasa-lang [data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.lang = b.getAttribute('data-lang');
      save();
      applyLang();
    });
  });

  /* ============================================================
     ЗНАЙОМСТВО
     ============================================================ */
  var obStep = 1;

  function renderDirs() {
    $('#kDirs').innerHTML = DIRS.map(function (d) {
      return '<button class="chr' + (state.dir === d[0] ? ' on' : '') + '" type="button" data-dir="' + esc(d[0]) + '">' +
        '<span class="chr-ph"><svg class="icon" aria-hidden="true"><use href="#' + d[1] + '"/></svg></span>' +
        '<span class="chr-nm">' + esc(t('dir.' + d[0])) + '</span></button>';
    }).join('');
  }
  $('#kDirs').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-dir]');
    if (!b) return;
    state.dir = b.getAttribute('data-dir');
    $$('#kDirs .chr').forEach(function (x) { x.classList.toggle('on', x === b); });
    obErr('');
    save();
  });
  $('#kCur').addEventListener('change', function () {
    state.cur = this.value;
    $$('[data-cur]').forEach(function (el) { el.textContent = state.cur; });
    save();
  });

  /* послуги */
  var draft = [];
  function renderSvcs() {
    var d = dirInfo(state.dir);
    var li = state.lang === 'ru' ? 1 : 0;
    var names = draft.map(function (s) { return s.n.trim().toLowerCase(); });
    $('#kSug').innerHTML = (d ? d[3] : []).map(function (s) {
      var n = s[li];
      var on = names.indexOf(n.toLowerCase()) >= 0;
      return '<button type="button" class="expo' + (on ? ' on' : '') + '" data-sug="' + esc(n) + '">' + (on ? '✓ ' : '+ ') + esc(n) + '</button>';
    }).join('');
    $('#kSvcs').innerHTML = draft.map(function (s, i) {
      return '<div class="kasa-svc" data-i="' + i + '">' +
        '<input type="text" maxlength="40" data-f="n" value="' + esc(s.n) + '" placeholder="' + esc(t('ob.svcName')) + '" aria-label="' + esc(t('ob.svcName')) + '">' +
        '<input type="text" inputmode="decimal" data-f="p" value="' + esc(s.p || '') + '" placeholder="' + esc(t('ob.svcPrice')) + ', ' + esc(state.cur) + '" aria-label="' + esc(t('ob.svcPrice')) + '">' +
        '<button type="button" class="kasa-x" data-del aria-label="×">×</button></div>';
    }).join('');
  }
  $('#kSug').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-sug]');
    if (!b) return;
    var n = b.getAttribute('data-sug');
    var at = -1;
    draft.forEach(function (s, i) { if (s.n.trim().toLowerCase() === n.toLowerCase()) at = i; });
    if (at >= 0) draft.splice(at, 1); else draft.push({ n: n, p: '' });
    renderSvcs();
    if (at < 0) {
      var last = $$('#kSvcs [data-f="p"]').pop();
      if (last) last.focus();
    }
  });
  $('#kSvcs').addEventListener('input', function (ev) {
    var row = ev.target.closest('[data-i]');
    if (!row) return;
    var s = draft[+row.getAttribute('data-i')];
    s[ev.target.getAttribute('data-f')] = ev.target.value;
    ev.target.classList.remove('bad');
  });
  $('#kSvcs').addEventListener('change', function (ev) {
    if (ev.target.getAttribute('data-f') === 'n') renderSvcs();
  });
  $('#kSvcs').addEventListener('click', function (ev) {
    if (!ev.target.closest('[data-del]')) return;
    draft.splice(+ev.target.closest('[data-i]').getAttribute('data-i'), 1);
    renderSvcs();
  });
  $('#kAddSvc').addEventListener('click', function () {
    draft.push({ n: '', p: '' });
    renderSvcs();
    var last = $$('#kSvcs [data-f="n"]').pop();
    if (last) last.focus();
  });

  /* пігулки з одним вибором */
  function pick(box, val) {
    $$('.expo', box).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === String(val)); });
  }
  function pills(sel, fn) {
    $(sel).addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-v]');
      if (!b) return;
      pick(this, b.getAttribute('data-v'));
      fn(b.getAttribute('data-v'));
      obErr('');
      save();
    });
  }
  var rentOn = false;
  pills('#kRentMode', function (v) {
    rentOn = v === '1';
    $('#kRentBox').hidden = !rentOn;
    if (rentOn) $('#kRent').focus(); else state.rent = 0;
  });
  pills('#kMat', function (v) { state.mat = v; matHint(); });
  pills('#kTaxMode', function (v) { state.taxMode = v; taxBoxes(); });
  pills('#kTaxPcts', function (v) { state.taxPct = v; });
  $('#kRent').addEventListener('input', function () { state.rent = this.value; save(); });
  $('#kTaxFix').addEventListener('input', function () { state.taxFix = this.value; save(); });
  $('#kGoal').addEventListener('input', function () { state.goal = this.value; save(); });

  function matHint() {
    $('#kMatHint').textContent = t('ob.matHint', { p: Math.round(matPct() * 100) });
  }
  function taxBoxes() {
    $('#kTaxPcts').hidden = state.taxMode !== 'pct';
    $('#kTaxFixBox').hidden = state.taxMode !== 'fix';
  }

  function obErr(msg) {
    $('#kObErr').textContent = msg;
    $('#kObErr').hidden = !msg;
  }

  function obShow(n) {
    obStep = n;
    $$('.kasa-ob').forEach(function (s) { s.hidden = +s.getAttribute('data-ob') !== n; });
    $$('#kDots i').forEach(function (d, i) { d.classList.toggle('on', i < n); });
    $('#kObBack').style.visibility = n > 1 ? '' : 'hidden';
    $('#kObNext').textContent = t(n === 4 ? 'ob.finish' : 'ob.next');
    if (n === 2) renderSvcs();
    if (n === 3) {
      pick($('#kRentMode'), num(state.rent) > 0 || rentOn ? '1' : '0');
      $('#kRentBox').hidden = !(num(state.rent) > 0 || rentOn);
      $('#kRent').value = state.rent ? state.rent : '';
      pick($('#kMat'), state.mat);
      matHint();
    }
    if (n === 4) {
      pick($('#kTaxMode'), state.taxMode);
      pick($('#kTaxPcts'), state.taxPct || '');
      $('#kTaxFix').value = state.taxFix || '';
      $('#kGoal').value = state.goal || '';
      taxBoxes();
    }
  }

  function obValid(n) {
    if (n === 1 && !state.dir) return t('err.dir');
    if (n === 2) {
      var ok = false, bad = false;
      $$('#kSvcs .kasa-svc').forEach(function (row) {
        var s = draft[+row.getAttribute('data-i')];
        if (!s.n.trim() && !num(s.p)) return;
        if (!s.n.trim()) { $('[data-f="n"]', row).classList.add('bad'); bad = true; return; }
        if (!num(s.p)) { $('[data-f="p"]', row).classList.add('bad'); bad = true; return; }
        ok = true;
      });
      if (bad) return t('err.price');
      if (!ok) return t('err.svc');
    }
    if (n === 3 && rentOn && !num(state.rent)) return t('err.rent');
    if (n === 4) {
      if (state.taxMode === 'pct' && !num(state.taxPct)) return t('err.taxPct');
      if (state.taxMode === 'fix' && !num(state.taxFix)) return t('err.taxFix');
    }
    return '';
  }

  $('#kObNext').addEventListener('click', function () {
    var err = obValid(obStep);
    obErr(err);
    if (err) return;
    if (obStep === 2) {
      state.svcs = draft.filter(function (s) { return s.n.trim() && num(s.p); })
        .map(function (s) { return { n: s.n.trim(), p: num(s.p) }; });
      save();
    }
    if (obStep < 4) { obShow(obStep + 1); window.scrollTo(0, 0); return; }
    if (!rentOn) state.rent = 0;
    state.done = true;
    save();
    openApp();
  });
  $('#kObBack').addEventListener('click', function () {
    obErr('');
    if (obStep > 1) obShow(obStep - 1);
  });

  function openOnb() {
    draft = state.svcs.map(function (s) { return { n: s.n, p: String(s.p) }; });
    rentOn = num(state.rent) > 0;
    $('#kCur').value = state.cur;
    $('#kOnb').hidden = false;
    $('#kApp').hidden = true;
    $('#kSettingsBtn').hidden = true;
    obErr('');
    obShow(1);
  }

  /* ============================================================
     КАСА
     ============================================================ */
  var view = ym(new Date());

  function openApp() {
    $('#kOnb').hidden = true;
    $('#kApp').hidden = false;
    $('#kSettingsBtn').hidden = false;
    view = ym(new Date());
    render();
    window.scrollTo(0, 0);
  }

  function tile(name, value, sub, part) {
    return '<div class="kasa-tile"><span>' + esc(name) + '</span><b>' + money(value) + '</b>' +
      (part != null ? '<div class="kasa-tile-bar"><i style="width:' + Math.round(Math.min(1, part) * 100) + '%"></i></div>' : '') +
      (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  }

  function render() {
    var now = ym(new Date());
    var list = inMonth(view);
    var r = calc(list);
    var y = Math.floor(view / 12), m = view % 12;

    $('#kMonth').textContent = t('months')[m] + ' ' + y;
    $('#kNext').disabled = view >= now;
    var first = state.entries.reduce(function (a, e) { return Math.min(a, ym(new Date(e.t))); }, now);
    $('#kPrev').disabled = view <= first;

    /* головна цифра */
    $('.kasa-hero-l').textContent = t(view === now ? 'app.yours' : 'app.yoursPast');
    $('#kYours').textContent = money(Math.max(0, r.yours));
    var sub = '';
    if (!r.n && !r.tips) sub = t('app.first');
    else if (r.yours < 0) sub = t('app.short', { x: money(-r.yours) });
    else sub = t('app.ok');
    $('#kYoursSub').textContent = sub;

    var goal = num(state.goal);
    $('#kGoalBox').hidden = !goal;
    if (goal) {
      var got = Math.max(0, r.yours);
      $('#kGoalBar').style.width = Math.min(100, got / goal * 100) + '%';
      $('#kGoalT').textContent = got >= goal ? t('app.goalDone', { g: money(goal) }) : t('app.goalT', { g: money(goal), x: money(goal - got) });
    }

    /* конверти */
    var env = [];
    if (r.matRes || r.matSpent) {
      env.push(tile(t('env.mat'), r.mat, r.matSpent > r.matRes ? t('env.matOver') : t('env.matS', { x: money(r.matSpent) })));
    }
    if (state.taxMode === 'pct') env.push(tile(t('env.tax'), r.tax, t('env.taxPctS', { p: num(state.taxPct) })));
    if (state.taxMode === 'fix') env.push(tile(t('env.tax'), r.taxFixGot, t('env.taxFixS', { x: money(r.taxFix) }), r.taxFix ? r.taxFixGot / r.taxFix : 0));
    if (r.rent) env.push(tile(t('env.rent'), r.rentGot, t('env.rentS', { x: money(r.rent) }), r.rentGot / r.rent));
    if (r.other) env.push(tile(t('env.other'), r.other, t('env.otherS')));
    $('#kEnv').innerHTML = env.length ? env.join('') : '<p class="kasa-hint">' + esc(t('env.none')) + '</p>';

    $('#kTotal').innerHTML = (r.n || r.tips) ? t('app.total', { x: esc(money(r.inc + r.tips)), n: r.n }) + (r.tips ? t('app.tips', { x: esc(money(r.tips)) }) : '') : '';

    renderFeed(list);
  }

  function dayLabel(d) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var x = new Date(d); x.setHours(0, 0, 0, 0);
    var diff = Math.round((today - x) / 864e5);
    if (diff === 0) return t('day.today');
    if (diff === 1) return t('day.yday');
    return x.getDate() + ' ' + t('monthsGen')[x.getMonth()];
  }

  function renderFeed(list) {
    if (!list.length) { $('#kFeed').innerHTML = '<p class="kasa-empty">' + esc(t('app.empty')) + '</p>'; return; }
    var sorted = list.slice().sort(function (a, b) { return b.t - a.t; });
    var days = [], cur = null;
    sorted.forEach(function (e) {
      var key = new Date(e.t).toDateString();
      if (!cur || cur.key !== key) { cur = { key: key, t: e.t, items: [], sum: 0 }; days.push(cur); }
      cur.items.push(e);
      if (e.k === 'c') cur.sum += (e.a || 0) + (e.tip || 0);
    });
    $('#kFeed').innerHTML = days.map(function (d) {
      return '<div class="kasa-day"><h3><span>' + esc(dayLabel(d.t)) + '</span>' + (d.sum ? '<span>' + money(d.sum) + '</span>' : '') + '</h3>' +
        d.items.map(function (e) {
          var name, amt, cls = '';
          if (e.k === 'c') {
            name = esc(e.s) + (e.tip && e.a ? '<small>+' + money(e.tip) + '</small>' : '');
            amt = '+' + money((e.a || 0) + (e.a ? 0 : e.tip || 0));
          } else {
            name = esc(t('ex.' + e.cat));
            amt = '−' + money(e.a);
            cls = ' neg';
          }
          return '<div class="kasa-row"><span class="kasa-row-n">' + name + '</span><span class="kasa-row-a' + cls + '">' + amt + '</span>' +
            '<button type="button" class="kasa-x" data-rm="' + e.id + '" aria-label="×">×</button></div>';
        }).join('') + '</div>';
    }).join('');
  }

  $('#kFeed').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rm]');
    if (!b) return;
    var id = b.getAttribute('data-rm');
    var at = -1;
    state.entries.forEach(function (e, i) { if (e.id === id) at = i; });
    if (at < 0) return;
    var gone = state.entries.splice(at, 1)[0];
    save();
    render();
    toast(t('toast.del'), function () { state.entries.push(gone); });
  });

  $('#kPrev').addEventListener('click', function () { view--; render(); });
  $('#kNext').addEventListener('click', function () { view++; render(); });

  /* ---------- запис ---------- */
  function add(e) {
    e.id = uid();
    e.t = Date.now();
    state.entries.push(e);
    save();
    view = ym(new Date());
    render();
    return e;
  }
  function addClient(name, a, tip) {
    var e = add({ k: 'c', s: name, a: a, tip: tip || 0, m: matPct() });
    var r = calc(inMonth(view));
    var x = money(a + (tip || 0));
    toast(r.yours < 0 ? t('toast.short', { x: x, y: money(-r.yours) }) : t('toast.added', { x: x, y: money(r.yours) }),
      function () { removeId(e.id); });
  }
  function removeId(id) {
    state.entries = state.entries.filter(function (e) { return e.id !== id; });
  }

  /* шторки */
  function sheet(id) {
    var d = $(id);
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    return d;
  }
  function closeSheet(d) {
    if (d.close) d.close(); else d.removeAttribute('open');
  }
  $$('.kasa-sheet').forEach(function (d) {
    d.addEventListener('click', function (ev) {
      if (ev.target === d || ev.target.closest('[data-close]')) closeSheet(d);
    });
  });

  $('#kAddClient').addEventListener('click', function () {
    $('#kSvcGrid').innerHTML = state.svcs.map(function (s, i) {
      return '<button type="button" class="kasa-svc-btn" data-svc="' + i + '"><span>' + esc(s.n) + '</span><b>' + money(s.p) + '</b></button>';
    }).join('');
    $('#kClSum').value = '';
    $('#kClTip').value = '';
    $('.kasa-more', $('#dClient')).open = false;
    sheet('#dClient');
  });
  $('#kSvcGrid').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-svc]');
    if (!b) return;
    var s = state.svcs[+b.getAttribute('data-svc')];
    closeSheet($('#dClient'));
    addClient(s.n, s.p, 0);
  });
  $('#kClSave').addEventListener('click', function () {
    var a = num($('#kClSum').value), tip = num($('#kClTip').value);
    if (!a && !tip) { $('#kClSum').focus(); return; }
    closeSheet($('#dClient'));
    addClient(a ? t('cl.custom') : t('cl.tipOnly'), a, tip);
  });

  var expCat = 'mat';
  function expHint() { $('#kExpHint').textContent = t(expCat === 'mat' ? 'ex.matHint' : 'ex.otherHint'); }
  $('#kExpCat').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-v]');
    if (!b) return;
    expCat = b.getAttribute('data-v');
    pick(this, expCat);
    expHint();
  });
  $('#kAddExp').addEventListener('click', function () {
    expCat = 'mat';
    pick($('#kExpCat'), expCat);
    expHint();
    $('#kExpSum').value = '';
    sheet('#dExp');
    $('#kExpSum').focus();
  });
  $('#kExpSave').addEventListener('click', function () {
    var a = num($('#kExpSum').value);
    if (!a) { $('#kExpSum').focus(); return; }
    closeSheet($('#dExp'));
    var e = add({ k: 'e', cat: expCat, a: a });
    toast(t('toast.exp', { x: money(a) }), function () { removeId(e.id); });
  });

  /* ---------- підсумок для сторіс ---------- */
  var period = 'week';
  function renderCard() {
    $$('.kasa-period [data-per]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-per') === period); });
    var now = new Date();
    var from, label, list;
    if (period === 'week') {
      from = new Date(now); from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
      list = state.entries.filter(function (e) { return e.t >= from.getTime(); });
      var to = new Date(from); to.setDate(to.getDate() + 6);
      label = t('st.myWeek') + ' · ' + from.getDate() + (from.getMonth() !== to.getMonth() ? ' ' + t('monthsGen')[from.getMonth()] : '') +
        '–' + to.getDate() + ' ' + t('monthsGen')[to.getMonth()];
    } else {
      list = inMonth(ym(now));
      label = t('st.myMonth') + ' · ' + t('months')[now.getMonth()];
    }
    /* За тиждень показуємо, скільки прийшло: оренда платиться раз на місяць,
       і «чистими за тиждень» вийшло б більше, ніж за весь місяць. */
    var r = calc(list);
    var net = period === 'month' && r.yours > 0;
    var big = net ? r.yours : r.inc + r.tips;
    $('#kCard').innerHTML =
      '<img class="kasa-card-logo" src="assets/logo-horizontal.svg" alt="Beauty Games">' +
      '<span class="kasa-card-per">' + esc(label) + '</span>' +
      '<b class="kasa-card-n">' + money(big) + '</b>' +
      '<span class="kasa-card-s">' + esc(t(net ? 'st.yours' : 'st.came')) + '</span>' +
      '<div class="kasa-card-row"><div><b>' + r.n + '</b><span>' + esc(t('st.clients')) + '</span></div>' +
      '<div><b>' + (r.n ? money(r.inc / r.n) : '—') + '</b><span>' + esc(t('st.avg')) + '</span></div></div>' +
      '<span class="kasa-card-tag">' + esc(t('st.tag')) + '</span>';
  }
  $('#kStory').addEventListener('click', function () { renderCard(); sheet('#dStory'); });
  $$('.kasa-period [data-per]').forEach(function (b) {
    b.addEventListener('click', function () { period = b.getAttribute('data-per'); renderCard(); });
  });

  /* ---------- налаштування ---------- */
  $('#kSettingsBtn').addEventListener('click', function () { sheet('#dSet'); });
  $('#kRedo').addEventListener('click', function () { closeSheet($('#dSet')); openOnb(); window.scrollTo(0, 0); });
  $('#kBackup').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify({ app: 'bg_kasa', v: 1, data: state }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kasa-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  $('#kRestore').addEventListener('change', function () {
    var f = this.files && this.files[0];
    var input = this;
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var d = null;
      try { d = JSON.parse(rd.result); } catch (e) {}
      input.value = '';
      if (!d || d.app !== 'bg_kasa' || !d.data || !Array.isArray(d.data.entries)) { alert(t('set.badFile')); return; }
      state = d.data;
      save();
      closeSheet($('#dSet'));
      applyLang();
      if (state.done) openApp(); else openOnb();
      toast(t('set.restored'));
    };
    rd.readAsText(f);
  });
  $('#kReset').addEventListener('click', function () {
    if (!confirm(t('set.resetQ'))) return;
    var lang = state.lang;
    store.del('bg_kasa');
    state = { entries: [], svcs: [], lang: lang, cur: state.cur, mat: 'mid', taxMode: 'none' };
    closeSheet($('#dSet'));
    openOnb();
  });

  /* ---------- тост ---------- */
  var toastTimer = null, undoFn = null;
  function toast(msg, undo) {
    $('#kToastT').textContent = msg;
    undoFn = undo || null;
    $('#kUndo').hidden = !undo;
    $('#kToast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('#kToast').hidden = true; undoFn = null; }, 5000);
  }
  $('#kUndo').addEventListener('click', function () {
    if (undoFn) { undoFn(); save(); render(); }
    undoFn = null;
    $('#kToast').hidden = true;
  });

  /* ---------- старт ---------- */
  applyLang();
  if (state.done && state.svcs.length) openApp(); else openOnb();

  /* Офлайн і «на головний екран». Тільки там, де браузер дозволяє. */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('kasa-sw.js', { scope: './kasa' }).catch(function () {});
  }
})();
