/* d12 · request trace. One tap travels down the page as a fibre of light. */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement, rm = root.classList.contains('rm'), dev = location.search.includes('dev');
const mob = () => innerWidth <= 900;
gsap.registerPlugin(ScrollTrigger);

/* ---------- smooth scroll, wired into GSAP's ticker (stopped until the launch screen is gone) ---------- */
let lenis = null;
if (!rm && window.Lenis) { lenis = new Lenis({ lerp: .1, autoRaf: false }); lenis.stop(); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
// jumps: land where the plate is open (not on its empty start), elsewhere clear the fixed nav (Lenis ignores scroll-padding).
// `now` = instant (the mobile sheet's fold is the motion). While jumping, the plate never shows as it is scrubbed past.
let jumping = false, syncPlate = () => {};
const go = (id, now) => { const el = $(id); if (!el) return; const off = id === '#behind' && !rm ? innerHeight * .9 : -80;
  if (lenis) { jumping = true; const done = () => setTimeout(() => { jumping = false; syncPlate(); }, 500);   // 500 ms: let the scrub catch up first
    lenis.scrollTo(el, now ? { offset: off, immediate: true } : { duration: 1.6, offset: off, onComplete: done }); if (now) done(); }
  else el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
  if (!el.hasAttribute('tabindex')) el.tabIndex = -1; el.focus({ preventScroll: true }); };   // keyboard and screen-reader users land where they jumped
window.__go = go;   // for the mobile Live Activity sheet (js/m-island.js)
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.hash); if (a.hash === '#write') setTimeout(() => $('#fName').focus({ preventScroll: true }), rm ? 0 : 1600); }));
$('.skip').addEventListener('click', e => { e.preventDefault(); const t = $('#urbaneye h2'); t.setAttribute('tabindex', '-1'); t.focus(); });

/* ---------- launch: the icon opens like an app, then folds into the nav logo ---------- */
const launch = $('#launch'), navIcon = $('#navIcon');
const vw = () => root.clientWidth;
const insetTo = r => `inset(${r.top}px ${vw() - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${r.radius}px)`;
const centred = (s, rad) => ({ top: innerHeight / 2 - s / 2, bottom: innerHeight / 2 + s / 2, left: vw() / 2 - s / 2, right: vw() / 2 + s / 2, radius: rad });
let iconR = null; addEventListener('resize', () => iconR = null);   // the nav icon is fixed: measure once per resize, not every frame
const icon = () => { if (!iconR) { const r = navIcon.getBoundingClientRect(); iconR = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, radius: 9 }; } return { ...iconR }; };
const full = () => ({ top: 0, bottom: innerHeight, left: 0, right: vw(), radius: 0 });
const lerpR = (a, c, t) => ({ top: a.top + (c.top - a.top) * t, bottom: a.bottom + (c.bottom - a.bottom) * t, left: a.left + (c.left - a.left) * t, right: a.right + (c.right - a.right) * t, radius: a.radius + (c.radius - a.radius) * t });
let booted = false;
function boot() { if (booted) return; booted = true; lenis?.start(); root.classList.remove('booting'); root.classList.add('ready'); ScrollTrigger.refresh(); }
setTimeout(boot, dev ? 0 : 3200);   // never leave the page locked if animation frames stall
if (rm) boot();
else {
  Object.assign(launch.style, { inset: '0', width: 'auto', height: 'auto', margin: '0', borderRadius: '0' });
  const st = { p: 0 }, b = $('b', launch);
  launch.style.clipPath = insetTo(centred(60, 18));
  gsap.timeline({ onComplete: boot })
    .to(st, { p: 1, duration: .45, ease: 'back.out(1.6)', onUpdate: () => launch.style.clipPath = insetTo(lerpR(centred(60, 18), centred(96, 26), st.p)) })
    .set(st, { p: 0 })
    .to(st, { p: 1, duration: .7, ease: 'expo.inOut', onUpdate: () => launch.style.clipPath = insetTo(lerpR(centred(96, 26), full(), st.p)) }, '+=.15')
    .to(b, { scale: 3.2, duration: .7, ease: 'expo.inOut' }, '<')
    .set(st, { p: 0 })
    .to(b, { opacity: 0, duration: .25 }, '+=.1')
    .to(st, { p: 1, duration: .85, ease: 'expo.inOut', onUpdate: () => launch.style.clipPath = insetTo(lerpR(full(), icon(), st.p)) }, '<');
}

