/* Analytics: Microsoft Clarity + Google Analytics 4, fed by the same two calls.
   track() = one event, tag() = one session property. No personal data ever goes through here:
   no form contents, no email address. Both tags are skipped on localhost (see index.html). */
import { coarse, lite, reduced, root } from './core.js';

const ga = () => window.GA_ID && typeof window.gtag === 'function';

export const track = (name, tags) => {
  try { if (window.clarity) { clarity('event', name); if (tags) Object.entries(tags).forEach(([k, v]) => clarity('set', k, String(v))); } } catch (e) {}
  try { if (ga()) gtag('event', name, tags ? Object.fromEntries(Object.entries(tags).map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 100)])) : {}); } catch (e) {}
};
export const tag = (k, v) => {
  try { window.clarity && clarity('set', k, String(v)); } catch (e) {}
  try { if (ga()) gtag('set', 'user_properties', { [k.slice(0, 24)]: String(v).slice(0, 36) }); } catch (e) {}
};
export const upgrade = reason => { try { window.clarity && clarity('upgrade', reason); } catch (e) {} };

const onceSeen = new Set();
export const trackOnce = (name, tags) => { if (onceSeen.has(name)) return; onceSeen.add(name); track(name, tags); };

/* who is visiting and how, recorded once per session */
export function initAnalytics() {
  tag('viewport', innerWidth < 640 ? 'phone' : innerWidth < 1080 ? 'tablet' : 'desktop');
  tag('pointer', coarse ? 'touch' : 'mouse');
  tag('lite_mode', lite);
  tag('reduced_motion', reduced);
  tag('theme_initial', root.dataset.theme);
  addEventListener('error', e => { track('js_error'); tag('js_error_message', String(e.message || 'unknown').slice(0, 90)); });
  // engaged time while the tab is actually visible
  let visibleSeconds = 0;
  setInterval(() => { if (document.visibilityState !== 'visible') return; visibleSeconds++; if ([15, 30, 60, 120, 300].includes(visibleSeconds)) track('engaged_' + visibleSeconds + 's'); }, 1000);
}

/* what visitors click, how far they read. Runs last: the scroll-depth and section triggers
   need every other ScrollTrigger to exist first. */
export function initClickAnalytics() {
  document.addEventListener('click', e => {
    const el = e.target.closest('a,button'); if (!el) return;
    const label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (el.matches('.nav-links a, .menu a')) track('nav_click', { nav_target: el.getAttribute('href') });
    else if (el.matches('a[href="#top"]')) track(el.matches('.brand') ? 'logo_click' : 'back_to_top_click');
    else if (el.matches('[data-write]')) track('write_cta_click', { write_source: el.closest('.nav') ? 'nav' : el.closest('.hero') ? 'hero' : el.closest('.b-links') ? 'contact_email_tile' : el.closest('#contact') ? 'contact' : 'other' });
    else if (el.matches('.hero-cta a')) track('cta_see_work');
    else if (el.matches('.tab')) track('project_tab_click', { project_tab: label });
    else if (el.matches('#wPrev, #wNext')) track('project_arrow_click', { project_arrow: el.id === 'wNext' ? 'next' : 'prev' });
    else if (el.matches('#menuBtn')) track('mobile_menu_toggle');
    if (el.tagName === 'A' && el.host && el.host !== location.host) {
      // a link inside the reel's link row belongs to whichever project is on screen
      const open = document.querySelector('#workDesc > div.is-active h3');
      const project = el.closest('#workLinks') && open ? open.textContent + ' · ' : '';
      track('outbound_click', { outbound_host: el.host, outbound_label: project + label });
      if (/github\.com$/.test(el.host)) track('github_click');
      if (/linkedin\.com$/.test(el.host)) track('linkedin_click');
    }
  }, { capture: true });
  ['hero', 'work', 'craft', 'experience', 'numbers', 'about', 'contact'].forEach(id => {
    const el = document.getElementById(id);
    if (el) ScrollTrigger.create({ trigger: el, start: 'top 65%', once: true, onEnter: () => track('section_view_' + id, { sections_viewed: id }) });
  });
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: st => [25, 50, 75, 100].forEach(p => { if (st.progress * 100 >= p - .5) trackOnce('scroll_depth_' + p); }) });

  addEventListener('load', () => ScrollTrigger.refresh());
}
