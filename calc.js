/* ============================================================
   BEAUTY GAMES — калькулятор майстра
   ------------------------------------------------------------
   Рахує економіку однієї послуги: скільки лишається чистими,
   скільки за годину, яка ціна потрібна для мети і що буде,
   якщо підняти ціну. Формули ті самі, що в таблиці-бонусі
   «Beauty_Games_Калькулятор_мастера.xlsx».

   Введені цифри живуть у localStorage (bg_calc) і нікуди не
   йдуть, доки людина сама не надішле форму розбору. Ім'я та
   напрямок підхоплюються з кроків на головній (bg_name,
   bg_character), якщо вона їх уже пройшла.
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

  var root = $('#calc');
  if (!root) return;

  var steps = $$('.calc-step', root);
  var RESULT = steps.length;
  var LAST_INPUT = RESULT - 1;
  var current = 1;
  var reached = 1;

  var state = {};
  try { state = JSON.parse(store.get('bg_calc') || '{}') || {}; } catch (e) { state = {}; }
  if (!state.cur) state.cur = '€';

  /* Раніше «обов'язкові внески» стояли серед витрат на місяць, і туди ж
     дописували податки — виходило двічі. Тепер фіксовані платежі живуть
     на кроці податків; збережене значення переносимо туди. */
  if (state.fee != null) {
    if (parseFloat(String(state.fee).replace(',', '.')) > 0 && !state.taxMode) {
      state.taxMode = 'both';
      if (!state.taxFix) state.taxFix = state.fee;
    }
    delete state.fee;
  }

  /* Час процедури раніше вводили годинами з дробом («2,5»); тепер години
     й хвилини окремо. Старе значення розкладаємо на два поля. */
  if (state.dur != null) {
    var oldMin = Math.round((parseFloat(String(state.dur).replace(',', '.')) || 0) * 60);
    if (oldMin > 0 && state.durH == null && state.durM == null) {
      state.durH = String(Math.floor(oldMin / 60));
      state.durM = String(oldMin % 60);
    }
    delete state.dur;
  }

  var save = function () { store.set('bg_calc', JSON.stringify(state)); };

  /* Кома чи крапка — як звикла людина; пробіли в тисячах теж можна. */
  var num = function (k) {
    var raw = state[k] == null ? '' : String(state[k]);
    var v = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
    return isFinite(v) && v > 0 ? v : 0;
  };

  /* ---------- формат ---------- */
  var nf0 = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 });
  var okNum = function (v) { return v != null && isFinite(v); };
  var money = function (v) {
    if (!okNum(v)) return '—';
    return (Math.abs(v) < 100 ? nf1 : nf0).format(v) + ' ' + state.cur;
  };
  var pct = function (v) { return okNum(v) ? nf0.format(v * 100) + '%' : '—'; };
  var plain = function (v) { return okNum(v) ? nf0.format(v) : '—'; };

  /* ============================================================
     РОЗРАХУНОК
     ============================================================ */
  var compute = function () {
    var P = num('price'), dur = num('durH') + num('durM') / 60, N = Math.round(num('count'));
    var mat = num('mat1') + num('mat2') + num('mat3') + num('mat4') + num('mat5');
    var years = num('years');
    var fixed = num('rent') + num('util') + num('ads') + num('soft') + num('other') +
      num('ex1') + num('ex2') +
      num('edu') / 12 + (years > 0 ? num('equip') / (years * 12) : 0);

    /* Податок буває відсотком від виручки, фіксованою сумою (ФОП 1–2 групи),
       тим і іншим (ФОП 3 групи: 5% + ЄСВ) або його немає зовсім. Поле
       невибраного способу не рахуємо, навіть якщо в ньому лишилося число. */
    var mode = state.taxMode || 'pct';
    var taxPct = mode === 'pct' || mode === 'both' ? num('tax') : 0;
    var taxFix = mode === 'fix' || mode === 'both' ? num('taxFix') : 0;
    var k = Math.min((taxPct + num('comm')) / 100, 0.99);
    var F = fixed + taxFix;                     // усе, що йде щомісяця незалежно від кількості клієнток

    var goal = num('goal');
    var vac = Math.min(num('vac'), 51);
    var weeks = 52 - vac;

    var revenue = P * N;
    var matM = mat * N;
    var taxM = revenue * k + taxFix;
    var net = revenue - matM - taxM - fixed;
    var vm = P * (1 - k) - mat;                 // скільки дає одна процедура до постійних витрат
    var needN = vm > 0 ? Math.ceil((goal + F) / vm) : null;

    return {
      P: P, dur: dur, N: N, mat: mat, fixed: fixed, k: k, goal: goal, weeks: weeks,
      mode: mode, taxPct: taxPct, taxFix: taxFix, F: F,
      revenue: revenue, matM: matM, taxM: taxM, net: net, vm: vm,
      perProc: N > 0 ? net / N : null,
      perHour: N > 0 && dur > 0 ? net / N / dur : null,
      share: N > 0 && P > 0 ? net / N / P : null,
      bep: vm > 0 ? Math.ceil(F / vm) : null,
      minPrice: N > 0 ? (mat + F / N) / (1 - k) : null,
      /* Мету рахуємо при тій кількості процедур, що вказана на кроці 1:
         окремо питати «скільки годин хочете працювати» зайве — час
         процедури й кількість уже відомі. */
      goalPrice: N > 0 ? ((goal + F) / N + mat) / (1 - k) : null,
      hoursNow: weeks > 0 ? N * dur * 12 / weeks : null,
      needN: needN,
      needHours: needN != null && weeks > 0 ? needN * dur * 12 / weeks : null
    };
  };

  var raiseAt = function (c, r) {
    var newP = c.P * (1 + r);
    var newVm = newP * (1 - c.k) - c.mat;
    return {
      price: newP,
      net: c.N * newVm - c.F,
      loss: c.vm > 0 && newVm > 0 ? 1 - c.vm / newVm : null
    };
  };

  /* ============================================================
     ПОЛЯ
     ============================================================ */
  var inputs = $$('[data-k]', root);

  var paintCurrency = function () {
    $$('[data-cur]', root).forEach(function (el) { el.textContent = state.cur; });
  };

  var paintSums = function () {
    var c = compute();
    var sm = $('#sumMat'), sf = $('#sumFixed');
    if (sm) sm.textContent = money(c.mat);
    if (sf) sf.textContent = money(c.fixed);
  };

  var bindInput = function (el) {
    var k = el.getAttribute('data-k');
    if (state[k] != null) el.value = state[k];
    var on = function () {
      state[k] = el.value;
      if (k === 'cur') paintCurrency();
      var mirror = $('[data-mirror="' + k + '"]', root);
      if (mirror) mirror.value = Math.min(num(k), +mirror.max);
      var box = el.closest('.cf');
      if (box) box.classList.remove('err');
      save();
      paintSet(k);
      paintSums();
    };
    el.addEventListener('input', on);
    el.addEventListener('change', on);
  };
  inputs.forEach(bindInput);

  /* повзунок кількості процедур ↔ поле */
  $$('[data-mirror]', root).forEach(function (range) {
    var k = range.getAttribute('data-mirror');
    var field = $('[data-k="' + k + '"]', root);
    range.value = Math.min(num(k), +range.max);
    range.addEventListener('input', function () {
      if (!field) return;
      field.value = String(range.value).replace('.', ',');
      field.dispatchEvent(new Event('input'));
    });
  });

  /* кнопки популярних значень: 5% податку, 2% комісії тощо */
  var paintSet = function (k) {
    $$('[data-set="' + k + '"]', root).forEach(function (b) {
      var on = state[k] != null && state[k] !== '' && num(k) === parseFloat(b.getAttribute('data-val'));
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };
  $$('[data-set]', root).forEach(function (b) {
    b.addEventListener('click', function () {
      var field = $('[data-k="' + b.getAttribute('data-set') + '"]', root);
      if (!field) return;
      field.value = String(b.getAttribute('data-val')).replace('.', ',');
      field.dispatchEvent(new Event('input'));
    });
  });

  /* кнопки − / + */
  $$('.cf-step', root).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field = $('input', btn.parentNode);
      if (!field) return;
      var k = field.getAttribute('data-k');
      var stepV = parseFloat(field.getAttribute('data-step')) || 1;
      var base = state[k] == null || state[k] === '' ? parseFloat(String(field.placeholder).replace(',', '.')) || 0 : num(k);
      var next = Math.max(0, Math.round((base + stepV * +btn.getAttribute('data-d')) * 100) / 100);
      field.value = String(next).replace('.', ',');
      field.dispatchEvent(new Event('input'));
    });
  });

  /* час процедури: два барабани, як у будильнику на телефоні — години й
     хвилини крутяться окремо і зупиняються рівно на значенні; клік по
     значенню чи стрілки ↑↓ теж обирають. Під барабанами — часті варіанти. */
  var durH = $('#cDurH'), durM = $('#cDurM');
  var durChips = $$('#durQuick [data-min]');
  var ITEM = 44;                                // висота рядка барабана, як у calc.css
  var HOURS = [], MINS = [];
  for (var hh = 0; hh <= 12; hh++) HOURS.push(hh);
  for (var mm = 0; mm < 60; mm += 5) MINS.push(mm);

  var paintDurChips = function () {
    var total = Math.round(num('durH') * 60 + num('durM'));
    durChips.forEach(function (b) {
      var on = +b.getAttribute('data-min') === total;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };

  var wheelIndex = function (w) {
    return Math.max(0, Math.min(w.vals.length - 1, Math.round(w.col.scrollTop / ITEM)));
  };
  var paintWheel = function (w, i) {
    Array.prototype.forEach.call(w.col.children, function (it, j) {
      it.classList.toggle('on', j === i);
      it.setAttribute('aria-selected', j === i ? 'true' : 'false');
    });
  };
  var pickFromWheel = function (w, i) {
    if (i == null) i = wheelIndex(w);
    paintWheel(w, i);
    var field = w.key === 'durH' ? durH : durM;
    var v = String(w.vals[i]);
    if (field && field.value !== v) {
      field.value = v;
      field.dispatchEvent(new Event('input'));
    }
    paintDurChips();
  };
  var scrollWheel = function (w, i, smooth) {
    i = Math.max(0, Math.min(w.vals.length - 1, i));
    if (Math.round(w.col.scrollTop / ITEM) === i) { pickFromWheel(w, i); return; }
    if (smooth && w.col.scrollTo) w.col.scrollTo({ top: i * ITEM, behavior: 'smooth' });
    else w.col.scrollTop = i * ITEM;
  };

  var wheels = $$('#durWheel [data-wheel]').map(function (col) {
    var w = { col: col, key: col.getAttribute('data-wheel') === 'h' ? 'durH' : 'durM', timer: null };
    w.vals = w.key === 'durH' ? HOURS : MINS;
    w.vals.forEach(function (v, i) {
      var it = document.createElement('div');
      it.className = 'wheel-item';
      it.setAttribute('role', 'option');
      it.textContent = w.key === 'durM' && v < 10 ? '0' + v : String(v);
      it.addEventListener('click', function () { scrollWheel(w, i, true); });
      col.appendChild(it);
    });
    col.addEventListener('scroll', function () {
      clearTimeout(w.timer);
      w.timer = setTimeout(function () { pickFromWheel(w); }, 90);
    });
    col.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      scrollWheel(w, wheelIndex(w) + (e.key === 'ArrowDown' ? 1 : -1), true);
    });
    return w;
  });

  /* Прокрутку можна виставити лише видимому барабану, тому синхронізуємо
     при кожному відкритті кроку 1. */
  var syncWheels = function () {
    wheels.forEach(function (w) {
      var v = w.key === 'durH' ? Math.min(12, Math.round(num('durH'))) : Math.round(num('durM') / 5) * 5 % 60;
      var i = Math.max(0, w.vals.indexOf(v));
      w.col.scrollTop = i * ITEM;
      paintWheel(w, i);
    });
  };

  var setDur = function (total) {
    total = Math.max(0, Math.round(total));
    var h = Math.min(12, Math.floor(total / 60));
    var m = Math.round((total % 60) / 5) * 5 % 60;
    [[durH, h], [durM, m]].forEach(function (p) {
      if (!p[0] || p[0].value === String(p[1])) return;
      p[0].value = String(p[1]);
      p[0].dispatchEvent(new Event('input'));
    });
    wheels.forEach(function (w) { scrollWheel(w, w.vals.indexOf(w.key === 'durH' ? h : m), true); });
    paintDurChips();
  };
  durChips.forEach(function (b) {
    b.addEventListener('click', function () { setDur(+b.getAttribute('data-min')); });
  });

  /* напрямок */
  var dirBtns = $$('#calcDirs [data-dir]');
  var hints = {
    'Броу-майстер': 'Напр., корекція і фарбування брів',
    'Лашмейкер': 'Напр., нарощування вій 2D',
    'Нігтьовий сервіс': 'Напр., манікюр з покриттям',
    'Перманент': 'Напр., пудрові брови',
    'Візажист': 'Напр., вечірній макіяж',
    'Перукар-стиліст': 'Напр., стрижка і укладка',
    'Нарощування волосся': 'Напр., корекція нарощування',
    'Косметологія': 'Напр., чистка обличчя',
    'Масажист': 'Напр., масаж спини, 60 хв',
    'Лазерне видалення': 'Напр., лазер, ноги повністю',
    'Депіляція': 'Напр., шугаринг, бікіні',
    'Подологія': 'Напр., медичний педикюр'
  };
  /* Статті витрат під напрямок: у броу-майстра фарба, у подолога —
     стерилізація. Загальні «основні матеріали» люди пропускали. */
  var costsFor = function (dir) {
    var C = window.BG_COSTS || {};
    return C[dir] || C[''] || { mat: [], fix: [] };
  };

  var field = function (key, row, unit) {
    var id = 'cf_' + key;
    var box = document.createElement('div');
    box.className = 'cf';
    box.innerHTML =
      '<label class="cf-l" for="' + id + '"></label>' +
      '<div class="cf-in"><input type="text" inputmode="decimal" id="' + id + '" data-k="' + key + '">' +
      '<span class="cf-u">' + unit + '</span></div>' +
      (row[1] ? '<span class="cf-h"></span>' : '');
    $('label', box).textContent = row[0];
    var inp = $('input', box);
    inp.placeholder = row[2];
    if (row[1]) $('.cf-h', box).textContent = row[1];
    bindInput(inp);
    return box;
  };

  var paintCosts = function () {
    var c = costsFor(state.dir);
    var grid = $('#matGrid'), note = $('#matNote');

    if (grid) {
      grid.innerHTML = '';
      c.mat.forEach(function (row, i) {
        grid.appendChild(field('mat' + (i + 1), row, '<i data-cur>' + state.cur + '</i>'));
      });
      // те, чого в цьому напрямку немає, не має підсумовуватись
      for (var i = c.mat.length + 1; i <= 5; i++) delete state['mat' + i];
    }
    if (note) {
      note.hidden = !!state.dir;
      note.textContent = state.dir ? '' : 'Оберіть напрямок на кроці 1 — і список стане під вашу роботу.';
    }

    $$('#fixGrid .cf-extra').forEach(function (el) { el.remove(); });
    var sub = $('#fixSub');
    if (sub) {
      c.fix.forEach(function (row, i) {
        var box = field('ex' + (i + 1), row, '<i data-cur>' + state.cur + '</i> на місяць');
        box.classList.add('cf-extra');
        sub.parentNode.insertBefore(box, sub);
      });
    }
    for (var j = c.fix.length + 1; j <= 2; j++) delete state['ex' + j];

    paintCurrency();
    save();
  };

  var paintDir = function () {
    dirBtns.forEach(function (b) {
      var on = b.getAttribute('data-dir') === state.dir;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var svc = $('#cService');
    if (svc && hints[state.dir]) svc.placeholder = hints[state.dir];
    paintCosts();
    paintSums();
  };
  if (!state.dir) {
    var fromMain = (store.get('bg_character') || '').split('|')[0];
    if (fromMain) state.dir = fromMain;
  }
  dirBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var d = b.getAttribute('data-dir');
      state.dir = state.dir === d ? '' : d;
      save();
      paintDir();
    });
  });

  /* спосіб сплати податку */
  var taxBtns = $$('#taxModes [data-tax]');
  var taxHints = {
    pct: 'Податок — відсоток від виручки: більше заробили — більше сплатили.',
    fix: 'Щомісяця та сама сума, скільки б ви не заробили. Напр., ФОП 1 чи 2 групи: єдиний податок + ЄСВ.',
    both: 'Відсоток від виручки плюс фіксований платіж. Напр., ФОП 3 групи: 5% + ЄСВ.',
    none: 'Податок не рахуємо. Якщо платите комісію банку чи сервісу запису — вкажіть її нижче.'
  };
  var paintTax = function () {
    var mode = state.taxMode || 'pct';
    taxBtns.forEach(function (b) {
      var on = b.getAttribute('data-tax') === mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('[data-tax-show]', root).forEach(function (box) {
      box.hidden = box.getAttribute('data-tax-show').split(' ').indexOf(mode) < 0;
    });
    var hint = $('#taxHint');
    if (hint) hint.textContent = taxHints[mode];
  };
  taxBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      state.taxMode = b.getAttribute('data-tax');
      save();
      paintTax();
    });
  });

  /* звертання на ім'я, як на головній */
  var name = (store.get('bg_name') || '').trim();
  var hello = $('#calcHello');
  if (name && hello) {
    hello.textContent = name + ', порахуймо, скільки насправді коштує ваша процедура і скільки з неї лишається вам. Чотири короткі кроки — і ви побачите свої справжні цифри.';
  }
  var leadName = $('#lName');
  if (name && leadName && !leadName.value) leadName.value = name;

  /* ============================================================
     РЕЗУЛЬТАТ
     ============================================================ */
  var setText = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
  var last = null;

  var renderRaise = function () {
    if (!last) return;
    var c = last;
    var range = $('#rRaise');
    var r = range ? +range.value / 100 : 0.2;
    var x = raiseAt(c, r);
    setText('rRaisePct', '+' + Math.round(r * 100) + '%');
    setText('rNewPrice', money(x.price));
    setText('rNewNet', money(x.net));
    setText('rLoss', c.net > 0 && r > 0 ? 'до ' + pct(x.loss) : '—');

    var note = $('#rRaiseNote');
    if (!note) return;
    if (r === 0) {
      note.textContent = 'Посуньте повзунок — і побачите, скільки клієнток можна втратити без втрати доходу.';
    } else if (c.net > 0 && okNum(x.loss)) {
      note.innerHTML = 'Підніміть ціну на <b>' + Math.round(r * 100) + '%</b> — і навіть якщо піде <b>' + pct(x.loss) +
        '</b> клієнток, ви заробите стільки ж. Тільки працюватимете менше годин.';
    } else {
      note.innerHTML = 'Навіть <b>+' + Math.round(r * 100) + '%</b> до ціни змінюють картину: ' +
        (x.net > 0 ? 'ви виходите в плюс — <b>' + money(x.net) + '</b> на місяць.' : 'мінус скорочується до <b>' + money(x.net) + '</b> на місяць.');
    }
  };

  var render = function () {
    var c = last = compute();

    var big = $('#rNet');
    if (big) { big.textContent = money(c.net); big.classList.toggle('neg', c.net < 0); }
    setText('rOf', 'з ' + money(c.revenue) + ' виручки за ' + plain(c.N) + ' процедур' +
      (okNum(c.hoursNow) && c.hoursNow > 0 ? ' · ≈ ' + plain(c.hoursNow) + ' год роботи на тиждень' : ''));

    var base = Math.max(c.revenue, c.matM + c.taxM + c.fixed) || 1;
    var w = function (v) { return Math.max(0, v) / base * 100 + '%'; };
    var seg = function (id, v) { var el = document.getElementById(id); if (el) el.style.width = w(v); };
    seg('segMat', c.matM); seg('segTax', c.taxM); seg('segFix', c.fixed); seg('segNet', c.net);
    setText('lgMat', money(c.matM));
    setText('lgTax', money(c.taxM));
    setText('lgFix', money(c.fixed));
    setText('lgNet', money(c.net));

    setText('rHour', okNum(c.perHour) ? money(c.perHour) + '/год' : '—');
    setText('rProc', money(c.perProc));
    setText('rShare', okNum(c.share) ? 'це ' + pct(c.share) + ' від ціни' : '');
    setText('rBep', okNum(c.bep) ? plain(c.bep) : 'не вийти');
    setText('rMin', money(c.minPrice));

    /* «Як ми порахували» — той самий розрахунок рядками, на цифрах людини:
       видно, звідки взялася кожна сума і чи не записано щось двічі. */
    var how = $('#rHow');
    if (how) {
      var taxParts = [];
      if (c.k > 0) taxParts.push(nf1.format(c.k * 100) + '% від виручки');
      if (c.taxFix > 0) taxParts.push(money(c.taxFix) + ' фіксовано');
      var rows = [
        ['Виручка', money(c.P) + ' × ' + plain(c.N) + ' процедур', money(c.revenue)],
        ['− Витратні', money(c.mat) + ' × ' + plain(c.N) + ' процедур', money(c.matM)],
        ['− Податки й комісії', taxParts.join(' + ') || 'не вказані', money(c.taxM)],
        ['− Витрати на місяць', 'оренда, реклама, сервіси, навчання, знос', money(c.fixed)],
        ['= Чистими', '', money(c.net)]
      ];
      how.textContent = '';
      rows.forEach(function (r) {
        var li = document.createElement('li');
        var lbl = document.createElement('span');
        lbl.textContent = r[0];
        if (r[1]) {
          var sm = document.createElement('small');
          sm.textContent = r[1];
          lbl.appendChild(sm);
        }
        var val = document.createElement('b');
        val.textContent = r[2];
        li.appendChild(lbl);
        li.appendChild(val);
        how.appendChild(li);
      });
    }

    var svc = (state.service || '').trim();
    setText('rTitle', svc ? 'Ваші цифри: ' + svc : 'Ваші цифри');

    var t, tx;
    if (c.net < 0) {
      t = 'Ви працюєте в мінус';
      tx = 'Витрати більші за дохід: зараз ви доплачуєте за свою роботу. Ціна, нижче якої опускатися не можна, — ' + money(c.minPrice) + '.';
    } else if (!c.goal) {
      t = 'Ось ваша реальна картина';
      tx = 'Вкажіть на кроці 4, скільки хочете заробляти, — і калькулятор покаже, яка ціна для цього потрібна.';
    } else if (okNum(c.goalPrice) && c.P < c.goalPrice) {
      t = 'Ціна нижча за вашу мету';
      tx = 'Щоб заробляти ' + money(c.goal) + ' чистими при ' + plain(c.N) + ' процедурах на місяць, послуга має коштувати ' +
        money(c.goalPrice) + ' — це на ' + pct(c.goalPrice / c.P - 1) + ' більше, ніж зараз.';
      if (okNum(c.needN) && okNum(c.needHours)) {
        tx += ' Або за нинішньою ціною потрібно ' + plain(c.needN) + ' процедур на місяць — це близько ' +
          plain(c.needHours) + ' год роботи на тиждень.';
      }
    } else if (okNum(c.goalPrice)) {
      t = 'Ціна тримає вашу мету';
      tx = 'За нинішньої ціни і кількості процедур ви виходите на ' + money(c.goal) + ' чистими. Далі ростуть не години, а чек і завантаження.';
    } else {
      t = 'Ось ваша реальна картина';
      tx = 'Вкажіть на кроці 1 ціну, час і кількість процедур — і калькулятор порахує ціну для мети.';
    }
    setText('rVerdictT', t);
    setText('rVerdict', tx);

    renderRaise();
  };

  var raise = $('#rRaise');
  if (raise) raise.addEventListener('input', renderRaise);

  /* ============================================================
     КРОКИ
     ============================================================ */
  var backBtn = $('#calcBack');
  var nextBtn = $('#calcNext');
  var resetBtn = $('#calcReset');
  var bar = $('#calcBar');
  var stepBtns = $$('#calcSteps [data-go]');

  var validate = function (n) {
    var bad = null;
    $$('[data-req]', steps[n - 1]).forEach(function (box) {
      // У полі часу два входи: достатньо, щоб хоч один був заповнений.
      var fields = $$('[data-k]', box);
      var empty = fields.length && fields.every(function (f) { return !num(f.getAttribute('data-k')); });
      if (empty) {
        box.classList.add('err');
        if (!bad) bad = fields[0];
      }
    });
    // Час живе в прихованих полях — фокус ставимо на барабан годин.
    if (bad) (bad.type === 'hidden' ? ($('[data-wheel]', bad.closest('.cf')) || bad) : bad).focus();
    return !bad;
  };

  var go = function (n, noScroll) {
    n = Math.max(1, Math.min(RESULT, n));
    current = n;
    reached = Math.max(reached, n);
    steps.forEach(function (s, i) { s.hidden = i !== n - 1; });
    if (n === 1) syncWheels();

    stepBtns.forEach(function (b) {
      var g = +b.getAttribute('data-go');
      b.classList.toggle('on', g === n);
      b.classList.toggle('done', g < n || (g <= reached && g !== n));
      b.disabled = g > reached;
      if (g === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    if (bar) bar.style.width = ((n - 1) / (RESULT - 1) * 100) + '%';

    if (backBtn) {
      backBtn.hidden = n === 1;
      backBtn.textContent = n === RESULT ? '← Змінити дані' : '← Назад';
    }
    if (nextBtn) {
      nextBtn.hidden = n === RESULT;
      nextBtn.textContent = n === LAST_INPUT ? 'Показати результат' : 'Далі';
    }
    if (resetBtn) resetBtn.hidden = n !== RESULT;

    if (n === RESULT) {
      render();
      state.done = 1;
      save();
      if (window.gtag) window.gtag('event', 'calc_result');
    }

    if (!noScroll) {
      var top = root.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.4) {
        window.scrollTo({ top: window.pageYOffset + top - 96, behavior: 'smooth' });
      }
    }
  };

  if (nextBtn) nextBtn.addEventListener('click', function () {
    if (!validate(current)) return;
    go(current + 1);
  });
  if (backBtn) backBtn.addEventListener('click', function () {
    go(current === RESULT ? 1 : current - 1);
  });
  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var g = +b.getAttribute('data-go');
      if (g <= reached) go(g);
    });
  });

  if (resetBtn) resetBtn.addEventListener('click', function () {
    var keep = { cur: state.cur, dir: state.dir, taxMode: state.taxMode };
    state = keep;
    store.set('bg_calc', JSON.stringify(state));
    inputs.forEach(function (el) {
      var k = el.getAttribute('data-k');
      el.value = state[k] != null ? state[k] : (el.tagName === 'SELECT' ? el.options[0].value : '');
    });
    $$('[data-mirror]', root).forEach(function (r) { r.value = 0; });
    reached = 1;
    paintSums();
    paintDurChips();
    paintSet('tax');
    paintSet('comm');
    go(1);
  });

  /* ============================================================
     ЗАЯВКА НА РОЗБІР — через leads.js, як і на головній
     ============================================================ */
  var form = $('#calcForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[data-lead]', form).forEach(function (box) {
        var field = $('input', box);
        var empty = !field || !field.value.trim();
        box.classList.toggle('err', empty);
        if (empty && ok) { ok = false; field.focus(); }
      });
      if (!ok) return;

      var c = last || compute();
      var set = function (n, v) { if (form.elements[n]) form.elements[n].value = v == null ? '' : v; };
      var r2 = function (v) { return okNum(v) ? Math.round(v * 100) / 100 : ''; };
      set('direction', state.dir || '');
      set('service', state.service || '');
      set('currency', state.cur);
      set('price', r2(c.P));
      set('duration_h', r2(c.dur));
      set('per_month', c.N);
      set('materials', r2(c.mat));
      set('fixed_month', r2(c.fixed));
      set('tax_mode', { pct: 'відсоток', fix: 'фіксована сума', both: 'відсоток + фіксовані', none: 'не сплачує' }[c.mode]);
      set('tax_pct', r2(c.k * 100));
      set('tax_fixed_month', r2(c.taxFix));
      set('net_month', r2(c.net));
      set('per_hour', r2(c.perHour));
      set('goal', r2(c.goal));
      set('goal_price', r2(c.goalPrice));
      set('verdict', ($('#rVerdictT') || {}).textContent || '');

      var data = {};
      $$('input', form).forEach(function (el) {
        if (!el.name) return;
        if (el.type === 'checkbox') data[el.name] = el.checked ? 'yes' : 'no';
        else data[el.name] = el.value;
      });
      if (window.bgSendLead) {
        window.bgSendLead('calc', data).catch(function (err) {
          if (window.console && console.warn) console.warn('calc: lead not sent', err);
        });
      }
      if (window.gtag) window.gtag('event', 'form_submit', { form: 'calc' });
      if (window.fbq) window.fbq('track', 'Lead');

      form.hidden = true;
      var okBox = $('#rLeadOk');
      if (okBox) okBox.hidden = false;
    });
  }

  /* ---------- старт ---------- */
  paintCurrency();
  paintDir();
  paintTax();
  paintDurChips();
  paintSet('tax');
  paintSet('comm');
  paintSums();
  if (state.done && num('price') && (num('durH') || num('durM')) && num('count')) {
    reached = RESULT;
    go(RESULT, true);
  } else {
    go(1, true);
  }
})();
