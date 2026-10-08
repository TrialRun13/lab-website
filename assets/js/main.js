/* ==================================================================
   Lab website: interactions
   Every feature checks that its elements exist, so pages only run
   what they need. Motion is skipped for users who prefer reduced motion.
   ================================================================== */
(function () {
  "use strict";
  var html = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var outside = function (el, e) { var r = el.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------------- Theme (light / dark) ---------------- */
  var toggle = $(".theme-toggle");
  function currentTheme() { return html.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function setTheme(t, store) {
    html.setAttribute("data-theme", t);
    if (store) { try { localStorage.setItem("theme", t); } catch (e) {} }
    if (toggle) toggle.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
  setTheme(currentTheme(), false);
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      if (!document.startViewTransition || reduce) { setTheme(next, true); return; }
      var r = toggle.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      html.classList.add("theme-switching");
      var vt = document.startViewTransition(function () { setTheme(next, true); });
      vt.ready.then(function () {
        html.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + end + "px at " + x + "px " + y + "px)"] },
          { duration: 700, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
        );
      });
      vt.finished.then(function () { html.classList.remove("theme-switching"); });
    });
  }
  // Follow the operating-system setting until the visitor picks one
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var stored = null; try { stored = localStorage.getItem("theme"); } catch (err) {}
      if (!stored) setTheme(e.matches ? "dark" : "light", false);
    });
  } catch (e) {}

  /* ---------------- Mobile menu ---------------- */
  var navToggle = $(".nav-toggle");
  if (navToggle) {
    var closeNav = function () { body.classList.remove("nav-open"); navToggle.setAttribute("aria-expanded", "false"); navToggle.setAttribute("aria-label", "Open menu"); };
    navToggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$(".site-nav a").forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ---------------- Split words (headline reveal + scroll highlight) ---------------- */
  function splitWords(root, withInner) {
    var count = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement("span"); w.className = "w";
            if (withInner) {
              var i = document.createElement("span"); i.className = "wi"; i.style.setProperty("--i", count); i.textContent = p; w.appendChild(i);
            } else { w.textContent = p; }
            count++; frag.appendChild(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) { walk(child); }
      });
    })(root);
    return count;
  }
  $$(".split-words").forEach(function (el) { splitWords(el, true); });
  var aboutText = $(".about-text");
  var aboutWords = [];
  if (aboutText) { splitWords(aboutText, false); aboutWords = $$(".w", aboutText); if (reduce) aboutWords.forEach(function (w) { w.classList.add("lit"); }); }

  /* ---------------- Reveal on scroll, counters ---------------- */
  var revealTargets = $$(".person, .news-card, .stat, .pub, .gallery-item, .join-card, .opening, .tl-item, .alumni-list li, .pi-card, .team-intro, .contact-grid > *, .about-figure, .tool-card");
  $$(".fiber-divider").forEach(function (el) { revealTargets.push(el); });
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
    var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
    el.style.setProperty("--i", sibs % 6);
  });
  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10) || 0, start = performance.now(), dur = 1600;
    if (reduce) { el.textContent = end.toLocaleString(); return; }
    (function tick(now) {
      var t = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(end * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        var c = e.target.querySelector("[data-count]");
        if (c) countUp(c);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealTargets.concat($$(".split-words")).forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.concat($$(".split-words")).forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- Rotating words with a text-scramble effect ---------------- */
  var rot = $(".rotator");
  if (rot) {
    var words = (rot.getAttribute("data-words") || "").split("|").filter(Boolean);
    var glyphs = "!<>-_\\/[]{}=+*^?#ΔΣλμ";
    var wi = 0;
    var scramble = function (to) {
      var from = rot.textContent, len = Math.max(from.length, to.length), queue = [], frame = 0;
      for (var i = 0; i < len; i++) {
        var s = Math.floor(Math.random() * 18), e = s + Math.floor(Math.random() * 18) + 6;
        queue.push({ from: from[i] || "", to: to[i] || "", start: s, end: e, ch: "" });
      }
      (function update() {
        var out = "", done = 0;
        queue.forEach(function (q) {
          if (frame >= q.end) { done++; out += q.to; }
          else if (frame >= q.start) {
            if (!q.ch || Math.random() < 0.3) q.ch = glyphs[Math.floor(Math.random() * glyphs.length)];
            out += q.ch;
          } else out += q.from;
        });
        rot.textContent = out;
        if (done < queue.length) { frame++; requestAnimationFrame(update); }
      })();
    };
    if (words.length > 1) {
      setInterval(function () {
        if (document.hidden) return;
        wi = (wi + 1) % words.length;
        if (reduce) rot.textContent = words[wi]; else scramble(words[wi]);
      }, 2800);
    }
  }

  /* ---------------- Shared: draw a migrating cell (used by cursor + hero) ---------------- */
  // x,y centre · r radius · phi polarity (direction of migration) · pol 0..1 polarisation
  // t time · spread 0..1 (spreading on a link) · alpha
  function drawCell(ctx, x, y, r, phi, pol, t, spread, alpha) {
    var N = 20, pts = [];
    for (var k = 0; k < N; k++) {
      var a = (k / N) * Math.PI * 2, da = a - phi;
      var rad = r * (1 + 0.08 * Math.sin(3 * a + t * 2.1) + 0.05 * Math.sin(5 * a - t * 3.2) + spread * 0.12 * Math.sin(6 * a + t * 4));
      rad *= 1 + pol * (0.55 * Math.cos(da) + 0.18 * Math.cos(2 * da));
      pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    // filopodia probing ahead (or all around when not migrating)
    var nf = 4 + Math.round(spread * 4);
    ctx.lineCap = "round";
    for (var i = 0; i < nf; i++) {
      var fa = pol > 0.15 ? phi + (i - (nf - 1) / 2) * 0.42 + 0.15 * Math.sin(t * 2 + i) : (i / nf) * Math.PI * 2 + t * 0.4;
      var base = r * (1 + pol * 0.5 * Math.max(0, Math.cos(fa - phi)));
      var len = r * (0.45 + 0.35 * Math.sin(t * 2.6 + i * 1.7) + spread * 0.4);
      var bx = x + Math.cos(fa) * base * 0.92, by = y + Math.sin(fa) * base * 0.92;
      var tx = x + Math.cos(fa) * (base + len), ty = y + Math.sin(fa) * (base + len);
      ctx.strokeStyle = "rgba(25,211,230,.85)"; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(tx, ty, 1.5, 0, Math.PI * 2); ctx.fill(); // focal adhesion
    }
    // membrane + cytoplasm
    ctx.beginPath();
    ctx.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
    for (var j = 1; j <= N; j++) {
      var p = pts[j % N], q = pts[(j + 1) % N];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
    var g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.6);
    g.addColorStop(0, "rgba(25,211,230,.34)"); g.addColorStop(1, "rgba(25,211,230,.08)");
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(25,211,230,.14)"; ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(25,211,230,.95)"; ctx.stroke();
    // nucleus sits towards the rear of a migrating cell
    var nx = x - Math.cos(phi) * pol * r * 0.32, ny = y - Math.sin(phi) * pol * r * 0.32;
    ctx.beginPath(); ctx.ellipse(nx, ny, r * (0.44 - pol * 0.06), r * 0.34, phi, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(59,108,255,.92)"; ctx.fill();
    ctx.beginPath(); ctx.arc(nx + r * 0.1, ny - r * 0.06, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(224,69,123,.85)"; ctx.fill();
    ctx.restore();
  }

  /* ---------------- ECM fibre network (hero + CTA backgrounds) ----------------
     A crosslinked collagen-like network. Fibres are crimped at rest, straighten and
     turn magenta under tension, and buckle under compression. A cell (the cursor,
     or a wandering cell on touch screens) pulls on the network with traction forces. */
  function ECMNetwork(canvas, opts) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [], edges = [], t = 0, raf = 0, running = false, visible = true;
    var mouse = { x: 0, y: 0, on: false, down: false };
    var crawler = { x: 0, y: 0, px: 0, py: 0, phi: 0 };

    function build() {
      nodes = []; edges = [];
      var sp = W < 700 ? opts.spacing * 0.85 : opts.spacing;
      var cols = Math.ceil(W / sp) + 2, rows = Math.ceil(H / sp) + 2;
      for (var j = -1; j < rows; j++) for (var i = -1; i < cols; i++) {
        var z = Math.random() < 0.35 ? 0.45 : 1; // back layer / front layer
        var rx = (i + (j % 2 ? 0.5 : 0)) * sp + (Math.random() - 0.5) * sp * 0.8;
        var ry = j * sp * 0.9 + (Math.random() - 0.5) * sp * 0.8;
        nodes.push({ rx: rx, ry: ry, x: rx, y: ry, vx: 0, vy: 0, z: z, ph: Math.random() * 6.28 });
      }
      var maxD = sp * 1.75, seen = {};
      nodes.forEach(function (a, ia) {
        var near = [];
        nodes.forEach(function (b, ib) {
          if (ia === ib || a.z !== b.z) return;
          var d = Math.hypot(a.rx - b.rx, a.ry - b.ry);
          if (d < maxD) near.push([d, ib]);
        });
        near.sort(function (p, q) { return p[0] - q[0]; });
        near.slice(0, a.z < 1 ? 2 : 3).forEach(function (n) {
          var key = Math.min(ia, n[1]) + "-" + Math.max(ia, n[1]);
          if (seen[key]) return; seen[key] = 1;
          edges.push({ a: ia, b: n[1], L0: n[0], crimp: (Math.random() - 0.5) * 0.5, ph: Math.random() * 6.28 });
        });
      });
      crawler.x = W * 0.7; crawler.y = H * 0.4;
    }
    function resize() {
      var rect = canvas.getBoundingClientRect();
      var nW = Math.max(1, rect.width), nH = Math.max(1, rect.height);
      var rebuild = Math.abs(nW - W) > 40 || Math.abs(nH - H) > 120 || !nodes.length;
      W = nW; H = nH;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rebuild) build();
      if (!running) draw();
    }
    function mix(a, b, k) { return Math.round(a + (b - a) * k); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      for (var e = 0; e < edges.length; e++) {
        var E = edges[e], A = nodes[E.a], B = nodes[E.b];
        var dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
        var strain = L / E.L0 - 1;
        var ten = clamp(strain * 5, 0, 1);                       // tension 0..1
        var bend = (E.crimp + 0.04 * Math.sin(t * 0.8 + E.ph)) * (1 - ten) + clamp(-strain * 2.2, 0, 0.6) * (E.crimp >= 0 ? 1 : -1);
        var mx = (A.x + B.x) / 2 - dy * bend, my = (A.y + B.y) / 2 + dx * bend;
        var z = A.z;
        var r = mix(25, 224, ten), g = mix(211, 69, ten), b = mix(230, 123, ten);
        var al = (0.18 + 0.5 * z) * (0.75 + 0.6 * ten);
        if (ten > 0.25) { // glow on strongly loaded fibres
          ctx.strokeStyle = "rgba(224,69,123," + (0.12 * ten).toFixed(3) + ")"; ctx.lineWidth = 6 * z;
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
        }
        ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + Math.min(al, 0.95).toFixed(3) + ")";
        ctx.lineWidth = (0.5 + 1.1 * z) * (1 + ten * 0.6);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
      }
      for (var n = 0; n < nodes.length; n++) { // crosslinks
        var N = nodes[n], disp = Math.min(Math.hypot(N.x - N.rx, N.y - N.ry) / 30, 1);
        ctx.fillStyle = disp > 0.3 ? "rgba(255,209,102," + (0.35 + 0.5 * disp).toFixed(2) + ")" : "rgba(200,245,255," + (0.18 + 0.35 * N.z).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(N.x, N.y, (0.8 + 1.2 * N.z) * (1 + disp * 0.6), 0, Math.PI * 2); ctx.fill();
      }
      if (!mouse.on && opts.crawler) {
        var sp = Math.hypot(crawler.x - crawler.px, crawler.y - crawler.py);
        drawCell(ctx, crawler.x, crawler.y, opts.cellR, crawler.phi, clamp(sp * 1.2, 0, 0.8), t, 0, 0.95);
      }
    }
    function step() {
      t += 0.016;
      // wandering cell when there is no pointer (touch screens / pointer elsewhere)
      crawler.px = crawler.x; crawler.py = crawler.y;
      crawler.x = W * (0.55 + 0.33 * Math.sin(t * 0.13)) + 40 * Math.sin(t * 0.7);
      crawler.y = H * (0.42 + 0.28 * Math.sin(t * 0.21 + 1)) + 30 * Math.cos(t * 0.5);
      var vx = crawler.x - crawler.px, vy = crawler.y - crawler.py;
      if (vx * vx + vy * vy > 0.01) crawler.phi = Math.atan2(vy, vx);
      var px = mouse.on ? mouse.x : (opts.crawler ? crawler.x : -1e4), py = mouse.on ? mouse.y : (opts.crawler ? crawler.y : -1e4);
      var R = opts.reach * (mouse.down ? 1.3 : 1), S = opts.pull * (mouse.down ? 2.4 : 1);
      for (var n = 0; n < nodes.length; n++) {
        var N = nodes[n];
        var tx = N.rx + Math.sin(t * 1.1 + N.ph) * 1.6, ty = N.ry + Math.cos(t * 0.9 + N.ph) * 1.6; // thermal motion
        var dx = px - N.x, dy = py - N.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < R && d > 6) { var f = Math.pow(1 - d / R, 2) * S * N.z; N.vx += (dx / d) * f; N.vy += (dy / d) * f; }
        N.vx += (tx - N.x) * 0.045; N.vy += (ty - N.y) * 0.045;
        N.vx *= 0.82; N.vy *= 0.82;
        N.x += N.vx; N.y += N.vy;
      }
      draw();
      raf = requestAnimationFrame(step);
    }
    function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(step); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    var host = opts.pointerTarget;
    if (host) {
      host.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
      });
      host.addEventListener("pointerleave", function () { mouse.on = false; mouse.down = false; });
      host.addEventListener("pointerdown", function () { mouse.down = true; });
      host.addEventListener("pointerup", function () { mouse.down = false; });
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener("resize", resize);
    resize();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    start();
  }
  var heroCanvas = $(".hero-canvas");
  if (heroCanvas) ECMNetwork(heroCanvas, { spacing: 62, reach: 210, pull: 1.6, cellR: 16, crawler: true, pointerTarget: $(".hero") });
  $$(".cta-canvas").forEach(function (c) { ECMNetwork(c, { spacing: 56, reach: 170, pull: 1.4, cellR: 13, crawler: true, pointerTarget: c.parentNode }); });

  /* ---------------- Matrix stiffness explorer ----------------
     Log-scale slider (10 Pa → 100 GPa). The gel mesh gets denser and the cell
     spreads further, forms stress fibres and more adhesions on stiffer matrices. */
  var stiff = $(".stiff-grid");
  if (stiff) {
    var range = $(".stiff-range", stiff), sc = $(".stiff-canvas", stiff), sctx = sc.getContext("2d");
    var numEl = $(".sr-num", stiff), tissueEl = $(".sr-tissue", stiff);
    var tBands = $$(".band-t", stiff), mBands = $$(".band-m", stiff);
    var LMIN = 1, LMAX = 11;
    var pos = function (pa) { return clamp((Math.log10(pa) - LMIN) / (LMAX - LMIN), 0, 1) * 100; };
    $$(".band", stiff).forEach(function (b) {
      var a = pos(parseFloat(b.getAttribute("data-min"))), z = pos(parseFloat(b.getAttribute("data-max")));
      b.style.left = a + "%"; b.style.width = Math.max(z - a, 1.2) + "%";
      b.classList.toggle("edge-r", a > 72); b.classList.toggle("edge-l", z < 12); // keep labels on screen
    });
    var fmt = function (pa) {
      var u = [["GPa", 1e9], ["MPa", 1e6], ["kPa", 1e3], ["Pa", 1]];
      for (var i = 0; i < u.length; i++) if (pa >= u[i][1]) {
        var v = pa / u[i][1];
        return (v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(0) : v.toFixed(1)) + " " + u[i][0];
      }
      return pa.toFixed(1) + " Pa";
    };
    var SW = 0, SH = 0, sdpr = Math.min(window.devicePixelRatio || 1, 2), sx = 4, st = 0, sRaf = 0, sVisible = false;
    var hash = function (i, j) { var h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
    var drawStiff = function () {
      sctx.clearRect(0, 0, SW, SH);
      var t = (sx - LMIN) / (LMAX - LMIN);                       // 0 soft → 1 stiff
      var spreadT = clamp((sx - 1.8) / 4.2, 0, 1);               // spreading saturates around ~1 MPa
      var spacing = 54 - 40 * Math.pow(t, 0.8);
      var cols = Math.ceil(SW / spacing) + 2, rows = Math.ceil(SH / spacing) + 2;
      var P = [];
      for (var j = -1; j < rows; j++) { P[j + 1] = []; for (var i = -1; i < cols; i++) {
        var jx = (hash(i, j) - 0.5) * spacing * 0.7, jy = (hash(j, i + 9) - 0.5) * spacing * 0.7;
        var wob = (1 - t) * 1.5;
        P[j + 1][i + 1] = [i * spacing + jx + Math.sin(st + i + j) * wob, j * spacing + jy + Math.cos(st * 0.8 + i) * wob];
      } }
      sctx.lineWidth = 0.6 + t * 0.9;
      sctx.strokeStyle = "rgba(25,211,230," + (0.22 + t * 0.28).toFixed(2) + ")";
      sctx.beginPath();
      for (var r = 0; r < P.length; r++) for (var c = 0; c < P[r].length; c++) {
        var p = P[r][c];
        if (c + 1 < P[r].length) { sctx.moveTo(p[0], p[1]); sctx.lineTo(P[r][c + 1][0], P[r][c + 1][1]); }
        if (r + 1 < P.length) { sctx.moveTo(p[0], p[1]); sctx.lineTo(P[r + 1][c][0], P[r + 1][c][1]); }
        if (r + 1 < P.length && c + 1 < P[r].length && hash(r, c) > 0.5) { sctx.moveTo(p[0], p[1]); sctx.lineTo(P[r + 1][c + 1][0], P[r + 1][c + 1][1]); }
      }
      sctx.stroke();
      sctx.fillStyle = "rgba(255,209,102," + (0.3 + t * 0.5).toFixed(2) + ")";
      for (var r2 = 0; r2 < P.length; r2++) for (var c2 = 0; c2 < P[r2].length; c2++) {
        sctx.beginPath(); sctx.arc(P[r2][c2][0], P[r2][c2][1], 1 + t, 0, Math.PI * 2); sctx.fill();
      }
      // the cell: small and round on soft gels, large and spread with stress fibres on stiff ones
      var cx = SW * 0.56, cy = SH * 0.44, R = Math.min(SW, SH) * (0.09 + 0.15 * spreadT);
      if (spreadT > 0.35) {
        sctx.save();
        sctx.beginPath(); sctx.ellipse(cx, cy, R * 0.95, R * 0.8, -0.3, 0, Math.PI * 2); sctx.clip();
        sctx.strokeStyle = "rgba(127,227,239," + ((spreadT - 0.35) * 0.9).toFixed(2) + ")"; sctx.lineWidth = 1.2;
        for (var k = -6; k <= 6; k++) {
          var off = k * R * 0.14;
          sctx.beginPath();
          sctx.moveTo(cx - R * 1.2 * Math.cos(-0.3) - off * Math.sin(-0.3), cy - R * 1.2 * Math.sin(-0.3) + off * Math.cos(-0.3));
          sctx.lineTo(cx + R * 1.2 * Math.cos(-0.3) - off * Math.sin(-0.3), cy + R * 1.2 * Math.sin(-0.3) + off * Math.cos(-0.3));
          sctx.stroke();
        }
        sctx.restore();
      }
      drawCell(sctx, cx, cy, R, -0.3, spreadT * 0.25, st, spreadT, 1);
    };
    var sResize = function () {
      var r = sc.getBoundingClientRect(); SW = Math.max(1, r.width); SH = Math.max(1, r.height);
      sc.width = Math.round(SW * sdpr); sc.height = Math.round(SH * sdpr); sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
      drawStiff();
    };
    var update = function () {
      sx = parseFloat(range.value);
      var pa = Math.pow(10, sx);
      numEl.textContent = fmt(pa);
      range.setAttribute("aria-valuetext", fmt(pa));
      // closest tissue: inside its range, otherwise nearest on the log scale
      var best = null, bestD = 1e9;
      tBands.forEach(function (b) {
        var lo = Math.log10(parseFloat(b.getAttribute("data-min"))), hi = Math.log10(parseFloat(b.getAttribute("data-max")));
        var d = sx < lo ? lo - sx : sx > hi ? sx - hi : 0;
        if (d < bestD) { bestD = d; best = b; }
      });
      tBands.forEach(function (b) { b.classList.toggle("active", b === best); });
      mBands.forEach(function (b) {
        var lo = Math.log10(parseFloat(b.getAttribute("data-min"))), hi = Math.log10(parseFloat(b.getAttribute("data-max")));
        b.classList.toggle("active", sx >= lo && sx <= hi);
      });
      if (best) tissueEl.textContent = best.getAttribute("data-name");
      if (reduce || !sVisible) drawStiff();
    };
    var startPa = parseFloat(stiff.getAttribute("data-start")) || 1e4;
    range.value = Math.log10(startPa).toFixed(2);
    range.addEventListener("input", update);
    if ("ResizeObserver" in window) new ResizeObserver(sResize).observe(sc); else window.addEventListener("resize", sResize);
    sResize(); update();
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        sVisible = es[0].isIntersecting;
        cancelAnimationFrame(sRaf);
        if (sVisible) (function loop() { st += 0.016; drawStiff(); sRaf = requestAnimationFrame(loop); })();
      }).observe(sc);
    }
  }

  /* ---------------- Research sticky scroll ---------------- */
  var steps = $$(".research-step"), visuals = $$(".research-frame .rv"), rcNow = $(".rc-now");
  if (steps.length && "IntersectionObserver" in window) {
    var setStep = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      visuals.forEach(function (v, k) { v.classList.toggle("active", k === i); });
      if (rcNow) rcNow.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
    };
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setStep(parseInt(e.target.getAttribute("data-index"), 10)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { sio.observe(s); });
  }

  /* ---------------- Section dots scrollspy (home) ---------------- */
  var dots = $$(".section-dots a");
  if (dots.length && "IntersectionObserver" in window) {
    body.classList.add("at-hero");
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute("data-section");
        dots.forEach(function (d) { d.classList.toggle("active", d.getAttribute("data-spy") === id); });
        body.classList.toggle("at-hero", id === "hero");
      });
    }, { rootMargin: "-48% 0px -48% 0px" });
    $$("[data-section]").forEach(function (s) { dio.observe(s); });
  }

  /* ---------------- Pointer effects: spotlight, tilt, magnetic ---------------- */
  if (finePointer && !reduce) {
    document.addEventListener("pointermove", function (e) {
      var s = e.target.closest && e.target.closest(".spotlight");
      if (!s) return;
      var r = s.getBoundingClientRect();
      s.style.setProperty("--mx", (e.clientX - r.left) + "px");
      s.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });

    $$(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (px * 9).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-py * 9).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });

    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx * 0.25).toFixed(1) + "px," + (dy * 0.35).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- Custom cursor: a cell remodelling the ECM ----------------
     The pointer is a migrating cell. Around it a faint fibre matrix becomes visible;
     fibres near the cell are pulled in (compaction) and aligned along its track or
     radially towards it (traction). Remodelled fibres turn magenta and slowly relax,
     leaving a trail. While scrolling the cell polarises up/down and the matrix flows. */
  var cursorCanvas = $(".cursor-canvas");
  var cursorScroll = null;
  if (cursorCanvas && finePointer && !reduce) {
    html.classList.add("has-cursor");
    var cctx = cursorCanvas.getContext("2d");
    var cLabel = $(".cursor-label");
    var cdpr = Math.min(window.devicePixelRatio || 1, 2);
    var VW = 0, VH = 0, tileH = 0;
    var fibres = [];
    var P = { x: -200, y: -200, seen: false, inside: false, down: false, zone: false, link: false, label: "" };
    var C = { x: -200, y: -200, vx: 0, vy: 0, phi: 0, pol: 0, r: 10, spread: 0, alpha: 0 };
    var scrollV = 0, scrollDir = 1, scrollT = 0, ct = 0;
    var colFibre = "10,143,160", colRemod = "210,58,111";

    var themeColours = function () {
      var dark = html.getAttribute("data-theme") === "dark";
      colFibre = dark ? "63,203,220" : "10,143,160";
      colRemod = dark ? "255,122,168" : "210,58,111";
    };
    themeColours();
    new MutationObserver(themeColours).observe(html, { attributes: true, attributeFilter: ["data-theme"] });

    var buildFibres = function () {
      fibres = [];
      var sp = 22;
      var k1 = Math.random() * 6, k2 = Math.random() * 6;
      for (var y = 0; y < tileH; y += sp) for (var x = 0; x < VW + sp; x += sp) {
        var fx = x + (Math.random() - 0.5) * sp, fy = y + (Math.random() - 0.5) * sp;
        // smooth orientation field + noise → looks like a fibrous matrix, not static
        var a0 = 1.2 * Math.sin(fx * 0.006 + k1) + 1.1 * Math.cos(fy * 0.007 + k2) + (Math.random() - 0.5) * 0.9;
        fibres.push({ x: fx, y: fy, a0: a0, a: a0, m: 0, len: 8 + Math.random() * 9, ph: Math.random() * 6.28 });
      }
    };
    var cresize = function () {
      VW = innerWidth; VH = innerHeight; tileH = VH + 60;
      cursorCanvas.width = Math.round(VW * cdpr); cursorCanvas.height = Math.round(VH * cdpr);
      cursorCanvas.style.width = VW + "px"; cursorCanvas.style.height = VH + "px";
      cctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
      buildFibres();
    };
    cresize();
    window.addEventListener("resize", cresize);

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      P.x = e.clientX; P.y = e.clientY; P.inside = true;
      if (!P.seen) { C.x = P.x; C.y = P.y; P.seen = true; }
    }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      var t = e.target;
      if (!t.closest) return;
      var lab = t.closest("[data-cursor]");
      P.link = !!t.closest("a, button, [role=button], label, select, summary, .chip");
      P.label = lab ? lab.getAttribute("data-cursor") : "";
      P.zone = !!t.closest(".hero, .cta");   // these have their own living network
      if (cLabel) { cLabel.textContent = P.label; cLabel.classList.toggle("show", !!P.label); }
    });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) P.inside = false; });
    document.addEventListener("pointerdown", function () { P.down = true; });
    document.addEventListener("pointerup", function () { P.down = false; });
    cursorScroll = function (dy) {
      scrollV = clamp(scrollV + dy * 0.15, -30, 30);
      scrollDir = dy > 0 ? 1 : -1; scrollT = 14;
    };

    var axialDiff = function (target, a) { // fibres have no head/tail: compare modulo π
      var d = (target - a) % Math.PI;
      if (d > Math.PI / 2) d -= Math.PI; else if (d < -Math.PI / 2) d += Math.PI;
      return d;
    };

    (function frame() {
      ct += 0.016;
      // follow the pointer: the leading edge sits on the pointer, the body trails
      var px = C.x, py = C.y;
      C.x += (P.x - C.x) * 0.22; C.y += (P.y - C.y) * 0.22;
      C.vx = C.vx * 0.7 + (C.x - px) * 0.3; C.vy = C.vy * 0.7 + (C.y - py) * 0.3;
      var speed = Math.hypot(C.vx, C.vy);
      var scrolling = scrollT > 0; if (scrollT > 0) scrollT--;
      scrollV *= 0.9;
      var targetPol = scrolling ? 0.85 : clamp(speed / 7, 0, 0.75);
      if (scrolling) C.phi = scrollDir > 0 ? Math.PI / 2 : -Math.PI / 2;
      else if (speed > 0.4) { var ta = Math.atan2(C.vy, C.vx); C.phi += Math.atan2(Math.sin(ta - C.phi), Math.cos(ta - C.phi)) * 0.25; }
      C.pol += (targetPol - C.pol) * 0.15;
      var targetR = P.label ? 20 : P.link ? 16 : 12;
      if (P.down) targetR *= 0.75;
      C.r += (targetR - C.r) * 0.18;
      C.spread += ((P.link || P.label ? 1 : 0) - C.spread) * 0.12;
      C.alpha += ((P.inside && P.seen ? 1 : 0) - C.alpha) * 0.15;

      cctx.clearRect(0, 0, VW, VH);
      var sy = window.scrollY;
      if (C.alpha > 0.02) {
        var RV = 120 + C.spread * 30, RA = 85 + C.spread * 25 + (P.down ? 30 : 0);
        var showLens = !P.zone;
        var aligning = scrolling || C.pol > 0.25;
        cctx.lineCap = "round";
        for (var i = 0; i < fibres.length; i++) {
          var F = fibres[i];
          var fy = ((F.y - sy) % tileH + tileH) % tileH - 30;
          var dx = F.x - C.x, dy = fy - C.y;
          var lens = 0, w = 0, d = 1e9;
          if (showLens && dx > -RV && dx < RV && dy > -RV && dy < RV) {
            d = Math.sqrt(dx * dx + dy * dy);
            if (d < RV) lens = Math.pow(1 - d / RV, 1.4);
            if (d < RA) w = 1 - d / RA;
          }
          if (w > 0) {
            // traction: align along the migration track, or radially towards a resting / pulling cell
            var target = aligning ? C.phi : Math.atan2(dy, dx);
            F.a += axialDiff(target, F.a) * 0.22 * w;
            if (w > F.m) F.m = w;
          } else {
            F.a += axialDiff(F.a0, F.a) * 0.012; // viscoelastic relaxation
            F.m *= 0.983;
          }
          var al = Math.max(lens * 0.55, F.m * 0.75) * C.alpha;
          if (al < 0.03) continue;
          // compaction: fibres are drawn in towards the cell
          var pull = w * w * (P.down ? 16 : 7);
          var cx = F.x - (d < 1e8 ? dx / (d || 1) * pull : 0), cy = fy - (d < 1e8 ? dy / (d || 1) * pull : 0);
          var L = F.len * (1 + F.m * 0.35) / 2;
          var ca = Math.cos(F.a), sa = Math.sin(F.a);
          var crimp = (1 - F.m) * 2.2 * Math.sin(ct * 1.5 + F.ph);
          cctx.strokeStyle = "rgba(" + (F.m > 0.3 ? colRemod : colFibre) + "," + al.toFixed(3) + ")";
          cctx.lineWidth = 1 + F.m * 0.9;
          cctx.beginPath();
          cctx.moveTo(cx - ca * L, cy - sa * L);
          cctx.quadraticCurveTo(cx - sa * crimp, cy + ca * crimp, cx + ca * L, cy + sa * L);
          cctx.stroke();
        }
        // the cell (body trails slightly; a tiny dot marks the exact pointer)
        drawCell(cctx, C.x, C.y, C.r, C.phi, C.pol, ct, C.spread, C.alpha);
        cctx.globalAlpha = C.alpha;
        cctx.fillStyle = "rgba(224,69,123,.95)";
        cctx.beginPath(); cctx.arc(P.x, P.y, 2.2, 0, Math.PI * 2); cctx.fill();
        cctx.globalAlpha = 1;
      }
      if (cLabel) cLabel.style.transform = "translate3d(" + (C.x + C.r + 12).toFixed(1) + "px," + (C.y + C.r * 0.6).toFixed(1) + "px,0)";
      requestAnimationFrame(frame);
    })();
  }

  /* ---------------- One scroll loop: progress, header, highlights ---------------- */
  var header = $(".site-header"), bar = $(".scroll-progress span"), toTop = $(".to-top"), ttRing = $(".tt-ring");
  var tlFill = $(".timeline-fill"), timeline = $(".timeline");
  var hasHero = body.classList.contains("has-hero");
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? y / max : 0;
    if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (ttRing) ttRing.style.strokeDashoffset = (132 - 132 * p).toFixed(1);
    if (toTop) toTop.classList.toggle("show", y > 600);
    if (header) {
      if (hasHero) header.classList.toggle("scrolled", y > 40);
      if (!body.classList.contains("nav-open")) {
        if (y > lastY + 4 && y > 320) { header.classList.add("hide"); body.classList.add("header-hidden"); }
        else if (y < lastY - 4 || y < 320) { header.classList.remove("hide"); body.classList.remove("header-hidden"); }
      }
    }
    if (aboutWords.length && !reduce) {
      var r = aboutText.getBoundingClientRect();
      var prog = clamp((innerHeight * 0.88 - r.top) / (r.height + innerHeight * 0.3), 0, 1);
      var lit = Math.round(prog * aboutWords.length);
      for (var i = 0; i < aboutWords.length; i++) aboutWords[i].classList.toggle("lit", i < lit);
    }
    if (tlFill && timeline) {
      var tr = timeline.getBoundingClientRect();
      tlFill.style.height = (clamp((innerHeight * 0.6 - tr.top) / tr.height, 0, 1) * 100).toFixed(2) + "%";
    }
    if (cursorScroll && Math.abs(y - lastY) > 1) cursorScroll(y - lastY);
    lastY = y; ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------------- Page transitions: hydrogel gelation → MMP degradation ----------------
     Leaving a page: fibres polymerise from nucleation points and crosslink until the
     screen is a gel. Arriving: the gel is cleaved fibre by fibre and dissolves away. */
  var curtain = $(".ecm-curtain");
  if (curtain) {
    if (reduce) { curtain.style.display = "none"; }
    else {
      var gctx = curtain.getContext("2d");
      var gW = innerWidth, gH = innerHeight, gdpr = Math.min(window.devicePixelRatio || 1, 2);
      var gNodes = [], gEdges = [], gRaf = 0;
      var sizeCurtain = function () {
        gW = innerWidth; gH = innerHeight;
        curtain.width = Math.round(gW * gdpr); curtain.height = Math.round(gH * gdpr);
        gctx.setTransform(gdpr, 0, 0, gdpr, 0, 0);
      };
      var buildGel = function () {
        gNodes = []; gEdges = [];
        var n = clamp(Math.round((gW * gH) / 6500), 60, 280);
        for (var i = 0; i < n; i++) gNodes.push({ x: Math.random() * gW, y: Math.random() * gH, t0: 1 });
        var seen = {};
        gNodes.forEach(function (a, ia) {
          var near = [];
          gNodes.forEach(function (b, ib) { if (ia !== ib) near.push([(a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y), ib]); });
          near.sort(function (p, q) { return p[0] - q[0]; });
          near.slice(0, 3).forEach(function (nb) {
            var key = Math.min(ia, nb[1]) + "-" + Math.max(ia, nb[1]);
            if (seen[key]) return; seen[key] = 1;
            gEdges.push({ a: ia, b: nb[1], grow: Math.random() * 0.55, cut: Math.random() * 0.55, bend: (Math.random() - 0.5) * 0.35, hue: Math.random() < 0.18 });
          });
        });
      };
      var ink = "11,16,32";
      var label = function (txt, a) {
        gctx.fillStyle = "rgba(127,227,239," + a.toFixed(2) + ")";
        gctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
        gctx.fillText(txt, 24, gH - 24);
      };
      var edgePath = function (A, B, from, to, bend) {
        var dx = B.x - A.x, dy = B.y - A.y;
        var mx = (A.x + B.x) / 2 - dy * bend, my = (A.y + B.y) / 2 + dx * bend;
        // sample the quadratic between parameters from..to
        gctx.beginPath();
        for (var s = 0; s <= 8; s++) {
          var u = from + (to - from) * (s / 8), v = 1 - u;
          var x = v * v * A.x + 2 * v * u * mx + u * u * B.x, y = v * v * A.y + 2 * v * u * my + u * u * B.y;
          if (s === 0) gctx.moveTo(x, y); else gctx.lineTo(x, y);
        }
        gctx.stroke();
      };
      // p: 0 → 1 gelation progress (mode "gel") or degradation progress (mode "degrade")
      var paint = function (mode, p) {
        gctx.clearRect(0, 0, gW, gH);
        var bg = mode === "gel" ? clamp((p - 0.1) / 0.75, 0, 1) : 1 - clamp((p - 0.25) / 0.7, 0, 1);
        bg = bg * bg * (3 - 2 * bg);
        gctx.fillStyle = "rgba(" + ink + "," + bg.toFixed(3) + ")";
        gctx.fillRect(0, 0, gW, gH);
        gctx.lineCap = "round";
        var linked = {};
        for (var i = 0; i < gEdges.length; i++) {
          var E = gEdges[i], A = gNodes[E.a], B = gNodes[E.b];
          var col = E.hue ? "224,69,123" : "25,211,230";
          if (mode === "gel") {
            var q = clamp((p - E.grow) / 0.35, 0, 1);
            if (q <= 0) continue;
            gctx.strokeStyle = "rgba(" + col + "," + (0.35 + 0.55 * q).toFixed(2) + ")"; gctx.lineWidth = 1.2;
            edgePath(A, B, 0, q, E.bend);
            if (q >= 1) { linked[E.a] = 1; linked[E.b] = 1; }
          } else {
            var c = clamp((p - E.cut) / 0.3, 0, 1); // 0 intact → 1 fully cleaved and retracted
            var al = (1 - c) * 0.9;
            if (al <= 0.02) continue;
            gctx.strokeStyle = "rgba(" + (c > 0 ? "224,69,123" : col) + "," + al.toFixed(2) + ")"; gctx.lineWidth = 1.2;
            if (c === 0) { edgePath(A, B, 0, 1, E.bend); linked[E.a] = 1; linked[E.b] = 1; }
            else { edgePath(A, B, 0, 0.5 * (1 - c), E.bend); edgePath(A, B, 1 - 0.5 * (1 - c), 1, E.bend); }
          }
        }
        for (var n = 0; n < gNodes.length; n++) if (linked[n]) { // crosslinks
          gctx.fillStyle = "rgba(255,209,102,.9)";
          gctx.beginPath(); gctx.arc(gNodes[n].x, gNodes[n].y, 2.2, 0, Math.PI * 2); gctx.fill();
        }
        var pct = Math.round(p * 100);
        if (mode === "gel") label("crosslinking · gelation " + pct + "%", clamp(p * 2, 0, 1));
        else label("MMP degradation · " + pct + "%", clamp(1 - p * 1.4, 0, 1));
      };
      var animate = function (mode, dur, done) {
        cancelAnimationFrame(gRaf);
        var t0 = performance.now();
        (function tick(now) {
          var p = clamp((now - t0) / dur, 0, 1);
          paint(mode, p);
          if (p < 1) gRaf = requestAnimationFrame(tick); else if (done) done();
        })(t0);
      };
      var degrade = function () {
        sizeCurtain(); buildGel();
        curtain.style.animation = "none"; curtain.style.background = "transparent"; curtain.style.visibility = "visible";
        animate("degrade", 950, function () { curtain.style.visibility = "hidden"; });
      };
      degrade();
      window.addEventListener("resize", function () { if (curtain.style.visibility !== "hidden") sizeCurtain(); });

      document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a[href]");
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.target === "_blank" || a.hasAttribute("download")) return;
        var url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
        if (url.pathname === location.pathname && url.search === location.search) return; // same page / in-page anchor
        e.preventDefault();
        sizeCurtain(); buildGel();
        curtain.style.visibility = "visible";
        animate("gel", 620, function () { location.href = url.href; });
      });
      window.addEventListener("pageshow", function (e) { if (e.persisted) degrade(); });
    }
  }

  /* ---------------- Publications: search, filter, copy citation ---------------- */
  var toastEl = $(".toast"), toastTimer = 0;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2000);
  }
  var search = $("#pub-search");
  if (search) {
    var chips = $$(".pub-toolbar .chip"), activeType = "all";
    var apply = function () {
      var q = search.value.trim().toLowerCase(), any = false;
      $$(".pub-year").forEach(function (year) {
        var shown = 0;
        $$(".pub", year).forEach(function (p) {
          var ok = (activeType === "all" || p.getAttribute("data-type") === activeType) && (!q || p.textContent.toLowerCase().indexOf(q) !== -1);
          p.hidden = !ok; if (ok) shown++;
        });
        year.hidden = shown === 0; if (shown) any = true;
      });
      $("#pub-empty").hidden = any;
    };
    search.addEventListener("input", apply);
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active"); activeType = c.getAttribute("data-filter"); apply();
      });
    });
  }
  $$(".cite-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-cite");
      var fallback = function () {
        var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); toast("Citation copied"); } catch (e) { toast("Copy failed"); }
        ta.remove();
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast("Citation copied"); }, fallback);
      else fallback();
    });
  });

  /* ---------------- Gallery: filter + lightbox ---------------- */
  var gChips = $$(".gallery-filters .chip");
  gChips.forEach(function (c) {
    c.addEventListener("click", function () {
      gChips.forEach(function (x) { x.classList.remove("active"); });
      c.classList.add("active");
      $$(".gallery-item").forEach(function (g) {
        g.hidden = !(c.getAttribute("data-filter") === "all" || g.getAttribute("data-cat") === c.getAttribute("data-filter"));
      });
    });
  });
  var lb = $("#lightbox");
  if (lb && lb.showModal) {
    var lbImg = $("img", lb), lbCap = $(".lightbox-caption", lb), lbIndex = 0;
    var visibleItems = function () { return $$(".gallery-item:not([hidden]) .gallery-open"); };
    var show = function (i) {
      var items = visibleItems(); if (!items.length) return;
      lbIndex = (i + items.length) % items.length;
      var b = items[lbIndex];
      lbImg.src = b.getAttribute("data-src"); lbImg.alt = b.getAttribute("data-caption"); lbCap.textContent = b.getAttribute("data-caption");
    };
    $$(".gallery-open").forEach(function (b) {
      b.addEventListener("click", function () { show(visibleItems().indexOf(b)); lb.showModal(); });
    });
    $(".lightbox-close", lb).addEventListener("click", function () { lb.close(); });
    $(".lb-prev", lb).addEventListener("click", function () { show(lbIndex - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb && outside(lb, e)) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(lbIndex - 1); if (e.key === "ArrowRight") show(lbIndex + 1); });
  }

  /* ---------------- People: bio pop-up ---------------- */
  var pm = $("#person-modal");
  if (pm && pm.showModal) {
    var openPerson = function (card) {
      var av = $(".avatar", card), links = $(".icon-links", card), tpl = $("template.person-bio", card);
      $(".pm-avatar", pm).innerHTML = av ? av.outerHTML : "";
      $("#pm-name").textContent = $("h4", card).textContent;
      $(".pm-title", pm).textContent = ($(".person-title", card) || {}).textContent || "";
      $(".pm-body", pm).innerHTML = tpl ? tpl.innerHTML : "";
      $(".pm-links", pm).innerHTML = links ? links.outerHTML : "";
      pm.showModal();
    };
    $$(".person.has-bio").forEach(function (card) {
      card.addEventListener("click", function (e) { if (!e.target.closest("a")) openPerson(card); });
      card.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target === card) { e.preventDefault(); openPerson(card); } });
    });
    $(".modal-close", pm).addEventListener("click", function () { pm.close(); });
    pm.addEventListener("click", function (e) { if (e.target === pm && outside(pm, e)) pm.close(); });
  }
})();
