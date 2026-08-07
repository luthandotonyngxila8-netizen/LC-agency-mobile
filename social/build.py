#!/usr/bin/env python3
"""Build the posting queue: images at the right sizes, captions, and dates.

    python3 social/build.py                 # 15 weeks from next Monday — all 30 pieces
    python3 social/build.py 2026-09-01 26   # from a date, for 26 weeks

Writes:
    social/images/<key>-feed.jpg    1080x1350   Instagram and Facebook feed
    social/images/<key>-story.jpg   1080x1920   Stories and Reels covers
    social/queue.csv                the schedule, one row per post
    social/queue.md                 the same thing, readable, for approval

Nothing here posts anything. It produces the month of content; scheduling it is
a separate step and is documented in social/README.md.
"""
import csv, json, os, sys, datetime, itertools
from PIL import Image, ImageFilter, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from plan import (CADENCE, BASE_TAGS, HIDE_TAGS, CATEGORY_TAGS, SHAPES,
                  EDITORIAL, SITE, WHATSAPP)

IMG_OUT = os.path.join(HERE, "images")
os.makedirs(IMG_OUT, exist_ok=True)

FEED = (1080, 1350)   # 4:5 — the tallest the feed allows, so the most screen
STORY = (1080, 1920)  # 9:16

DAY_NUM = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}


# ----------------------------------------------------------------- images ---
def frame(im, W, H):
    """Fit to W x H. Crop when it costs little, otherwise sit the whole photo
    on a blurred copy of itself — a bag with its handles cut off is worse than
    a soft border."""
    sar, dar = im.width / im.height, W / H
    cut = 1 - (dar / sar) if sar > dar else 1 - (sar / dar)

    if cut <= 0.18:
        s = max(W / im.width, H / im.height)
        r = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        return r.crop(((r.width - W) // 2, (r.height - H) // 2,
                       (r.width - W) // 2 + W, (r.height - H) // 2 + H))

    s = max(W / im.width, H / im.height) * 1.18
    bed = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    bed = bed.crop(((bed.width - W) // 2, (bed.height - H) // 2,
                    (bed.width - W) // 2 + W, (bed.height - H) // 2 + H))
    bed = bed.filter(ImageFilter.GaussianBlur(42))
    bed = ImageEnhance.Brightness(bed).enhance(0.58)
    bed = ImageEnhance.Color(bed).enhance(0.5)

    s = min(W / im.width, H / im.height)
    fg = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    bed.paste(fg, ((W - fg.width) // 2, (H - fg.height) // 2))
    return bed


def render(src_rel, key):
    src = os.path.join(ROOT, src_rel)
    if not os.path.exists(src):
        return None, None
    im = Image.open(src).convert("RGB")
    out = {}
    for label, size in (("feed", FEED), ("story", STORY)):
        p = os.path.join(IMG_OUT, "%s-%s.jpg" % (key, label))
        frame(im, *size).save(p, "JPEG", quality=86, optimize=True, progressive=True)
        out[label] = os.path.relpath(p, ROOT)
    return out["feed"], out["story"]


# --------------------------------------------------------------- captions ---
def money(n):
    return "R" + format(n, ",").replace(",", " ")


def tags_for(extra):
    seen, out = set(), []
    for t in list(extra) + BASE_TAGS:
        if t.lower() not in seen:
            seen.add(t.lower()); out.append("#" + t)
    return " ".join(out[:22])          # Instagram allows 30; 22 reads less desperate


def product_post(p, shape):
    material = p["materialLine"].split(". ")[0].rstrip(".") + "."
    body = shape.format(name=p["name"], price=money(p["price"]),
                        mood=p["moodLine"], material=material)
    extra = HIDE_TAGS.get(p["hide"], []) + CATEGORY_TAGS.get(p["category"], [])
    return body, tags_for(extra)


# ------------------------------------------------------------------ build ---
def main():
    start = (datetime.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1
             else datetime.date.today() + datetime.timedelta(days=7 - datetime.date.today().weekday()))
    weeks = int(sys.argv[2]) if len(sys.argv) > 2 else 15

    data = json.load(open(os.path.join(ROOT, "data", "products.json")))
    products = data["products"]

    # Monday sells, Wednesday teaches, Friday invites. Cheapest pieces first so
    # a cold audience meets a R1 800 sling before a R72 000 briefcase.
    by_price = sorted(products, key=lambda p: p["price"])
    editorial = itertools.cycle(EDITORIAL)
    shapes = itertools.cycle(SHAPES)
    prod = iter(by_price)

    rows = []
    for w in range(weeks):
        monday = start + datetime.timedelta(weeks=w)
        for day in CADENCE:
            when = monday + datetime.timedelta(days=DAY_NUM[day] - DAY_NUM[CADENCE[0]])

            if day == "Wed":
                e = next(editorial)
                feed, story = render("images/%s.jpg" % e["image"], e["key"])
                rows.append(dict(date=when.isoformat(), day=day, kind="editorial",
                                 key=e["key"], caption=e["text"],
                                 tags=tags_for(e["tags"]), feed=feed, story=story,
                                 link=SITE))
                continue

            try:
                p = next(prod)
            except StopIteration:
                prod = iter(by_price)
                p = next(prod)
            body, tags = product_post(p, next(shapes))
            feed, story = render(p["images"][0]["src"] + ".jpg", p["id"])
            rows.append(dict(date=when.isoformat(), day=day, kind="product",
                             key=p["id"], caption=body, tags=tags,
                             feed=feed, story=story,
                             link=SITE + "product.html?id=" + p["id"]))

    with open(os.path.join(HERE, "queue.csv"), "w", newline="") as f:
        wtr = csv.DictWriter(f, fieldnames=["date", "day", "kind", "key",
                                            "caption", "tags", "feed", "story", "link"])
        wtr.writeheader(); wtr.writerows(rows)

    with open(os.path.join(HERE, "queue.md"), "w") as f:
        f.write("# Posting queue\n\n%d posts, %s to %s.\n\n"
                % (len(rows), rows[0]["date"], rows[-1]["date"]))
        f.write("Captions end with a call to WhatsApp %s or the site.\n\n" % WHATSAPP)
        for r in rows:
            f.write("---\n\n## %s · %s · %s\n\n`%s`\n\n%s\n\n%s\n\n"
                    % (r["date"], r["day"], r["kind"], r["feed"] or "NO IMAGE",
                       r["caption"], r["tags"]))

    imgs = len({r["key"] for r in rows})
    print("%d posts over %d weeks, %s -> %s" % (len(rows), weeks, rows[0]["date"], rows[-1]["date"]))
    print("%d image sets rendered into social/images/" % imgs)
    print("queue.csv and queue.md written")
    missing = [r["key"] for r in rows if not r["feed"]]
    if missing:
        print("!! no image found for: %s" % ", ".join(sorted(set(missing))))


if __name__ == "__main__":
    main()
