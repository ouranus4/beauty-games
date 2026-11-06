/* Персональне запрошення амбасадора.
   Без хеша — загальне запрошення («Только для вас»).
   З хешем #i=… — іменне: дані людини лежать лише в посиланні,
   на сервер не йдуть і в публічний репозиторій не потрапляють. Посилання робить /invite-make.

   Поля: n — ім'я, g — звертання («Дорогая»), t — 1 якщо на «ты»,
         p — особиста фраза Ірини, team — назва команди, d — відповісти до. */
(function () {
  'use strict';

  function decode(s) {
    try {
      s = s.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      var bin = atob(s), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return {}; }
  }

  var m = location.hash.match(/i=([A-Za-z0-9_\-]+)/);
  var D = m ? decode(m[1]) : {};
  var ty = D.t === 1 || D.t === '1';
  var name = (D.n || '').trim();
  var q = location.search;
  var printMode = /[?&](pdf|print)\b/.test(q);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- {вы|ты} у текстах ---------- */
  var RX = /\{([^{}|]*)\|([^{}]*)\}/g;
  function pick(s) { return s.replace(RX, function (_, a, b) { return ty ? b : a; }); }
  (function walk(node) {
    if (node.nodeType === 3) {
      if (node.nodeValue.indexOf('{') > -1) node.nodeValue = pick(node.nodeValue);
      return;
    }
    if (node.nodeType !== 1 || node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    ['placeholder', 'aria-label', 'alt'].forEach(function (a) {
      var v = node.getAttribute && node.getAttribute(a);
      if (v && v.indexOf('{') > -1) node.setAttribute(a, pick(v));
    });
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  })(document.body);

  /* ---------- персоналізація ---------- */
  if (name) {
    var greet = (D.g || 'Дорогая').trim();
    $('envSmall').textContent = 'для: ' + name;
    $('cardTo').textContent = greet + ' ' + name + ',';
    $('hello').textContent = greet + ' ' + name + '!';
    $('teamName').textContent = name;
    $('fName').value = name;
    document.title = name + ', персональное приглашение — Beauty Games';
  } else {
    $('teamName').textContent = ty ? 'Ты' : 'Вы';
    if (ty) $('hello').textContent = 'Привет!';
  }
  if (D.p) $('personal').textContent = D.p;
  if (D.team) { $('teamLabel').textContent = 'Команда'; $('teamName').textContent = D.team; }
  if (D.d) $('cardNote').textContent = (ty ? 'Жду твой ответ до ' : 'Жду ваш ответ до ') + D.d;

  /* ---------- іконки, що розлітаються ---------- */
  var ICONS = ['brow', 'lash', 'nails', 'pmu', 'hair', 'makeup', 'skin', 'massage', 'wax', 'extension', 'trophy', 'gift'];
  function src(n) { return 'assets/home/real/' + n + '.webp'; }
  ICONS.concat(['crown', 'coins']).forEach(function (n) { var i = new Image(); i.src = src(n); });
  function popIcons(x, y, count, spread) {
    if (reduce || !document.body.animate) return;
    for (var k = 0; k < count; k++) {
      var img = document.createElement('img');
      img.className = 'pop';
      img.src = src(ICONS[k % ICONS.length]);
      img.alt = '';
      document.body.appendChild(img);
      var ang = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.3;
      var dist = spread * (.55 + Math.random() * .6);
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      var rot = (Math.random() - .5) * 120, sc = .6 + Math.random() * .7;
      var a = img.animate([
        { transform: 'translate(' + (x - 34) + 'px,' + (y - 34) + 'px) scale(.2) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + (x - 34 + dx * .7) + 'px,' + (y - 34 + dy * .7) + 'px) scale(' + sc + ') rotate(' + rot * .6 + 'deg)', opacity: 1, offset: .35 },
        { transform: 'translate(' + (x - 34 + dx) + 'px,' + (y - 34 + dy + spread * .9) + 'px) scale(' + sc * .8 + ') rotate(' + rot + 'deg)', opacity: 0 }
      ], { duration: 1500 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)', delay: k * 25 });
      a.onfinish = (function (el) { return function () { el.remove(); }; })(img);
    }
  }

  /* ---------- конверт ---------- */
  var stage = $('stage'), wrap = $('wrap'), opened = false;
  function reveal() {
    stage.classList.add('gone');
    wrap.classList.add('shown');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    setTimeout(function () { stage.remove(); }, 900);
    playLetter();
  }

  /* ---------- лист-запрошення: мʼяко проявляється рядок за рядком ---------- */
  var om = $('om');
  var rows = [].slice.call(om.querySelectorAll('.rl')).filter(function (el) { return el.offsetParent !== null || el.tagName === 'svg'; });
  function showLetterNow() {
    var sv = $('sealV');
    if (sv) { sv.addEventListener('loadedmetadata', function () { sv.currentTime = Math.max(0, sv.duration - .1); }); if (sv.readyState >= 1) sv.currentTime = Math.max(0, sv.duration - .1); }
    om.classList.add('in');
    rows.forEach(function (el) { el.classList.add('on'); });
    document.querySelector('.hero .scroll-cue').classList.add('on');
  }
  var letterPlayed = false;
  function playLetter() {
    if (letterPlayed) return;
    letterPlayed = true;
    if (reduce || printMode) return showLetterNow();
    requestAnimationFrame(function () { om.classList.add('in'); });
    rows.forEach(function (el, k) {
      setTimeout(function () { el.classList.add('on'); }, 500 + k * 260);
    });
    var done = 500 + rows.length * 260 + 400;
    setTimeout(playSeal, done);
    setTimeout(function () { document.querySelector('.hero .scroll-cue').classList.add('on'); }, done + 6500);
  }

  /* ---------- сургуч: відео стає на лист після тексту, наприкінці завмирає ---------- */
  var sealV = $('sealV');
  var sealReady = false, sealSeen = false, sealStarted = false;
  if (sealV && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      sealSeen = es[0].isIntersecting && es[0].intersectionRatio > .5;
      if (sealSeen && sealReady) startSeal();
    }, { threshold: [0, .5, 1] }).observe(sealV);
  } else sealSeen = true;
  function playSeal() {
    sealReady = true;
    if (sealSeen) startSeal();
  }
  function startSeal() {
    if (!sealV || sealStarted) return;
    sealStarted = true;
    sealV.currentTime = 0;
    sealV.muted = false;          // людина вже торкнулася конверта — звук дозволено
    sealV.volume = .7;
    var pr = sealV.play();
    if (pr && pr.catch) pr.catch(function () { sealV.muted = true; sealV.play().catch(function () {}); });
  }
  if (sealV) sealV.addEventListener('ended', function () { sealV.pause(); });

  /* ---------- відео-вступ: конверт прилітає → чекає дотику → печатка ламається → біла картка ---------- */
  var intro = $('introV');
  var portrait = innerWidth / innerHeight < .9;
  var CLIP = portrait
    ? { src: 'assets/video/invite-v.mp4', poster: 'assets/video/invite-v.jpg', pause: 1.6, seal: [.47, .45] }
    : { src: 'assets/video/invite-h.mp4', poster: 'assets/video/invite-h.jpg', pause: 1.9, seal: [.5, .5] };
  var waiting = false, finishing = false;

  function placeTap() {
    // переводимо позицію печатки з кадру відео в координати екрана (object-fit: contain)
    var vw = intro.videoWidth || (portrait ? 720 : 1280), vh = intro.videoHeight || (portrait ? 1280 : 720);
    var W = stage.clientWidth, H = stage.clientHeight, k = Math.min(W / vw, H / vh);
    var x = (W - vw * k) / 2 + CLIP.seal[0] * vw * k, y = (H - vh * k) / 2 + CLIP.seal[1] * vh * k;
    var t = $('introTap'); t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  function holdOnEnvelope() {
    if (waiting || opened) return;
    waiting = true;
    intro.pause();
    placeTap();
    stage.classList.add('wait');
  }
  function watch() {
    if (opened) return;
    if (intro.currentTime >= CLIP.pause) return holdOnEnvelope();
    requestAnimationFrame(watch);
  }
  function finish() {
    if (finishing) return;
    finishing = true;
    stage.classList.add('whiteout');
    setTimeout(reveal, 550);
  }
  function openEnv() {
    if (opened) return;
    opened = true;
    stage.classList.remove('wait');
    intro.muted = false;
    intro.volume = .8;
    if (intro.currentTime < CLIP.pause) intro.currentTime = CLIP.pause;
    var pr = intro.play();
    if (pr && pr.catch) pr.catch(function () { intro.muted = true; intro.play().catch(finish); });
  }
  intro.addEventListener('timeupdate', function () {
    if (opened && intro.duration && intro.currentTime > intro.duration - .45) finish();
  });
  intro.addEventListener('ended', finish);
  intro.addEventListener('error', function () { opened = true; finish(); });
  stage.addEventListener('click', function () { if (waiting) openEnv(); });
  addEventListener('resize', function () { if (waiting) placeTap(); });
  addEventListener('keydown', function (e) {
    if (waiting && !opened && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openEnv(); }
  });
  if (!printMode) {
    intro.poster = CLIP.poster;
    intro.src = CLIP.src;
    var p0 = intro.play();
    if (p0 && p0.then) p0.then(function () { requestAnimationFrame(watch); }, function () {
      // автозапуск заборонено (режим енергозбереження) — одразу показуємо конверт і чекаємо дотику
      intro.addEventListener('loadeddata', function once() {
        intro.removeEventListener('loadeddata', once);
        intro.currentTime = CLIP.pause; holdOnEnvelope();
      });
      if (intro.readyState >= 2) { intro.currentTime = CLIP.pause; holdOnEnvelope(); }
    });
    else requestAnimationFrame(watch);
  }
  if (printMode) {
    document.body.classList.add('pdf');
    opened = true; stage.remove(); wrap.classList.add('shown'); document.body.classList.remove('locked');
    showLetterNow();
  }

  /* ---------- відео Ірини: грає, коли його видно ---------- */
  var vid = $('irinaVideo');
  if (vid) {
    vid.muted = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }
          else vid.pause();
        });
      }, { threshold: .2 }).observe(vid);
    }
  }

  /* ---------- поява при прокрутці ---------- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !printMode) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in-view'); });

  /* ---------- команда: кільце з 10 напрямків крутиться; дотик — назва напрямку ---------- */
  var SEAT_ICONS = ['brow', 'lash', 'nails', 'pmu', 'hair', 'makeup', 'skin', 'massage', 'wax', 'extension'];
  var SEAT_NAMES = ['Брови', 'Ресницы', 'Ногти', 'Перманент', 'Волосы', 'Макияж', 'Косметология', 'Массаж', 'Депиляция', 'Наращивание'];
  var team = $('team'), seats = [];
  var ring = document.createElement('div'); ring.className = 'ring'; team.appendChild(ring);
  var labelEl = $('teamLabel'), nameEl = $('teamName'), labelTimer = 0;
  var baseLabel = labelEl.textContent, baseName = nameEl.textContent;
  function showDir(k) {
    clearTimeout(labelTimer);
    labelEl.textContent = 'Мастер ' + (k + 1);
    nameEl.textContent = SEAT_NAMES[k];
    team.classList.add('peek');
    seats.forEach(function (st, q) { st.classList.toggle('pick', q === k); });
    labelTimer = setTimeout(function () {
      labelEl.textContent = baseLabel; nameEl.textContent = baseName;
      team.classList.remove('peek');
      seats.forEach(function (st) { st.classList.remove('pick'); });
    }, 1800);
  }
  for (var i = 0; i < 10; i++) {
    var ang = -Math.PI / 2 + i * (Math.PI * 2 / 10);
    var s = document.createElement('button');
    s.type = 'button';
    s.className = 'seat';
    s.setAttribute('aria-label', SEAT_NAMES[i]);
    s.style.left = (50 + 41 * Math.cos(ang)) + '%';
    s.style.top = (50 + 41 * Math.sin(ang)) + '%';
    s.style.transitionDelay = (i * 0.07) + 's';
    var im = document.createElement('img');
    im.src = src(SEAT_ICONS[i]); im.alt = '';
    im.style.transitionDelay = (i * 0.07 + .2) + 's';
    s.appendChild(im);
    s.addEventListener('click', (function (k) { return function () { showDir(k); }; })(i));
    ring.appendChild(s);
    seats.push(s);
  }
  if ('IntersectionObserver' in window && !printMode) {
    new IntersectionObserver(function (es, o) {
      if (es[0].isIntersecting) { team.classList.add('on'); o.disconnect(); }
    }, { threshold: .35 }).observe(team);
  } else team.classList.add('on');

  /* ---------- калькулятор винагороди: 7–30 мастерів ---------- */
  var PRICE = 1800, cnt = $('cnt'), sumEl = $('sum');
  function fmt(n) { return '€' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  var dotsEl = $('calcDots'), chips = [].slice.call(document.querySelectorAll('#calcChips button'));
  for (var d = 0; d < 30; d++) { var dot = document.createElement('i'); dotsEl.appendChild(dot); }
  var dots = [].slice.call(dotsEl.children);
  function word(n) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? 'мастер' : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? 'мастера' : 'мастеров'; }
  function calc(anim) {
    var n = +cnt.value, rate = n >= 8 ? 10 : 5;
    $('cntV').textContent = n;
    $('cntWord').textContent = word(n);
    $('fN').textContent = n;
    $('rate').textContent = rate + '%';
    sumEl.textContent = fmt(n * PRICE * rate / 100);
    if (anim) { sumEl.classList.remove('bump'); void sumEl.offsetWidth; sumEl.classList.add('bump'); }
    cnt.style.setProperty('--p', ((n - 7) / 23 * 100) + '%');
    dots.forEach(function (el, k) { el.classList.toggle('on', k < n); el.classList.toggle('extra', k >= 10); });
    chips.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-n') === n); });
    document.querySelectorAll('.calc-tiers > div').forEach(function (t) { t.classList.toggle('on', +t.getAttribute('data-t') === rate); });
    seats.forEach(function (st, k) { st.classList.toggle('fill', k < Math.min(n, 10)); });
    var plus = $('teamPlus');
    if (n > 10) { plus.hidden = false; plus.textContent = '+' + (n - 10) + ' в команде'; } else plus.hidden = true;
    $('bigNote').hidden = n <= 10;
  }
  cnt.addEventListener('input', function () { calc(true); });
  function stepBy(d) { cnt.value = Math.max(7, Math.min(30, +cnt.value + d)); calc(true); }
  $('cntMinus').addEventListener('click', function () { stepBy(-1); });
  $('cntPlus').addEventListener('click', function () { stepBy(1); });
  chips.forEach(function (b) { b.addEventListener('click', function () { cnt.value = b.getAttribute('data-n'); calc(true); }); });
  calc(false);

  /* ---------- подарунок ---------- */
  var box = $('giftbox'), gbtn = $('giftBtn');
  var giftV = $('giftV'), giftPlaying = false;
  function revealGift() {
    if (box.classList.contains('opened')) return;
    box.classList.add('opened');
    box.querySelectorAll('.mod').forEach(function (md, k) { md.style.animationDelay = (.25 + k * .08) + 's'; });
  }
  function openGift() {
    if (giftPlaying || box.classList.contains('opened')) return;
    giftPlaying = true;
    box.classList.add('playing');
    if (!giftV || reduce) return revealGift();
    giftV.muted = false; giftV.volume = .7;
    var pr = giftV.play();
    if (pr && pr.catch) pr.catch(function () { giftV.muted = true; giftV.play().catch(revealGift); });
    // коробка відкривається і світиться приблизно на 4-й секунді — тоді показуємо програму.
    // Страховка для телефонів: якщо відео не пішло або застигло — відкриваємо програму все одно.
    var last = -1, still = 0, started = Date.now();
    var t = setInterval(function () {
      var ct = giftV.currentTime;
      still = (ct === last) ? still + 1 : 0; last = ct;
      if (ct >= 4.3 || giftV.ended || still >= 12 || Date.now() - started > 7000) { clearInterval(t); revealGift(); }
    }, 120);
    giftV.addEventListener('error', revealGift);
    giftV.addEventListener('stalled', function () { setTimeout(revealGift, 1500); });
  }
  gbtn.addEventListener('click', openGift);
  if (printMode) { box.classList.add('opened'); if (giftV) giftV.addEventListener('loadedmetadata', function () { giftV.currentTime = giftV.duration - .1; }); }

  /* ---------- RSVP ---------- */
  var form = $('form'), err = $('err'), answer = 'Принимаю приглашение';
  form.querySelectorAll('[data-answer]').forEach(function (b) {
    b.addEventListener('click', function () { answer = b.getAttribute('data-answer'); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    var fd = new FormData(form), data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    if (!String(data.name || '').trim() || !String(data.contact || '').trim()) {
      err.textContent = 'Пожалуйста, укажите имя и как с ' + (ty ? 'тобой' : 'вами') + ' связаться.';
      return;
    }
    data.answer = answer;
    data.invite_to = name || '(общее приглашение)';
    var btns = form.querySelectorAll('button');
    btns.forEach(function (b) { b.disabled = true; });
    var fail = function () {
      btns.forEach(function (b) { b.disabled = false; });
      err.textContent = 'Не получилось отправить. Попробуйте ещё раз или напишите Ирине в Instagram @verbovaya_irina.';
    };
    if (!window.bgSendLead) return fail();
    window.bgSendLead('ambassador', data).then(function () {
      var first = String(data.name).trim().split(/\s+/)[0];
      document.querySelector('.thanks b').textContent = 'Спасибо, ' + first + '!';
      if (answer !== 'Принимаю приглашение')
        $('thanksTx').textContent = 'Ирина позвонит ' + (ty ? 'тебе' : 'вам') + ' и ответит на все вопросы.';
      var card = $('rsvpCard');
      card.classList.add('done');
      var r = card.getBoundingClientRect();
      popIcons(r.left + r.width / 2, Math.max(80, r.top + 60), 16, Math.min(innerWidth, 700) * .55);
    }, fail);
  });

  if (/[?&]print\b/.test(q)) {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(function () { window.print(); }, 500); });
  }
})();
