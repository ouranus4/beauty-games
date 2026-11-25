/* =========================================================
   Beauty Games — заявки з сайту прямо в Telegram (без лімітів, безкоштовно)
   Працює на Vercel (як сайт HARDELITE). Сайт на GitHub Pages шле сюди заявки.

   Токен бота НЕ зберігається в коді. Він живе у Vercel:
   Settings → Environment Variables
     TELEGRAM_BOT_TOKEN   — токен від @BotFather
     TELEGRAM_CHAT_ID     — куди надсилати всі заявки (можна кілька через кому)
     TELEGRAM_CHAT_<FORM> — окремий чат для форми, напр. TELEGRAM_CHAT_WEBINAR

   Перевірка: відкрити /api/lead у браузері — покаже, чи все налаштовано.
   Пошук id групи: /api/lead?setup=1 (бот доданий у групу, у групі написали /start).
   ========================================================= */

const MAX = 400;
const NL = String.fromCharCode(10);
const ALLOW = ['https://beauty-games.pro', 'https://www.beauty-games.pro', 'https://ouranus4.github.io'];

const clean = v => String(v == null ? '' : v).replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').trim().slice(0, MAX);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TITLES = {
  webinar: '🎥 Майстер-клас RE:START — реєстрація',
  participant: '🎮 Нова заявка — участь у шоу',
  blackfriday: '🖤 BLACK FRIDAY — нова заявка',
  casting: '🎬 Кастинг — нова заявка',
  test: '🎮 Тест «Точка зростання»',
  earn: '💰 Калькулятор — новий контакт',
  calc: '💰 Калькулятор — новий контакт'
};
const LABELS = [
  ['name', "Ім'я"], ['phone', 'Телефон'], ['messenger', 'Куди писати'], ['direction', 'Напрям'],
  ['instagram', 'Instagram'], ['contact', 'Контакт'], ['package', 'Пакет'], ['place', 'Країна, місто'],
  ['experience', 'Досвід'], ['goal', 'Ціль'], ['note', 'Питання'], ['source', 'Джерело']
];

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', ALLOW.includes(origin) ? origin : ALLOW[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatsFor = form => {
    const own = process.env['TELEGRAM_CHAT_' + String(form || '').toUpperCase()];
    return String(own || process.env.TELEGRAM_CHAT_ID || '').split(',').map(v => v.trim()).filter(Boolean);
  };
  const tg = async (method, payload) => {
    const r = await fetch('https://api.telegram.org/bot' + token + '/' + method, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {})
    });
    return r.json().catch(() => ({}));
  };

  if (req.method === 'GET') {
    if (req.query && req.query.setup && token) {
      const u = await tg('getUpdates', { limit: 100 });
      const seen = {};
      (u.result || []).forEach(x => {
        const m = x.message || x.my_chat_member || x.channel_post;
        if (m && m.chat && m.chat.type !== 'private') seen[m.chat.id] = m.chat.title;
      });
      res.status(200).json({ ok: !!u.ok, groups: Object.keys(seen).map(id => ({ id, title: seen[id] })) });
      return;
    }
    res.status(200).json({ ok: true, hasToken: Boolean(token), chats: chatsFor('').length, webinarChat: chatsFor('webinar').length });
    return;
  }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  if (!token) { res.status(500).json({ ok: false, error: 'not_configured' }); return; }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = {}; } }
  if (!b || typeof b !== 'object') b = {};
  if (clean(b['bot-field']) || clean(b.bot)) { res.status(200).json({ ok: true }); return; }

  const form = clean(b.form);
  const chats = chatsFor(form);
  if (!chats.length) { res.status(500).json({ ok: false, error: 'no_chat' }); return; }
  if (!clean(b.name) && !clean(b.phone) && !clean(b.contact)) { res.status(400).json({ ok: false, error: 'required' }); return; }

  const rows = ['<b>' + esc(TITLES[form] || ('Нова заявка — ' + form)) + '</b>', ''];
  LABELS.forEach(([k, l]) => { const v = clean(b[k]); if (v) rows.push('<b>' + l + ':</b> ' + esc(v)); });

  const utm = clean(b.utm);
  const q = k => { const m = utm.match(new RegExp('[?&]' + k + '=([^&]+)')); try { return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : ''; } catch (_) { return m[1]; } };
  if (q('utm_term')) rows.push('<b>Група реклами:</b> ' + esc(q('utm_term')));
  if (q('utm_content')) rows.push('<b>Оголошення:</b> ' + esc(q('utm_content')));
  if (!utm) rows.push('<b>Звідки:</b> ' + esc(clean(b.referrer) || 'напряму'));

  const digits = clean(b.phone).replace(/\D/g, '');
  if (digits) {
    const m = clean(b.messenger).toLowerCase();
    rows.push('', m.includes('viber') ? '👉 Viber: viber://chat?number=%2B' + digits
      : m.includes('whatsapp') ? '👉 WhatsApp: https://wa.me/' + digits
      : '👉 Telegram: https://t.me/+' + digits);
  }
  rows.push('', 'beauty-games.pro' + esc(clean(b.page)));

  const text = rows.join(NL).slice(0, 4000);
  const results = await Promise.allSettled(chats.map(async chat_id => {
    const d = await tg('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true });
    if (!d.ok) throw new Error(chat_id + ': ' + JSON.stringify(d));
  }));
  const failed = results.filter(x => x.status === 'rejected');
  failed.forEach(x => console.error('lead:', x.reason && x.reason.message));
  if (failed.length === results.length) { res.status(502).json({ ok: false, error: 'telegram' }); return; }
  res.status(200).json({ ok: true, sent: results.length - failed.length });
};
