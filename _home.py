# -*- coding: utf-8 -*-
"""
Головна без гри.

Джерело правди — game.html (стара головна з кроками) і game-ru.html.
Скрипт прибирає гру (замок, кроки 1–4, тест, місії, досьє), додає вхід
із завісою й палац на першому екрані та збирає index.html і ru.html.
Руками їх не правити: правки тексту — у game.html.

    python _i18n.py    зібрати game-ru.html і app.ru.js
    python _home.py    зібрати index.html і ru.html
    python _ver.py     проставити версії
"""
import io
import re

TEXT = {
    'uk': {
        'lang': 'uk', 'logo_alt': 'Казковий палац гри: Ірина Вербова та Олександра Горобець на вершині сходів',
        'skip': 'Пропустити', 'load': 'Завантаження гри', 'season': 'Сезон 2026',
        'inv': 'Тебе запрошено в гру', 'inv_sub': 'Ірина Вербова та Олександра Горобець відкривають двері', 'enter': 'Увійти',
        'ab_k': 'Про проєкт', 'ab_t': 'Реаліті-шоу, бізнес-навчання <span class="glow">і чемпіонат</span>',
        'ab_l': 'Один сезон, три складові. Ви обираєте, скільки з них берете.',
        'c1_t': 'Бізнес-навчання', 'c1': 'Дев’ять модулів, куратор і домашні завдання з перевіркою.',
        'c2_t': 'Онлайн-чемпіонат', 'c2': 'Змагання у вашій категорії: журі з практиків, кубки, сертифікат.',
        'c3_t': 'Реаліті-шоу', 'c3': 'Вас знімають: ви в кадрі шоу, за вами стежать глядачі.',
        'f_k': 'Формат участі', 'f_t': 'Три шляхи <span class="glow">в сезоні</span>',
        'f_l': 'Усі ведуть до бізнесу. Різниця в тому, наскільки публічним буде ваш шлях.',
    },
    'ru': {
        'lang': 'ru', 'logo_alt': 'Сказочный дворец игры: Ирина Вербовая и Александра Горобец на вершине лестницы',
        'skip': 'Пропустить', 'load': 'Загрузка игры', 'season': 'Сезон 2026',
        'inv': 'Тебя пригласили в игру', 'inv_sub': 'Ирина Вербовая и Александра Горобец открывают двери', 'enter': 'Войти',
        'ab_k': 'О проекте', 'ab_t': 'Реалити-шоу, бизнес-обучение <span class="glow">и чемпионат</span>',
        'ab_l': 'Один сезон, три составляющие. Вы выбираете, сколько из них берёте.',
        'c1_t': 'Бизнес-обучение', 'c1': 'Девять модулей, куратор и домашние задания с проверкой.',
        'c2_t': 'Онлайн-чемпионат', 'c2': 'Соревнование в вашей категории: жюри из практиков, кубки, сертификат.',
        'c3_t': 'Реалити-шоу', 'c3': 'Вас снимают: вы в кадре шоу, за вами следят зрители.',
        'f_k': 'Формат участия', 'f_t': 'Три пути <span class="glow">в сезоне</span>',
        'f_l': 'Все ведут к бизнесу. Разница в том, насколько публичным будет ваш путь.',
    },
}

INTRO = '''<div class="intro" id="intro" data-step="load">
  <div class="curtain curtain-l"></div>
  <div class="curtain curtain-r"></div>
  <button class="skip" id="skip" type="button">{skip}</button>
  <div class="stage">
    <div class="load" role="status">
      <svg aria-hidden="true"><use href="#bg-logo"/></svg>
      <span class="intro-k">{load} <span id="pct">0</span>%</span>
      <div class="bar"><i id="barFill"></i></div>
    </div>
    <div class="invite">
      <svg aria-hidden="true"><use href="#bg-logo"/></svg>
      <span class="intro-k">{season}</span>
      <p class="invite-h">{inv}</p>
      <p>{inv_sub}</p>
      <button class="btn btn-primary" id="open" type="button">{enter}</button>
    </div>
  </div>
</div>
'''

ABOUT = '''<section class="sec sec-light" id="about">
  <div class="wrap">
    <div class="sec-head rv">
      <span class="eyebrow">{ab_k}</span>
      <h2 class="h-lg">{ab_t}</h2>
      <div class="sec-rule"></div>
      <p class="lede">{ab_l}</p>
    </div>
    <div class="trio">
      <article class="trio-c rv"><svg class="icon" aria-hidden="true"><use href="#i-program"/></svg><h3>{c1_t}</h3><p>{c1}</p></article>
      <article class="trio-c rv"><svg class="icon" aria-hidden="true"><use href="#i-trophy"/></svg><h3>{c2_t}</h3><p>{c2}</p></article>
      <article class="trio-c rv"><svg class="icon" aria-hidden="true"><use href="#i-tv"/></svg><h3>{c3_t}</h3><p>{c3}</p></article>
    </div>
  </div>
</section>'''


