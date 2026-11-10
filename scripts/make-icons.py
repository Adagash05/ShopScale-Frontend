#!/usr/bin/env python3
"""Build every app icon from the official ShopScale logo.

Usage:  python3 scripts/make-icons.py path/to/official-logo.png [--background "#ffffff"]
Needs:  pip install pillow
The logo is never redrawn: it is only scaled (aspect ratio kept) and centred on a transparent or solid square.
Writes into public/icons/ and public/brand/.
"""
import sys, os
from PIL import Image

def fit(logo, size, pad, bg):
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * pad))
    w, h = logo.size
    scale = min(inner / w, inner / h)
    l = logo.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas.alpha_composite(l, ((size - l.width) // 2, (size - l.height) // 2))
    return canvas

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    bg = "#ffffff"
    if "--background" in sys.argv:
        bg = sys.argv[sys.argv.index("--background") + 1]
    logo = Image.open(src).convert("RGBA")
    root = os.path.join(os.path.dirname(__file__), "..", "public")
    os.makedirs(os.path.join(root, "icons"), exist_ok=True)
    os.makedirs(os.path.join(root, "brand"), exist_ok=True)
    clear = (0, 0, 0, 0)
    fit(logo, 192, 0.14, bg).save(os.path.join(root, "icons/icon-192.png"))
    fit(logo, 512, 0.14, bg).save(os.path.join(root, "icons/icon-512.png"))
    fit(logo, 512, 0.22, bg).save(os.path.join(root, "icons/icon-maskable-512.png"))   # safe zone for Android masks
    fit(logo, 180, 0.12, bg).convert("RGB").save(os.path.join(root, "icons/apple-touch-icon.png"))
    fit(logo, 32, 0.04, bg).save(os.path.join(root, "icons/favicon-32.png"))
    fit(logo, 16, 0.02, bg).save(os.path.join(root, "icons/favicon-16.png"))
    if os.path.abspath(src) != os.path.abspath(os.path.join(root, "brand/logo.png")):
        logo.save(os.path.join(root, "brand/logo.png"))
    logo.resize((max(1, round(96 * logo.width / logo.height)), 96), Image.LANCZOS).save(os.path.join(root, "brand/logo-96.png"))   # keeps proportions
    print("Icons written to public/icons and public/brand")

main()
