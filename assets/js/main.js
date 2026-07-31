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
    turmeric: { glass: "#d69a24", deep: "#b57c15", cap: "#16130f" },
    honey: { glass: "#e0ae52", deep: "#c08f38", cap: "#16130f" },
    lemon: { glass: "#e2cf6a", deep: "#c7b34e", cap: "#16130f" },
    pomegranate: { glass: "#c2685f", deep: "#a44f47", cap: "#16130f" },
    cream: { glass: "#efe0c4", deep: "#d9c6a3", cap: "#16130f" },
    amber: { glass: "#c79a5c", deep: "#a97c42", cap: "#16130f" },
    stone: { glass: "#d9d1c2", deep: "#bfb5a3", cap: "#16130f" }
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
   * kind: serum | jar | tube | oil | mist | bar | rollon
   */
  function bottleArt(kind, tone, name) {
    var t = TONES[tone] || TONES.turmeric;
    var body = "";

    if (kind === "bar") {
      /* soap bar, seen slightly from above */
      body =
        '<path d="M22 92h76a8 8 0 0 1 8 8v40a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8v-40a8 8 0 0 1 8-8z" fill="' +
        t.deep +
        '"/>' +
        '<path d="M22 78h76a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V86a8 8 0 0 1 8-8z" fill="' +
        t.glass +
        '"/>' +
        '<rect x="34" y="88" width="52" height="14" rx="2" fill="#fffdfa" opacity="0.9"/>' +
        '<text x="60" y="99" text-anchor="middle" font-family="Cormorant Garamond, Garamond, serif"' +
        ' font-size="9" letter-spacing="2.4" fill="#16130f">LASS</text>' +
        '<text x="60" y="116" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif"' +
        ' font-size="4" letter-spacing="0.8" fill="#16130f" opacity="0.55">' +
        (name || "").slice(0, 16) +
        "</text>";
    } else if (kind === "rollon") {
      body =
        '<rect x="40" y="72" width="40" height="98" rx="12" fill="' +
        t.glass +
        '"/>' +
        '<circle cx="60" cy="70" r="11" fill="' +
        t.deep +
        '"/>' +
        '<rect x="46" y="30" width="28" height="42" rx="12" fill="' +
        t.cap +
        '"/>' +
        shine(47, 86, 6, 60) +
        label(100, name);
    } else if (kind === "jar") {
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
  /* only opt into JS-driven header motion once we know scripting is running,
     so the nav never sits invisible for a visitor without JavaScript */
  document.documentElement.classList.add("js");

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

  /* prices are held in cents so quantity maths stays exact; South African rand */
  function money(cents) {
    return "R" + (cents / 100).toFixed(2).replace(/\.00$/, "");
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
      var changed = badge.textContent !== String(n);
      badge.textContent = n;
      badge.classList.toggle("is-on", n > 0);
      /* pulse once whenever the number moves — restarting the animation
         needs the class removed and a reflow forced before re-adding it */
      if (changed && n > 0) {
        badge.classList.remove("is-pulsing");
        void badge.offsetWidth;
        badge.classList.add("is-pulsing");
      }
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
          (item.shot
            ? '<img class="shot" src="' + item.shot + '" alt="" loading="lazy">'
            : bottleArt(item.kind, item.tone, "")) +
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

  /* the size picker sits in the same card as its add button */
  function chosenSize(add) {
    var card = add.closest(".card");
    var select = card && $("[data-size-for]", card);
    return select ? select.value : "";
  }

  function addToCart(data) {
    /* a medium and a large are two different lines, not one product twice */
    var existing = cart.filter(function (item) {
      return item.id === data.id && item.size === data.size;
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
        shot: data.shot,
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
        /* garments carry a size picker; whatever is chosen is what goes in */
        size: chosenSize(add) || add.getAttribute("data-size") || "",
        kind: add.getAttribute("data-kind") || "serum",
        tone: add.getAttribute("data-tone") || "turmeric",
        shot: add.getAttribute("data-shot") || ""
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
      toast("Checkout is not connected yet — call 078 008 5989 to order");
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

  /* ------------------------------------------------------ interactive hero */
  var prefersMotion = !window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var hero = $(".hero");
  var heroArt = $(".hero__art");

  if (hero && heroArt) {
    /* the artwork settles from dim to full once it is on screen */
    if (!("IntersectionObserver" in window)) {
      heroArt.classList.add("is-visible");
    } else {
      var heroIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            heroArt.classList.add("is-visible");
            heroIo.unobserve(entry.target);
          });
        },
        { threshold: 0.2 }
      );
      heroIo.observe(heroArt);
    }
  }

  if (hero && heroArt && prefersMotion) {
    /* parallax — the vessel drifts a little slower than the page */
    var parallaxQueued = false;

    var applyParallax = function () {
      parallaxQueued = false;
      var top = hero.getBoundingClientRect().top;
      var progress = Math.min(1, Math.max(0, -top / window.innerHeight));
      heroArt.style.transform = "translateY(" + progress * 30 + "px)";
    };

    window.addEventListener(
      "scroll",
      function () {
        if (parallaxQueued) return;
        parallaxQueued = true;
        requestAnimationFrame(applyParallax);
      },
      { passive: true }
    );
    applyParallax();

    /* citrus motes that trail the cursor across the hero */
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext && canvas.getContext("2d");

    if (ctx) {
      var SPARK_COLOURS = ["#b08535", "#e2cf6a", "#d69a24"];
      var motes = [];
      var running = false;
      var lastSpawn = 0;

      canvas.className = "hero__spark";
      canvas.setAttribute("aria-hidden", "true");
      hero.insertBefore(canvas, hero.firstChild);

      var sizeCanvas = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = hero.offsetWidth * dpr;
        canvas.height = hero.offsetHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      sizeCanvas();

      var spawn = function (x, y) {
        motes.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -Math.random() * 1.2 - 0.2,
          life: 1,
          fade: 0.014 + Math.random() * 0.012,
          size: Math.random() * 2 + 1,
          colour: SPARK_COLOURS[Math.floor(Math.random() * SPARK_COLOURS.length)]
        });
      };

      var frame = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        motes = motes.filter(function (m) {
          return m.life > 0;
        });

        motes.forEach(function (m) {
          m.x += m.vx;
          m.y += m.vy;
          m.vy += 0.02;
          m.life -= m.fade;
          ctx.globalAlpha = Math.max(0, m.life) * 0.75;
          ctx.fillStyle = m.colour;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.globalAlpha = 1;

        if (motes.length) {
          requestAnimationFrame(frame);
        } else {
          running = false;
        }
      };

      hero.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var now = Date.now();
        if (now - lastSpawn < 50) return;
        lastSpawn = now;

        var rect = canvas.getBoundingClientRect();
        spawn(e.clientX - rect.left, e.clientY - rect.top);
        spawn(e.clientX - rect.left, e.clientY - rect.top);

        if (!running) {
          running = true;
          requestAnimationFrame(frame);
        }
      });

      window.addEventListener("resize", sizeCanvas);
    }
  }

  /* ------------------------------------------------------ year */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
