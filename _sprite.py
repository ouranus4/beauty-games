# -*- coding: utf-8 -*-
"""
Спрайт іконок, логотип і прелоадер для обох сторінок.

Джерело правди — цей файл. Після правок запустити:
    python _sprite.py
Він перезбирає блок <!-- SPRITE --> ... <!-- /SPRITE --> в index.html
і partners.html, тож сторінки не розходяться між собою.

Стиль іконок — «надута глянцева пластика»: щільна форма, залита
радіальним градієнтом зі зміщеним центром, зверху блик, знизу темний
край. Читається об'ємно на чорному тлі.
"""
import io, re

# Векторна емблема з логобука (assets/logo-emblem.svg)
LOGO_D = ("M0 0 10.562-10.562H23.928L9.563-28.966-7.014-24.057V11.189L11.614 17.33 54.82-5.281 32.64-16.889 40.439 0Z"
          "M-58.827-64.757V-48.983L-24.783-31.885-24.816-14.468-34.49-10.005-24.783-3.301V13.375L-58.827 30.473V46.247"
          "L-42.795 38.202-42.795-56.712ZM-33.223 20.763-33.223 3.665-45.635-4.898-33.223-11.354-33.223-25.529"
          "-58.827-38.202-58.827 33.436ZM-70.802 55.005V-73.515L83.714-9.193Z")
LOGO_TR = "matrix(1,0,0,-1,355.3672,197.2986)"
LOGO_VB = "282.88 122.06 153.76 160.69"

DEFS = """
  <defs>
    <!-- об'ємна заливка: світло згори-ліворуч, тінь знизу-праворуч -->
    <radialGradient id="gBall" cx="33%" cy="24%" r="82%">
      <stop offset="0"   stop-color="#FFC2E6"/>
      <stop offset=".34" stop-color="#FF4FA8"/>
      <stop offset=".72" stop-color="#D4007A"/>
      <stop offset="1"   stop-color="#5E1188"/>
    </radialGradient>
    <radialGradient id="gBallCy" cx="33%" cy="24%" r="82%">
      <stop offset="0"   stop-color="#D6FBFF"/>
      <stop offset=".34" stop-color="#5BE8FF"/>
      <stop offset=".72" stop-color="#00A8C4"/>
      <stop offset="1"   stop-color="#1B3E9E"/>
    </radialGradient>
    <radialGradient id="gBallGold" cx="33%" cy="24%" r="82%">
      <stop offset="0"   stop-color="#FFF4CE"/>
      <stop offset=".36" stop-color="#FFC94B"/>
      <stop offset=".74" stop-color="#F2760A"/>
      <stop offset="1"   stop-color="#A8005E"/>
    </radialGradient>
    <!-- блик -->
    <radialGradient id="gShine" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity=".92"/>
      <stop offset=".6" stop-color="#fff" stop-opacity=".28"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="plGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7A2BE0"/>
      <stop offset=".5" stop-color="#E6007E"/>
      <stop offset="1" stop-color="#00E5FF"/>
    </linearGradient>
  </defs>
"""

S = '<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="url(#gShine)" transform="rotate(%s %s %s)"/>'

