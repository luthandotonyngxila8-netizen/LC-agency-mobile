#!/usr/bin/env python3
"""Drop the generated imagery into the site's placeholder slots.

Straight cover-crops, not the blur-fill used for product shots — these are
scenes and textures, so losing an edge costs nothing. What does matter is
*which* edge: the page heroes carry a headline on the left and the craft blocks
carry a scrim across the bottom, so those get an anchored crop instead of a
centred one.
"""
import os, re, glob
from PIL import Image

U = "/root/.claude/uploads/d90ec272-125e-5fc8-bd82-7b380eab47be"
OUT = "/home/user/LC-agency-mobile/images"

# name, IMG number, target w, target h, vertical anchor (0 = keep top, 1 = keep bottom)
JOBS = [
    ("hide-ostrich",        6224, 1000, 1250, 0.5),
    ("hide-crocodile",      6225, 1000, 1250, 0.5),
    ("hide-nguni",          6219, 1000, 1250, 0.5),

    ("skin-ostrich",        6218, 1400,  933, 0.5),
    ("skin-crocodile",      6226, 1400,  933, 0.5),
    ("skin-nguni",          6230, 1400,  933, 0.5),
    ("skin-springbok",      6228, 1400,  933, 0.5),
    ("skin-zebra",          6227, 1400,  933, 0.5),

    ("toggle-the-hide",     6213, 1400,  933, 0.5),
    ("toggle-the-hand",     6223, 1400,  933, 0.5),
    ("bespoke-process",     6212, 1400,  933, 0.5),
    ("heritage-archive",    6211, 1400,  933, 0.5),

    # scrim across the bottom — hold the empty foreground, take it off the top
    ("craft-cutting-table", 6210, 1800,  771, 0.42),
    ("craft-east-london",   6209, 1800,  771, 0.72),

    # headline on the left; vertical centre is fine, the left edge is untouched
    ("skins-hero",          6222, 1920,  900, 0.5),
    ("bespoke-hero",        6208, 1920,  900, 0.5),
    ("heritage-hero",       6207, 1920,  900, 0.5),

    ("series-1999-circle",  6206,  900,  900, 0.5),
    ("og-asekho-twaku",     6205, 1200,  630, 0.5),
]

SRC = {}
for f in glob.glob(os.path.join(U, "*IMG_*")):
    m = re.search(r"IMG_(\d+)", f)
    if m:
        SRC[int(m.group(1))] = f


def cover(im, W, H, anchor):
    scale = max(W / im.width, H / im.height)
    r = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    x = (r.width - W) // 2
    y = round((r.height - H) * anchor)
    return r.crop((x, y, x + W, y + H))


for name, num, W, H, anchor in JOBS:
    im = Image.open(SRC[num]).convert("RGB")
    out = cover(im, W, H, anchor)
    j = os.path.join(OUT, name + ".jpg")
    w = os.path.join(OUT, name + ".webp")
    out.save(j, "JPEG", quality=82, optimize=True, progressive=True)
    out.save(w, "WEBP", quality=76, method=6)
    up = "  (upscaled)" if im.width < W else ""
    print("%-22s <- IMG_%d  %5dx%-5d -> %4dx%-4d %6.0fKB%s"
          % (name, num, im.width, im.height, W, H,
             os.path.getsize(j) / 1024, up))