/* ---------- reveals: arrive out of focus, settle ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target); onIn(e.target); }), { threshold: .18 });
$$('.settle').forEach(el => io.observe(el));
function onIn(el) {
  if (el.id === 'runlog') runSteps();
  if (el.id === 'field') dotsAnim();
  if (el.id === 'push') pushTimer();
  if (el.classList.contains('t-hub')) { const h = $('.hub', el); h.scrollLeft = (h.scrollWidth - h.clientWidth) / 2; }   // phones: the diagram swipes, starting on the Go API
  $$('[data-n]', el).forEach(countUp);
  if (el.matches('[data-n]')) countUp(el);
}
if (rm) { $$('.settle').forEach(el => { el.classList.add('in'); }); const h = $('.hub'); h.scrollLeft = (h.scrollWidth - h.clientWidth) / 2; }

function countUp(el) {
  if (el.dataset.done) return; el.dataset.done = 1; const to = +el.dataset.n, s = el.dataset.s || '';
  if (rm) return;
  const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.6, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-IN') + s });
}

/* ---------- UrbanEye run log checks off in order ---------- */
function runSteps() { $$('#runlog .steps li').forEach((li, i) => rm ? li.classList.add('done') : setTimeout(() => li.classList.add('done'), 350 + i * 520)); }

/* ---------- 2,465 dots, one lit ---------- */
const dc = $('#dots'), dx = dc.getContext('2d'), N = 2465, GAP = 12;
let COLS, ROWS, LIT, dotsDone = rm;
// phones get a taller grid (45 a row) so the dots stay visible; still exactly 2,465
function dotsGrid() { COLS = mob() ? 45 : 85; ROWS = Math.ceil(N / COLS); LIT = mob() ? { c: 31, r: 22 } : { c: 61, r: 13 };
  if (dc.width !== COLS * GAP) { dc.width = COLS * GAP; dc.height = ROWS * GAP; return true; } }
dotsGrid(); addEventListener('resize', () => dotsGrid() && drawDots(dotsDone ? 1 : 0));
function drawDots(reveal = 1, pulse = 0) {
  dx.clearRect(0, 0, dc.width, dc.height);
  for (let c = 0; c < COLS; c++) {
    const a = Math.max(0, Math.min(1, reveal * (COLS + 12) / 12 - c / 12));
    if (!a) continue;
    dx.fillStyle = `rgba(236,232,223,${.17 * a})`; dx.beginPath();   // one fill per column, not per dot
    for (let r = 0; r < ROWS; r++) {
      if (r * COLS + c >= N || (c === LIT.c && r === LIT.r)) continue;
      const x = 6 + c * GAP, y = 6 + r * GAP; dx.moveTo(x + 2.1, y); dx.arc(x, y, 2.1, 0, 7);
    }
    dx.fill();
  }
  if (reveal >= 1) {
    const x = 6 + LIT.c * GAP, y = 6 + LIT.r * GAP, g = dx.createRadialGradient(x, y, 0, x, y, 30 + pulse * 10);
    g.addColorStop(0, 'rgba(255,178,63,.55)'); g.addColorStop(1, 'rgba(255,178,63,0)');
    dx.fillStyle = g; dx.beginPath(); dx.arc(x, y, 40, 0, 7); dx.fill();
    dx.fillStyle = '#FFB23F'; dx.beginPath(); dx.arc(x, y, 3.6, 0, 7); dx.fill();
  }
}
drawDots(rm ? 1 : 0);
function dotsAnim() {
  if (rm) return drawDots(1);
  const o = { r: 0 };
  gsap.to(o, { r: 1, duration: 1.6, ease: 'power2.inOut', onUpdate: () => drawDots(o.r), onComplete: () => { dotsDone = true; drawDots(1); } });
}

