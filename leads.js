/* Куди йдуть заявки з усіх форм сайту: головна, кастинг, калькулятор.

   Два канали, працює той, що заповнений (або обидва):
   - BG_LEADS_EMAIL — заявка приходить листом через сервіс FormSubmit.
     Перша заявка надсилає на пошту лист «Activate form» — одне натискання,
     і далі всі заявки падають у пошту таблицею.
   - BG_LEADS_URL — веб-застосунок Google Apps Script: Google Таблиця +
     Telegram-чат менеджерів (код у папці «Заявки_Telegram»). */
window.BG_LEADS_EMAIL = 'beautygames.pro@gmail.com';
// Сповіщення в робочий чат менеджерів: @email2telegrambot пересилає лист
// у групу. Шлемо коротко — звідки заявка і як зв'язатися; решта в пошті.
// Група «BG заявки сайт» (стара «Заявки Beauty Games» стала супергрупою 20.09 і більше не отримує)
window.BG_LEADS_PING = 'group-5508883621@e2t.link';
// Окрема Telegram-група «BG заявки Black Friday» — тільки заявки з /black-friday
window.BG_LEADS_PING_BF = 'group-1004494100276@e2t.link';
// Окрема Telegram-група «BG заявки Калькулятор» — контакти з /calculator і /earn
window.BG_LEADS_PING_CALC = 'group-5308257531@e2t.link';
// Тест «Точка зростання» (поп-ап на головній + карта гравця на /avatar): своя група й таблиця.
// Поки порожньо — заявки тесту йдуть як звичайні заявки сайту.
window.BG_LEADS_PING_TEST = 'group-5213334208@e2t.link';
window.BG_LEADS_URL_TEST = 'https://script.google.com/macros/s/AKfycbwIwc-EdrhpWgQMW9FneKu723L3MZpCfPNa1fVlUcIxg12l2JmltsJbqoo1UFK0T4FXhQ/exec';
window.BG_LEADS_URL = 'https://script.google.com/macros/s/AKfycby6AqSiF9ECT73he1AXcqWCfHNw8jiS9DPEqyEj-2niqJ9w0dRe_qR8DXjANs9Y-y4_/exec';
// Які форми йдуть у таблицю й бота з BG_LEADS_URL. Решта — як раніше: пошта + сповіщення.
window.BG_LEADS_URL_FORMS = ['earn'];
// Окрема таблиця для Black Friday (код: Заявки_Telegram/Black_Friday_таблица.gs). Порожньо — BF іде в BG_LEADS_URL.
window.BG_LEADS_URL_BF = 'https://script.google.com/macros/s/AKfycbwF5A4k7hhgBgt4eiMTWJ8e5ayoWMeQmvgz9jeT8xzCq8wv3hfjSB6oQydCDL6eqaLL/exec';

