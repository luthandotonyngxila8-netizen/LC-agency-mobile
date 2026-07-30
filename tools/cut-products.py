#!/usr/bin/env python3
"""Lift each product off its shop screenshot and onto a transparent WebP.

The uploads are storefront screenshots, so they carry chrome the site must not
inherit: a green NEW flag, a star row, a struck-through price and a saturated
social rail down the right edge.

Everything here is a crop and an alpha mask - no pixel of the packaging is
redrawn, so labels, claims and barcodes stay exactly as photographed.

The backdrop is removed by flood fill from the image border rather than by a
brightness threshold. Half this range is white packaging on a white sweep; a
threshold eats the product, while a fill only takes backdrop that is actually
connected to the edge.
"""
import pathlib
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

# Point this at the folder holding the original storefront screenshots.
# Re-run only when the source photography changes; the committed .webp files
# are the output and are what the site actually loads.
UP = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "img"

SOURCES = {
    "body-butter": "658b8cd2-6676e8138f0a4fc5acd075f952a17848.jpeg",
    "brightening-serum": "54e02414-5a76d1ef12b4452686fb7c0b7744deb7.jpeg",
    "tissue-oil": "835d736f-7c6b482b0a55418eada10dcde71f9638.jpeg",
    "brightening-roll-on": "9e1df071-b2717a64cc584428890b66559fabc22c.jpeg",
    "honey-mask": "074e3db7-4398ed536f924837948b3e99052cdf6b.jpeg",
}

# Vertical slice holding the product, above the title row. Fractions of height.
SEARCH = {
    "body-butter": (0.02, 0.68),
    "brightening-serum": (0.02, 0.74),
    "tissue-oil": (0.02, 0.70),
    "brightening-roll-on": (0.02, 0.62),
    "honey-mask": (0.04, 0.60),
}

BACKDROP = 11     # how far off pure white still counts as sweep
EDGE = 4          # local contrast that counts as a packaging outline
MIN_BLOB = 4000   # px; smaller leftovers are badge shards, not product
SLIVER = 0.12     # min:max bbox ratio below which a blob is a border hairline


def drop_chrome(rgb):
    """Paint storefront furniture white so the fill swallows it."""
    a = rgb.astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(2), a.min(2)
    sat = mx - mn

    green_flag = (g > r + 25) & (g > b + 25) & (sat > 40)
    social_rail = (sat > 55) & (mx > 70) & ~green_flag
    # the rail lives hard against the right edge; keep product colour elsewhere
    rail = np.zeros_like(green_flag)
    rail[:, int(rail.shape[1] * 0.86):] = True

    out = rgb.copy()
    out[green_flag | (social_rail & rail)] = 255
    return out


def backdrop_alpha(rgb):
    """Alpha from a border flood fill: 0 on sweep, 255 on product.

    Half this range is white packaging photographed on a white sweep, where
    the only thing dividing product from backdrop is a faint outline. So the
    outline is turned into a wall the fill cannot cross: without it the fill
    escapes through the softest pixel of the rim and hollows the bottle out.
    """
    grey = rgb.astype(np.int16).max(2)
    nearly_white = grey >= (255 - BACKDROP)

    # local contrast marks every packaging edge, however faint
    g = grey.astype(np.uint8)
    contrast = ndimage.maximum_filter(g, 3).astype(np.int16) - ndimage.minimum_filter(g, 3)
    wall = ndimage.binary_dilation(contrast > EDGE, iterations=1)

    # only sweep that is white *and* not part of an outline may be filled
    fillable = nearly_white & ~wall

    labels, _ = ndimage.label(fillable)
    edge = set(labels[0].tolist()) | set(labels[-1].tolist())
    edge |= set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
    edge.discard(0)

    background = np.isin(labels, list(edge)) if edge else np.zeros_like(fillable)

    # everything the fill could not reach is product; close its interior
    solid = ndimage.binary_fill_holes(~background)

    # the walls hugged the outline, so give the matte that hair back
    solid = ndimage.binary_closing(solid, np.ones((5, 5)))
    solid = ndimage.binary_fill_holes(solid)

    # discard confetti left by the badge arrow, card edges or JPEG ringing.
    # a screenshot's card border survives on area alone - it is a tall hairline
    # - so shape decides too: nothing that thin is a bottle or a jar.
    blobs, k = ndimage.label(solid)
    if k:
        sizes = ndimage.sum(solid, blobs, range(1, k + 1))
        boxes = ndimage.find_objects(blobs)
        biggest = float(sizes.max())
        keep = []
        for i, size in enumerate(sizes):
            ys, xs = boxes[i]
            h, w = ys.stop - ys.start, xs.stop - xs.start
            sliver = min(h, w) / max(h, w) < SLIVER
            if size >= MIN_BLOB and size >= biggest * 0.05 and not sliver:
                keep.append(i + 1)
        solid = np.isin(blobs, keep)
    return (solid * 255).astype(np.uint8)


def cut(name, filename):
    im = Image.open(UP / filename).convert("RGB")
    lo, hi = SEARCH[name]
    top, bottom = int(im.height * lo), int(im.height * hi)

    band = np.asarray(im)[top:bottom]
    band = drop_chrome(band)
    alpha = backdrop_alpha(band)

    if not alpha.any():
        raise SystemExit(f"{name}: found no product")

    a = Image.fromarray(alpha, "L")
    # pull the matte in a hair, then feather, so no white halo survives
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

    out = Image.fromarray(band, "RGB").convert("RGBA")
    out.putalpha(a)
    out = out.crop(out.getbbox())

    target = 1100
    scale = target / max(out.size)
    out = out.resize(
        (max(1, round(out.width * scale)), max(1, round(out.height * scale))),
        Image.LANCZOS,
    )

    # WebP with alpha: a tenth of the PNG for the same picture, and every
    # browser the shop is likely to meet has supported it for years
    path = OUT / f"product-{name}.webp"
    out.save(path, "WEBP", quality=86, method=6)
    print(f"{name:20s} -> {str(out.size):12s} {path.stat().st_size // 1024:4d}KB")


for key, src in SOURCES.items():
    cut(key, src)
