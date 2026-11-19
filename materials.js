const artwork = [...document.querySelectorAll('.art')];
const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
const visibleArtwork = new Set(artwork);
const root = document.documentElement;
const siteHeader = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const heroStage = document.querySelector('.hero-stage');
const heroArt = document.querySelector('.hero-art');
const sceneFold = document.querySelector('.scene-fold');
const stages = [...document.querySelectorAll('.track-stage')];
const runway = document.querySelector('.catalog-runway');
const deck = document.querySelector('.catalog-deck');
const footer = document.querySelector('footer');
const heroTitle = document.querySelector('.hero-typed');
const heroLines = [...heroTitle.children].filter((line) => line.tagName !== 'BR');
const heroLetters = [...document.querySelector('.hero-title-source').childNodes]
  .filter((line) => line.nodeName !== 'BR')
  .map((line) => [...line.textContent.matchAll(/\P{Mark}\p{Mark}*/gu)].map(([letter]) => letter));
const typedHeading = document.querySelector('.typed-heading');
const headingLetters = Array.from(typedHeading.parentElement.getAttribute('aria-label'));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const typingEnd = .27;
const firstCard = .19;
const cardInterval = .157;
const cardDuration = .31;
const deckPrelude = .34;
let deckTarget = 0;
let deckPosition = null;
let deckFrame = 0;
let deckTime = 0;

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
  const travel = stickyDistance > 0 ? stickyDistance + headerHeight : Math.min(230, box.height * .32);
  const progress = clamp((headerHeight - box.top) / travel, 0, 1);
  const typing = clamp(progress / .44, 0, 1);
  let letters = Math.ceil(typing * heroLetters.reduce((sum, line) => sum + line.length, 0));
  heroLines.forEach((line, index) => {
    const text = heroLetters[index].slice(0, Math.max(0, letters)).join('');
    if (line.textContent !== text) line.textContent = text;
    letters -= heroLetters[index].length;
  });
  heroTitle.classList.toggle('is-typing', typing < 1);
  heroTitle.classList.toggle('is-first-line', !heroLines[1].textContent);
  hero.style.setProperty('--hero-type-depth', `${(1 - typing) * -145}px`);
  hero.style.setProperty('--hero-type-yaw', `${(1 - typing) * -22}deg`);
  hero.style.setProperty('--hero-type-pitch', `${(1 - typing) * 24}deg`);
  const detail = clamp((progress - .44) / .33, 0, 1);
  const illustration = clamp((progress - .57) / .37, 0, 1);
  hero.style.setProperty('--hero-details', detail);
  hero.style.setProperty('--hero-art-entry', illustration);
  hero.classList.toggle('is-art-pending', illustration < .06);
  hero.classList.toggle('is-detail-pending', detail < .06);
  hero.style.setProperty('--hero-art-depth', `${(1 - illustration) ** 2 * -290}px`);
  hero.style.setProperty('--hero-art-yaw', `${(1 - illustration) ** 2 * 48}deg`);
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

function updateSceneFold() {
  const { top, height } = sceneFold.getBoundingClientRect();
  const progress = clamp((innerHeight * .77 - top - height) / (innerHeight * .57), 0, 1);
  const angle = progress * progress * (3 - 2 * progress);
  sceneFold.style.setProperty('--fold-angle', `${angle * -90}deg`);
  sceneFold.style.setProperty('--fold-visibility', progress === 1 ? 'hidden' : 'visible');
  heroArt.style.setProperty('--fold-exit-depth', `${-progress * 145}px`);
  heroArt.style.setProperty('--fold-exit-pitch', `${progress * 24}deg`);
}

