/* d12 · mobile Live Activity: a floating pill says where the request is; tap it and it grows into the page's navigation. */
(() => {
if (!window.gsap || !window.ScrollTrigger) return;   // CDN down: main.js is off too and the static page stands alone
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement, rm = root.classList.contains('rm'), mq = matchMedia('(max-width:900px)');
const LABEL = { me: 'Intro', tap: 'One tap', stack: 'Stack', glue: 'About', urbaneye: 'UrbanEye', ecocycle: 'EcoCycle', behind: 'Backend', locallegacy: 'LocalLegacy', shipped: 'Experience', numbers: 'Numbers', when: 'Availability', write: 'Contact' };
const JUMP = [['Projects', 'urbaneye', 'urbaneye ecocycle behind locallegacy'], ['Experience', 'shipped', 'shipped'], ['About', 'glue', 'glue'], ['Contact', 'write', 'write']];   // label, target, the spans it lights for
const secs = $$('main > section[id][data-name]'), N = secs.length, names = secs.map(s => LABEL[s.id] || s.dataset.name);
if (!N) return;

/* ---------- build: the pill, the sheet it grows into (shortcuts, then every span with its slice of the waterfall), a dim behind ---------- */
const island = document.createElement('div'), dim = document.createElement('div');
island.className = 'island'; dim.className = 'island-dim'; dim.setAttribute('aria-hidden', 'true');
island.innerHTML = `<i class="shell" aria-hidden="true"></i>
<nav class="sheet" id="islandSheet" aria-label="Sections" data-lenis-prevent><div class="jump">${JUMP.map(([t, id]) => `<a href="#${id}">${t}</a>`).join('')}</div>
<ol>${secs.map((s, i) => { const g = $(`#gutter a[href="#${s.id}"]`)?.style;
  return `<li><a href="#${s.id}" style="--o:${g?.getPropertyValue('--o') || '0px'};--w:${g?.getPropertyValue('--w') || '30px'}"><span>${names[i]}</span><i aria-hidden="true"></i></a></li>`; }).join('')}</ol></nav>
