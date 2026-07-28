#!/usr/bin/env python3
"""Turn the client's 30 product photos into site assets.

The layout wants 4:5 at 1200x1500. The photos run from 0.46 to 2.09, so a
straight cover-crop would cut half the bag off the wide ones. Instead: crop
only when it costs little, and otherwise sit the whole photo on a blurred,
darkened copy of itself. Nothing is lost and the frame stays uniform.
"""
import glob, os, re, sys
from PIL import Image, ImageFilter, ImageEnhance

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from manifest import PRODUCTS, NEEDS_CROP
from crop import content_box

# Where the client's original photographs live. They are not in the repo — pass
# the folder as argv[1], or drop them beside this file in ./originals/.
U = (sys.argv[1] if len(sys.argv) > 1
     else os.path.join(os.path.dirname(os.path.abspath(__file__)), "originals")) + "/"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "images", "products")
W, H = 1000, 1250
MAX_CROP = 0.18          # how much of the source we will throw away to fill the frame

os.makedirs(OUT, exist_ok=True)

SRC = {}
for f in glob.glob(U + "*IMG_*"):
    SRC[int(re.search(r"IMG_(\d+)", f).group(1))] = f


def load(n):
    im = Image.open(SRC[n])
    im = im.convert("RGB")
    if n in NEEDS_CROP:
        im = im.crop(content_box(im))
    return im


def frame(im):
    """Fit im into W x H — cover if cheap, otherwise contain on a blurred bed."""
    sar, dar = im.width / im.height, W / H
    cut = 1 - (dar / sar) if sar > dar else 1 - (sar / dar)

    if cut <= MAX_CROP:
        scale = max(W / im.width, H / im.height)
        r = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        return r.crop(((r.width - W) // 2, (r.height - H) // 2,
                       (r.width - W) // 2 + W, (r.height - H) // 2 + H))

    # bed: the same photo, blown out to cover, blurred and knocked back
    scale = max(W / im.width, H / im.height) * 1.16
    bed = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    bed = bed.crop(((bed.width - W) // 2, (bed.height - H) // 2,
                    (bed.width - W) // 2 + W, (bed.height - H) // 2 + H))
    bed = bed.filter(ImageFilter.GaussianBlur(38))
    bed = ImageEnhance.Brightness(bed).enhance(0.62)
    bed = ImageEnhance.Color(bed).enhance(0.55)

    # photo: contained, as large as the frame allows
    scale = min(W / im.width, H / im.height)
    fg = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    bed.paste(fg, ((W - fg.width) // 2, (H - fg.height) // 2))
    return bed


count = 0
for p in PRODUCTS:
    for i, n in enumerate(p["imgs"], 1):
        out = frame(load(n))
        base = "%s/%s-%02d" % (OUT, p["slug"], i)
        out.save(base + ".jpg", "JPEG", quality=78, optimize=True, progressive=True)
        out.save(base + ".webp", "WEBP", quality=72, method=6)
        count += 1
print("wrote %d images (jpg + webp) to %s" % (count, OUT))
