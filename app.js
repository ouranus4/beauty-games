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

    barTimer = setInterval(function () {
      var byTime = Math.min(94, (Date.now() - t0) / 14);
      var res = performance.getEntriesByType ? performance.getEntriesByType('resource').length : 0;
      var byRes = Math.min(94, res * 8);
      paint(Math.max(byTime, byRes));
      if (value >= 94 && document.readyState === 'complete') offerStart();
    }, 80);

    window.addEventListener('load', function () {
      setTimeout(offerStart, Math.max(0, 900 - (Date.now() - t0)));
    });
    setTimeout(offerStart, 5000);   // страховка, якщо load не настане

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
    var total = boxes.length;

    var verdict = function (n) {
      if (n === 0) return {
        t: 'Відмітьте пункти вище',
        p: 'Щойно ви щось відмітите, тут з’явиться діагноз ситуації.'
      };
      if (n <= 2) return {
        t: 'Точковий запит',
        p: 'Дві точки зростання — це вже конкретне завдання, а не туман. На програмі їх розбирають по черзі, з домашкою і куратором.'
      };
      if (n <= 5) return {
        t: 'Робота без системи',
        p: 'Половина списку — і жоден пункт не про лінь. Так виглядає бізнес без системи: сил багато, а куди вони йдуть — незрозуміло.'
      };
      return {
        t: 'Це вже вигорання',
        p: 'Стільки пунктів разом — це не втома, а вигорання. Тому сезон починається не з таблиць, а з психолога: спершу стан, потім бізнес.'
      };
    };

    var recount = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      var v = verdict(n);
      if (countEl) countEl.textContent = n;
      if (verdictEl) verdictEl.textContent = v.t;
      if (textEl) textEl.textContent = v.p;
      if (resultEl) resultEl.classList.toggle('on', n > 0);
      if (ctaEl) ctaEl.hidden = n < 2;
    };

    boxes.forEach(function (b) { b.addEventListener('change', recount); });
    recount();
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
     ПЛАВНА ПРОКРУТКА З УРАХУВАННЯМ ЛИПКОЇ ШАПКИ
     ============================================================ */
  $$('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#' || a.classList.contains('js-pick')) return;
    a.addEventListener('click', function (e) {
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

})();
