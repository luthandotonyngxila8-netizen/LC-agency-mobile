# LASS Skincare — website

A premium website for **LASS Skincare**, the South African natural skincare brand
based in Randburg, Gauteng. Static HTML, CSS and vanilla JavaScript — no build
step, no dependencies, no framework. Drop the folder on any static host and it
runs.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, credentials, brand story, featured products, ingredients, routine, concern finder, consultant programme |
| `shop.html` | The full nine-product range with category filters |
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

The nine products, prices (ZAR) and descriptions come from LASS's own published
material and reseller listings:

Turmeric Facial Scrub R80 · Turmeric & Honey Face Mask R75 · Vitamin C
Brightening Serum R70 · Lemon Exfoliating Face Wash R65 · Anti-Blemish Day Cream
R40 · Tissue Oil R50 · Pomegranate Body Butter R55 · Turmeric Soap and
Brightening Roll-On (no published price — these two show "Ask a consultant" and
link to the contact page rather than carry an invented figure).

Product artwork is generated as inline SVG (`bottleArt()` in
`assets/js/main.js`): seven vessel shapes across seven ingredient tones, so the
site ships with no product photography. **Replace these with real product
photos before launch** — they are stand-ins, not a design decision to keep.

## What's implemented

- **Mobile-first responsive layout** — fluid type via `clamp()`, single column at
  390px up to a 1248px measure. Verified free of horizontal overflow at
  390 / 768 / 1440px on every page.
- **Shopping bag** — add from any product card, quantity stepping, live subtotal
  in rand, persisted to `localStorage` (`lass.cart.v1`) across pages and
  reloads. Checkout is a deliberate stub: it transmits nothing and tells the
  visitor to phone the office.
- **Category filters** (Face, Body, Cleanse, Brighten) with a live result count.
- **Slide-in drawers** for the mobile menu and bag — scrim, close button and
  `Escape` all close them, with body scroll locking.
- **Ingredient accordion**, scroll reveals via `IntersectionObserver`, and
  client-side form validation with inline `aria-live` status messaging.
- **Accessibility** — skip link, landmarks, visible focus rings, labelled
  controls, `aria-pressed` filter chips, and a `prefers-reduced-motion` path that
  disables every animation and reveal.
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
  img/            logo (light + dark variants), favicon
```
