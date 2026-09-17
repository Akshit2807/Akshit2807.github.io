/* The project reel. On desktop it is pinned and scrubbed by scroll: each card's position is a
   function of scroll progress, and Lenis (never ScrollTrigger's own snap) settles it on a project.
   On touch and narrow screens it is a swipeable, autoplaying carousel instead. */
import { $, $$, lite, animate, reduced, fine, buzz, onWidth } from './core.js';
import { track } from './analytics.js';
import { lenis } from './scroll.js';

export function initReel() {
/* ---------- work reel ---------- */
const cards = $$('#stage2 .card'), tabs = $$('#film .tab'), descs = $$('#workDesc > div'), stats = $$('#workStats > div'), links = $$('#workLinks > div'), wIdx = $('#wIdx'), film = $('#film');
const W = cards.length, AUTOPLAY = 7;
let cur = 0, autoTl = null, userTook = false, workInView = false, reelST = null, railOn = false, lastProject = '';
const stage = $('#stage2');
const markActive = () => cards.forEach((c, k) => c.classList.toggle('is-active', k === cur));
const railTo = (k, instant) => stage.scrollTo({ left: cards[k].offsetLeft - (stage.clientWidth - cards[k].offsetWidth) / 2, behavior: instant || reduced || !animate ? 'auto' : 'smooth' });
// whichever card sits closest to the middle of the rail is the one being read
const railIndex = () => { const mid = stage.scrollLeft + stage.clientWidth / 2; let best = 0, bd = Infinity; cards.forEach((c, k) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = k; } }); return best; };
const narrow = () => innerWidth < 1080;
function place(i, immediate) {
  cards.forEach((c, k) => {
    let off = ((k - i) % W + W) % W; if (off > W / 2) off -= W;
    const vis = Math.abs(off) <= 1;
    const to = vis
      ? { x: `${off * (narrow() ? 36 : 30)}%`, rotateY: lite ? 0 : off * -22, z: lite ? 0 : (off ? -260 : 0), scale: off ? .8 : 1, autoAlpha: off ? .4 : 1, zIndex: off ? 1 : 3 }
      : { x: `${Math.sign(off || 1) * 130}%`, rotateY: lite ? 0 : off * -30, z: lite ? 0 : -480, scale: .6, autoAlpha: 0, zIndex: 0 };
    c.classList.toggle('is-active', off === 0); c.dataset.off = off;
    c.setAttribute('aria-hidden', off === 0 ? 'false' : 'true');
    (immediate || !animate) ? gsap.set(c, to) : gsap.to(c, { ...to, duration: 1.2, ease: 'power3.inOut', overwrite: true });
  });
}
function runAutoplay() {
  if (autoTl) autoTl.kill();
  const bars = tabs.map(t => t.querySelector('.bar'));
  gsap.set(bars, { scaleX: 0 }); gsap.set(bars[cur], { scaleX: userTook || reduced || reelST ? 1 : 0 });
  if (userTook || reduced || reelST) return;
  autoTl = gsap.to(bars[cur], { scaleX: 1, duration: AUTOPLAY, ease: 'none', paused: !workInView, onComplete: () => go(cur + 1) });
}
function go(i, user, fromScroll) {
  // desktop: the page scroll owns the active project, so clicks and keys scroll to that project's position
  if (reelST && !fromScroll) {
    const k = Math.max(0, Math.min(W - 1, i));
    const y = reelST.start + (reelST.end - reelST.start) * k / (W - 1);
    lenis ? lenis.scrollTo(y, { duration: 1 }) : window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    return;
  }
  if (user) userTook = true;
  if (railOn && !fromScroll) { railTo((i + W) % W); return; }
  cur = (i + W) % W; if (!fromScroll) place(cur);
  if (railOn) markActive();
  [descs, stats, links].forEach(set => set.forEach((el, k) => el.classList.toggle('is-active', k === cur)));
  if (animate) {
    const rich = fine && !narrow();
    gsap.fromTo([...descs[cur].children, ...stats[cur].children], rich ? { y: 22, autoAlpha: 0, filter: 'blur(4px)' } : { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ...(rich ? { filter: 'blur(0px)', clearProps: 'filter' } : {}), duration: rich ? 1.1 : .6, ease: 'expo.out', stagger: rich ? .06 : .03, delay: rich ? .15 : 0, overwrite: true });
    // the incoming cover builds itself: title, line, then the screen rises into place
    if (!fromScroll && rich) gsap.fromTo(cards[cur].querySelectorAll('.cover-title, .cover-line, .cover-vis'), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', stagger: .08, delay: .35, overwrite: true });
  }
  tabs.forEach((t, k) => t.setAttribute('aria-pressed', k === cur));
  wIdx.textContent = String(cur + 1).padStart(2, '0');
  const pname = descs[cur].querySelector('h3').textContent;
  if (pname !== lastProject) { if (lastProject && (user || fromScroll || workInView)) track('project_view', { project_viewed: pname, project_view_source: fromScroll ? 'scroll' : user ? 'user' : 'autoplay' }); lastProject = pname; }
  const tab = tabs[cur];
  film.scrollTo({ left: tab.offsetLeft - (film.clientWidth - tab.offsetWidth) / 2, behavior: animate ? 'smooth' : 'auto' });
  runAutoplay();
}
place(0, true); go(0);
tabs.forEach((t, k) => t.addEventListener('click', () => go(k, true)));
$('#wPrev').addEventListener('click', () => go(cur - 1, true));
$('#wNext').addEventListener('click', () => go(cur + 1, true));
cards.forEach(c => c.addEventListener('click', () => { const k = cards.indexOf(c); if (k !== cur) go(k, true); }));
/* soft light that follows the pointer across the active cover */
if (fine) $('#stage2').addEventListener('pointermove', e => {
  const c = cards[cur], r = c.getBoundingClientRect();
  c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
  c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
}, { passive: true });
/* narrow screens: the rail is a native scroll-snap container, so the browser owns the gesture.
   We only listen: whichever card is centred becomes the active project. */
gsap.matchMedia().add('(max-width: 1079px)', () => {
  railOn = true;
  gsap.killTweensOf(cards);
  gsap.set(cards, { clearProps: 'transform,opacity,visibility,zIndex' });  // drop the deck's transforms, keep each card's --cbg/--tint
  cards.forEach(c => { c.style.removeProperty('--shade'); c.removeAttribute('aria-hidden'); });
  film.classList.remove('scrubbing');
  markActive(); railTo(cur, true);
  let queued = false;
  const onRail = () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const i = railIndex();
      if (i !== cur) { const dir = i > cur ? 'next' : 'prev'; go(i, false, true); buzz(8); track('project_swipe', { swipe_direction: dir }); }
    });
  };
  // the first touch on the rail is the reader taking over; stop advancing at them
  const onTake = () => { if (!userTook) { userTook = true; runAutoplay(); } };
  stage.addEventListener('scroll', onRail, { passive: true });
  stage.addEventListener('pointerdown', onTake, { passive: true });
  stage.setAttribute('tabindex', '0');
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Project covers, scrollable');
  runAutoplay();
  return () => {
    railOn = false;
    stage.removeEventListener('scroll', onRail);
    stage.removeEventListener('pointerdown', onTake);
    ['tabindex', 'role', 'aria-label'].forEach(a => stage.removeAttribute(a));
  };
});
/* desktop: pin the reel and let scroll step through the four projects */
/* desktop: the deck is scrubbed by scroll. Every card's position is a continuous function of scroll progress,
   so the motion is exactly as fast as the reader scrolls, reverses with them, and settles with a soft snap. */
