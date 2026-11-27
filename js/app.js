import { DEFAULTS, planOf, decideOptions, fresh, shares } from './math.js';
import { IDEAS } from './data.js';
import { READ, S, UI, fromQuery, go, legacyPlans, route, save, store, toQuery, wide } from './state.js';
import { PEOPLE, SL, STEPS, pctOf, rangeText, setShare, valOf } from './ui.js';
import { PLAN_DEF, areaScreen, convScreen, count, countOnce, ideasFor, sortPlans, startScreen, startsScreen, testScreen, trafficScreen, trialScreen } from './screens.js';
import { shareScreen } from './share.js';
import { addFooter, num, readInputs, resultsScreen, swapMain, verdictScreen } from './verdict.js';
import { PAGE, accToggle, afterPaint, closeThen, cssMs, layoutMix, morphNode, placePills, reduced } from './motion.js';

// ------------------------------------------------------------------ render + events
export const app = document.getElementById('app');
document.getElementById('about')?.remove();   // the plain-text description is for readers without JavaScript (and agents); the app replaces it
// Version letters A, B, C inside running text get a grey chip, so "B" never reads as an article (owner, 2026-11-10, option 2).
// Skipped: headlines, controls, typed text, share messages, charts, and idea text (idea titles start with the article "A"). Anywhere else, a capital A before a lowercase word is read as the article.
export const VL_SKIP = 'script,style,svg,input,textarea,select,option,button.pill,.seg,[contenteditable],.title,h1,.msg,.rb,.fp,.ideas,.ihead,.float,.text,.vl';
export function markVersions(root) {
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest(VL_SKIP) || !/(^|[\s(])[ABC](?=$|[\s’'·:.,)])/.test(n.data) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
  for (const n of nodes) {
    const frag = document.createDocumentFragment(); let last = 0;
    n.data.replace(/(^|[\s(])([ABC])(?=$|[\s’'·:.,)])/g, (m, pre, v, i) => {
      // “A few questions”, “A plan”: a capital A before a lowercase word is the article, not version A
      if (v === 'A' && /^\s[a-z]/.test(n.data.slice(i + m.length))) return m;
      frag.append(n.data.slice(last, i) + pre);
      const b = document.createElement('b'); b.className = 'vl'; b.textContent = v; frag.append(b);
      last = i + m.length; return m;
    });
    frag.append(n.data.slice(last)); n.replaceWith(frag);
  }
}
let lastPage = null;
export function render() {
  const { r } = route();
  const sheet = document.getElementById('sheet'), st = sheet ? sheet.scrollTop : 0;
  const html = { '': startScreen, area: areaScreen, traffic: trafficScreen, starts: startsScreen, conv: convScreen, trial: trialScreen, test: testScreen, share: () => shareScreen(false),
    results: resultsScreen, verdict: verdictScreen, 'share-result': () => shareScreen(true) }[r]();
  const page = PAGE(r);
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  addFooter(tmp.querySelector('main.page:not(.q)'));               // the footer closes every content page, not the four questions
  markVersions(tmp);
  if (page === lastPage && app.firstChild && UI.areaSwap && !reduced()) {
    // a different set of inputs, not new values: swap the content in one soft fade instead of morphing each piece
    const fake = document.createElement('div'); fake.append(...tmp.childNodes); fake.id = 'app';
    app.classList.add('swap-instant'); UI.instant = true; morphNode(app, fake); UI.instant = false;
    void app.offsetWidth; app.classList.remove('swap-instant');
    app.querySelectorAll('.controls > :not(:first-child), main.page > :not(.thr)').forEach((el) => {
      el.querySelectorAll('.pill').forEach((p) => { p._placed = false; });
      el.classList.remove('swap-in'); void el.offsetWidth; el.classList.add('swap-in');
      el.addEventListener('animationend', () => el.classList.remove('swap-in'), { once: true });
    });
  } else if (page === lastPage && app.firstChild) {
    const fake = document.createElement('div'); fake.append(...tmp.childNodes);
    fake.id = 'app'; morphNode(app, fake);                       // same page: patch in place, so things move
  } else {
    app.replaceChildren(...tmp.childNodes);
    if (!reduced()) app.querySelectorAll('main.page, .rail').forEach((el) => { el.classList.add('enter'); el.addEventListener('animationend', () => el.classList.remove('enter'), { once: true }); });
  }
  if (page !== lastPage) {
    countOnce('page', { '': 'start', 'share-result': 'shareresult' }[page] ?? page);
    if (page === 'test') { countOnce('decide', S.decide); countOnce('goal', S.goal); }
  }
  lastPage = page; UI.areaSwap = false;
  if (/^(area|traffic|starts|conv|trial)$/.test(r)) UI.lastStep = STEPS().indexOf(r) + 1;
  const s2 = document.getElementById('sheet'); if (s2) s2.scrollTop = st;
  document.documentElement.style.overflow = document.querySelector('.scrim') ? 'hidden' : '';   // a modal or sheet holds the page still
  document.title = 'Growth Test Planner';
  requestAnimationFrame(afterPaint);
}
export function onRoute() { const { r, qs } = route(); if (qs) fromQuery(qs); UI.overlay = null; const turn = PAGE(r) !== lastPage; render(); if (turn) window.scrollTo(0, 0); }

export function set(key, raw) {
  const v = typeof DEFAULTS[key] === 'number' ? Number(raw) : raw;
  if (['area', 'decide', 'goal', 'weeks', 'versions', 'split', 'trial'].includes(key) && S[key] !== v) count(key, String(v));
  if (key === 'area' && S.area !== v) UI.areaSwap = true;
  S[key] = v;
  if (key === 'trial') S.plans.forEach((x) => { if (x.t !== 'once') x.tr = v; });   // the trial question sets every plan; the plans editor can differ
  if (key === 'area' && !decideOptions(S.area).includes(S.decide)) S.decide = decideOptions(S.area)[0];
  save();
  const { r } = route();
  if (['test', 'results', 'verdict'].includes(r)) history.replaceState(null, '', '#/' + r + '?' + toQuery(r === 'verdict'));
  render();
}

export function planChanged() { save(); const { r } = route(); if (['test', 'results', 'verdict'].includes(r)) history.replaceState(null, '', '#/' + r + '?' + toQuery(r === 'verdict')); render(); }
app.addEventListener('click', (e) => { const pr = e.target.closest('[data-promo]'); if (pr) count('promo', pr.dataset.promo); });
app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-bd-toggle],[data-plan-idea],[data-next-from],[data-plans-toggle],[data-facts-toggle],[data-plans-go],[data-bydate],[data-more-ideas],[data-go],[data-set],[data-plan],[data-plan-del],[data-plan-add],[data-plan-toggle],[data-idea],[data-overlay],[data-close],[data-tone],[data-copy],[data-native-share],[data-billed],[data-toggle-plan],[data-read-go]');
  if (!el) return;
  if (el.dataset.go) {
    const [r, arg] = el.dataset.go.split(':');
    if (arg === 'read') return go(r, true);                 // back to the numbers, with them in the link
    if (r === 'area' && arg) { S.area = arg; if (!decideOptions(S.area).includes(S.decide)) S.decide = decideOptions(S.area)[0]; save(); return go('traffic'); }
    if (document.querySelector('.modal')) return closeThen(() => go(r));   // the share modal leaves before the page underneath updates
    return go(r);
  }
  if ('bdToggle' in el.dataset) { if (!UI.bdOpen) count('bydate', 'open'); return accToggle(el, '.bdbody', () => { UI.bdOpen = !UI.bdOpen; }); }
  if (el.dataset.planIdea) {
    count('ideaplan', el.dataset.planIdea);             // the idea's low end becomes the change to catch; the page shows the traffic it needs
    const it = ideasFor(planOf(S)).find((x) => x.id === el.dataset.planIdea); if (!it) return;
    S.target = it.lo; UI.targetFrom = it.t; UI.bdOpen = true; save(); history.replaceState(null, '', '#/test?' + toQuery());
    return closeThen(() => { UI.overlay = null; render(); document.querySelector('.bydate')?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); });
  }
  if (el.dataset.nextFrom) {              // the next test starts from what this one measured
    const p = planOf(S), inp = readInputs(p), x = inp && inp[el.dataset.nextFrom]; if (!x) return;
    const r2 = (v) => Math.round(v * 100) / 100, paid = x.paid.reduce((t, n) => t + n, 0);
    if (S.area === 'paywall') {
      if (paid) { S.conv = r2(paid / x.people * 100); S.plans.forEach((pl, i) => { pl.s = Math.round(x.paid[i] / paid * 100); }); }
      if (x.trials) S.trialView = r2(x.trials / x.people * 100);
    } else {
      if (x.trials) S.trialRate = r2(x.trials / x.people * 100);
      if (paid) S.paidRate = r2(paid / x.people * 100);
    }
    Object.assign(READ, { A: {}, B: {}, C: {}, billed: true }); S.what = ''; S.target = 0; S.start = ''; UI.targetFrom = ''; save();
    return go('test');
  }
  if ('factsToggle' in el.dataset) return accToggle(el, '.pi-body', () => { UI.factsOpen = !UI.factsOpen; });
  if ('plansToggle' in el.dataset) return accToggle(el, '.pi-body', () => { UI.plansOpen = !UI.plansOpen; });
  if ('plansGo' in el.dataset) {
    if (S.decide !== 'money') { S.decide = 'money'; save(); }
    if (wide()) { render(); const t = document.getElementById('plans-inline'); if (t) { t.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 900); } return; }
    UI.overlay = 'edit'; render(); setTimeout(() => document.getElementById('plans-inline')?.scrollIntoView({ block: 'center' }), 60); return;
  }
  if (el.dataset.bydate) { count('bydate', 'set'); const [w, t] = el.dataset.bydate.split('.').map(Number); S.weeks = w; S.traffic = t; syncTrack('traffic'); return planChanged(); }
  if (el.dataset.set) { if (el.classList.contains('mchip')) haptic(); return set(el.dataset.set, el.dataset.val); }
  if (el.dataset.plan) { const [i, f] = el.dataset.plan.split('.'); const x = S.plans[+i]; x[f] = f === 'tr' ? Number(el.dataset.val) : el.dataset.val; if (x.t === 'once') x.tr = 0; return planChanged(); }
  if (el.dataset.planDel) { S.plans.splice(+el.dataset.planDel, 1); setShare(0, S.plans.length === 1 ? 100 : S.sh0); return planChanged(); }
  if (el.dataset.planToggle) { const t = el.dataset.planToggle, i = S.plans.findIndex((x) => x.t === t);
    if (i >= 0) { if (S.plans.length === 1) return; S.plans.splice(i, 1); setShare(0, S.plans.length === 1 ? 100 : S.sh0); }
    else { S.plans.push({ t, p: PLAN_DEF[t], s: 0, tr: 0 }); setShare(S.plans.length - 1, Math.round(100 / S.plans.length)); sortPlans(); }
    return planChanged(); }
  if ('planAdd' in el.dataset) { const used = S.plans.map((x) => x.t), t = ['month', 'year', 'week', 'once'].find((k) => !used.includes(k)) || 'month'; S.plans.push({ t, p: { week: 6.99, month: 14.99, year: 39.99, once: 29.99 }[t], s: 0, tr: 0 }); /* a new plan starts without a trial */ setShare(S.plans.length - 1, Math.round(100 / S.plans.length)); sortPlans(); return planChanged(); }
  if ('moreIdeas' in el.dataset) { UI.allIdeas = !UI.allIdeas; return render(); }
  if (el.dataset.idea) { count('idea', el.dataset.idea); UI.overlay = 'idea'; UI.idea = el.dataset.idea; return render(); }
  if (el.dataset.overlay) { UI.overlay = el.dataset.overlay; return render(); }
  if ('close' in el.dataset) return closeThen(() => { UI.overlay = null; render(); });
  if (el.dataset.tone) { UI.tone = el.dataset.tone; return render(); }
  if ('copy' in el.dataset) { count('share', UI.tone); return copy(document.getElementById('msgtext').innerText); }
  if ('nativeShare' in el.dataset) {
    count('share', UI.tone);
    const text = document.getElementById('msgtext').innerText;
    if (navigator.share) return navigator.share({ text }).catch(() => {});
    return copy(text);
  }
  if ('billed' in el.dataset) { READ.billed = el.dataset.val === '1'; return render(); }
  if ('togglePlan' in el.dataset) return accToggle(el, '.acc-body', () => { UI.readPlan = !UI.readPlan; });
  if ('readGo' in el.dataset) {
    const p = planOf(S);
    if (!readInputs(p)) { UI.readError = p.decide === 'trials' ? 'Fill in people and trial starts for every version.' : 'Fill in people and at least one kind of payment for every version.'; return render(); }
    UI.readError = ''; return go('verdict', true);
  }
});
app.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.read) {
    const [v, f] = t.dataset.read.split('.'); READ[v][f] = t.value.replace(/[^\d]/g, '');
    if (route().r === 'verdict' && readInputs(planOf(S))) { history.replaceState(null, '', '#/verdict?' + toQuery(true)); swapMain(verdictScreen()); }
  }
  UI.instant = true; setTimeout(() => { UI.instant = false; });
  if (t.dataset.type === 'target') UI.targetFrom = '';
  if (t.dataset.type) { const k = t.dataset.type, v = num(t.value); if (v != null && (v > 0 || SL[k].linear)) { S[k] = SL[k].linear ? Math.min(100, v) : Math.min(SL[k].hi * 10, v); save(); syncTrack(k, t); refreshMain(); } }
  if ('date' in t.dataset) { if (/^\d{4}-\d{2}-\d{2}$/.test(t.value)) { S.start = t.value; save(); history.replaceState(null, '', '#/' + route().r + '?' + toQuery(route().r === 'verdict')); render(); } }
  if ('what' in t.dataset) { S.what = t.value.slice(0, 120); save(); const { r } = route(); if (r === 'test') history.replaceState(null, '', '#/test?' + toQuery()); return; }
  if ('target' in t.dataset) { UI.targetFrom = ''; const v = num(t.value); if (v != null && v > 0 && v <= 500) { S.target = v; save(); refreshMain(); } }
  if (t.dataset.planPrice) { const v = num(t.value); if (v != null && v > 0) { S.plans[+t.dataset.planPrice].p = v; save(); refreshMain(); } }
});
app.addEventListener('change', (e) => {
  if ('whatPick' in e.target.dataset) {
    const v = e.target.value, it = IDEAS[S.area].find((x) => x.id === v);
    S.whatId = v; S.what = it ? it.t : (S.whatId === 'other' && !IDEAS[S.area].some((x) => x.t === S.what) ? S.what : '');
    count('what', v); save(); planChanged();
    if (v === 'other') requestAnimationFrame(() => document.querySelector('[data-what]')?.focus());
    return;
  }
  const pt = e.target.dataset.planType; if (pt !== undefined) { if (e.target.value === '-') { S.plans.splice(+pt, 1); setShare(0, S.plans.length === 1 ? 100 : S.sh0); return planChanged(); } const x = S.plans[+pt]; x.t = e.target.value; if (x.t === 'once') x.tr = 0; sortPlans(); return planChanged(); }
  const ptr = e.target.dataset.planTrial; if (ptr !== undefined) { S.plans[+ptr].tr = Number(e.target.value); return planChanged(); }
  const psh = e.target.dataset.planShare; if (psh !== undefined) { const v = num(e.target.value); if (v != null) { setShare(+psh, v); return planChanged(); } } if (e.target.dataset.type) { syncTrack(e.target.dataset.type); if (route().r !== 'test') render(); } });
