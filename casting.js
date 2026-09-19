/* Заявка на кастинг: чотири кроки, перевірка кожного кроку, відправка.
   Відправка — через leads.js (Google Таблиця + Telegram менеджерам). */
(function () {
  'use strict';

  var form = document.getElementById('castForm');
  if (!form) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var pages = $$('.cst-pg', form);
  var back = $('#cstBack'), next = $('#cstNext');
  var barK = $('#cstBarK'), barFill = $('#cstBarFill');
  var fail = $('#cstFail');
  var cur = 0;

  // Кнопки-варіанти: один вибір або кілька (data-multi)
  $$('[data-group]', form).forEach(function (g) {
    var multi = g.hasAttribute('data-multi');
    var max = +g.getAttribute('data-max') || 0;
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      if (multi) b.classList.toggle('on');
      else $$('button[data-v]', g).forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('button[data-v]', g).forEach(function (x) { x.setAttribute('aria-pressed', x.classList.contains('on')); });
      clearErr(g.getAttribute('data-group'));
    });
    if (max) {
      g.addEventListener('change', function () {
        var on = $$('input:checked', g);
        $$('input', g).forEach(function (i) { i.disabled = !i.checked && on.length >= max; });
        clearErr(g.getAttribute('data-group'));
      });
    }
  });

  function picked(name) {
    var g = $('[data-group="' + name + '"]', form);
    if (!g) return [];
    return $$('button.on, input:checked', g).map(function (x) { return x.getAttribute('data-v') || x.value; });
  }

  function err(name, on) {
    var e = $('.cst-err[data-for="' + name + '"]', form);
    if (e) e.classList.toggle('show', on);
    return !on;
  }
  function clearErr(name) { err(name, false); }

  function fld(id, ok) {
    var el = document.getElementById(id);
    el.closest('.fld').classList.toggle('err', !ok);
    return ok;
  }

  // Прибираємо помилку, щойно людина почала виправляти
  $$('input, textarea', form).forEach(function (el) {
    el.addEventListener('input', function () {
      var f = el.closest('.fld');
      if (f) f.classList.remove('err');
    });
  });
  $('#cAgree').addEventListener('change', function () { clearErr('agree'); });

  var why = $('#cWhy'), whyN = $('#cWhyN');
  why.addEventListener('input', function () { whyN.textContent = why.value.length; });

  var V = {
    0: function () {
      var ok = true;
      ok = fld('cName', $('#cName').value.trim().length > 1) && ok;
      ok = fld('cPlace', $('#cPlace').value.trim().length > 1) && ok;
      ok = fld('cInsta', $('#cInsta').value.trim().replace('@', '').length > 1) && ok;
      ok = fld('cPhone', $('#cPhone').value.replace(/\D/g, '').length >= 9) && ok;
      return ok;
    },
    1: function () {
      var ok = true;
      ok = err('skills', !picked('skills').length) && ok;
      ok = err('exp', !picked('exp').length) && ok;
      ok = err('place_type', !picked('place_type').length) && ok;
      return ok;
    },
    2: function () {
      var ok = true;
      ok = err('check', !picked('check').length) && ok;
      ok = err('pains', !picked('pains').length) && ok;
      return ok;
    },
    3: function () {
      var ok = true;
      ok = fld('cWhy', why.value.trim().length >= 20) && ok;
      ok = err('camera', !picked('camera').length) && ok;
      ok = err('agree', !$('#cAgree').checked) && ok;
      return ok;
    }
  };

  function show(i) {
    cur = i;
    pages.forEach(function (p, k) { p.hidden = k !== i; p.classList.toggle('on', k === i); });
    back.hidden = i === 0;
    next.textContent = i === pages.length - 1 ? 'Надіслати заявку' : 'Далі';
    barK.textContent = 'Крок ' + (i + 1) + ' / ' + pages.length;
    barFill.style.width = ((i + 1) / pages.length * 100) + '%';
  }

  function toTop() {
    var y = form.getBoundingClientRect().top + window.pageYOffset - 90;
    if (form.getBoundingClientRect().top < 0) window.scrollTo({ top: y, behavior: 'smooth' });
  }

  back.addEventListener('click', function () { show(cur - 1); toTop(); });

  next.addEventListener('click', function () {
    if (!V[cur]()) {
      var bad = $('.fld.err input, .fld.err textarea, .cst-err.show', pages[cur]);
      if (bad) bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (cur < pages.length - 1) { show(cur + 1); toTop(); return; }
    send();
  });

  function data() {
    return {
      name: $('#cName').value.trim(),
      place: $('#cPlace').value.trim(),
      instagram: $('#cInsta').value.trim(),
      phone: $('#cPhone').value.trim(),
      skills: picked('skills').join(', '),
      experience: picked('exp').join(''),
      place_type: picked('place_type').join(''),
      check: picked('check').join(''),
      pains: picked('pains').join(', '),
      tried: picked('tried').join(', '),
      why: why.value.trim(),
      camera: picked('camera').join(''),
      video: $('#cVideo').value.trim()
    };
  }

  function done(d) {
    $('#castDoneName').textContent = d.name;
    form.hidden = true;
    var box = $('#castDone');
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try { localStorage.setItem('bg_name', d.name); } catch (e) {}
  }

  function send() {
    if ($('input[name="bot"]', form).value) return;
    var d = data();
    fail.hidden = true;
    next.disabled = true;
    next.textContent = 'Надсилаємо…';

    if (!window.bgLeadsOn || !window.bgLeadsOn()) {
      // Адреса ще не підключена: показуємо фінал, щоб можна було пройти анкету наскрізь
      console.warn('casting: no lead channel, lead not saved', d);
      done(d);
      return;
    }

    window.bgSendLead('casting', d)
      .then(function () { done(d); })
      .catch(function () {
        fail.hidden = false;
        next.disabled = false;
        next.textContent = 'Надіслати заявку';
      });
  }

  // Якщо людина вже проходила кроки на головній — підставляємо ім'я і скіли
  try {
    var nm = localStorage.getItem('bg_name');
    if (nm) $('#cName').value = nm;
    var ch = (localStorage.getItem('bg_character') || '').split('|');
    $$('[data-group="skills"] button', form).forEach(function (b) {
      if (ch.indexOf(b.getAttribute('data-v')) > -1) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
    });
    var ex = localStorage.getItem('bg_exp');
    var MAP = { 'менше року': 'до року' };
    if (ex) $$('[data-group="exp"] button', form).forEach(function (b) {
      if (b.getAttribute('data-v') === (MAP[ex] || ex)) b.classList.add('on');
    });
  } catch (e) {}

  show(0);
})();
