/* Smooth scrolling. Lenis owns the scroll position on this page: anything that wants to move
   the page must go through it, or the two fight each other (that bug cost the reel its snap). */
import { reduced } from './core.js';

export let lenis = null;

export function initScroll() {
  if (reduced || typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
}

export const scrollTo = el => lenis
  ? lenis.scrollTo(el, { offset: el.id === 'top' ? 0 : -8, duration: 1.2, easing: t => 1 - Math.pow(1 - t, 4) })
  : el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
