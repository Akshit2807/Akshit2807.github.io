/* The pixel avatar and its mood engine. These two belong together: drawAvatar() paints the
   32x40 sprite, and the mood engine paints expressions over it through the faceFx hook, so
   splitting them would just be a circular import with extra steps. */
import { $, $$, root, reduced, fine, coarse, buzz, pointer } from './core.js';
import { track, tag, upgrade } from './analytics.js';
import { lenis } from './scroll.js';
import { orbit } from './orbit.js';

/* ---------- pixel avatar (32x40) ---------- */
export const SPR = [".........oooooooooooooo.........", "........ohhhhhhhhhhhhhho........", ".......ohhHHHHHhhhhhhhhho.......", "......ohhhHHHHHhhhhhhhhhho......", "......ohhhhhHHhhhhhhhhhhho......", "......ohhhhhhhhhhhhhhhhhho......", "......ohhhhhhhhhhhhhhhhhho......", "......ohhhhhhhhhhhhhhhhhho......", "......ohhhhhsshhhsshhhshho......", "......ohhSSSSsssssssssdhho......", "......ohhSSSSsssssssssdhho......", "......osssssssssssssssdhho......", "......osssbbbbssssbbbbddso......", "......ossbssssssssssssbdso......", ".....osssseeeesssseeeeddsso.....", ".....odssseeeesssseeeeddsso.....", ".....ossssdeeessssdeeeddsdo.....", ".....osssssssssddsssssddsso.....", "......ossssssssddsssssddso......", "......ossssssssdssssssddso......", "......osssssdssssssdssddso......", "......ossssssmmmmmmsssddso......", ".......ossssssSSSSssssddo.......", ".......ossssssssssssssddo.......", ".......ossssssssssssssdso.......", ".......osssddddddddddddso.......", "........oossddddddddddoo........", ".........oooddddddddooo.........", ".......ookkkkkkkkkkkkkkoo.......", ".....oockckkkcccccckkkcCcoo.....", "....occccckkkttttttkkkccccco....", "...okkkkccckwcttTtcwkccccccco...", "...okkkkccccwcttTtcwccccccCCo...", "..okkkkkccccwccttccwccccccCCco..", "..okkkkkccccwccccccwccccccCCco..", "..okkkkkccccwccccccwcccccCCCCo..", "..okkkkkccccwccccccwcccccCCCCo..", "..okkkkkccccWccccccWcccccCCCCo..", "..okkkkkckkkkkkkkkkkkkkccCCCCo..", "..okkkkkcccccccccccccccccCCCCo.."];
export const av = $('#avatar');
const ax = av.getContext('2d');
export const PAL = () => ({ h:'#15131C', H:'#2A2738', s:'#C98B5B', S:'#DDA372', d:'#A86E42', e:'#F5F1EA', b:'#2A1E16', m:'#8A4A35', n:'#8F5C36', c: getComputedStyle(root).getPropertyValue('--accent').trim() || '#3B5BF0', C:'#7E97FF', k:'#2B44BD', t:'#ECEEF5', T:'#C9CDD8', w:'#ECEEF5', W:'#C9CDD8', o:'#0B0A12' });
let blink = false, pdx = 0, pdy = 0;
let faceFx = null; // mood engine paints expressions over the base sprite
export function drawAvatar() {
  const p = PAL(); ax.clearRect(0, 0, 32, 40);
  SPR.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; let c = p[ch]; if (ch === 'e' && blink) c = p.d; ax.fillStyle = c; ax.fillRect(x, y, 1, 1); }));
  if (!blink) { ax.fillStyle = p.o; [[11, 15], [19, 15]].forEach(([ex, ey]) => ax.fillRect(ex + pdx, ey + pdy, 2, 2)); ax.fillStyle = 'rgba(255,255,255,.55)'; [[11, 15], [19, 15]].forEach(([ex, ey]) => ax.fillRect(ex + pdx, ey + pdy, 1, 1)); }
  if (faceFx) faceFx(p);
}
export function initAvatar() {
drawAvatar();
  if (!reduced) (function blinkLoop() { setTimeout(() => { blink = true; drawAvatar(); setTimeout(() => { blink = false; drawAvatar(); blinkLoop(); }, 110); }, 2600 + Math.random() * 3200); })();
addEventListener('pointermove', e => {
  pointer.x = e.clientX; pointer.y = e.clientY;
  if (!fine) return;
  const r = av.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .38;
  const ndx = Math.max(-1, Math.min(1, Math.round((pointer.x - cx) / 300))), ndy = Math.max(-1, Math.min(1, Math.round((pointer.y - cy) / 260)));
  if (ndx !== pdx || ndy !== pdy) { pdx = ndx; pdy = ndy; drawAvatar(); }
}, { passive: true });
new MutationObserver(drawAvatar).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
}

