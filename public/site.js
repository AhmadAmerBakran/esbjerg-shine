(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
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

  const revealItems = [...doc.querySelectorAll('.reveal')];
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
  const setStatus = (text, state = '') => {
    if (status) {
      status.textContent = text;
      status.setAttribute('data-state', state);
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = {
      navn: String(data.get('navn') || ''),
      telefon: String(data.get('telefon') || ''),
      email: String(data.get('email') || ''),
      ydelse: String(data.get('ydelse') || ''),
      besked: String(data.get('besked') || ''),
      website: String(data.get('website') || ''),
      startedAt: Number(data.get('startedAt') || 0),
      samtykke: data.get('samtykke') === 'on'
    };

    if (submit instanceof HTMLButtonElement) submit.disabled = true;
    setStatus('Sender din forespørgsel…');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        if (result.code === 'not_configured') throw new Error('not_configured');
        if (result.code === 'rate_limited') throw new Error('rate_limited');
        throw new Error('send_failed');
      }

      form.reset();
      if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
      setStatus('Tak. Din forespørgsel er sendt, og Esbjerg Shine vender tilbage hurtigst muligt.', 'success');
    } catch (error) {
      const message = error instanceof Error && error.message === 'rate_limited'
        ? 'Der er netop sendt en forespørgsel. Vent et øjeblik og prøv igen.'
        : 'Formularen kan ikke sende lige nu. Ring gerne på +45 91 81 89 90.';
      setStatus(message, 'error');
    } finally {
      if (submit instanceof HTMLButtonElement) submit.disabled = false;
    }
  });
})();
