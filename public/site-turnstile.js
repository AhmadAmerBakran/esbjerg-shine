(() => {
  'use strict';

  const form = document.querySelector('[data-contact-form]');
  if (!(form instanceof HTMLFormElement) || !form.dataset.turnstileSitekey) return;

  let requested = false;
  const loadTurnstile = () => {
    if (requested || window.turnstile) return;
    requested = true;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileLoader = 'true';
    script.addEventListener('error', () => {
      requested = false;
      script.remove();
    }, { once: true });
    document.head.append(script);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadTurnstile();
      },
      { rootMargin: '700px 0px', threshold: 0 }
    );
    observer.observe(form);
  }

  form.addEventListener('focusin', loadTurnstile, { once: true });
  form.addEventListener('pointerdown', loadTurnstile, { once: true, passive: true });
  form.addEventListener('touchstart', loadTurnstile, { once: true, passive: true });

  if (form.matches(':focus-within')) loadTurnstile();
})();