/* ---------- push timer: counts, then settles on "<200" ---------- */
function pushTimer() {
  const el = $('#ms');
  if (rm) { el.textContent = '<200'; return; }
  const o = { v: 0 }; gsap.to(o, { v: 199, duration: 1.1, ease: 'power1.in', onUpdate: () => el.textContent = Math.round(o.v), onComplete: () => el.textContent = '<200' });
}

/* ---------- the QR is the real repository ---------- */
if (window.qrcode) { const q = qrcode(0, 'M'); q.addData('https://github.com/Akshit2807/LocalLegacy'); q.make(); const n = q.getModuleCount(); let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  $('#qr').innerHTML = `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code linking to the LocalLegacy repository"><path d="${d}" fill="#000"/></svg>`; }

/* ---------- the hero window: a live sample trace ---------- */
const TRACES = [
  { title: 'sample trace · LocalLegacy', req: '<em>POST</em> /pay', id: 'shop 4471', spans: [
    ['flutter', 'tap → request', 0, 14, 'var(--signal)'], ['nginx', 'route', 14, 3, 'var(--signal)'], ['go-api', 'verify jwt', 17, 2, 'var(--ion)'],
    ['redis', 'GET shop', 19, .4, 'var(--ion)'], ['postgres', 'insert qr record', 20, 36, 'var(--ion)'], ['fcm', 'push shopkeeper', 56, 124, 'var(--signal)']] },
  { title: 'sample trace · UrbanEye', req: '<em>POST</em> /report', id: 'photo 1.2 MB', spans: [
    ['flutter', 'upload photo', 0, 210, 'var(--signal)'], ['flask', 'classify image', 210, 140, 'var(--ion)'], ['firestore', 'save report', 350, 30, 'var(--ion)'],
    ['router', 'route by location', 380, 20, 'var(--ion)'], ['dashboard', 'notify the desk', 400, 60, 'var(--signal)']] },
];
let ti = 0;
function playTrace() {
  const T = TRACES[ti % TRACES.length], total = Math.max(...T.spans.map(s => s[2] + s[3]));
  $('#wtitle').textContent = T.title; $('#reqLine').innerHTML = T.req; $('#reqId').textContent = T.id; $('#wtotal').textContent = 'total —'; $('#wstatus').style.opacity = 0;
  $('#spans').innerHTML = T.spans.map(([n, lbl, s, d, c]) => `<li><b>${n}</b><span class="track"><span class="bar${(s + d) / total > .6 ? ' flip' : ''}" style="--l:${s / total * 100}%;--w:${Math.max(.8, d / total * 100)}%;--c:${c};--s:${rm ? 1 : 0}"><small>${lbl}</small></span></span><span class="ms">${rm ? (d < 1 ? d : Math.round(d)) + ' ms' : ''}</span></li>`).join('');
  const lis = $$('#spans li');
  const finish = () => { $('#wtotal').textContent = `total ${Math.round(total)} ms`; $('#wstatus').style.opacity = 1; };
  if (rm) return finish();
  lis.forEach((li, i) => setTimeout(() => { li.querySelector('.bar').style.setProperty('--s', 1); li.querySelector('.ms').textContent = (T.spans[i][3] < 1 ? T.spans[i][3] : Math.round(T.spans[i][3])) + ' ms'; }, 500 + i * 420));
  setTimeout(finish, 500 + lis.length * 420 + 200);
  setTimeout(() => { ti++; playTrace(); }, 500 + lis.length * 420 + 3600);
}
playTrace();
/* the window leans toward the pointer */
const win = $('#window');
if (!rm) addEventListener('pointermove', e => { if (mob() || scrollY > $('#tap').offsetTop + innerHeight) return; const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  win.style.setProperty('--ry', (-14 + x * 10).toFixed(2) + 'deg'); win.style.setProperty('--rx', (8 - y * 8).toFixed(2) + 'deg'); }, { passive: true });

