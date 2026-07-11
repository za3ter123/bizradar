  // Framebusting guard: break out if this page is loaded inside a frame.
  // (meta-CSP can't set frame-ancestors and GitHub Pages can't send X-Frame-Options.)
  try { if (self !== top) { top.location = self.location; } } catch (e) {}

  // Sticky header: add subtle background once the user scrolls past the hero top.
  (function () {
    var header = document.getElementById("site-header");
    function onScroll() {
      if (window.scrollY > 12) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  })();

  // Reveal-on-scroll: fade/slide elements in once as they enter the viewport.
  // Honors prefers-reduced-motion (the CSS already shows everything in that case).
  (function () {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    nodes.forEach(function (n) { io.observe(n); });
  })();

  // Signup: email step -> pick-your-turf chips -> Polar 7-day-trial checkout.
  // Vanilla JS, no framework. No backend: the confirm step hands off to Polar
  // (hosted checkout) with the email and turf prefilled.
  (function () {
    var DEFAULT_COUNTIES = [
      "Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange",
      "Pinellas", "Duval", "Lee", "Polk", "Brevard", "Volusia", "Pasco",
      "Sarasota", "Collier"
    ];
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var TICK =
      '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

    var emailForm = document.getElementById("email-form");
    var emailInput = document.getElementById("email-input");
    var honeypot = document.getElementById("company-website");
    var turfStep = document.getElementById("turf-step");
    var chipsWrap = document.getElementById("county-chips");
    var confirmBtn = document.getElementById("confirm-turf");
    var turfMsg = document.getElementById("turf-msg");
    var doneBox = document.getElementById("signup-done");
    var trustLine = document.getElementById("trust-line");
    if (!emailForm) return;

    var selected = {};

    // Build the county chips once.
    DEFAULT_COUNTIES.forEach(function (county) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.setAttribute("aria-pressed", "false");
      chip.dataset.county = county;
      // TICK is a static SVG constant; the county label goes in via textContent
      // (never innerHTML) so no markup can ride in on the name.
      chip.innerHTML = TICK;
      var label = document.createElement("span");
      label.textContent = county;
      chip.appendChild(label);
      chip.addEventListener("click", function () {
        var on = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", on ? "false" : "true");
        if (on) delete selected[county]; else selected[county] = true;
        turfMsg.textContent = "";
      });
      chipsWrap.appendChild(chip);
    });

    function setError(msg) { turfMsg.textContent = msg; }

    // Step 1: validate the email, then reveal the turf step.
    emailForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (emailInput.value || "").trim();
      if (!EMAIL_RE.test(email)) {
        emailInput.focus();
        emailInput.setAttribute("aria-invalid", "true");
        return;
      }
      emailInput.removeAttribute("aria-invalid");
      turfStep.hidden = false;
      turfStep.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // Step 2: confirm turf, then send them to the Polar 7-day free-trial
    // checkout with their email and turf prefilled. custom_field_data.regions
    // flows through to the daily digest when the Polar checkout carries a
    // matching "regions" custom field; otherwise the digest defaults to all of
    // Florida. No charge today — Polar handles the trial and billing.
    var TRIAL_CHECKOUT =
      "https://buy.polar.sh/polar_cl_L0W22LYNfGHGdxMthtKYB9ckAYuB7YtCbNANX4Mmqik";
    // Put a CTA button into a clear, disabled loading state while the browser
    // hands off to the hosted checkout, so it's obvious something is happening.
    // Swaps the visible label and flips aria-busy/disabled. The .is-loading CSS
    // reveals the spinner. Idempotent-safe via the disabled guard at call sites.
    function setButtonLoading(btn, loadingText) {
      if (!btn) return;
      var label = btn.querySelector(".btn-label");
      if (label) label.textContent = loadingText;
      btn.classList.add("is-loading");
      btn.setAttribute("aria-busy", "true");
      if ("disabled" in btn) btn.disabled = true;
    }

    confirmBtn.addEventListener("click", function () {
      // Ignore re-clicks once the redirect is already in flight.
      if (confirmBtn.disabled || confirmBtn.classList.contains("is-loading")) return;
      var email = (emailInput.value || "").trim();
      var counties = Object.keys(selected);
      if (counties.length === 0) {
        setError("Pick at least one county.");
        return;
      }
      // Honeypot: a filled hidden field means a bot — drop it silently.
      if (honeypot && honeypot.value) return;
      setError("");

      var params = new URLSearchParams();
      params.set("customer_email", email);
      params.set("custom_field_data.regions", counties.join(", "));
      params.set("utm_source", "bizradar");
      params.set("utm_medium", "hero");
      params.set("utm_campaign", "trial_signup");

      // Show the loading state, then navigate. The label change makes the
      // hand-off obvious even on slow connections.
      setButtonLoading(confirmBtn, "Starting your trial…");
      window.location.href = TRIAL_CHECKOUT + "?" + params.toString();
    });

    // Pricing-card CTA: a plain <a> to the same hosted checkout. We don't stop
    // the navigation — we just flip it into the loading state on the way out so
    // the click registers visually before the new page loads.
    var checkoutLinks = document.querySelectorAll("[data-checkout]");
    Array.prototype.forEach.call(checkoutLinks, function (link) {
      link.addEventListener("click", function () {
        if (link.classList.contains("is-loading")) return;
        setButtonLoading(link, "Starting your trial…");
        // <a> navigation continues on its own; no preventDefault.
      });
    });
  })();

  // Checkout return states: when Polar sends the user back, surface a polished
  // success or a friendly cancel/retry message instead of dumping them on the
  // plain homepage. Success = ?subscribed=true; anything else from a return
  // (?subscribed=false / error) shows the non-alarming retry card.
  (function () {
    var params = new URLSearchParams(window.location.search);
    if (!params.has("subscribed")) return; // normal visit — do nothing

    var subscribed = params.get("subscribed") === "true";
    var successBox = document.getElementById("return-success");
    var cancelBox = document.getElementById("return-cancel");
    var signup = document.getElementById("signup");
    var trustLine = document.getElementById("trust-line");
    var box = subscribed ? successBox : cancelBox;
    if (!box) return;

    box.hidden = false;

    if (subscribed) {
      // They're in — the signup form is now noise. Hide it and the trust line.
      if (signup) signup.hidden = true;
      if (trustLine) trustLine.hidden = true;
    }

    // Bring the message into view and move focus there for screen-reader and
    // keyboard users returning from the external checkout tab/redirect.
    box.setAttribute("tabindex", "-1");
    try { box.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
    try { box.focus({ preventScroll: true }); } catch (e) { box.focus(); }

    // Cancel card: the retry button scrolls back to the signup form and focuses
    // the email field so they can pick up immediately.
    var retryBtn = document.getElementById("retry-signup");
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        cancelBox.hidden = true;
        var emailInput = document.getElementById("email-input");
        var hero = document.getElementById("hero");
        if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
        if (emailInput) {
          try { emailInput.focus({ preventScroll: true }); } catch (e) { emailInput.focus(); }
        }
      });
    }

    // Strip the ?subscribed param so a refresh or a shared link doesn't re-show
    // the banner. Keep any other params intact.
    if (window.history && window.history.replaceState) {
      params.delete("subscribed");
      var qs = params.toString();
      var clean = window.location.pathname + (qs ? "?" + qs : "") + window.location.hash;
      window.history.replaceState(null, "", clean);
    }
  })();

  // Tooltips: hover/focus reveal is pure CSS; this adds touch + click + keyboard
  // control. Tapping/clicking the (i) toggles the bubble; Escape closes it;
  // clicking elsewhere closes any open one. aria-expanded stays in sync.
  (function () {
    var tips = document.querySelectorAll(".tip[data-tip]");
    if (!tips.length) return;

    function closeAll(except) {
      Array.prototype.forEach.call(tips, function (tip) {
        if (tip === except) return;
        var bubble = tip.querySelector(".tip-bubble");
        var btn = tip.querySelector(".tip-btn");
        if (bubble) bubble.classList.remove("is-open");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }

    Array.prototype.forEach.call(tips, function (tip) {
      var btn = tip.querySelector(".tip-btn");
      var bubble = tip.querySelector(".tip-bubble");
      if (!btn || !bubble) return;

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = bubble.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        closeAll(tip);
      });

      // Don't let a click inside the bubble (e.g. selecting text) close it via
      // the document-level outside-click handler.
      bubble.addEventListener("click", function (e) { e.stopPropagation(); });

      // Close when focus leaves the tip entirely (e.g. tabbing away).
      tip.addEventListener("focusout", function () {
        // Defer so the new focus target is known before we check containment.
        window.setTimeout(function () {
          if (!tip.contains(document.activeElement)) {
            bubble.classList.remove("is-open");
            btn.setAttribute("aria-expanded", "false");
          }
        }, 0);
      });
    });

    // Escape closes everything; click/tap outside closes everything.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") closeAll(null);
    });
    document.addEventListener("click", function () { closeAll(null); });
  })();
