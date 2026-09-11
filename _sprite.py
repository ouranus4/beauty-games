# -*- coding: utf-8 -*-
"""
Генератор спрайта іконок і прелоадера для обох сторінок.

Джерело правди — цей файл. Після правок запустити:
    python _sprite.py
Він перезбирає блок <!-- SPRITE --> ... <!-- /SPRITE --> в index.html
і partners.html, тож сторінки не розходяться між собою.
"""
import io, re

# ---------------------------------------------------------------
# Градієнти: «скляна» заливка в брендових кольорах + спекуляр
# ---------------------------------------------------------------
DEFS = """
  <defs>
    <linearGradient id="gIce" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF7ACB"/>
      <stop offset=".45" stop-color="#E6007E"/>
      <stop offset="1" stop-color="#7A2BE0"/>
    </linearGradient>
    <linearGradient id="gIceCy" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9BF6FF"/>
      <stop offset=".5" stop-color="#00C8E0"/>
      <stop offset="1" stop-color="#5B4BE0"/>
    </linearGradient>
    <linearGradient id="gSpec" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".85"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFE9A8"/>
      <stop offset=".5" stop-color="#FFC24B"/>
      <stop offset="1" stop-color="#E6007E"/>
    </linearGradient>
    <linearGradient id="plGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7A2BE0"/>
      <stop offset=".5" stop-color="#E6007E"/>
      <stop offset="1" stop-color="#00E5FF"/>
    </linearGradient>
  </defs>
"""