def cut(s, start, end, keep_end=True):
    """Вирізає шматок від start до end. Без маркера падає: краще помилка, ніж гра на головній."""
    a = s.index(start)
    b = s.index(end, a + len(start))
    return s[:a] + s[b if keep_end else b + len(end):]


def build(src, out, t):
    s = io.open(src, encoding='utf-8').read()

    s = cut(s, '<div class="preloader" id="preloader">', '<svg class="sprite"')
    s = cut(s, '<!-- ============ ЗАМОК НА ВХОДІ', '<!-- Прогрес по сторінці')
    s = cut(s, '<!-- Прогрес по сторінці', '<!-- ============ ШАПКА')

    # перший екран: текст із джерела, ігрові блоки геть
    s = cut(s, '<div class="tip" id="tip"', '<div class="hello rv" id="hello">')
    s = cut(s, '<div class="hello rv" id="hello">', '<div class="picker rv" id="picker">')
    s = cut(s, '<div class="picker rv" id="picker">', '<div style="display:flex;gap:12px;flex-wrap:wrap">')
    s = cut(s, '<div class="countdown rv" id="countdown">', '  </div>\n</header>')
    s = s.replace('<header class="hero" id="top">',
                  INTRO.format(**t) + '<header class="hero" id="top">\n'
                  '  <div class="world"><img src="assets/home/palace.jpg" alt="%s" width="1920" height="1284"></div>\n'
                  '  <canvas id="dust" aria-hidden="true"></canvas>' % t['logo_alt'])

    # про проєкт замість тесту
    s = cut(s, '<section class="sec" id="about">', '<!-- ============ КРОК 3')
    s = s.replace('<!-- ============ КРОК 3', ABOUT.format(**t) + '\n\n<!-- ============ КРОК 3', 1)

    # формат: місії геть, три шляхи лишаються
    a = s.index('<section class="sec" id="format">')
    head = s.index('<div class="sec-head rv">', a)
    ways = s.index('<p class="ways-k">', a)
    s = s[:head] + ('<div class="sec-head rv">\n      <span class="eyebrow">{f_k}</span>\n      <h2 class="h-lg">{f_t}</h2>\n'
                    '      <div class="sec-rule"></div>\n      <p class="lede">{f_l}</p>\n    </div>\n\n    ').format(**t) + s[ways:]

    # досьє гравця у формі
    s = cut(s, '<div class="pickbox" id="pickBox" hidden>', '<form')

    s = s.replace('href="#picker"', 'href="#apply"')
    s = s.replace('<section class="sec form-sec" id="apply">', '<section class="sec form-sec" id="apply"><span id="picker"></span>')
    # прикраси з рисунка на стиках блоків
    s = s.replace('<section class="sec" id="format">', '<img class="deco deco-l" src="assets/home/lipstick.webp" alt="" loading="lazy">\n<section class="sec" id="format">', 1)
    s = s.replace('<section class="sec" id="program">', '<img class="deco deco-r" src="assets/home/polish.webp" alt="" loading="lazy">\n<section class="sec" id="program">', 1)
    s = s.replace('<section class="sec" id="packages">', '<img class="deco deco-c" src="assets/home/gamecard.webp" alt="" loading="lazy">\n<section class="sec" id="packages">', 1)
    # вся сторінка світла
    s = s.replace('<section class="sec"', '<section class="sec sec-light"')

    s = s.replace('<link rel="stylesheet" href="squid.css', '<link rel="preload" as="image" href="assets/home/palace.jpg">\n<link rel="stylesheet" href="squid.css', 1)
    s = re.sub(r'(<link rel="stylesheet" href="squid\.css[^>]*>)',
               r'\1\n<link rel="stylesheet" href="home.css">\n<noscript><style>.intro{display:none}</style></noscript>'
               r'\n<script>window.BG_PLAIN=1;document.documentElement.classList.add("plain");</script>', s, count=1)
    s = re.sub(r'(<script src="fx\.js[^>]*></script>)', r'\1\n<script src="home.js"></script>', s, count=1)

    # мовний перемикач і посилання між версіями
    s = s.replace('href="game.html" class="lang-a', 'href="index.html" class="lang-a').replace('href="game-ru.html" class="lang-a', 'href="ru.html" class="lang-a')
    s = s.replace('hreflang="uk" href="https://beauty-games.pro/game"', 'hreflang="uk" href="https://beauty-games.pro/"')
    s = s.replace('hreflang="ru" href="https://beauty-games.pro/game-ru.html"', 'hreflang="ru" href="https://beauty-games.pro/ru.html"')
    io.open(out, 'w', encoding='utf-8', newline='\n').write(s)
    print(out, 'зібрано')


if __name__ == '__main__':
    build('game.html', 'index.html', TEXT['uk'])
    build('game-ru.html', 'ru.html', TEXT['ru'])
