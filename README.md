# LASS Skincare — website

A premium website for **LASS Skincare**, the South African natural skincare brand
based in Randburg, Gauteng. Static HTML, CSS and vanilla JavaScript — no build
step, no dependencies, no framework. Drop the folder on any static host and it
runs.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, credentials, brand story, featured products, ingredients, routine, concern finder, consultant programme |
| `shop.html` | All twelve products across skincare, wellness and wear, with category filters |
| `about.html` | Our story, the vision, what the brand stands for, where to find it |
| `contact.html` | Office and phone details, contact form, FAQs, consultant enquiry |

## Brand

Everything visual comes from the supplied logo: near-black lettering, the gold
arch, and a warm off-white ground.

- `assets/img/lass-logo.png` — the logo with the white background keyed out, for
  light surfaces (header, hero).
- `assets/img/lass-logo-light.png` — same artwork with the ink recoloured cream
  so it reads on the dark footer and bands. The gold arch is untouched.
- `assets/img/favicon.svg` — the arch alone, in the brand gradient.

Both PNGs are derived from the original JPEG; if a vector version of the logo
exists, swapping it in is the one upgrade worth making.

Palette and type live in the `:root` block of `assets/css/style.css`
(`--gold`, `--gold-deep`, `--ink`, `--bone`, `--arch`). Type is Cormorant
Garamond over Inter, with a system serif/sans stack behind them so the page
still reads correctly if Google Fonts is blocked or the machine is offline.

## Products

Twelve products across three groups. Every price, size and description below
is read off the supplied product photography.

**Skincare (9)** — Turmeric Facial Scrub R80 · 150ml · Turmeric & Honey Face
Mask R75 · 125ml · Vitamin C Brightening Serum R70 · 30ml · Lemon Exfoliating
Face Wash R65 · 150ml · Anti-Blemish Day Cream R40 · Tissue Oil R50 · 150ml ·
Pomegranate Body Butter R55 · 150ml · Turmeric Soap R55 · 140g · Brightening
Roll-On R45 · 50ml

**Wellness (1)** — Turmeric Detox Tea R90 · 20 bags · 50g

**Wear (2)** — LASS Sweater R320 · LASS T-Shirt R250

Filters are Face, Body, Cleanse, Brighten, Wellness and Wear. Garments carry a
size picker; because the bag already keys a line by product *and* size, a
medium and a large of the same sweater are two lines rather than one product
twice.

### Still to confirm

- **Garment sizes.** The picker offers S–XXL. That range is assumed, not taken
  from any source you supplied — correct it in `shop.html` if the real stock
  differs.
- **Day cream volume.** Shown as 100ml, inherited from the first draft. No
  volume is legible on its label.
- **Roll-on volume.** Shown as 50ml, same situation.
- **The detox tea's claims.** Its box claims it reduces inflammation and body
  pain, aids digestion and regulates blood sugar. Those read as medicinal
  rather than cosmetic, and an ingestible making them is regulated differently
  in South Africa. The site deliberately does **not** repeat them: the card
  describes what the tea is, not what it treats. Have someone check the
  packaging claims before promoting it.

## Product photography

**All twelve products use AI-restaged photography** in `assets/img/scene-*.webp`.
Each fills its card frame rather than floating on a tinted wash
(`.card__media--scene`), and the honey mask and turmeric soap also carry the
home page's hero and story figure. They share one visual language — warm cream
ground, the brand's gold arch behind the product, an ingredient prop — so the
grid reads as a single shoot.

The transparent cut-outs in `assets/img/product-*.webp` are still generated and
still used, but only for the bag's line thumbnails, where a small product on a
plain ground reads better than a whole scene shrunk to 60px.

The ingredients disc on the home page (`assets/img/ingredients.webp`) is also
generated — a still life of the five ingredients on dark slate, framed so the
centre stays open for the "Turmeric led" type. It carries no packaging and so
no label text to corrupt, which is why it was made on the cheapest model
rather than the text-accurate one. The disc keeps its gold gradient underneath
the photograph, so it is never empty if the image fails to load.

