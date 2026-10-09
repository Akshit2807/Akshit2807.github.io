/* d12 · phones: swipe rails for the UrbanEye screens and the experience cards (css/m-rails.css).
   Native scroll-snap owns the gesture; this only poses the shots from scrollLeft and tracks which card is in front. */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rm = document.documentElement.classList.contains('rm'), dev = location.search.includes('dev');
const mq = matchMedia('(max-width:900px)');
const shots = $('#urbaneye .screens'), dash = $('#shipped .dash');
if (!shots || !dash) return;
document.addEventListener('touchstart', () => {}, { passive: true });   // iOS paints :active (the press) only once a touch listener exists

/* one rail: snap targets cached on resize, scrollLeft read once a frame. pose(x, targets, front, frontChanged); pose() resets */
function rail(el, label, target, pose) {
  const cards = [...el.children];
  let at = [], k = -1, raf = 0, on = false;
  const frame = () => { raf = 0; if (!on) return; const x = el.scrollLeft; let n = 0;
    at.forEach((a, i) => { if (Math.abs(x - a) < Math.abs(x - at[n])) n = i; });
    pose(x, at, n, n !== k); k = n; };
  const measure = () => { if (!on) return; const max = el.scrollWidth - el.clientWidth; at = cards.map(c => Math.max(0, Math.min(max, target(c)))); frame(); };
  el.addEventListener('scroll', () => { if (on && !raf) dev ? frame() : (raf = requestAnimationFrame(frame)); }, { passive: true });   // ?dev tabs never fire rAF
  new ResizeObserver(measure).observe(el);   // rotation, font swaps: re-cache here, never measure while scrolling
  return {
    go: i => el.scrollTo({ left: at[i], behavior: rm || dev ? 'auto' : 'smooth' }),
    set(v) { on = v; k = -1;
      if (v) { el.setAttribute('role', 'region'); el.setAttribute('aria-label', label); el.tabIndex = 0; measure(); }   // focusable, so arrow keys swipe it
      else { ['role', 'aria-label', 'tabindex'].forEach(a => el.removeAttribute(a)); pose(); } }
  };
}

/* ---------- UrbanEye: the centred shot in front, its neighbours smaller and dimmer behind ---------- */
const imgs = $$('img', shots);
const screens = rail(shots, 'UrbanEye screens', c => c.offsetLeft + c.offsetWidth / 2 - shots.clientWidth / 2, (x, at, n, moved) => imgs.forEach((im, i) => {
  if (x === undefined) { im.style.transform = im.style.opacity = im.style.zIndex = ''; return; }
  const d = Math.min(1, Math.abs(x - at[i]) / (at[1] - at[0]));   // 0 in front, 1 a whole shot away
  im.style.transform = `scale(${1 - .14 * d})`; im.style.opacity = 1 - .45 * d;
  if (moved) im.style.zIndex = 3 - Math.abs(i - n);   // only when the front shot changes, not every frame
}));
// lazy images clipped by a sideways scroller only load once swiped to: fetch all three as the rail comes near
new IntersectionObserver((es, o) => { if (es[0].isIntersecting && mq.matches) { imgs.forEach(im => im.loading = 'eager'); o.disconnect(); } }, { rootMargin: '100% 0px' }).observe(shots);

/* ---------- experience: one card at a time, dots that follow and jump ---------- */
const tiles = [...dash.children], dots = document.createElement('div');
dots.className = 'mr-dots';
const dbs = tiles.map((t, i) => { const b = dots.appendChild(document.createElement('button')); b.type = 'button';
  b.setAttribute('aria-label', 'Show ' + $('h3', t).textContent); b.addEventListener('click', () => exp.go(i)); return b; });
dash.after(dots);
const exp = rail(dash, 'Experience', c => c.offsetLeft - tiles[0].offsetLeft,
  (x, at, n, moved) => { if (x === undefined || moved) dbs.forEach((b, i) => b.setAttribute('aria-current', x !== undefined && i === n)); });
// main.js reveals a card once 18% of it shows, which a sideways peek never reaches: here any visible sliver counts, so the peeking card is never a blank gap
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });

/* ---------- phones only; desktop keeps the grid untouched ---------- */
const set = on => { screens.set(on); exp.set(on); dots.hidden = !on;
  on ? tiles.forEach(t => t.classList.contains('in') || io.observe(t)) : io.disconnect(); };
set(mq.matches); mq.addEventListener('change', e => set(e.matches));
})();
