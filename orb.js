/* ============================================================
   ЗОЛОТА КУЛЯ З ГРОШЕЙ
   На референсі це фотоколаж. Фото такого розміру важке і на
   мобільному вантажиться помітно, тому куля збирається на canvas:
   світний шар, купюри по сфері і ті, що сиплються вниз.
   ============================================================ */
(function () {
  'use strict';
  var cv = document.getElementById('orbCanvas');
  if (!cv) return;

  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, cx = 0, cy = 0, R = 0;

  var GOLD = ['#FFE9A8', '#F7D070', '#E8B44A', '#C98F2E', '#FFF6D8'];

  var shell = [];   // купюри на поверхні кулі
  var rain = [];    // ті, що сиплються

  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  var build = function () {
    var r = cv.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cx = W / 2;
    cy = H * 0.46;
    R = Math.min(W, H) * 0.34;

    // Купюри розкладаємо по сфері: беремо точку на кулі і лишаємо
    // тільки ті, що дивляться «на нас» — так силует читається круглим.
    shell = [];
    var n = Math.round(Math.min(190, Math.max(70, (W * H) / 5200)));
    for (var i = 0; i < n; i++) {
      var u = Math.random() * 2 - 1;
      var th = Math.random() * Math.PI * 2;
      var sp = Math.sqrt(1 - u * u);
      shell.push({
        x: sp * Math.cos(th), y: u, z: sp * Math.sin(th),
        w: rnd(0.16, 0.3), h: rnd(0.075, 0.14),
        rot: rnd(-0.9, 0.9),
        c: GOLD[(Math.random() * GOLD.length) | 0],
        sp: rnd(0.12, 0.3)
      });
    }

    rain = [];
    var m = Math.round(Math.min(34, Math.max(10, W / 26)));
    for (var j = 0; j < m; j++) rain.push(newBill(true));
  };

  var newBill = function (spread) {
    return {
      x: cx + rnd(-R * 1.15, R * 1.15),
      y: spread ? rnd(cy - R, H + 40) : cy + rnd(-R * 0.3, R * 0.4),
      vy: rnd(26, 70),
      vx: rnd(-14, 14),
      w: rnd(11, 21),
      rot: rnd(0, Math.PI * 2),
      vr: rnd(-1.6, 1.6),
      c: GOLD[(Math.random() * GOLD.length) | 0],
      a: rnd(.45, .95)
    };
  };

  var bill = function (x, y, w, h, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    // смужка посередині — щоб прямокутник читався як купюра
    ctx.globalAlpha = alpha * 0.32;
    ctx.fillStyle = '#7A4B08';
    ctx.fillRect(-w / 2 + w * 0.16, -h * 0.1, w * 0.68, Math.max(1, h * 0.2));
    ctx.restore();
  };

  var t0 = performance.now();

  var frame = function (now) {
    var dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    ctx.clearRect(0, 0, W, H);

    // м'яке золоте світло під кулею
    var g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 2.1);
    g.addColorStop(0, 'rgba(255,214,120,.55)');
    g.addColorStop(0.42, 'rgba(240,170,50,.2)');
    g.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // ядро кулі
    var core = ctx.createRadialGradient(
      cx - R * 0.3, cy - R * 0.35, R * 0.08, cx, cy, R * 1.02);
    core.addColorStop(0, 'rgba(255,247,214,.95)');
    core.addColorStop(0.5, 'rgba(240,182,70,.75)');
    core.addColorStop(1, 'rgba(150,84,10,.35)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();

    // купюри на сфері — спершу далекі, потім ближні
    var vis = [];
    for (var i = 0; i < shell.length; i++) {
      var p = shell[i];
      if (!reduce) {
        var a = p.sp * dt;
        var nx = p.x * Math.cos(a) - p.z * Math.sin(a);
        p.z = p.x * Math.sin(a) + p.z * Math.cos(a);
        p.x = nx;
      }
      if (p.z > -0.15) vis.push(p);
    }
    vis.sort(function (a, b) { return a.z - b.z; });

    for (var k = 0; k < vis.length; k++) {
      var q = vis[k];
      var depth = (q.z + 1) / 2;                 // 0 далеко, 1 близько
      var sc = 0.55 + depth * 0.75;
      bill(cx + q.x * R, cy + q.y * R,
           q.w * R * sc, q.h * R * sc,
           q.rot + q.x * 0.5, q.c, 0.35 + depth * 0.6);
    }

    // блік
    ctx.globalAlpha = .5;
    var hl = ctx.createRadialGradient(
      cx - R * 0.38, cy - R * 0.45, 0, cx - R * 0.38, cy - R * 0.45, R * 0.75);
    hl.addColorStop(0, 'rgba(255,255,255,.7)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // купюри, що сиплються
    for (var r = 0; r < rain.length; r++) {
      var b = rain[r];
      if (!reduce) {
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        b.rot += b.vr * dt;
      }
      if (b.y - 20 > H) rain[r] = newBill(false);
      bill(b.x, b.y, b.w, b.w * 0.46, b.rot, b.c, b.a);
    }

    raf = requestAnimationFrame(frame);
  };

  var raf = null;
  var start = function () { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); } };
  var stop = function () { if (raf) { cancelAnimationFrame(raf); raf = null; } };

  build();
  start();

  var to;
  window.addEventListener('resize', function () {
    clearTimeout(to);
    to = setTimeout(build, 180);
  });

  // Поза екраном анімація не потрібна — це батарея на телефоні.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      e[0].isIntersecting ? start() : stop();
    }, { threshold: 0 }).observe(cv);
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
})();
