#!/usr/bin/env python3
"""Assemble the four-page LASS site into one self-contained page for client review.

Nothing is redesigned: the stylesheet, behaviour and markup are the site's own.
The only additions are (a) data-URI images so the file has no external requests
and (b) a small router that swaps which page section is on screen.
"""
import base64
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / "dist" / "lass-preview.html"

PAGES = [
    ("index", "Home"),
    ("shop", "Shop"),
    ("about", "Our story"),
    ("contact", "Contact"),
]


def ascii_html(text):
    """Non-ASCII as numeric entities, so the page can't be mis-decoded."""
    return "".join(c if ord(c) < 128 else "&#%d;" % ord(c) for c in text)


def ascii_js(text):
    """Same idea for script bodies, where entities are not parsed."""
    return "".join(c if ord(c) < 128 else "\\u%04x" % ord(c) for c in text)


def ascii_css(text):
    """And for stylesheets, using CSS escapes."""
    return "".join(c if ord(c) < 128 else "\\%06x" % ord(c) for c in text)


def data_uri(rel, mime):
    raw = (ROOT / rel).read_bytes()
    return "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode("ascii"))


LOGO = data_uri("assets/img/lass-logo.png", "image/png")
LOGO_LIGHT = data_uri("assets/img/lass-logo-light.png", "image/png")

css = (ROOT / "assets/css/style.css").read_text()
js = (ROOT / "assets/js/main.js").read_text()
fonts = (HERE / "fonts-inline.css").read_text()

src = {name: (ROOT / f"{name}.html").read_text() for name, _ in PAGES}


def grab(html, tag, attrs=""):
    """Pull one whole element out of a page by its opening tag."""
    open_re = re.compile(r"<%s\b[^>]*%s[^>]*>" % (tag, attrs))
    m = open_re.search(html)
    if not m:
        raise SystemExit(f"missing <{tag} {attrs}>")
    depth, i = 0, m.start()
    step = re.compile(r"<(/?)%s\b" % tag)
    for s in step.finditer(html, m.start()):
        depth += -1 if s.group(1) else 1
        if depth == 0:
            end = html.index(">", s.end()) + 1
            return html[i:end]
    raise SystemExit(f"unbalanced <{tag}>")


def rewrite_links(chunk):
    """Point every internal link at the router instead of a separate file."""
    chunk = re.sub(r'href="index\.html#([\w-]+)"', r'href="#\1"', chunk)
    chunk = re.sub(r'href="(\w+)\.html#([\w-]+)"', r'href="#\2" data-page="\1"', chunk)
    chunk = re.sub(
        r'href="index\.html"', 'href="#top" data-page="index"', chunk
    )
    chunk = re.sub(r'href="(\w+)\.html"', r'href="#top" data-page="\1"', chunk)
    return chunk


# --- shared chrome, taken from the home page ------------------------------
home = src["index"]
ticker = grab(home, "div", 'class="ticker"')
header = grab(home, "header")
footer = grab(home, "footer")
menu_drawer = grab(home, "div", 'id="menu-drawer"')
cart_drawer = grab(home, "div", 'id="cart-drawer"')

# the header nav needs a live "current page" state the router can drive
header = header.replace(' aria-current="page"', "")

# --- each page's <main>, wrapped so only one shows at a time ---------------
sections = []
for name, label in PAGES:
    main = grab(src[name], "main")
    main = main.replace('<main id="main">', '<main class="page__main">', 1)
    sections.append(
        '<div class="page" id="page-%s" data-page-panel="%s"%s>\n%s\n</div>'
        % (name, name, "" if name == "index" else " hidden", main)
    )

body = "\n".join(
    [ticker, header, '<div id="top"></div>', "\n".join(sections), footer,
     menu_drawer, cart_drawer, '<div class="toast" role="status" aria-live="polite"></div>']
)
body = rewrite_links(body)
body = body.replace('src="assets/img/lass-logo.png"', 'src="%s"' % LOGO)
body = body.replace('src="assets/img/lass-logo-light.png"', 'src="%s"' % LOGO_LIGHT)

ROUTER = """
/* ---- single-file router -------------------------------------------------
   The four pages live in the same document; this swaps which one is shown
   and keeps the header's current-page state honest. */
(function () {
  var panels = [].slice.call(document.querySelectorAll("[data-page-panel]"));
  var navLinks = [].slice.call(document.querySelectorAll("[data-page]"));

  function show(page, anchor) {
    var found = false;
    panels.forEach(function (p) {
      var match = p.getAttribute("data-page-panel") === page;
      p.hidden = !match;
      if (match) found = true;
    });
    if (!found) return false;

    document.querySelectorAll(".nav a, .menu-list a").forEach(function (a) {
      a.removeAttribute("aria-current");
    });
    document.querySelectorAll('.nav a[data-page="' + page + '"]').forEach(
      function (a) { a.setAttribute("aria-current", "page"); }
    );

    if (anchor) {
      var target = document.getElementById(anchor);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function currentPage() {
    var open = panels.filter(function (p) { return !p.hidden; })[0];
    return open ? open.getAttribute("data-page-panel") : "index";
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href^='#']");
    if (!a) return;

    var page = a.getAttribute("data-page");
    var hash = a.getAttribute("href").slice(1);

    if (page) {
      e.preventDefault();
      show(page, hash === "top" ? null : hash);
      return;
    }

    /* a bare #anchor may live on a page that isn't showing — find it */
    if (!hash) return;
    var target = document.getElementById(hash);
    if (!target) return;
    var owner = target.closest("[data-page-panel]");
    if (owner && owner.hidden) {
      e.preventDefault();
      show(owner.getAttribute("data-page-panel"), hash);
    }
  });

  show("index", null);
  void currentPage;
})();
"""

# the site script expects one page's worth of DOM; it copes with all four,
# but the router has to run after it so the initial panel state wins.
script = js + "\n" + ROUTER

html = """<title>LASS Skincare &#8212; site preview</title>
<meta name="description" content="Preview of the LASS Skincare website: home, shop, our story and contact." />
<style>
/* Cormorant Garamond and Inter, latin subsets, embedded so the preview
   renders in the real brand faces with no external requests. */
%s

/* The site's own stylesheet, inlined verbatim. */
%s

/* ---- preview-only additions --------------------------------------------
   The brand ground is fixed: a client reviewing the site should see the
   real palette, not a theme-inverted version of it. */
:root, :root[data-theme="dark"], :root[data-theme="light"] {
  color-scheme: only light;
}
body { background: var(--bone); color: var(--ink); }
[hidden] { display: none !important; }
.page__main { display: block; }
</style>
%s
<script>
%s
</script>
""" % (fonts, ascii_css(css), ascii_html(body), ascii_js(script))

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html)
print("wrote", OUT, len(html), "bytes")
