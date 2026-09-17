/* Everything that paints the page's atmosphere: the pixel-field background, the boot loader
   that compiles the avatar pixel by pixel, and the scroll reveals for each section. */
import { $, $$, root, reduced, lite, fine, animate, pointer } from './core.js';
import { av, PAL, SPR } from './avatar.js';
import { orbit, renderOrbit } from './orbit.js';

/* ---------- background: pixel field ---------- */
export function initBackground() {
const field = $('.pixel-field'), fx = $('.field-fx');
if (reduced || lite) fx.remove();
else {
  const fc = fx.getContext('2d'), G = 28;
  let fw = 0, fh = 0, off = 0, gx = pointer.x, gy = pointer.y, glow = 0, lastMove = -1e9, nextTw = 0, wasDrawn = false, fAcc = '', fInk = '';
  const ripples = [], twinkles = [];
  const fColors = () => { const cs = getComputedStyle(root); fAcc = cs.getPropertyValue('--accent-text').trim(); fInk = cs.getPropertyValue('--text').trim(); };
  fColors(); new MutationObserver(fColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  const fFit = () => { const d = Math.min(devicePixelRatio, 1.5); fw = innerWidth; fh = innerHeight; fx.width = fw * d; fx.height = fh * d; fc.setTransform(d, 0, 0, d, 0, 0); };
  fFit(); addEventListener('resize', fFit);
  // slow parallax; the modulo keeps the tiling seamless and the transform on the compositor
  const onScroll = () => { off = (scrollY * .12) % G; field.style.transform = `translate3d(0,${(-off).toFixed(2)}px,0)`; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (fine) addEventListener('pointermove', () => lastMove = performance.now(), { passive: true });
  addEventListener('pointerdown', e => { ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() }); if (ripples.length > 3) ripples.shift(); });
  gsap.ticker.add(() => {
    const now = performance.now(), oy = -40 + G / 2 - off, cols = Math.ceil(fw / G), rows = Math.ceil(fh / G) + 3;
    glow += (((now - lastMove) < 1400 ? 1 : 0) - glow) * .08;
    gx += (pointer.x - gx) * .09; gy += (pointer.y - gy) * .09;
    for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t0 > 1600) ripples.splice(i, 1);
    if (glow < .01 && !ripples.length && !twinkles.length) { if (wasDrawn) { fc.clearRect(0, 0, fw, fh); wasDrawn = false; } return; }
    fc.clearRect(0, 0, fw, fh); wasDrawn = true;
    // ambient twinkles
    fc.fillStyle = fInk;
    for (let i = twinkles.length - 1; i >= 0; i--) {
      const t = twinkles[i]; t.l -= .018;
      if (t.l <= 0) { twinkles.splice(i, 1); continue; }
      fc.globalAlpha = Math.sin(t.l * Math.PI) * .45; fc.fillRect(G / 2 + t.c * G - 1.5, oy + t.r * G - 1.5, 3, 3);
    }
    fc.fillStyle = fAcc;
    // cursor force field: dots swell, brighten and get pushed away
    if (glow >= .01) {
      const R = 230, c0 = Math.max(0, Math.floor((gx - R) / G)), c1 = Math.min(cols, Math.ceil((gx + R) / G)), r0 = Math.max(0, Math.floor((gy - R - oy) / G)), r1 = Math.min(rows, Math.ceil((gy + R - oy) / G));
      for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
        const x = G / 2 + c * G, y = oy + r * G, dx = x - gx, dy = y - gy, d = Math.hypot(dx, dy);
        if (d >= R) continue;
        const k = 1 - d / R, push = k * k * 5 / (d || 1), s = 1.5 + k * 2.5;
        fc.globalAlpha = k * k * .55 * glow;
        fc.fillRect(x + dx * push - s / 2, y + dy * push - s / 2, s, s);
      }
    }
    // click / tap ripples: a bright orbit.ring travelling through the grid
    for (const rp of ripples) {
      const p = (now - rp.t0) / 1600, rad = (1 - Math.pow(1 - p, 3)) * 680, band = 56, fade = 1 - p;
      const c0 = Math.max(0, Math.floor((rp.x - rad - band) / G)), c1 = Math.min(cols, Math.ceil((rp.x + rad + band) / G));
      const r0 = Math.max(0, Math.floor((rp.y - rad - band - oy) / G)), r1 = Math.min(rows, Math.ceil((rp.y + rad + band - oy) / G));
      for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
        const x = G / 2 + c * G, y = oy + r * G, q = 1 - Math.abs(Math.hypot(x - rp.x, y - rp.y) - rad) / band;
        if (q <= 0) continue;
        const s = 1.5 + q * 3; fc.globalAlpha = q * fade * .85;
        fc.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
    fc.globalAlpha = 1;
  });
}
}

