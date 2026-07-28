/* ==========================================================================
   LASS Skincare — site behaviour
   Vanilla JS, no dependencies. Everything degrades gracefully without it.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ------------------------------------------------------ bottle artwork */
  var TONES = {
    amber: { glass: "#c79a5c", deep: "#a97c42", cap: "#2c2b26" },
    sage: { glass: "#8d9c81", deep: "#6f7e64", cap: "#2f3a29" },
    rose: { glass: "#d8b3a8", deep: "#c0968a", cap: "#3b2f2b" },
    stone: { glass: "#cfc7ba", deep: "#b4ab9c", cap: "#2c2b26" },
    night: { glass: "#8f95a6", deep: "#727888", cap: "#1d2029" },
    clay: { glass: "#c9a68b", deep: "#ae8a6e", cap: "#33291f" }
  };

  function label(y, name) {
    var sub = (name || "SKIN RITUAL").slice(0, 14);
    return (
      '<rect x="38" y="' +
      y +
      '" width="44" height="40" rx="2" fill="#fffdfa" opacity="0.92"/>' +
      '<text x="60" y="' +
      (y + 17) +
      '" text-anchor="middle" font-family="Cormorant Garamond, Garamond, serif"' +
      ' font-size="9" letter-spacing="2.4" fill="#17150f">LASS</text>' +
      '<text x="60" y="' +
      (y + 29) +
      '" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif"' +
      ' font-size="3.9" letter-spacing="0.6" fill="#7d7568">' +
      sub +
      "</text>"
    );
  }

  function shine(x, y, w, h) {
    return (
      '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      w +
      '" height="' +
      h +
      '" rx="' +
      w / 2 +
      '" fill="#ffffff" opacity="0.3"/>'
    );
  }

  /**
   * Returns inline SVG markup for a product vessel.
   * kind: serum | jar | tube | oil | mist
   */
  function bottleArt(kind, tone, name) {
    var t = TONES[tone] || TONES.amber;
    var body = "";

    if (kind === "jar") {
      body =
        '<rect x="24" y="98" width="72" height="62" rx="10" fill="' +
        t.glass +
        '"/>' +
        '<rect x="24" y="98" width="72" height="10" fill="' +
        t.deep +
        '" opacity="0.35"/>' +
        '<rect x="19" y="62" width="82" height="38" rx="6" fill="' +
        t.cap +
        '"/>' +
        '<rect x="19" y="88" width="82" height="4" fill="#ffffff" opacity="0.12"/>' +
        shine(32, 108, 7, 42) +
        label(112, name);
    } else if (kind === "tube") {
      body =
        '<path d="M40 62h40v104a10 10 0 0 1-10 10H50a10 10 0 0 1-10-10z" fill="' +
        t.glass +
        '"/>' +
        '<rect x="47" y="26" width="26" height="24" rx="4" fill="' +
        t.cap +
        '"/>' +
        '<rect x="42" y="50" width="36" height="14" rx="3" fill="' +
        t.deep +
        '"/>' +
        shine(48, 74, 6, 76) +
        label(92, name);
    } else if (kind === "oil") {
      body =
        '<path d="M42 84c0-9 6-12 6-20V64h24v0c0 8 6 11 6 20v76a10 10 0 0 1-10 10H52a10 10 0 0 1-10-10z" fill="' +
        t.glass +
        '"/>' +
        '<rect x="50" y="40" width="20" height="26" rx="3" fill="' +
        t.cap +
        '"/>' +
        '<rect x="46" y="60" width="28" height="8" rx="2" fill="' +
        t.deep +
        '"/>' +
        shine(50, 96, 6, 58) +
        label(104, name);
    } else if (kind === "mist") {
      body =
        '<rect x="34" y="78" width="52" height="92" rx="9" fill="' +
        t.glass +
        '"/>' +
        '<rect x="52" y="56" width="16" height="24" fill="' +
        t.deep +
        '"/>' +
        '<rect x="44" y="36" width="32" height="22" rx="4" fill="' +
        t.cap +
        '"/>' +
        '<rect x="72" y="42" width="14" height="6" rx="3" fill="' +
        t.cap +
        '"/>' +
        shine(43, 90, 6, 62) +
        label(104, name);
    } else {
      /* serum dropper */
      body =
        '<rect x="36" y="76" width="48" height="96" rx="9" fill="' +
        t.glass +
        '"/>' +
        '<rect x="52" y="58" width="16" height="20" fill="' +
        t.deep +
        '"/>' +
        '<rect x="45" y="24" width="30" height="36" rx="4" fill="' +
        t.cap +
        '"/>' +
        '<rect x="45" y="50" width="30" height="4" fill="#ffffff" opacity="0.14"/>' +
        shine(44, 88, 6, 66) +
        label(104, name);
    }

    return (
      '<svg class="bottle" viewBox="0 0 120 200" role="img" aria-hidden="true" focusable="false">' +
      body +
      "</svg>"
    );
  }

  /* Hydrate any placeholder that asks for artwork. */
  $$("[data-bottle]").forEach(function (el) {
    el.innerHTML = bottleArt(
      el.getAttribute("data-bottle"),
      el.getAttribute("data-tone"),
      el.getAttribute("data-label")
    );
  });

  /* ------------------------------------------------------ header state */
  var header = $(".header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------ drawers */
  var lastFocus = null;

  function openDrawer(drawer) {
    lastFocus = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    var focusable = $(
      "button, a[href], input, [tabindex]:not([tabindex='-1'])",
      drawer
    );
    if (focusable) focusable.focus();
  }

  function closeDrawer(drawer) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (!$(".drawer.is-open")) document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$("[data-drawer-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var drawer = document.getElementById(btn.getAttribute("data-drawer-open"));
      if (drawer) openDrawer(drawer);
    });
  });

  $$("[data-drawer-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var drawer = btn.closest(".drawer");
      if (drawer) closeDrawer(drawer);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = $(".drawer.is-open");
    if (open) closeDrawer(open);
  });

  /* Close the mobile menu when a link inside it is used. */
  $$("#menu-drawer a").forEach(function (a) {
    a.addEventListener("click", function () {
      closeDrawer(document.getElementById("menu-drawer"));
    });
  });

  /* ------------------------------------------------------ toast */
  var toastEl = $(".toast");
  var toastTimer;

  function toast(message) {
    if (!toastEl) return;
    /* the open bag already shows the change — no need to shout over it */
    var openCart = document.getElementById("cart-drawer");
    if (openCart && openCart.classList.contains("is-open")) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-on");
    }, 2600);
  }

  /* ------------------------------------------------------ cart */
  var STORE_KEY = "lass.cart.v1";
  var cart = [];

  function readCart() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeCart() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cart));
    } catch (err) {
      /* storage unavailable (private mode) — cart stays in memory */
    }
  }

  function money(cents) {
    return "$" + (cents / 100).toFixed(2).replace(/\.00$/, "");
  }

  function cartCount() {
    return cart.reduce(function (n, item) {
      return n + item.qty;
    }, 0);
  }

  function cartTotal() {
    return cart.reduce(function (n, item) {
      return n + item.qty * item.price;
    }, 0);
  }

  function renderCart() {
    var badge = $("[data-cart-count]");
    if (badge) {
      var n = cartCount();
      badge.textContent = n;
      badge.classList.toggle("is-on", n > 0);
    }

    var list = $("[data-cart-list]");
    var foot = $("[data-cart-foot]");
    if (!list) return;

    if (!cart.length) {
      list.innerHTML =
        '<div class="cart-empty">' +
        '<p class="muted">Your bag is empty.</p>' +
        '<a class="link-line" href="shop.html">Browse the collection</a>' +
        "</div>";
      if (foot) foot.hidden = true;
      return;
    }

    list.innerHTML = cart
      .map(function (item, i) {
        return (
          '<article class="cart-line">' +
          '<div class="cart-line__thumb">' +
          bottleArt(item.kind, item.tone, "") +
          "</div>" +
          "<div>" +
          '<div class="card__row"><h4>' +
          item.name +
          '</h4><span class="card__price">' +
          money(item.price * item.qty) +
          "</span></div>" +
          "<small>" +
          item.size +
          " · " +
          money(item.price) +
          " each</small><br>" +
          '<div class="qty">' +
          '<button type="button" data-step="-1" data-index="' +
          i +
          '" aria-label="Decrease quantity of ' +
          item.name +
          '">&minus;</button>' +
          "<span>" +
          item.qty +
          "</span>" +
          '<button type="button" data-step="1" data-index="' +
          i +
          '" aria-label="Increase quantity of ' +
          item.name +
          '">+</button>' +
          "</div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    if (foot) {
      foot.hidden = false;
      var totalEl = $("[data-cart-total]", foot);
      if (totalEl) totalEl.textContent = money(cartTotal());
    }
  }

  function addToCart(data) {
    var existing = cart.filter(function (item) {
      return item.id === data.id;
    })[0];
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: data.id,
        name: data.name,
        price: data.price,
        size: data.size,
        kind: data.kind,
        tone: data.tone,
        qty: 1
      });
    }
    writeCart();
    renderCart();
    toast(data.name + " added to bag");
  }

  cart = readCart();
  renderCart();

  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) {
      e.preventDefault();
      addToCart({
        id: add.getAttribute("data-id"),
        name: add.getAttribute("data-name"),
        price: parseInt(add.getAttribute("data-price"), 10),
        size: add.getAttribute("data-size") || "",
        kind: add.getAttribute("data-kind") || "serum",
        tone: add.getAttribute("data-tone") || "amber"
      });
      return;
    }

    var step = e.target.closest("[data-step]");
    if (step) {
      var i = parseInt(step.getAttribute("data-index"), 10);
      var delta = parseInt(step.getAttribute("data-step"), 10);
      if (!cart[i]) return;
      cart[i].qty += delta;
      if (cart[i].qty < 1) cart.splice(i, 1);
      writeCart();
      renderCart();
      return;
    }

    if (e.target.closest("[data-cart-clear]")) {
      cart = [];
      writeCart();
      renderCart();
      toast("Bag emptied");
      return;
    }

    if (e.target.closest("[data-checkout]")) {
      toast("Checkout is not connected in this demo");
    }
  });

  /* ------------------------------------------------------ accordion */
  $$(".ing__trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var item = trigger.closest(".ing__item");
      var open = item.classList.contains("is-open");
      $$(".ing__item").forEach(function (other) {
        other.classList.remove("is-open");
        $(".ing__trigger", other).setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ------------------------------------------------------ testimonials */
  var quotes = $$(".quote");
  var dots = $$(".quotes__dots .dot");
  if (quotes.length) {
    var index = 0;
    var timer;

    var show = function (next) {
      index = (next + quotes.length) % quotes.length;
      quotes.forEach(function (q, i) {
        q.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (d, i) {
        d.setAttribute("aria-selected", i === index ? "true" : "false");
      });
    };

    var play = function () {
      clearInterval(timer);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = setInterval(function () {
        show(index + 1);
      }, 6500);
    };

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });

    var quotesWrap = $(".quotes");
    if (quotesWrap) {
      quotesWrap.addEventListener("mouseenter", function () {
        clearInterval(timer);
      });
      quotesWrap.addEventListener("mouseleave", play);
    }

    show(0);
    play();
  }

  /* ------------------------------------------------------ filters */
  var chips = $$("[data-filter]");
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var value = chip.getAttribute("data-filter");
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });

        var shown = 0;
        $$("[data-category]").forEach(function (card) {
          var match =
            value === "all" ||
            card.getAttribute("data-category").split(" ").indexOf(value) > -1;
          card.hidden = !match;
          if (match) shown++;
        });

        var count = $("[data-result-count]");
        if (count) {
          count.textContent =
            shown + (shown === 1 ? " product" : " products");
        }
      });
    });
  }

  /* ------------------------------------------------------ reveal */
  var reveals = $$(".reveal");
  if (reveals.length) {
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) {
        el.classList.add("is-in");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );
      reveals.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ------------------------------------------------------ forms */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  $$("form[data-validate]").forEach(function (form) {
    var note = $(".form-note", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("input[type='email']", form);
      var required = $$("[required]", form);
      var problem = "";

      required.forEach(function (field) {
        if (!problem && !field.value.trim()) {
          problem = "Please complete every field.";
          field.focus();
        }
      });

      if (!problem && email && !EMAIL.test(email.value.trim())) {
        problem = "That email address doesn’t look right.";
        email.focus();
      }

      if (!note) return;
      note.classList.remove("is-error", "is-ok");

      if (problem) {
        note.textContent = problem;
        note.classList.add("is-error");
        return;
      }

      note.textContent =
        form.getAttribute("data-success") || "Thank you — we’ll be in touch.";
      note.classList.add("is-ok");
      form.reset();
    });
  });

  /* ------------------------------------------------------ year */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
