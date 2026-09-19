(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;

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

  const syncHeroImage = (image) => {
    if (!(image instanceof HTMLImageElement)) return;
    const loaded = !image.hidden && image.complete && image.naturalWidth > 0;
    image.classList.toggle('is-loaded', loaded);
    image.closest('[data-media-slot]')?.classList.toggle('has-media', loaded);
  };

  doc.querySelectorAll('.hero [data-media-image]').forEach((image) => {
    if (!(image instanceof HTMLImageElement)) return;
    image.addEventListener('load', () => syncHeroImage(image));
    image.addEventListener('error', () => syncHeroImage(image));
    syncHeroImage(image);
  });

  // The hero is the only reveal content needed for first paint. Keep its existing
  // entrance behavior without initializing observers for the rest of the page yet.
  const heroReveal = [...doc.querySelectorAll('.hero .reveal')];
  if (reducedMotion) {
    heroReveal.forEach((item) => item.classList.add('is-visible'));
  } else if (heroReveal.length) {
    requestAnimationFrame(() => heroReveal.forEach((item) => item.classList.add('is-visible')));
  }

  doc.querySelectorAll('[data-hero-media]').forEach((hero) => {
    const poster = hero.querySelector('[data-hero-poster]');
    const video = hero.querySelector('[data-hero-video]');
    if (!(hero instanceof HTMLElement)) return;

    const compactHero = matchMedia('(max-width: 980px)').matches;
    let mediaNear = false;
    let videoRequested = false;
    let videoWanted = false;

    const loadPoster = () => {
      if (!(poster instanceof HTMLImageElement)) return;
      const src = poster.dataset.src;
      if (!src || poster.getAttribute('src')) return;
      poster.src = src;
      poster.addEventListener('load', () => syncHeroImage(poster), { once: true });
    };

    const activateVideo = async () => {
      if (!(video instanceof HTMLVideoElement) || reducedMotion || saveData) {
        video?.pause();
        hero.classList.remove('has-video');
        return;
      }
      try {
        await video.play();
        hero.classList.add('has-video');
      } catch {
        hero.classList.remove('has-video');
      }
    };

    const loadVideo = () => {
      if (!(video instanceof HTMLVideoElement) || videoRequested || reducedMotion || saveData || !mediaNear || doc.hidden) return;
      const sources = [...video.querySelectorAll('source[data-src]')];
      if (sources.length === 0) return;

      videoRequested = true;
      sources.forEach((source) => {
        if (!(source instanceof HTMLSourceElement)) return;
        const src = source.dataset.src;
        if (src) source.src = src;
      });
      video.addEventListener('loadeddata', activateVideo, { once: true });
      video.load();
    };

    const requestVideo = () => {
      videoWanted = true;
      if (mediaNear) loadPoster();
      loadVideo();
    };

    const markNear = () => {
      mediaNear = true;
      if (!compactHero || videoWanted) loadPoster();
      if (videoWanted) loadVideo();
    };

    if ('IntersectionObserver' in window) {
      const mediaObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        markNear();
        mediaObserver.disconnect();
      }, { rootMargin: '160px 0px', threshold: 0.01 });
      mediaObserver.observe(hero);
    } else {
      markNear();
    }

    if (!compactHero) loadPoster();

    if (video instanceof HTMLVideoElement) {
      video.addEventListener('error', () => hero.classList.remove('has-video'));
      addEventListener('pointerdown', requestVideo, { once: true, passive: true });
      addEventListener('touchstart', requestVideo, { once: true, passive: true });
      addEventListener('keydown', requestVideo, { once: true });
      addEventListener('wheel', requestVideo, { once: true, passive: true });

      if (!compactHero) {
        const scheduleVideo = () => setTimeout(requestVideo, 4000);
        if (doc.readyState === 'complete') scheduleVideo();
        else addEventListener('load', scheduleVideo, { once: true });
      }

      doc.addEventListener('visibilitychange', () => {
        if (!doc.hidden && videoWanted) loadVideo();
      });
    }
  });

  let deferredLoading = false;
  const loadDeferred = () => {
    if (deferredLoading) return;
    deferredLoading = true;
    const script = doc.createElement('script');
    script.src = '/site-deferred.js';
    script.async = true;
    doc.head.append(script);
  };

  // Any real interaction happens before the user can reach an interactive
  // below-fold component, so those handlers are ready when needed.
  addEventListener('pointerdown', loadDeferred, { once: true, passive: true });
  addEventListener('touchstart', loadDeferred, { once: true, passive: true });
  addEventListener('keydown', loadDeferred, { once: true });
  addEventListener('wheel', loadDeferred, { once: true, passive: true });

  if (location.hash || scrollY > 40 || new URL(location.href).searchParams.has('service')) {
    loadDeferred();
  } else {
    setTimeout(loadDeferred, 15000);
  }
})();
