# Asekho Twaku Apparels — website

Static site for **Asekho Twaku Apparels**, a 27-year exotic-leather house in East London,
South Africa. Plain HTML, CSS and vanilla JS. No framework, no build step, no dependencies.

Built to the LUSTRA replication spec (LC Agency), **Skin B — Asekho-native**.

## Running it

Any static server will do. From the repo root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` straight off the filesystem mostly works, but `collection.html`
and `product.html` read `data/products.json` with `fetch()`, which browsers block on
`file://`. Use a server for those two.

## Structure

```
index.html          home — the full 14-section layout
skins.html          the five hides: ostrich, crocodile, nguni, springbok, zebra
collection.html     grid, built from data/products.json, filterable by hide
product.html        ?id=-driven template, also from products.json
bespoke.html        the commission process, what we make, repairs & care
heritage.html       the house, the timeline, the founder block
contact.html        workshop details and the enquiry form
privacy.html        POPIA notice, terms of commission, CITES & sourcing
css/style.css       the whole design system, one file, sectioned and commented
js/main.js          reveals, chrome sweep, marquee, drawer, search, toggles, forms
js/collection.js    builds the collection grid
js/product.js       builds the product page
data/products.json  six seeded products
images/             placeholder imagery (WebP + JPEG) and the AT logo assets
```

## Design system

Tokens live at the top of `css/style.css`:

| Token | Value | Role |
|---|---|---|
| `--obsidian` | `#050505` | page ground |
| `--graphite` | `#14161A` | raised bands |
| `--steel` | `#6E7780` | hairlines |
| `--bone` | `#E7E1D6` | text — never pure white |
| `--cognac` | `#8A4B2A` | the single accent: eyebrows, solid CTA, italic accent words, active states |
| `--chrome-1/2/3` | `#FDFEFF` `#A8B0B8` `#E6EBEF` | the chrome gradient stops |

Type is **Cormorant Garamond** for display and body, **Jost** uppercase at `0.3em`
tracking for eyebrows, labels and nav. Sections alternate obsidian → graphite down
the page. A tileable grain sits over everything at ~3.8% opacity.

**The signature:** exactly one chrome-swept headline per page — the chrome gradient is
clipped to the text and its specular highlight sweeps once when the headline scrolls in.
Everything else stays flat.

Switching to **Skin A** (the LUSTRA palette) is a token swap only — the block is
commented into `css/style.css` right below the token list.

## Motion

Scroll-reveal per band (once), the marquee strip, the toggle cross-fade, card hover-lift
and the chrome sweep. All of it is disabled under `prefers-reduced-motion: reduce`.

## No cart, by design

There is no checkout anywhere. Every CTA is **START YOUR COMMISSION**, which builds a
`https://wa.me/…` link live from the product name, ref, selected hide and the initials
you typed, URL-encoded.

## What came from the 2024 business profile

Real, and already in the site: the company description and 25-year history, the Durban
footwear / Cape Town handbag influences, the Brazil and Italy design-school
collaborations, the full international showcase list (Casablanca, Addis Ababa, Paris,
São Paulo, Moscow, Hong Kong, London, Dubai, New York), the skills-transfer programme in
East London and Mdantsane, the full material list, the product range, the three site
addresses, both phone numbers and the email address.

## Before this goes live

Placeholders that need a real answer, in rough priority order:

1. **Photography** — everything in `images/` is a generated placeholder, labelled
   *PLACEHOLDER IMAGE* on the face of it, at the aspect ratio the layout expects.
   Filenames say what belongs there (`hero-workshop`, `hide-ostrich`, `craft-cutting-table`,
   `product-weekender-01`…). Replace each `.jpg` **and** its `.webp` sibling.
   The AT monogram (`images/mark-at.png`, `images/logo-asekho-twaku.png`) is the real
   logo, keyed off its black background.
2. **The founder quote** — marked as a placeholder on `index.html` and `heritage.html`.
   Nothing has been invented for Asekho; the block is flagged in the page itself and
   needs his own words.
3. **The Mark** — the three ideas behind the AT monogram are placeholder copy, also
   flagged on the page. His call.
4. **Company details** — registration and VAT numbers in `privacy.html`, and the trading
   name: the profile says *Asekho Twaku Leather & Clothing*, the brief said *Asekho Twaku
   Apparels*. The site uses Apparels as the brand and Leather & Clothing as the legal
   entity — confirm that is right.
5. **Forms** — the journal signup and the contact form validate and confirm on screen but
   post nowhere yet. Wire them to whatever the workshop actually reads (Formspree, a
   mailto handler, or a small endpoint) before launch.
6. **Product film** — `product.html` supports an inline video in the gallery; the `video`
   field in `products.json` is empty on all three products, so the slot is skipped. Drop
   in an MP4 path to turn it on.

Product names, prices, dimensions, lead times and specification lines in
`data/products.json` are written in the brand voice but are **not** from the profile —
confirm every one of them. Three products carry a rand price, three are "price on
request". Opening hours on `contact.html` are marked *(to confirm)* in the page itself.

## Quality floor

Responsive down to 360px, keyboard focus visible in `--cognac`, alt text on every image,
`loading="lazy"` below the fold, relative paths throughout, WebP with JPEG fallback via
`<picture>`. Fonts come from Google Fonts, which is the site's only external request.

---

Asekho Twaku Apparels · East London · Site by LC Agency (Pty) Ltd
