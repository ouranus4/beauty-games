/* ============================================================
   BEAUTY GAMES 2026 — інтерактив
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ============================================================
     ПРЕЛОАДЕР
     Ховається CSS-анімацією сам по собі, тож навіть якщо цей скрипт
     не виконається — сторінка не залишиться перекритою. Тут лише
     прибираємо його з DOM, щоб не заважав кліку.
     ============================================================ */
  /* ============================================================
     ВХІДНИЙ ЕКРАН
     Спершу смуга завантаження за реальним прогресом ресурсів,
     далі вікно «Почати гру?». Далі — тільки за кліком користувача,
     тому автозапуск звуку після цього дозволений браузером.
     ============================================================ */
  var preloader = document.getElementById('preloader');
  if (preloader) {
    var bar = document.getElementById('plBar');
    var pct = document.getElementById('plPct');
    var stage = document.getElementById('plStage');
    var startPane = document.getElementById('plStart');
    var goBtn = document.getElementById('plGo');
    var value = 0, barTimer = null, t0 = Date.now(), armed = false;

    var paint = function (v) {
      value = Math.max(value, Math.min(100, v));
      if (bar) bar.style.width = value + '%';
      if (pct) pct.textContent = Math.round(value) + '%';
    };

    var hide = function () {
      preloader.classList.add('done');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 420);
    };

    var offerStart = function () {
      if (armed) return;
      armed = true;
      if (barTimer) { clearInterval(barTimer); barTimer = null; }
      paint(100);
      setTimeout(function () {
        if (stage) stage.hidden = true;
        if (startPane) startPane.hidden = false;
        if (goBtn) goBtn.focus({ preventScroll: true });
      }, 320);
    };

    document.body.style.overflow = 'hidden';

    // Мінімальний час показу. Раніше смуга рахувалася від кількості
    // завантажених файлів і на швидкому з'єднанні долітала до кінця
    // за перший тик — екран завантаження ніхто не встигав побачити.
    var MIN = 2200;

    barTimer = setInterval(function () {
      var elapsed = Date.now() - t0;
      var byTime = (elapsed / MIN) * 100;
      paint(Math.min(97, byTime));
      if (elapsed >= MIN && document.readyState === 'complete') offerStart();
    }, 50);

    window.addEventListener('load', function () {
      setTimeout(offerStart, Math.max(0, MIN - (Date.now() - t0)));
    });
    setTimeout(offerStart, 7000);   // страховка, якщо load не настане

    if (goBtn) goBtn.addEventListener('click', function () {
      hide();
      document.dispatchEvent(new CustomEvent('bg:start'));
    });
  }

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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
          lbl.innerHTML = '<b>Спеціальна ціна 24 годин завершилась.</b> Діє ціна тижня — напишіть менеджеру, щоб зафіксувати її за собою.';
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
      if (allBtn) allBtn.textContent = n === items.length ? 'Згорнути всі' : 'Відкрити всі';
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

      /* ------------------------------------------------------------
         ВІДПРАВКА ЗАЯВКИ

         Хостинг — Netlify, заявки приймає Netlify Forms: форма у розмітці
         має name, data-netlify і приховане поле form-name, тому окремий
         бекенд не потрібен і жодні токени в браузер не потрапляють.
         Заявки видно в Netlify → Forms; там же налаштовуються сповіщення
         на пошту, у Slack або на вебхук.

         Наступний крок — Telegram і CRM: у Netlify → Forms → Notifications
         додати outgoing webhook на сценарій Make (або на власну функцію),
         який створює угоду в CRM і пише менеджеру в Telegram.

         Поза Netlify (локально, GitHub Pages) запит не пройде — і це
         нормально: користувач усе одно бачить екран успіху й кнопку
         в Telegram, а помилка тихо йде в консоль.
      ------------------------------------------------------------ */
      var data = {};
      $$('input, select, textarea', form).forEach(function (el) {
        if (!el.name) return;
        if (el.type === 'checkbox') data[el.name] = el.checked ? el.value || 'yes' : '';
        else data[el.name] = el.value;
      });
      data.page = document.documentElement.getAttribute('data-page') || '';
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
          if (window.console && console.warn) {
            console.warn('[Beauty Games] Заявку не відправлено (хостинг без Netlify Forms):', err);
          }
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
    var listify = function (arr) {
      if (arr.length === 1) return arr[0];
      return arr.slice(0, -1).join(', ') + ' і ' + arr[arr.length - 1];
    };

    var ZONES = {
      gro: {
        t: 'Гроші не затримуються',
        p: 'Це говорить про те, що ви заробляєте, але гроші не перетворюються на результат: немає обліку, а ціна нижча за вашу реальну вартість.',
        f: 'На сезоні це розбирають першим: рахуємо собівартість вашої години, піднімаємо чек покроково і ставимо облік, який реально ведеться. Чек зазвичай зростає вже під час проєкту.'
      },
      res: {
        t: 'Ви — вузьке місце',
        p: 'Це говорить про те, що бізнес тримається на ваших руках і ваших силах. Поки все замкнено на вас, зростати нема куди — більше годин у добі не стане.',
        f: 'Тому сезон починається не з таблиць, а з психолога проєкту: спершу стан, потім делегування і перший помічник. Без цього жоден інструмент не вмикається.'
      },
      cli: {
        t: 'Потік некерований',
        p: 'Це говорить про те, що клієнти приходять випадково, а не за системою: незрозуміло, хто ваш клієнт, що ви йому показуєте і де він вас знаходить.',
        f: 'На сезоні збираємо лінійку послуг під конкретного клієнта, переупаковуємо профіль і запускаємо контент, який приводить записи, а не лайки.'
      },
      dir: {
        t: 'Немає напрямку',
        p: 'Це говорить про те, що ви вже вмієте багато, але не бачите наступного кроку. Без стратегії будь-який інструмент працює навмання.',
        f: 'Сезон закінчується заповненим бізнес-планом на рік: точки зростання, контрольні точки по місяцях і рішення, куди рухатись — салон, студія, школа чи онлайн.'
      },
      mix: {
        t: 'Проблема системна',
        p: 'Це говорить про те, що справа не в одному місці: у вас одночасно і гроші, і ресурс, і клієнти. Такі речі тягнуть одне одного — тому поодинокий курс тут не спрацьовує.',
        f: 'Сезон побудований саме під це: чотири місяці, де стан, гроші, клієнти і стратегія закриваються паралельно, з куратором і обов’язковим впровадженням.'
      },
      none: {
        t: 'Відмітьте пункти вище',
        p: 'Результат залежить від того, що саме ви оберете.',
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
      if (textEl) textEl.textContent = v.f ? v.p + ' ' + v.f : v.p;
      if (resultEl) resultEl.classList.toggle('on', n > 0);

      // Повертаємо людині її ж відповіді — щоб було видно, що
      // висновок побудований саме на них, а не показаний навмання.
      if (pickedEl) {
        var tags = picked.map(function (b) { return b.getAttribute('data-tag'); })
                         .filter(Boolean);
        pickedEl.hidden = !tags.length;
        if (tags.length) {
          pickedEl.innerHTML = 'Ви відмітили: ' +
            listify(tags.map(function (t) { return '<b>' + t + '</b>'; })) + '.';
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
          modsEl.innerHTML = (mods.length === 1 ? 'Це закриває модуль ' : 'Це закривають модулі ') +
            listify(mods.map(function (m) { return '<b>' + m + '</b>'; })) +
            ' бізнес-програми.';
        }
      }

      if (ctaEl) ctaEl.hidden = n < 1;
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
      if (runner) runner.style.left = pctDone + '%';

      // Сердечка розставлені під етапами; пройдені — зібрані
      hearts.forEach(function (hrt, k) {
        hrt.style.left = (k / (steps.length - 1) * 100) + '%';
        hrt.classList.toggle('got', k <= cur);
      });
      if (pos) pos.textContent = cur + 1;
      if (prev) prev.disabled = cur === 0;
      if (next) {
        next.textContent = cur === steps.length - 1 ? 'До заявки →' : 'Далі →';
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
  var picker = $('#picker');
  if (picker) {
    var chrs = $$('.chr', picker);
    var done = $('#pickerDone');
    var doneName = $('#pickerName');
    var dirSelect = $('#fDir');

    var choose = function (dir, silent) {
      var card = null;
      chrs.forEach(function (c) {
        var on = c.getAttribute('data-dir') === dir;
        c.classList.toggle('on', on);
        if (on) card = c;
      });
      if (done && doneName) {
        doneName.textContent = (card && card.getAttribute('data-hero')) || dir;
        done.hidden = false;
      }
      if (dirSelect) {
        // На картці підпис коротший, ніж у списку форми
        // («Перманент» проти «Перманентний макіяж») — беремо повну назву.
        var full = (card && card.getAttribute('data-form')) || dir;
        var hit = null;
        $$('option', dirSelect).forEach(function (o) { if (o.textContent.trim() === full) hit = o; });
        if (hit) dirSelect.value = hit.value;
      }
      store.set('bg_character', dir);
      if (!silent) document.dispatchEvent(new CustomEvent('bg:character', { detail: { dir: dir } }));
    };

    chrs.forEach(function (c) {
      c.addEventListener('click', function () { choose(c.getAttribute('data-dir')); });
    });

    var saved = store.get('bg_character');
    if (saved) choose(saved, true);
  }

  /* ============================================================
     ПРОФІЛІ ЕКСПЕРТІВ І ПАРТНЕРІВ
     Картка показує головне, повний текст відкривається у вікні.
     Текст лежить у розмітці — його видно пошуковикам і він
     доступний, навіть якщо скрипт не завантажився.
     ============================================================ */
  var bioModal = $('#bioModal');
  if (bioModal) {
    var bioTx = $('#bioTx');
    var bioPhoto = $('#bioPhoto');
    var bioBack = null;          // елемент, якому повертаємо фокус

    var closeBio = function () {
      bioModal.hidden = true;
      document.body.classList.remove('bio-open');
      if (bioTx) bioTx.innerHTML = '';
      if (bioBack) { bioBack.focus(); bioBack = null; }
    };

    var openBio = function (card) {
      var src = document.getElementById(card.getAttribute('data-bio'));
      if (!src || !bioTx) return;

      bioBack = card;
      bioTx.innerHTML = src.innerHTML;

      var img = $('img', card);
      if (bioPhoto && img) {
        bioPhoto.src = img.getAttribute('src');
        bioPhoto.alt = img.getAttribute('alt') || '';
        bioPhoto.classList.toggle('is-logo', img.classList.contains('is-logo'));
      }

      var nm = $('.bio-nm', bioTx);
      if (nm) nm.id = 'bioTitle';

      bioModal.hidden = false;
      document.body.classList.add('bio-open');
      if (bioTx) bioTx.scrollTop = 0;
      var x = $('.bio-x', bioModal);
      if (x) x.focus();
    };

    $$('.pcard').forEach(function (card) {
      card.addEventListener('click', function () { openBio(card); });
    });

    $$('[data-bio-close]', bioModal).forEach(function (el) {
      el.addEventListener('click', closeBio);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !bioModal.hidden) closeBio();
    });
  }

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
