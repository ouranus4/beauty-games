# -*- coding: utf-8 -*-
"""
Спрайт іконок, логотип і прелоадер для обох сторінок.

Джерело правди — цей файл. Після правок запустити:
    python _sprite.py

Стиль іконок — тонкий білий контур із неоновою підсвіткою.
Сітка 24x24, товщина штриха 1.6, колір успадковується (currentColor),
напівпрозорість і світіння задає CSS (.icon).
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
    <linearGradient id="plGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7A2BE0"/>
      <stop offset=".5" stop-color="#E6007E"/>
      <stop offset="1" stop-color="#00E5FF"/>
    </linearGradient>
  </defs>
"""

# Контурні іконки. Сітка 24x24.
ICONS = {
# ---------- категорії чемпіонату ----------
"brow":      '<path d="M3 15.5C5.5 9.8 10.2 7 17 7c2 0 3.4.6 4 1.6"/>',
"lash":      ('<path d="M2.5 13.5C5 10 8.3 8.2 12 8.2s7 1.8 9.5 5.3c-2.5 3.5-5.8 5.3-9.5 5.3s-7-1.8-9.5-5.3Z"/>'
              '<circle cx="12" cy="13.5" r="2.8"/>'
              '<path d="M12 5.6V3.2M5.6 6.8 4.2 4.8M18.4 6.8l1.4-2"/>'),
"nails":     ('<path d="M8.6 6.4C8.6 4.5 10.1 3 12 3s3.4 1.5 3.4 3.4c0 2-.6 5.6-1.2 8.8-.2 1.4-1.1 2.2-2.2 2.2s-2-.8-2.2-2.2c-.6-3.2-1.2-6.8-1.2-8.8Z"/>'
              '<path d="M8.8 19.6h6.4"/>'),
"pmu":       ('<path d="m16.4 3.4 4.2 4.2L9.8 18.4l-5.2 1.4 1.4-5.2Z"/>'
              '<path d="m14.6 5.2 4.2 4.2M5.9 15.7l2.4 2.4"/>'),
"makeup":    ('<rect x="8.4" y="10.6" width="7.2" height="10.4" rx="1.8"/>'
              '<path d="M9.8 4.2c0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2v6.4H9.8Z"/>'),
"hair":      ('<path d="M6.6 5.2 17.4 16M17.4 5.2 6.6 16"/>'
              '<circle cx="5.4" cy="18.4" r="2.6"/><circle cx="18.6" cy="18.4" r="2.6"/>'),
"extension": ('<path d="M7.4 2.8C4.6 6.5 3.8 10.4 4.8 14.2c.8 2.9 2.5 5.4 5 7.8"/>'
              '<path d="M12 2.8c-2.1 3.8-2.5 7.6-1.2 11.3.9 2.7 2.5 5.2 4.7 7.6"/>'
              '<path d="M16.6 3.1c-1.3 3.8-1.1 7.5.5 11 1 2.2 2.3 4.3 3.9 6.2"/>'),
"skin":      '<path d="M12 2.6c3.9 4.7 7 8.8 7 12.2A7 7 0 0 1 5 14.8c0-3.4 3.1-7.5 7-12.2Z"/>',
"massage":   ('<path d="M5 12.8a1.7 1.7 0 0 1 3.4 0v1.2h.4V6.2a1.7 1.7 0 0 1 3.4 0v7.8h.4V4.8a1.7 1.7 0 0 1 3.4 0v9.2h.4V7.4a1.7 1.7 0 0 1 3.4 0v8.8A5.8 5.8 0 0 1 14 22h-1.1a5 5 0 0 1-4.1-2.2l-3.2-4.6a1.8 1.8 0 0 1-.6-1.3Z"/>'),
"laser":     ('<path d="M12 2.4 13.6 9l6.6 1.6-6.6 1.6L12 18.8l-1.6-6.6L3.8 10.6 10.4 9Z"/>'
              '<path d="M19 4.2 20.8 2.4M3.4 21.4l1.8-1.8"/>'),

# ---------- нагороди ----------
"crown":     ('<path d="M2.8 8.4 6 11.8l3.4-6.6c.5-1 1.7-1 2.2 0l3.4 6.6 3.2-3.4c.8-.9 2.2-.2 2 1L18.6 19a1.6 1.6 0 0 1-1.6 1.3H7a1.6 1.6 0 0 1-1.6-1.3L2.8 9.4c-.2-1.2 1.2-1.9 2-1Z"/>'
              '<circle cx="12" cy="15.6" r="1.4"/>'),
"diamond":   ('<path d="M7.4 3.2h9.2l4 5.4L12 20.8 3.4 8.6Z"/>'
              '<path d="M3.4 8.6h17.2M7.4 3.2 9.6 8.6 12 20.8 14.4 8.6 16.6 3.2"/>'),
"heart":     '<path d="M12 20.8C5.6 16.4 2.6 12.9 2.6 9.2A4.9 4.9 0 0 1 7.6 4.2c1.8 0 3.4.9 4.4 2.3a5.2 5.2 0 0 1 4.4-2.3 4.9 4.9 0 0 1 5 5c0 3.7-3 7.2-9.4 11.6Z"/>',
"joker":     '<path d="m12 2.4 2.9 6 6.5.8-4.8 4.4 1.3 6.4-5.9-3.2-5.9 3.2 1.3-6.4-4.8-4.4 6.5-.8Z"/>',
"trophy":    ('<path d="M7 3.4h10v6.4a5 5 0 0 1-10 0Z"/>'
              '<path d="M7 5.6H4.6a1.4 1.4 0 0 0-1.4 1.4 5 5 0 0 0 4 4.9M17 5.6h2.4a1.4 1.4 0 0 1 1.4 1.4 5 5 0 0 1-4 4.9"/>'
              '<path d="M10.4 14.8v2.8M13.6 14.8v2.8M7.4 20.6h9.2"/>'),

# ---------- блоки сайту ----------
"program":   ('<path d="M3.4 4.6A1.6 1.6 0 0 1 5 3h5.4a1.4 1.4 0 0 1 1.4 1.4v15.2a1.4 1.4 0 0 0-1.4-1.4H5a1.6 1.6 0 0 1-1.6-1.6Z"/>'
              '<path d="M20.6 4.6A1.6 1.6 0 0 0 19 3h-5.4a1.4 1.4 0 0 0-1.4 1.4v15.2a1.4 1.4 0 0 1 1.4-1.4H19a1.6 1.6 0 0 0 1.6-1.6Z"/>'),
"team":      ('<circle cx="8.6" cy="7.4" r="3.4"/>'
              '<path d="M2.6 20.2a6 6 0 0 1 12 0Z"/>'
              '<path d="M16 5.2a3 3 0 0 1 0 5.8M16.8 13.4a5.4 5.4 0 0 1 4.6 5.3v1.5h-4"/>'),
"camera":    ('<rect x="2.6" y="6.4" width="13.4" height="11.2" rx="2.6"/>'
              '<path d="m16 11 4.1-2.7a.8.8 0 0 1 1.3.7v6a.8.8 0 0 1-1.3.7L16 13Z"/>'
              '<circle cx="19.4" cy="4.4" r="1.6"/>'),
"coin":      ('<ellipse cx="12" cy="6.2" rx="8.4" ry="3.4"/>'
              '<path d="M3.6 6.2v11.6c0 1.9 3.8 3.4 8.4 3.4s8.4-1.5 8.4-3.4V6.2"/>'
              '<path d="M3.6 12c0 1.9 3.8 3.4 8.4 3.4s8.4-1.5 8.4-3.4"/>'),
"chart":     ('<rect x="2.8" y="13" width="4.6" height="8.2" rx="1.4"/>'
              '<rect x="9.7" y="8" width="4.6" height="13.2" rx="1.4"/>'
              '<rect x="16.6" y="2.8" width="4.6" height="18.4" rx="1.4"/>'),
"shop":      ('<path d="M3.4 7.4h17.2l-1.3 12a1.8 1.8 0 0 1-1.8 1.6H6.5a1.8 1.8 0 0 1-1.8-1.6Z"/>'
              '<path d="M8.4 10V6.2a3.6 3.6 0 0 1 7.2 0V10"/>'),
"vote":      ('<path d="M20.4 10.6v8.2a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8v-8.2"/>'
              '<path d="M3.6 10.6 12 3.2l8.4 7.4"/><path d="M9 20.6v-6h6v6"/>'),
}

ICON_ATTRS = ('fill="none" stroke="currentColor" stroke-width="1.6" '
              'stroke-linecap="round" stroke-linejoin="round"')


def build_sprite():
    parts = ['<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false" '
             'style="position:absolute;pointer-events:none">', DEFS.strip()]
    parts.append('  <symbol id="bg-logo" viewBox="%s"><path transform="%s" d="%s" fill="currentColor"/></symbol>'
                 % (LOGO_VB, LOGO_TR, LOGO_D))
    for name, body in ICONS.items():
        parts.append('  <symbol id="i-%s" viewBox="0 0 24 24"><g %s>%s</g></symbol>'
                     % (name, ICON_ATTRS, body))
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
    print(page, "- sprite,", len(ICONS), "line icons + logo")
