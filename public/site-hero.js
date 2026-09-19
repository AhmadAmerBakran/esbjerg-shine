(() => {
  'use strict';

  const doc = document;
  const hero = doc.querySelector('[data-hero-media]');
  if (!(hero instanceof HTMLElement)) return;

  const poster = hero.querySelector('[data-hero-poster]');
  const video = hero.querySelector('[data-hero-video]');
  const compactHero = matchMedia('(max-width: 980px)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;

  let mediaNear = false;
  let videoRequested = false;
  let videoWanted = compactHero;

  const loadPoster = () => {
    if (!(poster instanceof HTMLImageElement)) return;
    const src = poster.dataset.src;
    if (!src || poster.getAttribute('src')) return;
    poster.addEventListener('load', () => poster.classList.add('is-loaded'), { once: true });
    poster.src = src;
    if (poster.complete && poster.naturalWidth > 0) poster.classList.add('is-loaded');
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
    loadPoster();
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

    if (compactHero) {
      requestVideo();
    } else {
      addEventListener('pointerdown', requestVideo, { once: true, passive: true });
      addEventListener('touchstart', requestVideo, { once: true, passive: true });
      addEventListener('keydown', requestVideo, { once: true });
      addEventListener('wheel', requestVideo, { once: true, passive: true });

      const scheduleVideo = () => setTimeout(requestVideo, 4000);
      if (doc.readyState === 'complete') scheduleVideo();
      else addEventListener('load', scheduleVideo, { once: true });
    }

    doc.addEventListener('visibilitychange', () => {
      if (!doc.hidden && videoWanted) loadVideo();
    });
  }
})();
