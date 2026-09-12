(() => {
  'use strict';

  const root = document.querySelector('[data-refined-site]');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;

  const header = root.querySelector('[data-refined-header]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const reveals = [...root.querySelectorAll('.refined-reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '80px 0px -8% 0px', threshold: .08 });
    reveals.forEach((item) => observer.observe(item));
  }

  const hero = root.querySelector('[data-hero-visual]');
  if (hero instanceof HTMLElement && finePointer && !reducedMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let tl = 67, cl = 67;
    let raf = 0;

    const render = () => {
      cx = lerp(cx, tx, .08);
      cy = lerp(cy, ty, .08);
      cl = lerp(cl, tl, .1);
      hero.style.setProperty('--hero-x', `${cx.toFixed(2)}px`);
      hero.style.setProperty('--hero-y', `${cy.toFixed(2)}px`);
      hero.style.setProperty('--hero-light', `${cl.toFixed(2)}%`);
      const moving = Math.abs(cx - tx) > .02 || Math.abs(cy - ty) > .02 || Math.abs(cl - tl) > .03;
      raf = moving ? requestAnimationFrame(render) : 0;
    };
    const requestRender = () => { if (!raf) raf = requestAnimationFrame(render); };

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      tx = (x - .5) * 10;
      ty = (y - .5) * 5;
      tl = 18 + x * 70;
      requestRender();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      tx = 0; ty = 0; tl = 67; requestRender();
    });
  }

  root.querySelectorAll('[data-ba-gallery]').forEach((gallery) => {
    if (!(gallery instanceof HTMLElement)) return;
    const projects = [...gallery.querySelectorAll('[data-ba-project]')];
    const dots = [...gallery.querySelectorAll('[data-ba-dot]')];
    const prev = gallery.querySelector('[data-ba-prev]');
    const next = gallery.querySelector('[data-ba-next]');
    const currentLabel = gallery.querySelector('[data-ba-current]');
    if (!projects.length) return;

    let current = 0;
    const select = (nextIndex) => {
      current = (nextIndex + projects.length) % projects.length;
      projects.forEach((project, index) => {
        const active = index === current;
        project.classList.toggle('is-active', active);
        project.setAttribute('aria-hidden', active ? 'false' : 'true');
        if (active) {
          const range = project.querySelector('[data-comparison-range]');
          if (range instanceof HTMLInputElement) {
            range.value = '52';
            range.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });
      dots.forEach((dot, index) => {
        const active = index === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, '0');
    };
    prev?.addEventListener('click', () => select(current - 1));
    next?.addEventListener('click', () => select(current + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => select(index)));
  });

  const transition = root.querySelector('[data-wiper-transition]');
  const canvas = transition?.querySelector('[data-wiper-canvas]');
  const arm = transition?.querySelector('[data-wiper-arm]');
  const label = transition?.querySelector('[data-wiper-label]');
  let navigationTimer = 0;
  let frame = 0;

  const resetTransition = () => {
    if (navigationTimer) {
      clearTimeout(navigationTimer);
      navigationTimer = 0;
    }
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    if (transition instanceof HTMLElement) transition.classList.remove('is-active');
    if (canvas instanceof HTMLCanvasElement) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  addEventListener('pageshow', resetTransition);
  addEventListener('pagehide', resetTransition);
  addEventListener('popstate', resetTransition);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resetTransition();
  });
  resetTransition();

  const paintRain = () => {
    if (!(canvas instanceof HTMLCanvasElement)) return null;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = innerWidth;
    const height = innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(dpr, dpr);

    const wash = ctx.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, 'rgba(12,24,30,.84)');
    wash.addColorStop(.45, 'rgba(35,70,82,.76)');
    wash.addColorStop(1, 'rgba(7,15,19,.9)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    const count = Math.max(48, Math.floor(width / 18));
    for (let i = 0; i < count; i += 1) {
      const x = (i * 67) % width;
      const y = (i * 131) % height;
      const length = 25 + ((i * 17) % 90);
      const alpha = .08 + ((i * 11) % 10) / 100;
      ctx.strokeStyle = `rgba(220,248,255,${alpha})`;
      ctx.lineWidth = 1 + ((i * 7) % 3) * .45;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + length);
      ctx.stroke();
    }

    for (let i = 0; i < 34; i += 1) {
      const x = (i * 103) % width;
      const y = (i * 73) % height;
      const r = 2 + ((i * 13) % 9);
      const gradient = ctx.createRadialGradient(x - r * .25, y - r * .25, .3, x, y, r);
      gradient.addColorStop(0, 'rgba(255,255,255,.46)');
      gradient.addColorStop(.22, 'rgba(185,234,247,.15)');
      gradient.addColorStop(1, 'rgba(26,60,72,.08)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.45, -.12, 0, Math.PI * 2);
      ctx.fill();
    }
    return ctx;
  };

  const runWiper = (destination, serviceName) => {
    if (!(transition instanceof HTMLElement) || reducedMotion) {
      location.assign(destination);
      return;
    }
    resetTransition();
    if (label) label.textContent = serviceName || 'BEHANDLING';
    const ctx = paintRain();
    transition.classList.add('is-active');
    if (!(canvas instanceof HTMLCanvasElement) || !ctx || !(arm instanceof HTMLElement)) {
      navigationTimer = window.setTimeout(() => location.assign(destination), 720);
      return;
    }

    const width = innerWidth;
    const height = innerHeight;
    const pivotX = width * .5;
    const pivotY = height * 1.18;
    const radius = Math.min(width * .74, 950);
    const start = performance.now();
    const duration = 760;

    const wipe = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = p < .55
        ? 1 - Math.pow(1 - (p / .55), 3)
        : 1 - Math.pow((p - .55) / .45, 2) * .18;
      const angle = (-72 + eased * 97) * Math.PI / 180;
      const tipX = pivotX + Math.cos(angle) * radius;
      const tipY = pivotY + Math.sin(angle) * radius;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(82, height * .12);
      ctx.shadowBlur = 26;
      ctx.shadowColor = 'rgba(0,0,0,.5)';
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.restore();

      if (p < 1) frame = requestAnimationFrame(wipe);
    };
    frame = requestAnimationFrame(wipe);
    navigationTimer = window.setTimeout(() => {
      navigationTimer = 0;
      location.assign(destination);
    }, 820);
  };

  root.querySelectorAll('[data-wiper-link]').forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin) return;
      event.preventDefault();
      runWiper(destination.href, link.dataset.serviceName || 'BEHANDLING');
    });
  });
})();
