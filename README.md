# LASS Skincare

A premium marketing + storefront site for **LASS**, a fictional small-batch
skincare house. Static HTML, CSS and vanilla JavaScript — no build step, no
dependencies, no framework. Drop the folder on any static host and it runs.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, philosophy, bestsellers, ingredient accordion, ritual, testimonials, journal, newsletter |
| `shop.html` | Full nine-product collection with category filters and the refill programme |
| `about.html` | The house: origin, the five commitments, testing standards, locations |
| `contact.html` | Studio details, contact form, care FAQ, newsletter |

## What's implemented

- **Mobile-first responsive layout** — fluid type via `clamp()`, single-column
  at 390px through to a 1248px max measure. Verified free of horizontal
  overflow at 390 / 768 / 1440px on every page.
- **Shopping bag** — add to bag from any card, quantity stepping, live subtotal,
  persisted to `localStorage` (`lass.cart.v1`) so it survives navigation and
  reloads. Checkout is intentionally a stub; nothing is transmitted anywhere.
- **Product artwork** is generated as inline SVG (`bottleArt()` in
  `assets/js/main.js`) — five vessel shapes across six colour tones, so the site
  ships with zero image files and stays sharp at any density.
- **Category filters** on the shop page with a live result count.
- **Slide-in drawers** for the mobile menu and the bag, closable by scrim, close
  button or `Escape`, with body scroll locking.
- **Ingredient accordion**, auto-rotating testimonials (paused on hover),
  scroll-reveal via `IntersectionObserver`, and client-side form validation with
  inline status messaging.
- **Accessibility** — skip link, landmark regions, visible focus rings, labelled
  controls, `aria-live` form status, `aria-pressed` filter chips, and a full
  `prefers-reduced-motion` path that disables every animation and reveal.
- **Graceful degradation** — all copy, navigation and product information lives
  in the HTML. Without JavaScript the site reads and navigates fine; only the
  bag, filters and accordion go quiet.

## Running it

Any static server works:

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
  js/main.js      artwork, bag, drawers, filters, forms, reveals
```

## Notes

Type is Cormorant Garamond + Inter loaded from Google Fonts, with a system
serif/sans stack behind them — the page renders correctly if the font request is
blocked or the machine is offline. Brand, products, prices, reviews and claims
are fictional sample content.
