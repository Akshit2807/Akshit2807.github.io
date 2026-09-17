/* The small, independent pieces of chrome: theme dial, clocks, marquee, nav and mobile menu,
   active-section highlight, counters, the hiding nav, rolling button labels, the experience
   progress line and the haptic tick. Each one is its own init so main.js keeps the boot order. */
import { $, $$, root, reduced, animate, buzz } from './core.js';
import { track } from './analytics.js';
import { scrollTo } from './scroll.js';

/* the mobile menu, exposed so the sheet's Escape key can close it */
export const menuApi = {
  isOpen: () => { const m = document.getElementById('menu'); return m && !m.hidden; },
  close: () => setMenu(false),
  focusButton: () => document.getElementById('menuBtn').focus()
};
let setMenu = () => {};

/* theme (mood dial): circular reveal from the dial via View Transitions */
export function initTheme() {
  const moodBtn = $('#moodBtn');
  moodBtn.addEventListener('click', () => {
    const flip = () => { root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light'; try { localStorage.setItem('akshit-theme', root.dataset.theme); } catch (e) {} track('theme_switch', { theme_current: root.dataset.theme }); };
    if (!document.startViewTransition || reduced) return flip();
    const r = moodBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('no-tx');
    const vt = document.startViewTransition(flip);
    vt.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    vt.finished.finally(() => root.classList.remove('no-tx'));
  });
}

export function initClocks() {
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const clocks = $$('[data-clock]'), big = $('[data-clock-big]');
  const tickClock = () => {
    const s = fmt.format(new Date());
    clocks.forEach(el => el.textContent = s + ' IST');
    if (big) big.innerHTML = s.slice(0, 5) + '<span>IST</span>';
  };
  tickClock(); setInterval(tickClock, 1000);
}

/* proof strip: the marquee needs a second copy of its content to loop seamlessly */
export function initProofStrip() {
  const mq = $('#marq'); mq.innerHTML += mq.innerHTML.replace(/<span>/g, '<span aria-hidden="true">');
}

export function initNav() {
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  setMenu = open => { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open); menuBtn.textContent = open ? 'Close' : 'Menu'; if (open) menu.querySelector('a').focus(); };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#menu,#menuBtn')) setMenu(false); });
  $$('[data-nav]').forEach(a => a.addEventListener('click', e => {
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); setMenu(false); scrollTo(el);
  }));
}

export function initActiveNav() {
  const navMap = { hero: null, work: '#work', craft: '#work', experience: '#experience', numbers: '#experience', about: '#about', contact: '#about' };
  $$('main > section, main > header').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 45%', end: 'bottom 45%',
    onToggle: st => { if (!st.isActive) return; const href = navMap[sec.id]; $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === href)); }
  }));
}

/* counters (final value already in the HTML, so it reads correctly without JS) */
export function initCounters() {
  if (!animate) return;
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-IN') }) });
  });
}

/* the nav tucks away while reading down, returns on any scroll up */
export function initNavHide() {
  const navEl = $('.nav'), menu = $('#menu');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: st => {
    navEl.classList.toggle('nav-hide', st.direction === 1 && st.scroll() > innerHeight * .7 && menu.hidden && !document.querySelector('#sheet.is-open'));
  } });
}

/* button labels roll to a fresh copy on hover */
export function initButtonLabels() {
  $$('.btn, .nav-links a').forEach(el => {
    const host = el.querySelector(':scope > span:not(.roll)') || el;
    const tn = [...host.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!tn) return;
    // built as nodes, not an HTML string, so no label text can ever be parsed as markup
    const txt = tn.textContent.trim(), roll = document.createElement('span'), inner = document.createElement('span');
    roll.className = 'roll'; inner.className = 'roll-in';
    for (const hidden of [false, true]) {
      const copy = document.createElement('span');
      copy.textContent = txt;
      if (hidden) copy.setAttribute('aria-hidden', 'true');
      inner.appendChild(copy);
    }
    roll.appendChild(inner);
    host.replaceChild(roll, tn);
  });
}

/* experience: a progress line draws down the chapters as you read */
export function initExperienceLine() {
  const chaptersEl = $('.chapters');
  if (!animate || !chaptersEl) return;
  const st = ScrollTrigger.create({ trigger: chaptersEl, start: 'top 65%', end: 'bottom 65%', onUpdate: s => chaptersEl.style.setProperty('--p', s.progress.toFixed(3)) });
  chaptersEl.style.setProperty('--p', st.progress.toFixed(3));
}

/* haptic tick on every tap target (pattern override via data-haptic) */
export function initHapticTick() {
  document.addEventListener('click', e => {
    const el = e.target.closest('a,button,.card');
    if (el) buzz(el.dataset.haptic ? el.dataset.haptic.split(',').map(Number) : 8);
  });
}
