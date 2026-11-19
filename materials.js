const artwork = [...document.querySelectorAll('.art')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
const visibleArtwork = new Set(artwork);

artwork.forEach((button) => {
  button.addEventListener('pointerenter', (event) => {
    if (hoverPointer.matches && event.pointerType !== 'touch') {
      button.classList.add('is-preview');
    }
  });
  button.addEventListener('pointerleave', () => button.classList.remove('is-preview'));
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    button.classList.remove('is-preview');
    button.setAttribute('aria-pressed', String(pressed));
    button.classList.toggle('is-pressed', pressed);
  });
});

let scheduled = false;
function updateScrollArt() {
  scheduled = false;
  for (const button of visibleArtwork) {
    const bounds = button.getBoundingClientRect();
    const offset = (bounds.top + bounds.height / 2 - innerHeight / 2) / innerHeight;
    const progress = Math.max(-.65, Math.min(.65, offset));
    button.style.setProperty('--scroll-tilt', `${progress * -21}deg`);
    button.style.setProperty('--scroll-shift', `${progress * 33}px`);
  }
}

function scheduleScrollArt() {
  if (scheduled || reducedMotion.matches) return;
  scheduled = true;
  requestAnimationFrame(updateScrollArt);
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle('is-offscreen', !entry.isIntersecting);
      if (entry.isIntersecting) visibleArtwork.add(entry.target);
      else visibleArtwork.delete(entry.target);
    }
    scheduleScrollArt();
  });
  artwork.forEach((button) => observer.observe(button));
}

addEventListener('scroll', scheduleScrollArt, { passive: true });
addEventListener('resize', scheduleScrollArt);
reducedMotion.addEventListener('change', scheduleScrollArt);
scheduleScrollArt();
