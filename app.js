const root = document.documentElement;
const cards = [...document.querySelectorAll('.material-card')];

function updateScene() {
  const scroll = window.scrollY;
  const height = Math.max(document.body.scrollHeight - innerHeight, 1);
  root.style.setProperty('--scroll-progress', (scroll / height).toFixed(4));
  cards.forEach((card) => {
    const box = card.getBoundingClientRect();
    const distance = (box.top + box.height / 2 - innerHeight / 2) / innerHeight;
    const tilt = Math.max(-7, Math.min(7, distance * -8));
    card.style.transform = `perspective(1500px) rotateX(${tilt}deg) rotateY(${tilt * .45}deg) translateZ(${Math.abs(tilt) * -2}px)`;
  });
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  requestAnimationFrame(() => { updateScene(); ticking = false; });
  ticking = true;
}, { passive: true });

window.addEventListener('pointermove', (event) => {
  root.style.setProperty('--mx', `${(event.clientX / innerWidth) * 100}%`);
  root.style.setProperty('--my', `${(event.clientY / innerHeight) * 100}%`);
}, { passive: true });

updateScene();
