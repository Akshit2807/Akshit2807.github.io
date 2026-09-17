/* Boot order. This file is the only place that decides what runs when, and the order matters:
   analytics before anything that tracks, the avatar before the loader copies its canvas, Lenis
   before the reel (which asks it to snap), and click analytics last so every ScrollTrigger exists.
   Nothing else in the codebase runs on import; every module waits to be called from here. */
import { $, initCore } from './core.js';
import { initAnalytics, initClickAnalytics } from './analytics.js';
import { initTheme, initClocks, initProofStrip, initNav, initActiveNav, initCounters, initNavHide, initButtonLabels, initExperienceLine, initHapticTick } from './ui.js';
import { initAvatar, initMood } from './avatar.js';
import { initOrbit } from './orbit.js';
import { initCursor } from './cursor.js';
import { initScroll } from './scroll.js';
import { initBackground, initLoader, initReveals } from './scene.js';
import { initReel } from './reel.js';
import { initContact } from './contact.js';

initCore();
initAnalytics();
initTheme();
initClocks();
initProofStrip();
initAvatar();
initOrbit();

// these need no GSAP, so they run before the fallback guard: with the CDN blocked a visitor
// can still open the menu, jump between sections and send a message
initNav();
initContact();
initButtonLabels();
initHapticTick();

// no GSAP (blocked CDN, offline): the page stays readable and interactive, just unanimated
if (typeof gsap === 'undefined') {
  $('#pre').remove();
} else {
  initCursor();
  initBackground();
  initScroll();
  initLoader();
  initReveals();
  initReel();
  initActiveNav();
  initCounters();
  initMood();
  initNavHide();
  initExperienceLine();
  initClickAnalytics();
}
