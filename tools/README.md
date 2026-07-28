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
- `build_preview.py` — flattens the whole site into one self-contained HTML file
  for showing the client: fonts, CSS, JS and images all inlined, the eight pages
  become hash routes, and nothing is fetched from the network. Writes two files
  into `build/`:
  - `asekho-twaku-preview.html` — for a host that supplies its own `<head>`.
  - `asekho-twaku-apparels-preview.html` — a complete document, for sending to
    someone to open off their own device.

  Both degrade if the viewer strips scripts (phone file previews do): the pages
  show stacked with a banner, rather than a blank screen. It fails the build
  rather than emit a preview where any real page link survived the rewrite.

Needs Pillow. `numpy` is only used by `crop.py`.
