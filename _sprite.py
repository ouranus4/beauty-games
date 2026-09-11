# -*- coding: utf-8 -*-
"""
Спрайт іконок, логотип і вхідний екран.

Джерело правди — цей файл плюс _icons.py. Після правок запустити:
    python _sprite.py

Іконки інтерфейсу — вектор із _icons.py (сітка 24x24, тонкий контур).
Пікселями лишилися тільки сердечка і зірка вхідного екрана: там це
доречно, бо це заставка гри. Їхні id починаються з i-px-.
"""
import io, re
from _icons import ICONS, ATTRS

# Векторна емблема з логобука
# Контур емблеми беремо просто з assets/logo-emblem.svg.
# Раніше тут лежала обрізана копія цього шляху, і знак виходив кривий.
LOGO_D = "M0 0 10.562-10.562H23.928L9.563-28.966-7.014-24.057V11.189L11.614 17.33 54.82-5.281 32.64-16.889 40.439 0ZM-58.827-64.757V-48.983L-24.783-31.885-24.816-14.468-34.497-6.841-24.811-3.054V18.703L-58.827 37.917V54.195L-1.423 24.153-17.576 18.828V-31.944L-3.879-36ZM-35.368-19.6-35.357-25.187-58.827-37.312V25.969L-35.373 12.342V4.157L-53.21-3.721ZM-70.302 73.151V-83.714L79.568-5.281Z"
LOGO_TR = "matrix(1,0,0,-1,355.3672,197.2986)"
LOGO_VB = "282.88 122.06 153.76 160.69"

# Піксельна графіка — тільки для вхідного екрана
PX = {

"heart": """
................
................
..####...####...
.######.######..
###############.
################
################
################
.##############.
..############..
...##########...
....########....
.....######.....
......####......
.......##.......
................
""",

# Зірка навмисно п'ятикутна: попередня була симетричним ромбом
# і в обертанні читалася як хрестик, а не як зірка.


# Дві фази бігу: кадри чергуються, тому фігурка «біжить»
# по смузі прогресу етапів. Це жінка — хвіст і спідниця.
"run1": """
................
.......####.....
.......####.....
....####........
...##########...
...##...####....
.......######...
......######....
.....########...
....##########..
.......##.##....
......##...##...
.....##.....##..
.....##.....##..
................
................
""",

"run2": """
................
.......####.....
.......####.....
....####........
...##########...
...####...##....
.......######...
......######....
.....########...
....##########..
........####....
.......##..##...
......##....##..
......##....##..
................
................
""",

"star": """
................
.......##.......
.......##.......
......####......
......####......
.##############.
..############..
...##########...
....########....
...##########...
...###....###...
..###......###..
..##........##..
................
................
................
""",
}


def _rows(pat):
    return [r for r in pat.strip('\n').split('\n') if r.strip()]


def pattern_to_svg(pat):
    rows = _rows(pat)
    out = []
    for y, row in enumerate(rows):
        x = 0
        while x < len(row):
            if row[x] == '#':
                w = 1
                while x + w < len(row) and row[x + w] == '#':
                    w += 1
                out.append('<rect x="%d" y="%d" width="%d" height="1"/>' % (x, y, w))
                x += w
            else:
                x += 1
    return ''.join(out)


def build_sprite():
    parts = ['<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false" '
             'style="position:absolute;pointer-events:none">']
    parts.append('  <symbol id="bg-logo" viewBox="%s"><path transform="%s" d="%s" fill="currentColor"/></symbol>'
                 % (LOGO_VB, LOGO_TR, LOGO_D))
    for name in sorted(ICONS):
        parts.append('  <symbol id="i-%s" viewBox="0 0 24 24"><g %s>%s</g></symbol>'
                     % (name, ATTRS, ICONS[name]))
    for name in sorted(PX):
        rows = _rows(PX[name])
        w, h = len(rows[0]), len(rows)
        parts.append('  <symbol id="i-px-%s" viewBox="0 0 %d %d" shape-rendering="crispEdges">'
                     '<g fill="currentColor">%s</g></symbol>'
                     % (name, w, h, pattern_to_svg(PX[name])))
    parts.append('</svg>')
    return "\n".join(parts)


# Вхідний екран: спочатку смуга LOADING, далі вікно «Почати гру?».
# Кнопка навмисно піксельна рамкою, але підпис усередині — звичайний
# Montserrat: піксельний шрифт на кирилиці читається погано.
PRELOADER = """
<div class="preloader" id="preloader">
  <div class="px-win pl-win">
    <div class="px-win-bar">
      <span class="px-win-title">Beauty Games · Season 2026</span>
      <span class="px-win-btns" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>
    <div class="px-win-body">
      <div class="pl-stage" id="plStage">
        <img class="pl-logo" src="assets/logo-vertical.svg" alt="Beauty Games" width="260" height="150">
        <div class="pl-label">Завантажуємо гру…</div>
        <div class="pl-bar"><span class="pl-bar-fill" id="plBar"></span></div>
        <div class="pl-pct" id="plPct">0%</div>
        <div class="pl-meta">
          <span>Season 2026</span>
          <span>Reality show</span>
          <span>Championship</span>
          <span>Education</span>
        </div>
      </div>
      <div class="pl-start" id="plStart" hidden>
        <div class="pl-ask">Почати гру?</div>
        <button class="px-btn px-btn-lg" id="plGo" type="button">Почати</button>
        <div class="pl-hint">Сезон 2026</div>
      </div>
    </div>
  </div>
</div>
"""

BLOCK = "<!-- SPRITE -->\n%s\n%s\n<!-- /SPRITE -->" % (PRELOADER.strip(), build_sprite())

for page in ("index.html", "partners.html"):
    s = io.open(page, encoding="utf-8").read()
    if "<!-- SPRITE -->" in s:
        s = re.sub(r"<!-- SPRITE -->.*?<!-- /SPRITE -->", lambda m: BLOCK, s, flags=re.S)
    else:
        anchor = '<div class="bg-mesh" aria-hidden="true"></div>'
        assert s.count(anchor) == 1, page
        s = s.replace(anchor, BLOCK + "\n\n" + anchor)
    io.open(page, "w", encoding="utf-8").write(s)
    print(page, "-", len(ICONS), "vector +", len(PX), "pixel")
