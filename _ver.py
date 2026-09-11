# -*- coding: utf-8 -*-
"""
Версії для css і js.

GitHub Pages віддає статику з довгим кешем, тому після деплою браузер
ще довго показує старі стилі й скрипти — саме через це правки
«не працювали». Скрипт дописує до посилань ?v=<хеш вмісту>: змінився
файл — змінилось посилання, і браузер бере нове.

Запускати перед комітом:
    python _ver.py
"""
import hashlib
import io
import re

ASSETS = ('styles.css', 'squid.css', 'app.js', 'fx.js')
PAGES = ('index.html', 'partners.html')


def digest(path):
    with open(path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def main():
    stamps = {a: digest(a) for a in ASSETS}
    for page in PAGES:
        s = io.open(page, encoding='utf-8').read()
        for asset, h in stamps.items():
            # ловимо і чисте ім'я, і вже проставлену версію
            s = re.sub(r'(["\'])' + re.escape(asset) + r'(\?v=[0-9a-f]+)?\1',
                       lambda m: '%s%s?v=%s%s' % (m.group(1), asset, h, m.group(1)),
                       s)
        io.open(page, 'w', encoding='utf-8').write(s)
    print('версії: ' + ', '.join('%s=%s' % (a, stamps[a]) for a in ASSETS))


if __name__ == '__main__':
    main()
