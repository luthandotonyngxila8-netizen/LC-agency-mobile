#!/usr/bin/env python3
"""Write data/products.json from the manifest.

Copy rules: anything specific to a piece is written from what the photograph
actually shows. Anything that cannot be seen — dimensions, weights, lead times —
is not invented. House-level blocks come from the 2024 business profile.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from manifest import PRODUCTS, CATEGORY_ORDER

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "data", "products.json")

HIDE_STORY = {
    "Ostrich": (
        "The hide",
        "Full-quill ostrich comes off the prime back of the bird, where the follicles stand "
        "proud and leave the quill field everyone recognises. It is cut one panel at a time, "
        "because the field has to be placed rather than simply laid out — which costs hide, and "
        "is the whole point. No two pieces carry the same pattern, and ostrich takes on a soft "
        "sheen exactly where your hand falls."),
    "Nguni": (
        "The hide",
        "Nguni is the cattle of this country, and we use the skin with the hair left on. Every "
        "one is marked differently — that is the point, and it is also the problem, because it "
        "means we cut for the marking and accept the waste. The panel on your piece will not "
        "turn up on anybody else's."),
    "Zebra": (
        "The hide",
        "Zebra is used hide-on, and it is cut around the marking rather than through it. Every "
        "skin is sourced with its paperwork in order and checked against CITES before anything "
        "is cut. A run is limited by what the skins give, not by what we would like to make."),
    "Full-grain": (
        "How it ages",
        "Full-grain is the whole top of the hide, with nothing sanded off to hide a scar. It "
        "marks, and it is supposed to — the surface darkens where it is handled and the colour "
        "moves over years rather than months. It is the leather that looks worse in a "
        "photograph and better after five."),
}

MAKING = [
    "Cut by hand in the East London workshop",
    "Made to order — nothing here is cut before it is ordered",
    "Built by a house that has been working leather since 1999",
    "Part of the workshop's skills-transfer programme in East London and Mdantsane",
]

CARE = [
    "Wipe with a dry cloth. Never soak.",
    "Condition twice a year with a neutral cream — no silicone",
    "Store stuffed and out of direct sun",
    "Hide-on panels: brush with the hair, never against it",
    "Bring it back for repair whenever it needs it, for as long as you own it",
]

DEFAULT_PRICE_NOTE = ("Made to order in the East London workshop. WhatsApp us to confirm "
                      "the lead time before anything is cut.")
DEFAULT_SPEC_NOTE = ("Dimensions are confirmed on WhatsApp before we cut — every piece is "
                     "made to order.")


def related_for(p, all_p):
    """Two others: same category first, then anything sharing the hide."""
    same = [q for q in all_p if q is not p and q["category"] == p["category"]]
    same.sort(key=lambda q: (abs(q["price"] - p["price"])))
    out = [q["slug"] for q in same[:2]]
    if len(out) < 2:
        rest = [q for q in all_p if q is not p and q["slug"] not in out
                and q["hide"] == p["hide"]]
        out += [q["slug"] for q in rest[:2 - len(out)]]
    if len(out) < 2:
        rest = [q for q in all_p if q is not p and q["slug"] not in out]
        out += [q["slug"] for q in rest[:2 - len(out)]]
    return out


products = []
for p in PRODUCTS:
    heading, body = HIDE_STORY[p["hide"]]
    products.append({
        "id": p["slug"],
        "ref": p["ref"],
        "category": p["category"],
        "name": p["name"],
        "hide": p["hide"],
        "price": p["price"],
        "priceNote": p.get("price_note", DEFAULT_PRICE_NOTE),
        "materialLine": p["material"],
        "moodLine": p["mood"],
        "images": [
            {"src": "images/products/%s-%02d" % (p["slug"], i), "alt": alt}
            for i, alt in enumerate(p["alts"], 1)
        ],
        "video": "",
        "finishLabel": "Finish",
        "finishes": p["finishes"],
        "personalisation": {"enabled": False, "maxChars": 3, "label": ""},
        "editorial": [
            {"heading": "What it is", "body": p["what"]},
            {"heading": heading, "body": body},
        ],
        "specs": {
            "Size & Fit": [p.get("spec_note", DEFAULT_SPEC_NOTE)],
            "Materials": [p["material"]],
            "Details": p["details"],
            "The Making": MAKING,
            "Care": CARE,
        },
        "series1999": False,
        "related": [],
    })

for p, src in zip(products, PRODUCTS):
    p["related"] = related_for(src, PRODUCTS)

data = {
    "currency": "ZAR",
    "whatsapp": "27796448562",
    "categories": CATEGORY_ORDER,
    "products": products,
}

with open(OUT, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("wrote %s — %d products, %d images" %
      (OUT, len(products), sum(len(p["images"]) for p in products)))
