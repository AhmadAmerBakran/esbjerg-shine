(() => {
  'use strict';

  const doc = document;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const syncMediaImage = (image) => {
    if (!(image instanceof HTMLImageElement)) return;
    const loaded = !image.hidden && image.complete && image.naturalWidth > 0;
    image.classList.toggle('is-loaded', loaded);
    image.closest('[data-media-slot]')?.classList.toggle('has-media', loaded);
  };

  doc.querySelectorAll('[data-media-image]').forEach((image) => {
    if (!(image instanceof HTMLImageElement)) return;
    image.addEventListener('load', () => syncMediaImage(image));
    image.addEventListener('error', () => syncMediaImage(image));
    syncMediaImage(image);
  });

  const revealItems = [...doc.querySelectorAll('.reveal:not(.is-visible)')];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '80px 0px -4% 0px', threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  }

  doc.querySelectorAll('[data-comparison]').forEach((comparison) => {
    const range = comparison.querySelector('[data-comparison-range]');
    if (!(range instanceof HTMLInputElement)) return;
    const update = () => comparison.style.setProperty('--position', `${range.value}%`);
    range.addEventListener('input', update, { passive: true });
    update();
  });

  doc.querySelectorAll('[data-comparison-gallery]').forEach((gallery) => {
    const comparison = gallery.querySelector('[data-comparison]');
    const range = gallery.querySelector('[data-comparison-range]');
    const beforeImage = gallery.querySelector('[data-comparison-before-image]');
    const afterImage = gallery.querySelector('[data-comparison-after-image]');
    const buttons = [...gallery.querySelectorAll('[data-comparison-set]')];
    const prev = gallery.querySelector('[data-comparison-prev]');
    const next = gallery.querySelector('[data-comparison-next]');
    if (!(gallery instanceof HTMLElement) || !(comparison instanceof HTMLElement) || buttons.length === 0) return;

    const setComparisonImage = (image, src) => {
      if (!(image instanceof HTMLImageElement)) return;
      image.classList.remove('is-loaded');
      if (src) {
        image.hidden = false;
        if (image.getAttribute('src') !== src) image.src = src;
      } else {
        image.hidden = true;
        image.removeAttribute('src');
      }
      syncMediaImage(image);
    };

    const parsedInitial = Number.parseInt(gallery.dataset.initialSet || '0', 10);
    let active = Number.isFinite(parsedInitial) ? Math.min(Math.max(parsedInitial, 0), buttons.length - 1) : 0;

    const show = (index) => {
      active = (index + buttons.length) % buttons.length;
      comparison.dataset.activeSet = String(active);
      buttons.forEach((button, buttonIndex) => {
        const selected = buttonIndex === active;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });

      const activeButton = buttons[active];
      if (activeButton instanceof HTMLElement) {
        setComparisonImage(beforeImage, activeButton.dataset.before || '');
        setComparisonImage(afterImage, activeButton.dataset.after || '');
      }

      if (range instanceof HTMLInputElement) {
        range.value = '52';
        comparison.style.setProperty('--position', '52%');
      }
    };

    buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
    prev?.addEventListener('click', () => show(active - 1));
    next?.addEventListener('click', () => show(active + 1));
    show(active);
  });

  doc.querySelectorAll('[data-map-load]').forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    const frame = button.closest('[data-map-frame]');
    const src = button.dataset.mapSrc;
    if (!(frame instanceof HTMLElement) || !src) return;

    button.addEventListener('click', () => {
      const iframe = doc.createElement('iframe');
      iframe.title = 'Kort til Esbjerg Shine på Randersvej 26 i Esbjerg';
      iframe.src = src;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
    }, { once: true });
  });

  doc.querySelectorAll('[data-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });

  const form = doc.querySelector('[data-contact-form]');
  if (!(form instanceof HTMLFormElement)) return;

  const startedAt = form.querySelector('[data-started-at]');
  if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());

  const serviceFromUrl = new URL(location.href).searchParams.get('service');
  if (serviceFromUrl) {
    const select = form.elements.namedItem('ydelse');
    if (select instanceof HTMLSelectElement) {
      const matchingOption = [...select.options].find((option) => option.value.toLocaleLowerCase('da-DK') === serviceFromUrl.toLocaleLowerCase('da-DK'));
      if (matchingOption) select.value = matchingOption.value;
    }
  }

  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const turnstileSiteKey = form.dataset.turnstileSitekey || '';
  const turnstileWidget = form.querySelector('.cf-turnstile');
  const setStatus = (text, state = '') => {
    if (status) {
      status.textContent = text;
      status.setAttribute('data-state', state);
    }
  };

  const resetTurnstile = () => {
    const api = window.turnstile;
    if (!api?.reset || !(turnstileWidget instanceof HTMLElement)) return;
    try { api.reset(turnstileWidget); } catch { /* Widget may not have rendered yet. */ }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (!turnstileSiteKey) {
      setStatus('Sikkerhedstjekket er ikke konfigureret. Ring gerne på +45 91 81 89 90.', 'error');
      return;
    }

    const data = new FormData(form);
    const turnstileToken = String(data.get('turnstileToken') || '');
    if (!turnstileToken) {
      setStatus('Sikkerhedstjekket er ikke klar endnu. Prøv igen om et øjeblik.', 'error');
      return;
    }

    const payload = {
      navn: String(data.get('navn') || ''),
      telefon: String(data.get('telefon') || ''),
      email: String(data.get('email') || ''),
      ydelse: String(data.get('ydelse') || ''),
      besked: String(data.get('besked') || ''),
      website: String(data.get('website') || ''),
      turnstileToken,
      startedAt: Number(data.get('startedAt') || 0),
      samtykke: data.get('samtykke') === 'on'
    };

    if (submit instanceof HTMLButtonElement) submit.disabled = true;
    setStatus('Sender din forespørgsel…');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        if (result.code === 'rate_limited') throw new Error('rate_limited');
        if (result.code === 'turnstile') throw new Error('turnstile');
        if (result.code === 'security_unavailable') throw new Error('security_unavailable');
        if (result.code === 'not_configured') throw new Error('not_configured');
        throw new Error('send_failed');
      }

      form.reset();
      if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
      setStatus('Tak. Din forespørgsel er sendt, og Esbjerg Shine vender tilbage hurtigst muligt.', 'success');
    } catch (error) {
      let message = 'Formularen kan ikke sende lige nu. Ring gerne på +45 91 81 89 90.';
      if (error instanceof Error && error.message === 'rate_limited') {
        message = 'Der er sendt flere forespørgsler på kort tid. Vent et øjeblik og prøv igen.';
      } else if (error instanceof Error && error.message === 'turnstile') {
        message = 'Sikkerhedstjekket udløb eller kunne ikke godkendes. Prøv igen.';
      }
      setStatus(message, 'error');
    } finally {
      clearTimeout(timeout);
      resetTurnstile();
      if (submit instanceof HTMLButtonElement) submit.disabled = false;
    }
  });
})();