ICONS = {
# ---------- категорії чемпіонату ----------
"brow": """
  <path d="M5 20.5c3.4-7.2 9.6-10.8 18.4-10.8 2.4 0 3.6 1.4 3.6 3s-1.2 2.6-3.2 3c-5 .9-8.8 2.3-11.6 4.1-2.6 1.7-4.6 3.4-6.2 3.4-1.4 0-1.6-1.4-1-2.7Z" fill="url(#gBall)"/>
""" + S % ("13","14.6","5.6","2.2","-16","13","14.6"),

"lash": """
  <path d="M16 11.4c5.6 0 10.6 3.2 13 6.6.5.7.5 1.6 0 2.3-2.4 3.4-7.4 6.6-13 6.6S5.4 23.7 3 20.3a2 2 0 0 1 0-2.3c2.4-3.4 7.4-6.6 13-6.6Z" fill="url(#gBall)"/>
  <circle cx="16" cy="19" r="4.6" fill="#2A0335" opacity=".7"/>
  <circle cx="14.4" cy="17.2" r="1.7" fill="#fff" opacity=".9"/>
  <g stroke="url(#gBall)" stroke-width="3" stroke-linecap="round">
    <path d="M16 8.6V4.2"/><path d="M7.6 10.2 5.2 6.4"/><path d="M24.4 10.2 26.8 6.4"/>
  </g>
""" + S % ("12","15","5","2.4","-20","12","15"),

"nails": """
  <path d="M10.6 8.2C10.6 5 13 2.6 16 2.6s5.4 2.4 5.4 5.6c0 3-.9 8.4-1.7 13.2-.4 2.4-1.8 3.8-3.7 3.8s-3.3-1.4-3.7-3.8c-.8-4.8-1.7-10.2-1.7-13.2Z" fill="url(#gBall)"/>
  <rect x="10.2" y="26.2" width="11.6" height="3.6" rx="1.8" fill="url(#gBall)" opacity=".8"/>
""" + S % ("14","9","2.6","4.6","-12","14","9"),

"pmu": """
  <path d="M22.4 3.2a2.6 2.6 0 0 1 3.7 0l2.7 2.7a2.6 2.6 0 0 1 0 3.7L13.9 24.5a3 3 0 0 1-1.4.8l-6 1.5a1.2 1.2 0 0 1-1.4-1.5l1.5-6c.1-.5.4-1 .8-1.4Z" fill="url(#gBall)"/>
  <path d="m7.6 21.8 2.6 2.6-3.5.9Z" fill="#2A0335" opacity=".7"/>
""" + S % ("21","8.4","2.2","5","45","21","8.4"),

"makeup": """
  <rect x="10.6" y="14.4" width="10.8" height="15.2" rx="3" fill="url(#gBall)"/>
  <path d="M12.6 5.2c0-1.7 1.5-3 3.4-3s3.4 1.3 3.4 3v9.2h-6.8Z" fill="url(#gBall)"/>
""" + S % ("14.4","8.6","1.5","3.6","0","14.4","8.6") + S % ("13.6","20","1.8","4.4","0","13.6","20"),

"hair": """
  <path d="M9.4 7.6a2 2 0 0 1 2.8 0l12.4 12.6a2 2 0 0 1-2.8 2.8L9.4 10.4a2 2 0 0 1 0-2.8Z" fill="url(#gBall)"/>
  <path d="M22.6 7.6a2 2 0 0 1 0 2.8L10.2 23a2 2 0 1 1-2.8-2.8L19.8 7.6a2 2 0 0 1 2.8 0Z" fill="url(#gBall)" opacity=".85"/>
  <circle cx="6.8" cy="25.8" r="4" fill="url(#gBall)"/>
  <circle cx="25.2" cy="25.8" r="4" fill="url(#gBall)"/>
  <circle cx="6.8" cy="25.8" r="1.5" fill="#2A0335" opacity=".6"/>
  <circle cx="25.2" cy="25.8" r="1.5" fill="#2A0335" opacity=".6"/>
""" + S % ("13","11","2","3.4","45","13","11"),

"extension": """
  <path d="M9.6 3.4c-4 5-5.2 10.2-3.8 15.4 1 3.8 3.2 7.2 6.6 10.4" stroke="url(#gBall)" stroke-width="4.4" fill="none" stroke-linecap="round"/>
  <path d="M16.4 3.4c-3 5.2-3.6 10.3-1.8 15.4 1.3 3.6 3.5 7 6.6 10.4" stroke="url(#gBall)" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".8"/>
  <path d="M23.2 3.8c-1.8 5.2-1.6 10.2.6 14.9 1.4 3 3.2 5.8 5.4 8.5" stroke="url(#gBall)" stroke-width="4.4" fill="none" stroke-linecap="round" opacity=".6"/>
""" + S % ("8.6","8","1.5","3.4","12","8.6","8"),

"skin": """
  <path d="M16 2.8c5.2 6.4 9.4 12 9.4 16.6 0 5.2-4.2 9.4-9.4 9.4s-9.4-4.2-9.4-9.4C6.6 14.8 10.8 9.2 16 2.8Z" fill="url(#gBall)"/>
""" + S % ("12.4","14.2","2.8","5.4","-18","12.4","14.2"),

"massage": """
  <path d="M6.6 17c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3v1.6h.6V8.4c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3v10.2h.6V6.4c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3v12.2h.6V9.8c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3v11.8c0 4.6-3.7 8.4-8.4 8.4h-1.5c-2.6 0-5-1.3-6.5-3.5l-3.2-4.6a2.4 2.4 0 0 1-.4-1.4Z" fill="url(#gBall)"/>
""" + S % ("13.4","10","1.6","3.8","0","13.4","10"),

"laser": """
  <path d="M16 1.8c1 0 1.8.7 2 1.6l1.9 8.4 8.4 1.9c1 .2 1.7 1 1.7 2s-.7 1.8-1.7 2l-8.4 1.9-1.9 8.4c-.2 1-1 1.7-2 1.7s-1.8-.7-2-1.7l-1.9-8.4-8.4-1.9c-1-.2-1.7-1-1.7-2s.7-1.8 1.7-2l8.4-1.9 1.9-8.4c.2-.9 1-1.6 2-1.6Z" fill="url(#gBall)"/>
""" + S % ("12.6","11","2.4","4","-40","12.6","11"),

# ---------- нагороди ----------
"crown": """
  <path d="M3.4 10.8c0-1.7 1.9-2.6 3.2-1.6l5 3.7 4-7.6c.7-1.4 2.7-1.4 3.4 0l4 7.6 5-3.7c1.3-1 3.2-.1 3.2 1.6l-2.4 13.6c-.2 1.3-1.3 2.2-2.6 2.2H8.4c-1.3 0-2.4-.9-2.6-2.2Z" fill="url(#gBallGold)"/>
  <circle cx="16" cy="19.6" r="2.4" fill="#fff" opacity=".55"/>
""" + S % ("9.6","14.4","2.6","4.4","-28","9.6","14.4"),

"diamond": """
  <path d="M9.6 3.6h12.8c.6 0 1.2.3 1.6.8l5 6.4c.5.7.5 1.7-.1 2.4L17.5 27.8a2 2 0 0 1-3 0L3.1 13.2c-.6-.7-.6-1.7-.1-2.4l5-6.4c.4-.5 1-.8 1.6-.8Z" fill="url(#gBall)"/>
  <path d="M3 12h26" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>
  <path d="m9.6 3.6 2.6 8.4h7.6l2.6-8.4" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" fill="none"/>
""" + S % ("10","8","3","2","-14","10","8"),

"heart": """
  <path d="M16 28.4C7 22.3 2.6 17.4 2.6 12.1 2.6 7.5 6.2 4.2 10.5 4.2c2.4 0 4.4 1 5.5 2.8 1.1-1.8 3.1-2.8 5.5-2.8 4.3 0 7.9 3.3 7.9 7.9 0 5.3-4.4 10.2-13.4 16.3Z" fill="url(#gBall)"/>
""" + S % ("9.8","10.6","3","4.6","-24","9.8","10.6"),

"joker": """
  <path d="M16 2.2c.8 0 1.5.5 1.8 1.2l3.3 7.2 7.9.9c1.7.2 2.4 2.3 1.1 3.4l-5.8 5.3 1.6 7.8c.3 1.7-1.4 3-2.9 2.1L16 26.1l-6.9 3.9c-1.5.9-3.3-.4-2.9-2.1l1.6-7.8-5.8-5.3c-1.3-1.2-.6-3.3 1.1-3.4l7.9-.9 3.3-7.2c.3-.7 1-1.2 1.7-1.2Z" fill="url(#gBall)"/>
""" + S % ("11.6","10","2.6","4","-28","11.6","10"),

"trophy": """
  <path d="M8.6 3.6h14.8v9c0 4.1-3.3 7.4-7.4 7.4s-7.4-3.3-7.4-7.4Z" fill="url(#gBallGold)"/>
  <path d="M8.6 6.2H5.4a2 2 0 0 0-2 2c0 3.6 2.6 6.6 6 7.2M23.4 6.2h3.2a2 2 0 0 1 2 2c0 3.6-2.6 6.6-6 7.2" stroke="url(#gBallGold)" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <rect x="13.6" y="19.4" width="4.8" height="4.8" fill="url(#gBallGold)"/>
  <rect x="8" y="24" width="16" height="4.6" rx="2" fill="url(#gBallGold)"/>
""" + S % ("12","8","2.4","4.6","-14","12","8"),

# ---------- блоки сайту ----------
"program": """
  <path d="M4.4 5.6c0-1.2 1-2.2 2.2-2.2h7.2c1 0 1.8.8 1.8 1.8v20.4c0-1-.8-1.8-1.8-1.8H6.6a2.2 2.2 0 0 1-2.2-2.2Z" fill="url(#gBall)"/>
  <path d="M27.6 5.6c0-1.2-1-2.2-2.2-2.2h-7.2c-1 0-1.8.8-1.8 1.8v20.4c0-1 .8-1.8 1.8-1.8h7.2c1.2 0 2.2-1 2.2-2.2Z" fill="url(#gBall)" opacity=".7"/>
  <rect x="3.4" y="25.8" width="25.2" height="3.2" rx="1.6" fill="url(#gBall)" opacity=".55"/>
""" + S % ("8.6","9","2.4","4.4","-10","8.6","9"),

"team": """
  <circle cx="11" cy="9.6" r="5" fill="url(#gBall)"/>
  <circle cx="22.6" cy="11.8" r="4.2" fill="url(#gBall)" opacity=".75"/>
  <path d="M2.6 26.4C2.6 21.8 6.4 18 11 18s8.4 3.8 8.4 8.4a1.4 1.4 0 0 1-1.4 1.4H4a1.4 1.4 0 0 1-1.4-1.4Z" fill="url(#gBall)"/>
  <path d="M20.8 19.2a7.6 7.6 0 0 1 2.8-.6c3.8 0 6.8 3.1 6.8 6.9a1.4 1.4 0 0 1-1.4 1.4h-6.8c0-2.8-.6-5.4-1.4-7.7Z" fill="url(#gBall)" opacity=".75"/>
""" + S % ("9","7.6","1.8","2.8","-20","9","7.6"),

"camera": """
  <rect x="2.4" y="8.4" width="19.4" height="15.2" rx="4" fill="url(#gBall)"/>
  <path d="m23.4 14.2 4.9-3.3c1-.7 2.3 0 2.3 1.2v9.8c0 1.2-1.3 1.9-2.3 1.2l-4.9-3.3Z" fill="url(#gBall)" opacity=".75"/>
  <circle cx="26.6" cy="5.8" r="2.8" fill="#FF4FA8"/>
""" + S % ("7.4","12.4","3.2","2.2","-16","7.4","12.4"),

"coin": """
  <ellipse cx="16" cy="8.4" rx="11.8" ry="4.8" fill="url(#gBall)"/>
  <path d="M4.2 8.4v13.8c0 2.6 5.3 4.8 11.8 4.8s11.8-2.2 11.8-4.8V8.4Z" fill="url(#gBall)" opacity=".82"/>
  <ellipse cx="16" cy="8.4" rx="11.8" ry="4.8" fill="url(#gBall)"/>
  <path d="M4.2 15.4c0 2.6 5.3 4.8 11.8 4.8s11.8-2.2 11.8-4.8" stroke="#2A0335" stroke-opacity=".35" stroke-width="1.6" fill="none"/>
""" + S % ("10.6","7","3.8","1.8","0","10.6","7"),

"chart": """
  <rect x="3" y="17.4" width="6.6" height="11.6" rx="3" fill="url(#gBall)" opacity=".6"/>
  <rect x="12.7" y="10.4" width="6.6" height="18.6" rx="3" fill="url(#gBall)" opacity=".82"/>
  <rect x="22.4" y="3" width="6.6" height="26" rx="3" fill="url(#gBall)"/>
""" + S % ("24.4","8","1.4","3.4","0","24.4","8"),
}