/* ---------- the plate: the icon opens again mid-page, then the screen swings open and we go behind it ---------- */
const plate = $('#plate');
let covered = false;   // plate fully open: the fibre underneath needn't be drawn
if (!rm) {
  const k = { open: 0, round: 0 };
  const clip = () => { const r = lerpR(icon(), full(), k.open); r.radius += k.round * 44; plate.style.clipPath = insetTo(r); covered = k.open === 1 && !k.round; };
  gsap.set(plate, { transformPerspective: Math.min(1800, innerWidth * 1.2), transformOrigin: '0% 50%' });   // phones need a closer eye or the swing reads as a squash
  clip();
  // visibility follows the (scrub-smoothed) timeline, not the raw scroll, so a fast exit can't pop the plate mid-swing
  let tl;
  syncPlate = () => { const p = tl.progress(); plate.style.visibility = !jumping && p > .001 && p < .999 ? 'visible' : 'hidden'; };
  tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: () => syncPlate(),
      scrollTrigger: { trigger: '#behind', start: 'top top', end: 'bottom bottom', scrub: dev ? true : .35, fastScrollEnd: true } })
    .to(k, { open: 1, duration: .3, ease: 'power3.inOut', onUpdate: clip }, 0)
    .fromTo('#plate .w i', { yPercent: 118, rotate: 5 }, { yPercent: 0, rotate: 0, duration: .14, stagger: .035, ease: 'power3.out' }, .17)
    .fromTo('#plate small', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .1, ease: 'power2.out' }, .3)
    .fromTo('#plate .sheen', { xPercent: -45 }, { xPercent: 45, duration: 1 }, 0)
    .to(k, { round: 1, duration: .12, ease: 'power2.inOut', onUpdate: clip }, .6)
    .to(plate, { scale: .82, xPercent: 9, duration: .12, ease: 'power2.inOut' }, .6)
    .to(plate, { rotateY: 90, duration: .28, ease: 'power2.in' }, .72)
    .to('#plate .shade', { opacity: .7, duration: .28, ease: 'power2.in' }, .72);
} else { plate.style.display = 'none'; }

/* ---------- gutter + nav state ---------- */
const secs = $$('main > section'), gl = $$('#gutter a');
const nio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const i = secs.indexOf(e.target);
  gl.forEach((a, k) => { a.classList.toggle('on', k === i); a.classList.toggle('done', k < i); });
  $$('.navlinks a').forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id || (a.hash === '#urbaneye' && ['urbaneye', 'ecocycle', 'locallegacy', 'behind'].includes(e.target.id)))); }), { rootMargin: '-45% 0px -50% 0px' });
secs.forEach(s => nio.observe(s));
addEventListener('scroll', () => $('#nav').classList.toggle('solid', scrollY > 40), { passive: true });

/* ---------- availability meter ---------- */
const OFFERS = [
  ['Internship', 'Available now.', 'I’m the mobile intern at BuyHatke and open to the next one: Flutter, React Native, Swift or Kotlin, and the backend behind them.', 'Write about an internship', 'An internship: '],
  ['Full-time', 'From 2027.', 'I graduate from IIIT Bhopal in 2027 and I’m looking for a team that ships mobile apps with a real backend behind them.', 'Write about a 2027 role', 'A full-time role from 2027: '],
  ['A project', 'Any time.', 'An app you want built properly, or a backend that needs to stop falling over. Tell me what it is.', 'Write about a project', 'A project: '],
];
const range = $('#when-range');
const setOffer = v => { const [k, t, p, c, pre] = OFFERS[v]; $('#offer-k').textContent = k; $('#offer-title').textContent = t; $('#offer-p').textContent = p; $('#offer-cta').textContent = c; $('#offer-cta').dataset.pre = pre;
  range.style.setProperty('--p', v / 2 * 100 + '%'); $$('#stops span').forEach((s, i) => s.classList.toggle('on', i === +v));
  range.setAttribute('aria-valuetext', `${k}: ${t}`); };
