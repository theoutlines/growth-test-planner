// Motion: soft swaps, DOM morph, sliding pills, overlays (transitions.dev tokens).
import { UI, wide } from './state.js';
import { render } from './app.js';

// ------------------------------------------------------------------ motion (transitions.dev tokens and patterns)
// Inside one page the DOM is patched in place (morph), so CSS transitions run on what changed: pills slide,
// bars and lines move, short values cross-blur. A new page is drawn fresh and rises in.
export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const cssMs = (name) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

export function softSwap(el, next) {                         // transitions.dev 34 · text swap soft, without resizing anything:
  const prev = el.dataset.text ?? el.textContent;      // the new value takes its place at once, the old one fades out on top of it
  if (prev === next) return;
  el.dataset.text = next;
  clearTimeout(el._softTimer);
  if (reduced()) { el.textContent = next; delete el.dataset.text; return; }
  const inn = document.createElement('span'); inn.className = 't-new'; inn.textContent = next;
  const out = document.createElement('span'); out.className = 't-old'; out.setAttribute('aria-hidden', 'true'); out.textContent = prev;
  el.classList.add('t-swap'); el.replaceChildren(inn, out);
  el._softTimer = setTimeout(() => endSwap(el), cssMs('--text-soft-dur') + 40);
}
export function endSwap(el) {
  clearTimeout(el._softTimer); el._softTimer = null;
  el.classList.remove('t-swap');
  if (el.dataset.text !== undefined) { el.textContent = el.dataset.text; delete el.dataset.text; }
}
export const SOFT_MAX = 32;                                   // only the answer cross-blurs (data-swap: the headline value, week thresholds, decision day); everything else just changes
export const onlyText = (el) => el.childNodes.length === 1 && el.firstChild.nodeType === 3;
export function morphNode(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
  if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  if (a.nodeType !== 1) return;
  // a swap still running on a node that is about to become something else: finish it first
  if (a._softTimer) {
    const base = (el) => [...el.classList].filter((c) => c !== 't-swap').sort().join(' ');
    if (base(a) !== base(b) || !onlyText(b)) endSwap(a);
  }
  // attributes
  const keepStyle = a.hasAttribute('data-js-style') || a._softTimer;
  for (const { name } of [...a.attributes]) {
    if (name === 'data-text' && a._softTimer) continue;
    if (name === 'style' && keepStyle) continue;
    if (name === 'class' && a._softTimer) continue;
    if (!b.hasAttribute(name)) a.removeAttribute(name);
  }
  for (const { name, value } of [...b.attributes]) {
    if (name === 'style' && keepStyle) continue;
    if (name === 'class' && a._softTimer) { b.classList.forEach((c) => a.classList.add(c)); continue; }
    if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  }
  if (a.tagName === 'INPUT') { if (document.activeElement !== a && a.value !== b.value) a.value = b.value; return; }
  if (a.isContentEditable && a === document.activeElement) return;
  // a short value changing in place: cross-blur it
  if (onlyText(b) && (a._softTimer || onlyText(a))) {
    const next = b.textContent, cur = a.dataset.text ?? a.textContent;
    if (cur !== next) {
      if (!UI.instant && a.hasAttribute('data-swap') && next.length <= SOFT_MAX && cur.length <= SOFT_MAX && !a.closest('[contenteditable]')) softSwap(a, next);
      else { endSwap(a); a.textContent = next; }
    }
    return;
  }
  // children, by position
  const ac = [...a.childNodes], bc = [...b.childNodes];
  for (let i = 0; i < bc.length; i++) { if (i < ac.length) morphNode(ac[i], bc[i]); else a.appendChild(bc[i]); }
  for (let i = bc.length; i < ac.length; i++) ac[i].remove();
}
// transitions.dev 21 · accordion expand: the body grows from 0 to its height and shrinks back before the state flips
export function accToggle(head, bodySel, flip) {
  const box = head.parentElement, body = box.querySelector(':scope > ' + bodySel);
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)', dur = cssMs('--duration-fast');
  if (body && !reduced()) {                          // closing
    body.style.overflow = 'hidden';
    const cs = getComputedStyle(body);
    body.animate([{ height: body.offsetHeight + 'px', paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, opacity: 1 }, { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }], { duration: dur, easing: ease }).onfinish = () => { flip(); render(); };
    return;
  }
  flip(); render();
  const nb = box.querySelector(':scope > ' + bodySel);
  if (!nb || reduced()) return;
  nb.style.overflow = 'hidden';
  const ns = getComputedStyle(nb);
  nb.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }, { height: nb.offsetHeight + 'px', paddingTop: ns.paddingTop, paddingBottom: ns.paddingBottom, opacity: 1 }], { duration: dur, easing: ease }).onfinish = () => { nb.style.overflow = ''; };
}
export function placePills() {                                // transitions.dev 16 · tabs sliding (measured pill)
  document.querySelectorAll('.pill').forEach((pill) => {
    const box = pill.parentElement;
    const on = box.querySelector('[aria-pressed="true"],[aria-checked="true"]');
    if (!on) { pill.style.opacity = '0'; return; }
    const pos = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`, w = on.offsetWidth + 'px', h = on.offsetHeight + 'px';
    if (pill.style.transform === pos && pill.style.width === w && pill.style.height === h) return;
    const first = !pill._placed;                     // a JS property: the morph would strip a data- attribute and kill the slide
    if (first) { pill.style.transition = 'none'; }
    pill.style.opacity = '1'; pill.style.transform = pos; pill.style.width = w; pill.style.height = h;
    if (first) { void pill.offsetWidth; pill.style.removeProperty('transition'); pill._placed = true; }
  });
}
// a control that changes size without a window resize (fonts load, a scrollbar comes or goes, the sheet settles): re-place its pill without sliding
export const pillRO = 'ResizeObserver' in window ? new ResizeObserver((es) => {
  es.forEach((e) => {
    const box = e.target, sz = Math.round(e.contentRect.width) + 'x' + Math.round(e.contentRect.height);
    const was = box._sz; box._sz = sz;
    if (was === undefined || was === sz) return;   // the first report on observe() is not a resize: resetting here killed every slide
    const p = box.querySelector(':scope > .pill'); if (p) p._placed = false;
  });
  placePills();
}) : null;
export function layoutMix() {        // every plan name stays visible: ends pinned to the bar's edges, middle names centred, pushed apart when segments are narrow
  document.querySelectorAll('[data-mixbar]').forEach((bar) => {
    const names = [...(bar.previousElementSibling?.children || [])], segs = [...bar.querySelectorAll('.mseg')], W = bar.clientWidth; if (!names.length || !W) return;
    const bl = bar.getBoundingClientRect().left, wd = names.map((n) => n.offsetWidth), gap = 8;
    const last = segs.length - 1;   // the first name sits on the bar's left edge, the last on its right edge, the ones between centred over their segment (owner, 2026-11-04)
    const left = segs.map((sg, i) => { const r = sg.getBoundingClientRect(); return i === 0 ? 0 : i === last ? W - wd[i] : r.left - bl + r.width / 2 - wd[i] / 2; });
    for (let i = 0; i < left.length; i++) left[i] = Math.max(i ? left[i - 1] + wd[i - 1] + gap : 0, left[i]);
    for (let i = left.length - 1; i >= 0; i--) left[i] = Math.min(i < left.length - 1 ? left[i + 1] - wd[i] - gap : W - wd[i], left[i]);
    names.forEach((n, i) => { n.style.left = Math.max(0, left[i]) + 'px'; });
  });
}
export function afterPaint() { layoutMix(); placePills(); if (pillRO) document.querySelectorAll('.pill').forEach((p) => { const box = p.parentElement; if (!box._ro) { box._ro = true; pillRO.observe(box); } }); }
export const PAGE = (r) => (wide() && r === 'share' ? 'test' : wide() && r === 'share-result' ? 'verdict' : r);   // desktop share is a modal over its page
export function closeThen(after) {                            // overlays leave before the state changes
  const els = document.querySelectorAll('.sheet, .float, .modal, .scrim, .rail .half.plans');
  if (!els.length || reduced()) return after();
  els.forEach((el) => el.classList.add('is-closing'));
  setTimeout(after, document.querySelector('.sheet, .rail .half.plans') ? cssMs('--duration-medium') : cssMs('--duration-quick'));
}
