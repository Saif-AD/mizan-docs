/* MIZAN — interactive home-page demo (5 steps, tap-only, sample data) */
(function () {
  var root = document.getElementById("demo-root");
  if (!root) return;

  var PROFILES = [
    {
      id: "muscle",
      emoji: "🏋️",
      name: "Active, building muscle",
      desc: "Trains 4×/week, wants lean gains",
      flags: ["⚠ Protein below target", "⚠ Low magnesium"],
      targets: [
        { label: "Protein", val: 46, text: "82g / 178g", warn: true },
        { label: "Carbs", val: 64, text: "210g / 330g" },
        { label: "Magnesium", val: 34, text: "140mg / 410mg", warn: true },
        { label: "Vitamin D", val: 78, text: "14µg / 18µg" },
        { label: "Iron", val: 88, text: "14mg / 16mg" }
      ],
      rings: [
        { label: "Protein", pct: 46, warn: true },
        { label: "Magnesium", pct: 34, warn: true },
        { label: "Calories", pct: 61 }
      ],
      meals: [
        { name: "Chicken Shawarma Protein Bowl", why: "38g protein plus brown rice carbs to fuel this afternoon's session.", boosts: ["Protein +21%", "Magnesium +12%"], gains: [38, 18, 16] },
        { name: "Grilled Salmon & Quinoa Plate", why: "Complete protein with magnesium-rich quinoa and greens.", boosts: ["Protein +19%", "Magnesium +28%"], gains: [33, 41, 15] },
        { name: "Labneh, Nuts & Seed Toast", why: "Almonds and pumpkin seeds are magnesium heavyweights.", boosts: ["Magnesium +38%", "Protein +9%"], gains: [16, 52, 13] }
      ]
    },
    {
      id: "iron",
      emoji: "🩸",
      name: "Low iron",
      desc: "Ferritin came back low on the last test",
      flags: ["⚠ Low iron", "⚠ Vitamin C helps absorption"],
      targets: [
        { label: "Iron", val: 31, text: "5.6mg / 18mg", warn: true },
        { label: "Vitamin C", val: 52, text: "47mg / 90mg", warn: true },
        { label: "Protein", val: 71, text: "64g / 90g" },
        { label: "B12", val: 84, text: "2.0µg / 2.4µg" },
        { label: "Folate", val: 69, text: "275µg / 400µg" }
      ],
      rings: [
        { label: "Iron", pct: 31, warn: true },
        { label: "Vitamin C", pct: 52, warn: true },
        { label: "Protein", pct: 71 }
      ],
      meals: [
        { name: "Grilled Beef & Spinach Bowl", why: "High in heme iron, paired with vitamin C-rich peppers for absorption.", boosts: ["Iron +44%", "Vit C +35%"], gains: [44, 35, 22] },
        { name: "Lentil, Date & Citrus Salad", why: "Plant iron with orange segments — vitamin C triples uptake.", boosts: ["Iron +28%", "Vit C +42%"], gains: [28, 42, 12] },
        { name: "Chicken Liver Msakhan Wrap", why: "One of the most iron-dense foods there is, in a familiar wrap.", boosts: ["Iron +58%", "B12 +30%"], gains: [58, 18, 19] }
      ]
    },
    {
      id: "busy",
      emoji: "💼",
      name: "Busy professional",
      desc: "Desk-bound days, eats on the go",
      flags: ["⚠ Needs more vitamin D", "⚠ Omega-3 below target"],
      targets: [
        { label: "Vitamin D", val: 27, text: "4µg / 15µg", warn: true },
        { label: "Omega-3", val: 38, text: "0.6g / 1.6g", warn: true },
        { label: "Fibre", val: 55, text: "16g / 30g" },
        { label: "Protein", val: 74, text: "67g / 90g" },
        { label: "Iron", val: 81, text: "13mg / 16mg" }
      ],
      rings: [
        { label: "Vitamin D", pct: 27, warn: true },
        { label: "Omega-3", pct: 38, warn: true },
        { label: "Fibre", pct: 55 }
      ],
      meals: [
        { name: "Charred Salmon & Freekeh", why: "Salmon covers vitamin D and omega-3 in a single plate.", boosts: ["Vit D +55%", "Omega-3 +48%"], gains: [55, 48, 21] },
        { name: "Sardine & Sumac Flatbread", why: "Small fish, big numbers — and ready in the time of a coffee run.", boosts: ["Omega-3 +52%", "Vit D +38%"], gains: [38, 52, 14] },
        { name: "Egg, Avocado & Greens Box", why: "Egg yolks add vitamin D; avocado and greens push fibre up.", boosts: ["Vit D +24%", "Fibre +31%"], gains: [24, 11, 31] }
      ]
    }
  ];

  var state = { step: 1, profile: null, meal: null, emailDone: false };

  /* ---------- helpers ---------- */
  var C = 151; // ring circumference (r=24)
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function ringHTML(r, i) {
    return (
      '<div class="dring' + (r.warn ? " warn" : "") + '" data-ring="' + i + '">' +
      '<svg viewBox="0 0 56 56"><circle class="track" cx="28" cy="28" r="24"></circle>' +
      '<circle class="fill" cx="28" cy="28" r="24"></circle></svg>' +
      '<span class="dring-pct">0%</span>' +
      "<label>" + esc(r.label) + "</label>" +
      '<span class="dring-need' + (r.warn ? "" : " ok") + '"></span>' +
      "</div>"
    );
  }

  function animateRing(el, fromPct, toPct, warnClears) {
    var fill = el.querySelector(".fill");
    var pctEl = el.querySelector(".dring-pct");
    var needEl = el.querySelector(".dring-need");
    var capped = Math.min(toPct, 100);
    fill.style.strokeDashoffset = C - (C * Math.min(fromPct, 100)) / 100;
    // force layout so the transition starts from `fromPct`
    void fill.getBoundingClientRect();
    requestAnimationFrame(function () {
      fill.style.strokeDashoffset = C - (C * capped) / 100;
    });
    var t0 = performance.now(), dur = 1300;
    function tick(now) {
      var k = Math.min((now - t0) / dur, 1);
      k = 1 - Math.pow(1 - k, 3);
      pctEl.textContent = Math.round(fromPct + (toPct - fromPct) * k) + "%";
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    if (warnClears && toPct >= 96) {
      setTimeout(function () {
        el.classList.remove("warn");
        needEl.classList.add("ok");
        needEl.textContent = "Target met ✓";
      }, dur * 0.7);
    } else {
      needEl.textContent = toPct >= 96 ? "Target met ✓" : "Needs " + (100 - toPct) + "% more";
      if (toPct >= 96) needEl.classList.add("ok");
    }
  }

  /* ---------- shell ---------- */
  root.innerHTML =
    '<div class="demo-shell" data-screen-label="Interactive demo">' +
    '<div class="demo-head"><p class="kicker" style="font-size: 1.2rem; letter-spacing: -0.5px; font-weight: 800; text-transform: none;">Try it now</p><h2 class="h-sect" style="font-size: clamp(2.2rem, 3.6vw, 3.4rem);">See your loop in 30 seconds. No sign-up, just taps.</h2></div>' +
    '<div class="demo-top">' +
    '<button class="demo-back" type="button">← Back</button>' +
    '<div class="demo-dots"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<span class="demo-tag">sample data</span>' +
    "</div>" +
    '<div class="demo-stage"></div>' +
    "</div>";

  var stage = root.querySelector(".demo-stage");
  var dots = root.querySelectorAll(".demo-dots i");
  var backBtn = root.querySelector(".demo-back");

  backBtn.addEventListener("click", function () {
    if (state.step === 5) state.step = 4;
    else if (state.step > 1) state.step -= 1;
    render();
  });

  /* ---------- steps ---------- */
  function step1() {
    stage.innerHTML =
      '<div class="demo-step">' +
      '<div class="demo-q"><h3>Try it with sample data.</h3><p>Pick a body. We\'ll show you exactly what Mizan would do with it — no sign-up, no typing.</p></div>' +
      '<div class="demo-profiles">' +
      PROFILES.map(function (p, i) {
        return (
          '<button class="demo-profile" type="button" data-profile="' + i + '">' +
          '<span class="dp-emoji">' + p.emoji + "</span>" +
          "<strong>" + esc(p.name) + "</strong>" +
          "<span>" + esc(p.desc) + "</span>" +
          '<span class="dp-go">Tap to start →</span>' +
          "</button>"
        );
      }).join("") +
      "</div></div>";
    stage.querySelectorAll("[data-profile]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.profile = PROFILES[+btn.dataset.profile];
        state.step = 2;
        render();
      });
    });
  }

  function step2() {
    var p = state.profile;
    stage.innerHTML =
      '<div class="demo-step">' +
      '<div class="demo-q"><h3>Here\'s what this body needs today.</h3><p>Targets built from this profile\'s bloodwork — not a population average.</p></div>' +
      '<div class="demo-dash">' +
      '<div class="demo-dash-head"><strong>' + p.emoji + " " + esc(p.name) + '</strong><span>Daily targets · from bloodwork</span></div>' +
      '<div class="demo-targets">' +
      p.targets.map(function (t) {
        return (
          '<div class="demo-target' + (t.warn ? " warn" : "") + '">' +
          "<span>" + esc(t.label) + "</span>" +
          '<span class="dt-bar"><i data-w="' + t.val + '"></i></span>' +
          '<span class="dt-val">' + esc(t.text) + "</span>" +
          "</div>"
        );
      }).join("") +
      "</div>" +
      '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' +
      p.flags.map(function (f, i) { return '<span class="demo-flag' + (i ? " f2" : "") + '">' + esc(f) + "</span>"; }).join("") +
      "</div></div>" +
      '<button class="demo-next" type="button">See today\'s progress →</button>' +
      "</div>";
    requestAnimationFrame(function () {
      stage.querySelectorAll(".dt-bar i").forEach(function (bar) {
        requestAnimationFrame(function () { bar.style.width = bar.dataset.w + "%"; });
      });
    });
    stage.querySelector(".demo-next").addEventListener("click", function () { state.step = 3; render(); });
  }

  function step3() {
    var p = state.profile;
    stage.innerHTML =
      '<div class="demo-step">' +
      '<div class="demo-q"><h3>Today\'s intake vs. target.</h3><p>It\'s 2pm. Here\'s how far this body has gotten — and where it\'s falling short.</p></div>' +
      '<div class="demo-rings"><div class="demo-rings-row">' +
      p.rings.map(ringHTML).join("") +
      "</div></div>" +
      '<button class="demo-next" type="button">Close the gaps →</button>' +
      "</div>";
    stage.querySelectorAll(".dring").forEach(function (el, i) {
      animateRing(el, 0, p.rings[i].pct, false);
    });
    stage.querySelector(".demo-next").addEventListener("click", function () { state.step = 4; render(); });
  }

  function step4() {
    var p = state.profile;
    stage.innerHTML =
      '<div class="demo-step">' +
      '<div class="demo-q"><h3>Mizan recommends — for this body, right now.</h3><p>Each meal is scored against today\'s shortfall. Tap one to order it.</p></div>' +
      '<div class="demo-meals">' +
      p.meals.map(function (m, i) {
        return (
          '<button class="demo-meal" type="button" data-meal="' + i + '">' +
          '<span class="dm-art"><code>meal photo</code></span>' +
          "<strong>" + esc(m.name) + "</strong>" +
          '<span class="dm-why">' + esc(m.why) + "</span>" +
          '<span class="dm-boost">' + m.boosts.map(function (b) { return "<span>" + esc(b) + "</span>"; }).join("") + "</span>" +
          '<span class="dm-tap">Tap to add →</span>' +
          "</button>"
        );
      }).join("") +
      "</div></div>";
    stage.querySelectorAll("[data-meal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.meal = state.profile.meals[+btn.dataset.meal];
        state.step = 5;
        render();
      });
    });
  }

  function step5() {
    var p = state.profile;
    var m = state.meal;
    stage.innerHTML =
      '<div class="demo-step">' +
      '<div class="demo-payoff">' +
      '<h3 class="h-card">' + esc(m.name) + " — ordered. Watch the gaps close.</h3>" +
      "</div>" +
      '<div class="demo-rings"><div class="demo-rings-row">' +
      p.rings.map(ringHTML).join("") +
      "</div></div>" +
      '<div class="demo-payoff"><p><strong>That\'s the whole loop.</strong> Measure → target → recommend → deliver. Every day, from your own bloodwork.</p></div>' +
      '<div class="demo-cta">' +
      '<h3 class="h-card">This was demo data. Your numbers are different.</h3>' +
      "<p>Get your real targets — download the app and connect your bloodwork in minutes.</p>" +
      '<div class="badges">' +
      '<a class="badge-store on-teal" href="#download"><span class="glyph">A</span><span><small>Coming soon on the</small><strong>App Store</strong></span></a>' +
      '<a class="badge-store on-teal" href="#download"><span class="glyph">G</span><span><small>Coming soon on</small><strong>Google Play</strong></span></a>' +
      "</div>" +
      (state.emailDone
        ? '<span class="demo-email-done">You\'re on the list — we\'ll email you at launch ✓</span>'
        : '<form class="demo-email"><input type="email" placeholder="Or leave your email for launch day" aria-label="Email" required><button type="submit">Notify me</button></form>') +
      "</div></div>";
    stage.querySelectorAll(".dring").forEach(function (el, i) {
      var from = p.rings[i].pct;
      var to = Math.min(from + m.gains[i], 100);
      animateRing(el, from, to, true);
    });
    var form = stage.querySelector(".demo-email");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        state.emailDone = true;
        form.outerHTML = '<span class="demo-email-done">You\'re on the list — we\'ll email you at launch ✓</span>';
      });
    }
  }

  function render() {
    dots.forEach(function (d, i) { d.classList.toggle("on", i < state.step); });
    backBtn.classList.toggle("show", state.step > 1);
    [step1, step2, step3, step4, step5][state.step - 1]();
  }

  render();
})();