function updateScrollArt() {
  scheduled = false;
  const distance = Math.max(1, root.scrollHeight - innerHeight);
  root.style.setProperty('--page-progress', clamp(scrollY / distance, 0, 1));
  updateHero();
  updateSceneFold();
  const footerBounds = footer.getBoundingClientRect();
  const footerEntry = clamp((innerHeight - footerBounds.top) / Math.max(1, Math.min(footerBounds.height * .82, innerHeight * .38)), 0, 1);
  footer.style.setProperty('--footer-entry', footerEntry);

  const sticky = getComputedStyle(deck).position === 'sticky';
  const runwayBounds = runway.getBoundingClientRect();
  const range = Math.max(1, runwayBounds.height - deck.offsetHeight);
  const stickyTop = sticky ? parseFloat(getComputedStyle(deck).top) : 0;
  const prelude = innerHeight * deckPrelude;
  if (sticky) {
    deckTarget = clamp((stickyTop + prelude - runwayBounds.top) / (range + prelude), 0, 1);
    if (deckPosition === null || reduceMotion.matches) {
      deckPosition = deckTarget;
      paintDeck(deckPosition);
    } else if (!deckFrame && deckPosition !== deckTarget) {
      deckTime = performance.now();
      deckFrame = requestAnimationFrame(advanceDeck);
    }
  } else {
    cancelAnimationFrame(deckFrame);
    deckFrame = 0;
    deckPosition = null;
    paintDeckTitle(clamp((innerHeight * .48 - runwayBounds.top) / (innerHeight * .33), 0, 1));
    for (const stage of stages) {
      const bounds = stage.getBoundingClientRect();
      const progress = clamp((innerHeight - bounds.top) / (innerHeight * .55), 0, 1);
      paintCard(stage, progress, false);
    }
  }

  for (const button of visibleArtwork) {
    const panel = button.closest('.track');
    if (!panel) continue;
    const bounds = panel.parentElement.getBoundingClientRect();
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

function paintCard(stage, progress, pinned) {
  const remaining = (1 - progress) ** 2;
  const side = stage.matches('#web, #school') ? 1 : -1;
  stage.style.setProperty('--entry-visibility', clamp(progress * (pinned ? 3.7 : 3), 0, 1));
  stage.style.setProperty('--entry-z', `${remaining * -300}px`);
  stage.style.setProperty('--entry-x', `${remaining * side * -32}px`);
  stage.style.setProperty('--entry-y', `${remaining * 42}px`);
  stage.style.setProperty('--entry-pitch', `${remaining * 31}deg`);
  stage.style.setProperty('--entry-yaw', `${remaining * side * 25}deg`);
  stage.style.setProperty('--entry-roll', `${remaining * side * -4}deg`);
  stage.style.setProperty('--entry-shine', Math.sin(progress * Math.PI) * .5);
  stage.classList.toggle('is-unrevealed', progress < .06);
}

function paintDeckTitle(typing) {
  const text = headingLetters.slice(0, Math.ceil(typing * headingLetters.length)).join('');
  if (typedHeading.textContent !== text) typedHeading.textContent = text;
  const depth = (1 - typing) ** 1.5;
  typedHeading.style.setProperty('--text-z', `${depth * -120}px`);
  typedHeading.style.setProperty('--text-pitch', `${depth * 23}deg`);
  typedHeading.style.setProperty('--text-yaw', `${depth * -13}deg`);
  deck.classList.toggle('is-typing', typing < 1);
}

function paintDeck(position) {
  paintDeckTitle(clamp(position / typingEnd, 0, 1));
  deck.style.setProperty('--deck-progress', position);
  for (const [index, stage] of stages.entries()) {
    const progress = clamp((position - firstCard - index * cardInterval) / cardDuration, 0, 1);
    paintCard(stage, progress, true);
  }
}

function advanceDeck(time) {
  deckFrame = 0;
  const remaining = deckTarget - deckPosition;
  if (Math.abs(remaining) < .002) {
    deckPosition = deckTarget;
  } else {
    deckPosition += remaining * (1 - Math.exp(-Math.min(time - deckTime, 80) / 52));
    deckTime = time;
    deckFrame = requestAnimationFrame(advanceDeck);
  }
  paintDeck(deckPosition);
}

function scrollToDeckCard() {
  const index = stages.findIndex((stage) => '#' + stage.id === location.hash);
  if (index < 0 || getComputedStyle(deck).position !== 'sticky') return;
  const bounds = runway.getBoundingClientRect();
  const range = bounds.height - deck.offsetHeight;
  const progress = firstCard + index * cardInterval + cardDuration;
  const prelude = innerHeight * deckPrelude;
  const top = scrollY + bounds.top + Math.ceil(progress * (range + prelude)) - prelude - parseFloat(getComputedStyle(deck).top);
  scrollTo({ top, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
}

function scheduleScrollArt() {
  if (scheduled) return;
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
root.classList.add('motion-on');
updateScrollArt();
addEventListener('hashchange', scrollToDeckCard);
addEventListener('load', scrollToDeckCard);
