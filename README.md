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
collection.html     grid, built from data/products.json, filterable by category
product.html        ?id=-driven template, also from products.json
bespoke.html        the commission process, what we make, repairs & care
heritage.html       the house, the timeline, the founder block
contact.html        workshop details and the enquiry form
privacy.html        POPIA notice, terms of commission, CITES & sourcing
css/style.css       the whole design system, one file, sectioned and commented
js/main.js          reveals, chrome sweep, marquee, drawer, search, toggles, forms
js/collection.js    builds the collection grid
js/product.js       builds the product page
tools/              rebuilds products.json and the product imagery — see tools/README.md
data/products.json  the thirty pieces in the catalogue
images/products/    the client's own product photography, 97 shots across 30 pieces
images/             the AT logo assets, the home and collection heroes, and the
                    remaining placeholder imagery (WebP + JPEG)
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
`https://wa.me/…` link live from the product name, its reference and the finish you
picked, URL-encoded.

The initials-stamping feature is built and working but switched **off** on every
piece (`personalisation.enabled: false`), because nothing in the brief or the
photographs says the workshop stamps initials. If it does, set the flag to `true`
and the block — live preview and all — comes back.

## The catalogue

Thirty pieces, all real: the client's names, the client's prices and the client's
photography. `data/products.json` holds them; `images/products/` holds the shots,
named `<slug>-01`, `-02` and so on, with the `-01` always the card image.

The photographs came in at everything from 0.46 to 2.09 aspect. Rather than
cover-crop them all into the 4:5 the grid wants — which cut half the bag off the
wide ones — each is framed onto a 4:5 canvas over a blurred, darkened copy of
itself. Nothing is cropped away. See `tools/` — the catalogue lives in
`tools/manifest.py` and both the JSON and the images are regenerated from it.

Categories are **Handbags** (12), **Backpacks** (5), **Travel** (5),
**Business** (2), **Heritage** (3), **Apparel** (1) and **Interiors** (2). The
collection filter runs off these rather than off hide, because twenty of the
thirty are full-grain and a hide filter came out lopsided. Hide is still on
every card, next to the reference.

### Two names were changed

The client's message said *bowling balls* and *Coaches*. The photographs show
bowling **bags**, and the WhatsApp catalogue header in the source screenshot
reads **Couches**. The site uses *AT Exclusive Bowling Bag* and *AT Leather
Couches* — say the word and they go back.

*Opulance* and *Slyng* have been left exactly as the client spelled them.

## What came from the 2024 business profile

Real, and already in the site: the company description and 25-year history, the Durban
footwear / Cape Town handbag influences, the Brazil and Italy design-school
collaborations, the full international showcase list (Casablanca, Addis Ababa, Paris,
São Paulo, Moscow, Hong Kong, London, Dubai, New York), the skills-transfer programme in
East London and Mdantsane, the full material list, the product range, the three site
addresses, both phone numbers and the email address.

## Before this goes live

Placeholders that need a real answer, in rough priority order:

1. **Photography.** The product shots are the client's own. The hide, workshop
   and hero imagery is **AI-generated** (Higgsfield, `z_image`) standing in for
   real photography — see `tools/image-prompts.md` for what each frame is meant
   to be. It reads as mood rather than documentation, which is worth knowing
   before it goes in front of customers; the five hide studies in particular
   would be better as real photographs, and they are the easiest to shoot.

   Two are wrong and need redoing: **`hide-ostrich`** and **`skin-ostrich`** came
   back as plain smooth leather with no quill field, directly contradicting the
   caption next to them ("The quill field, read across a room").

   Still outstanding: **`founder-asekho-twaku`**, which needs a real photograph
   of Asekho and should not be generated. The AT monogram
   (`images/mark-at.png`, `images/logo-asekho-twaku.png`) is the real logo.
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

In `data/products.json`, the **names, prices, categories and photographs are the
client's**. The description lines, the editorial blocks and the spec lists were
written from what is visible in each photograph plus the house-level facts in the
profile. Nothing invents a dimension, a weight or a lead time — where the page
would have shown a measurement it says the dimensions are confirmed on WhatsApp
before cutting, which is true of a made-to-order house and is the one thing worth
replacing first if the client has a size list.

Hide is assigned per piece by eye from the photographs — ostrich, Nguni, zebra or
full-grain. Twenty of the thirty read as full-grain cowhide rather than an exotic,
which is worth a look, because `skins.html` still tells a five-exotic story.
Standing colourways (the `finishes` field) are only listed where more than one
appears in the client's own photographs.

Opening hours on `contact.html` are marked *(to confirm)* in the page itself.

## Quality floor

Responsive down to 360px, keyboard focus visible in `--cognac`, alt text on every image,
`loading="lazy"` below the fold, relative paths throughout, WebP with JPEG fallback via
`<picture>`. Fonts come from Google Fonts, which is the site's only external request.

---

Asekho Twaku Apparels · East London · Site by LC Agency (Pty) Ltd
