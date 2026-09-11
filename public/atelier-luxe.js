(() => {
  'use strict';

  const root = document.querySelector('[data-atelier]');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;

  /* Navigation and page progress. */
  const nav = root.querySelector('[data-nav]');
  let scrollQueued = false;
  const updateScroll = () => {
    scrollQueued = false;
    const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    const progress = clamp(scrollY / max, 0, 1);
    root.style.setProperty('--page-progress', `${(progress * 100).toFixed(2)}%`);
    nav?.classList.toggle('is-scrolled', scrollY > 24);
  };
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  /* Restrained reveal. */
  const revealItems = [...root.querySelectorAll('.atelier-reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '70px 0px -7% 0px', threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* Coachwork inspection light with inertia. */
  const coachwork = root.querySelector('[data-coachwork]');
  if (coachwork instanceof HTMLElement && finePointer && !reducedMotion) {
    let targetX = 68;
    let targetY = 34;
    let currentX = targetX;
    let currentY = targetY;
    let raf = 0;

    const tick = () => {
      currentX = lerp(currentX, targetX, .085);
      currentY = lerp(currentY, targetY, .085);
      root.style.setProperty('--coach-x', `${currentX.toFixed(2)}%`);
      root.style.setProperty('--coach-y', `${currentY.toFixed(2)}%`);

      const moving = Math.abs(currentX - targetX) > .025 || Math.abs(currentY - targetY) > .025;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };

    const requestTick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    coachwork.addEventListener('pointermove', (event) => {
      const rect = coachwork.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      targetX = 18 + x * 67;
      targetY = 15 + y * 55;
      requestTick();
    }, { passive: true });
    coachwork.addEventListener('pointerleave', () => {
      targetX = 68;
      targetY = 34;
      requestTick();
    });
  }

  /* Sparse deterministic beads on the clearcoat fragment. */
  const beadLayer = root.querySelector('[data-coach-beads]');
  if (beadLayer instanceof HTMLElement && !beadLayer.children.length) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 14; i += 1) {
      const bead = document.createElement('i');
      bead.className = 'coach-bead';
      const x = 8 + ((i * 37) % 83);
      const y = 10 + ((i * 23) % 70);
      const size = 4.5 + ((i * 11) % 7) * .7;
      const opacity = .34 + ((i * 5) % 6) * .075;
      const rotation = -18 + ((i * 17) % 36);
      const duration = 6.8 + ((i * 13) % 7) * .75;
      const delay = -((i * 9) % 8) * .85;
      bead.style.setProperty('--bx', `${x}%`);
      bead.style.setProperty('--by', `${y}%`);
      bead.style.setProperty('--bs', `${size.toFixed(1)}px`);
      bead.style.setProperty('--bo', opacity.toFixed(2));
      bead.style.setProperty('--br', `${rotation}deg`);
      bead.style.setProperty('--bd', `${duration.toFixed(1)}s`);
      bead.style.setProperty('--bl', `${delay.toFixed(1)}s`);
      fragment.append(bead);
    }
    beadLayer.append(fragment);
  }

  /* Material samples follow light locally instead of tilting whole rows. */
  if (finePointer && !reducedMotion) {
    root.querySelectorAll('[data-treatment]').forEach((row) => {
      if (!(row instanceof HTMLElement)) return;
      const sample = row.querySelector('[data-sample]');
      if (!(sample instanceof HTMLElement)) return;

      row.addEventListener('pointermove', (event) => {
        const rect = sample.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        sample.style.setProperty('--cx', `${(x * 100).toFixed(1)}%`);
        sample.style.setProperty('--cy', `${(y * 100).toFixed(1)}%`);
      }, { passive: true });

      row.addEventListener('pointerleave', () => {
        sample.style.removeProperty('--cx');
        sample.style.removeProperty('--cy');
      });
    });
  }

  /* Paint bench: the vertical light cut reveals corrected clearcoat. */
  const bench = root.querySelector('[data-paint-bench]');
  const strip = root.querySelector('[data-paint-strip]');
  if (bench instanceof HTMLElement && strip instanceof HTMLElement && finePointer && !reducedMotion) {
    const surface = strip.querySelector('.paint-strip__surface');
    if (surface instanceof HTMLElement) {
      let target = 64;
      let current = target;
      let raf = 0;

      const tick = () => {
        current = lerp(current, target, .14);
        surface.style.setProperty('--px', `${current.toFixed(2)}%`);
        raf = Math.abs(current - target) > .03 ? requestAnimationFrame(tick) : 0;
      };

      bench.addEventListener('pointermove', (event) => {
        const rect = surface.getBoundingClientRect();
        target = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
    }
  }

  /* Contact surface gets a very faint inspection highlight. */
  const formShell = root.querySelector('[data-form-shell]');
  if (formShell instanceof HTMLElement && finePointer && !reducedMotion) {
    formShell.addEventListener('pointermove', (event) => {
      const rect = formShell.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      formShell.style.setProperty('--form-x', `${(x * 100).toFixed(1)}%`);
      formShell.style.setProperty('--form-y', `${(y * 100).toFixed(1)}%`);
    }, { passive: true });
  }

  /* Before/after gallery. */
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
        const range = project.querySelector('[data-comparison-range]');
        if (range instanceof HTMLInputElement) range.tabIndex = active ? 0 : -1;
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
    select(0);
  });

  /* Lacquer-band service transition + BFCache cleanup. */
  const transition = root.querySelector('[data-transition]');
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
    root.querySelectorAll('[data-service-link]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target === '_blank') return;
        const destination = new URL(link.href, location.href);
        if (destination.origin !== location.origin) return;

        event.preventDefault();
        resetTransition();
        void transition.offsetWidth;
        transition.classList.add('is-active');
        navigationTimer = window.setTimeout(() => {
          navigationTimer = 0;
          location.assign(destination.href);
        }, 540);
      });
    });
  }
})();
