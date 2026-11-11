/* «Скільки ви заробляєте насправді» — калькулятор б'юті-майстра у двох версіях.
   Проста — 4 цифри: ціна, матеріали, клієнток на тиждень, витрати на місяць.
     Чистими = (ціна − матеріали) × клієнток × 4,3 тижня − витрати.
   Розширена — ще 4: тривалість процедури, податок %, робочих тижнів на рік, бажаний дохід.
     Процедур на місяць = клієнток × тижнів / 12; податок = % від обігу;
     чистими за годину = чистими / (процедур × тривалість);
     ціна під ціль = (ціль + витрати + матеріали × процедур) / (процедур × (1 − податок)).
   Поля відкриті, а результат розмитий, доки майстриня не залишить контакт
   (заявка — через leads.js, Lead у пікселі). Цифри й позначка «відкрито» — в localStorage. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var KEY = 'bg_earn_v1';
  var WEEKS = 4.3;

  // Приклади за замовчуванням під кожну валюту — поки майстриня не ввела свої
  var DEF = {
    'грн': { price: 800, mat: 150, clients: 15, rent: 6000, goal: 50000 },
    '€': { price: 40, mat: 8, clients: 15, rent: 400, goal: 2500 },
    'zł': { price: 150, mat: 30, clients: 15, rent: 1500, goal: 9000 },
    '$': { price: 45, mat: 9, clients: 15, rent: 450, goal: 2700 }
  };
  var PRO = { dur: 2, tax: 5, weeks: 48 }; // однакові для всіх валют

  var state = { cur: 'грн', v: null, edited: false, up: 10, open: false, mode: 'simple' };
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && DEF[s.cur] && s.v) state = s;
  } catch (e) {}
  if (!state.v) state.v = Object.assign({}, DEF[state.cur]);
  // нові поля розширеної версії для тих, хто вже рахував раніше
  Object.keys(PRO).forEach(function (k) { if (state.v[k] == null) state.v[k] = PRO[k]; });
  if (state.v.goal == null) state.v.goal = DEF[state.cur].goal;
  if (!state.mode) state.mode = 'simple';
  if (/[?&#]pro\b/.test(location.search + location.hash)) state.mode = 'pro'; // посилання одразу на розширену
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function num(x) { var n = parseFloat(String(x).replace(/\s/g, '').replace(',', '.')); return isFinite(n) && n > 0 ? n : 0; }
  function fmt(n) { return Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' '); }
  function show(inp, n) { return !n ? '' : inp.hasAttribute('data-dec') ? String(n).replace('.', ',') : fmt(n); }
  function money(n) {
    if (!state.open) return '•• ••• ' + state.cur; // до заявки справжніх цифр на сторінці немає
    return (n < 0 ? '−' : '') + fmt(Math.abs(n)) + ' ' + state.cur;
  }

  var inputs = [].slice.call(document.querySelectorAll('[data-k]'));

  function fill() {
    inputs.forEach(function (inp) { inp.value = show(inp, state.v[inp.dataset.k]); });
    [].forEach.call(document.querySelectorAll('#enMode [data-mode]'), function (b) {
      var on = b.dataset.mode === state.mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', on);
    });
    $('#enPro').hidden = state.mode !== 'pro';
    [].forEach.call(document.querySelectorAll('[data-u]'), function (u) { u.textContent = state.cur; });
    [].forEach.call(document.querySelectorAll('#enCur .expo'), function (b) { b.classList.toggle('on', b.dataset.cur === state.cur); });
    [].forEach.call(document.querySelectorAll('#enUpOpts .expo'), function (b) { b.classList.toggle('on', +b.dataset.up === state.up); });
  }

  function calc() {
    var v = state.v;
    var pro = state.mode === 'pro';
    var price = num(v.price), mat = num(v.mat), clients = num(v.clients), rent = num(v.rent);
    var weeks = pro ? Math.min(num(v.weeks) || 52, 52) : 0;
    var taxP = pro ? Math.min(num(v.tax), 90) / 100 : 0;
    var perMonth = clients * (pro ? weeks / 12 : WEEKS);
    var gross = price * perMonth;
    var tax = gross * taxP;
    var cost = mat * perMonth + rent + tax;
    var net = gross - cost;
    var per = perMonth ? net / perMonth : 0;

    $('#enNet').textContent = gross ? money(net) : '—';
    $('#enNet').classList.toggle('neg', state.open && net < 0);
    $('#enGross').textContent = gross ? money(gross) : '—';
    $('#enCost').textContent = gross ? money(cost) : '—';
    $('#enPer').textContent = gross ? money(per) : '—';

    // розширена версія: година роботи, податок, ціна під ціль
    var hours = perMonth * num(v.dur), perHour = hours ? net / hours : 0;
    var goal = num(v.goal);
    var goalPrice = perMonth ? (goal + rent + mat * perMonth) / (perMonth * (1 - taxP)) : 0;
    $('#enProRes').hidden = !pro;
    $('#enGoalBox').hidden = !pro || !goal || !gross;
    $('#enHour').textContent = gross && hours ? money(perHour) : '—';
    $('#enTaxM').textContent = gross ? money(tax) : '—';
    $('#enHours').textContent = hours ? fmt(hours) + ' год' : '—';
    var g = '';
    if (pro && goal && gross) {
      if (!state.open) g = 'Тут буде ціна, яку варто ставити, щоб виходило ' + fmt(goal) + ' ' + state.cur + ' на місяць.';
      else if (net >= goal) g = 'Ви вже заробляєте ціль: <b>' + money(net) + '</b> при цілі ' + money(goal) + '. Наступний крок — вищий чек або менше годин за ті самі гроші.';
      else g = 'Щоб чистими виходило <b>' + money(goal) + '</b> на місяць з тією ж кількістю клієнток, ціна процедури має бути <b>' + money(goalPrice) + '</b> — зараз ' + money(price) + ' (+' + Math.round((goalPrice / price - 1) * 100) + '%).';
    }
    $('#enGoalT').innerHTML = g;

    var costShare = gross ? Math.min(100, cost / gross * 100) : 0;
    $('#enBarCost').style.width = costShare + '%';
    $('#enBarNet').style.width = (gross ? 100 - costShare : 0) + '%';

    var keep = gross ? Math.round(net / gross * 100) : 0;
    var t = '';
    if (!gross) t = 'Введіть ціну і кількість клієнток — і побачите результат.';
    else if (net <= 0) t = '<b>Зараз ви працюєте в мінус.</b> Витрати з\'їдають усе, що платять клієнтки. Першим кроком переглядайте ціну — навіть +10–20% тут змінюють усе.';
    else if (keep < 40) t = 'Вам лишається лише <b>' + keep + '%</b> від того, що платять клієнтки. Більша частина йде на витрати — найімовірніше, ціна занизька для вашої роботи.';
    else if (keep < 65) t = 'Вам лишається <b>' + keep + '%</b> від обігу. Непогано, але запас є: часто майстри недооцінюють себе саме тут.';
    else t = 'Вам лишається <b>' + keep + '%</b> від обігу — хороший результат. Далі дохід росте не від більшої кількості клієнток, а від вищого чека і повторних записів.';
    if (!state.open && gross) t = 'Тут буде висновок: чи не занизька ваша ціна і скільки ви недоотримуєте щомісяця.';
    $('#enVerdict').innerHTML = t;

    // «А якщо підняти ціну» — ті самі клієнтки, вища ціна
    var plus = price * state.up / 100 * perMonth;
    $('#enUp').hidden = !gross;
    $('#enUpT').innerHTML = gross
      ? 'Ціна <b>' + money(price * (1 + state.up / 100)) + '</b> замість ' + money(price) + ' — і з тими самими клієнтками ви отримуєте <b>+' + money(plus) + '</b> на місяць, а за рік <b>+' + money(plus * 12) + '</b>.'
      : '';

    var f = $('#enForm').elements;
    f.currency.value = state.cur;
    f.price.value = price;
    f.materials.value = mat;
    f.per_week.value = clients;
    f.fixed_month.value = rent;
    f.net_month.value = gross ? Math.round(net) : '';
    f.mode.value = pro ? 'розширена' : 'проста';
    f.duration_h.value = pro ? num(v.dur) : '';
    f.tax_pct.value = pro ? num(v.tax) : '';
    f.weeks_year.value = pro ? weeks : '';
    f.per_hour.value = pro && hours ? Math.round(perHour) : '';
    f.goal_income.value = pro ? goal : '';
    f.goal_price.value = pro && goal ? Math.round(goalPrice) : '';
  }

  inputs.forEach(function (inp) {
    inp.addEventListener('input', function () {
      var raw = inp.value.replace(/[^\d.,]/g, '');
      state.v[inp.dataset.k] = num(raw);
      state.edited = true;
      save(); calc();
    });
    inp.addEventListener('blur', function () { inp.value = show(inp, state.v[inp.dataset.k]); });
    inp.addEventListener('focus', function () { var n = state.v[inp.dataset.k]; inp.value = n ? String(n).replace('.', ',') : ''; });
  });

  $('#enCur').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cur]'); if (!b) return;
    state.cur = b.dataset.cur;
    if (!state.edited) state.v = Object.assign({}, DEF[state.cur], PRO);
    save(); fill(); calc();
  });
  $('#enMode').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mode]'); if (!b) return;
    state.mode = b.dataset.mode;
    save(); fill(); calc();
  });
  $('#enUpOpts').addEventListener('click', function (e) {
    var b = e.target.closest('[data-up]'); if (!b) return;
    state.up = +b.dataset.up;
    save(); fill(); calc();
  });

  /* ---------- заявка ---------- */
  var form = $('#enForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    [].forEach.call(form.querySelectorAll('[data-lead]'), function (c) {
      var bad = !c.querySelector('input').value.trim() && !document.documentElement.classList.contains('tg');
      c.classList.toggle('err', bad);
      if (bad) ok = false;
    });
    if (!ok) return;
    var data = {};
    [].forEach.call(form.elements, function (el) { if (el.name && el.type !== 'submit' && el.type !== 'checkbox') data[el.name] = el.value; });
    if (window.bgSendLead) {
      window.bgSendLead('earn', data).catch(function (err) {
        if (window.console && console.warn) console.warn('earn: lead not sent', err);
      });
    }
    state.open = true; save();
    paintLock(); calc();
    form.hidden = true;
    $('#enOk').hidden = false;
    $('#enRes').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  form.addEventListener('input', function (e) {
    var c = e.target.closest('[data-lead]'); if (c && e.target.value.trim()) c.classList.remove('err');
  });

  function paintLock() {
    $('#enRes').classList.toggle('en-locked', !state.open);
    $('#enLock').hidden = state.open;
  }

  // Повторний візит: контакт уже залишили — форму не показуємо
  if (state.open) $('.en-lead').hidden = true;
  paintLock(); fill(); calc();

  /* ---------- усередині Telegram ----------
     Калькулятор відкривається як міні-застосунок бота (посилання t.me/<бот>?startapp=...).
     Замість полів «ім'я / контакт» — кнопка: Telegram просить дозволу поділитися номером,
     і за номер відкривається результат. Ім'я, нік і ID беремо з Telegram. */
  var inTg = /tgWebApp/.test(location.hash) || /[?&]tg\b/.test(location.search);
  if (!inTg) return;
  document.documentElement.classList.add('tg');
  var s = document.createElement('script');
  s.src = 'https://telegram.org/js/telegram-web-app.js';
  s.onload = setupTg;
  document.head.appendChild(s);

  function setupTg() {
    var app = window.Telegram && window.Telegram.WebApp;
    if (!app || !app.initData) { document.documentElement.classList.remove('tg'); return; } // відкрили не в Telegram
    app.ready(); app.expand();
    try { app.setHeaderColor('#120D18'); app.setBackgroundColor('#ffffff'); } catch (e) {}
    var u = (app.initDataUnsafe || {}).user || {};
    $('#enTgBox').hidden = false;
    $('.en-lead .hello-kicker').textContent = 'Ваш результат готовий';
    $('.en-lead .hello-title').textContent = 'Відкрийте його одним натисканням';
    $('.en-lead .hello-sub').textContent = 'Поділіться номером телефону — і результат одразу з’явиться нижче. А ще бот надсилатиме вам ефіри, вебінари й заходи для майстрів.';
    var okP = $('#enOk p'), okA = $('#enTg');
    okP.textContent = 'Він уже нижче. А ефіри, вебінари й заходи для майстрів бот надсилатиме вам сюди, у Telegram.';
    okA.hidden = true;

    $('#enTgShare').addEventListener('click', function () {
      var note = $('#enTgNote');
      if (!app.isVersionAtLeast || !app.isVersionAtLeast('6.9')) {
        note.textContent = 'Оновіть Telegram до останньої версії — і спробуйте ще раз.'; note.classList.add('err'); return;
      }
      app.requestContact(function (shared, res) {
        if (!shared) {
          note.textContent = 'Без номера результат не відкриється. Натисніть кнопку ще раз і оберіть «Поділитися».';
          note.classList.add('err'); return;
        }
        var c = (res && res.responseUnsafe && res.responseUnsafe.contact) || {};
        var f = form.elements;
        f.name.value = [c.first_name || u.first_name, c.last_name || u.last_name].filter(Boolean).join(' ');
        f.phone.value = c.phone_number ? '+' + String(c.phone_number).replace(/^\+/, '') : '';
        f.tg_user.value = u.username ? '@' + u.username : '';
        f.contact.value = f.tg_user.value || f.phone.value;
        f.tg_id.value = u.id || c.user_id || '';
        f.source.value = 'Telegram, міні-застосунок';
        f.start.value = (app.initDataUnsafe || {}).start_param || '';
        try { app.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });
  }
})();
