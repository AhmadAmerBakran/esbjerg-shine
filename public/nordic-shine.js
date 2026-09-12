(() => {
  'use strict';

  const root = document.querySelector('[data-ns-site]');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = root.querySelector('[data-ns-header]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 18);
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const reveals = [...root.querySelectorAll('.ns-reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '80px 0px -7% 0px', threshold: .08 });
    reveals.forEach((item) => observer.observe(item));
  }

  root.querySelectorAll('[data-comparison]').forEach((comparison) => {
    if (!(comparison instanceof HTMLElement)) return;
    const range = comparison.querySelector('[data-comparison-range]');
    if (!(range instanceof HTMLInputElement)) return;
    const update = () => comparison.style.setProperty('--position', `${range.value}%`);
    range.addEventListener('input', update);
    update();
  });

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

  const params = new URLSearchParams(location.search);
  const requestedService = params.get('service');
  if (requestedService) {
    const select = root.querySelector('.contact-form select[name="ydelse"]');
    if (select instanceof HTMLSelectElement) {
      const match = [...select.options].find((option) => option.value === requestedService);
      if (match) select.value = requestedService;
    }
  }

  const transition = root.querySelector('[data-wiper-transition]');
  const canvas = transition?.querySelector('[data-wiper-canvas]');
  const arm = transition?.querySelector('[data-wiper-arm]');
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

  const drawWetLayer = () => {
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

    ctx.fillStyle = 'rgba(18,31,35,.82)';
    ctx.fillRect(0, 0, width, height);

    const count = Math.max(40, Math.floor(width / 24));
    for (let i = 0; i < count; i += 1) {
      const x = (i * 79) % width;
      const y = (i * 137) % height;
      const length = 20 + ((i * 19) % 70);
      ctx.strokeStyle = `rgba(224,248,252,${.06 + ((i * 7) % 8) / 100})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + length);
      ctx.stroke();
    }
    return ctx;
  };

  const runWiper = (destination) => {
    if (!(transition instanceof HTMLElement) || reducedMotion) {
      location.assign(destination);
      return;
    }

    resetTransition();
    const ctx = drawWetLayer();
    transition.classList.add('is-active');

    if (!(canvas instanceof HTMLCanvasElement) || !ctx || !(arm instanceof HTMLElement)) {
      navigationTimer = window.setTimeout(() => location.assign(destination), 650);
      return;
    }

    const width = innerWidth;
    const height = innerHeight;
    const pivotX = width * .5;
    const pivotY = height * 1.2;
    const radius = Math.min(width * .72, 900);
    const start = performance.now();
    const duration = 700;

    const wipe = (now) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      const angle = (-72 + eased * 98) * Math.PI / 180;
      const tipX = pivotX + Math.cos(angle) * radius;
      const tipY = pivotY + Math.sin(angle) * radius;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(78, height * .105);
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
    }, 760);
  };

  root.querySelectorAll('[data-wiper-link]').forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin) return;
      event.preventDefault();
      runWiper(destination.href);
    });
  });
})();
