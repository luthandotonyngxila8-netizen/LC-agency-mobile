# Asekho Twaku Apparels — website

A plain static website. HTML, CSS and JavaScript, no framework, no build step,
no server-side code, no database. It will run on any web host.

## Putting it on the domain

Upload the **contents** of this folder to the web root — usually `public_html`,
`www` or `htdocs` — so that `index.html` sits at the top level. That is the
whole deployment. There is nothing to install and nothing to compile.

    index.html          must end up at https://yourdomain.co.za/index.html
    css/ js/ data/ images/   keep the folder structure exactly as it is

It also works unchanged in a subfolder (`/new-site/`), because every path in the
site is relative.

Works on shared cPanel hosting, Netlify, Vercel, Cloudflare Pages, GitHub Pages,
Amazon S3 — anything that serves files.

### Two things the host should switch on

1. **HTTPS.** Free via Let's Encrypt on almost every host.
2. **Compression** (gzip or brotli) for `.html`, `.css`, `.js` and `.json`.
   Most hosts do this by default. The images are already compressed.

### One thing to check

`collection.html` and `product.html` read `data/products.json` over the network.
That works on any real web server. It does **not** work by opening `index.html`
straight off the desktop with a `file://` address — browsers block it. If you
want to preview locally before uploading, run a small server in this folder:

    python3 -m http.server 8000     # then open http://localhost:8000

## What is in here

    index.html          home
    skins.html          the five hides
    collection.html     the catalogue grid, filtered by category
    product.html        one product, driven by ?id= from data/products.json
    bespoke.html        the commission process
    heritage.html       the house and its history
    contact.html        workshop details and the enquiry form
    privacy.html        POPIA notice, terms, CITES and sourcing
    404.html            not-found page
    css/style.css       the whole design system, one file
    js/                 site behaviour, collection grid, product page
    data/products.json  all thirty pieces — names, prices, copy, image paths
    images/products/    the product photography
    images/             logo, heroes, and the remaining placeholder imagery

## Changing a price or a product

Everything about the catalogue lives in `data/products.json`. Edit the `price`
field, save, upload. No rebuild.

## Before it goes live

Two things still need wiring by whoever hosts it:

- **The forms.** The contact form and the journal signup validate and confirm on
  screen but do not send anywhere yet. Point them at whatever the workshop
  reads — a Formspree endpoint, a mailto handler, or a small script on the host.
- **Company registration and VAT numbers** are marked as outstanding in
  `privacy.html`.

Some photography is still placeholder and is labelled *PLACEHOLDER IMAGE* on the
face of the image. The product photography is final.

---

Asekho Twaku Apparels · East London · Site by LC Agency (Pty) Ltd
