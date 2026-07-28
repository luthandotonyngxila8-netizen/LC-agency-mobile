# Asekho Twaku Apparels — website

Static site for **Asekho Twaku Apparels**, a 27-year exotic-leather house in East London,
South Africa. Plain HTML, CSS and vanilla JS. No framework, no build step, no dependencies.

Built to the LUSTRA replication spec (LC Agency), in **Skin C — Highveld Spring**.

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
images/             placeholder imagery (WebP + JPEG), the AT logo assets, and the
                    one real photograph in the build (hero + backpack card)
```

## Design system

Skin C — **Highveld Spring**. Warm light grounds, a four-colour accent family taken
from an Eastern Cape spring, and espresso bookends (header and footer) so the chrome
AT monogram still reads. Tokens live at the top of `css/style.css`:

| Token | Value | Role |
|---|---|---|
| `--ivory` | `#FBF6EE` | page ground, warm with a peach cast |
| `--sand` | `#F3E9D9` | raised band, sunlit leather |
| `--mist` | `#EAEFE4` | raised band, new-grass tint |
| `--espresso` | `#221A14` | header, footer, hero grounds |
| `--ink` | `#2C231C` | body text — a warm near-black, never pure |
| `--cognac` | `#9C5228` | primary accent: CTAs, eyebrows, active states |
| `--coral` | `#C4472A` | the spring pop: accent words, callouts, markers |
| `--veld` | `#4F6B3C` | growth: sourcing, skills transfer, confirmations |
| `--ochre` | `#C08A2E` | sun: badges and small fills |
| `--brass-1/2/3` | `#8A5A2B` `#F0D6AE` `#B4813F` | the swept-headline gradient |

Grounds rotate ivory → sand → mist down the page, with a coral `--band--bloom` wash
on the closing invitation of each page. Dark sections (header, drawer, footer, heroes,
craft blocks) don't get their own rules — they remap the contextual tokens
(`--fg`, `--fg-72`, `--rule`) so every component works on either ground.

Type is **Cormorant Garamond** for display and body, **Jost** uppercase at `0.3em`
tracking for eyebrows, labels and nav. A paper tooth sits over the light grounds at
~5.5% opacity, multiplied.

**The signature:** exactly one brass-swept headline per page — the gradient is clipped
to the text and its highlight sweeps once when the headline scrolls in. Everything else
stays flat.

The earlier dark build (Skin B — obsidian ground, chrome sweep) is in the git history
if it is ever wanted back.

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