Note for future generations: `nano_banana` is the cheapest model in the
catalogue but is gated behind a paid plan and returns
`job_minimum_basic_plan_required` on a free account. The cheapest that
actually runs is **GPT Image 2 at `quality: low`, 0.5 credits**.

### Label fidelity — read before using a scene large

The generator re-rendered packaging text and it did not all survive. Every
scene was checked against the original photograph:

| Scene | Label fidelity |
| --- | --- |
| Day cream | Clean |
| Face wash | Clean |
| Tissue oil | Clean |
| Brightening serum | Clean |
| Sweater | Clean |
| Body butter | Copy clean; the barcode digits differ from the real one |
| Turmeric soap | Copy clean; the SABS roundel reads "POYUUFCC" |
| Turmeric scrub | "THKE CARE OF YOUR SKIN", "Exfaliating", "Unciogs pores" |
| Brightening roll-on | "TEAR CAREI OF FOOR BEAT", "Natural pH Rastere" |
| Honey mask | Headline fine; logo strapline and ingredient panel are gibberish |
| Detox tea | Headline fine; claims read "BODY TOSINS", "GONC & BREAKOUT" |
| **T-shirt** | **Strapline reads "TINE CARE OF ÈGOCTION"** |

None of this is legible at card size, which is why the grid looks right. It
becomes a problem the moment a scene is used large, zoomed, or in print. In
priority order the t-shirt, honey mask and roll-on are worth regenerating —
the first two because a mangled strapline is the brand's own line, the honey
mask additionally because it is the home page hero.

Reverting any one card to its cut-out is a two-attribute change: swap
`card__media--scene` back to the tone class and `class="scene" src=".../scene-*.webp"`
back to `class="shot" src=".../product-*.webp"`.

## Cut-out photography

`tools/cut-products.py` lifts each product off its storefront screenshot as a
transparent WebP. The cut is a crop and an alpha matte only — no packaging
pixel is redrawn, so labels and barcodes are exactly as photographed.

Backgrounds come off by flood fill from the image border rather than a
brightness threshold, because most of this range is white packaging on a white
sweep and a threshold eats the product. Packaging outlines become walls the
fill cannot cross. The two garments need a tighter threshold still (the sweep
is 254–255 while the fabric runs 221–252), which is why `BACKDROP_OVERRIDE`
exists.

```bash
python3 tools/cut-products.py /path/to/source/screenshots
```

The turmeric soap is cut from a clean studio original rather than a storefront
screenshot — the screenshot had the NEW badge physically covering a corner of
the box, which no masking could recover.

## What's implemented

- **Mobile-first responsive layout** — fluid type via `clamp()`, single column at
  390px up to a 1248px measure. Verified free of horizontal overflow at
  390 / 768 / 1440px on every page.
- **Shopping bag** — add from any product card, quantity stepping, live subtotal
  in rand, persisted to `localStorage` (`lass.cart.v1`) across pages and
  reloads. Checkout is a deliberate stub: it transmits nothing and tells the
  visitor to phone the office.
- **Category filters** (Face, Body, Cleanse, Brighten, Wellness, Wear) with a live result count.
- **Slide-in drawers** for the mobile menu and bag — scrim, close button and
  `Escape` all close them, with body scroll locking.
- **Ingredient accordion**, scroll reveals via `IntersectionObserver`, and
  client-side form validation with inline `aria-live` status messaging.
- **Header detail** — the ticker fades out at both edges, the logo picks up a
  faint gold halo on hover, nav underlines are drawn in the brand gradient and
  settle in 80ms apart on load, the bag badge pulses once whenever the count
  moves, and a gold hairline fades in under the header once it leaves the top.
