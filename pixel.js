/* Піксель Meta (Facebook / Instagram реклама) для Beauty Games.

   PageView — на кожній сторінці, де підключено цей файл.
   Lead — коли людина надсилає будь-яку форму сайту (leads.js → bgSendLead):
   бронювання, кастинг, калькулятор, амбасадор.
   Порожній ID — піксель вимкнено, сайт працює як раніше. */
// Набір даних «Beauty Games — сайт beauty-games.pro», бізнес-портфоліо beauty_games.pro
window.BG_PIXEL_ID = '2045319922802965';

(function () {
  if (!window.BG_PIXEL_ID) return;
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', window.BG_PIXEL_ID);
  window.fbq('track', 'PageView');
})();
