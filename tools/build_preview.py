#!/usr/bin/env python3
"""Flatten the multi-page site into ONE self-contained HTML file for preview.

Everything is inlined — fonts, CSS, JS, images as data URIs — and the eight
pages become hash routes, so the whole site can be viewed from a single file
with no server and no external requests.
"""
import base64, io, os, re, subprocess, urllib.request
from PIL import Image

SP = os.path.dirname(os.path.abspath(__file__))          # tools/
ROOT = os.path.dirname(SP)                               # the repo
BUILD = os.path.join(ROOT, "build")
os.makedirs(BUILD, exist_ok=True)
OUT = os.path.join(BUILD, "asekho-twaku-preview.html")

PAGES = ["index", "skins", "collection", "product", "bespoke", "heritage", "contact", "privacy"]
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"


# ---------------------------------------------------------------- fonts ----
def inline_fonts():
    css = open(os.path.join(SP, "fonts.css")).read()
    blocks = re.split(r"/\*\s*([a-z-]+)\s*\*/", css)
    out = []
    for i in range(1, len(blocks), 2):
        subset, block = blocks[i], blocks[i + 1]
        if subset != "latin":
            continue
        url = re.search(r"url\((https://[^)]+)\)", block).group(1)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        data = urllib.request.urlopen(req, timeout=40).read()
        b64 = base64.b64encode(data).decode()
        out.append(re.sub(r"url\(https://[^)]+\)",
                          "url(data:font/woff2;base64,%s)" % b64, block).strip())
        print("   font %-22s %6.1f KB" % (
            re.search(r"font-family: '([^']+)'", block).group(1) +
            ("-i" if "italic" in block else "") +
            re.search(r"font-weight: (\d+)", block).group(1), len(data) / 1024))
    return "\n".join(out)


# --------------------------------------------------------------- images ----
IMG_CACHE = {}


