# tools

How `data/products.json` and `images/products/` were built, so both can be
rebuilt rather than hand-edited.

- `manifest.py` — the catalogue itself: 30 pieces, each with its name, price,
  category, hide, standing colourways, the source photograph numbers in display
  order, alt text, and the copy written for it. **Edit the catalogue here.**
- `build_json.py` — writes `data/products.json` from the manifest, adding the
  house-level spec and care blocks and working out the "also on the bench" links.
  Run it from anywhere: `python3 tools/build_json.py`.
- `build_products.py` — turns the client's original photographs into the site's
  4:5 assets (JPEG + WebP). The originals are **not** in the repo:
  `python3 tools/build_products.py /path/to/originals`, or drop them in
  `tools/originals/`. Files are matched on their `IMG_####` numbers.
- `crop.py` — finds the photograph inside a phone screenshot, so the WhatsApp
  catalogue captures in the source set lose their UI chrome.

Needs Pillow. `numpy` is only used by `crop.py`.
