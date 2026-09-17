/* The ring of satellites orbiting the avatar. Owns the spin: the mood engine reads orbit.vel to
   decide how dizzy Akshit is, the loader tweens orbit.ring to fan the satellites out on arrival. */
import { $, $$, reduced, fine, lite, buzz, onWidth, isScrolling, pointer } from './core.js';
import { trackOnce } from './analytics.js';

/* shared, mutable: ring.k = intro burst, ring.out = scroll-away progress, fling/wob = mood shoves */
export const orbit = { ring: { k: 1, fade: 1, out: 0, fling: 0, wob: 0 }, vel: .0014, heroInView: true };

let stage = null, sats = [], N = 0, ang = 0, drag = null, radius = 0, tiltX = 0, lastX = 0, lastT = 0;

const layoutOrbit = () => {
  radius = Math.min(Math.max(innerWidth * .24, $('#avatar').clientWidth * .95), 340);
  sats.forEach((s, i) => s.dataset.a = (i / N) * Math.PI * 2);
};

export function renderOrbit() {
  const ring = orbit.ring;
  const R = radius * ring.k * (1 + ring.out * .35) * (1 + ring.fling);
  const squash = .3 + tiltX * .012 + ring.wob;          // vertical flattening of the ellipse; pointer Y tilts it
  const chest = stage.clientHeight * .06;    // ring plane sits a little below the avatar's centre
  sats.forEach(s => {
    const a = +s.dataset.a + ang, sn = Math.sin(a), c = Math.cos(a), depth = (c + 1) / 2;
    const x = sn * R, y = chest + c * R * squash, sc = .7 + .3 * depth;
    let op = (.3 + .7 * depth) * ring.fade * (1 - ring.out * .55);
    if (c > 0) op *= 1 - .18 * Math.max(0, 1 - Math.abs(sn) / .3); // slight ghost while crossing the body
    s.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) perspective(900px) rotateY(${(sn * -30).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
    s.style.opacity = op.toFixed(3);
    s.style.zIndex = c > 0 ? 60 + Math.round(c * 10) : 40 + Math.round(c * 10);
  });
}

export function initOrbit() {
  stage = $('#stage'); sats = $$('.sat'); N = sats.length;
  layoutOrbit(); onWidth(layoutOrbit);
  stage.addEventListener('pointerdown', e => { if (!e.target.closest('.sat')) return; e.preventDefault(); buzz(6); trackOnce('orbit_drag'); drag = { x: e.clientX, a: ang }; lastX = e.clientX; lastT = performance.now(); orbit.vel = 0; stage.classList.add('dragging'); stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => { if (!drag) return; ang = drag.a + (e.clientX - drag.x) * .0065; const now = performance.now(); orbit.vel = ((e.clientX - lastX) * .0065) / Math.max(1, now - lastT) * 16; lastX = e.clientX; lastT = now; if (reduced) renderOrbit(); });
  const endDrag = () => { if (!drag) return; drag = null; stage.classList.remove('dragging'); };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  renderOrbit();
  if (reduced || typeof gsap === 'undefined') return;
  gsap.ticker.add(() => {
    if ((!orbit.heroInView || (lite && isScrolling())) && !drag) return;
    if (!drag) { orbit.vel += (.0014 * Math.sign(orbit.vel || 1) - orbit.vel) * .02; ang += orbit.vel; if (Math.abs(orbit.vel) > .05) orbit.vel *= .96; }
    const targetTilt = fine ? ((pointer.y / innerHeight) - .5) * -10 : 0; tiltX += (targetTilt - tiltX) * .04;
    renderOrbit();
  });
  ScrollTrigger.create({ trigger: '#hero', start: 'top bottom', end: 'bottom top', onToggle: st => orbit.heroInView = st.isActive });
  // scrolling away: the ring opens and dims, the avatar and headline drift up at different rates
  ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', onUpdate: st => { orbit.ring.out = st.progress; } });
  if (!lite) {
    gsap.to('#avWrap', { y: -48, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: .6 } });
    gsap.to('.hero-head', { y: -70, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: .6 } });
  }
}
