# -*- coding: utf-8 -*-
"""
Російська версія головної сторінки.

Джерело правди — українська index.html і app.js. Переклад лежить
у i18n/ru.json: {"український рядок": "російський рядок"}.
Скрипт бере кожен текст, атрибут і рядок у JS, підставляє переклад
і збирає ru.html + app.ru.js.

    python _i18n.py            зібрати ru.html і app.ru.js
    python _i18n.py --missing  показати рядки без перекладу

Після правок у index.html або app.js: запустити --missing, дописати
переклади нових рядків у i18n/ru.json, зібрати, потім python _ver.py.
"""
import io
import json
import re
import sys

CYR = re.compile("[А-Яа-яІіЇїЄєҐґ]")
# атрибути, які не перекладаємо: адреси, id, класи
SKIP_ATTR = {"href", "src", "id", "class", "for", "name", "type", "role", "rel", "target",
             "width", "height", "loading", "viewBox", "d", "transform", "fill", "stroke"}


def html_parts(s):
    """Розбиває HTML на шматки: (тип, текст). Тип: tag / text / raw."""
    out = []
    raw = False
    for tok in re.split(r"(<[^>]+>)", s):
        if tok.startswith("<"):
            out.append(("tag", tok))
            if re.match(r"<(script|style)\b", tok, re.I):
                raw = True
            elif re.match(r"</(script|style)", tok, re.I):
                raw = False
        else:
            out.append(("raw" if raw else "text", tok))
    return out


def js_strings(src):
    """Позиції рядкових літералів у JS: список (початок, кінець) вмісту без лапок."""
    res = []
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c == "/" and src.startswith("//", i):
            i = src.find("\n", i)
            i = n if i < 0 else i
        elif c == "/" and src.startswith("/*", i):
            i = src.find("*/", i + 2)
            i = n if i < 0 else i + 2
        elif c in "'\"`":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            res.append((i + 1, j))
            i = j + 1
        else:
            i += 1
    return res


def collect():
    keys = []
    seen = set()

    def add(k):
        if k not in seen:
            seen.add(k)
            keys.append(k)

    s = io.open("index.html", encoding="utf-8").read()
    for kind, tok in html_parts(s):
        if kind == "tag":
            for k, v in re.findall(r'([\w:-]+)="([^"]*)"', tok):
                if k not in SKIP_ATTR and CYR.search(v):
                    add(v)
        elif kind == "text" and CYR.search(tok):
            add(tok.strip())
    js = io.open("app.js", encoding="utf-8").read()
    for a, b in js_strings(js):
        if CYR.search(js[a:b]):
            add(js[a:b])
    return keys


def build(tr):
    missing = []

    def t(k):
        if k in tr:
            return tr[k]
        missing.append(k)
        return k

    s = io.open("index.html", encoding="utf-8").read()
    out = []
    for kind, tok in html_parts(s):
        if kind == "tag":
            tok = re.sub(r'([\w:-]+)="([^"]*)"',
                         lambda m: '%s="%s"' % (m.group(1), t(m.group(2)))
                         if m.group(1) not in SKIP_ATTR and CYR.search(m.group(2)) else m.group(0),
                         tok)
        elif kind == "text" and CYR.search(tok):
            core = tok.strip()
            tok = tok.replace(core, t(core), 1)
        out.append(tok)
    page = "".join(out)

    # мова, перемикач, скрипт
    page = page.replace("document.documentElement.lang='uk'", "document.documentElement.lang='ru'")
    page = re.sub(r'<a href="index.html" class="lang-a on"[^>]*>UA</a>\s*<a href="ru.html" class="lang-a"[^>]*>RU</a>',
                  '<a href="index.html" class="lang-a" hreflang="uk" lang="uk">UA</a>'
                  '<a href="ru.html" class="lang-a on" aria-current="true" hreflang="ru" lang="ru">RU</a>', page)
    page = re.sub(r'src="app\.js(\?v=[0-9a-f]+)?"', 'src="app.ru.js"', page)
    io.open("ru.html", "w", encoding="utf-8", newline="\n").write(page)

    js = io.open("app.js", encoding="utf-8").read()
    parts, last = [], 0
    for a, b in js_strings(js):
        if CYR.search(js[a:b]):
            parts.append(js[last:a])
            parts.append(t(js[a:b]))
            last = b
    parts.append(js[last:])
    io.open("app.ru.js", "w", encoding="utf-8", newline="\n").write("".join(parts))
    return missing


def main():
    tr = json.load(io.open("i18n/ru.json", encoding="utf-8"))
    if "--missing" in sys.argv:
        miss = [k for k in collect() if k not in tr]
        for k in miss:
            print(json.dumps(k, ensure_ascii=False))
        print("без перекладу:", len(miss))
        return
    missing = build(tr)
    if missing:
        print("УВАГА: без перекладу лишилось %d рядків, запустіть --missing" % len(set(missing)))
    print("ru.html і app.ru.js зібрано")


if __name__ == "__main__":
    main()
