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
  var ICONS = ['brow', 'lash', 'nails', 'pmu', 'hair', 'makeup', 'skin', 'massage', 'wax', 'extension', 'trophy', 'shop'];
  function src(n) { return 'assets/home/icons/' + n + '.webp'; }
  ICONS.concat(['program', 'chart', 'team', 'tv']).forEach(function (n) { var i = new Image(); i.src = src(n); });
  function popIcons(x, y, count, spread) {
    return; // у стилі old money — без іконок, що розлітаються
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

  /* ---------- команда: 10 місць з іконками напрямків ---------- */
  var SEAT_ICONS = ['brow', 'lash', 'nails', 'pmu', 'hair', 'makeup', 'skin', 'massage', 'wax', 'extension'];
  var team = $('team'), seats = [];
  for (var i = 0; i < 10; i++) {
    var ang = -Math.PI / 2 + i * (Math.PI * 2 / 10);
    var s = document.createElement('div');
    s.className = 'seat';
    s.style.left = (50 + 41 * Math.cos(ang)) + '%';
    s.style.top = (50 + 41 * Math.sin(ang)) + '%';
    s.style.transitionDelay = (i * 0.07) + 's';
    var rn = document.createElement('span');
    rn.className = 'rn';
    rn.textContent = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][i];
    s.appendChild(rn);
    team.appendChild(s);
    seats.push(s);
  }
  if ('IntersectionObserver' in window && !printMode) {
    new IntersectionObserver(function (es, o) {
      if (es[0].isIntersecting) { team.classList.add('on'); o.disconnect(); }
    }, { threshold: .35 }).observe(team);
  } else team.classList.add('on');

  /* ---------- калькулятор винагороди (оффер v12) ---------- */
  var PRICE = 1800, cnt = $('cnt'), sumEl = $('sum');
  function fmt(n) { return '€' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function calc(anim) {
    var n = +cnt.value, rate = n >= 8 ? 10 : 5;
    $('cntV').textContent = n;
    $('rate').textContent = rate + '%';
    sumEl.textContent = fmt(n * PRICE * rate / 100);
    if (anim) { sumEl.classList.remove('bump'); void sumEl.offsetWidth; sumEl.classList.add('bump'); }
    cnt.style.setProperty('--p', ((n - 7) / 3 * 100) + '%');
    seats.forEach(function (st, k) { st.classList.toggle('fill', k < n); });
  }
  cnt.addEventListener('input', function () { calc(true); });
  calc(false);

  /* ---------- подарунок ---------- */
  var box = $('giftbox'), gbtn = $('giftBtn');
  function openGift() {
    if (box.classList.contains('opened') || box.classList.contains('shake')) return;
    var r = gbtn.getBoundingClientRect();
    box.classList.add('shake');
    setTimeout(function () {
      popIcons(r.left + r.width / 2, r.top + r.height / 2, 12, Math.min(innerWidth, 640) * .5);
      box.classList.remove('shake');
      box.classList.add('opened');
      box.querySelectorAll('.mod').forEach(function (md, k) { md.style.animationDelay = (.25 + k * .08) + 's'; });
      var top = box.getBoundingClientRect().top + scrollY - 90;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    }, reduce ? 0 : 560);
  }
  gbtn.addEventListener('click', openGift);
  if (printMode) box.classList.add('opened');

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
