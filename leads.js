/* Куди йдуть заявки з усіх форм сайту: головна, кастинг, калькулятор.

   BG_LEADS_URL — адреса веб-застосунку Google Apps Script. Він пише
   заявку в Google Таблицю і пересилає її в Telegram-чат менеджерів.
   Токен бота лежить тільки там, у браузер він не потрапляє.
   Поки адреса порожня, форми працюють як раніше, але заявки нікуди не йдуть. */
window.BG_LEADS_URL = '';

window.bgSendLead = function (form, data) {
  var url = window.BG_LEADS_URL;
  if (!url || !window.fetch) return Promise.reject(new Error('BG_LEADS_URL empty'));

  var payload = {
    form: form,
    lang: document.documentElement.lang || '',
    page: location.pathname,
    utm: location.search || '',
    referrer: document.referrer || '',
    sent_at: new Date().toISOString()
  };
  Object.keys(data || {}).forEach(function (k) { payload[k] = data[k]; });

  // text/plain — простий запит без CORS-перевірки, Apps Script його приймає
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'lead not saved');
      return j;
    });
};
