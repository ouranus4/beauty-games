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
    var P = num('price'), dur = num('dur'), N = Math.round(num('count'));
    var mat = num('mat1') + num('mat2') + num('mat3') + num('mat4');
    var years = num('years');
    var fixed = num('rent') + num('util') + num('ads') + num('soft') + num('other') +
      num('edu') / 12 + (years > 0 ? num('equip') / (years * 12) : 0);

    /* Податок буває відсотком від виручки, фіксованою сумою (ФОП 1–2 групи)
       або тим і іншим (ФОП 3 групи: 5% + ЄСВ). Поле невибраного способу
       не рахуємо, навіть якщо в ньому лишилося число. */
    var mode = state.taxMode || 'pct';
    var taxPct = mode === 'fix' ? 0 : num('tax');
    var taxFix = mode === 'pct' ? 0 : num('taxFix');
    var k = Math.min((taxPct + num('comm')) / 100, 0.99);
    var F = fixed + taxFix;                     // усе, що йде щомісяця незалежно від кількості клієнток

    var goal = num('goal');
    var hours = state.hours == null || state.hours === '' ? 30 : num('hours');
    var vac = Math.min(num('vac'), 51);
    var weeks = 52 - vac;

    var revenue = P * N;
    var matM = mat * N;
    var taxM = revenue * k + taxFix;
    var net = revenue - matM - taxM - fixed;
    var vm = P * (1 - k) - mat;                 // скільки дає одна процедура до постійних витрат
    var cap = dur > 0 ? Math.floor(hours * weeks / 12 / dur) : 0;
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
      cap: cap,
      goalPrice: cap > 0 ? ((goal + F) / cap + mat) / (1 - k) : null,
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

  inputs.forEach(function (el) {
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
      paintSums();
    };
    el.addEventListener('input', on);
    el.addEventListener('change', on);
  });

  /* повзунок кількості процедур ↔ поле */
  $$('[data-mirror]', root).forEach(function (range) {
    var k = range.getAttribute('data-mirror');
    var field = $('[data-k="' + k + '"]', root);
    range.value = Math.min(num(k), +range.max);
    range.addEventListener('input', function () {
      if (!field) return;
      field.value = range.value;
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
  var paintDir = function () {
    dirBtns.forEach(function (b) {
      var on = b.getAttribute('data-dir') === state.dir;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var svc = $('#cService');
    if (svc && hints[state.dir]) svc.placeholder = hints[state.dir];
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
    both: 'Відсоток від виручки плюс фіксований платіж. Напр., ФОП 3 групи: 5% + ЄСВ.'
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
    setText('rOf', 'з ' + money(c.revenue) + ' виручки за ' + plain(c.N) + ' процедур');

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
      tx = 'Щоб заробляти ' + money(c.goal) + ' чистими у вашому графіку, послуга має коштувати ' + money(c.goalPrice) +
        ' — це на ' + pct(c.goalPrice / c.P - 1) + ' більше, ніж зараз.';
      if (okNum(c.needHours)) tx += ' За нинішньою ціною доведеться працювати ' + plain(c.needHours) + ' год на тиждень.';
    } else if (okNum(c.goalPrice)) {
      t = 'Ціна тримає вашу мету';
      tx = 'За нинішньої ціни ви виходите на ' + money(c.goal) + ' чистими в бажаному графіку. Далі ростуть не години, а чек і завантаження.';
    } else {
      t = 'Ось ваша реальна картина';
      tx = 'Вкажіть на кроці 4, скільки годин на тиждень хочете працювати, — і калькулятор порахує ціну для мети.';
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
      var field = $('[data-k]', box);
      if (field && !num(field.getAttribute('data-k'))) {
        box.classList.add('err');
        if (!bad) bad = field;
      }
    });
    if (bad) bad.focus();
    return !bad;
  };

  var go = function (n, noScroll) {
    n = Math.max(1, Math.min(RESULT, n));
    current = n;
    reached = Math.max(reached, n);
    steps.forEach(function (s, i) { s.hidden = i !== n - 1; });

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
    go(1);
  });

  /* ============================================================
     ЗАЯВКА НА РОЗБІР — Netlify Forms, як і на головній
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
      set('tax_mode', { pct: 'відсоток', fix: 'фіксована сума', both: 'відсоток + фіксовані' }[c.mode]);
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
      data.page = 'calc';
      data.utm = window.location.search || '';
      data.referrer = document.referrer || '';

      var body = Object.keys(data).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }).join('&');

      if (window.fetch) {
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        }).catch(function (err) {
          if (window.console && console.warn) console.warn('Форма не надіслана (очікувано поза Netlify):', err);
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
  paintSums();
  if (state.done && num('price') && num('dur') && num('count')) {
    reached = RESULT;
    go(RESULT, true);
  } else {
    go(1, true);
  }
})();