export const numField = (t) => t && t.tagName === 'INPUT' && ('type' in t.dataset || 'target' in t.dataset || 'planPrice' in t.dataset || 'planShare' in t.dataset || 'read' in t.dataset);
// tapping a number selects it whole, so typing replaces it instead of landing in the middle (2.75 → 32.75)
app.addEventListener('mousedown', (e) => { const t = e.target; if (!numField(t) || document.activeElement === t) return; e.preventDefault(); t.focus(); t.select(); });
app.addEventListener('focusin', (e) => { if (numField(e.target)) e.target.select(); });   // keyboard (Tab) gets the same
app.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && UI.overlay) { closeThen(() => { UI.overlay = null; render(); }); return; }
  if (e.target.dataset.type && e.key === 'Enter') e.target.blur();
  const mh = e.target.closest('[data-mix-handle]');
  if (mh && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { const i = +mh.dataset.mixHandle, w = shares(S.plans).map((x) => x * 100); mixSet(i, w.slice(0, i + 1).reduce((t, x) => t + x, 0) + (e.key === 'ArrowRight' ? 5 : -5)); planChanged(); setTimeout(() => document.querySelector(`[data-mix-handle="${i}"]`)?.focus()); e.preventDefault(); return; }
  const tr = e.target.closest('[data-slide]');
  if (tr && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { const k = tr.dataset.slide; const p = pctOf(k, S[k]) + (e.key === 'ArrowRight' ? 2 : -2); S[k] = valOf(k, Math.max(0, Math.min(100, p))); save(); syncTrack(k); refreshMain(); e.preventDefault(); }
});
export function syncTrack(k, except) {
  if (PEOPLE[k]) PEOPLE[k][1].forEach((d) => document.querySelectorAll(`[data-slide="${d}"]`).forEach((tr) => { const el = tr.querySelector('.end.l'), er = tr.querySelector('.end.r'); if (el) el.textContent = SL[d].l; if (er) er.textContent = SL[d].h; tr.style.setProperty('--p', pctOf(d, S[d])); }));
  if (/^sh\d$/.test(k) && !syncTrack.busy) { syncTrack.busy = true; S.plans.forEach((_, i) => { if ('sh' + i !== k) syncTrack('sh' + i); }); syncTrack.busy = false; }
  document.querySelectorAll(`[data-slide="${k}"]`).forEach((tr) => { tr.style.setProperty('--p', pctOf(k, S[k])); tr.setAttribute('aria-valuetext', SL[k].fmt(S[k])); });
  document.querySelectorAll(`[data-mchips="${k}"] .mchip`).forEach((ch) => ch.classList.toggle('on', Math.abs(pctOf(k, +ch.dataset.val) - pctOf(k, S[k])) < .5));
  document.querySelectorAll(`[data-val-of="${k}"]`).forEach((el) => { el.textContent = SL[k].fmt(S[k]) + (SL[k].unit || ''); });
  document.querySelectorAll(`[data-rng-of="${k}"]`).forEach((el) => { el.textContent = rangeText(k); });
  const txt = SL[k].fmt(S[k]);
  document.querySelectorAll(`[data-type="${k}"]`).forEach((inp) => {
    const own = inp === except, t = own ? inp.value : txt;      // never rewrite the field someone is typing in, but let it grow with what they type
    if (!own) inp.value = txt;
    if ('small' in inp.dataset) inp.size = Math.max(2, t.length);
    else { const size = Math.min(80, Math.floor(600 / Math.max(1, t.length) / 4) * 4); inp.style.fontSize = size + 'px'; inp.style.width = (Math.max(2, t.length) + 0.1) + 'ch';   /* ch = one tabular digit in this font, so the box never clips the last digit */ }
  });
}
export function refreshMain() {           // update the answer without touching the control being used
  if (route().r !== 'test') return;
  const tmp = swapMain(testScreen()); if (!tmp) return;
  const em = tmp.querySelector('.sumrow em'); document.querySelectorAll('.sumrow em').forEach((x) => { if (em) x.textContent = em.textContent; });
  history.replaceState(null, '', '#/test?' + toQuery());
}
// dragging a track
export let drag = null;
// one light tick: Android has navigator.vibrate; iOS Safari (18+) gives a system tick when a switch checkbox toggles
export let hapEl = null;
export function haptic() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.vibrate) { try { navigator.vibrate(8); } catch {} return; }
  if (!hapEl) { hapEl = document.createElement('label'); hapEl.setAttribute('aria-hidden', 'true'); hapEl.style.cssText = 'position:fixed;left:-100px;top:0;opacity:0;pointer-events:none'; hapEl.innerHTML = '<input type="checkbox" switch tabindex="-1">'; document.body.appendChild(hapEl); }
  hapEl.click();
}
// share-of-sales bar: a divider moves sales between the two plans it sits between
export let mixDrag = null;
export function mixSet(i, boundary) {      // boundary: % from the bar's left edge
  const w = shares(S.plans).map((x) => x * 100), c0 = w.slice(0, i).reduce((t, x) => t + x, 0), pair = w[i] + w[i + 1];
  const a = Math.round(Math.max(0, Math.min(pair, boundary - c0))); w[i] = a; w[i + 1] = Math.round(pair) - a;
  S.plans.forEach((x, j) => { x.s = Math.round(w[j]); });
  const bar = document.querySelector('[data-mixbar]'); if (bar) { const t = S.plans.reduce((q, x) => q + x.s, 0) || 1; bar.querySelectorAll('.mseg').forEach((sg, j) => { sg.style.flex = `${Math.max(0.001, S.plans[j].s / t)} 0 0`; }); bar.previousElementSibling?.querySelectorAll('b').forEach((n, j) => { n.textContent = Math.round(S.plans[j].s / t * 100) + '%'; }); layoutMix(); }
  refreshMain();
}
app.addEventListener('pointerdown', (e) => {
  let h = e.target.closest('[data-mix-handle]');
  const mb = !h && e.target.closest('[data-mixbar]');
  if (mb) {                                   // a press anywhere on the bar grabs the nearest divider and moves it there
    const hs = [...mb.querySelectorAll('[data-mix-handle]')];
    h = hs.reduce((b, x) => Math.abs(x.getBoundingClientRect().left - e.clientX) < Math.abs(b.getBoundingClientRect().left - e.clientX) ? x : b, hs[0]);
    if (h) { const b = mb.getBoundingClientRect(); mixSet(+h.dataset.mixHandle, (e.clientX - b.left) / b.width * 100); }
  }
  if (h) { mixDrag = { i: +h.dataset.mixHandle, bar: h.closest('[data-mixbar]') }; h.setPointerCapture(e.pointerId); UI.instant = true; e.preventDefault(); return; }
  const tr = e.target.closest('[data-slide]'); if (!tr) return;
  drag = { tr, k: tr.dataset.slide }; if (tr.dataset.n) haptic(); tr.classList.add('dragging'); UI.instant = true; tr.setPointerCapture(e.pointerId); move(e); e.preventDefault();
});
app.addEventListener('pointermove', (e) => { if (mixDrag) { const b = mixDrag.bar.getBoundingClientRect(); mixSet(mixDrag.i, (e.clientX - b.left) / b.width * 100); return; } if (drag) move(e); });
app.addEventListener('pointerup', () => { if (mixDrag) { mixDrag = null; UI.instant = false; planChanged(); return; } if (drag) { drag.tr.classList.remove('dragging'); drag = null; UI.instant = false; save(); if (route().r !== 'test') render(); } });
export function move(e) {
  const b = drag.tr.getBoundingClientRect();
  const p = Math.max(0, Math.min(100, (e.clientX - b.left) / b.width * 100));
  if (drag.tr.dataset.n) { const u = Math.min(+drag.tr.dataset.n - 1, Math.floor(p / 100 * +drag.tr.dataset.n)); if (drag.u != null && u !== drag.u) haptic(); drag.u = u; }
  S[drag.k] = valOf(drag.k, p); syncTrack(drag.k);
  refreshMain();
}
export function copy(text) {
  const done = () => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = 'Copied'; document.body.appendChild(t); setTimeout(() => t.remove(), 1400); };
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(done).catch(() => fallback());
  fallback();
  function fallback() { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch {} ta.remove(); }
}

