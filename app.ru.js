/* ============================================================
   BEAUTY GAMES 2026 — інтерактив
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ============================================================
     ЗАСТАВКА ЗАВАНТАЖЕННЯ
     Мінімум 1,6 секунди, щоб логотип встигли побачити, далі ховається
     сама. Кнопки немає — зайвий клік перед сайтом прибрали.
     ============================================================ */
  (function () {
    var pl = document.getElementById('preloader');
    if (!pl) return;
    var bar = document.getElementById('plBar');
    var pct = document.getElementById('plPct');
    var t0 = Date.now(), MIN = 1600, done = false, timer = null;

    document.body.style.overflow = 'hidden';

    var hide = function () {
      if (done) return;
      done = true;
      if (timer) clearInterval(timer);
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent = '100%';
      setTimeout(function () {
        pl.classList.add('gone');
        document.body.style.overflow = '';
        setTimeout(function () {
          if (pl.parentNode) pl.parentNode.removeChild(pl);
        }, 450);
      }, 220);
    };

    timer = setInterval(function () {
      var v = Math.min(97, (Date.now() - t0) / MIN * 100);
      if (bar) bar.style.width = v + '%';
      if (pct) pct.textContent = Math.round(v) + '%';
      if (Date.now() - t0 >= MIN && document.readyState === 'complete') hide();
    }, 40);

    window.addEventListener('load', function () {
      setTimeout(hide, Math.max(0, MIN - (Date.now() - t0)));
    });
    setTimeout(hide, 6000);   // страховка
  })();

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ============================================================
     ПІДСУМОК ВИБОРУ
     Усе, що людина обрала на сторінці, збирається в одну картку
     біля заявки — щоб не питати те саме ще раз у менеджера.
     ============================================================ */
  var pickBox = $('#pickBox');
  var setPick = function (row, field, value, hidden) {
    var r = $('#' + row);
    var f = $('#' + field);
    if (f) f.textContent = value || '';
    if (r) r.hidden = !value;
    if (hidden) { var hf = $('#' + hidden); if (hf) hf.value = value || ''; }
    if (pickBox) {
      pickBox.hidden = !$$('.pickbox-row', pickBox).some(function (x) { return !x.hidden; });
    }
  };

  /* ---------- безпечний localStorage ---------- */
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ============================================================
     ШАПКА: стан прокрутки
     ============================================================ */
  var navOuter = $('#navOuter');
  function onScroll() {
    if (!navOuter) return;
    navOuter.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     МОБІЛЬНЕ МЕНЮ
     ============================================================ */
  var burger = $('#burger');
  var mobileMenu = $('#mobileMenu');
  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', mobileMenu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ============================================================
     ТАЙМЕР СПЕЦЦІНИ — 24 години з першого візиту
     ============================================================ */
  var cdH = $('#cdH'), cdM = $('#cdM'), cdS = $('#cdS'), cdBox = $('#countdown');
  if (cdH && cdM && cdS) {
    var KEY = 'bg_offer_start';
    var start = parseInt(store.get(KEY), 10);
    if (!start || isNaN(start) || start > Date.now()) {
      start = Date.now();
      store.set(KEY, String(start));
    }
    var END = start + 24 * 60 * 60 * 1000;

    var pad = function (n) { return n < 10 ? '0' + n : String(n); };

    var tick = function () {
      var left = END - Date.now();
      if (left <= 0) {
        cdH.textContent = '00'; cdM.textContent = '00'; cdS.textContent = '00';
        var lbl = cdBox && $('.cd-label', cdBox);
        if (lbl) {
          lbl.innerHTML = '<b>Специальная цена 24 часов закончилась.</b> Действует цена недели — напишите менеджеру, чтобы закрепить её за собой.';
        }
        clearInterval(timer);
        return;
      }
      var h = Math.floor(left / 3600000);
      var m = Math.floor((left % 3600000) / 60000);
      var s = Math.floor((left % 60000) / 1000);
      cdH.textContent = pad(h); cdM.textContent = pad(m); cdS.textContent = pad(s);
      // fx.js слухає цю подію: терміновість у тексті + тікання в останню хвилину
      document.dispatchEvent(new CustomEvent('bg:tick', { detail: { h: h, m: m, s: s } }));
    };
    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ============================================================
     АКОРДЕОНИ (модулі програми, FAQ)
     ============================================================ */
  var setItem = function (item, open) {
    var panel = $('.acc-panel', item);
    var btn = $('.acc-btn', item);
    if (!panel || !btn) return;
    item.classList.toggle('open', open);
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  $$('.acc').forEach(function (acc) {
    // Модулі програми можна тримати відкритими разом — людина порівнює
    // їх між собою. FAQ лишається звичайним: одна відповідь за раз.
    var multi = acc.id === 'modules';

    $$('.acc-item', acc).forEach(function (item) {
      var btn = $('.acc-btn', item);
      var panel = $('.acc-panel', item);
      if (!btn || !panel) return;

      btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        if (!multi) {
          $$('.acc-item.open', acc).forEach(function (other) {
            if (other !== item) setItem(other, false);
          });
        }
        setItem(item, !isOpen);
        item.classList.add('seen');
        acc.dispatchEvent(new CustomEvent('acc:change', { bubbles: true }));
      });
    });
  });

  /* ---------- лічильник і кнопка «відкрити всі» для модулів ---------- */
  var mods = $('#modules');
  if (mods) {
    var openEl = $('#accOpen');
    var fillEl = $('#accFill');
    var allBtn = $('#accAll');
    var items = $$('.acc-item', mods);

    var sync = function () {
      var n = items.filter(function (i) { return i.classList.contains('open'); }).length;
      if (openEl) openEl.textContent = n;
      if (fillEl) fillEl.style.width = (n / items.length * 100) + '%';
      if (allBtn) allBtn.textContent = n === items.length ? 'Свернуть все' : 'Открыть все';
    };

    mods.addEventListener('acc:change', sync);
    if (allBtn) {
      allBtn.addEventListener('click', function () {
        var openAll = items.some(function (i) { return !i.classList.contains('open'); });
        items.forEach(function (i) { setItem(i, openAll); });
        sync();
      });
    }
    sync();
  }

  // перерахунок висоти відкритих панелей при зміні ширини
  var resizeTO;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(function () {
      $$('.acc-item.open .acc-panel').forEach(function (p) {
        p.style.maxHeight = p.scrollHeight + 'px';
      });
    }, 150);
  });

  /* ============================================================
     ТАБЛИЦЯ ПОРІВНЯННЯ — перемикач колонок на мобільному
     ============================================================ */
  var tabs = $('#tableTabs');
  if (tabs) {
    $$('button', tabs).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var col = btn.getAttribute('data-col');
        $$('button', tabs).forEach(function (b) { b.classList.toggle('on', b === btn); });
        $$('.col').forEach(function (cell) {
          cell.classList.toggle('show', cell.getAttribute('data-col') === col);
        });
      });
    });
  }

  /* ============================================================
     ВИБІР ПАКЕТА → підстановка у форму + плавний перехід
     ============================================================ */
  var packSelect = $('#fPack');
  $$('.js-pick').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var wanted = btn.getAttribute('data-pack') || '';
      if (packSelect) {
        var match = null;
        $$('option', packSelect).forEach(function (o) {
          if (!match && o.value && o.textContent.indexOf(wanted) === 0) match = o;
        });
        if (match) packSelect.value = match.value;
      }
      var apply = $('#apply');
      if (apply) {
        e.preventDefault();
        apply.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // м'яка підсвітка поля пакета
        if (packSelect) {
          setTimeout(function () {
            packSelect.focus({ preventScroll: true });
          }, 520);
        }
      }
    });
  });

  /* ============================================================
     ФОРМА
     ============================================================ */
  var form = $('#applyForm');
  if (form) {
    var success = $('#formSuccess');

    var rules = {
      fName:    function (v) { return v.trim().length >= 2; },
      fCompany: function (v) { return v.trim().length >= 2; },
      fPhone:   function (v) { return v.replace(/[^\d]/g, '').length >= 9; },
      fEmail:   function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      fInsta:   function (v) { return v.trim().length >= 2; },
      fPack:    function (v) { return v !== ''; }
    };

    var validateField = function (el) {
      var rule = rules[el.id];
      if (!rule) return true;
      var ok = rule(el.value);
      var fld = el.closest('.fld');
      if (fld) fld.classList.toggle('err', !ok);
      return ok;
    };

    $$('input, select', form).forEach(function (el) {
      el.addEventListener('blur', function () {
        if (el.value) validateField(el);
      });
      el.addEventListener('input', function () {
        var fld = el.closest('.fld');
        if (fld && fld.classList.contains('err')) validateField(el);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstBad = null;
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (!validateField(el) && !firstBad) firstBad = el;
      });

      var consent = $('#fConsent');
      if (consent && !consent.checked) {
        consent.focus();
        return;
      }

      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      /* Відправка: leads.js → Google Таблиця + Telegram менеджерам.
         Екран успіху показуємо одразу — людина не чекає на мережу. */
      var data = {};
      $$('input, select, textarea', form).forEach(function (el) {
        if (!el.name) return;
        if (el.type === 'checkbox') data[el.name] = el.checked ? el.value || 'yes' : '';
        else data[el.name] = el.value;
      });

      if (window.bgSendLead) {
        window.bgSendLead('participant', data).catch(function (err) {
          if (window.console && console.warn) console.warn('[Beauty Games] lead not sent:', err);
        });
      }

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'form_submit', { form: data.page, package: data.package });
      }
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', { content_name: data.package });
      }

      form.style.display = 'none';
      if (success) {
        success.classList.add('on');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* ============================================================
     ПОЯВА ПРИ ПРОКРУТЦІ — з видимого стану, без стрибків
     ============================================================ */
  var reveal = $$('.rv');
  if (!('IntersectionObserver' in window)) {
    reveal.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    reveal.forEach(function (el) {
      // усе, що вже у в'юпорті на старті, показуємо одразу
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('in');
      } else {
        io.observe(el);
      }
    });
  }

  /* ============================================================
     СМУГИ «МІСЦЯ В ПОТОЦІ» — заповнюються при появі
     ============================================================ */
  var fills = $$('.seatrow .fill');
  if (fills.length) {
    fills.forEach(function (f) { f.style.transform = 'scaleX(0)'; });
    var runFills = function () {
      fills.forEach(function (f, i) {
        var w = parseFloat(f.getAttribute('data-w')) || 100;
        f.style.width = w + '%';
        setTimeout(function () { f.style.transform = 'scaleX(1)'; }, 90 * i);
      });
    };
    if ('IntersectionObserver' in window) {
      var barIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          barIO.disconnect();
          runFills();
        });
      }, { threshold: 0.35 });
      barIO.observe(fills[0].closest('.info'));
    } else {
      runFills();
    }
  }

  /* ============================================================
     ЧЕК-ЛИСТ ПРОБЛЕМ
     Людина відмічає своє, і замість загального заголовка отримує
     конкретну відповідь на власний результат.
     ============================================================ */
  var quiz = $('#quiz');
  if (quiz) {
    var boxes = $$('input[data-problem]', quiz);
    var countEl = $('#quizCount');
    var textEl = $('#quizText');
    var ctaEl = $('#quizCta');
    var verdictEl = $('#quizVerdict');
    var resultEl = $('#quizResult');
    var modsEl = $('#quizMods');
    var pickedEl = $('#quizPicked');
    var total = boxes.length;

    // Кожен пункт належить до зони: гроші, ресурс, клієнти, напрямок.
    // Висновок будується не за кількістю галочок, а за тим, яка зона
    // переважає — дві однакові цифри можуть означати різні проблеми.
    // «а, б і в» — з комами і останнім сполучником, як у звичайному тексті
    // Кожен відмічений пункт має своє рішення: показуємо відповідь
    // саме на те, що людина обрала, а не загальний висновок.
    var FIX = {
      "доход есть, но не растёт": "считаем, откуда берётся доход, и убираем то, что его съедает",
      "запись под завязку без выходных": "разгружаем график и отдаём первую часть задач",
      "не вижу реальной прибыли": "считаем себестоимость услуги и ваш час",
      "страшно поднять цену": "поднимаем чек ступенями, со скриптом для постоянных клиентов",
      "нет системы записи": "ставим предоплату и запись следующего визита в кресле",
      "соцсети не дают записей": "переупаковываем профиль и делаем контент, который приводит записи",
      "держу всё на себе": "разбираем, что делегировать первым, и как не потерять качество",
      "не знаю, что дальше": "собираем бизнес-план на год с контрольными точками"
};

    var listify = function (arr) {
      if (arr.length === 1) return arr[0];
      return arr.slice(0, -1).join(', ') + ' и ' + arr[arr.length - 1];
    };

    // Висновок будується не за кількістю галочок, а за тим, яка зона
    // переважає. Кожен закінчується конкретною рекомендацією — що саме
    // робити першим, а не загальним «у вас проблеми».
    var ZONES = {
      gro: {
        t: 'Деньги есть, системы нет',
        p: 'Судя по ответам, вы зарабатываете — но не знаете, сколько на самом деле остаётся. Когда нет учёта и себестоимости, цена ставится «как у всех», а не от вашей экономики.',
        f: 'С чего начать: посчитайте себестоимость одной услуги вместе с расходниками, арендой и своим часом. Дальше поднимайте цену ступенями по 10–15% на новых клиентах, а постоянных переводите с предупреждением за месяц. На сезоне это разбирают первым, потому что результат виден уже через несколько недель.'
      },
      res: {
        t: 'Бизнес держится на вас',
        p: 'Вы — узкое место собственного бизнеса. Пока записи, закупки, реклама и руки замкнуты на одном человеке, потолок упирается в количество часов в сутках, а не в спрос.',
        f: 'С чего начать: выпишите всё, что делаете за неделю, и отметьте то, что не требует именно вас — закупки, ответы в директ, запись. Это первое, что отдаётся администратору или ассистенту на несколько часов в день. Параллельно — работа с состоянием: из выгорания делегировать не получается, потому что «быстрее сделать самой».'
      },
      cli: {
        t: 'Поток неуправляемый',
        p: 'Клиенты приходят волнами: то окна в графике, то отмены в последний момент. Это не вопрос удачи — просто нет системы, которая приводит и удерживает.',
        f: 'С чего начать: введите предоплату или подтверждение за сутки — отмены сокращаются сразу. Дальше запись следующего визита прямо в кресле, это самый дешёвый способ заполнить график. И только потом контент: не «красивые работы», а кейсы «было — стало» с ценой и сроком.'
      },
      dir: {
        t: 'Нет следующего шага',
        p: 'Вы уже умеете многое и хотите большего — салон, команду, обучение. Но без цифр и плана любой следующий шаг выглядит одинаково рискованным, поэтому решение откладывается.',
        f: 'С чего начать: зафиксируйте текущие показатели — средний чек, количество клиентов в месяц, доход. Дальше посчитайте, какое из направлений даёт больше с того же часа вашей работы. Сезон заканчивается заполненным планом на год с контрольными точками по месяцам.'
      },
      mix: {
        t: 'Проблема системная',
        p: 'Вы отметили пункты из разных зон сразу — и деньги, и ресурс, и клиенты. Такие вещи тянут друг друга: без свободных рук не дойдут руки до маркетинга, без потока нет смысла поднимать цену.',
        f: 'С чего начать: не беритесь за всё. Сначала снимите нагрузку — делегируйте самое мелкое. Потом цифры: себестоимость и чек. И только третьим шагом — поток клиентов. Именно в таком порядке построен сезон, и каждый модуль закрывается внедрением, а не конспектом.'
      },
      none: {
        t: 'Отметьте пункты выше',
        p: 'Результат зависит от того, что именно вы выберете.',
        f: ''
      }
    };

    var verdict = function (picked) {
      if (!picked.length) return ZONES.none;

      var tally = {};
      picked.forEach(function (b) {
        var z = b.getAttribute('data-zone');
        tally[z] = (tally[z] || 0) + 1;
      });

      var keys = Object.keys(tally);
      var top = keys.reduce(function (a, b) { return tally[b] > tally[a] ? b : a; });
      var leaders = keys.filter(function (k) { return tally[k] === tally[top]; });

      // Три зони і більше — або кілька зон нарівні — це вже не одна проблема
      if (keys.length >= 3 || leaders.length > 1) return ZONES.mix;
      return ZONES[top];
    };

    var recount = function () {
      var picked = boxes.filter(function (b) { return b.checked; });
      var n = picked.length;
      var v = verdict(picked);

      if (countEl) countEl.textContent = n;
      if (verdictEl) verdictEl.textContent = v.t;
      setPick('pickRowSit', 'pickSit', n ? v.t : '', 'fSit');
      if (textEl) textEl.textContent = v.f ? v.p + ' ' + v.f : v.p;
      if (resultEl) resultEl.classList.toggle('on', n > 0);

      // Повертаємо людині її ж відповіді — щоб було видно, що
      // висновок побудований саме на них, а не показаний навмання.
      if (pickedEl) {
        var tags = picked.map(function (b) { return b.getAttribute('data-tag'); })
                         .filter(Boolean);
        pickedEl.hidden = !tags.length;
        if (tags.length) {
          pickedEl.innerHTML = 'Вы отметили: ' +
            listify(tags.map(function (t) { return '<b>' + t + '</b>'; })) + '.';
        }
      }

      // Рішення саме на те, що відмітили
      var fixEl = $('#quizFix');
      if (fixEl) {
        var fixes = picked.map(function (b) {
          return FIX[b.getAttribute('data-tag')];
        }).filter(Boolean);
        fixEl.hidden = !fixes.length;
        if (fixes.length) {
          fixEl.innerHTML = '<span class="quiz-fix-k">Что с этим делаем на сезоне</span><ul>' +
            fixes.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>';
        }
      }

      // Модулі, які закривають саме ці пункти
      if (modsEl) {
        var mods = [];
        picked.forEach(function (b) {
          var m = b.getAttribute('data-mod');
          if (m && mods.indexOf(m) < 0) mods.push(m);
        });
        mods.sort();
        modsEl.hidden = !mods.length;
        if (mods.length) {
          modsEl.innerHTML = (mods.length === 1 ? 'Это закрывает модуль ' : 'Это закрывают модули ') +
            listify(mods.map(function (m) { return '<b>' + m + '</b>'; })) +
            ' бизнес-программы.';
        }
      }

      if (ctaEl) ctaEl.hidden = n < 1;
      if (n > 0) document.dispatchEvent(new CustomEvent('bg:quiz', { detail: { verdict: v.t } }));
    };

    boxes.forEach(function (b) { b.addEventListener('change', recount); });
    recount();
  }

  /* ============================================================
     ШЛЯХ ПО ЕТАПАХ
     Етапи не просто перелічені — їх проходять. Пройдені вузли
     лишаються підсвіченими, смуга показує, скільки вже позаду.
     ============================================================ */
  var path = $('#path');
  if (path) {
    var nodes = $$('.pnode', path);
    var steps = $$('.pstep', path);
    var fill = $('#pathFill');
    var pos = $('#pathPos');
    var runner = $('#pathRunner');
    var hearts = $$('.path-heart', path);
    var prev = $('#pathPrev');
    var next = $('#pathNext');
    var cur = 0;
    var seen = 0;               // найдальший етап, якого дійшли

    var show = function (i) {
      cur = Math.max(0, Math.min(steps.length - 1, i));
      if (cur > seen) seen = cur;

      nodes.forEach(function (n, k) {
        n.classList.toggle('on', k === cur);
        n.classList.toggle('done', k < cur || (k <= seen && k !== cur));
        n.setAttribute('aria-selected', k === cur ? 'true' : 'false');
      });
      steps.forEach(function (p, k) { p.classList.toggle('on', k === cur); });

      var pctDone = cur / (steps.length - 1) * 100;
      if (fill) fill.style.width = pctDone + '%';
      if (runner) {
        runner.style.left = pctDone + '%';
        var meN = $('#pathMeN', runner);
        if (meN) meN.textContent = '0' + (cur + 1);
      }

      // Сердечка розставлені під етапами; пройдені — зібрані
      hearts.forEach(function (hrt, k) {
        hrt.style.left = (k / (steps.length - 1) * 100) + '%';
        hrt.classList.toggle('got', k <= cur);
      });
      if (pos) pos.textContent = cur + 1;
      if (cur === steps.length - 1) document.dispatchEvent(new CustomEvent('bg:path-end'));
      if (prev) prev.disabled = cur === 0;
      if (next) {
        next.textContent = cur === steps.length - 1 ? 'К заявке →' : 'Дальше →';
      }
    };

    nodes.forEach(function (n) {
      n.addEventListener('click', function () { show(+n.getAttribute('data-step')); });
    });
    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () {
      if (cur === steps.length - 1) {
        var apply = $('#apply');
        if (apply) apply.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      show(cur + 1);
    });

    show(0);
  }

  /* ============================================================
     ВИБІР ПЕРСОНАЖА
     Обраний напрямок запам'ятовується і підставляється у форму,
     тож менеджер одразу бачить, з ким має справу.
     ============================================================ */
  /* ============================================================
     КРОК 1 — ЗНАЙОМСТВО
     Ім'я й досвід збираються на початку: далі сторінка звертається
     на ім'я, а наприкінці все складається в досьє гравця.
     ============================================================ */
  var hello = $('#hello');
  if (hello) {
    var nameIn = $('#heroName');
    var expBtns = $$('.expo', hello);
    var formName = $('#fName');

    var syncName = function (silent) {
      var v = (nameIn && nameIn.value || '').trim();
      if (formName && v && !formName.value) formName.value = v;
      setPick('pickRowName', 'pickName', v);
      if (window.bgPaintWho) window.bgPaintWho();
      store.set('bg_name', v);
      if (v && !silent) document.dispatchEvent(new CustomEvent('bg:hello', { detail: { name: v } }));
    };

    if (nameIn) {
      nameIn.addEventListener('input', function () { syncName(true); });
      nameIn.addEventListener('change', function () { syncName(); });
      nameIn.addEventListener('blur', function () { syncName(); });
    }

    expBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var already = b.classList.contains('on');
        expBtns.forEach(function (x) { x.classList.remove('on'); });
        if (already) {
          setPick('pickRowExp', 'pickExp', '', 'fExp');
          store.set('bg_exp', '');
          return;
        }
        b.classList.add('on');
        var v = b.getAttribute('data-exp');
        setPick('pickRowExp', 'pickExp', v, 'fExp');
        store.set('bg_exp', v);
        document.dispatchEvent(new CustomEvent('bg:hello'));
      });
    });

    var savedName = store.get('bg_name');
    if (savedName && nameIn) { nameIn.value = savedName; syncName(true); }
    var savedExp = store.get('bg_exp');
    if (savedExp) {
      expBtns.forEach(function (b) {
        if (b.getAttribute('data-exp') === savedExp) b.classList.add('on');
      });
      setPick('pickRowExp', 'pickExp', savedExp, 'fExp');
    }
  }

  var picker = $('#picker');
  if (picker) {
    var chrs = $$('.chr', picker);
    var done = $('#pickerDone');
    var doneName = $('#pickerName');
    var doneLead = $('#pickerLead');
    var dirField = $('#fDir');

    // Майстер часто працює в кількох напрямках: бровистка може ще
    // робити макіяж. Тому вибір множинний, а не один із списку.
    var chosen = [];

    var listify = function (arr) {
      if (arr.length === 1) return arr[0];
      return arr.slice(0, -1).join(', ') + ' и ' + arr[arr.length - 1];
    };

    var paint = window.bgPaintWho = function (silent) {
      var heroes = [], full = [];
      chrs.forEach(function (c) {
        var on = chosen.indexOf(c.getAttribute('data-dir')) > -1;
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) {
          heroes.push(c.getAttribute('data-hero') || c.getAttribute('data-dir'));
          full.push(c.getAttribute('data-form') || c.getAttribute('data-dir'));
        }
      });

      if (done) done.hidden = !chosen.length;
      if (doneName) doneName.textContent = listify(heroes);
      if (doneLead) {
        doneLead.firstChild.nodeValue =
          'Ваши скилы — ';
      }
      if (dirField) dirField.value = full.join(', ');

      // Крок 3 показує, кого обрали, і типові задачі напрямку
      var whoName = $('#forkWhoName');
      var whoPain = $('#forkWhoPain');
      var whoBack = $('#forkWhoBack');
      var who = $('#forkWho');
      if (whoName && whoPain) {
        var picked = chrs.filter(function (c) {
          return chosen.indexOf(c.getAttribute('data-dir')) > -1;
        });
        if (picked.length) {
          var roles = listify(picked.map(function (c) {
            return c.getAttribute('data-hero') || c.getAttribute('data-dir');
          }));
          var nm = (store.get('bg_name') || '').trim();
          var exp = (store.get('bg_exp') || '').trim();
          whoName.textContent = (nm ? nm + ', ваши скилы — ' : 'Ваши скилы — ') + roles;
          var whoExp = $('#forkWhoExp');
          if (whoExp) {
            whoExp.textContent = exp ? exp + ' в beauty' : '';
            whoExp.hidden = !exp;
          }
          whoPain.innerHTML = picked.map(function (c) {
            return '<span>' + (c.getAttribute('data-pain') || '') + '</span>';
          }).join('');
          if (whoBack) whoBack.hidden = true;
          if (who) who.classList.add('on');
        } else {
          whoName.textContent = 'Выберите свои скилы в шаге 2';
          var whoExpOff = $('#forkWhoExp');
          if (whoExpOff) whoExpOff.hidden = true;
          whoPain.textContent = 'Тогда покажем, какие задачи типичны именно для вашего направления.';
          if (whoBack) whoBack.hidden = false;
          if (who) who.classList.remove('on');
        }
      }
      setPick('pickRowDir', 'pickDir', full.join(', '));

      var pTitle = $('#pickerTitle');
      if (pTitle) {
        var nm2 = (store.get('bg_name') || '').trim();
        pTitle.textContent = nm2 ? nm2 + ', выберите свои скилы' : 'Выберите свои скилы';
      }

      store.set('bg_character', chosen.join('|'));
      if (!silent) {
        document.dispatchEvent(new CustomEvent('bg:character', { detail: { dirs: chosen.slice() } }));
      }
    };

    var toggle = function (dir) {
      var i = chosen.indexOf(dir);
      if (i > -1) chosen.splice(i, 1); else chosen.push(dir);
      paint();
    };

    chrs.forEach(function (c) {
      c.setAttribute('aria-pressed', 'false');
      c.addEventListener('click', function () { toggle(c.getAttribute('data-dir')); });
    });

    var saved = store.get('bg_character');
    if (saved) {
      chosen = saved.split('|').filter(function (d) {
        return chrs.some(function (c) { return c.getAttribute('data-dir') === d; });
      });
      paint(true);
    }
  }

  /* ============================================================
     РОЗВИЛКА ФОРМАТУ
     Замість «ось два варіанти, розбирайтесь самі» — питання і
     відповідь. Обрана дорога підсвічується нижче.
     ============================================================ */
  var fork = $('#fork');
  if (fork) {
    var forkOut = $('#forkOut');
    var forkName = $('#forkName');
    var forkText = $('#forkText');
    // Три місії — три шляхи, один до одного. Підсвічуємо той,
    // що відповідає обраній місії, але інші лишаються видимими:
    // вибір за людиною.
    var ANSW = {
      money: {
        n: 'Путь 1 — только бизнес-обучение',
        t: 'Вы здесь за деньгами, и это честный ответ. Берите обучение без шоу: девять модулей, куратор, домашние задания с проверкой. Выходите с поднятым чеком, налаженным потоком и планом на год — без камер и публичности.',
        w: 0
      },
      fame: {
        n: 'Путь 2 — обучение и чемпионат',
        t: 'Чтобы вас заметили в профессии, нужен не только красивый профиль, а подтверждённый уровень. Чемпионат даёт звание, кубок и оценку жюри из практиков — это то, что видно с первого экрана вашего профиля и что можно заложить в прайс.',
        w: 1
      },
      both: {
        n: 'Путь 3 — обучение, чемпионат и реалити-шоу',
        t: 'Именно под это сезон и сделан. За три месяца вы поднимаете чек, берёте звание в чемпионате и одновременно набираете аудиторию: эфиры, съёмки, голосование зрителей. Выходите не просто с бизнесом, а с бизнесом, о котором знают.',
        w: 2
      }
    };

    $$('.fork-o', fork).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = ANSW[b.getAttribute('data-pick')];
        if (!a) return;
        $$('.fork-o', fork).forEach(function (x) { x.classList.toggle('on', x === b); });
        if (forkName) forkName.textContent = a.n;
        if (forkText) forkText.textContent = a.t;
        if (forkOut) forkOut.hidden = false;
        $$('.way').forEach(function (w, i) { w.classList.toggle('pick', i === a.w); });
        // <br> у підписі не дає пробілу — інакше виходило «І те,і інше»
        var nm = $('.fork-o-nm', b);
        var nmTx = nm ? nm.innerHTML.replace(/<br\s*\/?>/gi, ' ')
                                    .replace(/<[^>]*>/g, '')
                                    .replace(/\s+/g, ' ').trim() : '';
        setPick('pickRowGoal', 'pickGoal', nmTx, 'fGoal');
        setPick('pickRowFmt', 'pickFmt', a.n, 'fFormat');
        document.dispatchEvent(new CustomEvent('bg:fork', { detail: { name: a.n } }));
      });
    });
  }

  /* ============================================================
     ПРОГРЕС ПО СТОРІНЦІ
     Крапки-віхи збоку: заповнюються в міру прокрутки, поточна
     підсвічується. Дає відчуття руху по грі, а не гортання сайту.
     ============================================================ */
  var prog = $('#prog');
  if (prog) {
    var dots = $$('.prog-dot', prog);
    var progFill = $('#progFill');
    var targets = dots.map(function (d) {
      return document.getElementById(d.getAttribute('href').slice(1));
    });

    var syncProg = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      if (progFill) progFill.style.height = pct + '%';

      // поточним вважаємо останній блок, верх якого вже пройшов середину екрана
      var cur = -1;
      targets.forEach(function (t, i) {
        if (t && t.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = i;
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('done', i < cur);
        d.classList.toggle('on', i === cur);
      });
      prog.classList.toggle('show', window.scrollY > 240);
    };

    window.addEventListener('scroll', syncProg, { passive: true });
    window.addEventListener('resize', syncProg);
    syncProg();

    // Пройдений крок позначається золотом і лишається таким: видно,
    // що саме ви вже зробили, а не просто до чого догортали.
    // Пройдений крок підтверджуємо коротким сповіщенням: без відгуку
    // людина не помічає, що щось зарахувалось.
    var toast = function (txt) {
      var t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = '<b>Записали в вашу карту</b><span>' + txt + '</span>';
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('in'); });
      setTimeout(function () {
        t.classList.remove('in');
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
      }, 2400);
    };

    // Сповіщення показує саме те, що записали, а не абстрактне
    // «крок зараховано»: людина має бачити своє значення.
    var markStep = function (href, value) {
      var fresh = false;
      dots.forEach(function (d) {
        if (d.getAttribute('href') !== href) return;
        if (!d.classList.contains('hit')) fresh = true;
        d.classList.add('hit');
      });
      if (value) toast(value);
    };
    document.addEventListener('bg:character', function (e) {
      var d = (e.detail && e.detail.dirs) || [];
      markStep('#picker', d.length ? d.join(', ') : '');
    });
    document.addEventListener('bg:quiz', function (e) {
      markStep('#about', (e.detail && e.detail.verdict) || '');
    });
    document.addEventListener('bg:hello', function (e) {
      markStep('#hello', (e.detail && e.detail.name) || '');
    });
    document.addEventListener('bg:fork', function (e) {
      markStep('#format', (e.detail && e.detail.name) || '');
    });
    document.addEventListener('bg:path-end', function () { markStep('#how', ''); });
  }

  /* ============================================================
     ВІДЕО З YOUTUBE
     Показуємо превʼю, а плеєр підвантажуємо тільки за кліком:
     три вбудовані ролики тягнуть за собою мегабайти скриптів,
     і сторінка відкривалася б помітно довше.
     ============================================================ */
  $$('.ytv').forEach(function (card) {
    card.addEventListener('click', function () {
      var id = card.getAttribute('data-yt');
      if (!id || card.classList.contains('playing')) return;

      var box = $('.ytv-ph', card);
      if (!box) return;

      var fr = document.createElement('iframe');
      fr.src = 'https://www.youtube-nocookie.com/embed/' + id +
               '?autoplay=1&rel=0&modestbranding=1';
      fr.title = card.getAttribute('aria-label') || 'YouTube';
      fr.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
      fr.allowFullscreen = true;
      fr.loading = 'lazy';

      box.innerHTML = '';
      box.appendChild(fr);
      card.classList.add('playing');
    });
  });

  /* ============================================================
     ПЛАВНА ПРОКРУТКА З УРАХУВАННЯМ ЛИПКОЇ ШАПКИ
     ============================================================ */
  var HEAD = 92;   // висота липкої шапки

  // Сторінка довга, і поки триває плавна прокрутка, блоки нижче
  // встигають проявитись і зрушити розкладку — кнопка приземлялася
  // не там. Тому після зупинки перевіряємо позицію і дотягуємо.
  var scrollToTarget = function (target) {
    var go = function () {
      return target.getBoundingClientRect().top + window.scrollY - HEAD;
    };
    window.scrollTo({ top: go(), behavior: 'smooth' });

    var last = -1, still = 0;
    var settle = setInterval(function () {
      var y = Math.round(window.scrollY);
      if (y === last) { still++; } else { still = 0; last = y; }
      if (still < 3) return;
      clearInterval(settle);
      var off = target.getBoundingClientRect().top - HEAD;
      if (Math.abs(off) > 4) window.scrollTo({ top: go() });
    }, 60);
    setTimeout(function () { clearInterval(settle); }, 3000);
  };

  $$('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#' || a.classList.contains('js-pick')) return;
    a.addEventListener('click', function (e) {
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
    });
  });

})();
