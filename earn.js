/* «Скільки ви заробляєте насправді» — простий калькулятор б'юті-майстра.
   4 цифри: ціна, матеріали, клієнток на тиждень, витрати на місяць.
   Чистими = (ціна − матеріали) × клієнток × 4,3 тижня − витрати.
   Поля відкриті, а результат розмитий, доки майстриня не залишить контакт
   (заявка — через leads.js, Lead у пікселі). Цифри й позначка «відкрито» — в localStorage. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var KEY = 'bg_earn_v1';
  var WEEKS = 4.3;

  // Приклади за замовчуванням під кожну валюту — поки майстриня не ввела свої
  var DEF = {
    'грн': { price: 800, mat: 150, clients: 15, rent: 6000 },
    '€': { price: 40, mat: 8, clients: 15, rent: 400 },
    'zł': { price: 150, mat: 30, clients: 15, rent: 1500 },
    '$': { price: 45, mat: 9, clients: 15, rent: 450 }
  };

  var state = { cur: 'грн', v: null, edited: false, up: 10, open: false };
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && DEF[s.cur] && s.v) state = s;
  } catch (e) {}
  if (!state.v) state.v = Object.assign({}, DEF[state.cur]);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function num(x) { var n = parseFloat(String(x).replace(/\s/g, '').replace(',', '.')); return isFinite(n) && n > 0 ? n : 0; }
  function fmt(n) { return Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' '); }
  function money(n) {
    if (!state.open) return '•• ••• ' + state.cur; // до заявки справжніх цифр на сторінці немає
    return (n < 0 ? '−' : '') + fmt(Math.abs(n)) + ' ' + state.cur;
  }

  var inputs = [].slice.call(document.querySelectorAll('[data-k]'));

  function fill() {
    inputs.forEach(function (inp) { inp.value = state.v[inp.dataset.k] ? fmt(state.v[inp.dataset.k]) : ''; });
    [].forEach.call(document.querySelectorAll('[data-u]'), function (u) { u.textContent = state.cur; });
    [].forEach.call(document.querySelectorAll('#enCur .expo'), function (b) { b.classList.toggle('on', b.dataset.cur === state.cur); });
    [].forEach.call(document.querySelectorAll('#enUpOpts .expo'), function (b) { b.classList.toggle('on', +b.dataset.up === state.up); });
  }

  function calc() {
    var v = state.v;
    var price = num(v.price), mat = num(v.mat), clients = num(v.clients), rent = num(v.rent);
    var perMonth = clients * WEEKS;
    var gross = price * perMonth;
    var cost = mat * perMonth + rent;
    var net = gross - cost;
    var per = perMonth ? net / perMonth : 0;

    $('#enNet').textContent = gross ? money(net) : '—';
    $('#enNet').classList.toggle('neg', state.open && net < 0);
    $('#enGross').textContent = gross ? money(gross) : '—';
    $('#enCost').textContent = gross ? money(cost) : '—';
    $('#enPer').textContent = gross ? money(per) : '—';

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
  }

  inputs.forEach(function (inp) {
    inp.addEventListener('input', function () {
      var raw = inp.value.replace(/[^\d.,]/g, '');
      state.v[inp.dataset.k] = num(raw);
      state.edited = true;
      save(); calc();
    });
    inp.addEventListener('blur', function () { var n = state.v[inp.dataset.k]; inp.value = n ? fmt(n) : ''; });
    inp.addEventListener('focus', function () { var n = state.v[inp.dataset.k]; inp.value = n ? String(n) : ''; });
  });

  $('#enCur').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cur]'); if (!b) return;
    state.cur = b.dataset.cur;
    if (!state.edited) state.v = Object.assign({}, DEF[state.cur]);
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
      var bad = !c.querySelector('input').value.trim();
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
})();
