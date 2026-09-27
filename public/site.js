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
  const backgroundContent = [...doc.querySelectorAll('main, footer, .skip-link')];
  const menuIsOpen = () => nav?.classList.contains('is-open') === true;
  const setBackgroundInert = (inert) => {
    backgroundContent.forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      element.inert = inert;
      if (inert) element.setAttribute('aria-hidden', 'true');
      else element.removeAttribute('aria-hidden');
    });
  };

  const closeMenu = (restoreFocus = false) => {
    if (!menuIsOpen()) return;
    nav?.classList.remove('is-open');
    body.classList.remove('menu-open');
    setBackgroundInert(false);
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Åbn menu');
    if (restoreFocus && menuButton instanceof HTMLButtonElement) menuButton.focus();
  };

  const openMenu = () => {
    if (!(nav instanceof HTMLElement) || !(menuButton instanceof HTMLButtonElement)) return;
    nav.classList.add('is-open');
    body.classList.add('menu-open');
    setBackgroundInert(true);
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Luk menu');
    requestAnimationFrame(() => {
      const firstLink = nav.querySelector('a[href]');
      if (firstLink instanceof HTMLElement) firstLink.focus();
    });
  };

  menuButton?.addEventListener('click', () => {
    if (menuIsOpen()) closeMenu(false);
    else openMenu();
  });

  nav?.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu(true);
  });

  addEventListener('keydown', (event) => {
    if (!menuIsOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key !== 'Tab' || !(header instanceof HTMLElement)) return;
    const focusable = [...header.querySelectorAll('a[href], button:not([disabled])')].filter(
      (item) => item instanceof HTMLElement && !item.hasAttribute('inert')
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!(first instanceof HTMLElement) || !(last instanceof HTMLElement)) return;

    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  addEventListener(
    'resize',
    () => {
      if (innerWidth > 980) closeMenu(false);
    },
    { passive: true }
  );

  const heroBackground = doc.querySelector('.hero__background-media img');
  if (heroBackground instanceof HTMLImageElement) {
    const syncBackground = () =>
      heroBackground.classList.toggle('is-loaded', heroBackground.complete && heroBackground.naturalWidth > 0);
    heroBackground.addEventListener('load', syncBackground, { once: true });
    syncBackground();
  }

  const lazyMedia = [...doc.querySelectorAll('[data-lazy-media]')];
  const activateLazyMedia = (picture) => {
    if (!(picture instanceof HTMLPictureElement)) return;

    picture.querySelectorAll('source[data-srcset]').forEach((source) => {
      if (!(source instanceof HTMLSourceElement)) return;
      const srcset = source.dataset.srcset;
      if (srcset) source.srcset = srcset;
      delete source.dataset.srcset;
    });

    const image = picture.querySelector('img[data-src]');
    if (image instanceof HTMLImageElement) {
      const syncImage = () => {
        const loaded = image.complete && image.naturalWidth > 0;
        image.classList.toggle('is-loaded', loaded);
        picture.closest('[data-media-slot]')?.classList.toggle('has-media', loaded);
      };
      image.addEventListener('load', syncImage, { once: true });
      const src = image.dataset.src;
      if (src) image.src = src;
      delete image.dataset.src;
      syncImage();
    }

    picture.removeAttribute('data-lazy-media');
  };

  if (lazyMedia.length) {
    if ('IntersectionObserver' in window) {
      const lazyMediaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            lazyMediaObserver.unobserve(entry.target);
            activateLazyMedia(entry.target);
          });
        },
        { rootMargin: '160px 0px', threshold: 0.01 }
      );
      lazyMedia.forEach((picture) => lazyMediaObserver.observe(picture));
    } else {
      lazyMedia.forEach(activateLazyMedia);
    }
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
