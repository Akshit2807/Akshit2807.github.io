/* Shared foundation: DOM helpers, capability flags, haptics, lite mode, viewport and pointer.
   Every other module imports from here; this module imports nothing. */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const root = document.documentElement;

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(pointer: fine)').matches;
export const coarse = matchMedia('(pointer: coarse)').matches;
// lite mode is decided by the inline script in <head> so the class is set before first paint
export const lite = root.classList.contains('lite');
// Motion only enhances a state that is already visible. A background tab never runs rAF,
// so from() tweens would leave content hidden: skip every entrance animation there.
export const animate = !reduced && document.visibilityState === 'visible' && typeof gsap !== 'undefined';

/* haptics: Vibration API on touch devices (Android Chrome; iOS Safari has none, so it no-ops) */
export const buzz = p => { if (coarse && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

/* live pointer position, shared by the avatar's eyes, the orbit tilt, the cursor and the background */
export const pointer = { x: innerWidth / 2, y: innerHeight / 2 };

/* true for 160ms after the last scroll event; lite mode pauses work while the page moves */
let scrolling = false, scrollT = 0;
export const isScrolling = () => scrolling;

// mobile address bars fire resize while scrolling; only a real width change should re-layout
const widthFns = []; let lastW = innerWidth;
export const onWidth = f => widthFns.push(f);

export function initCore() {
  if (typeof gsap !== 'undefined') { gsap.registerPlugin(ScrollTrigger, SplitText); ScrollTrigger.config({ ignoreMobileResize: true }); }
  addEventListener('scroll', () => { scrolling = true; clearTimeout(scrollT); scrollT = setTimeout(() => scrolling = false, 160); }, { passive: true });
  addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; widthFns.forEach(f => f()); });
  addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
}