(function () {
  var SUBJECT = {
    participant: 'Beauty Games: нова заявка — бронювання місця',
    casting: 'Beauty Games: нова заявка на кастинг',
    calc: 'Beauty Games: контакт із калькулятора',
    ambassador: 'Beauty Games: відповідь на запрошення амбасадора',
    profile: 'Beauty Games: контакт із гайду «Дорога упаковка профілю»',
    earn: 'Beauty Games: контакт із калькулятора «Скільки заробляєте»',
    blackfriday: 'Beauty Games: BLACK FRIDAY — нова заявка (за запрошенням)',
    test: 'Beauty Games: тест «Точка зростання»',
    webinar: 'Beauty Games: реєстрація на вебінар'
  };

  // Назви полів у листі — людською мовою, в тому ж порядку
  var LABELS = [
    ['name', "Ім'я"], ['phone', 'Телефон'], ['instagram', 'Instagram'], ['contact', 'Контакт'],
    ['messenger', 'Месенджер'], ['place', 'Країна, місто'], ['package', 'Пакет'],
    ['direction', 'Напрямок'], ['skills', 'Скіли'], ['experience', 'Років у beauty'],
    ['place_type', 'Де приймає'], ['check', 'Середній чек'], ['pains', 'Що заважає рости'],
    ['tried', 'Що пробувала'], ['situation', 'Ситуація (тест)'], ['goal', 'Місія / ціль'],
    ['format', 'Формат участі'], ['why', 'Чому саме вона'], ['camera', 'Зйомки'], ['video', 'Відео'],
    ['service', 'Послуга'], ['currency', 'Валюта'], ['price', 'Ціна'], ['duration_h', 'Тривалість, год'],
    ['per_month', 'Процедур на місяць'], ['per_week', 'Клієнток на тиждень'], ['mode', 'Версія калькулятора'], ['weeks_year', 'Робочих тижнів на рік'], ['goal_income', 'Бажаний дохід на місяць'], ['tg_user', 'Telegram'], ['tg_id', 'Telegram ID'], ['source', 'Джерело'], ['start', 'Мітка з бота'], ['materials', 'Матеріали'], ['fixed_month', 'Витрати на місяць'],
    ['tax_mode', 'Податок'], ['tax_pct', 'Податок, %'], ['tax_fixed_month', 'Податок фікс.'],
    ['net_month', 'Чистими на місяць'], ['per_hour', 'Чистими за годину'], ['goal_price', 'Ціна під ціль'],
    ['verdict', 'Висновок калькулятора'], ['level', 'Досвід'], ['score', 'Самоперевірка профілю'], ['missing', 'Чого бракує в профілі'], ['bio', 'Шапка з генератора'], ['answer', 'Відповідь'], ['invite_to', 'Кому запрошення'], ['invited_by', 'Хто запросив'], ['time', 'Коли дзвонити'], ['note', 'Питання'], ['lang', 'Мова сайту'], ['page', 'Сторінка'],
    ['utm', 'UTM'], ['referrer', 'Звідки прийшла']
  ];
  var SKIP = { 'form-name': 1, 'bot-field': 1, bot: 1, consent: 1, form: 1, sent_at: 1, tg_init: 1 };

  function toEmail(p) {
    var out = { _subject: SUBJECT[p.form] || SUBJECT.participant, _template: 'table', _captcha: 'false' };
    var used = {};
    LABELS.forEach(function (l) {
      used[l[0]] = 1;
      var v = p[l[0]];
      if (v != null && String(v).trim() !== '') out[l[1]] = String(v);
    });
    Object.keys(p).forEach(function (k) {
      if (!used[k] && !SKIP[k] && String(p[k]).trim() !== '') out[k] = String(p[k]);
    });
    return out;
  }

  function viaEmail(p) {
    return fetch('https://formsubmit.co/ajax/' + window.BG_LEADS_EMAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(toEmail(p))
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || String(j.success) !== 'true') throw new Error((j && j.message) || 'email not sent');
        return j;
      });
  }

  function viaPing(p, to) {
    var t = { participant: 'бронювання місця', casting: 'кастинг', calc: 'калькулятор', ambassador: 'амбасадор', blackfriday: 'BLACK FRIDAY (за запрошенням)', test: 'тест «Точка зростання»', webinar: 'вебінар', profile: 'гайд «Упаковка профілю»', earn: 'калькулятор «Скільки заробляєте»' }[p.form] || p.form;
    return fetch('https://formsubmit.co/ajax/' + (to || window.BG_LEADS_PING), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(clean({
        _subject: p.form === 'blackfriday' ? '🖤 BLACK FRIDAY — нова заявка' : (p.form === 'calc' || p.form === 'earn') ? '🧮 Калькулятор — новий контакт' : p.form === 'webinar' ? '🎥 Вебінар — реєстрація' : p.form === 'test' ? (p.page === 'avatar-start' ? '🎮 Тест — новий контакт' : '🎮 Тест — карта гравця') : 'Beauty Games: нова заявка — ' + t,
        _template: 'basic',   // у Telegram «basic» показує назви полів, «table» їх губить
        _captcha: 'false',
        Заявка: t,
        "Ім'я": p.name || '',
        Телефон: p.phone || '',
        Instagram: p.instagram || '',
        Контакт: p.contact || '',
        Напрямок: p.skills || p.direction || '',
        Пакет: p.package || '',
        Месенджер: p.messenger || '',
        'Хто запросив': p.invited_by || '',
        Відповідь: p.answer || '',
        'Років у beauty': p.experience || '',
        'Ситуація за тестом': p.situation || '',
        'Що заважає рости': p.pains || '',
        'Місія на рік': p.goal || '',
        'Формат участі': p.format || '',
        Telegram: p.tg_user || '',
        Послуга: p.service || '',
        'Чистими на місяць': p.net_month || '',
        'Бажаний дохід': p.goal_income || '',
        Деталі: 'уся заявка — на пошті beautygames.pro@gmail.com'
      }))
    }).catch(function () {});
  }

  // порожні поля не показуємо
  function clean(o) {
    var r = {};
    Object.keys(o).forEach(function (k) { if (String(o[k]).trim() !== '') r[k] = o[k]; });
    return r;
  }

  function viaScript(p, url) {
    // text/plain — простий запит без CORS-перевірки, Apps Script його приймає
    return fetch(url || window.BG_LEADS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(p),
      keepalive: true // доходить, навіть якщо сторінку вже закривають
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error((j && j.error) || 'lead not saved');
        return j;
      });
  }

  window.bgLeadsOn = function () {
    return !!(window.fetch && (window.BG_LEADS_EMAIL || window.BG_LEADS_URL));
  };

  // Успіх, якщо заявку прийняв хоча б один канал
  window.bgSendLead = function (form, data) {
    if (!window.bgLeadsOn()) return Promise.reject(new Error('no lead channel'));
    if ((data || {})['bot-field'] || (data || {}).bot) return Promise.resolve({ ok: true });

    var p = {
      form: form,
      lang: document.documentElement.lang || '',
      page: location.pathname,
      utm: location.search || '',
      referrer: document.referrer || '',
      sent_at: new Date().toISOString()
    };
    Object.keys(data || {}).forEach(function (k) { p[k] = data[k]; });

    // Meta-піксель (pixel.js): заявка з будь-якої форми = подія Lead
    if (window.fbq) window.fbq('track', 'Lead', { content_name: form });

    var jobs = [];
    // Black Friday (/black-friday) — у ту саму Google Таблицю й Telegram-бот, що й калькулятор (вкладка «Black Friday»)
    var isBF = form === 'participant' && /Black Friday/.test(p.source || '');
    if (isBF) p.form = 'blackfriday';   // окрема вкладка «Black Friday» і окреме повідомлення в Telegram
    // Тест: старт із поп-апа, сторінка /avatar або заявка з уже заповненою картою гравця
    var isTest = !isBF && form === 'participant' && (p.page === 'avatar-start' || /avatar/.test(location.pathname) || !!(p.situation || p.goal || p.pains));
    if (isTest) p.form = 'test';
    if (window.BG_LEADS_EMAIL) jobs.push(viaEmail(p));
    // запасне сповіщення через @email2telegrambot (ліміт 30/міс) — лише поки немає свого бота через BG_LEADS_URL
    var bfUrl = isBF && window.BG_LEADS_URL_BF;
    var toScript = window.BG_LEADS_URL && !bfUrl && ((window.BG_LEADS_URL_FORMS || []).indexOf(form) >= 0 || isBF);
    var isCalc = form === 'calc' || form === 'earn';
    var testPing = isTest && window.BG_LEADS_PING_TEST;
    if (window.BG_LEADS_PING && !toScript && !isCalc && !testPing) viaPing(p);
    if (testPing) viaPing(p, window.BG_LEADS_PING_TEST);
    if (isTest && window.BG_LEADS_URL_TEST) jobs.push(viaScript(p, window.BG_LEADS_URL_TEST));
    if (isCalc && window.BG_LEADS_PING_CALC) viaPing(p, window.BG_LEADS_PING_CALC);
    if (isBF && window.BG_LEADS_PING_BF) viaPing(p, window.BG_LEADS_PING_BF);
    if (toScript) jobs.push(viaScript(p));
    if (bfUrl) jobs.push(viaScript(p, bfUrl));

    return new Promise(function (resolve, reject) {
      var left = jobs.length, lastErr;
      jobs.forEach(function (j) {
        j.then(resolve, function (e) {
          lastErr = e;
          if (--left === 0) reject(lastErr);
        });
      });
    });
  };
})();
