(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ═══ 0. Thème clair / sombre ═══ */
  var inkRGB = '20,22,26', redC = 'rgba(224,65,43,.6)', blueC = 'rgba(35,70,255,.9)';
  var themeMeta = $('meta[name="theme-color"]');
  function isDark() { return doc.getAttribute('data-theme') === 'dark'; }
  function syncTheme() {
    var d = isDark();
    inkRGB = d ? '236,230,216' : '20,22,26';
    redC = d ? 'rgba(255,106,82,.7)' : 'rgba(224,65,43,.6)';
    blueC = d ? 'rgba(111,139,255,.95)' : 'rgba(35,70,255,.9)';
    if (themeMeta) themeMeta.setAttribute('content', d ? '#101318' : '#F2EEE4');
    var b = $('#theme-btn');
    if (b) b.setAttribute('aria-label', d ? 'Passer en mode clair' : 'Passer en mode sombre');
    document.dispatchEvent(new Event('themechange'));
  }
  syncTheme();
  var tb = $('#theme-btn');
  if (tb) tb.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    doc.classList.add('theme-anim');
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncTheme();
    setTimeout(function () { doc.classList.remove('theme-anim'); }, 450);
  });
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      var saved = null; try { saved = localStorage.getItem('theme'); } catch (er) {}
      if (!saved) { doc.setAttribute('data-theme', e.matches ? 'dark' : 'light'); syncTheme(); }
    });
  } catch (e) {}

  /* ═══ RNG reproductible ═══ */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ═══ 1. Nom qui se décode ═══ */
  var GLYPHS = '∑∫∂∇λμσπθΩ∞≈ξφ01';
  $$('[data-scramble]').forEach(function (el, k) {
    var final = el.textContent;
    if (reduce) return;
    var start = null, dur = 900 + final.length * 70, delay = 250 + k * 280;
    function frame(t) {
      if (!start) start = t;
      var p = Math.max(0, (t - start - delay) / dur);
      var shown = Math.floor(p * final.length);
      var html = '';
      for (var i = 0; i < final.length; i++) {
        html += i < shown ? final[i] : '<span class="glyph">' + GLYPHS[(Math.random() * GLYPHS.length) | 0] + '</span>';
      }
      el.innerHTML = html;
      if (shown < final.length) requestAnimationFrame(frame); else el.textContent = final;
    }
    requestAnimationFrame(frame);
  });

  /* ═══ 2. Annotations de la photo ═══ */
  $$('.mark').forEach(function (m, i) {
    setTimeout(function () { m.classList.add('in'); }, reduce ? 0 : 1400 + i * 350);
  });

  /* ═══ 3. Simulation Monte-Carlo (hero) ═══ */
  (function monteCarlo() {
    var cv = $('#mc');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var hero = cv.parentElement;
    var W, H, dpr, paths, x, mu = 0, running = true, fade = 0;
    var N = 42, DX = 2.4;
    var r = Math.random;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      reset();
    }
    function reset() {
      ctx.clearRect(0, 0, W, H);
      x = 0; fade = 0;
      paths = [];
      for (var i = 0; i < N; i++) paths.push(H * 0.58);
    }
    function step() {
      var sig = H * 0.012;
      var nx = x + DX, sum = 0;
      ctx.lineCap = 'round';
      for (var i = 0; i < N; i++) {
        var y0 = paths[i];
        var y1 = y0 - mu * DX * 0.9 + sig * gauss(r) * Math.sqrt(DX);
        y1 = Math.max(H * 0.04, Math.min(H * 0.98, y1));
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(nx, y1);
        if (i === 0) { ctx.strokeStyle = redC; ctx.lineWidth = 1.5; }
        else { ctx.strokeStyle = 'rgba(' + inkRGB + ',' + (W < 700 ? .07 : .11) + ')'; ctx.lineWidth = 1; }
        ctx.stroke();
        paths[i] = y1; sum += y1;
      }
      var mean = sum / N;
      if (step.prevMean != null) {
        ctx.beginPath(); ctx.moveTo(x, step.prevMean); ctx.lineTo(nx, mean);
        ctx.strokeStyle = blueC; ctx.lineWidth = 3; ctx.stroke();
      }
      step.prevMean = mean;
      x = nx;
    }
    function loop() {
      if (!running) return;
      if (x < W) { step(); step(); }
      else {
        fade++;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,.08)';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        if (fade > 50) { reset(); step.prevMean = null; }
      }
      requestAnimationFrame(loop);
    }
    window.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      if (e.clientY < rect.bottom) mu = ((rect.height / 2) - (e.clientY - rect.top)) / rect.height * 0.9;
    }, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 200); });
    size();
    document.addEventListener('themechange', function () {
      reset(); step.prevMean = null;
      if (reduce) while (x < W) step();
    });
    if (reduce) { while (x < W) step(); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; loop(); }
        running = vis;
      }).observe(hero);
    }
    loop();
  })();

  /* ═══ 4. Figures générées ═══ */
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function path(svg, d, cls, delay) {
    return el('path', { d: d, 'class': 'v-line draw ' + (cls || ''), pathLength: 1, style: '--dl:' + (delay || 0) + 's' }, svg);
  }
  function dot(svg, x, y, rad, cls, delay) {
    return el('circle', { cx: x, cy: y, r: rad, 'class': 'pop ' + (cls || 'v-fill-ink'), style: '--dl:' + (delay || 0) + 's' }, svg);
  }
  function rect(svg, x, y, w, h, cls, delay) {
    return el('rect', { x: x, y: y, width: w, height: h, 'class': 'pop ' + cls, style: '--dl:' + (delay || 0) + 's' }, svg);
  }
  function txt(svg, x, y, s, anchor) {
    var t = el('text', { x: x, y: y, 'class': 'v-txt', 'text-anchor': anchor || 'start' }, svg); t.textContent = s; return t;
  }
  function axes(svg, xl, yl) {
    el('path', { d: 'M28 18 V176 H306', 'class': 'v-axis' }, svg);
    el('path', { d: 'M24 24 L28 16 L32 24 M298 172 L306 176 L298 180', 'class': 'v-axis' }, svg);
    if (xl) txt(svg, 304, 192, xl, 'end');
    if (yl) txt(svg, 34, 16, yl);
  }
  function line(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); }

  var VIZ = {
    bars: function (s, r) {
      axes(s, 'services', 'plaintes');
      var h = [60, 96, 44, 128, 78, 52, 88];
      h.forEach(function (v, i) { rect(s, 42 + i * 37, 176 - v, 24, v, i === 3 ? 'v-fill-red' : 'v-fill-ink', i * .08); });
      path(s, line(h.map(function (v, i) { return [54 + i * 37, 166 - v * .55]; })), 'v-blue', .6);
    },
    tree: function (s) {
      var lv = [[[40, 100]]], d = '';
      for (var L = 1; L < 4; L++) {
        lv[L] = [];
        lv[L - 1].forEach(function (p, i) {
          var n = L === 1 ? 4 : 2, sp = [0, 40, 18, 8][L];
          for (var k = 0; k < n; k++) {
            var q = [40 + L * 84, p[1] + (k - (n - 1) / 2) * sp];
            lv[L].push(q);
            path(s, 'M' + p[0] + ' ' + p[1] + ' C' + (p[0] + 40) + ' ' + p[1] + ' ' + (q[0] - 40) + ' ' + q[1] + ' ' + q[0] + ' ' + q[1], 'v-thin', L * .25);
          }
        });
      }
      lv.forEach(function (row, L) { row.forEach(function (p) { dot(s, p[0], p[1], L === 0 ? 7 : 4, L === 0 ? 'v-fill-blue' : 'v-fill-ink', L * .3 + .2); }); });
      var hp = [lv[0][0], lv[1][1], lv[2][3], lv[3][6]];
      path(s, line(hp), 'v-red', 1.3);
      txt(s, 20, 192, 'choix → destin');
    },
    network: function (s, r, flag) {
      var P = [];
      for (var i = 0; i < 18; i++) P.push([30 + r() * 260, 24 + r() * 150]);
      P[0] = [160, 100];
      var del = 0;
      P.forEach(function (p, i) {
        var near = P.map(function (q, j) { return [j, Math.hypot(p[0] - q[0], p[1] - q[1])]; }).sort(function (a, b) { return a[1] - b[1]; });
        [1, 2].forEach(function (k) {
          var q = P[near[k][0]];
          path(s, 'M' + p[0] + ' ' + p[1] + ' L' + q[0] + ' ' + q[1], 'v-thin' + (flag && (i === 0 || near[k][0] === 0) ? ' v-red' : ''), del += .03);
        });
        if (i > 0 && i % 4 === 0) path(s, 'M' + p[0] + ' ' + p[1] + ' L160 100', 'v-thin v-dash' + (flag ? ' v-red' : ' v-blue'), del += .03);
      });
      P.forEach(function (p, i) { dot(s, p[0], p[1], i === 0 ? 9 : 4 + r() * 3, i === 0 ? (flag ? 'v-fill-red' : 'v-fill-blue') : 'v-fill-ink', .4 + i * .04); });
      if (flag) { el('circle', { cx: 160, cy: 100, r: 18, 'class': 'v-line v-red v-dash draw', pathLength: 1, style: '--dl:1.2s' }, s); txt(s, 182, 82, 'suspect'); }
    },
    graph: function (s, r) { VIZ.network(s, r, true); },
    route: function (s, r) {
      var pts = [[40, 150], [80, 120], [120, 140], [160, 90], [205, 105], [245, 60], [285, 44]];
      path(s, line(pts), 'v-blue v-dash', .1);
      path(s, line(pts), '', .2);
      pts.forEach(function (p, i) { dot(s, p[0], p[1], i === 0 || i === pts.length - 1 ? 8 : 4, i === 0 ? 'v-fill-ink' : i === pts.length - 1 ? 'v-fill-red' : 'v-fill-blue', .3 + i * .12); });
      txt(s, 40, 172, 'producteur', 'middle'); txt(s, 285, 32, 'marché', 'middle'); txt(s, 160, 78, 'transport', 'middle');
    },
    dash: function (s, r) {
      axes(s, 'mois', 'perf.');
      for (var i = 0; i < 10; i++) { var v = 30 + r() * 70 + i * 6; rect(s, 38 + i * 26, 176 - v, 16, v, 'v-fill-soft', i * .05); }
      var pts = []; for (var j = 0; j < 10; j++) pts.push([46 + j * 26, 150 - j * 10 - r() * 20]);
      path(s, line(pts), 'v-blue', .4);
      pts.forEach(function (p, j) { dot(s, p[0], p[1], 3, 'v-fill-blue', .8 + j * .05); });
      rect(s, 210, 26, 86, 30, 'v-fill-ink', 1.2); var t = txt(s, 253, 45, 'KPI +38 %', 'middle'); t.setAttribute('style', 'fill:var(--paper)');
    },
    hist: function (s, r) {
      axes(s, 'heure', 'lectures');
      for (var i = 0; i < 16; i++) {
        var x = (i - 8) / 3, v = 135 * Math.exp(-x * x / 2) + 6 + r() * 10;
        rect(s, 34 + i * 16.5, 176 - v, 13, v, i === 9 ? 'v-fill-red' : 'v-fill-ink', i * .04);
      }
      var pts = []; for (var k = 0; k <= 60; k++) { var xx = (k / 60 * 16 - 8) / 3; pts.push([34 + k / 60 * 264, 176 - 140 * Math.exp(-xx * xx / 2) - 6]); }
      path(s, line(pts), 'v-blue', .7);
    },
    orbit: function (s, r) {
      el('circle', { cx: 250, cy: 50, r: 22, 'class': 'v-line v-blue draw', pathLength: 1, style: '--dl:.2s' }, s);
      dot(s, 250, 50, 10, 'v-fill-blue', .6);
      path(s, 'M20 120 Q160 -20 300 120', 'v-dash v-red v-thin', .3);
      dot(s, 90, 62, 7, 'v-fill-red', 1.1);
      var t = [], y = 160; for (var x = 0; x <= 320; x += 10) { y += (r() - .5) * 18; y = Math.max(140, Math.min(185, y)); t.push([x, y]); }
      path(s, line(t) + ' L320 200 L0 200 Z', '', .5);
      txt(s, 250, 88, 'Terre', 'middle'); txt(s, 90, 50, 'Soleil', 'middle'); txt(s, 12, 134, 'horizon lunaire');
    },
    boundary: function (s, r) {
      axes(s, 'texture', 'taille');
      for (var i = 0; i < 40; i++) {
        var a = i % 2, cx = a ? 220 : 100, cy = a ? 70 : 130;
        dot(s, cx + gauss(r) * 34, cy + gauss(r) * 24, 3.4, a ? 'v-fill-red' : 'v-fill-ink', i * .02);
      }
      path(s, 'M60 40 C140 60 170 120 290 170', 'v-blue', .9);
      txt(s, 250, 30, 'maligne'); txt(s, 40, 170, 'bénigne');
    },
    stages: function (s) {
      axes(s, 'stade DFG', 'patients');
      var v = [40, 70, 105, 82, 48];
      v.forEach(function (h, i) {
        rect(s, 48 + i * 52, 176 - h, 34, h, i >= 3 ? 'v-fill-red' : i === 2 ? 'v-fill-blue' : 'v-fill-ink', i * .1);
        txt(s, 65 + i * 52, 190, 'G' + (i + 1), 'middle');
      });
      path(s, 'M28 80 H306', 'v-red v-dash v-thin', .8); txt(s, 300, 74, 'seuil d’urgence', 'end');
    },
    outliers: function (s, r) {
      axes(s, 'montant', 'fréquence');
      for (var i = 0; i < 70; i++) dot(s, 60 + Math.abs(gauss(r)) * 50, 150 - Math.abs(gauss(r)) * 40, 2.4, 'v-fill-ink', i * .01);
      [[250, 40], [270, 70], [232, 58], [285, 32]].forEach(function (p, i) {
        dot(s, p[0], p[1], 4, 'v-fill-red', .8 + i * .1);
        el('circle', { cx: p[0], cy: p[1], r: 11, 'class': 'v-line v-red v-thin draw', pathLength: 1, style: '--dl:' + (1 + i * .1) + 's' }, s);
      });
      txt(s, 228, 100, 'alerte fraude');
    },
    roc: function (s) {
      axes(s, 'FPR', 'TPR');
      path(s, 'M28 176 L306 18', 'v-dash v-thin', .1);
      var pts = []; for (var k = 0; k <= 40; k++) { var f = k / 40; pts.push([28 + f * 278, 176 - Math.pow(f, .38) * 158]); }
      el('path', { d: line(pts) + ' L306 176 Z', 'class': 'pop v-fill-soft', style: '--dl:.9s;transform-origin:0 100%' }, s);
      path(s, line(pts), 'v-blue', .3);
      rect(s, 196, 120, 98, 30, 'v-fill-ink', 1.2); var t = txt(s, 245, 139, 'AUC > 0,70', 'middle'); t.setAttribute('style', 'fill:var(--paper)');
    },
    drop: function (s) {
      path(s, 'M160 24 C160 24 112 84 112 118 A48 48 0 0 0 208 118 C208 84 160 24 160 24 Z', 'v-blue', .1);
      for (var i = 0; i < 4; i++) {
        var y = 150 + i * 10, pts = [];
        for (var x = 20; x <= 300; x += 6) pts.push([x, y + Math.sin(x / 18 + i) * 3]);
        path(s, line(pts), 'v-thin' + (i === 0 ? ' v-blue' : ''), .4 + i * .15);
      }
      dot(s, 160, 110, 6, 'v-fill-red', 1.2); txt(s, 172, 106, 'prévision');
    },
    hydro: function (s, r) {
      axes(s, 'temps', 'débit');
      var pts = []; for (var k = 0; k <= 60; k++) { var t = k / 60; pts.push([28 + t * 278, 168 - 120 * Math.exp(-Math.pow((t - .55) / .12, 2)) - 18 * Math.sin(t * 9) * .3 - r() * 6]); }
      el('path', { d: line(pts) + ' L306 176 L28 176 Z', 'class': 'pop v-fill-soft', style: '--dl:.9s' }, s);
      path(s, line(pts), 'v-blue', .2);
      path(s, 'M28 82 H306', 'v-red v-dash v-thin', .6); txt(s, 300, 76, 'seuil de crue', 'end');
      dot(s, 28 + .55 * 278, 50, 5, 'v-fill-red', 1.3);
    },
    wave: function (s) {
      for (var i = 0; i < 7; i++) {
        var pts = [], y0 = 40 + i * 20;
        for (var x = 10; x <= 310; x += 5) pts.push([x, y0 - 18 * Math.exp(-Math.pow((x - 120 - i * 18) / 50, 2)) + Math.sin(x / 22 + i) * 2]);
        path(s, line(pts), 'v-thin' + (i === 3 ? ' v-blue' : ''), i * .12);
      }
      txt(s, 12, 192, 'h(x, y, t) · schéma de Lax-Friedrichs');
    },
    timetable: function (s, r) {
      var days = ['L', 'M', 'M', 'J', 'V'];
      for (var d = 0; d < 5; d++) {
        txt(s, 54 + d * 56, 20, days[d], 'middle');
        for (var h = 0; h < 6; h++) {
          var on = r() > .35;
          el('rect', { x: 30 + d * 56, y: 28 + h * 26, width: 50, height: 22, 'class': 'v-axis', style: 'stroke:var(--grid-2)' }, s);
          if (on) rect(s, 30 + d * 56, 28 + h * 26, 50, 22, r() > .75 ? 'v-fill-blue' : r() > .85 ? 'v-fill-red' : 'v-fill-ink', (d * 6 + h) * .03);
        }
      }
    },
    garch: function (s, r) {
      axes(s, 't', 'r(t)');
      var pts = [], env = [], sig = 4;
      for (var k = 0; k <= 90; k++) {
        var shock = (k > 30 && k < 45) || k > 72 ? 3 : 1;
        sig = Math.sqrt(1 + .15 * sig * sig * .2 + .75 * sig * sig * .1) * shock * 3;
        var v = gauss(r) * sig;
        pts.push([30 + k * 3.05, 97 + v]); env.push([30 + k * 3.05, 97 - 2 * sig]);
      }
      path(s, line(pts), 'v-thin', .1);
      path(s, line(env), 'v-blue', .6);
      path(s, line(env.map(function (p) { return [p[0], 194 - p[1]]; })), 'v-blue', .6);
      txt(s, 300, 30, '± 2σ(t)', 'end');
    },
    binom: function (s) {
      var nodes = [];
      for (var t = 0; t < 4; t++) for (var k = 0; k <= t; k++) nodes.push([50 + t * 80, 100 + (t - 2 * k) * 26, t, k]);
      nodes.forEach(function (n) {
        if (n[2] < 3) [0, 1].forEach(function (u) { path(s, 'M' + n[0] + ' ' + n[1] + ' L' + (n[0] + 80) + ' ' + (n[1] + (u ? -26 : 26)), 'v-thin' + (n[3] === 0 && u ? ' v-blue' : ''), n[2] * .3); });
      });
      nodes.forEach(function (n) { dot(s, n[0], n[1], 6, n[2] === 3 ? 'v-fill-red' : 'v-fill-ink', .2 + n[2] * .3); });
      txt(s, 50, 186, 't = 0', 'middle'); txt(s, 290, 186, 't = 2 · ω₁…ω₅', 'end');
    }
  };

  $$('.fig').forEach(function (f, i) {
    var num = $('.fig-meta b', f);
    if (num) num.textContent = 'Fig. ' + (i + 2);
    var type = f.dataset.viz, box = $('.plot', f);
    if (!VIZ[type] || !box) return;
    var svg = el('svg', { viewBox: '0 0 320 200', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
    VIZ[type](svg, rng(i * 97 + 13));
    box.appendChild(svg);
  });

  /* ═══ 5. Reveal ═══ */
  var rvs = $$('.rv');
  ['.fig-grid', '.cert-grid', '.tl', '.sets'].forEach(function (sel) {
    var g = $(sel); if (!g) return;
    $$('.rv', g).forEach(function (e, i) { e.style.setProperty('--d', (i % 3) * 90 + 'ms'); });
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rvs.forEach(function (e) { io.observe(e); });
  } else rvs.forEach(function (e) { e.classList.add('in'); });

  /* ═══ 6. Masthead : axe de progression + section active ═══ */
  var mast = $('#mast'), fill = $('#axis-fill'), val = $('#axis-val');
  var links = $$('.mast-nav a');
  var secs = links.map(function (a) { return $(a.getAttribute('href')); });
  var tick = false;
  function onScroll() {
    var y = window.scrollY, h = doc.scrollHeight - innerHeight, p = h > 0 ? y / h : 0;
    fill.style.transform = 'scaleX(' + p + ')';
    val.textContent = 't = ' + p.toFixed(2);
    var mark = y + innerHeight * .35, cur = -1;
    secs.forEach(function (s, i) { if (s && s.offsetTop <= mark) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    tick = false;
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ═══ 6b. Fond : grille qui défile, formules en parallaxe, lueur au curseur ═══ */
  var F = [
    'dS<sub>t</sub> = μS<sub>t</sub>dt + σS<sub>t</sub>dW<sub>t</sub>', 'E[X] = ∫ x f(x) dx',
    'σ²<sub>t</sub> = ω + αε²<sub>t−1</sub> + βσ²<sub>t−1</sub>', 'θ* = argmin<sub>θ</sub> L(θ)',
    '∂<sub>t</sub>h + ∇·(hu) = 0', 'P(A|B) = P(B|A)P(A) / P(B)', 'AUC = ∫ TPR d(FPR)',
    '∇<sub>θ</sub>J = E[∇ log π<sub>θ</sub> · R]', 'Var(X) = E[X²] − E[X]²',
    'softmax(z)<sub>i</sub> = e<sup>z<sub>i</sub></sup> / Σ e<sup>z<sub>j</sub></sup>',
    'x<sub>k+1</sub> = x<sub>k</sub> − η∇f(x<sub>k</sub>)', 'C = S N(d<sub>1</sub>) − K e<sup>−rT</sup> N(d<sub>2</sub>)',
    'H(p) = −Σ p log p', 'u<sup>n+1</sup> = ½(u<sub>j+1</sub> + u<sub>j−1</sub>) − λ(F<sub>j+1</sub> − F<sub>j−1</sub>)',
    'lim<sub>n→∞</sub> P(|X̄<sub>n</sub> − μ| > ε) = 0', 'f(x) ≈ Σ w<sub>i</sub> φ(x − c<sub>i</sub>)',
    'ŷ = σ(Wx + b)', 'Attention(Q,K,V) = softmax(QKᵀ/√d)V', 'ρ(X,Y) = Cov(X,Y) / σ<sub>X</sub>σ<sub>Y</sub>',
    'P(X = k) = C(n,k) p<sup>k</sup>(1−p)<sup>n−k</sup>', 'min Σ c<sub>ij</sub>x<sub>ij</sub>  s.c. Ax ≤ b',
    'V<sub>0</sub> = E<sup>Q</sup>[e<sup>−rT</sup>(S<sub>T</sub> − K)<sup>+</sup>]', '∮ F·dr = ∬ (∇×F)·n dS',
    'L = −Σ y log ŷ', 'χ² = Σ (O − E)² / E', 'λ<sub>max</sub> = max ‖Av‖ / ‖v‖'
  ];
  var notesBox = $('#notes');
  function buildNotes() {
    notesBox.innerHTML = '';
    var h = document.body.scrollHeight, rr = rng(7), i = 0;
    for (var y = 120; y < h - 80; y += innerWidth < 700 ? 420 : 240) {
      var s = document.createElement('span');
      s.innerHTML = F[i % F.length];
      var side = rr();
      s.style.top = y + rr() * 80 + 'px';
      s.style.left = (side < .5 ? 1 + rr() * 22 : 58 + rr() * 30) + '%';
      s.style.setProperty('--r', ((rr() - .5) * 9).toFixed(1) + 'deg');
      if (rr() > .8) s.className = 'hi';
      notesBox.appendChild(s); i++;
    }
    notes = $$('span', notesBox);
  }
  var bgGrid = $('#bg-grid'), bgGlow = $('#bg-glow'), notes = [];
  buildNotes();
  addEventListener('load', buildNotes);
  var nt; addEventListener('resize', function () { clearTimeout(nt); nt = setTimeout(buildNotes, 300); });
  var bgTick = false;
  function onBg() {
    var y = scrollY;
    var gy = (-y % 120) + 'px';
    bgGrid.style.setProperty('--gy', gy);
    bgGlow.style.setProperty('--gy', gy);
    if (!reduce) notes.forEach(function (n, i) { n.style.setProperty('--py', (y * (i % 2 ? .12 : -.08)).toFixed(1) + 'px'); });
    bgTick = false;
  }
  addEventListener('scroll', function () { if (!bgTick) { bgTick = true; requestAnimationFrame(onBg); } }, { passive: true });
  onBg();
  if (matchMedia('(hover: hover)').matches) {
    addEventListener('mousemove', function (e) {
      bgGlow.style.setProperty('--mx', e.clientX + 'px');
      bgGlow.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  /* ═══ 7. Menu mobile ═══ */
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    mast.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  addEventListener('resize', function () { if (innerWidth > 960) setMenu(false); });

  /* ═══ 8. Réticule ═══ */
  var cross = $('#cross');
  if (cross && matchMedia('(hover: hover)').matches && !reduce) {
    var ch = $('.cross-h', cross), cvv = $('.cross-v', cross), rd = $('#cross-read');
    addEventListener('mousemove', function (e) {
      cross.classList.add('on');
      ch.style.transform = 'translateY(' + e.clientY + 'px)';
      cvv.style.transform = 'translateX(' + e.clientX + 'px)';
      rd.style.transform = 'translate(' + (e.clientX + 12) + 'px,' + (e.clientY + 12) + 'px)';
      rd.textContent = 'x=' + (e.clientX / innerWidth).toFixed(3) + '  y=' + ((scrollY + e.clientY) / doc.scrollHeight).toFixed(3);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cross.classList.remove('on'); });
  }

  /* ═══ 9. Compteurs ═══ */
  var counters = $$('[data-count]');
  if (!reduce) counters.forEach(function (c, i) {
    var end = +c.dataset.count, t0 = null;
    c.textContent = '0';
    setTimeout(function () {
      requestAnimationFrame(function stp(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1300, 1);
        c.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(stp);
      });
    }, 900 + i * 120);
  });

  /* ═══ 10. Filtres ═══ */
  $$('.filters').forEach(function (g) {
    var grid = $(g.dataset.target); if (!grid) return;
    var all = $('.filter[data-filter="all"] i', g);
    if (all) all.textContent = grid.children.length;
    g.addEventListener('click', function (e) {
      var b = e.target.closest('.filter'); if (!b) return;
      var f = b.dataset.filter;
      $$('.filter', g).forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
      [].forEach.call(grid.children, function (it) {
        var show = f === 'all' || (it.dataset.cat || '').split(' ').indexOf(f) !== -1;
        it.classList.toggle('is-hidden', !show);
        if (show) it.classList.add('in');
      });
    });
  });

  /* ═══ 11. Lightbox ═══ */
  var lb = $('#lightbox'), lbImg = $('#lb-img'), lbT = $('#lb-title'), lbI = $('#lb-issuer'), lbD = $('#lb-date'), lbP = $('#lb-pdf');
  var certs = $$('.cert'), idx = 0, last = null;
  function vis() { return certs.filter(function (c) { return !c.classList.contains('is-hidden'); }); }
  function show(c) {
    lbImg.src = c.dataset.src; lbImg.alt = $('img', c).alt;
    lbT.textContent = c.dataset.title; lbI.textContent = c.dataset.issuer; lbD.textContent = c.dataset.date;
    if (c.dataset.pdf) { lbP.href = c.dataset.pdf; lbP.hidden = false; } else lbP.hidden = true;
  }
  function open(c) { idx = vis().indexOf(c); last = c; show(c); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lb-close').focus(); }
  function close() { lb.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); }
  function go(d) { var l = vis(); if (!l.length) return; idx = (idx + d + l.length) % l.length; show(l[idx]); }
  certs.forEach(function (c) { c.addEventListener('click', function () { open(c); }); });
  $('#lb-close').addEventListener('click', close);
  $('#lb-prev').addEventListener('click', function () { go(-1); });
  $('#lb-next').addEventListener('click', function () { go(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); return; }
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
  });

  /* ═══ 12. Formulaire (mailto) ═══ */
  var form = $('#contact-form'), note = $('#form-note');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, F = form.elements;
    ['name', 'email', 'message'].forEach(function (n) {
      var f = F.namedItem(n), bad = !f.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('is-invalid', bad); if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Merci de remplir les trois champs avec un email valide.'; return; }
    var name = F.namedItem('name').value.trim();
    var body = F.namedItem('message').value.trim() + '\n\n' + name + ' (' + F.namedItem('email').value.trim() + ')';
    location.href = 'mailto:ursusghd@gmail.com?subject=' + encodeURIComponent('Contact portfolio, ' + name) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Votre messagerie s’ouvre avec le message prérempli.';
  });

  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  // filet de sécurité
  setTimeout(function () { rvs.forEach(function (e) { e.classList.add('in'); }); }, 5000);
})();
