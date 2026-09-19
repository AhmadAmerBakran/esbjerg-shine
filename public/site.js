(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  const compactHero = matchMedia('(max-width: 980px)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = doc.querySelector('[data-header]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 18);
  updateHeader();
  addEventListener('scroll', updateHeader, { passive: true });

  const menuButton = doc.querySelector('[data-menu-button]');
  const nav = doc.querySelector('[data-nav]');
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    body.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Åbn menu');
  };

  menuButton?.addEventListener('click', () => {
    const open = !nav?.classList.contains('is-open');
    nav?.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Luk menu' : 'Åbn menu');
  });
  nav?.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });
  addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

  const heroBackground = doc.querySelector('.hero__background-media > img');
  if (heroBackground instanceof HTMLImageElement) {
    const syncBackground = () => heroBackground.classList.toggle('is-loaded', heroBackground.complete && heroBackground.naturalWidth > 0);
    heroBackground.addEventListener('load', syncBackground, { once: true });
    syncBackground();
  }

  const heroReveal = [...doc.querySelectorAll('.hero .reveal')];
  if (reducedMotion) {
    heroReveal.forEach((item) => item.classList.add('is-visible'));
  } else if (heroReveal.length) {
    requestAnimationFrame(() => heroReveal.forEach((item) => item.classList.add('is-visible')));
  }

  const loadedScripts = new Set();
  const loadScript = (src) => {
    if (loadedScripts.has(src)) return;
    loadedScripts.add(src);
    const script = doc.createElement('script');
    script.src = src;
    script.async = true;
    doc.head.append(script);
  };

  const loadDeferred = () => loadScript('/site-deferred.js');
  const loadHeroMedia = () => loadScript('/site-hero.js');
  const loadInteractive = () => {
    loadDeferred();
    if (compactHero) loadHeroMedia();
  };

  // Desktop keeps the existing poster/video experience. Compact layouts keep
  // the media card off the critical path until the visitor actually interacts.
  if (!compactHero) loadHeroMedia();

  addEventListener('pointerdown', loadInteractive, { once: true, passive: true });
  addEventListener('touchstart', loadInteractive, { once: true, passive: true });
  addEventListener('keydown', loadInteractive, { once: true });
  addEventListener('wheel', loadInteractive, { once: true, passive: true });

  if (location.hash || scrollY > 40 || new URL(location.href).searchParams.has('service')) {
    loadDeferred();
  } else {
    setTimeout(loadDeferred, 15000);
  }
})();
