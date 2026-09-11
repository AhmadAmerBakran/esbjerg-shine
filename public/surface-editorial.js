(() => {
  'use strict';

  const root = document.querySelector('[data-surface-site]');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;

  const nav = root.querySelector('[data-surface-nav]');
  const updateNav = () => nav?.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  const revealItems = [...root.querySelectorAll('.surface-reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '80px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  }

  /* Main paint object: slower light than pointer = material weight. */
  const material = root.querySelector('[data-material-object]');
  if (material instanceof HTMLElement && finePointer && !reducedMotion) {
    let targetX = 64;
    let targetY = 30;
    let currentX = targetX;
    let currentY = targetY;
    let targetRX = 3;
    let targetRY = -7;
    let currentRX = targetRX;
    let currentRY = targetRY;
    let raf = 0;

    const frame = material.querySelector('.material-object__frame');

    const tick = () => {
      currentX = lerp(currentX, targetX, .09);
      currentY = lerp(currentY, targetY, .09);
      currentRX = lerp(currentRX, targetRX, .075);
      currentRY = lerp(currentRY, targetRY, .075);
      root.style.setProperty('--mx', `${currentX.toFixed(2)}%`);
      root.style.setProperty('--my', `${currentY.toFixed(2)}%`);
      if (frame instanceof HTMLElement) frame.style.transform = `rotateY(${currentRY.toFixed(2)}deg) rotateX(${currentRX.toFixed(2)}deg)`;

      const moving = Math.abs(currentX - targetX) > .02 || Math.abs(currentY - targetY) > .02 || Math.abs(currentRX - targetRX) > .02 || Math.abs(currentRY - targetRY) > .02;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };

    const requestTick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    material.addEventListener('pointermove', (event) => {
      const rect = material.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      targetX = 17 + x * 70;
      targetY = 14 + y * 62;
      targetRY = -10 + x * 6;
      targetRX = 5 - y * 5;
      requestTick();
    }, { passive: true });

    material.addEventListener('pointerleave', () => {
      targetX = 64;
      targetY = 30;
      targetRX = 3;
      targetRY = -7;
      requestTick();
    });
  }

  /* Sparse hydrophobic beads; intentionally deterministic. */
  const dropLayer = root.querySelector('[data-material-drops]');
  if (dropLayer instanceof HTMLElement && !dropLayer.children.length) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 18; i += 1) {
      const drop = document.createElement('i');
      drop.className = 'material-drop';
      const x = 4 + ((i * 37) % 91);
      const y = 6 + ((i * 29) % 82);
      const size = 4 + ((i * 13) % 10);
      const opacity = .35 + ((i * 7) % 6) * .08;
      const duration = 6.5 + ((i * 17) % 9) * .7;
      const delay = -((i * 11) % 9) * .8;
      drop.style.setProperty('--dx', `${x}%`);
      drop.style.setProperty('--dy', `${y}%`);
      drop.style.setProperty('--ds', `${size}px`);
      drop.style.setProperty('--do', opacity.toFixed(2));
      drop.style.setProperty('--dd', `${duration.toFixed(1)}s`);
      drop.style.setProperty('--delay', `${delay.toFixed(1)}s`);
      fragment.append(drop);
    }
    dropLayer.append(fragment);
  }

  /* Each service material receives its own moving highlight origin. */
  if (finePointer && !reducedMotion) {
    root.querySelectorAll('[data-care-row]').forEach((row) => {
      if (!(row instanceof HTMLElement)) return;
      const visual = row.querySelector('[data-care-material]');
      if (!(visual instanceof HTMLElement)) return;
      row.addEventListener('pointermove', (event) => {
        const rect = visual.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        visual.style.setProperty('--cx', `${(x * 100).toFixed(1)}%`);
        visual.style.setProperty('--cy', `${(y * 100).toFixed(1)}%`);
      }, { passive: true });
    });
  }

  /* Interactive inspection lamp. */
  const inspection = root.querySelector('[data-inspection]');
  const inspectionPanel = root.querySelector('[data-inspection-panel]');
  if (inspection instanceof HTMLElement && inspectionPanel instanceof HTMLElement && finePointer && !reducedMotion) {
    let targetX = 68;
    let targetY = 44;
    let currentX = targetX;
    let currentY = targetY;
    let raf = 0;

    const tick = () => {
      currentX = lerp(currentX, targetX, .13);
      currentY = lerp(currentY, targetY, .13);
      inspectionPanel.style.setProperty('--sx', `${currentX.toFixed(2)}%`);
      inspectionPanel.style.setProperty('--sy', `${currentY.toFixed(2)}%`);
      const moving = Math.abs(currentX - targetX) > .03 || Math.abs(currentY - targetY) > .03;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };

    inspection.addEventListener('pointermove', (event) => {
      const rect = inspection.getBoundingClientRect();
      targetX = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
      targetY = clamp(((event.clientY - rect.top) / rect.height) * 100, 10, 90);
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* Before / after gallery controls. */
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

  /* Coating-drop transition to service pages. */
  const transition = root.querySelector('[data-finish-transition]');
  let navigationTimer = 0;

  const resetTransition = () => {
    if (navigationTimer) {
      clearTimeout(navigationTimer);
      navigationTimer = 0;
    }
    if (transition instanceof HTMLElement) transition.classList.remove('is-active');
  };

  addEventListener('pageshow', resetTransition);
  addEventListener('pagehide', resetTransition);
  addEventListener('popstate', resetTransition);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resetTransition();
  });
  resetTransition();

  if (transition instanceof HTMLElement && !reducedMotion) {
    root.querySelectorAll('[data-finish-link]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const destination = new URL(link.href, location.href);
        if (destination.origin !== location.origin) return;

        event.preventDefault();
        resetTransition();
        transition.style.setProperty('--tx', `${event.clientX}px`);
        transition.style.setProperty('--ty', `${event.clientY}px`);
        void transition.offsetWidth;
        transition.classList.add('is-active');
        navigationTimer = window.setTimeout(() => {
          navigationTimer = 0;
          location.assign(destination.href);
        }, 560);
      });
    });
  }
})();
