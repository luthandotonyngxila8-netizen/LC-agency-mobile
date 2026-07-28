/* Collection grid — built from /data/products.json */
(function () {
  'use strict';

  var grid = document.getElementById('grid');
  var filters = document.getElementById('filters');
  var empty = document.getElementById('grid-empty');
  if (!grid) return;

  var all = [];
  var order = [];
  var active = 'All';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function card(p, i) {
    var img = p.images[0];
    return '<li data-reveal style="--d:' + (i % 3) * 100 + 'ms">' +
      '<a class="p-card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="p-card__media">' +
          (p.series1999 ? '<span class="badge-1999">1999 Series</span>' : '') +
          '<picture>' +
            '<source srcset="' + esc(img.src) + '.webp" type="image/webp">' +
            '<img src="' + esc(img.src) + '.jpg" alt="' + esc(img.alt) + '" width="1200" height="1500" loading="lazy">' +
          '</picture>' +
        '</div>' +
        '<p class="p-card__ref">' + esc(p.ref) + ' — ' + esc(p.hide) + '</p>' +
        '<h2 class="p-card__name">' + esc(p.name) + '</h2>' +
        '<p class="p-card__meta"><span>' + esc(p.category) + '</span><span>' + window.AT.money(p.price) + '</span></p>' +
      '</a></li>';
  }

  function render() {
    var list = active === 'All' ? all : all.filter(function (p) { return p.category === active; });
    grid.innerHTML = list.map(card).join('');
    if (empty) empty.hidden = list.length > 0;
    window.AT.refresh();
  }

  function buildFilters() {
    /* Categories in the order the data file sets, then anything it missed. */
    var cats = ['All'];
    order.forEach(function (c) {
      if (all.some(function (p) { return p.category === c; })) cats.push(c);
    });
    all.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });

    filters.innerHTML = cats.map(function (c) {
      var n = c === 'All' ? all.length
                          : all.filter(function (p) { return p.category === c; }).length;
      return '<button type="button" data-cat="' + esc(c) + '" aria-pressed="' + (c === active) + '">' +
        esc(c === 'All' ? 'All pieces' : c) + ' <span class="filter-n">' + n + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(filters.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        active = b.getAttribute('data-cat');
        Array.prototype.forEach.call(filters.querySelectorAll('button'), function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
        render();
      });
    });
  }

  fetch('data/products.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      all = data.products || [];
      order = data.categories || [];
      buildFilters();
      render();
    })
    .catch(function () {
      grid.innerHTML = '<li><p class="small-note">The collection could not be loaded. ' +
        'WhatsApp the workshop and we will send you what is on the bench.</p></li>';
    });
})();
