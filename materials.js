const artwork = [...document.querySelectorAll('.art')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
const visibleArtwork = new Set(artwork);
const root = document.documentElement;
const siteHeader = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const heroStage = document.querySelector('.hero-stage');
const heroArt = document.querySelector('.hero-art');
const motionToggle = document.querySelector('.motion-toggle');
let motionOverride;

function motionEnabled() {
  return motionOverride ?? !reducedMotion.matches;
}

function applyMotionPreference() {
  const enabled = motionEnabled();
  root.classList.toggle('motion-on', enabled);
  root.classList.toggle('motion-paused', !enabled);
  motionToggle.textContent = enabled ? 'إيقاف الحركة' : 'تشغيل الأنيميشن 3D';
  motionToggle.hidden = false;
  scheduleScrollArt();
}

motionToggle.addEventListener('click', () => {
  const before = hero.getBoundingClientRect().bottom;
  motionOverride = !motionEnabled();
  applyMotionPreference();
  if (before <= 0) {
    const after = hero.getBoundingClientRect().bottom;
    scrollBy({ top: after - before, behavior: 'instant' });
  }
});

artwork.forEach((button) => {
  button.addEventListener('pointerenter', (event) => {
    if (hoverPointer.matches && event.pointerType !== 'touch') {
      button.classList.add('is-preview');
    }
  });
  button.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !root.classList.contains('motion-on')) return;
    const box = button.getBoundingClientRect();
    button.style.setProperty('--pointer-rx', `${clamp((event.clientY - box.top) / box.height - .5, -.5, .5) * -16}deg`);
    button.style.setProperty('--pointer-ry', `${clamp((event.clientX - box.left) / box.width - .5, -.5, .5) * 20}deg`);
  });
  button.addEventListener('pointerleave', () => {
    button.classList.remove('is-preview');
    button.style.removeProperty('--pointer-rx');
    button.style.removeProperty('--pointer-ry');
  });
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    button.classList.remove('is-preview');
    button.setAttribute('aria-pressed', String(pressed));
    button.classList.toggle('is-pressed', pressed);
  });
});

let scheduled = false;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function updateHero() {
  const box = hero.getBoundingClientRect();
  const stickyDistance = box.height - heroStage.offsetHeight;
  const headerHeight = siteHeader.offsetHeight;
  const progress = clamp((headerHeight - box.top) / (headerHeight + (stickyDistance > 0 ? stickyDistance : box.height)), 0, 1);
  const arc = Math.sin(progress * Math.PI);
  hero.style.setProperty('--grid-y', `${progress * 100}px`);
  hero.style.setProperty('--copy-y', `${arc * -13}px`);
  heroArt.style.setProperty('--hero-y', `${arc * -16}px`);
  heroArt.style.setProperty('--hero-z', `${arc * 72}px`);
  heroArt.style.setProperty('--hero-rx', `${arc * -15}deg`);
  heroArt.style.setProperty('--hero-ry', `${-14 + progress * 29}deg`);
  heroArt.style.setProperty('--files-x', `${-13 - arc * 31}px`);
  heroArt.style.setProperty('--files-y', `${-25 - arc * 33}px`);
  heroArt.style.setProperty('--files-angle', `${-19 + progress * 30}deg`);
  heroArt.style.setProperty('--preview-x', `${12 + arc * 29}px`);
  heroArt.style.setProperty('--preview-y', `${26 + arc * 19}px`);
  heroArt.style.setProperty('--preview-angle', `${18 - progress * 31}deg`);
}

function updateScrollArt() {
  scheduled = false;
  if (!root.classList.contains('motion-on')) return;
  const distance = Math.max(1, root.scrollHeight - innerHeight);
  root.style.setProperty('--page-progress', clamp(scrollY / distance, 0, 1));
  if (visibleArtwork.has(heroArt)) updateHero();

  for (const button of visibleArtwork) {
    const panel = button.closest('.track');
    if (!panel) continue;
    const bounds = panel.getBoundingClientRect();
    const offset = (bounds.top + bounds.height / 2 - innerHeight / 2) / innerHeight;
    const progress = clamp(offset * 1.7, -1, 1);
    const direction = panel.matches('.web, .school') ? 1 : -1;
    panel.style.setProperty('--track-x', `${progress * direction * 24}px`);
    panel.style.setProperty('--track-y', `${progress * 25}px`);
    panel.style.setProperty('--track-z', `${Math.abs(progress) * -145}px`);
    panel.style.setProperty('--track-rx', `${progress * -20}deg`);
    panel.style.setProperty('--track-ry', `${progress * direction * 24}deg`);
    panel.style.setProperty('--track-copy-y', `${progress * -13}px`);
    button.style.setProperty('--scroll-tilt', `${progress * direction * 14}deg`);
    button.style.setProperty('--scroll-shift', `${progress * -14}px`);
    button.style.setProperty('--grid-slide', `${progress * 38}px`);
    const nearCenter = 1 - Math.abs(progress);
    button.style.setProperty('--preview-lift', `${nearCenter * -7}px`);
    button.style.setProperty('--preview-depth', `${nearCenter * 18}px`);
    button.style.setProperty('--gallery-angle', `${progress * 15}deg`);
    button.style.setProperty('--cover-angle', `${nearCenter * -14}deg`);
  }
}

function scheduleScrollArt() {
  if (scheduled || !root.classList.contains('motion-on')) return;
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
if (reducedMotion.addEventListener) {
  reducedMotion.addEventListener('change', applyMotionPreference);
} else {
  reducedMotion.addListener(applyMotionPreference);
}
applyMotionPreference();
