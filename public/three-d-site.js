(() => {
  'use strict';

  const root = document.querySelector('.shine3d');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reducedMotion) {
    addEventListener('pointermove', (event) => {
      root.style.setProperty('--pointer-x', `${event.clientX}px`);
      root.style.setProperty('--pointer-y', `${event.clientY}px`);
    }, { passive: true });
  }

  const revealItems = [...root.querySelectorAll('.s3-reveal')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '90px 0px -6% 0px', threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const scene = root.querySelector('[data-hero-scene]');
  if (scene instanceof HTMLElement && finePointer && !reducedMotion) {
    scene.addEventListener('pointermove', (event) => {
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      scene.style.setProperty('--scene-ry', `${x * 12}deg`);
      scene.style.setProperty('--scene-rx', `${-3 - y * 8}deg`);
    }, { passive: true });
    scene.addEventListener('pointerleave', () => {
      scene.style.setProperty('--scene-ry', '6deg');
      scene.style.setProperty('--scene-rx', '-3deg');
    });
  }

  if (finePointer && !reducedMotion) {
    root.querySelectorAll('[data-tilt]').forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--ty', `${(x - 0.5) * 8}deg`);
        card.style.setProperty('--tx', `${(0.5 - y) * 7}deg`);
        card.style.setProperty('--glow-x', `${x * 100}%`);
        card.style.setProperty('--glow-y', `${y * 100}%`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ty', '0deg');
        card.style.setProperty('--tx', '0deg');
        card.style.removeProperty('--glow-x');
        card.style.removeProperty('--glow-y');
      });
    });
  }

  const servicesSection = root.querySelector('[data-services-3d]');
  if (servicesSection instanceof HTMLElement && !reducedMotion && 'IntersectionObserver' in window) {
    const rinseObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      servicesSection.classList.add('is-rinsing');
      rinseObserver.disconnect();
    }, { threshold: 0.2 });
    rinseObserver.observe(servicesSection);
  }

  const washTransition = root.querySelector('[data-wash-transition]');
  if (washTransition instanceof HTMLElement && !reducedMotion) {
    root.querySelectorAll('[data-service-link]').forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target === '_blank') return;
        const destination = new URL(link.href, location.href);
        if (destination.origin !== location.origin) return;

        event.preventDefault();
        washTransition.classList.remove('is-active');
        void washTransition.offsetWidth;
        washTransition.classList.add('is-active');
        setTimeout(() => location.assign(destination.href), 720);
      });
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
    gallery.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' && event.target instanceof HTMLButtonElement) select(current - 1);
      if (event.key === 'ArrowRight' && event.target instanceof HTMLButtonElement) select(current + 1);
    });
  });
})();