range.addEventListener('input', () => setOffer(+range.value)); setOffer(0);
$('#offer-cta').addEventListener('click', () => { const m = $('#fMsg'); if (!m.value.trim()) m.value = $('#offer-cta').dataset.pre; });

/* ---------- the form: Web3Forms relays it; the address never appears on the page ---------- */
const FORM_KEY = 'c6afb020-d50a-48d2-869d-6099527bfde2';
const form = $('#form'), status = $('#formStatus'), sendBtn = $('#sendBtn');
const say = (m, c) => { status.textContent = m; status.className = 'status ' + (c || ''); };
form.addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#fName').value.trim(), email = $('#fMail').value.trim(), message = $('#fMsg').value.trim();
  if (!name || !email || !message) return say('Add your name, your email and a few lines, then send again.', 'err');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('That email address is missing something. Check it and send again.', 'err');
  if (form.botcheck.value) return say('Message sent.');
  sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; say('');
  try {
    const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ access_key: FORM_KEY, name, email, message, subject: `Portfolio message from ${name}` }) });
    const j = await r.json(); if (!j.success) throw 0;
    say('Message sent. I’ll reply soon.'); sendBtn.textContent = 'Sent'; form.reset();
  } catch { say('The message didn’t send. Try again in a minute, or reach me on LinkedIn.', 'err'); sendBtn.textContent = 'Send message'; }
  sendBtn.disabled = false;
});

/* ---------- clock ---------- */
const ist = () => $('#ist').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
ist(); setInterval(ist, 20000);

/* ================================================================
   THE FIBRE: one request, drawn as a bundle of light down the page
   ================================================================ */
