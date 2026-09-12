(() => {
  'use strict';

  const root = document.querySelector('[data-rainline-site]');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;

  /* Navigation and calm section reveals. */
  const nav = root.querySelector('[data-rainline-nav]');
  const syncNav = () => nav?.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', syncNav, { passive: true });
  syncNav();

  const revealItems = [...root.querySelectorAll('.rl-reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '80px 0px -7% 0px', threshold: .08 });
    revealItems.forEach((item) => observer.observe(item));
  }

  /* Wet-glass hero: narrow reflection moves with inertia, not card-like tilt. */
  const windshield = root.querySelector('[data-windshield-piece]');
  if (windshield instanceof HTMLElement && finePointer && !reducedMotion) {
    const glass = windshield.querySelector('.windshield-piece__glass');
    let tx = 70;
    let ty = 28;
    let cx = tx;
    let cy = ty;
    let targetRotate = -5;
    let currentRotate = targetRotate;
    let raf = 0;

    const tick = () => {
      cx = lerp(cx, tx, .085);
      cy = lerp(cy, ty, .085);
      currentRotate = lerp(currentRotate, targetRotate, .07);
      root.style.setProperty('--rl-x', `${cx.toFixed(2)}%`);
      root.style.setProperty('--rl-y', `${cy.toFixed(2)}%`);
      if (glass instanceof HTMLElement) glass.style.transform = `rotateY(${currentRotate.toFixed(2)}deg) rotateX(1deg)`;
      const moving = Math.abs(cx - tx) > .02 || Math.abs(cy - ty) > .02 || Math.abs(currentRotate - targetRotate) > .02;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };

    const requestTick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    windshield.addEventListener('pointermove', (event) => {
      const rect = windshield.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      tx = 14 + x * 76;
      ty = 12 + y * 68;
      targetRotate = -7 + x * 3.2;
      requestTick();
    }, { passive: true });

    windshield.addEventListener('pointerleave', () => {
      tx = 70;
      ty = 28;
      targetRotate = -5;
      requestTick();
    });
  }

  /* Local material inspection for each service row. */
  if (finePointer && !reducedMotion) {
    root.querySelectorAll('[data-service-row]').forEach((row) => {
      if (!(row instanceof HTMLElement)) return;
      const sample = row.querySelector('[data-service-sample]');
      if (!(sample instanceof HTMLElement)) return;
      row.addEventListener('pointermove', (event) => {
        const rect = sample.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
        const y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
        sample.style.setProperty('--sx', `${(x * 100).toFixed(1)}%`);
        sample.style.setProperty('--sy', `${(y * 100).toFixed(1)}%`);
      }, { passive: true });
    });
  }

  /* Paint inspection line. */
  const reflectionRoom = root.querySelector('[data-reflection-room]');
  if (reflectionRoom instanceof HTMLElement && finePointer && !reducedMotion) {
    const surface = reflectionRoom.querySelector('.reflection-room__surface');
    if (surface instanceof HTMLElement) {
      let target = 68;
      let current = target;
      let raf = 0;
      const tick = () => {
        current = lerp(current, target, .12);
        surface.style.setProperty('--rx', `${current.toFixed(2)}%`);
        raf = Math.abs(current - target) > .025 ? requestAnimationFrame(tick) : 0;
      };
      reflectionRoom.addEventListener('pointermove', (event) => {
        const rect = reflectionRoom.getBoundingClientRect();
        target = clamp(((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100, 5, 95);
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
    }
  }

  /* Multi-project before / after viewer. */
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

  /* ----------------------------------------------------------------------
     WIPER TRANSITION
     A real canvas layer wets the current page. The blade then physically
     clears a broad arc before navigation. Because the canvas is transparent,
     the existing page is what becomes visible through the cleaned sweep.
     ------------------------------------------------------------------- */
  const transition = root.querySelector('[data-wiper-transition]');
  const canvas = root.querySelector('[data-wiper-canvas]');
  const label = root.querySelector('[data-wiper-label]');
  let navigationTimer = 0;
  let animationFrame = 0;
  let dpr = Math.min(devicePixelRatio || 1, 2);

  const resetWiper = () => {
    if (navigationTimer) {
      clearTimeout(navigationTimer);
      navigationTimer = 0;
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    if (transition instanceof HTMLElement) transition.classList.remove('is-active');
    if (canvas instanceof HTMLCanvasElement) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  addEventListener('pageshow', resetWiper);
  addEventListener('pagehide', resetWiper);
  addEventListener('popstate', resetWiper);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resetWiper();
  });
  resetWiper();

  const sizeCanvas = () => {
    if (!(canvas instanceof HTMLCanvasElement)) return null;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  };

  const paintWetGlass = () => {
    const ctx = sizeCanvas();
    if (!ctx) return null;
    const width = innerWidth;
    const height = innerHeight;

    const shade = ctx.createLinearGradient(0, 0, width, height);
    shade.addColorStop(0, 'rgba(5, 12, 15, .42)');
    shade.addColorStop(.55, 'rgba(8, 17, 20, .31)');
    shade.addColorStop(1, 'rgba(2, 6, 8, .48)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);

    // Fine diagonal rain streaks.
    ctx.lineCap = 'round';
    for (let i = 0; i < 70; i += 1) {
      const x = (i * 97 + 23) % (width + 120) - 60;
      const y = (i * 59 + 41) % (height + 100) - 50;
      const length = 12 + ((i * 17) % 44);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length * .18, y + length);
      ctx.strokeStyle = `rgba(211, 246, 253, ${.08 + (i % 5) * .018})`;
      ctx.lineWidth = .6 + (i % 3) * .35;
      ctx.stroke();
    }

    // Beads catch a small highlight and shadow, making the layer read as glass.
    for (let i = 0; i < 42; i += 1) {
      const x = 18 + ((i * 127) % Math.max(width - 36, 1));
      const y = 15 + ((i * 83) % Math.max(height - 30, 1));
      const r = 1.6 + ((i * 11) % 7) * .42;
      const bead = ctx.createRadialGradient(x - r * .28, y - r * .32, .1, x, y, r);
      bead.addColorStop(0, 'rgba(255,255,255,.72)');
      bead.addColorStop(.22, 'rgba(191,235,245,.23)');
      bead.addColorStop(.7, 'rgba(24,58,67,.12)');
      bead.addColorStop(1, 'rgba(0,0,0,.18)');
      ctx.fillStyle = bead;
      ctx.beginPath();
      ctx.ellipse(x, y, r * .8, r * 1.08, .15, 0, Math.PI * 2);
      ctx.fill();
    }
    return ctx;
  };

  const eraseBladeAt = (ctx, angleDeg) => {
    const width = innerWidth;
    const height = innerHeight;
    const pivotX = width * 1.02;
    const pivotY = height * 1.04;
    const length = Math.hypot(width, height) * .95;
    const angle = Math.PI + angleDeg * Math.PI / 180;
    const endX = pivotX + Math.cos(angle) * length;
    const endY = pivotY + Math.sin(angle) * length;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = Math.max(82, Math.min(width, height) * .13);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  };

  const runWiper = (serviceName, destination) => {
    if (!(transition instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
      location.assign(destination);
      return;
    }

    resetWiper();
    const ctx = paintWetGlass();
    if (!ctx) {
      location.assign(destination);
      return;
    }
    if (label) label.textContent = serviceName || 'BEHANDLING';
    transition.classList.add('is-active');

    const duration = 1020;
    const start = performance.now();
    let previousAngle = 18;

    const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const frame = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      // Forward sweep dominates the animation; the visual blade returns in CSS.
      const sweepT = clamp(t / .72, 0, 1);
      const angle = 18 + (-103 * ease(sweepT));
      const step = angle < previousAngle ? -2.2 : 2.2;
      for (let a = previousAngle; step < 0 ? a >= angle : a <= angle; a += step) eraseBladeAt(ctx, a);
      previousAngle = angle;
      if (t < 1) animationFrame = requestAnimationFrame(frame);
      else animationFrame = 0;
    };
    animationFrame = requestAnimationFrame(frame);

    navigationTimer = window.setTimeout(() => {
      navigationTimer = 0;
      location.assign(destination);
    }, duration + 40);
  };

  if (!reducedMotion) {
    root.querySelectorAll('[data-wiper-link]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target === '_blank') return;
        const destination = new URL(link.href, location.href);
        if (destination.origin !== location.origin) return;
        event.preventDefault();
        runWiper(link.dataset.serviceName || link.textContent?.trim() || 'BEHANDLING', destination.href);
      });
    });
  }
})();
