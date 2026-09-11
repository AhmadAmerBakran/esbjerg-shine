(() => {
  'use strict';

  const root = document.querySelector('.shine3d');
  if (!(root instanceof HTMLElement)) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;

  /* ------------------------------------------------------------------------
     Detailing-bay camera / specular response
     --------------------------------------------------------------------- */
  const lab = root.querySelector('.detail-lab');
  if (lab instanceof HTMLElement && finePointer && !reducedMotion) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let targetSpecX = 62;
    let targetSpecY = 28;
    let currentSpecX = 62;
    let currentSpecY = 28;
    let raf = 0;

    const render = () => {
      currentX = lerp(currentX, targetX, .075);
      currentY = lerp(currentY, targetY, .075);
      currentSpecX = lerp(currentSpecX, targetSpecX, .11);
      currentSpecY = lerp(currentSpecY, targetSpecY, .11);

      lab.style.setProperty('--lab-shift-x', `${currentX.toFixed(2)}px`);
      lab.style.setProperty('--lab-shift-y', `${currentY.toFixed(2)}px`);
      root.style.setProperty('--real-spec-x', `${currentSpecX.toFixed(2)}%`);
      root.style.setProperty('--real-spec-y', `${currentSpecY.toFixed(2)}%`);

      const moving = Math.abs(currentX - targetX) > .02 ||
        Math.abs(currentY - targetY) > .02 ||
        Math.abs(currentSpecX - targetSpecX) > .03 ||
        Math.abs(currentSpecY - targetSpecY) > .03;

      raf = moving ? requestAnimationFrame(render) : 0;
    };

    const requestRender = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    lab.addEventListener('pointermove', (event) => {
      const rect = lab.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      targetX = (x - .5) * 8;
      targetY = (y - .5) * 5;
      targetSpecX = 23 + x * 58;
      targetSpecY = 15 + y * 42;
      requestRender();
    }, { passive: true });

    lab.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      targetSpecX = 62;
      targetSpecY = 28;
      requestRender();
    });
  }

  /* ------------------------------------------------------------------------
     Water beads on paint. These are intentionally sparse and slow: a few
     convincing droplets read as more physical than hundreds of particles.
     --------------------------------------------------------------------- */
  const car = root.querySelector('.detail-lab__car');
  if (car instanceof HTMLElement && !reducedMotion && !car.querySelector('.real-droplet')) {
    const fragment = document.createDocumentFragment();
    const drops = 18;

    for (let index = 0; index < drops; index += 1) {
      const drop = document.createElement('i');
      drop.className = 'real-droplet';

      const x = 19 + ((index * 37) % 68);
      const y = 23 + ((index * 19) % 40);
      const size = 3.4 + ((index * 11) % 8) * .58;
      const opacity = .36 + ((index * 7) % 7) * .065;
      const speed = 6.4 + ((index * 13) % 8) * .72;
      const delay = -((index * 17) % 10) * .73;
      const rotation = -17 + ((index * 23) % 35);

      drop.style.setProperty('--drop-x', `${x}%`);
      drop.style.setProperty('--drop-y', `${y}%`);
      drop.style.setProperty('--drop-size', `${size.toFixed(1)}px`);
      drop.style.setProperty('--drop-opacity', opacity.toFixed(2));
      drop.style.setProperty('--drop-speed', `${speed.toFixed(2)}s`);
      drop.style.setProperty('--drop-delay', `${delay.toFixed(2)}s`);
      drop.style.setProperty('--drop-rot', `${rotation}deg`);
      fragment.append(drop);
    }

    car.append(fragment);
  }

  /* ------------------------------------------------------------------------
     Wash-transition streaks. They live inside the existing transition, so the
     same cleanup logic in three-d-site.js still owns the navigation lifecycle.
     --------------------------------------------------------------------- */
  const wash = root.querySelector('[data-wash-transition]');
  if (wash instanceof HTMLElement && !reducedMotion && !wash.querySelector('.real-transition-drop')) {
    const fragment = document.createDocumentFragment();
    const dropCount = 24;

    for (let index = 0; index < dropCount; index += 1) {
      const drop = document.createElement('i');
      drop.className = 'real-transition-drop';
      const x = 3 + ((index * 43) % 95);
      const size = 3 + ((index * 17) % 8);
      const speed = .48 + ((index * 19) % 8) * .055;
      const delay = ((index * 11) % 13) * .018;
      drop.style.setProperty('--td-x', `${x}%`);
      drop.style.setProperty('--td-size', `${size}px`);
      drop.style.setProperty('--td-speed', `${speed.toFixed(2)}s`);
      drop.style.setProperty('--td-delay', `${delay.toFixed(3)}s`);
      fragment.append(drop);
    }

    wash.append(fragment);
  }

  /* ------------------------------------------------------------------------
     Form behaves more like a physical illuminated console.
     --------------------------------------------------------------------- */
  const formShell = root.querySelector('.contact3d__form');
  if (formShell instanceof HTMLElement) {
    if (!formShell.querySelector('.form-specular')) {
      const specular = document.createElement('i');
      specular.className = 'form-specular';
      specular.setAttribute('aria-hidden', 'true');
      formShell.prepend(specular);
    }

    if (finePointer && !reducedMotion) {
      formShell.addEventListener('pointermove', (event) => {
        const rect = formShell.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        formShell.style.setProperty('--form-light-x', `${(x * 100).toFixed(1)}%`);
        formShell.style.setProperty('--form-light-y', `${(y * 100).toFixed(1)}%`);
      }, { passive: true });
    }

    formShell.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!(field instanceof HTMLElement)) return;
      field.addEventListener('pointermove', (event) => {
        const rect = field.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        field.style.setProperty('--field-x', `${(x * 100).toFixed(1)}%`);
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------------
     Tactile buttons: tiny magnetic response, deliberately restrained.
     --------------------------------------------------------------------- */
  if (finePointer && !reducedMotion) {
    root.querySelectorAll('.button, .ba-arrow').forEach((button) => {
      if (!(button instanceof HTMLElement)) return;

      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        button.style.translate = `${(x * 2.6).toFixed(2)}px ${(y * 1.9).toFixed(2)}px`;
      }, { passive: true });

      button.addEventListener('pointerleave', () => {
        button.style.removeProperty('translate');
      });
    });
  }

  /* ------------------------------------------------------------------------
     Service cards: realistic light follows the pointer independently of the
     existing 3D tilt. No extra transforms are applied here, so the two layers
     do not fight each other.
     --------------------------------------------------------------------- */
  if (finePointer && !reducedMotion) {
    root.querySelectorAll('.service3d').forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        card.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------------
     Scroll depth. A very small shift sells the feeling of a real camera dolly
     without turning the site into a parallax demo.
     --------------------------------------------------------------------- */
  if (!reducedMotion) {
    let pending = false;
    const updateScrollDepth = () => {
      pending = false;
      const viewport = Math.max(innerHeight, 1);
      const depth = clamp(scrollY / viewport, 0, 1.4);
      root.style.setProperty('--real-depth', depth.toFixed(4));
    };

    addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(updateScrollDepth);
    }, { passive: true });

    updateScrollDepth();
  }
})();