const cv = $('#fibre'), cx = cv.getContext('2d');
let DPR = 1, path = [], chips = [];
function anchor(sel, fx = .5, fy = .5) { const el = $(sel); if (!el || !el.offsetWidth) return null; const r = el.getBoundingClientRect(); return [r.left + r.width * fx, r.top + scrollY + r.height * fy]; }
function layout() {
  DPR = Math.min(devicePixelRatio || 1, 1.5);   // a glow: 1.5x is plenty
  const cw = mob() ? 40 : vw(); cv.style.width = mob() ? '40px' : ''; cv.width = cw * DPR; cv.height = innerHeight * DPR;   // phones: the line lives in a 40px lane, so the canvas does too
  const W = vw(), H = document.documentElement.scrollHeight;
  let pts;
  if (mob()) pts = [[14, 0], [14, H]];
  else pts = [anchor('#portraitFig', .5, .8) || [W * .72, 0], anchor('#window', .5, .5), anchor('#chips', .62, .5), [W * .86, $('#glue').offsetTop + 120], anchor('#runlog', .5, .45), anchor('#field', .5, .4),
    [W * .5, $('#behind').offsetTop + innerHeight * .5], [W * .86, $('#locallegacy').offsetTop + 60], anchor('.t-redis', .35, .5), [W * .9, $('#shipped').offsetTop + 160], anchor('#bh', 1.013, -.04), anchor('#bh', 1.013, .7), [W * .88, $('#numbers').offsetTop + 40],
    anchor('#offer', .5, .5), anchor('#form', .5, .4)].filter(Boolean);
  // Catmull-Rom through the anchors, sampled densely
  path = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(8, Math.ceil(Math.abs(p2[1] - p1[1]) / 6));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      path.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                 .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  path.push(pts[pts.length - 1]);
  chips = $$('#chips .chip').map(el => ({ el, y: el.getBoundingClientRect().top + scrollY + 30 }));
}
const STRANDS = [[0, 0, '255,178,63', .9], [9, .7, '255,178,63', .22], [-12, 1.9, '91,124,255', .22], [18, 3.1, '255,203,120', .12], [-22, 4.2, '91,124,255', .12], [28, 5.3, '255,178,63', .07]];
function draw(now = performance.now()) {
  if (covered) return;
  const t = rm ? 0 : now / 1000, sy = scrollY, vh = innerHeight, head = sy + vh * .62, top = sy - 120, bot = sy + vh + 120;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.clearRect(0, 0, cv.width / DPR, vh);
  const vis = path.filter(p => p[1] > top && p[1] < bot);
  if (vis.length < 2) return;
  cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round'; cx.lineJoin = 'round';
  const thin = mob();
  for (const [amp, ph, rgb, a] of STRANDS) {
    if (thin && amp) continue;
    const w = amp ? 1 : 2;
    // dim (not yet travelled) and lit (travelled) parts
    for (const lit of [false, true]) {
      cx.beginPath(); let started = false;
      for (const [x, y] of vis) { if (lit ? y > head : y < head) continue;
        const off = amp ? Math.sin(y / 260 + ph + t * .6) * amp + Math.sin(y / 90 + ph * 2) * amp * .25 : 0;
        started ? cx.lineTo(x + off, y - sy) : (cx.moveTo(x + off, y - sy), started = true); }
      cx.strokeStyle = `rgba(${rgb},${lit ? a : a * .16})`; cx.lineWidth = w;
      if (lit && !amp) { cx.save(); cx.strokeStyle = 'rgba(255,178,63,.13)'; cx.lineWidth = 10; cx.stroke(); cx.restore(); }   // halo: a wide faint stroke, cheaper than shadowBlur
      cx.stroke();
    }
  }
  // packets riding the lit part
  const litPts = vis.filter(p => p[1] < head);
  if (litPts.length > 2 && !rm) for (let i = 0; i < 5; i++) { const u = ((t * .18 + i / 5) % 1), p = litPts[Math.floor(u * (litPts.length - 1))]; if (!p) continue;
    cx.fillStyle = i % 2 ? 'rgba(91,124,255,.9)' : 'rgba(255,214,150,.95)'; cx.beginPath(); cx.arc(p[0], p[1] - sy, 2.2, 0, 7); cx.fill(); }
  // the head of the request
  let hp = null; for (const p of vis) if (p[1] >= head) { hp = p; break; }
  if (hp) { const x = hp[0], y = hp[1] - sy, g = cx.createRadialGradient(x, y, 0, x, y, thin ? 22 : 70);
    g.addColorStop(0, 'rgba(255,178,63,.55)'); g.addColorStop(.35, 'rgba(255,178,63,.14)'); g.addColorStop(1, 'rgba(255,178,63,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, thin ? 22 : 70, 0, 7); cx.fill();
    cx.fillStyle = '#FFE2B0'; cx.beginPath(); cx.arc(x, y, thin ? 2.5 : 3.5, 0, 7); cx.fill(); }
  cx.globalCompositeOperation = 'source-over';
  // the stack lights up as the request passes it
  chips.forEach(c => c.el.classList.toggle('lit', head > c.y));
}
layout(); addEventListener('resize', () => { layout(); draw(); });
addEventListener('load', () => { layout(); ScrollTrigger.refresh(); });
new ResizeObserver(() => layout()).observe(document.body);
gsap.ticker.add(t => draw(t * 1000));
if (rm) addEventListener('scroll', () => draw(), { passive: true });

/* QA: deterministic seek for hidden tabs (no animation frames run there) */
if (dev && document.hidden) setInterval(() => gsap.ticker.tick(), 32);   // automation tabs never fire rAF
if (dev) window.__seek = y => { scrollTo(0, y); ScrollTrigger.update(); $$('.settle').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight * .85 && r.bottom > 0 && !el.classList.contains('in')) { el.classList.add('in'); onIn(el); } }); draw(); return scrollY; };
})();