const filmInd = $('#filmInd'), coverParts = cards.map(c => [c.querySelector('.cover-vis'), c.querySelector('.cover-title')]);
let deckPos = 0, deckSpread = 1;
function scrubDeck(p) {
  cards.forEach((c, k) => {
    const o = k - p, a = Math.abs(o), f = deckSpread;
    gsap.set(c, {
      x: `${o * 58 * f}%`, rotateY: o * -26 * f, z: -Math.min(a, 2) * 260 * f,
      scale: 1 - Math.min(a, 1.5) * .18 * f, autoAlpha: a > 1.8 ? 0 : a > 1.3 ? (1.8 - a) * 2 : 1, zIndex: Math.round(1000 - a * 400)
    });
    c.style.setProperty('--shade', (Math.min(a, 1.2) * .55).toFixed(3));
    c.classList.toggle('is-active', a < .5); c.dataset.off = Math.round(o); c.setAttribute('aria-hidden', a < .5 ? 'false' : 'true');
    const [vis, title] = coverParts[k];
    if (vis) gsap.set(vis, { y: o * 46, autoAlpha: 1 });
    if (title) gsap.set(title, { x: o * -40, autoAlpha: 1 });
  });
  // one indicator glides between tab positions, interpolated by the same progress
  const i0 = Math.max(0, Math.min(W - 1, Math.floor(p))), i1 = Math.min(W - 1, i0 + 1), t = p - i0;
  const l = tabs[i0].offsetLeft + (tabs[i1].offsetLeft - tabs[i0].offsetLeft) * t;
  const w = tabs[i0].offsetWidth + (tabs[i1].offsetWidth - tabs[i0].offsetWidth) * t;
  filmInd.style.transform = `translateX(${l.toFixed(1)}px)`; filmInd.style.width = w.toFixed(1) + 'px';
}
gsap.matchMedia().add('(min-width: 1080px)', () => {
  gsap.killTweensOf(cards); film.classList.add('scrubbing');
  // entering: the deck starts gathered and fans out as the reel scrolls up to its pinned position
  const fan = ScrollTrigger.create({ trigger: '#reelPin', start: 'top bottom', end: 'top 72px', onUpdate: st => { deckSpread = .3 + .7 * st.progress; scrubDeck(deckPos); } });
  reelST = ScrollTrigger.create({
    trigger: '#reelPin', start: 'top 72px', end: () => '+=' + Math.round(innerHeight * .9 * (W - 1)),
    pin: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
    onUpdate: st => {
      deckPos = st.progress * (W - 1); scrubDeck(deckPos);
      const i = Math.round(deckPos); if (i !== cur) go(i, false, true);
    }
  });
  // snap through Lenis once scrolling settles; ScrollTrigger's own snap scrolls the window natively and fights Lenis
  const snapReel = () => {
    if (reduced || !reelST || !reelST.isActive) return;
    const k = Math.round(reelST.progress * (W - 1)), y = reelST.start + (reelST.end - reelST.start) * k / (W - 1);
    if (Math.abs(scrollY - y) < 2) return;
    lenis ? lenis.scrollTo(y, { duration: .7, easing: t => 1 - Math.pow(1 - t, 3) }) : window.scrollTo({ top: y, behavior: 'smooth' });
  };
  // every scroll frame (wheel, trackpad inertia, the snap itself) pushes the check back; it runs 180ms after the last one
  const snapLater = gsap.delayedCall(.18, snapReel).pause();
  const onReelScroll = () => { if (reelST && reelST.isActive) snapLater.restart(true); };
  const offReelScroll = lenis ? lenis.on('scroll', onReelScroll) : (addEventListener('scroll', onReelScroll, { passive: true }), () => removeEventListener('scroll', onReelScroll));
  deckSpread = fan.progress ? .3 + .7 * fan.progress : (reelST.progress > 0 ? 1 : .3);
  deckPos = reelST.progress * (W - 1); scrubDeck(deckPos);
  runAutoplay();
  return () => {
    offReelScroll(); snapLater.kill();
    fan.kill(); reelST = null; film.classList.remove('scrubbing'); deckSpread = 1;
    cards.forEach(c => c.style.removeProperty('--shade'));
    coverParts.flat().forEach(el => el && gsap.set(el, { clearProps: 'x,y' }));
    place(cur, true); runAutoplay();
  };
});
$('#work').addEventListener('keydown', e => {
  if (e.target.closest('input,textarea')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
});
onWidth(() => reelST ? scrubDeck(deckPos) : railOn ? railTo(cur, true) : place(cur, true));
ScrollTrigger.create({ trigger: '#reel', start: 'top 75%', end: 'bottom 25%', onToggle: st => { workInView = st.isActive; if (autoTl) st.isActive ? autoTl.play() : autoTl.pause(); } });
}
