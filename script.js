/* ═══════════════════════════════════════════════
   URSUS GBAGUIDI — Portfolio interactions
   ═══════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = window.matchMedia('(pointer: fine)').matches;

  /* ─── Preloader ─── */
  (() => {
    const pre = $('#preloader'), fill = $('#preloader-fill'), pct = $('#preloader-pct');
    if (!pre) return;
    let v = 0;
    const tick = setInterval(() => {
      v = Math.min(100, v + Math.random() * 16 + 5);
      fill.style.width = v + '%';
      pct.textContent = Math.round(v);
      if (v >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          pre.classList.add('done');
          document.body.classList.add('loaded');
          const cur = $('#curtain');
          if (cur) {
            cur.querySelectorAll('span').forEach((el, i) => {
              el.style.transitionDelay = (i * 70) + 'ms';
            });
            requestAnimationFrame(() => cur.classList.add('lift'));
            setTimeout(() => cur.classList.add('gone'), 1600);
          }
        }, 280);
      }
    }, reduced ? 20 : 140);
  })();

  /* ─── Custom cursor + magnetic ─── */
  if (fine && !reduced) {
    const dot = $('#cursor-dot'), ring = $('#cursor-ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      document.body.classList.add('cursor-on');
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    const hoverSel = 'a,button,[data-magnetic],.cert-card,.proj-card,.award-card,.skill-card';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverSel)) ring.classList.add('grow');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverSel)) ring.classList.remove('grow');
    });

    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ─── Neural network canvas ─── */
  if (!reduced) {
    const cv = $('#neural-canvas');
    const ctx = cv.getContext('2d');
    let w, h, nodes = [], dpr = Math.min(devicePixelRatio || 1, 2);
    const pointer = { x: -9999, y: -9999 };

    function resize() {
      w = cv.width = innerWidth * dpr;
      h = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px';
      cv.style.height = innerHeight + 'px';
      const count = Math.min(90, Math.floor(innerWidth * innerHeight / 17000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28 * dpr,
        vy: (Math.random() - 0.5) * 0.28 * dpr,
        r: (Math.random() * 1.4 + 0.6) * dpr
      }));
    }

    addEventListener('resize', resize);
    addEventListener('mousemove', e => {
      pointer.x = e.clientX * dpr;
      pointer.y = e.clientY * dpr;
    }, { passive: true });
    resize();

    const LINK = 140 * dpr;
    (function draw() {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(127,168,255,.6)';
        ctx.fill();
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(127,168,255,${(1 - d / LINK) * 0.18})`;
            ctx.lineWidth = dpr * 0.6;
            ctx.stroke();
          }
        }
        const a = nodes[i];
        const dp = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (dp < LINK * 1.5) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y);
          ctx.strokeStyle = `rgba(127,168,255,${(1 - dp / (LINK * 1.5)) * 0.32})`;
          ctx.lineWidth = dpr * 0.7;
          ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    })();
  }

  /* ─── Typewriter ─── */
  (() => {
    const el = $('#typed');
    if (!el) return;
    const roles = [
      'Data Scientist & ML Engineer',
      'Champion Hackathon MTN Yello\'Care',
      'Champion national CIF — LBC/FT/FP',
      'Champion UNESCO Water4Future',
      'Co-fondateur de SNOW',
      'Ingénieur en Génie Mathématique'
    ];
    if (reduced) { el.textContent = roles[0]; return; }

    let ri = 0, ci = 0, del = false;
    (function type() {
      const word = roles[ri];
      el.textContent = del ? word.slice(0, --ci) : word.slice(0, ++ci);
      let wait = del ? 38 : 72;
      if (!del && ci === word.length) { wait = 1900; del = true; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; wait = 320; }
      setTimeout(type, wait);
    })();
  })();

  /* ─── Scroll reveal ─── */
  (() => {
    const items = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const d = +(en.target.dataset.delay || 0);
        setTimeout(() => en.target.classList.add('in'), d);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(i => io.observe(i));
  })();

  /* ─── Counters ─── */
  (() => {
    const nums = $$('[data-count]');
    if (!nums.length) return;
    const run = el => {
      const target = +el.dataset.count;
      if (reduced) { el.textContent = target; return; }
      const dur = 1400, t0 = performance.now();
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    };
    const io = new IntersectionObserver((es, o) => {
      es.forEach(e => { if (e.isIntersecting) { run(e.target); o.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
  })();

  /* ─── Skill meters ─── */
  (() => {
    const bars = $$('.meter-bar i');
    if (!bars.length) return;
    const io = new IntersectionObserver((es, o) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.width = e.target.dataset.fill + '%';
        o.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    bars.forEach(b => io.observe(b));
  })();

  /* ─── 3D tilt + card glow ─── */
  if (fine && !reduced) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform =
          `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 7}deg) translateY(-4px)`;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ─── Nav: scrolled state, active link, burger ─── */
  (() => {
    const nav = $('#nav'), bar = $('#scroll-bar');
    const links = $$('.nav-link');
    const sections = links
      .map(l => $(l.getAttribute('href')))
      .filter(Boolean);

    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle('scrolled', y > 30);

      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

      let cur = sections[0];
      for (const s of sections) if (s.offsetTop - 140 <= y) cur = s;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur?.id));
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const burger = $('#nav-burger'), menu = $('#nav-links');
    burger?.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    menu?.addEventListener('click', e => {
      if (e.target.closest('.nav-link')) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  /* ─── Hero parallax ─── */
  if (!reduced) {
    const portrait = $('.portrait');
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y < innerHeight && portrait) portrait.style.translate = `0 ${y * 0.11}px`;
    }, { passive: true });
  }

  /* ─── Certificate filters ─── */
  (() => {
    const filters = $$('.filter'), cards = $$('.cert-card');
    filters.forEach(f => f.addEventListener('click', () => {
      filters.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      f.classList.add('active');
      f.setAttribute('aria-selected', 'true');
      const cat = f.dataset.filter;
      cards.forEach(c => {
        const show = cat === 'all' || c.dataset.cat === cat;
        c.classList.toggle('hide', !show);
      });
    }));
  })();

  /* ─── Lightbox ─── */
  (() => {
    const lb = $('#lightbox');
    if (!lb) return;
    const img = $('#lb-img'), title = $('#lb-title'), issuer = $('#lb-issuer'),
          date = $('#lb-date'), pdf = $('#lb-pdf');
    const cards = $$('.cert-card[data-src]');
    let idx = 0, lastFocus = null;

    const render = i => {
      const c = cards[i];
      if (!c) return;
      idx = i;
      img.src = c.dataset.src;
      img.alt = c.dataset.title;
      title.textContent = c.dataset.title;
      issuer.textContent = c.dataset.issuer;
      date.textContent = c.dataset.date;
      if (c.dataset.pdf) { pdf.href = c.dataset.pdf; pdf.hidden = false; }
      else pdf.hidden = true;
    };

    const open = i => {
      lastFocus = document.activeElement;
      render(i);
      lb.hidden = false;
      document.body.classList.add('lb-open');
      requestAnimationFrame(() => lb.classList.add('open'));
      $('#lb-close').focus();
    };

    const close = () => {
      lb.classList.remove('open');
      document.body.classList.remove('lb-open');
      setTimeout(() => { lb.hidden = true; lastFocus?.focus(); }, 400);
    };

    const step = d => render((idx + d + cards.length) % cards.length);

    cards.forEach((c, i) => c.addEventListener('click', () => open(i)));
    $('#lb-close').addEventListener('click', close);
    $('#lb-prev').addEventListener('click', () => step(-1));
    $('#lb-next').addEventListener('click', () => step(1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });

    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  })();

  /* ─── Smooth anchor scroll with nav offset ─── */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + scrollY - (id === '#home' ? 0 : 86);
      scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

})();

/* ═══════════════════════════════════════════════
   ENHANCEMENTS — couche cinématique
   ═══════════════════════════════════════════════ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = matchMedia('(pointer: fine)').matches;

  /* ─── Titres animés caractère par caractère ─── */
  (() => {
    const els = $$('[data-split]');

    els.forEach(el => {
      let i = 0;
      // on ne touche qu'aux nœuds texte : les balises internes restent intactes
      const texts = [];
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) texts.push(walk.currentNode);

      texts.forEach(node => {
        const frag = document.createDocumentFragment();
        for (const ch of node.nodeValue) {
          const sp = document.createElement('span');
          sp.className = 'ch';
          sp.style.setProperty('--i', i++);
          sp.textContent = ch;
          frag.appendChild(sp);
        }
        node.parentNode.replaceChild(frag, node);
      });
      el.classList.add('split');
    });

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((es, o) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        o.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    els.forEach(e => io.observe(e));
  })();

  if (reduced) return;

  /* ─── Projecteur + traînée de curseur ─── */
  if (fine) {
    const spot = $('#spotlight');
    const dots = Array.from({ length: 9 }, () => {
      const d = document.createElement('div');
      d.className = 'trail';
      document.body.appendChild(d);
      return { el: d, x: innerWidth / 2, y: innerHeight / 2 };
    });
    let mx = innerWidth / 2, my = innerHeight / 2;

    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (spot) {
        spot.style.setProperty('--sx', mx + 'px');
        spot.style.setProperty('--sy', my + 'px');
      }
    }, { passive: true });

    (function run() {
      let px = mx, py = my;
      dots.forEach((d, i) => {
        d.x += (px - d.x) * 0.32;
        d.y += (py - d.y) * 0.32;
        d.el.style.transform = `translate(${d.x}px,${d.y}px) translate(-50%,-50%) scale(${1 - i / dots.length})`;
        d.el.style.opacity = (1 - i / dots.length) * 0.4;
        px = d.x; py = d.y;
      });
      requestAnimationFrame(run);
    })();
  }

  /* ─── Inclinaison du bandeau selon la vitesse de scroll ─── */
  (() => {
    const mq = $('.marquee'), track = $('.marquee-track');
    if (!mq || !track) return;
    let last = scrollY, vel = 0;
    addEventListener('scroll', () => {
      vel = scrollY - last;
      last = scrollY;
    }, { passive: true });
    (function loop() {
      vel *= 0.9;
      const k = Math.max(-9, Math.min(9, vel * 0.35));
      mq.style.transform = `skewY(${k * 0.12}deg)`;
      track.style.transform = `translateX(${-k * 6}px)`;
      requestAnimationFrame(loop);
    })();
  })();

  /* ─── Anneau de progression du bouton « haut » ─── */
  (() => {
    const c = $('#ring-c');
    if (!c) return;
    const LEN = 2 * Math.PI * 26;
    c.style.strokeDasharray = LEN;
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      c.style.strokeDashoffset = LEN * (1 - p);
    };
    addEventListener('scroll', upd, { passive: true });
    upd();
  })();

  /* ─── Flou pendant le comptage ─── */
  (() => {
    $$('.stat').forEach(st => {
      const b = $('[data-count]', st);
      if (!b) return;
      const io = new IntersectionObserver((es, o) => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          st.classList.add('counting');
          setTimeout(() => st.classList.remove('counting'), 1400);
          o.unobserve(e.target);
        });
      }, { threshold: 0.6 });
      io.observe(st);
    });
  })();

  /* ─── Parallaxe multi-couches ─── */
  (() => {
    const layers = [
      { el: $('.mesh-bg'), k: 0.14 },
      { el: $('.aurora'),  k: 0.07 }
    ].filter(l => l.el);
    if (!layers.length) return;
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        layers.forEach(l => { l.el.style.translate = `0 ${scrollY * l.k}px`; });
        ticking = false;
      });
    }, { passive: true });
  })();
})();
