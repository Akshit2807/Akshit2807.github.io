/* The custom cursor: a target-lock reticle that wraps whatever you point at, a pixel comet
   trail, and a magnetic pull on buttons. Mouse only: touch devices never load any of it. */
import { $, root, fine, reduced, pointer } from './core.js';

export function initCursor() {
  if (!fine || reduced) return;
  root.classList.add('cur-on');
  const cur = document.createElement('div'), trail = document.createElement('canvas');
  cur.className = 'cur is-hidden'; trail.className = 'cur-trail';
  cur.setAttribute('aria-hidden', 'true'); trail.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<div class="cur-box"><i></i><i></i><i></i><i></i></div><div class="cur-dot"></div>';
  const lab = document.createElement('span'); lab.className = 'cur-label'; lab.setAttribute('aria-hidden', 'true');
  document.body.append(trail, cur, lab);
  const box = cur.querySelector('.cur-box'), dot = cur.querySelector('.cur-dot'), tc = trail.getContext('2d');
  let vw = 0, vh = 0;
  const fit = () => { const d = Math.min(devicePixelRatio, 2); vw = innerWidth; vh = innerHeight; trail.width = vw * d; trail.height = vh * d; tc.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener('resize', fit);
  let ink = '', acc = '';
  const readColors = () => { const cs = getComputedStyle(root); ink = cs.getPropertyValue('--text').trim(); acc = cs.getPropertyValue('--accent-text').trim(); };
  readColors(); new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  const P = []; // pixel particles
  const spawn = (x, y, vx, vy, n, spread = 1.2) => {
    for (let i = 0; i < n; i++) {
      if (P.length > 420) P.shift();
      P.push({ x: x + (Math.random() - .5) * 10, y: y + (Math.random() - .5) * 10, vx: vx + (Math.random() - .5) * spread, vy: vy + (Math.random() - .5) * spread, l: 1, d: .016 + Math.random() * .014, s: Math.random() < .3 ? 8 : 4, w: Math.random() < .35 });
    }
  };

  let lock = null, magnet = null, hidden = true, lx = pointer.x, ly = pointer.y;
  let bx = pointer.x, by = pointer.y, bw = 36, bh = 36, rot = 0, mEl = null, mX = 0, mY = 0;
  document.addEventListener('pointerover', e => {
    const t = e.target;
    const inField = !!t.closest('input,textarea');
    const sat = t.closest('.sat'), card = t.closest('.card');
    let label = '';
    if (sat) label = 'Drag';
    else if (t.closest('#avHead')) label = 'Poke';
    else if (card && !card.classList.contains('is-active')) label = 'Open';
    lock = (!sat && !inField) ? t.closest('a,button') : null;
    magnet = lock && lock.matches('.btn,.nav-links a,.menu-btn,.brand,.ctr button,.mood,.x,.links a') ? lock : null;
    lab.textContent = label;
    lab.classList.toggle('on', !!label);
    cur.classList.toggle('is-lock', !!lock);
    hidden = inField; cur.classList.toggle('is-hidden', hidden);
  });
  document.documentElement.addEventListener('mouseleave', () => { hidden = true; cur.classList.add('is-hidden'); lab.classList.remove('on'); });
  addEventListener('pointermove', () => { if (hidden && !$('input:hover,textarea:hover')) { hidden = false; cur.classList.remove('is-hidden'); } }, { passive: true });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    cur.classList.add('is-down');
    const w = document.createElement('div'); w.className = 'cur-wave'; w.style.translate = `${e.clientX}px ${e.clientY}px`; document.body.appendChild(w);
    gsap.fromTo(w, { scale: .4, opacity: .9 }, { scale: 2, opacity: 0, duration: 1, ease: 'expo.out', onComplete: () => w.remove() });
  });
  addEventListener('pointerup', () => cur.classList.remove('is-down'));

  gsap.ticker.add(() => {
    const vx = pointer.x - lx, vy = pointer.y - ly, speed = Math.hypot(vx, vy); lx = pointer.x; ly = pointer.y;
    if (speed > 1 && !hidden) spawn(pointer.x, pointer.y, -vx * .12, -vy * .12, Math.min(12, 2 + (speed / 5 | 0)), 1.8);

    // reticle: free (tilts with velocity), lock (wraps the target like focus brackets), or label (opens up)
    let tw = 36, th = 36, cx = pointer.x, cy = pointer.y, tr = 0;
    if (lock && lock.isConnected) {
      const r = lock.getBoundingClientRect(), ocx = r.left + r.width / 2, ocy = r.top + r.height / 2;
      tw = r.width + 16; th = r.height + 14; cx = ocx + (pointer.x - ocx) * .1; cy = ocy + (pointer.y - ocy) * .1; tr = 0;
    } else if (lab.textContent) { tw = th = 58; tr = 0; }
    bx += (cx - bx) * .16; by += (cy - by) * .16; bw += (tw - bw) * .14; bh += (th - bh) * .14; rot += (tr - rot) * .14;
    box.style.width = bw.toFixed(1) + 'px'; box.style.height = bh.toFixed(1) + 'px';
    box.style.transform = `translate(${(bx - bw / 2).toFixed(1)}px,${(by - bh / 2).toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
    dot.style.translate = `${pointer.x}px ${pointer.y}px`;
    lab.style.translate = `${(bx + bw / 2 + 6).toFixed(1)}px ${(by - bh / 2 - 22).toFixed(1)}px`;

    // magnetic pull on buttons, eased back to rest when released
    if (magnet !== mEl && Math.abs(mX) + Math.abs(mY) < .3) { if (mEl) mEl.style.translate = ''; mEl = magnet; mX = mY = 0; }
    if (mEl) {
      let gx = 0, gy = 0;
      if (magnet === mEl) { const r = mEl.getBoundingClientRect(); gx = Math.max(-6, Math.min(6, (pointer.x - (r.left + r.width / 2 - mX)) * .14)); gy = Math.max(-4, Math.min(4, (pointer.y - (r.top + r.height / 2 - mY)) * .14)); }
      mX += (gx - mX) * .2; mY += (gy - mY) * .2;
      mEl.style.translate = `${mX.toFixed(2)}px ${mY.toFixed(2)}px`;
    }

    // pixel comet: snapped to a 4px grid, drawn only while particles are alive
    if (P.length || trail.dataset.dirty) {
      tc.clearRect(0, 0, vw, vh);
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.x += p.vx; p.y += p.vy; p.vx *= .95; p.vy = p.vy * .95 + .04; p.l -= p.d;
        if (p.l <= 0) { P.splice(i, 1); continue; }
        const s = p.s * (.5 + p.l * .5);
        tc.globalAlpha = Math.min(1, p.l * 1.4); tc.fillStyle = p.w ? ink : acc;
        tc.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, s, s);
      }
      tc.globalAlpha = 1;
      trail.dataset.dirty = P.length ? '1' : '';
    }
  });
}
