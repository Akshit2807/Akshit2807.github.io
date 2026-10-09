/* d12 · mobile first screen: the portrait sinks slower than the page and dims, the name lifts away faster */
(() => {
if (!window.gsap || !window.ScrollTrigger || document.documentElement.classList.contains('rm')) return;   // reduced motion (or no CDN): the static first screen
const dev = location.search.includes('dev');
gsap.matchMedia().add('(max-width:900px)', () => {
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#me', start: 'top top', end: '+=100%', scrub: dev ? true : .3 } })
    .to('#portraitFig', { yPercent: 24, scale: 1.12, opacity: .45 }, 0)   // on the black page, dimming the photo to .45 is the .55 black overlay
    .to('#meName', { yPercent: -32 }, 0);
});   // leaving the query reverts the tweens and their inline styles: desktop is untouched
})();