def build_sprite():
    parts = ['<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false" '
             'style="position:absolute;pointer-events:none">', DEFS.strip()]
    parts.append('  <symbol id="bg-logo" viewBox="%s"><path transform="%s" d="%s" fill="currentColor"/></symbol>'
                 % (LOGO_VB, LOGO_TR, LOGO_D))
    for name, body in ICONS.items():
        parts.append('  <symbol id="i-%s" viewBox="0 0 32 32">%s  </symbol>' % (name, body.rstrip() + "\n"))
    parts.append('</svg>')
    return "\n".join(parts)


PRELOADER = """
<div class="preloader" id="preloader" aria-hidden="true">
  <svg class="pl-inf" viewBox="0 0 200 104" aria-hidden="true">
    <path class="pl-inf-track" d="M100 52C82 26 60 20 44 28 28 36 26 60 40 72c14 12 38 6 60-20 22-26 46-32 62-24 16 8 18 32 4 44-14 12-38 6-60-20Z"/>
    <path class="pl-inf-run"   d="M100 52C82 26 60 20 44 28 28 36 26 60 40 72c14 12 38 6 60-20 22-26 46-32 62-24 16 8 18 32 4 44-14 12-38 6-60-20Z"/>
  </svg>
  <div class="pl-word">Beauty Games</div>
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
    print(page, "- sprite + preloader,", len(ICONS), "icons + logo")