<button class="pill" type="button" aria-expanded="false" aria-controls="islandSheet"><span class="face" aria-hidden="true"><span class="lhs"><i class="dot"></i><span class="lbl"><b></b></span></span><span class="rhs"><i class="trk"><i></i></i><span class="cnt"></span><span class="menu">Menu</span></span></span></button>`;
const gut = $('#gutter'); gut ? gut.after(island, dim) : document.body.append(island, dim);   // right after the desktop trace nav in tab order
const shell = $('.shell', island), sheet = $('.sheet', island), pill = $('.pill', island), face = $('.face', island), lhs = $('.lhs', island), rhs = $('.rhs', island),
  lbl = $('.lbl', island), cnt = $('.cnt', island), fill = $('.trk i', island), rows = $$('ol a', sheet), jumps = $$('.jump a', sheet),
  page = [$('#nav'), $('main'), $('footer')].filter(Boolean);   // made inert while the sheet is open
let cur = -1, w = 0, isOpen = false;   // w: the collapsed pill's laid-out width, measured once per change
const is = c => island.classList.contains(c);
const flat = () => { gsap.killTweensOf([shell, lhs, rhs], 'x,scaleX'); gsap.set(shell, { scaleX: 1 }); gsap.set([lhs, rhs], { x: 0 }); };

/* ---------- current span: the name rolls over and the pill's width morphs to fit (FLIP, transforms only) ---------- */
function setCur(i) {
  if (i === cur) return; cur = i;
  const ob = lbl.lastElementChild, nb = document.createElement('b');
  nb.textContent = names[i]; cnt.textContent = `${i + 1}/${N}`;
  pill.setAttribute('aria-label', `Menu. Sections, at ${names[i]}`);   // starts with the visible word (voice control); aria-expanded says open or closed
  rows.forEach((a, k) => { a.classList.toggle('on', k === i); a.classList.toggle('done', k < i); k === i ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'); });
  jumps.forEach((a, k) => { const on = JUMP[k][2].split(' ').includes(secs[i].id); a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
  $$('.out', lbl).forEach(b => b.remove()); ob.classList.add('out'); lbl.append(nb);   // old name out of flow first, so the measure is the new name's
  const w0 = w; w = face.offsetWidth;
  if (rm || island.hidden || is('open') || is('away') || root.classList.contains('booting')) { ob.remove(); flat(); if (geo && is('open')) geo.s = (island.offsetWidth - w) / 2; return; }   // a fold in progress lands on the new width
  const d = (w - w0) / 2, tw = { duration: .6, ease: 'expo.out', overwrite: 'auto' };   // start from where it is now, so quick changes chain smoothly
  gsap.fromTo(shell, { scaleX: gsap.getProperty(shell, 'scaleX') * w0 / w }, { scaleX: 1, ...tw });
  gsap.fromTo(lhs, { x: gsap.getProperty(lhs, 'x') + d }, { x: 0, ...tw });
  gsap.fromTo(rhs, { x: gsap.getProperty(rhs, 'x') - d }, { x: 0, ...tw });
  gsap.to(ob, { y: -9, opacity: 0, duration: .2, ease: 'power2.in', overwrite: true, onComplete: () => ob.remove() });
  gsap.from(nb, { y: 9, opacity: 0, duration: .5, delay: .06, ease: 'expo.out' });
}

/* ---------- tap: the pill grows in place into the sheet, and folds back ---------- */
const k = { p: 0 }; let geo;   // p: 0 = the pill's footprint inside the open box, 1 = the whole sheet (a proxy, like main.js's plate clip)
const clip = () => { const q = 1 - k.p; shell.style.clipPath = `inset(${geo.t * q}px ${geo.s * q}px 0px ${geo.s * q}px round ${23 + 5 * k.p}px)`; };
const measure = () => { geo = { t: island.offsetHeight - pill.offsetHeight, s: (island.offsetWidth - w) / 2 }; clip(); };   // once per tap
function open() {
  if (isOpen || is('away') || island.hidden) return; isOpen = true;
  flat(); island.classList.add('open'); dim.classList.add('on'); pill.setAttribute('aria-expanded', 'true');
  sheet.style.pointerEvents = ''; page.forEach(el => el.inert = true);   // modal for screen readers
  sheet.scrollTop = 0; (jumps.find(a => a.classList.contains('on')) || jumps[0]).focus({ preventScroll: true });   // shortcuts first: projects and experience are one tap away
  if (rm) return;
  if (!k.p) gsap.set(sheet, { opacity: 0, y: 14 });   // else it was mid-close: carry on from there
  measure();
  gsap.to(k, { p: 1, duration: .6, ease: 'expo.out', overwrite: true, onUpdate: clip });
  gsap.to(sheet, { opacity: 1, y: 0, duration: .5, delay: .06, ease: 'expo.out', overwrite: true });
}
function close(refocus) {
  if (!isOpen) return; isOpen = false;
  page.forEach(el => el.inert = false); sheet.style.pointerEvents = 'none';   // the fading sheet takes no taps or scrolls
  dim.classList.remove('on'); pill.setAttribute('aria-expanded', 'false');
  if (refocus) pill.focus({ preventScroll: true });
  const done = () => { k.p = 0; island.classList.remove('open'); shell.style.clipPath = ''; sheet.style.pointerEvents = ''; gsap.set(sheet, { clearProps: 'opacity,transform' }); };
  if (rm || island.hidden || is('away')) { gsap.killTweensOf([k, sheet]); return done(); }
  measure();
  gsap.to(sheet, { opacity: 0, y: 8, duration: .18, ease: 'power2.in', overwrite: true });
  gsap.to(k, { p: 0, duration: .45, ease: 'expo.inOut', overwrite: true, onUpdate: clip, onComplete: done });
}
pill.addEventListener('click', () => isOpen ? close(true) : open());
dim.addEventListener('click', () => close(true));
sheet.addEventListener('click', e => { const a = e.target.closest('a'); e.preventDefault(); if (!a || !isOpen) return;   // rows still fading out don't take a second tap
  close(false); window.__go ? window.__go(a.hash, true) : location.hash = a.hash; });   // instant: the fold is the only motion; __go moves focus to the section
addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) close(true); });
island.addEventListener('focusout', e => { if (isOpen && e.relatedTarget && !island.contains(e.relatedTarget)) close(false); });   // tabbed out: fold away

/* ---------- step aside for the plate and the contact form (the form's fields, and so the iOS keyboard, live there) ---------- */
const why = {};
const hideWhile = (key, v) => { why[key] = v; const away = Object.values(why).some(Boolean); island.classList.toggle('away', away); if (away) close(false); };

/* ---------- phones only; rotation and late fonts re-measure ---------- */
const fit = () => { island.hidden = dim.hidden = !mq.matches; if (island.hidden) close(false); else w = face.offsetWidth; };
mq.addEventListener('change', fit); fit(); setCur(0);
document.fonts?.ready.then(fit);

/* ---------- scroll: ScrollTrigger rather than an observer, so ?dev's __seek drives it too (same -45%/-50% band as main.js) ---------- */
secs.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 50%', end: 'bottom 45%', onToggle: t => t.isActive && setCur(i) }));
const prog = t => fill.style.transform = `scaleX(${t.progress.toFixed(4)})`;   // ScrollTrigger caches the page height on refresh; this only writes a transform
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: prog, onRefresh: prog });
if (!rm) ScrollTrigger.create({ trigger: '#behind', start: 'top top', end: 'bottom bottom', onToggle: t => hideWhile('plate', t.isActive) });   // the plate's own span
ScrollTrigger.create({ trigger: '#form', start: 'top bottom', end: 'bottom top', onToggle: t => hideWhile('form', t.isActive) });   // never over the Send button; Contact can still show as current
})();
