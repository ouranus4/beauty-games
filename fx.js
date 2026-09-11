/* ============================================================
   BEAUTY GAMES 2026 — звук і текстові ефекти

   Звук синтезується через Web Audio API — жодних аудіофайлів.
   Вимкнений за замовчуванням: браузери блокують автоплей,
   а сайт часто відкривають у дорозі або поруч із клієнтом.
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. ЗВУКОВИЙ РУШІЙ
     ============================================================ */
  var AC = null, master = null, shimmer = null;
  var soundOn = store.get('bg_sound') === 'on';

  function ensureAudio() {
    if (AC) return AC;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      AC = new Ctx();
    } catch (e) { return null; }

    // iOS: без цього перемикач беззвучного режиму глушить Web Audio.
    // Підтримується з Safari 16.4, у решті браузерів просто відсутнє.
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) {}

    master = AC.createGain();
    master.gain.value = 1.0;
    master.connect(AC.destination);

    // шимер-шина: коротка затримка з фільтром — дає «скляну» глибину
    var d = AC.createDelay(0.6);
    d.delayTime.value = 0.105;
    var fb = AC.createGain(); fb.gain.value = 0.24;
    var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    var wet = AC.createGain(); wet.gain.value = 0.42;
    d.connect(fb); fb.connect(lp); lp.connect(d);
    d.connect(wet); wet.connect(master);
    shimmer = d;

    return AC;
  }

  /* Контекст може заснути сам: iOS присипляє його після дзвінка,
     блокування екрана чи перемикання вкладки. Не мовчимо — будимо. */
  function awake(ac) {
    if (!ac) return false;
    if (ac.state === 'running') return true;
    if (ac.resume) { try { ac.resume(); } catch (e) {} }
    return ac.state === 'running';
  }

  function tone(o) {
    if (!soundOn) return;
    var ac = ensureAudio();
    if (!awake(ac)) return;

    var t0 = ac.currentTime + (o.delay || 0);
    var dur = o.dur || 0.12;
    var osc = ac.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);

    var g = ac.createGain();
    var peak = Math.max(0.0002, (o.gain || 0.05));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(master);
    if (o.space && shimmer) g.connect(shimmer);

    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  var noiseBuf = null;
  function noise(o) {
    if (!soundOn) return;
    var ac = ensureAudio();
    if (!awake(ac)) return;

    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
      var ch = noiseBuf.getChannelData(0);
      for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }

    var t0 = ac.currentTime + (o.delay || 0);
    var dur = o.dur || 0.2;

    var src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;

    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = o.q || 1.1;
    bp.frequency.setValueAtTime(o.f || 900, t0);
    if (o.to) bp.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);

    var g = ac.createGain();
    var peak = Math.max(0.0002, (o.gain || 0.02));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(bp); bp.connect(g); g.connect(master);
    if (o.space && shimmer) g.connect(shimmer);

    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  /* ---------- палітра звуків ---------- */
  /* Характер звуку — як в інтерфейсі The Sims: тепла маримба замість
     сухих сигналів. Кожна нота — синус із трьома обертонами, м'якою
     атакою і довгим хвостом, плюс легкий підйом висоти на початку.
     Ноти беремо з мажорної пентатоніки, тому будь-яке поєднання
     звучить злагоджено, хоч би скільки їх наклалося. */
  function mallet(o) {
    var f = o.f, g = o.gain || 0.12, d = o.dur || 0.5, dl = o.delay || 0;
    // основний тон з легким підйомом — це дає «дерев'яний» відтінок
    tone({ f: f * 0.995, to: f, dur: d, gain: g, type: 'sine', attack: 0.012, delay: dl, space: true });
    // обертони роблять тембр маримби, а не писку
    tone({ f: f * 2.01, dur: d * 0.55, gain: g * 0.3,  type: 'sine', attack: 0.008, delay: dl, space: true });
    tone({ f: f * 3.02, dur: d * 0.28, gain: g * 0.12, type: 'sine', attack: 0.006, delay: dl });
    // короткий призвук удару
    tone({ f: f * 5.4,  dur: 0.05,     gain: g * 0.09, type: 'triangle', delay: dl });
  }

  // мажорна пентатоніка від до: до · ре · мі · соль · ля
  var P = { c: 523.25, d: 587.33, e: 659.25, g: 783.99, a: 880.00,
            c2: 1046.50, d2: 1174.66, e2: 1318.51, g2: 1567.98, a2: 1760.00 };

  var SFX = {
    hover:  function () { mallet({ f: P.a2, dur: 0.22, gain: 0.035 }); },
    tap:    function () { mallet({ f: P.e2, dur: 0.5,  gain: 0.13 }); },
    open:   function () { mallet({ f: P.g,  dur: 0.5,  gain: 0.12 });
                          mallet({ f: P.d2, dur: 0.45, gain: 0.08, delay: 0.06 }); },
    close:  function () { mallet({ f: P.d2, dur: 0.4,  gain: 0.1 });
                          mallet({ f: P.g,  dur: 0.44, gain: 0.08, delay: 0.06 }); },
    tab:    function () { mallet({ f: P.c2, dur: 0.36, gain: 0.1 }); },
    field:  function () { mallet({ f: P.g2, dur: 0.22, gain: 0.05 }); },
    swoosh: function () { noise({ f: 2800, to: 320, dur: 0.5, gain: 0.04, q: 0.7, space: true }); },
    tick:   function () { mallet({ f: P.e2, dur: 0.12, gain: 0.05 }); },

    // вибір пакета — весела висхідна фраза
    pick: function () {
      [P.c, P.e, P.g, P.c2].forEach(function (f, i) {
        mallet({ f: f, dur: 0.6, gain: 0.13, delay: i * 0.075 });
      });
    },
    // відправлена заявка — довша фраза з розкриттям
    success: function () {
      [P.c, P.e, P.g, P.a, P.c2, P.e2].forEach(function (f, i) {
        mallet({ f: f, dur: 1.1, gain: 0.12, delay: i * 0.085 });
      });
      noise({ f: 1400, to: 5000, dur: 0.8, gain: 0.02, q: 0.6, delay: 0.16, space: true });
    },
    // помилка — м'яка низхідна пара, без різкості
    error: function () {
      mallet({ f: P.d, dur: 0.42, gain: 0.13 });
      mallet({ f: 440, dur: 0.5, gain: 0.12, delay: 0.1 });
    },
    on: function () {
      [P.g, P.c2, P.e2].forEach(function (f, i) {
        mallet({ f: f, dur: 0.7, gain: 0.13, delay: i * 0.08 });
      });
    },
    off: function () {
      [P.e2, P.c2, P.g].forEach(function (f, i) {
        mallet({ f: f, dur: 0.5, gain: 0.11, delay: i * 0.07 });
      });
    }
  };

  /* ============================================================
     2. ПЕРЕМИКАЧ ЗВУКУ
     ============================================================ */
  function buildToggle() {
    var btn = document.createElement('button');
    btn.className = 'sfx-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Звукові ефекти');
    btn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    btn.innerHTML = '<span class="bars"><i></i><i></i><i></i><i></i></span>';
    return btn;
  }

  function applyState(btn) {
    btn.classList.toggle('on', soundOn);
    btn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    btn.title = soundOn ? 'Вимкнути звук' : 'Увімкнути звук';
  }

  var toggles = [];

  /* iOS вимагає, щоб звук стартував усередині самого обробника дотику:
     програємо беззвучний семпл синхронно, ще до будь-яких промісів —
     це «розблоковує» контекст на всю сесію. */
  function primeAudio(ac) {
    try {
      var b = ac.createBuffer(1, 1, ac.sampleRate);
      var s = ac.createBufferSource();
      s.buffer = b;
      s.connect(ac.destination);
      s.start(0);
    } catch (e) {}
  }

  function setSound(next, silent) {
    soundOn = next;
    store.set('bg_sound', soundOn ? 'on' : 'off');
    toggles.forEach(applyState);

    if (soundOn) {
      var ac = ensureAudio();
      if (!ac) return;
      primeAudio(ac);
      if (ac.state === 'suspended' && ac.resume) {
        var r = ac.resume();
        if (r && r.then) r.then(function () { if (!silent) SFX.on(); });
        else if (!silent) SFX.on();
      } else if (!silent) {
        SFX.on();
      }
    } else if (!silent) {
      // короткий сигнал ще звучить — граємо до зняття прапорця
      soundOn = true; SFX.off(); soundOn = false;
    }
  }

  // кнопка в шапці
  var nav = $('.nav');
  if (nav) {
    var navBtn = buildToggle();
    // Не в самий кінець: кругла кнопка впиралася в заокруглений край
    // шапки і візуально зрізалась — її просто не було видно.
    var before = $('.nav-switch', nav) || $('#burger', nav);
    if (before) nav.insertBefore(navBtn, before);
    else nav.appendChild(navBtn);
    toggles.push(navBtn);
  }
  // кнопка в мобільному меню
  var mm = $('#mobileMenu');
  if (mm) {
    var row = document.createElement('div');
    row.className = 'sfx-row';
    var mmBtn = buildToggle();
    var lbl = document.createElement('span');
    lbl.className = 'sfx-row-label';
    lbl.textContent = 'Звукові ефекти';
    row.appendChild(mmBtn); row.appendChild(lbl);
    mm.appendChild(row);
    toggles.push(mmBtn);
  }

  toggles.forEach(function (b) {
    applyState(b);
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      setSound(!soundOn);
      hideHint();
    });
  });

  /* ---------- розморозка звуку на першій дії користувача ----------
     Якщо відвідувач уже вмикав звук раніше, налаштування підтягується
     з localStorage, але браузер тримає AudioContext замороженим
     до першого справжнього жесту. Ловимо його один раз. */
  if (soundOn) {
    var unlock = function () {
      var ac = ensureAudio();
      if (ac && ac.state === 'suspended' && ac.resume) ac.resume();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock, { passive: true });
  }

  // повернення на вкладку після дзвінка або блокування екрана
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && soundOn && AC) awake(AC);
  });

  /* ---------- одноразова підказка ---------- */
  var hint = null;
  function hideHint() {
    if (hint) { hint.classList.remove('show'); store.set('bg_sound_hint', '1'); }
  }
  if (navBtn && !soundOn && !store.get('bg_sound_hint')) {
    hint = document.createElement('div');
    hint.className = 'sfx-hint';
    hint.innerHTML = 'Увімкніть звук <span>↑</span>';
    document.body.appendChild(hint);
    setTimeout(function () { if (hint) hint.classList.add('show'); }, 2600);
    setTimeout(hideHint, 10000);
    document.addEventListener('click', hideHint, { once: true });
  }

  /* ============================================================
     3. РОЗВІШУВАННЯ ЗВУКІВ — режим «максимум»
     ============================================================ */
  var lastHover = 0, lastHoverEl = null;
  var HOVER_SEL = '.btn, .tile, .pill, .nav-links a, .acc-btn, .pack, .person, .tcard, .stat, .award, .date-card, .logo-ph, .table-tabs button, .sfx-btn, .nav-switch, .foot a';

  document.addEventListener('mouseover', function (e) {
    if (!soundOn) return;
    var el = e.target.closest && e.target.closest(HOVER_SEL);
    if (!el || el === lastHoverEl) return;
    var now = Date.now();
    if (now - lastHover < 55) return;
    lastHover = now; lastHoverEl = el;
    SFX.hover();
  }, { passive: true });

  document.addEventListener('mouseout', function (e) {
    if (lastHoverEl && e.target === lastHoverEl) lastHoverEl = null;
  }, { passive: true });

  // кліки
  document.addEventListener('click', function (e) {
    if (!soundOn || !e.target.closest) return;
    if (e.target.closest('.sfx-btn')) return;

    if (e.target.closest('.chk')) { SFX.tap(); return; }
    if (e.target.closest('.chr')) { SFX.pick(); return; }
    if (e.target.closest('.js-pick')) { SFX.pick(); return; }
    if (e.target.closest('.acc-btn')) {
      var item = e.target.closest('.acc-item');
      // клас ще не перемкнувся на момент capture — читаємо після
      setTimeout(function () {
        (item && item.classList.contains('open') ? SFX.open : SFX.close)();
      }, 0);
      return;
    }
    if (e.target.closest('.table-tabs button')) { SFX.tab(); return; }
    if (e.target.closest('a[href$=".html"], .nav-switch')) { SFX.swoosh(); return; }
    if (e.target.closest('.btn, .tile, .nav-links a, a[href^="#"]')) { SFX.tap(); return; }
  }, true);

  // поля форми
  document.addEventListener('focusin', function (e) {
    if (!soundOn) return;
    if (e.target.matches && e.target.matches('.fld input, .fld select, .fld textarea')) SFX.field();
  });

  // відправка форми: успіх або помилка
  var form = $('#applyForm');
  if (form) {
    form.addEventListener('submit', function () {
      setTimeout(function () {
        var ok = form.style.display === 'none';
        if (ok) SFX.success();
        else if ($('.fld.err')) SFX.error();
      }, 30);
    });
  }

  // Звук появи секцій прибрано: під час прокрутки він давав
  // безперервне «шух-шух» і швидко набридав.

  /* ============================================================
     4. ТАЙМЕР: терміновість у тексті + тікання в останню хвилину
     ============================================================ */
  var cdBox = $('#countdown');
  var urgentSet = 0;
  document.addEventListener('bg:tick', function (e) {
    var d = e.detail || {};
    if (!cdBox) return;

    var label = $('.cd-label', cdBox);
    var totalMin = d.h * 60 + d.m;

    if (d.h === 0 && d.m === 0 && soundOn) SFX.tick();

    if (totalMin < 60 && urgentSet < 2) {
      urgentSet = 2;
      cdBox.classList.add('cd-urgent');
      if (label) label.innerHTML = '<b>Менше години до кінця спецціни.</b> Далі — ціна тижня. Забронюйте зараз, щоб зафіксувати цю.';
    } else if (totalMin < 6 * 60 && urgentSet < 1) {
      urgentSet = 1;
      if (label) label.innerHTML = '<b>Спеціальна ціна ось-ось закриється.</b> Ціна фіксується в момент бронювання — далі діє ціна тижня.';
    }
  });

  /* ============================================================
     5. ТЕКСТ: світлова проявка заголовка

     Раніше тут був посимвольний глітч. Від нього відмовились:
     головний рядок сторінки на секунду ставав нечитабельним набором
     літер. Замість цього — маска, яка проявляє заголовок зліва направо
     тим самим світлом, що й слід на першому екрані. Текст у розмітці
     лишається звичайним і читається пошуковиками та зчитувачами.
     Сама анімація описана в styles.css, класом .fx-wipe.
     ============================================================ */

  /* ============================================================
     6. ТЕКСТ: цифри, що набігають
     ============================================================ */
  function countUp(el) {
    if (reduced || el.dataset.fxDone) return;
    // У картці пакета число лежить поруч із підписом <s>місць</s> —
    // анімуємо лише сам числовий вузол, підпис не чіпаємо.
    var target = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    var raw = (target ? target.nodeValue : el.textContent).trim();
    var m = raw.match(/^(\d+)(\D*)$/);
    if (!m) return;
    el.dataset.fxDone = '1';

    var goal = parseInt(m[1], 10);
    var suffix = m[2] || '';
    var D = goal > 100 ? 1100 : 800;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / D);
      var eased = 1 - Math.pow(1 - p, 3);
      var out = Math.round(goal * eased) + (p === 1 ? suffix : '');
      if (target) target.nodeValue = out; else el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else if (target) target.nodeValue = raw; else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  }

  /* ---------- запуск текстових ефектів ---------- */
  if (!reduced) {
    var heads = [];
    var nums  = $$('.stat .v, .pack .seats b, .seatrow .qty');

    var fire = function (el) { countUp(el); };

    if ('IntersectionObserver' in window) {
      var fxIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          fxIO.unobserve(en.target);
          fire(en.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });

      heads.concat(nums).forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          // вже у в'юпорті — запускаємо одразу, сторінка не стоїть порожня
          setTimeout(function () { fire(el); }, el.matches('.h-xl') ? 120 : 260);
        } else {
          fxIO.observe(el);
        }
      });
    }
  }

  /* ============================================================
     7. ЖИВІ ПІДПИСИ НА КНОПКАХ
     ============================================================ */
  var ALT = {
    'Забронювати місце':     'Я в грі',
    'Забронювати Стандарт':  'Стартуємо',
    'Забронювати Бізнес':    'Хочу в Бізнес-лігу',
    'Забронювати VIP':       'Хочу Гран-прі',
    'Як це працює':          'Розкажіть',
    'Обговорити співпрацю':  'Давайте поговоримо',
    'Дивитися пакети':       'Показуйте',
    'Обрати пакет':          'Цей беремо',
    'Подати заявку':         'Я готова',
    'Стати партнером сезону': 'Цікаво',
    'Умови для спікерів':    'Хочу на сцену'
  };

  var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  $$('.btn').forEach(function (btn) {
    if (!canHover) return;   // на тач-екрані підпис залипав на «Я в грі»
    var base = btn.textContent.trim();
    var alt = ALT[base];
    if (!alt) return;

    btn.addEventListener('mouseenter', function () {
      if (!btn.style.minWidth) btn.style.minWidth = btn.offsetWidth + 'px';
      btn.classList.add('fx-swap');
      setTimeout(function () { btn.textContent = alt; }, 90);
    });
    btn.addEventListener('mouseleave', function () {
      setTimeout(function () { btn.textContent = base; }, 90);
      btn.classList.remove('fx-swap');
    });
  });

  /* ============================================================
     8. ПАСХАЛКА В КОНСОЛІ
     ============================================================ */
  if (window.console && console.log) {
    console.log(
      '%c BEAUTY GAMES 2026 %c\n\nШукаєте, як усе влаштовано зсередини?\nНам подобається такий підхід.\n\nПишіть: @beauty_games.pro',
      'background:linear-gradient(90deg,#FF2D96,#E6007E);color:#fff;font:700 15px Montserrat,sans-serif;padding:7px 14px;border-radius:20px',
      'color:#A29BB2;font:13px/1.6 Manrope,sans-serif'
    );
  }

})();