def data_uri(path):
    """Downscale hard — these are placeholders, the preview only needs layout."""
    if path in IMG_CACHE:
        return IMG_CACHE[path]
    full = os.path.join(ROOT, path)
    im = Image.open(full)
    wide = any(k in path for k in ("hero", "craft", "toggle", "diagram", "collection", "skin-"))
    if "images/products/" in path:
        # the first shot is the card and the opening gallery frame, so keep it
        # sharp; the rest are only seen after a click and can go softer.
        target = 480 if path.endswith("-01.jpg") else 340
    else:
        target = 760 if wide else 460
    if im.width > target:
        im = im.resize((target, round(im.height * target / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    if path.endswith(".png"):
        im.convert("RGBA").quantize(colors=128, method=Image.FASTOCTREE).save(buf, "PNG", optimize=True)
        uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    else:
        im.convert("RGB").save(buf, "JPEG", quality=45, optimize=True, progressive=True)
        uri = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    IMG_CACHE[path] = uri
    return uri


def strip_webp(html):
    return re.sub(r'\s*<source srcset="[^"]+\.webp" type="image/webp">', "", html)


def inline_static_images(html):
    def sub(m):
        return m.group(1) + data_uri(m.group(2)) + m.group(3)
    return re.sub(r'(src=")(images/[^"]+\.(?:jpg|png))(")', sub, html)


# ---------------------------------------------------------------- links ----
def rewrite_links(html):
    for p in PAGES:
        html = re.sub(r'href="%s\.html(#[a-z0-9-]+)?"' % p, 'href="#%s"' % p, html)
    return html


# ------------------------------------------------------------ page parts ----
def part(html, start, end):
    return html[html.index(start):html.index(end)]


index_html = open(os.path.join(ROOT, "index.html")).read()
header = part(index_html, "<!-- ===== HEADER", '<main id="main">')
footer = part(index_html, "<!-- ===== FOOTER", '<script src="js/main.js">')

bodies = {}
for p in PAGES:
    h = open(os.path.join(ROOT, p + ".html")).read()
    m = re.search(r'<main id="main">(.*?)</main>', h, re.S)
    bodies[p] = m.group(1)

# ------------------------------------------------------------------- js ----
main_js = open(os.path.join(ROOT, "js/main.js")).read()
coll_js = open(os.path.join(ROOT, "js/collection.js")).read()
prod_js = open(os.path.join(ROOT, "js/product.js")).read()

products_json = open(os.path.join(ROOT, "data/products.json")).read()

# every product image, keyed by the path the JS builds at runtime
img_map = {}
for m in re.finditer(r'"src": "(images/[^"]+)"', products_json):
    img_map[m.group(1)] = data_uri(m.group(1) + ".jpg")


def patch_js(js):
    js = js.replace("fetch(base + 'data/products.json')", "PRODUCTS()")
    js = js.replace("fetch('data/products.json')", "PRODUCTS()")
    js = re.sub(r"'<source srcset=\"' \+ esc\([^)]*\) \+ '\.webp\" type=\"image/webp\">' \+\s*", "", js)
    js = re.sub(r"esc\(([^()]*(?:\([^()]*\))?[^()]*)\) \+ '\.jpg", r"IMG(\1) + '", js)

    # product links first, and the base-prefixed form before the bare one, or the
    # bare rule rewrites it and leaves a stray base in front of the hash
    js = js.replace("base + 'product.html?id='", "'#product/'")
    js = re.sub(r"product\.html\?id='\s*\+\s*encodeURIComponent", "#product/' + encodeURIComponent", js)

    for page in ("skins", "collection", "bespoke", "heritage", "contact", "privacy", "index"):
        js = js.replace("base + '%s.html#trade'" % page, "'#%s'" % page)
        js = js.replace("base + '%s.html'" % page, "'#%s'" % page)
        js = js.replace('href="%s.html"' % page, 'href="#%s"' % page)
        js = js.replace("'%s.html'" % page, "'#%s'" % page)

    left = [l.strip() for l in js.splitlines() if re.search(r"[a-z-]+\.html", l)]
    if left:
        raise SystemExit("patch_js left a real page link behind:\n  " + "\n  ".join(left))
    return js


main_js, coll_js = patch_js(main_js), patch_js(coll_js)
prod_js = patch_js(prod_js)
# make the product page rebuildable on every navigation
prod_js = prod_js.replace("(function () {\n  'use strict';", "window.__buildPDP = function () {\n  'use strict';", 1)
prod_js = prod_js[:prod_js.rindex("})();")] + "};"
prod_js = prod_js.replace(
    "  function param(name) {\n"
    "    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);\n"
    "    return m ? decodeURIComponent(m[1].replace(/\\+/g, ' ')) : '';\n"
    "  }",
    "  function param() { return window.__AT_PID__ || ''; }")

PREAMBLE = """
window.__PRODUCTS__ = %s;
window.__IMG__ = %s;
function PRODUCTS(){ return Promise.resolve({ json: function(){ return Promise.resolve(window.__PRODUCTS__); } }); }
function IMG(s){ return window.__IMG__[s] || (s + '.jpg'); }
""" % (products_json, __import__("json").dumps(img_map))

ROUTER = """
(function () {
  var PAGES = %s;
  var stub = document.getElementById('pv-product').innerHTML;

  function go() {
    var h = (location.hash || '#index').slice(1);
    var pid = '';
    if (h.indexOf('product/') === 0) { pid = decodeURIComponent(h.slice(8)); h = 'product'; }
    if (PAGES.indexOf(h) < 0) h = 'index';

    PAGES.forEach(function (p) {
      var el = document.getElementById('pv-' + p);
      if (p === h) { el.classList.add('is-on'); } else { el.classList.remove('is-on'); }
    });

    if (h === 'product') {
      document.getElementById('pv-product').innerHTML = stub;
      window.__AT_PID__ = pid;
      window.__buildPDP();
    }

    var cur = document.getElementById('pv-' + h);
    Array.prototype.forEach.call(cur.querySelectorAll('.chrome'), function (el) {
      el.classList.remove('is-swept');
      setTimeout(function () { el.classList.add('is-swept'); }, 320);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.header-nav a'), function (a) {
      a.removeAttribute('aria-current');
      if (a.getAttribute('href') === '#' + h) a.setAttribute('aria-current', 'page');
    });
    document.body.classList.remove('is-locked');
    var d = document.getElementById('drawer'), s = document.getElementById('scrim'),
        q = document.getElementById('search');
    if (d) d.classList.remove('is-open');
    if (s) s.classList.remove('is-open');
    if (q) q.classList.remove('is-open');
    window.scrollTo(0, 0);
    if (window.AT && window.AT.refresh) window.AT.refresh();
  }

  window.addEventListener('hashchange', go);
  go();

  /* A cold visitor needs to know what is finished and what is standing in. */
  var note = document.createElement('div');
  note.className = 'pv-note';
  note.innerHTML = '<b>Preview build</b>All 30 pieces are in, with your own photography and ' +
    'your prices. The remaining workshop and hide shots &mdash; the ones marked PLACEHOLDER ' +
    '&mdash; are still standing in. WhatsApp and social links are disabled inside this ' +
    'preview only.<button type="button" aria-label="Dismiss">&times;</button>';
  document.body.appendChild(note);
  setTimeout(function () { note.classList.add('is-up'); }, 900);
  function hideNote() { note.classList.remove('is-up'); setTimeout(function () { note.remove(); }, 700); }
  note.querySelector('button').addEventListener('click', hideNote);
  setTimeout(hideNote, 11000);

  /* Outbound links cannot leave the preview sandbox, so explain what each one
     would do on the live site instead of failing silently. */
  var toast = document.createElement('p');
  toast.className = 'pv-toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  var timer;

  function say(html) {
    toast.innerHTML = html;
    toast.classList.add('is-up');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('is-up'); }, 5200);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!/^(https?:|mailto:|tel:)/.test(href)) return;
    e.preventDefault();
    if (href.indexOf('wa.me') > -1) {
      var msg = decodeURIComponent((href.split('text=')[1] || '').replace(/\+/g, ' '));
      say('<b>Opens WhatsApp to +27 79 644 8562</b>' +
          (msg ? ', with this message ready to send:<br>&ldquo;' + msg + '&rdquo;' : '.') +
          '<br><br>Outbound links are blocked inside this preview — they work on the live site.');
    } else if (href.indexOf('mailto:') === 0) {
      say('<b>Opens your mail app</b> to ' + href.slice(7) +
          '.<br><br>Outbound links are blocked inside this preview.');
    } else {
      say('<b>Opens ' + href.replace(/^https?:\/\//, '').split('/')[0] + '</b> in a new tab.' +
          '<br><br>Outbound links are blocked inside this preview.');
    }
  });
})();
""" % (__import__("json").dumps(PAGES),)

# ------------------------------------------------------------------ css ----
print("  fonts…")
font_css = inline_fonts()
style = open(os.path.join(ROOT, "css/style.css")).read()

PREVIEW_CSS = """
/* --- preview shell only (not part of the shipped site) ------------------- */
/* No JS — some in-app file viewers strip scripts — and every page simply shows,
   stacked, with a banner saying what is missing. With JS the router picks one. */
html.js .pv-page{display:none}
html.js .pv-page.is-on{display:block}
html.js .pv-nojs{display:none}
.pv-nojs{
  margin:0;padding:18px 20px;background:#221A14;color:rgba(244,238,228,.86);
  border-bottom:2px solid #D08A50;
  font-family:var(--label);font-weight:300;font-size:13px;line-height:1.7;letter-spacing:.03em;
}
.pv-nojs b{display:block;color:#F4EEE4;font-weight:400;text-transform:uppercase;
  letter-spacing:.14em;font-size:11px;margin-bottom:6px}
.pv-toast{
  position:fixed;left:50%;bottom:22px;transform:translate(-50%,140%);z-index:200;
  width:min(92vw,460px);background:rgba(34,26,20,.97);border:1px solid rgba(244,238,228,.22);
  border-left:2px solid #D08A50;border-radius:4px;padding:16px 20px;
  font-family:var(--label);font-weight:300;font-size:12px;line-height:1.75;
  letter-spacing:.04em;color:rgba(244,238,228,.80);text-align:left;
  box-shadow:0 20px 50px rgba(34,26,20,.45);
  transition:transform .45s var(--ease),opacity .45s var(--ease);opacity:0;
}
.pv-toast.is-up{transform:translate(-50%,0);opacity:1}
.pv-toast b{color:var(--bone);font-weight:400}
.pv-note{
  position:fixed;left:50%;top:calc(100% - 22px);transform:translate(-50%,-100%);z-index:190;
  width:min(92vw,520px);background:rgba(34,26,20,.97);border:1px solid rgba(244,238,228,.22);
  border-left:2px solid #D08A50;border-radius:4px;padding:16px 46px 16px 20px;
  font-family:var(--label);font-weight:300;font-size:11.5px;line-height:1.8;
  letter-spacing:.05em;color:rgba(244,238,228,.80);
  box-shadow:0 20px 50px rgba(34,26,20,.45);
  opacity:0;transition:opacity .6s var(--ease),transform .6s var(--ease);
}
.pv-note.is-up{opacity:1}
.pv-note b{color:var(--bone);font-weight:400;letter-spacing:.14em;text-transform:uppercase;font-size:10.5px;display:block;margin-bottom:6px}
.pv-note button{
  position:absolute;right:8px;top:8px;width:34px;height:34px;color:rgba(244,238,228,.60);
  font-size:17px;line-height:1;
}
.pv-note button:hover{color:var(--bone)}
body{--pv:1}
"""

# ----------------------------------------------------------------- build ----
sections = []
for p in PAGES:
    body = bodies[p]
    sections.append('<div class="pv-page" id="pv-%s">\n%s\n</div>' % (p, body))

NOJS = (
    '<p class="pv-nojs"><b>This viewer is blocking the page\u2019s scripts</b>'
    'You are seeing every page stacked together, and the collection and product '
    'pages are empty, because they are built when the page loads. Open this file '
    'in a web browser \u2014 Safari, Chrome or Edge \u2014 to see the site properly.</p>')

# Set as early as possible so the router's pages never flash before being hidden.
JS_FLAG = '<script>document.documentElement.className += \' js\';</script>'

doc = """<title>Asekho Twaku Apparels — site preview</title>
%s
<style>
%s
%s
%s
</style>

%s
%s
<main id="main">
%s
</main>
%s
<script>%s</script>
<script>%s</script>
<script>%s</script>
<script>%s</script>
<script>%s</script>
""" % (JS_FLAG, font_css, style, PREVIEW_CSS,
       header, NOJS, "\n".join(sections), footer,
       PREAMBLE, main_js, coll_js, prod_js, ROUTER)

doc = strip_webp(doc)
doc = rewrite_links(doc)
doc = inline_static_images(doc)

import re as _re
left = sorted(set(_re.findall(r'href="([a-z0-9-]+\.html[^"]*)"', doc)))
if left:
    raise SystemExit("unrewritten page links in the preview: %s" % left)

open(OUT, "w", encoding="utf-8").write(doc)
print("  wrote %s  (%.2f MB)" % (OUT, os.path.getsize(OUT) / 1048576))

STANDALONE = os.path.join(BUILD, "asekho-twaku-apparels-preview.html")
with open(STANDALONE, "w", encoding="utf-8") as f:
    f.write('<!doctype html>\n<html lang="en">\n<head>\n'
            '<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
            '<meta name="theme-color" content="#221A14">\n'
            '</head>\n<body>\n')
    f.write(doc)
    f.write('</body>\n</html>\n')
print("  wrote %s  (%.2f MB)" % (STANDALONE, os.path.getsize(STANDALONE) / 1048576))