- **Live hero** — gold motes trail the cursor across the hero on a canvas
  layer, the product vessel drifts on a `requestAnimationFrame` parallax, and
  the artwork settles from dim to full when it enters the viewport.
- **Accessibility** — skip link, landmarks, visible focus rings, labelled
  controls, `aria-pressed` filter chips, and a `prefers-reduced-motion` path that
  disables every animation and reveal — including the hero motes, the parallax
  and the header cascade, while the gold accents themselves stay visible.
- **Graceful degradation** — all copy, navigation and product information is in
  the HTML. Without JavaScript the site reads and navigates fine; only the bag,
  filters and accordion go quiet.

## Before this goes live

The brand facts on the site — founded 2020, the founder's own struggle with acne
and dark spots, "the most trusted natural skincare brand in Africa", Proudly SA
endorsement, SABS approval, the KyaSands address and both phone numbers — were
gathered from LASS's existing marketing and public listings, because
`lassskincare.co.za` was unreachable from the build environment. **Check each
one against your own records.** Deliberately absent: customer reviews, star
ratings and delivery/returns policy specifics — those need real numbers, not
plausible ones.

The contact and newsletter forms validate and then stop; wire them to an inbox
or form service before launch.

## Where the site is published

GitHub Pages serves this repository from the **`lass-skincare-site`** branch,
folder `/ (root)`:

**https://luthandotonyngxila8-netizen.github.io/LC-agency-mobile/**

Work on that branch. Pages republishes on every push to it, so a commit that
lands anywhere else will not reach the live site — which fails quietly, because
nothing errors, the site simply stops changing.

Two things to know about this arrangement:

- It is a *project* Pages site, so everything is served under the
  `/LC-agency-mobile/` subpath rather than the domain root. Every path in the
  site is relative for exactly that reason. **Do not introduce a root-absolute
  path** (`href="/assets/..."`) — it will 404 in production while working fine
  locally.
- Pages publishes one source per repository. Other client projects living on
  other branches of this repo cannot be served at the same time; each needs its
  own repository, or its own subfolder on the published branch.

`main` is still at the initial commit and would serve a blank site.

## Sending it to a client

`tools/build-preview.py` folds the four pages into a single self-contained
file at `dist/lass-preview.html` — one document, no external requests at all.
The stylesheet and script are inlined verbatim, the logos become data URIs,
Cormorant Garamond and Inter ride along as embedded woff2 (latin subsets, in
`tools/fonts-inline.css`), and a small router swaps which page is on screen so
the nav, footer links and mobile drawer all still work.

```bash
python3 tools/build-preview.py     # -> dist/lass-preview.html
```

The output is pure ASCII, with every non-ASCII character escaped, so it cannot
be mangled by a host that serves the wrong charset. Open it from disk, mail it,
or publish it anywhere — it needs nothing beside it.

Two notes on the preview specifically. It pins the brand ground regardless of
the viewer's light/dark preference, because a client reviewing the site should
see the real palette rather than an inverted one. And it is a snapshot: rerun
the script after changing any page, or the link will show the old build.

`dist/` is generated. It is committed so the current preview is easy to grab,
but the four source pages remain the thing you edit.

## Running it

```bash
npx http-server -p 8899     # then open http://127.0.0.1:8899
# or
python3 -m http.server 8899
```

To publish on GitHub Pages, point Pages at this branch's root — there is nothing
to compile.

## Structure

```
index.html  shop.html  about.html  contact.html
assets/
  css/style.css   design tokens, layout, components
  js/main.js      product artwork, bag, drawers, filters, forms, reveals
  img/            logo (light + dark variants), favicon, product shots
tools/
  cut-products.py    storefront screenshots -> transparent product WebP
  build-preview.py   the four pages -> one self-contained dist/lass-preview.html
  fonts-inline.css   Cormorant Garamond + Inter, latin subsets, as data URIs
dist/
  lass-preview.html  generated; the file you send a client
```
