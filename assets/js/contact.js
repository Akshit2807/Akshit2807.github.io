/* The write-to-me sheet. Messages go to Web3Forms, which relays them by email, so the address
   itself never appears on the page or in this code. Never add a mailto: or the address here. */
import { $, $$, buzz } from './core.js';
import { track, upgrade } from './analytics.js';
import { lenis } from './scroll.js';
import { menuApi } from './ui.js';

/* paste a free Web3Forms access key here to receive messages by email without exposing the address */
const FORM_KEY = 'c6afb020-d50a-48d2-869d-6099527bfde2';

export const isSheetOpen = () => !!document.querySelector('#sheet.is-open');

export function initContact() {
  const sheet = $('#sheet'), form = $('#writeForm'), status = $('#formStatus'), sendBtn = $('#sendBtn');
  let lastFocus = null;
  function openSheet() { track('write_sheet_open'); lastFocus = document.activeElement; sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); setTimeout(() => $('#fName').focus(), 300); }
  function closeSheet() { if (sheet.classList.contains('is-open')) track('write_sheet_close'); sheet.classList.remove('is-open'); sheet.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); lastFocus && lastFocus.focus(); }
  $$('[data-write]').forEach(b => b.addEventListener('click', openSheet));
  $$('[data-close]').forEach(b => b.addEventListener('click', closeSheet));
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (sheet.classList.contains('is-open')) closeSheet(); else if (menuApi.isOpen()) { menuApi.close(); menuApi.focusButton(); } }
    if (e.key === 'Tab' && sheet.classList.contains('is-open')) {
      const f = $$('button,input:not(.hp),textarea', form), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  const setStatus = (msg, cls) => { status.textContent = msg; status.className = 'status-msg ' + (cls || ''); if (cls === 'ok') buzz([10, 60, 24]); else if (cls === 'err') buzz([40, 40, 40]); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#fName').value.trim(), email = $('#fMail').value.trim(), message = $('#fMsg').value.trim();
    track('form_submit_attempt');
    if (!name || !email || !message) { track('form_error_missing_fields'); return setStatus('All three fields, please.', 'err'); }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { track('form_error_bad_email'); return setStatus('That email looks off.', 'err'); }
    if ($('.hp').value) { track('form_bot_blocked'); return setStatus('Sent.', 'ok'); }
    if (FORM_KEY) {
      sendBtn.disabled = true; setStatus('Sending');
      try {
        const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ access_key: FORM_KEY, name, email, message, subject: `Portfolio message from ${name}` }) });
        const j = await r.json();
        if (j.success) { track('form_sent'); upgrade('form_sent'); setStatus("Sent. I'll get back to you soon.", 'ok'); form.reset(); setTimeout(closeSheet, 1800); }
        else throw new Error(j.message || 'failed');
      } catch (err) { track('form_send_failed'); setStatus('Could not send. Try again in a minute.', 'err'); }
      sendBtn.disabled = false;
    } else {
      track('form_offline'); setStatus('The form is offline right now. Reach me on LinkedIn instead.', 'err');
    }
  });
}
