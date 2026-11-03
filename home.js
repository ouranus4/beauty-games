/* Головна: вхід із завісою і золотий пил над палацом.
   Решту сторінки веде app.js, як і на /game. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var intro = $('intro'), hero = $('top');

  // Вхід показуємо раз за сесію. Двері відчиняються самі: це заставка, а не стіна.
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false, timer = 0, raf = 0;
  try { seen = sessionStorage.getItem('bg-intro') === '1'; } catch (e) {}

  function reveal() {
    clearTimeout(timer); cancelAnimationFrame(raf);
    try { sessionStorage.setItem('bg-intro', '1'); } catch (e) {}
    intro.dataset.step = 'open';
    document.body.classList.remove('locked');
    hero.classList.add('playing');
    setTimeout(function () { intro.hidden = true; }, 1600);
  }
  if (seen || calm || location.hash) {
    intro.hidden = true; hero.classList.add('playing');
  } else {
    document.body.classList.add('locked');
    var img = hero.querySelector('.world img'), t0 = performance.now(), MIN = 1500, MAX = 5000;
    (function step(now) {
      var ready = img.complete && img.naturalWidth > 0;
      // чекаємо картинку, щоб завіса не відкрилась у порожнечу
      var p = Math.min(ready ? 1 : .9, (now - t0) / MIN);
      if (now - t0 > MAX) p = 1;
      $('pct').textContent = Math.round(p * 100);
      $('barFill').style.setProperty('--p', p);
      if (p < 1) { raf = requestAnimationFrame(step); return; }
      intro.dataset.step = 'invite';
      timer = setTimeout(reveal, 4000);
    })(t0);
    $('open').addEventListener('click', reveal);
    $('skip').addEventListener('click', reveal);
  }

  // Золоті карти й пелюстки падають через зал. Поза першим екраном не малюємо.
  var cv = $('dust'), cx = cv.getContext('2d'), motes = [], cards = [];
  function size() { cv.width = hero.clientWidth; cv.height = hero.clientHeight; }
  addEventListener('resize', size); size();
  var TINT = ['#FF8FB8', '#FFB3CF', '#FF6AA8', '#F7A1C0'];
  var small = innerWidth < 720, card = new Image();
  card.src = 'assets/home/gamecard.webp';
  for (var i = 0; i < 18; i++) motes.push({ x: Math.random(), y: Math.random(), r: 4 + Math.random() * 7, v: .0005 + Math.random() * .0009, s: Math.random() * 6, c: TINT[i % 4] });
  for (i = 0; i < (small ? 7 : 12); i++) cards.push({ x: Math.random(), y: -.2 + Math.random() * 1.1, w: (small ? 44 : 84) + Math.random() * (small ? 26 : 56), v: .00011 + Math.random() * .00012, s: Math.random() * 6 });
  var last = 0;
  function dust(t) {
    var dt = Math.min(t - last, 80); last = t;
    if (scrollY < cv.height) {
      cx.clearRect(0, 0, cv.width, cv.height);
      motes.forEach(function (m) {
        m.y += m.v; if (m.y > 1.03) { m.y = -.03; m.x = Math.random(); }
        cx.save();
        cx.translate((m.x + Math.sin(t / 2600 + m.s) * .03) * cv.width, m.y * cv.height);
        cx.rotate(t / 1800 + m.s);
        cx.globalAlpha = .75;
        cx.fillStyle = m.c;
        cx.beginPath(); cx.ellipse(0, 0, m.r, m.r * .6 * (.55 + .45 * Math.abs(Math.sin(t / 700 + m.s))), 0, 0, 7); cx.fill();
        cx.restore();
      });
      if (card.complete && card.naturalWidth && hero.classList.contains('playing')) {
        cards.forEach(function (k) {
          k.y += k.v * dt; if (k.y > 1.15) { k.y = -.15; k.x = Math.random(); }
          var h = k.w * card.naturalHeight / card.naturalWidth;
          cx.save();
          cx.globalAlpha = 1;
          cx.translate((k.x + Math.sin(t / 2200 + k.s) * .04) * cv.width, k.y * cv.height);
          cx.rotate(Math.sin(t / 1400 + k.s) * .5);
          cx.scale(Math.cos(t / 900 + k.s) * .85 + .15 * (Math.cos(t / 900 + k.s) < 0 ? -1 : 1), 1);   // карта крутиться в повітрі
          cx.drawImage(card, -k.w / 2, -h / 2, k.w, h);
          cx.restore();
        });
      }
    }
    requestAnimationFrame(dust);
  }
  if (!calm) requestAnimationFrame(dust);

  // Шкала XP: заповнюється разом із прокруткою сторінки
  var xp = $('xpFill');
  function xpPaint() {
    var d = document.documentElement, max = d.scrollHeight - innerHeight;
    xp.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max) : 0);
  }
  addEventListener('scroll', xpPaint, { passive: true }); xpPaint();
})();
