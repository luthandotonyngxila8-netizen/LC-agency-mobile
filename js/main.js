/* ==========================================================================
   ASEKHO TWAKU APPARELS — site behaviour
   Vanilla JS, no dependencies. Everything degrades to a readable page.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WHATSAPP = '27XXXXXXXXX'; // placeholder — swap for the workshop number

  /* --- helpers ----------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  window.AT = {
    whatsapp: WHATSAPP,
    waLink: function (text) {
      return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text);
    },
    money: function (n) {
      return 'R' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },
    reduced: reduced
  };

  /* --- 1. Scroll reveal --------------------------------------------------- */
  function initReveal() {
    var items = $$('[data-reveal]').filter(function (el) { return !el.classList.contains('is-in'); });
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target); // reveal once
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* --- 2. Chrome sweep (one headline per page) ---------------------------- */
  function initChrome() {
    var el = $('.chrome');
    if (!el || el.getAttribute('data-swept') === 'yes') return;
    el.setAttribute('data-swept', 'yes');
    if (reduced || !('IntersectionObserver' in window)) { el.classList.add('is-swept'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        setTimeout(function () { el.classList.add('is-swept'); }, 260);
        io.disconnect();
      });
    }, { threshold: 0.35 });
    io.observe(el);
  }

  /* --- 3. Marquee --------------------------------------------------------- */
  function initMarquee() {
    $$('.marquee__track').forEach(function (track) {
      if (reduced) return;
      var clone = track.cloneNode(true);
      $$('span', clone).forEach(function (s) { s.setAttribute('aria-hidden', 'true'); });
      while (clone.firstChild) track.appendChild(clone.firstChild);
    });
  }

  /* --- 4. Drawer + scrim + search ---------------------------------------- */
  function initOverlays() {
    var drawer = $('#drawer');
    var scrim = $('#scrim');
    var search = $('#search');
    var lastFocus = null;

    function lock(on) { document.body.classList.toggle('is-locked', on); }

    function closeAll() {
      if (drawer) drawer.classList.remove('is-open');
      if (search) search.classList.remove('is-open');
      if (scrim) scrim.classList.remove('is-open');
      if (drawer) drawer.setAttribute('aria-hidden', 'true');
      if (search) search.setAttribute('aria-hidden', 'true');
      lock(false);
      if (lastFocus) { lastFocus.focus(); lastFocus = null; }
    }

    function openDrawer(trigger) {
      if (!drawer) return;
      lastFocus = trigger || null;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.classList.add('is-open');
      lock(true);
      var first = $('a, button', drawer);
      if (first) first.focus();
    }

    function openSearch(trigger) {
      if (!search) return;
      lastFocus = trigger || null;
      search.classList.add('is-open');
      search.setAttribute('aria-hidden', 'false');
      lock(true);
      var input = $('#search-input');
      if (input) { input.focus(); input.select(); }
    }

    $$('[data-open="drawer"]').forEach(function (b) {
      b.addEventListener('click', function () { openDrawer(b); });
    });
    $$('[data-open="search"]').forEach(function (b) {
      b.addEventListener('click', function () { openSearch(b); });
    });
    $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeAll); });
    if (scrim) scrim.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    initSearchIndex();
  }

  /* --- 5. Search over the product data ------------------------------------ */
  function initSearchIndex() {
    var input = $('#search-input');
    var out = $('#search-results');
    if (!input || !out) return;

    var base = document.body.getAttribute('data-root') || '';
    var items = [];
    var loaded = false;

    var STATIC = [
      { name: 'The Skins', ref: 'Ostrich · Crocodile · Nguni · Springbok · Zebra', href: base + 'skins.html' },
      { name: 'The Collection', ref: 'Every piece in the house', href: base + 'collection.html' },
      { name: 'Bespoke', ref: 'Commission your own', href: base + 'bespoke.html' },
      { name: 'Heritage', ref: 'Since 1999, East London', href: base + 'heritage.html' },
      { name: 'Contact', ref: 'Workshop and enquiries', href: base + 'contact.html' }
    ];

    function load() {
      if (loaded) return Promise.resolve();
      return fetch(base + 'data/products.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          items = (data.products || []).map(function (p) {
            return {
              name: p.name,
              ref: p.ref + ' · ' + p.hide,
              href: base + 'product.html?id=' + encodeURIComponent(p.id),
              hay: [p.name, p.ref, p.hide, p.category, p.materialLine].join(' ').toLowerCase()
            };
          });
          loaded = true;
        })
        .catch(function () { loaded = true; });
    }

    function render(q) {
      var term = q.trim().toLowerCase();
      var pool = items.concat(STATIC.map(function (s) {
        return { name: s.name, ref: s.ref, href: s.href, hay: (s.name + ' ' + s.ref).toLowerCase() };
      }));
      var hits = term ? pool.filter(function (i) { return i.hay.indexOf(term) > -1; }) : pool.slice(0, 5);
      if (!hits.length) {
        out.innerHTML = '<p class="small-note">Nothing under that name. Try a hide — ostrich, crocodile, nguni.</p>';
        return;
      }
      out.innerHTML = hits.slice(0, 8).map(function (i) {
        return '<a href="' + i.href + '"><span>' + i.name + '</span><span class="ref">' + i.ref + '</span></a>';
      }).join('');
    }

    input.addEventListener('focus', function () { load().then(function () { render(input.value); }); }, { once: true });
    input.addEventListener('input', function () { load().then(function () { render(input.value); }); });
    var form = input.form;
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  /* --- 6. Toggle tabs ----------------------------------------------------- */
  function initToggles() {
    $$('[data-toggle-group]').forEach(function (group) {
      var buttons = $$('[role="tab"]', group);
      var stage = $('.toggle-stage', group);
      var caption = $('.toggle-caption', group);
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) {
            b.setAttribute('aria-selected', String(b === btn));
            b.setAttribute('tabindex', b === btn ? '0' : '-1');
          });
          $$('.toggle-panel', stage).forEach(function (p) {
            p.classList.toggle('is-active', p.id === btn.getAttribute('aria-controls'));
          });
          if (caption) caption.textContent = btn.getAttribute('data-caption') || '';
        });
        btn.addEventListener('keydown', function (e) {
          var i = buttons.indexOf(btn);
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            var next = buttons[(i + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
            next.focus(); next.click();
          }
        });
      });
    });
  }

  /* --- 7. Forms (no backend yet — say so plainly) ------------------------- */
  function initForms() {
    $$('form[data-notice]').forEach(function (form) {
      if (form.getAttribute('data-bound') === 'yes') return;
      form.setAttribute('data-bound', 'yes');
      var msg = $('.form-msg', form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        if (msg) msg.textContent = form.getAttribute('data-notice');
        form.reset();
      });
    });
  }

  /* --- 8. Odds and ends --------------------------------------------------- */
  function initMisc() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    $$('[data-wa]').forEach(function (el) {
      el.setAttribute('href', window.AT.waLink(el.getAttribute('data-wa')));
    });
  }

  /* Re-run the bits that touch markup, for content rendered after load
     (the collection grid and the product page build themselves from JSON). */
  window.AT.refresh = function () {
    initReveal();
    initChrome();
    initForms();
    initMisc();
  };

  function boot() {
    initReveal();
    initChrome();
    initMarquee();
    initOverlays();
    initToggles();
    initForms();
    initMisc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
