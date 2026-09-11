(() => {
  'use strict';

  const root = document.querySelector('[data-film-site]');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;

  /* page progress + navigation material state */
  const progress = root.querySelector('[data-page-progress]');
  const nav = root.querySelector('[data-film-nav]');
  let scrollTicking = false;

  const updateScrollState = () => {
    scrollTicking = false;
    const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    const amount = clamp(scrollY / max, 0, 1);
    if (progress instanceof HTMLElement) progress.style.transform = `scaleX(${amount})`;
    if (nav instanceof HTMLElement) nav.classList.toggle('is-scrolled', scrollY > 40);
  };

  addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollState);
  }, { passive: true });
  updateScrollState();

  /* cinematic reveal */
  const revealItems = [...root.querySelectorAll('.film-reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '90px 0px -8% 0px', threshold: .08 });
    revealItems.forEach((item) => observer.observe(item));
  }

  /* hero camera inertia / moving inspection specular */
  const hero = root.querySelector('[data-hero]');
  const carStage = root.querySelector('[data-car-stage]');
  if (hero instanceof HTMLElement && carStage instanceof HTMLElement && finePointer && !reducedMotion) {
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let tsx = 64;
    let tsy = 27;
    let csx = 64;
    let csy = 27;
    let heroRaf = 0;

    const renderHero = () => {
      cx = lerp(cx, tx, .075);
      cy = lerp(cy, ty, .075);
      csx = lerp(csx, tsx, .11);
      csy = lerp(csy, tsy, .11);
      root.style.setProperty('--hero-x', `${cx.toFixed(2)}px`);
      root.style.setProperty('--hero-y', `${cy.toFixed(2)}px`);
      root.style.setProperty('--hero-spec-x', `${csx.toFixed(2)}%`);
      root.style.setProperty('--hero-spec-y', `${csy.toFixed(2)}%`);
      const moving = Math.abs(cx - tx) > .02 || Math.abs(cy - ty) > .02 || Math.abs(csx - tsx) > .03 || Math.abs(csy - tsy) > .03;
      heroRaf = moving ? requestAnimationFrame(renderHero) : 0;
    };

    const requestHero = () => {
      if (!heroRaf) heroRaf = requestAnimationFrame(renderHero);
    };

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      tx = (x - .5) * 10;
      ty = (y - .5) * 6;
      tsx = 24 + x * 58;
      tsy = 12 + y * 46;
      requestHero();
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      tsx = 64;
      tsy = 27;
      requestHero();
    });
  }

  /* real-time wet glass canvas. Sparse droplets + highlights, not particle confetti. */
  const wetCanvas = root.querySelector('[data-wet-glass]');
  if (wetCanvas instanceof HTMLCanvasElement && !reducedMotion) {
    const ctx = wetCanvas.getContext('2d', { alpha: true });
    if (ctx) {
      let width = 1;
      let height = 1;
      let dpr = 1;
      let wetRaf = 0;
      let visible = true;
      const drops = Array.from({ length: 34 }, (_, index) => ({
        x: ((index * 61) % 97) / 100,
        y: ((index * 37) % 101) / 100,
        r: 1.8 + ((index * 17) % 13) * .34,
        speed: .000035 + ((index * 11) % 9) * .000009,
        wobble: .45 + ((index * 19) % 10) * .11,
        phase: index * 1.73,
        opacity: .08 + ((index * 23) % 9) * .017
      }));

      const resize = () => {
        dpr = Math.min(devicePixelRatio || 1, 1.6);
        width = Math.max(1, wetCanvas.clientWidth);
        height = Math.max(1, wetCanvas.clientHeight);
        wetCanvas.width = Math.round(width * dpr);
        wetCanvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const drawWet = (time) => {
        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(220,249,255,0)');
        gradient.addColorStop(.58, 'rgba(220,249,255,.018)');
        gradient.addColorStop(1, 'rgba(126,218,240,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        for (const drop of drops) {
          drop.y += drop.speed * Math.min(32, Math.max(1, time % 34));
          if (drop.y > 1.06) drop.y = -.06;
          const x = drop.x * width + Math.sin(time * .00035 * drop.wobble + drop.phase) * 5;
          const y = drop.y * height;
          const r = drop.r;

          const halo = ctx.createRadialGradient(x - r * .28, y - r * .32, .1, x, y, r * 1.45);
          halo.addColorStop(0, `rgba(255,255,255,${drop.opacity * 2.2})`);
          halo.addColorStop(.22, `rgba(200,244,255,${drop.opacity})`);
          halo.addColorStop(.58, 'rgba(120,210,235,.025)');
          halo.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 1.45, -.14, 0, Math.PI * 2);
          ctx.fill();

          if (r > 3.5) {
            ctx.strokeStyle = `rgba(234,252,255,${drop.opacity * .8})`;
            ctx.lineWidth = .6;
            ctx.beginPath();
            ctx.arc(x - r * .18, y - r * .25, r * .34, Math.PI * 1.05, Math.PI * 1.8);
            ctx.stroke();
          }
        }
        wetRaf = visible ? requestAnimationFrame(drawWet) : 0;
      };

      const visibility = new IntersectionObserver((entries) => {
        visible = Boolean(entries[0]?.isIntersecting);
        if (visible && !wetRaf) wetRaf = requestAnimationFrame(drawWet);
        if (!visible && wetRaf) {
          cancelAnimationFrame(wetRaf);
          wetRaf = 0;
        }
      });
      visibility.observe(wetCanvas);
      resize();
      addEventListener('resize', resize, { passive: true });
      wetRaf = requestAnimationFrame(drawWet);
    }
  }

  /* sticky service journey */
  const steps = [...root.querySelectorAll('[data-service-step]')];
  const readout = root.querySelector('[data-service-readout]');
  const readoutIndex = root.querySelector('[data-service-index]');
  if (steps.length && 'IntersectionObserver' in window) {
    const serviceObserver = new IntersectionObserver((entries) => {
      const candidates = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const active = candidates[0]?.target;
      if (!(active instanceof HTMLElement)) return;
      const slug = active.dataset.serviceStep;
      if (!slug) return;
      root.dataset.activeService = slug;
      if (readout) readout.textContent = active.dataset.serviceTitle || '';
      if (readoutIndex) readoutIndex.textContent = active.dataset.serviceNumber || '';
    }, { rootMargin: '-20% 0px -28% 0px', threshold: [.18, .35, .55, .75] });
    steps.forEach((step) => serviceObserver.observe(step));
  }

  /* contact console inspection light follows pointer */
  const intake = root.querySelector('[data-intake-console]');
  if (intake instanceof HTMLElement && finePointer && !reducedMotion) {
    intake.addEventListener('pointermove', (event) => {
      const rect = intake.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      root.style.setProperty('--intake-x', `${(x * 100).toFixed(1)}%`);
      root.style.setProperty('--intake-y', `${(y * 100).toFixed(1)}%`);
    }, { passive: true });
  }

  /* before / after component */
  root.querySelectorAll('[data-ba-gallery]').forEach((gallery) => {
    if (!(gallery instanceof HTMLElement)) return;
    const projects = [...gallery.querySelectorAll('[data-ba-project]')];
    const dots = [...gallery.querySelectorAll('[data-ba-dot]')];
    const prev = gallery.querySelector('[data-ba-prev]');
    const next = gallery.querySelector('[data-ba-next]');
    const currentLabel = gallery.querySelector('[data-ba-current]');
    if (!projects.length) return;
    let current = 0;

    projects.forEach((project) => {
      const range = project.querySelector('[data-comparison-range]');
      const comparison = project.querySelector('[data-comparison]');
      if (!(range instanceof HTMLInputElement) || !(comparison instanceof HTMLElement)) return;
      range.addEventListener('input', () => comparison.style.setProperty('--position', `${range.value}%`));
    });

    const select = (nextIndex) => {
      current = (nextIndex + projects.length) % projects.length;
      projects.forEach((project, index) => {
        const active = index === current;
        project.classList.toggle('is-active', active);
        project.setAttribute('aria-hidden', active ? 'false' : 'true');
        if (active) {
          const range = project.querySelector('[data-comparison-range]');
          const comparison = project.querySelector('[data-comparison]');
          if (range instanceof HTMLInputElement && comparison instanceof HTMLElement) {
            range.value = '52';
            comparison.style.setProperty('--position', '52%');
          }
        }
      });
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === current);
        dot.setAttribute('aria-selected', index === current ? 'true' : 'false');
      });
      if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, '0');
    };

    prev?.addEventListener('click', () => select(current - 1));
    next?.addEventListener('click', () => select(current + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => select(index)));
  });

  /* service navigation wash transition + bfcache-safe reset */
  const wash = root.querySelector('[data-wash-transition]');
  const washCanvas = root.querySelector('[data-wash-canvas]');
  let navigationTimer = 0;
  let washRaf = 0;
  let washStart = 0;

  const resetWash = () => {
    if (navigationTimer) {
      clearTimeout(navigationTimer);
      navigationTimer = 0;
    }
    if (washRaf) {
      cancelAnimationFrame(washRaf);
      washRaf = 0;
    }
    if (wash instanceof HTMLElement) wash.classList.remove('is-active');
    if (washCanvas instanceof HTMLCanvasElement) {
      const ctx = washCanvas.getContext('2d');
      ctx?.clearRect(0, 0, washCanvas.width, washCanvas.height);
    }
  };

  const paintWashStreaks = (time) => {
    if (!(washCanvas instanceof HTMLCanvasElement)) return;
    const ctx = washCanvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const width = innerWidth;
    const height = innerHeight;
    if (washCanvas.width !== Math.round(width * dpr) || washCanvas.height !== Math.round(height * dpr)) {
      washCanvas.width = Math.round(width * dpr);
      washCanvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.clearRect(0, 0, width, height);
    const elapsed = time - washStart;
    const p = clamp(elapsed / 760, 0, 1);
    for (let i = 0; i < 28; i += 1) {
      const x = ((i * 79) % 101) / 100 * width;
      const lag = ((i * 23) % 19) * 10;
      const local = clamp((elapsed - lag) / 560, 0, 1);
      const y = -80 + local * (height + 180);
      const length = 46 + ((i * 31) % 92);
      const alpha = .05 + ((i * 17) % 10) * .012;
      ctx.strokeStyle = `rgba(220,249,255,${alpha * (1 - p * .42)})`;
      ctx.lineWidth = 1 + ((i * 13) % 4) * .45;
      ctx.beginPath();
      ctx.moveTo(x, y - length);
      ctx.lineTo(x - 3, y);
      ctx.stroke();
    }
    if (p < 1) washRaf = requestAnimationFrame(paintWashStreaks);
    else washRaf = 0;
  };

  addEventListener('pageshow', resetWash);
  addEventListener('pagehide', resetWash);
  addEventListener('popstate', resetWash);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resetWash();
  });
  resetWash();

  root.querySelectorAll('[data-service-link]').forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    link.addEventListener('click', (event) => {
      if (reducedMotion || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin) return;
      event.preventDefault();
      resetWash();
      if (wash instanceof HTMLElement) {
        void wash.offsetWidth;
        wash.classList.add('is-active');
      }
      washStart = performance.now();
      washRaf = requestAnimationFrame(paintWashStreaks);
      navigationTimer = window.setTimeout(() => {
        navigationTimer = 0;
        location.assign(destination.href);
      }, 790);
    });
  });

  /* subtle magnetic controls: physical response, not floating cards */
  if (finePointer && !reducedMotion) {
    root.querySelectorAll('.film-button, .ba-arrow, .film-nav__call').forEach((control) => {
      if (!(control instanceof HTMLElement)) return;
      control.addEventListener('pointermove', (event) => {
        const rect = control.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        control.style.translate = `${(x * 3).toFixed(2)}px ${(y * 2).toFixed(2)}px`;
      }, { passive: true });
      control.addEventListener('pointerleave', () => control.style.removeProperty('translate'));
    });
  }
})();
