(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const creativeHome = body.classList.contains('creative-home');

  const header = doc.querySelector('[data-header]');
  let scrollFrame = 0;
  const updateScrollState = () => {
    scrollFrame = 0;
    header?.classList.toggle('is-scrolled', scrollY > 18);
    if (creativeHome) {
      const scrollable = Math.max(1, doc.documentElement.scrollHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, scrollY / scrollable));
      body.style.setProperty('--scroll-progress', progress.toFixed(4));
    }
  };
  const requestScrollState = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateScrollState);
  };
  updateScrollState();
  addEventListener('scroll', requestScrollState, { passive: true });
  addEventListener('resize', requestScrollState, { passive: true });

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
    }, { rootMargin: '100px 0px -5% 0px', threshold: 0.07 });
    revealItems.forEach((item) => observer.observe(item));
  }

  if (creativeHome && !reducedMotion && finePointer) {
    let pointerFrame = 0;
    let pointerX = innerWidth / 2;
    let pointerY = innerHeight * 0.28;
    const paintPointer = () => {
      pointerFrame = 0;
      body.style.setProperty('--mx', `${pointerX}px`);
      body.style.setProperty('--my', `${pointerY}px`);
    };
    addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
    }, { passive: true });

    doc.querySelectorAll('[data-tilt]').forEach((element) => {
      let tiltFrame = 0;
      let nextX = 0;
      let nextY = 0;
      const paintTilt = () => {
        tiltFrame = 0;
        element.style.setProperty('--rx', `${nextY.toFixed(2)}deg`);
        element.style.setProperty('--ry', `${nextX.toFixed(2)}deg`);
      };
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        nextX = x * 4.2;
        nextY = y * -3.2;
        if (!tiltFrame) tiltFrame = requestAnimationFrame(paintTilt);
      }, { passive: true });
      element.addEventListener('pointerleave', () => {
        nextX = 0;
        nextY = 0;
        if (!tiltFrame) tiltFrame = requestAnimationFrame(paintTilt);
      }, { passive: true });
    });
  }

  doc.querySelectorAll('[data-comparison]').forEach((comparison) => {
    const range = comparison.querySelector('[data-comparison-range]');
    if (!(range instanceof HTMLInputElement)) return;
    const update = () => comparison.style.setProperty('--position', `${range.value}%`);
    range.addEventListener('input', update, { passive: true });
    update();
  });

  doc.querySelectorAll('[data-comparison-gallery]').forEach((gallery) => {
    const sets = [...gallery.querySelectorAll('[data-comparison-set]')];
    const dots = [...gallery.querySelectorAll('[data-comparison-dot]')];
    const previous = gallery.querySelector('[data-comparison-prev]');
    const next = gallery.querySelector('[data-comparison-next]');
    const title = gallery.querySelector('[data-comparison-title]');
    const counter = gallery.querySelector('[data-comparison-counter]');
    if (!sets.length) return;

    let active = Math.max(0, sets.findIndex((set) => set.classList.contains('is-active')));
    const show = (index) => {
      active = (index + sets.length) % sets.length;
      sets.forEach((set, setIndex) => {
        const isActive = setIndex === active;
        set.classList.toggle('is-active', isActive);
        set.setAttribute('aria-hidden', String(!isActive));
        const range = set.querySelector('[data-comparison-range]');
        if (range instanceof HTMLInputElement) range.tabIndex = isActive ? 0 : -1;
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === active;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-pressed', String(isActive));
      });
      const activeSet = sets[active];
      if (title) title.textContent = activeSet.getAttribute('data-title') || `Eksempel ${active + 1}`;
      if (counter) counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(sets.length).padStart(2, '0')}`;
    };

    previous?.addEventListener('click', () => show(active - 1));
    next?.addEventListener('click', () => show(active + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));
    show(active);
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