# ---------------------------------------------------------------
# Іконки. Сітка 32x32. Заливка gIce, зверху спекуляр gSpec.
# ---------------------------------------------------------------
ICONS = {
# --- категорії чемпіонату ---
"brow": """
  <path d="M4 19c3.6-6.4 9-9.6 16.2-9.6 3.4 0 6.1.7 8.1 2.1.8.6.5 1.9-.5 2-5.9.7-10.4 2.1-13.6 4.2C11.3 19.6 8.2 22 5.6 21.3 4.5 21 3.5 19.9 4 19Z" fill="url(#gIce)"/>
  <path d="M6 18.2c3.2-5 7.8-7.6 13.8-7.8-4.9 1.1-9.1 3.5-12.6 7.2-.5.5-1.4.9-1.2.6Z" fill="url(#gSpec)"/>
""",
"lash": """
  <path d="M16 11c5.4 0 10 3 12.4 6.2.4.5.4 1.1 0 1.6C26 22 21.4 25 16 25S6 22 3.6 18.8a1.3 1.3 0 0 1 0-1.6C6 14 10.6 11 16 11Z" fill="url(#gIce)" opacity=".92"/>
  <circle cx="16" cy="18" r="4.4" fill="#0A0512" opacity=".65"/>
  <circle cx="16" cy="18" r="2.1" fill="url(#gSpec)"/>
  <g stroke="url(#gIce)" stroke-width="2" stroke-linecap="round">
    <path d="M16 9V5"/><path d="M8.6 10.4 6.3 7"/><path d="M23.4 10.4 25.7 7"/>
    <path d="M2.8 13.6.4 11.9"/><path d="M29.2 13.6 31.6 11.9"/>
  </g>
""",
"nails": """
  <path d="M11 6.5C11 4.6 13.2 3 16 3s5 1.6 5 3.5c0 2.7-.9 8-1.6 13.4-.3 2.2-1.7 3.6-3.4 3.6s-3.1-1.4-3.4-3.6C11.9 14.5 11 9.2 11 6.5Z" fill="url(#gIce)"/>
  <path d="M13 6.4c0-1.1 1.4-2 3-2s3 .9 3 2c0 1.4-.3 3.4-.6 5.6h-4.8C13.3 9.8 13 7.8 13 6.4Z" fill="url(#gSpec)" opacity=".5"/>
  <rect x="10.5" y="25" width="11" height="4" rx="2" fill="url(#gIce)" opacity=".75"/>
""",
"pmu": """
  <path d="M22.8 3.6 28.4 9.2a2 2 0 0 1 0 2.8L14.2 26.2a3 3 0 0 1-1.5.8l-6.4 1.4a1 1 0 0 1-1.2-1.2l1.4-6.4a3 3 0 0 1 .8-1.5L21.4 3.6a2 2 0 0 1 1.4-.6Z" fill="url(#gIce)"/>
  <path d="M22.8 5.4 26.6 9.2 24 11.8 20.2 8 22.8 5.4Z" fill="url(#gSpec)" opacity=".7"/>
  <path d="m7.6 21.4 3 3-3.8.8.8-3.8Z" fill="#0A0512" opacity=".55"/>
""",
"makeup": """
  <rect x="11" y="14" width="10" height="15" rx="2.2" fill="url(#gIce)"/>
  <rect x="12.6" y="15.6" width="3" height="11" rx="1.5" fill="url(#gSpec)" opacity=".45"/>
  <path d="M13 4.4C13 3.1 14.3 2 16 2s3 1.1 3 2.4V14h-6V4.4Z" fill="url(#gIce)" opacity=".9"/>
  <path d="M14.4 4.6c0-.7.7-1.2 1.6-1.2v9.2h-1.6V4.6Z" fill="url(#gSpec)" opacity=".6"/>
""",
"hair": """
  <g stroke="url(#gIce)" stroke-width="2.4" stroke-linecap="round" fill="none">
    <path d="M9.4 9.4 24 24"/><path d="M22.6 9.4 8 24"/>
  </g>
  <circle cx="7" cy="26" r="3.6" fill="none" stroke="url(#gIce)" stroke-width="2.4"/>
  <circle cx="25" cy="26" r="3.6" fill="none" stroke="url(#gIce)" stroke-width="2.4"/>
  <circle cx="16" cy="16.4" r="1.8" fill="url(#gSpec)"/>
""",
"extension": """
  <path d="M10 3c-3.4 4.6-4.6 9.3-3.6 14.2C7.3 21.6 9.8 25.4 13.6 29" stroke="url(#gIce)" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M16.6 3c-2.6 4.8-3.2 9.5-1.8 14.2 1.2 4 3.6 7.8 7.2 11.8" stroke="url(#gIce)" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".75"/>
  <path d="M23.2 3.6c-1.6 4.8-1.6 9.4.2 13.8 1.4 3.4 3.4 6.6 6 9.6" stroke="url(#gIce)" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>
""",
"skin": """
  <path d="M16 2.6c5 6.2 9.2 11.8 9.2 16.4 0 5.1-4.1 9.2-9.2 9.2s-9.2-4.1-9.2-9.2C6.8 14.4 11 8.8 16 2.6Z" fill="url(#gIce)"/>
  <path d="M12.6 12.6c-2.2 3-3.4 5.6-3.4 7.6 0 .8.1 1.6.4 2.3-1.4-2.6-1.1-6.2 3-9.9Z" fill="url(#gSpec)"/>
  <circle cx="19.6" cy="21" r="2.4" fill="#fff" opacity=".35"/>
""",
"massage": """
  <path d="M6.4 16.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v2h.8V8.6c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v10.2h.8V6.4c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v12.4h.8V9.6c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v12.2c0 4.2-3.4 7.6-7.6 7.6h-1.4c-2.4 0-4.6-1.2-6-3.2L6.9 22a2 2 0 0 1-.5-1.3v-3.9Z" fill="url(#gIce)"/>
  <path d="M12.6 8.8c0-.5.4-.8.8-.8v10.8h-.8V8.8Z" fill="url(#gSpec)" opacity=".55"/>
""",
"laser": """
  <path d="M16 2 19 12l10 4-10 4-3 10-3-10-10-4 10-4 3-10Z" fill="url(#gIce)"/>
  <path d="M16 6.6 17.6 12 16 13.4 14.4 12 16 6.6Z" fill="url(#gSpec)"/>
  <g stroke="url(#gIce)" stroke-width="1.8" stroke-linecap="round" opacity=".55">
    <path d="M27 5.4 29.6 2.8"/><path d="M5 26.6 2.4 29.2"/>
  </g>
""",
# --- блоки сайту ---
"program": """
  <path d="M4 6.2C4 5 5 4 6.2 4h8c1.1 0 2 .9 2 2v20c0-1.1-.9-2-2-2h-8C5 24 4 23 4 21.8V6.2Z" fill="url(#gIce)"/>
  <path d="M28 6.2C28 5 27 4 25.8 4h-8c-1.1 0-2 .9-2 2v20c0-1.1.9-2 2-2h8c1.2 0 2.2-1 2.2-2.2V6.2Z" fill="url(#gIce)" opacity=".72"/>
  <path d="M6.4 6.6h7.2v8.8H6.4V6.6Z" fill="url(#gSpec)" opacity=".35"/>
  <rect x="4" y="26" width="24" height="2.6" rx="1.3" fill="url(#gIce)" opacity=".55"/>
""",
"team": """
  <circle cx="11" cy="10" r="4.6" fill="url(#gIce)"/>
  <circle cx="22.4" cy="12" r="3.8" fill="url(#gIce)" opacity=".72"/>
  <path d="M3 26c0-4.4 3.6-8 8-8s8 3.6 8 8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" fill="url(#gIce)"/>
  <path d="M20.6 19.2c1-.5 2-.8 3-.8 3.6 0 6.4 2.9 6.4 6.4a1 1 0 0 1-1 1h-6.6c0-2.5-.7-4.8-1.8-6.6Z" fill="url(#gIce)" opacity=".72"/>
  <circle cx="9.4" cy="8.6" r="1.6" fill="url(#gSpec)"/>
""",
"trophy": """
  <path d="M9 4h14v8.4c0 3.9-3.1 7-7 7s-7-3.1-7-7V4Z" fill="url(#gIce)"/>
  <path d="M9 6.4H5.6c-.9 0-1.6.7-1.6 1.6 0 3.4 2.4 6.2 5.6 6.8M23 6.4h3.4c.9 0 1.6.7 1.6 1.6 0 3.4-2.4 6.2-5.6 6.8" stroke="url(#gIce)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M13.6 19.4h4.8V24h-4.8z" fill="url(#gIce)" opacity=".8"/>
  <rect x="8.6" y="24" width="14.8" height="4" rx="1.6" fill="url(#gIce)"/>
  <path d="M11 5.6h3.4v7.2c0 .8-.6 1-1.2.6-1.4-1-2.2-2.6-2.2-4.4V5.6Z" fill="url(#gSpec)" opacity=".45"/>
""",
"crown": """
  <path d="M3 10.6c0-1.1 1.2-1.7 2.1-1.1l5.5 3.6 4-7.4c.5-1 1.9-1 2.4 0l4 7.4 5.5-3.6c.9-.6 2.1 0 2.1 1.1L26.4 24c-.1 1-1 1.7-2 1.7H7.6c-1 0-1.9-.7-2-1.7L3 10.6Z" fill="url(#gGold)"/>
  <path d="M5.4 11.8 7.6 23h3.2L8.6 13.6l-3.2-1.8Z" fill="url(#gSpec)" opacity=".5"/>
  <circle cx="16" cy="19" r="2.2" fill="#fff" opacity=".5"/>
""",
"diamond": """
  <path d="M9.4 4h13.2l6.4 7.4-13 16.4L3 11.4 9.4 4Z" fill="url(#gIce)"/>
  <path d="M9.4 4 12 11.4 16 27.8 6 11.4 9.4 4Z" fill="url(#gSpec)" opacity=".4"/>
  <path d="M3 11.4h26" stroke="#fff" stroke-opacity=".4" stroke-width="1.4"/>
  <path d="m9.4 4 2.6 7.4h8L22.6 4" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" fill="none"/>
""",
"heart": """
  <path d="M16 28C7.4 22.2 3 17.5 3 12.4 3 8 6.4 4.8 10.5 4.8c2.3 0 4.3 1 5.5 2.7 1.2-1.7 3.2-2.7 5.5-2.7C25.6 4.8 29 8 29 12.4c0 5.1-4.4 9.8-13 15.6Z" fill="url(#gIce)"/>
  <path d="M8.4 8c-1.9.9-3 2.6-3 4.7 0 1.4.4 2.8 1.3 4.2C5 14.4 5.4 10.2 8.4 8Z" fill="url(#gSpec)" opacity=".65"/>
""",
"joker": """
  <path d="m16 2 3.9 8.5 9.3 1.1-6.9 6.3 1.9 9.1-8.2-4.6-8.2 4.6 1.9-9.1L2.8 11.6l9.3-1.1L16 2Z" fill="url(#gIce)"/>
  <path d="m16 6.4 2 4.4-2 1.4-2-1.4 2-4.4Z" fill="url(#gSpec)"/>
""",
"camera": """
  <rect x="2.6" y="8.6" width="19" height="15" rx="3.2" fill="url(#gIce)"/>
  <path d="m23.6 14.4 5.1-3.4c.7-.5 1.7 0 1.7.9v10.2c0 .9-1 1.4-1.7.9l-5.1-3.4v-5.2Z" fill="url(#gIce)" opacity=".72"/>
  <rect x="4.8" y="10.8" width="7.4" height="5.4" rx="2" fill="url(#gSpec)" opacity=".4"/>
  <circle cx="26.4" cy="6" r="2.6" fill="#E6007E"/>
""",
"rocket": """
  <path d="M16 2c4.8 3.6 7.4 8.4 7.4 14.2v3.4l-3.4 3.4h-8l-3.4-3.4v-3.4C8.6 10.4 11.2 5.6 16 2Z" fill="url(#gIce)"/>
  <circle cx="16" cy="13" r="3.4" fill="#0A0512" opacity=".55"/>
  <circle cx="16" cy="13" r="1.6" fill="url(#gSpec)"/>
  <path d="M8.6 13.6 4.4 18c-.5.5-.8 1.2-.8 1.9v4.3l4.6-3.2M23.4 13.6l4.2 4.4c.5.5.8 1.2.8 1.9v4.3l-4.6-3.2" stroke="url(#gIce)" stroke-width="2" fill="none" stroke-linejoin="round"/>
  <path d="M13.4 24.4c.7 2.4 1.6 4.3 2.6 5.6 1-1.3 1.9-3.2 2.6-5.6h-5.2Z" fill="#E6007E"/>
""",
"coin": """
  <ellipse cx="16" cy="8.6" rx="11.4" ry="4.6" fill="url(#gIce)"/>
  <path d="M4.6 8.6v6.8c0 2.5 5.1 4.6 11.4 4.6s11.4-2.1 11.4-4.6V8.6" stroke="url(#gIce)" stroke-width="2.4" fill="none"/>
  <path d="M4.6 15.4v6.8c0 2.5 5.1 4.6 11.4 4.6s11.4-2.1 11.4-4.6v-6.8" stroke="url(#gIce)" stroke-width="2.4" fill="none" opacity=".7"/>
  <ellipse cx="11" cy="7.8" rx="3.6" ry="1.4" fill="url(#gSpec)" opacity=".55"/>
""",
"mind": """
  <path d="M20.4 3.4c4.8 0 8.6 3.9 8.6 8.6 0 2.4-1 4.6-2.6 6.2v4.4c0 1.3-1.1 2.4-2.4 2.4h-2.2v2.6c0 1.3-1.1 2.4-2.4 2.4h-7c-1.3 0-2.4-1.1-2.4-2.4v-4.2l-4.4-5c-.6-.7-.6-1.7 0-2.4l4.4-4.8c1.2-4.6 5.2-7.8 10.4-7.8Z" fill="url(#gIce)"/>
  <circle cx="21.6" cy="11" r="2.8" fill="#0A0512" opacity=".5"/>
  <circle cx="21.6" cy="11" r="1.2" fill="url(#gSpec)"/>
""",
"chart": """
  <rect x="3" y="17" width="6" height="12" rx="2" fill="url(#gIce)" opacity=".62"/>
  <rect x="13" y="10" width="6" height="19" rx="2" fill="url(#gIce)" opacity=".82"/>
  <rect x="23" y="3" width="6" height="26" rx="2" fill="url(#gIce)"/>
  <rect x="24.4" y="5" width="1.8" height="9" rx=".9" fill="url(#gSpec)" opacity=".55"/>
""",
}

def build_sprite():
    parts = ['<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false" '
             'style="position:absolute;pointer-events:none">', DEFS.strip()]
    for name, body in ICONS.items():
        parts.append('  <symbol id="i-%s" viewBox="0 0 32 32">%s  </symbol>' % (name, body.rstrip() + "\n"))
    parts.append('</svg>')
    return "\n".join(parts)

PRELOADER = """
<div class="preloader" id="preloader" aria-hidden="true">
  <div class="pl-core">
    <svg class="pl-ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle class="pl-track" cx="60" cy="60" r="52"/>
      <circle class="pl-arc" cx="60" cy="60" r="52"/>
    </svg>
    <svg class="pl-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M4 3 L36 20 L4 37 Z" stroke="#FF57AE" stroke-width="2.2"/>
      <path d="M12 12h8v6h-8v-6Zm0 10h8v6h-8v-6Zm10-7 7 5-7 5" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>
    </svg>
  </div>
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
    print(page, "- sprite + preloader written,", len(ICONS), "icons")