// ------------------------------------------------------------------ scale: drawn at 1440, bigger screens zoom the whole page
export function scale() {
  const z = window.innerWidth > 1440 ? window.innerWidth / 1440 : 1;
  document.body.style.zoom = z === 1 ? '' : String(z);
  document.documentElement.style.setProperty('--vh', window.innerHeight / z + 'px');   // the rail's height limit in unzoomed pixels
}
export let lastWide = wide();
window.addEventListener('resize', () => { scale(); if (wide() !== lastWide) { lastWide = wide(); lastPage = null; render(); } else document.querySelectorAll('.pill').forEach((p) => p._placed = false), placePills(); });
window.addEventListener('hashchange', onRoute);

export const saved = store.get('gtp:last');
if (saved) {
  const { pw, pa, mixA, ...rest } = saved; Object.assign(S, rest);
  if (!Array.isArray(S.plans) || !S.plans.length) S.plans = pw != null ? legacyPlans(pw, pa, mixA, S.trial) : fresh().plans;
}
if (!location.hash && saved) history.replaceState(null, '', '#/test?' + toQuery());
scale();
onRoute();
// the fade under the mobile top bar appears only once the page is scrolled
export const onScrollFade = () => document.documentElement.classList.toggle('scrolled', window.scrollY > 0);
window.addEventListener('scroll', onScrollFade, { passive: true }); onScrollFade();
// mobile sheet: swipe down to close (from anywhere in it once it is scrolled to the top; sliders keep their horizontal drag)
export let sw = null;
document.addEventListener('touchstart', (e) => {
  const sheet = e.target.closest('.sheet'); if (!sheet || e.target.closest('.track, input, textarea, [contenteditable]')) { sw = null; return; }
  const t = e.touches[0]; sw = { sheet, x: t.clientX, y: t.clientY, t0: performance.now(), drag: false, dy: 0 };
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (!sw) return;
  const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
  if (!sw.drag) {
    if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
    if (dy > 0 && Math.abs(dy) > Math.abs(dx) && sw.sheet.scrollTop <= 0) { sw.drag = true; sw.sheet.style.transition = 'none'; sw.sheet.style.animation = 'none'; }
    else { sw = null; return; }
  }
  e.preventDefault();
  sw.dy = Math.max(0, dy);
  sw.sheet.style.transform = `translateY(${sw.dy}px)`;
  const scrim = document.querySelector('.scrim'); if (scrim) scrim.style.opacity = String(Math.max(0, 1 - sw.dy / sw.sheet.offsetHeight));
}, { passive: false });
document.addEventListener('touchend', () => {
  if (!sw || !sw.drag) { sw = null; return; }
  const { sheet, dy, t0 } = sw; sw = null;
  const fast = dy / (performance.now() - t0) > 0.5, scrim = document.querySelector('.scrim');
  const ease = `var(--duration-fast) var(--ease-smooth-out)`;
  sheet.style.transition = `transform ${ease}`; if (scrim) scrim.style.transition = `opacity ${ease}`;
  if (dy > Math.min(120, sheet.offsetHeight * 0.25) || (fast && dy > 30)) {
    sheet.style.transform = 'translateY(100%)'; if (scrim) scrim.style.opacity = '0';
    setTimeout(() => { UI.overlay = null; render(); }, reduced() ? 0 : cssMs('--duration-fast'));
  } else { sheet.style.transform = ''; if (scrim) scrim.style.opacity = ''; }
});
