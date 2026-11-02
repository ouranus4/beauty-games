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

  // Пелюстки троянд падають через зал
  var cv = $('dust'), cx = cv.getContext('2d'), motes = [];
  function size() { cv.width = hero.clientWidth; cv.height = hero.clientHeight; }
  addEventListener('resize', size); size();
  var TINT = ['#FF8FB8', '#FFB3CF', '#FF6AA8', '#F7A1C0'];
  for (var i = 0; i < 22; i++) motes.push({ x: Math.random(), y: Math.random(), r: 4 + Math.random() * 7, v: .0005 + Math.random() * .0009, s: Math.random() * 6, c: TINT[i % 4] });
  function dust(t) {
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
    }
    requestAnimationFrame(dust);
  }
  if (!calm) requestAnimationFrame(dust);
})();
