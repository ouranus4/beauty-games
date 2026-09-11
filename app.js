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
  var preloader = document.getElementById('preloader');
  if (preloader) {
    var killPreloader = function () {
      preloader.classList.add('done');
      setTimeout(function () {
        if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 500);
    };
    // мінімум показу, щоб анімація не обривалася на швидкому з'єднанні
    var shown = Date.now();
    window.addEventListener('load', function () {
      var left = Math.max(0, 1250 - (Date.now() - shown));
      setTimeout(killPreloader, left);
    });
    // страховка на випадок, якщо load так і не настане
    setTimeout(killPreloader, 4000);
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
  $$('.acc').forEach(function (acc) {
    $$('.acc-item', acc).forEach(function (item) {
      var btn = $('.acc-btn', item);
      var panel = $('.acc-panel', item);
      if (!btn || !panel) return;

      btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');

        // закриваємо сусідів у межах цього акордеона
        $$('.acc-item.open', acc).forEach(function (other) {
          if (other === item) return;
          other.classList.remove('open');
          var op = $('.acc-panel', other);
          var ob = $('.acc-btn', other);
          if (op) op.style.maxHeight = '';
          if (ob) ob.setAttribute('aria-expanded', 'false');
        });

        if (isOpen) {
          item.classList.remove('open');
          panel.style.maxHeight = '';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

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