/* ---------- loader: the avatar compiles pixel by pixel, then flies into the hero ---------- */
export function initLoader() {
const pre = $('#pre');
let revealed = false;
const reveal = () => {
  if (revealed) return; revealed = true;
  const pc = $('#preAv'), pr = pc.getBoundingClientRect(), tr = av.getBoundingClientRect();
  const onScreen = tr.bottom > 0 && tr.top < innerHeight;
  gsap.set(av, { autoAlpha: 0 });
  const lines = new SplitText('#heroTitle', { type: 'lines', linesClass: 't-line' });
  lines.lines.forEach(l => { const inner = document.createElement('div'); inner.innerHTML = l.innerHTML; l.innerHTML = ''; l.appendChild(inner); });
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to('.pre-cmd, .pre-status', { autoAlpha: 0, y: -10, duration: .35, ease: 'power2.in', stagger: .04 }, 0)
    .to(pc, onScreen
      ? { x: tr.left + tr.width / 2 - (pr.left + pr.width / 2), y: tr.top + tr.height / 2 - (pr.top + pr.height / 2), scale: tr.width / pr.width, duration: 1.1, ease: 'expo.inOut' }
      : { autoAlpha: 0, scale: .8, duration: .5, ease: 'power2.in' }, .05)
    .to('.pre-bg', { autoAlpha: 0, duration: .7, ease: 'power2.inOut' }, .45)
    .add(() => { gsap.set(av, { autoAlpha: 1 }); pre.remove(); }, 1.15)
    .from('#heroTitle .t-line > div', { yPercent: 110, rotate: 1.5, transformOrigin: '0% 100%', duration: 1.3, stagger: .1 }, .55)
    .fromTo('.hero-eyebrow, .hero-tag, .hero-sub, .hero-cta', { autoAlpha: 0, y: 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: .1, clearProps: 'filter' }, .75)
    .from('.hero-foot > *, .nav', { autoAlpha: 0, y: 10, duration: 1, stagger: .08 }, 1.05)
    .fromTo(orbit.ring, { k: 0, fade: 0 }, { k: 1, fade: 1, duration: 2.4, onUpdate: renderOrbit }, 1.0);
};
if (!animate) pre.remove();
else {
  const px = $('#preAv').getContext('2d'), cmdEl = $('#preCmd'), stEl = $('#preStatus');
  const P = PAL(), pixels = [];
  SPR.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') pixels.push([x, y, P[ch]]); }));
  for (let i = pixels.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [pixels[i], pixels[j]] = [pixels[j], pixels[i]]; }
  const cmd = 'flutter build akshit --release', typed = { c: 0 }, build = { n: 0 }, t0 = performance.now();
  let drawn = 0;
  const boot = gsap.timeline({ onComplete: () => {
    px.drawImage(av, 0, 0); // final frame, pupils included, identical to the hero avatar
    stEl.textContent = '✓ Built in ' + ((performance.now() - t0) / 1000).toFixed(1) + 's';
    stEl.classList.add('ok');
    gsap.delayedCall(.28, reveal);
  } });
  boot.to(typed, { c: cmd.length, duration: .5, ease: 'none', onUpdate: () => cmdEl.textContent = cmd.slice(0, Math.round(typed.c)) })
    .to(build, { n: pixels.length, duration: .95, ease: 'power2.inOut', onUpdate: () => {
      const n = Math.round(build.n);
      for (; drawn < n; drawn++) { const [x, y, c] = pixels[drawn]; px.fillStyle = c; px.fillRect(x, y, 1, 1); }
      stEl.textContent = 'Compiling pixels ' + String(Math.round(n / pixels.length * 100)).padStart(3, ' ') + '%';
    } }, .3);
  setTimeout(() => { if (!revealed) boot.progress(1); }, 4000);
}

}
/* ---------- section reveals (only when the page is actually being watched) ---------- */
export function initReveals() {
if (animate) {
  $$('[data-split]').forEach(h => {
    const s = new SplitText(h, { type: 'lines', linesClass: 't-line' });
    s.lines.forEach(l => { const inner = document.createElement('div'); inner.innerHTML = l.innerHTML; l.innerHTML = ''; l.appendChild(inner); });
    gsap.from(h.querySelectorAll('.t-line > div'), { yPercent: 110, rotate: 1.5, transformOrigin: '0% 100%', duration: 1.3, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  // eyebrow and note follow the headline instead of arriving with it
  $$('.sec-head').forEach(sh => gsap.fromTo(sh.querySelectorAll('.label, .note'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .12, delay: .2, scrollTrigger: { trigger: sh, start: 'top 88%', once: true } }));
  [['.craft .tile', '.craft'], ['.chapter', '.chapters'], ['.num', '.nums'], ['.bento > *', '.bento'], ['.about-grid > *', '.about-grid']].forEach(([items, trigger]) =>
    lite
      ? gsap.fromTo(items, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: 'power3.out', stagger: .05, scrollTrigger: { trigger, start: 'top 96%', once: true } })
      : gsap.fromTo(items, { y: 36, autoAlpha: 0, filter: 'blur(8px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: .1, clearProps: 'filter', scrollTrigger: { trigger, start: 'top 85%', once: true } }));
}

}