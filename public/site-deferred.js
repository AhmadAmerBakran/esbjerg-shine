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
    const update = () => {
      const before = Number(range.value);
      comparison.style.setProperty('--position', `${before}%`);
      range.setAttribute('aria-valuetext', `${before} procent før og ${100 - before} procent efter`);
    };
    range.addEventListener('input', update, { passive: true });
    update();
  });

  doc.querySelectorAll('[data-comparison-gallery]').forEach((gallery) => {
    const comparison = gallery.querySelector('[data-comparison]');
    const range = gallery.querySelector('[data-comparison-range]');
    const beforeImage = gallery.querySelector('[data-comparison-before-image]');
    const afterImage = gallery.querySelector('[data-comparison-after-image]');
    const status = gallery.querySelector('[data-comparison-status]');
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

    const show = (index, announce = true) => {
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
        if (status && announce) status.textContent = `Viser ${activeButton.dataset.label || 'valgt behandling'}.`;
      }

      if (range instanceof HTMLInputElement) {
        range.value = '52';
        comparison.style.setProperty('--position', '52%');
        range.setAttribute('aria-valuetext', '52 procent før og 48 procent efter');
      }
    };

    buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
    prev?.addEventListener('click', () => show(active - 1));
    next?.addEventListener('click', () => show(active + 1));
    show(active, false);
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
      iframe.tabIndex = 0;
      frame.replaceChildren(iframe);
      requestAnimationFrame(() => iframe.focus());
    }, { once: true });
  });

  doc.querySelectorAll('[data-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });

  const form = doc.querySelector('[data-contact-form]');
  if (!(form instanceof HTMLFormElement)) return;

  const startedAt = form.querySelector('[data-started-at]');
  const submissionId = form.querySelector('[data-submission-id]');
  const fallback = form.querySelector('[data-mail-fallback]');
  const fallbackLink = form.querySelector('[data-mail-fallback-link]');
  const contactEmail = form.dataset.contactEmail || 'info@esbjergshine.dk';
  const createSubmissionId = () => {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
  const renewSubmissionId = () => {
    if (submissionId instanceof HTMLInputElement) submissionId.value = createSubmissionId();
  };
  const hideFallback = () => {
    if (fallback instanceof HTMLElement) fallback.hidden = true;
  };
  const showFallback = (payload) => {
    if (!(fallback instanceof HTMLElement) || !(fallbackLink instanceof HTMLAnchorElement)) return;
    const subject = `Forespørgsel – ${payload.ydelse || 'bilpleje'}`;
    const body = [
      'Hej Esbjerg Shine,', '',
      'Jeg vil gerne sende følgende forespørgsel:', '',
      `Navn: ${payload.navn}`,
      `Telefon: ${payload.telefon || 'Ikke oplyst'}`,
      `E-mail: ${payload.email}`,
      `Ydelse: ${payload.ydelse}`, '',
      'Besked:', payload.besked, '',
      'Venlig hilsen', payload.navn
    ].join('\n');
    fallbackLink.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    fallback.hidden = false;
  };

  if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
  renewSubmissionId();

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
  const setStatus = (text, state = '', focus = false) => {
    if (!(status instanceof HTMLElement)) return;
    status.textContent = text;
    status.setAttribute('data-state', state);
    const isError = state === 'error';
    status.setAttribute('role', isError ? 'alert' : 'status');
    status.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    if (focus && text) requestAnimationFrame(() => status.focus());
  };

  const controls = [...form.querySelectorAll('input, select, textarea')];
  controls.forEach((control) => {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return;
    control.addEventListener('invalid', () => control.setAttribute('aria-invalid', 'true'));
    const clearInvalid = () => {
      if (control.checkValidity()) control.removeAttribute('aria-invalid');
    };
    control.addEventListener('input', clearInvalid);
    control.addEventListener('change', clearInvalid);

    if (!(control instanceof HTMLInputElement) || control.type !== 'hidden') {
      const markChanged = () => {
        hideFallback();
        renewSubmissionId();
      };
      control.addEventListener('input', markChanged);
      control.addEventListener('change', markChanged);
    }
  });

  const resetTurnstile = () => {
    const widget = form.querySelector('.cf-turnstile');
    const api = window.turnstile;
    if (!api?.reset || !(widget instanceof HTMLElement)) return;
    try { api.reset(widget); } catch { /* Widget may not have rendered yet. */ }
  };

  const systemFailureCodes = new Set([
    'security_unavailable',
    'not_configured',
    'delivery_unavailable',
    'delivery_failed',
    'send_failed',
    'network_error'
  ]);
  const handledFailureCodes = new Set([
    ...systemFailureCodes,
    'rate_limited',
    'turnstile',
    'required',
    'invalid',
    'too_fast',
    'origin',
    'content_type',
    'invalid_body',
    'invalid_json',
    'too_large'
  ]);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFallback();

    if (!form.checkValidity()) {
      setStatus('Tjek de markerede felter, og udfyld de oplysninger der mangler.', 'error');
      form.reportValidity();
      return;
    }

    if (!turnstileSiteKey) {
      setStatus(`Sikkerhedstjekket er ikke konfigureret. Skriv til ${contactEmail} eller ring på +45 91 81 89 90.`, 'error', true);
      const data = new FormData(form);
      showFallback({
        navn: String(data.get('navn') || ''),
        telefon: String(data.get('telefon') || ''),
        email: String(data.get('email') || ''),
        ydelse: String(data.get('ydelse') || ''),
        besked: String(data.get('besked') || '')
      });
      return;
    }

    const data = new FormData(form);
    const turnstileToken = String(data.get('turnstileToken') || '');
    if (!turnstileToken) {
      setStatus('Sikkerhedstjekket er ikke klar endnu. Prøv igen om et øjeblik.', 'error', true);
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
      submissionId: String(data.get('submissionId') || ''),
      startedAt: Number(data.get('startedAt') || 0),
      samtykke: data.get('samtykke') === 'on'
    };

    if (submit instanceof HTMLButtonElement) {
      submit.disabled = true;
      submit.setAttribute('aria-disabled', 'true');
      submit.setAttribute('aria-busy', 'true');
    }
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

      if (!response.ok || !result.ok) throw new Error(String(result.code || 'send_failed'));

      form.reset();
      controls.forEach((control) => control.removeAttribute('aria-invalid'));
      if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
      renewSubmissionId();
      hideFallback();
      setStatus(result.duplicate
        ? 'Forespørgslen var allerede modtaget. Du behøver ikke sende den igen.'
        : 'Tak. Din forespørgsel er sendt, og Esbjerg Shine vender tilbage hurtigst muligt.', 'success', true);
    } catch (error) {
      const rawCode = error instanceof Error
        ? (error.name === 'AbortError' ? 'network_error' : error.message)
        : 'network_error';
      const code = handledFailureCodes.has(rawCode) ? rawCode : 'network_error';
      let message = `Formularen kan ikke sende lige nu. Du kan skrive til ${contactEmail} eller ringe på +45 91 81 89 90.`;

      if (code === 'rate_limited') {
        message = 'Der er sendt flere forespørgsler på kort tid. Vent et øjeblik og prøv igen.';
      } else if (code === 'turnstile') {
        message = 'Sikkerhedstjekket udløb eller kunne ikke godkendes. Prøv igen.';
      } else if (!systemFailureCodes.has(code)) {
        message = 'Forespørgslen kunne ikke sendes. Kontrollér oplysningerne og prøv igen.';
      }

      if (systemFailureCodes.has(code)) {
        showFallback(payload);
        renewSubmissionId();
      }
      setStatus(message, 'error', true);
    } finally {
      clearTimeout(timeout);
      resetTurnstile();
      if (submit instanceof HTMLButtonElement) {
        submit.disabled = false;
        submit.removeAttribute('aria-disabled');
        submit.removeAttribute('aria-busy');
      }
    }
  });
})();