/* ---------- avatar mood engine: spin the orbit hard and Akshit gets curious, dizzy, then furious ---------- */
export function initMood() {
  if (reduced) return;
  const head = $('#avHead'), fxc = $('#avatarFx').getContext('2d'), bubble = $('#avBubble');
  const spinEl = $('#spin'), stateEl = $('#spinState'), hintEl = $('#spinHint'), segs = $$('#spinMeter i'), toast = $('#toast');
  const STATES = {
    calm:    { label: 'Calm',       hint: coarse ? 'Swipe the phones. Faster.' : 'Flick the phones. Faster.', lines: [] },
    curious: { label: 'Curious',    hint: 'Keep going…',     lines: ['Ooh. Spinny.', 'Is that all?', 'Faster?', 'Warm-up lap?', 'My grandma spins faster', 'Go on then', 'That tickles'], buzz: 8 },
    dizzy:   { label: 'Dizzy',      hint: "Don't stop now",  lines: ['whoa whoa whoa', 'I see 14 apps', 'pointer.y Flutter is fluttering', 'which one is UrbanEye', 'hot reload pointer.y brain', 'the pixels are moving', 'I want to get off the carousel'], buzz: [20, 30, 20] },
    mad:     { label: 'Furious',    hint: 'You monster.',    lines: ['STOP. SPINNING. ME.', 'I SHIP APPS, NOT CAROUSELS', 'RUNTIME ERROR: PATIENCE', '404: CALM NOT FOUND', 'THIS IS NOT A FIDGET SPINNER', 'FILING A BUG REPORT ON YOU'], buzz: [60, 40, 60, 40, 90] },
    recover: { label: 'Recovering', hint: 'Let him breathe.', lines: ['…need a minute', 'who shipped that', 'do it again. no. wait.', 'rebooting…', 'ok. ok. ok.', 'note to self: no more carousels'], buzz: 12 }
  };
  hintEl.textContent = STATES.calm.hint;
  let state = 'calm', energy = 0, since = performance.now(), lastLen = -1, lastBubble = 0, frame = -1, fxOn = false, lastToast = -1e9, spins = 0, emote = null;
  try { spins = +localStorage.getItem('akshitSpins') || 0; } catch (e) {}
  const puffs = [], pick = a => a[Math.random() * a.length | 0], bags = {}, lastLine = {};
  const draw = (key, arr) => {
    let b = bags[key];
    if (!b || !b.length) { b = bags[key] = [...arr].sort(() => Math.random() - .5); if (b[b.length - 1] === lastLine[key]) b.reverse(); }
    return (lastLine[key] = b.pop());
  };
  const accent = () => getComputedStyle(root).getPropertyValue('--accent-text').trim();

  const say = txt => { bubble.textContent = txt; bubble.classList.remove('on'); void bubble.offsetWidth; bubble.classList.add('on'); lastBubble = performance.now(); };
  const TITLES = [[10, 'Hired. As a DJ.'], [5, 'Please seek help'], [3, 'Serial spinner'], [1, 'Made Akshit dizzy']];
  const tctx = toast.querySelector('canvas').getContext('2d');
  ['.XXXXX.', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...', '..XXX..', '.XXXXX.'].forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { tctx.fillStyle = y < 3 ? '#FFD84D' : '#E0A92E'; tctx.fillRect(x, y, 1, 1); } }));
  const showToast = (title, sub) => {
    track('achievement_unlocked', { achievement: title });
    const now = performance.now(); if (now - lastToast < 8000) return; lastToast = now;
    toast.querySelector('strong').textContent = title;
    toast.querySelector('small').textContent = sub;
    toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 3400);
  };
  const achievement = () => {
    spins++; try { localStorage.setItem('akshitSpins', spins); } catch (e) {}
    showToast(TITLES.find(([n]) => spins >= n)[1], 'Furious ×' + spins);
  };
  const setState = s => {
    if (s === state) return;
    state = s; since = performance.now(); frame = -1;
    const d = STATES[s];
    stateEl.textContent = d.label; hintEl.textContent = d.hint; spinEl.dataset.state = s;
    emote = null;
    if (d.lines.length) say(draw(s, d.lines)); else bubble.classList.remove('on');
    if (d.buzz) buzz(d.buzz);
    if (s !== 'calm') track('avatar_mood_' + s);
    if (s === 'mad') { achievement(); upgrade('avatar_furious'); }
    drawAvatar();
  };

  // expressions: pixel overwrites on the 32×40 sprite (eyes rows 14-16, brows row 12-13, mouth row 21)
  const P1 = (x, y, c) => { ax.fillStyle = c; ax.fillRect(x, y, 1, 1); };
  const clearEyes = p => { for (const x0 of [10, 18]) { for (let y = 14; y <= 15; y++) for (let x = x0; x < x0 + 4; x++) P1(x, y, p.e); for (let x = x0 + 1; x < x0 + 4; x++) P1(x, 16, p.e); } };
  const brows = (p, pts) => { for (const x of [10, 11, 12, 13, 18, 19, 20, 21]) P1(x, 12, p.s); P1(9, 13, p.s); P1(22, 13, p.s); pts.forEach(([x, y]) => P1(x, y, p.b)); };
  const mouth = (p, pts) => { for (let x = 13; x <= 18; x++) P1(x, 21, p.s); pts.forEach(([x, y]) => P1(x, y, p.m)); };
  const RING = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const emoteFace = p => {
    const k = emote.kind;
    if (k === 'hello' || k === 'brand') {            // happy ^ ^ eyes, pink cheeks, big smile
      for (const x0 of [10, 18]) { for (let y = 14; y <= 16; y++) for (let x = x0; x < x0 + 4; x++) P1(x, y, p.s); [[0, 15], [1, 14], [2, 14], [3, 15]].forEach(([dx, y]) => P1(x0 + dx, y, p.o)); }
      [[9, 18], [10, 18], [21, 18], [22, 18]].forEach(([x, y]) => P1(x, y, '#E8918A'));
      mouth(p, [[13, 20], [14, 21], [15, 21], [16, 21], [17, 21], [18, 20]]);
    } else if (k === 'wink') {
      for (let y = 14; y <= 16; y++) for (let x = 18; x < 22; x++) P1(x, y, p.s);
      for (let x = 18; x < 22; x++) P1(x, 15, p.o);
      mouth(p, [[14, 21], [15, 21], [16, 21], [17, 20]]);
    } else if (k === 'annoyed') {
      for (const x0 of [10, 18]) for (let x = x0; x < x0 + 4; x++) P1(x, 14, p.s);
      brows(p, [[10, 13], [11, 12], [12, 12], [13, 12], [18, 12], [19, 12], [20, 12], [21, 13]]);
      mouth(p, [[14, 21], [15, 21], [16, 21], [17, 21]]);
    } else if (k === 'sulk') {                        // heavy lids, eyes turned away
      clearEyes(p);
      for (const x0 of [10, 18]) for (let x = x0; x < x0 + 4; x++) { P1(x, 14, p.s); P1(x, 15, p.s); }
      [[10, 16], [11, 16], [18, 16], [19, 16]].forEach(([x, y]) => P1(x, y, p.o));
      mouth(p, [[14, 21], [15, 21], [16, 21], [17, 21]]);
    } else if (k === 'yawn') {
      for (const x0 of [10, 18]) { for (let y = 14; y <= 16; y++) for (let x = x0; x < x0 + 4; x++) P1(x, y, p.s); for (let x = x0; x < x0 + 4; x++) P1(x, 16, p.o); }
      mouth(p, [[14, 21], [15, 21], [16, 21], [14, 22], [16, 22], [14, 23], [15, 23], [16, 23]]);
      P1(15, 22, '#5A2A22');
    }
  };
  faceFx = p => {
    if (state === 'calm') { if (emote) emoteFace(p); return; }
    if (state === 'curious') {
      brows(p, [[10, 11], [11, 11], [12, 11], [13, 11], [18, 11], [19, 11], [20, 11], [21, 11]]);
      mouth(p, [[15, 21], [16, 21], [15, 22], [16, 22]]);
    } else if (state === 'dizzy') {
      clearEyes(p);
      const f = Math.max(0, frame) % 8;
      [[11, 15, 1], [20, 15, -1]].forEach(([cx, cy, dir]) => { P1(cx, cy, p.o); for (let k = 0; k < 3; k++) { const [dx, dy] = RING[((f * dir + k) % 8 + 8) % 8]; P1(cx + dx, cy + dy, p.o); } });
      brows(p, [[10, 12], [11, 11], [12, 12], [18, 11], [19, 12], [20, 12], [21, 11]]);
      mouth(p, [[13, 21], [14, 22], [15, 21], [16, 22], [17, 21], [18, 22]]);
      [[9, 18], [10, 18], [21, 18], [22, 18]].forEach(([x, y]) => P1(x, y, '#E8918A'));
    } else if (state === 'mad') {
      SPR.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 's' || ch === 'S' || ch === 'd') { ax.fillStyle = 'rgba(230,50,35,.38)'; ax.fillRect(x, y, 1, 1); } }));
      clearEyes(p);
      for (const x0 of [10, 18]) for (let x = x0; x < x0 + 4; x++) P1(x, 14, '#B8563F');
      [[11, 15], [12, 15], [19, 15], [20, 15]].forEach(([x, y]) => P1(x, y, p.o));
      brows(p, [[10, 11], [11, 12], [12, 12], [13, 13], [21, 11], [20, 12], [19, 12], [18, 13]]);
      mouth(p, [[14, 21], [15, 21], [16, 21], [17, 21], [13, 22], [18, 22]]);
    } else if (state === 'recover') {
      clearEyes(p);
      for (const x0 of [10, 18]) for (let x = x0; x < x0 + 4; x++) P1(x, 14, p.s);
      [[11, 16], [12, 16], [19, 16], [20, 16]].forEach(([x, y]) => P1(x, y, p.o));
      mouth(p, [[14, 21], [15, 21], [16, 21], [17, 21]]);
    }
  };

  // overlay effects on a 56×64 canvas; the sprite sits at (12,16) inside it
  const dot = (x, y, c, a = 1) => { fxc.globalAlpha = a; fxc.fillStyle = c; fxc.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const fxDraw = (now, T) => {
    fxc.clearRect(0, 0, 56, 64); fxOn = true;
    if (state === 'calm' && emote) emoteFx(now, T);
    if (state === 'curious') { const a = .55 + .45 * Math.sin(T * 6), c = accent(); [[0, 0], [1, 0], [2, 0], [2, 1], [1, 2], [1, 4]].forEach(([dx, dy]) => dot(44 + dx, 4 + dy, c, a)); }
    if (state === 'dizzy' || state === 'recover') {
      const n = state === 'dizzy' ? 3 : 2, fade = state === 'recover' ? Math.max(0, 1 - (now - since) / 1600) : 1;
      for (let i = 0; i < n; i++) {
        const a = T * 3.2 + i * Math.PI * 2 / n, x = 28 + Math.cos(a) * 17, y = 13 + Math.sin(a) * 4, al = (Math.sin(a) > 0 ? 1 : .45) * fade;
        dot(x, y, '#FFD84D', al); dot(x - 1, y, '#FFD84D', al); dot(x + 1, y, '#FFD84D', al); dot(x, y - 1, '#FFD84D', al); dot(x, y + 1, '#FFD84D', al);
      }
    }
    if (state === 'mad') {
      if (Math.random() < .4) puffs.push({ x: Math.random() < .5 ? 16 : 40, y: 22, l: 1, vx: (Math.random() - .5) * .35 });
      const a = Math.sin(T * 14) > 0 ? 1 : .35;
      [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]].forEach(([dx, dy]) => dot(40 + dx, 10 + dy, '#FF4D4D', a));
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i]; q.y -= .35; q.x += q.vx; q.l -= .025;
      if (q.l <= 0) { puffs.splice(i, 1); continue; }
      fxc.globalAlpha = q.l * .8; fxc.fillStyle = '#D9DCE3'; const s = q.l > .5 ? 2 : 1; fxc.fillRect(Math.round(q.x), Math.round(q.y), s, s);
    }
    if (state === 'recover') { const k = ((now - since) % 1600) / 1600; dot(37, 27 + k * 8, '#7FC8FF', 1 - k); dot(36, 28 + k * 8, '#7FC8FF', 1 - k); dot(37, 28 + k * 8, '#7FC8FF', 1 - k); dot(38, 28 + k * 8, '#7FC8FF', 1 - k); }
    fxc.globalAlpha = 1;
  };

  // ---------- gestures: only while calm; spinning always wins ----------
  const EMOTE_MS = { hello: 4200, brand: 1900, wink: 1500, annoyed: 1900, sulk: 4000, yawn: 3600 };
  const emoteOn = (kind, line) => {
    if (state !== 'calm') return false;
    const now = performance.now();
    emote = { kind, t0: now, until: now + EMOTE_MS[kind] };
    track('avatar_' + kind);
    if (line) say(line);
    drawAvatar();
    return true;
  };
  const emoteFx = (now, T) => {
    const k = emote.kind, age = now - emote.t0;
    if (k === 'hello' || k === 'brand') {             // raised arm from the right shoulder, hand waving
      const P = PAL(), sway = Math.floor(age / 160) % 2;
      for (let i = 0; i <= 10; i++) { const x = 40 + i * .6 + sway * i * .1, y = 45 - i * 1.7; dot(x, y, P.c); dot(x + 1, y, P.k); }
      const hx = 45 + sway, hy = 25;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) dot(hx + x, hy + y, y === 3 ? P.d : P.s);
      [[0, -1], [1, -2], [2, -2], [3, -1]].forEach(([x, y]) => dot(hx + x, hy + y, P.s));
      dot(hx - 1, hy + 1, P.s);
      if (k === 'hello') for (let i = 0; i < 3; i++) { const a = T * 2 + i * 2.1; if (Math.sin(a * 3) > .3) dot(8 + i * 14 + Math.sin(a) * 2, 10 + Math.cos(a) * 3, '#FFFFFF', .9); }
    } else if (k === 'wink') {
      if (age < 900) [[0, 0], [0, 1], [0, 2], [0, 4]].forEach(([x, y]) => dot(44 + x, 5 + y, '#FFD84D'));
    } else if (k === 'annoyed' || k === 'sulk') {
      const a = k === 'sulk' ? .6 : (Math.sin(T * 10) > 0 ? 1 : .4);
      [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]].forEach(([x, y]) => dot(40 + x, 10 + y, '#FF4D4D', a));
    } else if (k === 'yawn') {
      for (let i = 0; i < 3; i++) {
        const q = (age / 1000 * .6 + i / 3) % 1, x = 40 + i * 3 + Math.sin(q * 6) * 1.5, y = 16 - q * 12;
        [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]].forEach(([dx, dy]) => dot(x + dx, y + dy, '#9FB0FF', 1 - q));
      }
    }
  };

  // welcome: time-of-day greeting once per session, "Welcome back!" for returning visitors
  const hour = new Date().getHours();
  const HI = hour < 5 ? 'Hey, night owl.' : hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : hour < 22 ? 'Good evening!' : 'Hey, night owl.';
  const HELLO2 = [coarse ? 'Swipe the phones. I dare you.' : 'Drag the phones. I dare you.', 'I build apps that ship.', 'Scroll down, the good stuff is below.', 'Pull up a chair.'];
  let visited = false, greetDone = false, preGoneAt = 0;
  try { visited = !!localStorage.getItem('akshitVisited'); localStorage.setItem('akshitVisited', '1'); greetDone = sessionStorage.getItem('akshitGreeted') === '1'; } catch (e) {}
  tag('returning_visitor', visited);

  // brand / back-to-top: the dot hops, and he waves when you arrive at the top
  const BRAND = ['You rang?', "That's me. Hi.", 'AP, reporting for duty', 'Back to the top!', 'Yep, still here.'];
  let calledTop = 0;
  $$('a[href="#top"]').forEach(a => a.addEventListener('click', () => {
    calledTop = performance.now(); buzz(12);
    const em = a.querySelector('em'); if (em) { em.classList.remove('hop'); void em.offsetWidth; em.classList.add('hop'); }
  }));

  // poke: squash + escalating replies; six quick pokes and he sulks for a bit
  const POKE = [['hey!', 'boop.', 'that tickles', 'yes? hello?', 'hi again'], ["rude.", "I'm working here", 'ok that is enough', 'poke count: rising'], ['ok stop poking', "I'm telling HR", 'this goes on your permanent record']];
  let pokeTimes = [], pokeTotal = 0, pokeMute = 0;
  try { pokeTotal = +localStorage.getItem('akshitPokes') || 0; } catch (e) {}
  const poke = () => {
    const now = performance.now();
    buzz(10);
    track('avatar_poke');
    gsap.fromTo(head, { scale: .88 }, { scale: 1, duration: .7, ease: 'elastic.out(1, .35)', overwrite: 'auto' });
    if (state !== 'calm') { say(draw(state, STATES[state].lines)); return; }
    if (now < pokeMute) return;
    pokeTimes = pokeTimes.filter(t => now - t < 4000); pokeTimes.push(now);
    const n = pokeTimes.length;
    pokeTotal++; try { localStorage.setItem('akshitPokes', pokeTotal); } catch (e) {}
    if (pokeTotal === 20) showToast('Certified poker', 'Pokes ×20');
    if (n >= 6) { emoteOn('sulk', "fine. I'm not talking to you."); pokeMute = now + 4000; pokeTimes = []; }
    else if (n === 5) emoteOn('annoyed', draw('poke3', POKE[2]));
    else if (n >= 3) emoteOn('annoyed', draw('poke2', POKE[1]));
    else emoteOn('wink', draw('poke1', POKE[0]));
  };
  head.addEventListener('click', poke);
  head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });

  // idle: nobody around for 15s while he's on screen, he yawns (once per visit)
  const IDLE = ['hello? anyone?', "I'll just wait here", 'psst. spin the phones.', '*yawns in pixels*'];
  let lastInput = performance.now(), idled = false;
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, () => lastInput = performance.now(), { passive: true }));

  gsap.ticker.add(() => {
    const now = performance.now(), T = now / 1000, held = now - since;
    // gesture scheduling
    if (emote && now > emote.until) { emote = null; drawAvatar(); if (state === 'calm') bubble.classList.remove('on'); }
    if (!greetDone && !document.getElementById('pre')) {
      if (!preGoneAt) preGoneAt = now;
      else if (now - preGoneAt > 1200) {
        if (orbit.heroInView && scrollY < innerHeight * .4 && !emote && emoteOn('hello', visited ? 'Welcome back!' : HI)) {
          greetDone = true;
          try { sessionStorage.setItem('akshitGreeted', '1'); } catch (e) {}
          setTimeout(() => { if (emote && emote.kind === 'hello') say(draw('hello2', HELLO2)); }, 1900);
        } else if (now - preGoneAt > 9000) greetDone = true; // missed the moment: skip rather than greet late
      }
    }
    if (calledTop) {
      if (orbit.heroInView && scrollY < 60) { if (now - calledTop < 4000) emoteOn('brand', draw('brand', BRAND)); calledTop = 0; }
      else if (now - calledTop > 4000) calledTop = 0;
    }
    if (!idled && greetDone && state === 'calm' && !emote && orbit.heroInView && now - lastInput > 15000) { idled = true; emoteOn('yawn', draw('idle', IDLE)); }
    const scroll = lenis && orbit.heroInView ? Math.min(.006, Math.abs(lenis.velocity) * .00025) : 0;
    energy = Math.max(0, Math.min(1, energy + Math.max(0, Math.abs(orbit.vel) - .02) * .14 + (energy < .3 ? scroll : 0) - .0038));
    let next = state;
    if (state === 'calm') { if (energy > .15) next = 'curious'; }
    else if (state === 'curious') { if (energy > .45) next = 'dizzy'; else if (energy < .08 && held > 700) next = 'calm'; }
    else if (state === 'dizzy') { if (energy > .88 && held > 1300) next = 'mad'; else if (energy < .3 && held > 700) next = 'recover'; }
    else if (state === 'mad') { if (energy < .6 && held > 1200) next = 'recover'; }
    else if (state === 'recover') { if (energy > .45) next = 'dizzy'; else if (held > 2600) next = 'calm'; }
    setState(next);

    const len = Math.round(energy * segs.length);
    if (len !== lastLen) { segs.forEach((el, i) => el.classList.toggle('on', i < len)); lastLen = len; }
    orbit.ring.fling += (energy * .22 - orbit.ring.fling) * .08;
    orbit.ring.wob = (state === 'dizzy' || state === 'mad') ? Math.sin(T * 5) * .08 * energy : orbit.ring.wob * .9;
    if (!orbit.heroInView) return;

    let rot = 0, tx = 0, ty = 0;
    if (state === 'curious') rot = Math.max(-6, Math.min(6, orbit.vel * 60));
    else if (state === 'dizzy') { rot = Math.sin(T * 6) * 9; tx = Math.sin(T * 3) * 4; }
    else if (state === 'mad') { rot = (Math.random() - .5) * 4; tx = (Math.random() - .5) * 4; ty = (Math.random() - .5) * 3; }
    else if (state === 'recover') rot = Math.sin(T * 2.5) * 6 * Math.max(0, 1 - held / 2600);
    if (state === 'calm' && emote) {
      const age = now - emote.t0, k = emote.kind;
      if (k === 'hello') rot = Math.sin(T * 7) * 3;
      else if (k === 'brand') { ty = -Math.abs(Math.sin(age / 1000 * Math.PI * 2.5)) * 10 * Math.max(0, 1 - age / 1400); rot = Math.sin(T * 7) * 2; }
      else if (k === 'annoyed') rot = -4;
      else if (k === 'sulk') { rot = -7; tx = -3; }
      else if (k === 'yawn') rot = Math.sin(age / 3400 * Math.PI) * 6;
    }
    head.style.rotate = rot.toFixed(2) + 'deg';
    head.style.translate = tx.toFixed(1) + 'px ' + ty.toFixed(1) + 'px';

    if (state === 'dizzy') { const f = Math.floor(T * 12); if (f !== frame) { frame = f; drawAvatar(); } }
    if (state !== 'calm' && now - lastBubble > 2600) say(draw(state, STATES[state].lines));
    if (state !== 'calm' || emote || puffs.length) fxDraw(now, T);
    else if (fxOn) { fxc.clearRect(0, 0, 56, 64); fxOn = false; }
  });
}
