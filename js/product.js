/* Product page — ?id=-driven, built from /data/products.json.
   There is no cart. The CTA opens WhatsApp with the piece, hide and initials. */
(function () {
  'use strict';

  var root = document.getElementById('pdp-root');
  if (!root) return;

  var state = { product: null, hide: null, initials: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  /* --- markup pieces ------------------------------------------------------ */

  function gallery(p) {
    var thumbs = p.images.map(function (im, i) {
      return '<button type="button" data-go="' + i + '" aria-current="' + (i === 0) + '" ' +
        'aria-label="View image ' + (i + 1) + ' of ' + p.images.length + '">' +
        '<img src="' + esc(im.src) + '.jpg" alt="" width="1200" height="1500" loading="lazy"></button>';
    }).join('');

    var video = p.video
      ? '<button type="button" data-go="video" aria-label="Play the workshop film">' +
        '<img src="' + esc(p.images[0].src) + '.jpg" alt="" width="1200" height="1500" loading="lazy"></button>'
      : '';

    var main = p.images.map(function (im, i) {
      return '<picture data-slide="' + i + '"' + (i ? ' hidden' : '') + '>' +
        '<source srcset="' + esc(im.src) + '.webp" type="image/webp">' +
        '<img src="' + esc(im.src) + '.jpg" alt="' + esc(im.alt) + '" width="1200" height="1500"' +
        (i ? ' loading="lazy"' : ' fetchpriority="high"') + '></picture>';
    }).join('');

    if (p.video) {
      main += '<video data-slide="video" hidden controls preload="none" ' +
        'poster="' + esc(p.images[0].src) + '.jpg"><source src="' + esc(p.video) + '" type="video/mp4">' +
        'Your browser cannot play this film.</video>';
    }

    return '<div class="gallery">' +
      '<div class="thumb-rail" role="group" aria-label="Images of this piece">' + thumbs + video + '</div>' +
      '<div class="gallery__main">' + main + '</div>' +
    '</div>';
  }

  function pillars() {
    return '<div class="pillars" data-reveal>' +
      '<div><p class="t">Made to order</p><p class="s">Six to ten weeks, cut for you</p></div>' +
      '<div><p class="t">Repaired for life</p><p class="s">Stitching, always, at no charge</p></div>' +
      '<div><p class="t">Couriered free</p><p class="s">Anywhere in South Africa</p></div>' +
    '</div>';
  }

  function personalise(p) {
    if (!p.personalisation || !p.personalisation.enabled) return '';
    var max = p.personalisation.maxChars || 3;
    return '<div class="personalise">' +
      '<p class="eyebrow" style="margin-bottom:6px">Personalise Your Piece</p>' +
      '<p class="small-note">' + esc(p.personalisation.label) + '</p>' +
      '<div class="tag-preview" aria-hidden="true"><span class="tag-preview__text" id="tag-text">ABC</span></div>' +
      '<label class="label-caps" for="initials" style="margin-top:18px">Your initials — up to ' + max + ' characters</label>' +
      '<input class="field initials-input" id="initials" type="text" maxlength="' + max + '" ' +
        'placeholder="ABC" autocomplete="off" inputmode="latin" ' +
        'aria-describedby="initials-note">' +
      '<p class="small-note mt-s" id="initials-note">Stamped once, in brass. A stamped piece cannot be exchanged. Leave it blank for no initials.</p>' +
    '</div>';
  }

  function hideSelector(p) {
    if (!p.hideOptions || !p.hideOptions.length) return '';
    return '<div><span class="label-caps" id="hide-label">Hide</span>' +
      '<div class="hide-select" role="group" aria-labelledby="hide-label">' +
      p.hideOptions.map(function (h, i) {
        return '<button type="button" data-hide="' + esc(h) + '" aria-pressed="' + (i === 0) + '">' + esc(h) + '</button>';
      }).join('') + '</div></div>';
  }

  function buyBlock(p) {
    return '<div class="pdp__buy">' +
      '<p class="eyebrow" data-reveal>' + esc(p.ref) + ' — ' + esc(p.category) + '</p>' +
      '<h1 class="h2 chrome pdp__name" data-reveal style="--d:60ms;text-transform:uppercase;letter-spacing:.02em">' +
        esc(p.name) + '</h1>' +
      '<p class="price">' + window.AT.money(p.price) + '</p>' +
      '<p class="small-note">' + esc(p.priceNote) + '</p>' +
      '<p class="material-line mt-m">' + esc(p.materialLine) + '</p>' +
      '<p class="mood-line">' + esc(p.moodLine) + '</p>' +
      personalise(p) +
      hideSelector(p) +
      '<a class="btn btn--solid btn--block" id="commission-cta" href="#">Start Your Commission</a>' +
      '<p class="small-note mt-s center">Opens WhatsApp. No deposit until you have a figure in writing.</p>' +
    '</div>';
  }

  function editorial(p) {
    if (!p.editorial || !p.editorial.length) return '';
    return '<section class="band band--tight"><div class="wrap"><div class="editorial">' +
      p.editorial.map(function (e, i) {
        return '<div data-reveal style="--d:' + i * 90 + 'ms"><h3>' + esc(e.heading) + '</h3>' +
          '<p>' + esc(e.body) + '</p></div>';
      }).join('') + '</div></div></section>';
  }

  function specs(p) {
    if (!p.specs) return '';
    var blocks = Object.keys(p.specs).map(function (k) {
      return '<div class="spec-block" data-reveal><h3>' + esc(k) + '</h3><ul>' +
        p.specs[k].map(function (line) { return '<li>' + esc(line) + '</li>'; }).join('') +
        '</ul></div>';
    }).join('');
    return '<section class="band band--tight band--graphite"><div class="wrap wrap--narrow">' +
      '<p class="eyebrow" data-reveal>The Detail</p>' +
      '<h2 class="h2" data-reveal style="--d:60ms">One Fact Per Line.</h2>' +
      '<div class="spec-blocks">' + blocks + '</div></div></section>';
  }

  function policies() {
    var items = [
      ['Delivery', 'Couriered free anywhere in South Africa, insured, signature on delivery. ' +
        'International delivery is quoted per country — exotic hides need their paperwork checked against ' +
        'the destination first. Collection from the East London workshop is always welcome.'],
      ['Repairs &amp; care', 'Stitching is repaired free for the life of the piece. Handles, hardware, lining ' +
        'and base work are quoted at materials cost before we start. Bring it in once a year and we will ' +
        'condition it while you wait, at no charge.'],
      ['Returns &amp; exchanges', 'A made-to-order piece is cut for one person, so it cannot be returned once ' +
        'the hide is cut, and a stamped piece cannot be exchanged. Manufacturing defects are repaired or ' +
        'remade at our cost, and nothing here limits your rights under the Consumer Protection Act.']
    ];
    return '<section class="band band--tight"><div class="wrap wrap--narrow">' +
      '<p class="eyebrow" data-reveal>Before You Commission</p>' +
      '<div class="accordion" data-reveal>' + items.map(function (it) {
        return '<details><summary>' + it[0] + '</summary><div class="acc-body">' + it[1] + '</div></details>';
      }).join('') + '</div></div></section>';
  }

  function faq(p) {
    var items = [
      ['How long does it take?', 'Six to eight weeks for ostrich and Nguni, eight to ten for crocodile. ' +
        'If we are going to be late, you will hear it from us before the date, not after it.'],
      ['Can I change the hide?', 'Yes. ' + esc(p.name) + ' is cut in ' + esc(p.hideOptions.join(', ')) +
        ' as standard, and most pieces can be built in any of the five hides in the house. Ask on WhatsApp.'],
      ['Will it look exactly like the photograph?', 'No, and it should not. Quill spacing, scale pattern and ' +
        'Nguni markings differ on every hide. We photograph your actual hide before cutting.'],
      ['What if it wears out?', 'Bring it back. We made it, so we can open it — for as long as you own it, ' +
        'and regardless of who owned it first.']
    ];
    return '<section class="band band--tight band--graphite"><div class="wrap wrap--narrow">' +
      '<p class="eyebrow" data-reveal>Questions</p>' +
      '<h2 class="h2 mb-m" data-reveal style="--d:60ms">Asked Often Enough To Answer Here.</h2>' +
      '<div class="accordion" data-reveal>' + items.map(function (it) {
        return '<details><summary>' + it[0] + '</summary><div class="acc-body">' + it[1] + '</div></details>';
      }).join('') + '</div></div></section>';
  }

  function seriesBanner(p) {
    if (!p.series1999) return '';
    return '<section class="band band--tight"><div class="wrap wrap--narrow">' +
      '<div class="series-banner" data-reveal>' +
        '<p class="eyebrow">The 1999 Series</p>' +
        '<h2 class="h2">50 Pieces <em class="accent">Only</em></h2>' +
        '<p class="lede mt-s maxw-center">This piece can be built as one of the fifty — numbered on the brass ' +
        'shank, stamped with the year the workshop opened, cut before general orders.</p>' +
        '<p class="mt-m"><a class="btn btn--ghost" href="bespoke.html">Commission a numbered piece</a></p>' +
      '</div></div></section>';
  }

  function related(p, all) {
    var list = (p.related || []).map(function (id) {
      return all.filter(function (x) { return x.id === id; })[0];
    }).filter(Boolean);

    var cards = list.map(function (r, i) {
      return '<li data-reveal style="--d:' + i * 100 + 'ms"><a class="p-card" href="product.html?id=' +
        encodeURIComponent(r.id) + '">' +
        '<div class="p-card__media">' +
          (r.series1999 ? '<span class="badge-1999">1999 Series</span>' : '') +
          '<picture><source srcset="' + esc(r.images[0].src) + '.webp" type="image/webp">' +
          '<img src="' + esc(r.images[0].src) + '.jpg" alt="' + esc(r.images[0].alt) + '" ' +
          'width="1200" height="1500" loading="lazy"></picture>' +
        '</div>' +
        '<p class="p-card__ref">' + esc(r.ref) + ' — ' + esc(r.hide) + '</p>' +
        '<h3 class="p-card__name">' + esc(r.name) + '</h3>' +
        '<p class="p-card__meta"><span>' + esc(r.category) + '</span><span>' + window.AT.money(r.price) + '</span></p>' +
        '</a></li>';
    });

    cards.push('<li data-reveal style="--d:' + cards.length * 100 + 'ms">' +
      '<a class="p-card" href="bespoke.html">' +
      '<div class="p-card__media" style="display:grid;place-content:center;text-align:center;padding:24px">' +
        '<span class="eyebrow" style="margin:0">Bespoke</span>' +
        '<span class="h4 it" style="margin-top:12px">Something<br>we have not<br>made yet.</span>' +
      '</div>' +
      '<p class="p-card__ref">Commission</p>' +
      '<h3 class="p-card__name">Start from a conversation</h3>' +
      '<p class="p-card__meta"><span>Any hide</span><span>Quoted</span></p>' +
      '</a></li>');

    return '<section class="band"><div class="wrap">' +
      '<p class="eyebrow center" data-reveal>Also On The Bench</p>' +
      '<h2 class="h2 center mb-m" data-reveal style="--d:60ms">Cut From The Same Standard.</h2>' +
      '<ul class="product-grid">' + cards.join('') + '</ul></div></section>';
  }

  /* --- wiring ------------------------------------------------------------- */

  function ctaText() {
    var p = state.product;
    var bits = [
      'Good day. I would like to commission ' + p.name + ' (' + p.ref + ').',
      'Hide: ' + (state.hide || p.hide) + '.'
    ];
    bits.push(state.initials ? 'Initials for the brass shank: ' + state.initials + '.'
                             : 'No initials on the shank.');
    bits.push('Please send me a figure and a lead time.');
    return bits.join(' ');
  }

  function updateCta() {
    var cta = document.getElementById('commission-cta');
    if (cta) cta.setAttribute('href', window.AT.waLink(ctaText()));
  }

  function wire() {
    var rail = document.querySelector('.thumb-rail');
    if (rail) {
      rail.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-go]');
        if (!btn) return;
        var key = btn.getAttribute('data-go');
        Array.prototype.forEach.call(rail.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-current', String(b === btn));
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-slide]'), function (s) {
          s.hidden = s.getAttribute('data-slide') !== key;
        });
      });
    }

    var initials = document.getElementById('initials');
    var tag = document.getElementById('tag-text');
    if (initials && tag) {
      initials.addEventListener('input', function () {
        var v = initials.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
        initials.value = v;
        state.initials = v;
        tag.textContent = v || 'ABC';
        tag.classList.toggle('is-set', v.length > 0);
        updateCta();
      });
    }

    var hides = document.querySelector('.hide-select');
    if (hides) {
      hides.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-hide]');
        if (!btn) return;
        state.hide = btn.getAttribute('data-hide');
        Array.prototype.forEach.call(hides.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        updateCta();
      });
    }

    updateCta();
  }

  function notFound() {
    root.innerHTML = '<div style="padding:clamp(90px,16vw,180px) 0;text-align:center">' +
      '<p class="eyebrow">Not Found</p>' +
      '<h1 class="h2 chrome">That Piece Is Not On The Bench.</h1>' +
      '<p class="lede mt-m maxw-center">It may have been renamed, or the link may be old.</p>' +
      '<p class="mt-m"><a class="btn btn--ghost" href="collection.html">See the collection</a></p></div>';
    window.AT.refresh();
  }

  fetch('data/products.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var all = data.products || [];
      var id = param('id') || (all[0] && all[0].id);
      var p = all.filter(function (x) { return x.id === id; })[0];
      if (!p) { notFound(); return; }

      state.product = p;
      state.hide = (p.hideOptions && p.hideOptions[0]) || p.hide;

      document.title = p.name + ' — Asekho Twaku Apparels';
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', p.name + '. ' + p.materialLine + ' ' + p.priceNote);

      root.outerHTML =
        '<div class="wrap"><div class="pdp">' + gallery(p) + pillars() + buyBlock(p) + '</div></div>' +
        editorial(p) + specs(p) + policies() + faq(p) + seriesBanner(p) + related(p, all);

      wire();
      window.AT.refresh();
    })
    .catch(function () { notFound(); });
})();
