import { DEFAULTS, planOf, readOf, decideOptions, sign, PLAN_TYPES, fresh, shares, planTrial, addDays, longestTrial } from './math.js';
import { IDEAS, IDEAS_SRC, CHIPS, TRIALS, SKILL_URL, METRIC, DECIDE_METRIC, TESTS, COUNT } from './data.js';

// ------------------------------------------------------------------ state
// Nothing typed here leaves the browser; the only thing sent is an anonymous daily count of which idea is picked in “What changes in B” (functions/api/e.js). The last inputs are kept in localStorage (this browser only);
// a shared link carries them after "#", which browsers never send to the server.
const S = fresh();
let READ = { A: {}, B: {}, C: {}, billed: true };
const LETTERS = () => (S.versions === 3 ? ['A', 'B', 'C'] : ['A', 'B']);
let UI = { overlay: null, idea: -1, tone: 'Friendly', readPlan: false, readError: '' };
const ROUTES = ['', 'area', 'traffic', 'starts', 'conv', 'trial', 'test', 'share', 'results', 'verdict', 'share-result'];
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

const KEYS = { hi: 'whatId', h: 'what', a: 'area', v: 'views', c: 'conv', u: 'users', r: 'trialRate', pr: 'paidRate', tv: 'trialView', t: 'trial', s: 'traffic', sp: 'split', k: 'versions', d: 'decide', g: 'goal', w: 'weeks', st: 'start', tg: 'target' };
// plans in a link: w6.99-50-3_y39.99-50-3 (type letter, price, share, trial days)
const TL = { week: 'w', month: 'm', year: 'y', once: 'o' }, LT = { w: 'week', m: 'month', y: 'year', o: 'once' };
const plansOut = (pl) => pl.map((x) => `${TL[x.t]}${x.p}-${Math.round(x.s)}-${x.tr}`).join('_');
const plansIn = (str) => {
  const pl = String(str).split('_').map((t) => { const m = /^([wmyo])([\d.]+)-(\d+)-(\d+)$/.exec(t); return m && { t: LT[m[1]], p: Number(m[2]) || 1, s: Number(m[3]), tr: [0, 3, 7, 14].includes(Number(m[4])) ? Number(m[4]) : 0 }; }).filter(Boolean).slice(0, 4);
  return pl.length ? pl : null;
};
// links and saved state from before plans existed: weekly + annual price and the annual share
const legacyPlans = (pw, pa, mix, tr) => [{ t: 'week', p: Number(pw) || 6.99, s: 100 - (Number(mix) || 50), tr: Number(tr) || 0 }, { t: 'year', p: Number(pa) || 39.99, s: Number(mix) || 50, tr: Number(tr) || 0 }];
function toQuery(withRead) {
  const q = new URLSearchParams();
  const other = S.area === 'paywall' ? ['users', 'trialRate', 'paidRate', 'trial'] : ['views', 'conv', 'trialView'];   // keys of the other kind of test stay out
  for (const [k, f] of Object.entries(KEYS)) if ((S[f] !== DEFAULTS[f] && !other.includes(f)) || k === 'a') q.set(k, S[f]);   // short links: defaults are left out
  if (S.whatId && S.whatId !== 'other') q.delete('h');   // a picked idea travels as its id; its title comes from data.js
  if (S.area === 'paywall' && plansOut(S.plans) !== plansOut(DEFAULTS.plans)) q.set('pl', plansOut(S.plans));
  if (withRead) {
    for (const v of LETTERS()) q.set('x' + v.toLowerCase(), [READ[v].people, READ[v].trials, READ[v].refunds, ...S.plans.map((_, i) => READ[v]['p' + i])].map((x) => x ?? '').join('.'));
    q.set('bl', READ.billed ? 1 : 0);
  }
  return q.toString();
}
function fromQuery(qs) {
  const q = new URLSearchParams(qs);
  if (q.has('a')) Object.assign(S, fresh());          // a link describes a whole test: missing keys mean defaults
  for (const [k, f] of Object.entries(KEYS)) if (q.has(k)) { const raw = q.get(k); S[f] = typeof DEFAULTS[f] === 'number' ? (raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : DEFAULTS[f]) : raw; /* 0 is a real value (no trial), not missing */ }
  if (!['paywall', 'onboarding'].includes(S.area)) S.area = 'paywall';
  if (!['win', 'notworse'].includes(S.goal)) S.goal = 'win';
  if (![2, 3].includes(S.versions)) S.versions = 2;
  if (![50, 70, 80, 90].includes(S.split)) S.split = 50;
  S.traffic = Math.max(1, Math.min(100, Math.round(S.traffic) || 100));
  if (!decideOptions(S.area).includes(S.decide)) S.decide = decideOptions(S.area)[0];   // a link with only a=onboarding still has a choice picked
  if (q.has('pl')) S.plans = plansIn(q.get('pl')) || fresh().plans;
  else if (q.has('pw') || q.has('pa') || q.has('m')) S.plans = legacyPlans(q.get('pw'), q.get('pa'), q.get('m'), S.trial);
  for (const v of ['A', 'B', 'C']) {
    const L = v.toLowerCase();
    if (q.has('x' + L)) { const [pe, tr, rf, ...ps] = q.get('x' + L).split('.'); READ[v] = {}; Object.entries({ people: pe, trials: tr, refunds: rf }).forEach(([f, x]) => { if (x) READ[v][f] = x; }); ps.forEach((x, i) => { if (x) READ[v]['p' + i] = x; }); }
    else if (q.has('r' + L)) {                            // old links: people.weekly.annual.trials.refunds
      const parts = q.get('r' + L).split('.'); READ[v] = {};
      ['people', 'p0', 'p1', 'trials', 'refunds'].forEach((f, i) => { if (parts[i]) READ[v][f] = parts[i]; });
    }
  }
  if (q.has('bl')) READ.billed = q.get('bl') === '1';
  const pick = IDEAS[S.area].find((x) => x.id === S.whatId);
  if (pick) S.what = pick.t; else if (S.whatId !== 'other') S.whatId = S.what ? 'other' : '';   // old links carry only the words
}
function route() { const h = location.hash.replace(/^#\/?/, ''); const [r, qs] = h.split('?'); return { r: ROUTES.includes(r) ? r : '', qs: qs || '' }; }
function go(r, withRead) { UI.overlay = null; location.hash = '#/' + r + (['test', 'share', 'results', 'verdict', 'share-result'].includes(r) ? '?' + toQuery(withRead || r === 'verdict' || r === 'share-result') : ''); }
function save() { store.set('gtp:last', S); }
const wide = () => window.innerWidth >= 1200;

// ------------------------------------------------------------------ formatting
const n0 = (x) => Math.round(x).toLocaleString('en-US');
const k100 = (x) => (Math.round(x / 100) * 100).toLocaleString('en-US');
const day = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const t1 = (x) => x.toFixed(1);

// ------------------------------------------------------------------ icons (filled where they are pictures)
const I = {
  back: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  chev: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" class="chev" aria-hidden="true" style="flex:none;opacity:.6"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',   // chevrons (owner, 2026-11-02): one shape, stroke 2, 60% white; 16 trailing a row, 14 inline after text
  ext: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="flex:none;opacity:.6"><path d="M8 4h8v8M16 4 7 13" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  chevS: '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="flex:none;opacity:.6"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  up: '<svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 12.5l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  down: '<svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 7.5l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  minus: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10h10" stroke="currentColor" stroke-width="2"/></svg>',
  chevD: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="flex:none;opacity:.6"><path d="M5.5 8 10 12.5 14.5 8" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  chevU: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="flex:none;opacity:.6"><path d="M5.5 12 10 7.5 14.5 12" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  chevDS: '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="flex:none;opacity:.6"><path d="M5.5 8 10 12.5 14.5 8" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2"/></svg>',
  share: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 12.5V3.5M6.5 7l3.5-3.5L13.5 7" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/><path d="M4 10.5V16.5h12v-6" stroke="currentColor" stroke-width="2"/></svg>',
  copy: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="7" y="7" width="10" height="10" stroke="currentColor" stroke-width="2"/><path d="M13 5V3H3v10h2" stroke="currentColor" stroke-width="2"/></svg>',
  money: '<svg width="24" height="24" viewBox="0 0 22 22" aria-hidden="true"><path fill-rule="evenodd" d="M1 5h20v12H1zM11 7.5l3.5 3.5-3.5 3.5-3.5-3.5z" fill="#FFFFFF"/></svg>',
  flag: '<svg width="24" height="24" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 1h3v20H3zM6 2h13l-4 5 4 5H6z" fill="#FFFFFF"/></svg>',
};
const ACC = '#FF4C00';
const G = {
  onboarding: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="10" width="13" height="4" fill="#FFF"/><rect x="25.5" y="10" width="13" height="4" fill="#FFF"/><rect x="41" y="10" width="13" height="4" fill="#4A4A4A"/><rect x="10" y="21" width="36" height="7" fill="#FFF"/><rect x="10" y="35" width="44" height="12" fill="#4A4A4A"/><rect x="10" y="51" width="44" height="12" fill="${ACC}"/><rect x="10" y="67" width="44" height="12" fill="#4A4A4A"/></svg>`,
  paywall: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="12" width="40" height="7" fill="#FFF"/><rect x="10" y="23" width="28" height="4" fill="#4A4A4A"/><rect x="10" y="36" width="21" height="28" fill="${ACC}"/><rect x="33" y="36" width="21" height="28" fill="#4A4A4A"/><rect x="14" y="42" width="10" height="4" fill="#FFF"/><rect x="37" y="42" width="10" height="4" fill="#7A7A7A"/><rect x="10" y="70" width="44" height="10" fill="#FFF"/></svg>`,
  plan: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="12" width="36" height="7" fill="#FFF"/><rect x="10" y="23" width="24" height="4" fill="#4A4A4A"/><rect x="10" y="38" width="24" height="14" fill="#FFF"/><rect x="36" y="38" width="8" height="14" fill="${ACC}"/><rect x="46" y="38" width="8" height="14" fill="#4A4A4A"/><rect x="10" y="62" width="44" height="14" fill="${ACC}"/></svg>`,
  read: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="12" width="30" height="7" fill="#FFF"/><rect x="10" y="23" width="40" height="4" fill="#4A4A4A"/><rect x="10" y="49" width="44" height="2" fill="#4A4A4A"/><rect x="21" y="38" width="3" height="24" fill="#FFF"/><rect x="29" y="43" width="25" height="14" fill="${ACC}"/><rect x="10" y="68" width="44" height="10" fill="#4A4A4A"/></svg>`,
};

// ------------------------------------------------------------------ inputs that slide (log scale)
const SL = {
  views: { lo: 1000, hi: 1000000, l: '1k', h: '1M', fmt: n0, round: (v) => v < 10000 ? Math.round(v / 100) * 100 : v < 100000 ? Math.round(v / 1000) * 1000 : Math.round(v / 5000) * 5000 },
  users: { lo: 1000, hi: 500000, l: '1k', h: '500k', fmt: n0, round: (v) => v < 10000 ? Math.round(v / 100) * 100 : Math.round(v / 1000) * 1000 },
  conv: { lo: 0.5, hi: 10, l: '0.5', h: '10', fmt: (v) => String(+v.toFixed(2)), round: (v) => Math.round(v * 20) / 20, unit: '%' },
  trialRate: { lo: 0.5, hi: 25, l: '0.5', h: '25', fmt: (v) => String(+v.toFixed(1)), round: (v) => Math.round(v * 10) / 10, unit: '%' },
  paidRate: { lo: 0.2, hi: 15, l: '0.2', h: '15', fmt: (v) => String(+v.toFixed(1)), round: (v) => Math.round(v * 10) / 10, unit: '%' },
  trialView: { lo: 0.5, hi: 40, l: '0.5', h: '40', fmt: (v) => String(+v.toFixed(2)), round: (v) => Math.round(v * 20) / 20, unit: '%' },
  target: { lo: 1, hi: 50, l: '1', h: '50', fmt: (v) => String(Math.round(v)), round: (v) => Math.max(1, Math.round(v)), unit: '%', linear: true },
  traffic: { lo: 1, hi: 100, l: '1', h: '100', fmt: (v) => String(Math.round(v)), round: (v) => Math.max(1, Math.round(v)), unit: '%', linear: true },
};
// each plan's share of buyers slides 0–100 and the other plans make room, so the shares always add up to 100
for (let i = 0; i < 4; i++) {
  SL['sh' + i] = { lo: 0, hi: 100, l: '0', h: '100', fmt: (v) => String(Math.round(v)), round: (v) => Math.round(v), unit: '%', linear: true };
  Object.defineProperty(S, 'sh' + i, { enumerable: false, get: () => (S.plans[i] ? Math.round(shares(S.plans)[i] * 100) : 0), set: (v) => setShare(i, v) });
}
// 30-day counts (draft, facts30): people type counts from one report; inside, weekly people and rates stay as before.
// Moving the people count keeps the typed counts of payers and trial starts (facts are facts); the rates follow.
const D30 = 30 / 7, kfmt = (x) => (x >= 1e6 ? +(x / 1e6).toFixed(1) + 'M' : x >= 1e3 ? +(x / 1e3).toFixed(x < 1e5 ? 1 : 0) + 'k' : String(Math.round(x)));
const roundCount = (v) => (v < 1000 ? Math.round(v) : v < 10000 ? Math.round(v / 10) * 10 : Math.round(v / 100) * 100);
const COUNTS = {   // count key: [people key (weekly), rate key, slider range as % of people]
  paid30: ['views', 'conv', 0.5, 10], trial30: ['views', 'trialView', 0.5, 40],
  otrial30: ['users', 'trialRate', 0.5, 25], opaid30: ['users', 'paidRate', 0.2, 15],
};
const PEOPLE = { views30: ['views', ['paid30', 'trial30']], users30: ['users', ['otrial30', 'opaid30']] };
Object.entries(PEOPLE).forEach(([k, [base, deps]]) => {
  Object.defineProperty(S, k, { enumerable: false, configurable: true, get: () => Math.round(S[base] * D30), set: (v) => { v = Number(v); if (!(v > 0)) return; const keep = deps.map((d) => S[d]); S[base] = v / D30; deps.forEach((d, i) => { S[COUNTS[d][1]] = keep[i] / v * 100; }); } });
  SL[k] = { lo: 4000, hi: base === 'views' ? 4000000 : 2000000, l: '4k', h: base === 'views' ? '4M' : '2M', fmt: n0, round: roundCount };
});
Object.entries(COUNTS).forEach(([k, [base, rate, lo, hi]]) => {
  const people = () => S[base] * D30;
  Object.defineProperty(S, k, { enumerable: false, configurable: true, get: () => Math.round(people() * S[rate] / 100), set: (v) => { v = Number(v); if (v >= 0) S[rate] = v / people() * 100; } });
  SL[k] = { get lo() { return Math.max(1, people() * lo / 100); }, get hi() { return people() * hi / 100; }, get l() { return kfmt(this.lo); }, get h() { return kfmt(this.hi); }, fmt: n0, round: roundCount };
});
function setShare(i, v) {
  const pl = S.plans; if (!pl[i]) return;
  v = Math.max(0, Math.min(100, Math.round(v)));
  const w = shares(pl).map((x) => x * 100), rest = w.reduce((t, x, j) => t + (j === i ? 0 : x), 0), others = pl.length - 1;
  pl.forEach((x, j) => { x.s = j === i ? v : rest > 0 ? w[j] / rest * (100 - v) : (100 - v) / others; });
  const ints = pl.map((x) => Math.round(x.s)), diff = 100 - ints.reduce((t, x) => t + x, 0);
  if (diff) { const j = ints.reduce((b, x, k) => (k !== i && x > ints[b] ? k : b), i === 0 && pl.length > 1 ? 1 : 0); ints[j] += diff; }
  pl.forEach((x, j) => { x.s = ints[j]; });
}
const pctOf = (k, v) => SL[k].linear ? Math.max(0, Math.min(100, (v - SL[k].lo) / (SL[k].hi - SL[k].lo) * 100)) : Math.max(0, Math.min(100, Math.log(v / SL[k].lo) / Math.log(SL[k].hi / SL[k].lo) * 100));
const valOf = (k, pct) => SL[k].round(SL[k].linear ? SL[k].lo + (SL[k].hi - SL[k].lo) * pct / 100 : SL[k].lo * Math.pow(SL[k].hi / SL[k].lo, pct / 100));

function bigValue(k) {
  const v = S[k], txt = SL[k].fmt(v), size = Math.min(80, Math.floor(600 / txt.length / 4) * 4);
  return `<div class="big"><label class="num"><span class="sr">Value</span><input data-type="${k}" inputmode="decimal" value="${txt}" style="font-size:${size}px;width:${Math.max(2, txt.length) + 0.1}ch">${SL[k].unit ? `<span class="unit">${SL[k].unit}</span>` : ''}</label>
  ${track(k)}${rangeNote(k)}</div>`;
}
// a typed rate above the slider's top is almost always a typo (2.75 → 32.75): say so, softly, next to the number
const RATE = { conv: 1, trialRate: 1, paidRate: 1, trialView: 1, paid30: 1, trial30: 1, otrial30: 1, opaid30: 1 };
const rangeText = (k) => (COUNTS[k] ? (S[k] > S[COUNTS[k][0]] * D30 ? `More than the ${n0(S[COUNTS[k][0]] * D30)} people above. Typo?` : S[k] > SL[k].hi ? `Unusually high for ${n0(S[COUNTS[k][0]] * D30)} people. Typo?` : '') : RATE[k] && S[k] > SL[k].hi ? `${SL[k].fmt(S[k])}% is unusually high, most apps are under ${SL[k].h}%. Typo?` : '');
const rangeNote = (k) => (RATE[k] ? `<span class="rng" data-rng-of="${k}">${rangeText(k)}</span>` : '');
function track(k, sm) {
  const p = pctOf(k, S[k]);
  return `<div class="track${sm ? ' sm' : ''}" data-slide="${k}" role="slider" tabindex="0" style="--p:${p}" aria-valuetext="${SL[k].fmt(S[k])}${SL[k].unit || ''}"><div class="clip"><div class="fill"></div></div><div class="handle"></div><span class="end l">${SL[k].l}</span><span class="end r">${SL[k].h}</span></div>`;
}
const TYPICAL = { paid30: 'conv', trial30: 'trialView', otrial30: 'trialRate', opaid30: 'paidRate' };
const chipList = (k) => (TYPICAL[k] ? CHIPS[TYPICAL[k]].map(([r, a, b]) => [Math.round(S[COUNTS[k][0]] * D30 * r / 100), a, b]) : CHIPS[k]);
const chips = (k, label) => (label ? `<span class="chips-label">${label}</span>` : '') + `<div class="chips">${chipList(k).map(([v, a, b]) => `<button class="chip" data-set="${k}" data-val="${v}">${a} <span>${b}</span></button>`).join('')}</div>`;
const seg = (label, key, opts) => `<div class="seg"><span>${label}</span><div class="opts" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))"><span class="pill" data-js-style aria-hidden="true"></span>${opts.map(([v, t]) => `<button data-set="${key}" data-val="${v}" aria-pressed="${String(S[key]) === String(v)}">${t}</button>`).join('')}</div></div>`;
const railSlider = (label, k, small) => `<div class="rs${small ? ' small' : ''}"><div class="top2"><span class="lab">${label}</span><label class="valbox"><span class="sr">${label}</span><input class="val" data-type="${k}" data-small inputmode="decimal" value="${SL[k].fmt(S[k])}" size="${Math.max(2, SL[k].fmt(S[k]).length)}">${SL[k].unit ? `<span class="u">${SL[k].unit}</span>` : ''}</label></div>${track(k, true)}${rangeNote(k)}</div>`;   // drag the track or type the number

// ------------------------------------------------------------------ shared pieces
const top = (action) => `<header class="top"><a class="brand" href="#/" aria-label="Growth Test Planner, start"><i></i>Growth Test Planner</a>${action || ''}</header>`;
const shareBtn = `<button class="icon-btn" data-go="share" aria-label="Share">${I.share}</button>`;
const heading = (h, sub) => `<div class="heading"><h1>${h}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
const sec = (t, sub) => `<div class="sec"><b>${t}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
// questions follow the funnel (draft facts30): what you test → what it sells → people → trial starts (only with a trial) → paid
const hasTrial = () => (S.area === 'onboarding' ? S.trial > 0 : S.plans.some((x) => planTrial(x) > 0));
const STEPS = () => ['area', 'traffic', 'trial', ...(hasTrial() ? ['starts'] : []), 'conv'];
const nav = (label, step, next, back) => { const of = STEPS().length, u = 100 / of; return `<div class="nav"><button class="back" data-go="${back}" aria-label="Back to the previous question">${I.back}</button><button class="next${step >= of ? ' full' : ''}" data-go="${next}" aria-label="${label} (question ${step} of ${of} answered)">${step < of ? `<i style="width:${step * u}%;--fill-from:${Math.max(0, (UI.lastStep ?? step - 1)) * u}%"></i>` : ''}<span>${label}</span></button></div>`; };
const pick = (glyph, t, sub, goTo) => `<button class="pick" data-go="${goTo}"><span>${glyph}</span><span><b>${t}</b><em>${sub}</em></span>${I.chev}</button>`;

function trialText() {          // paywall: each plan has its own trial
  if (S.area === 'onboarding') return S.trial ? `${S.trial}-day trial` : 'no trial';
  const t = [...new Set(S.plans.map(planTrial))];
  return t.length > 1 ? 'trials vary by plan' : t[0] ? `${t[0]}-day trial` : 'no trial';
}
function summary(p) {
  const bits = S.area === 'onboarding' ? ['Onboarding', `${n0(S.users30)} new users in 30 days`, S.decide === 'paid' ? `${n0(S.opaid30)} paid` : `${n0(S.otrial30)} started a trial`] : ['Paywall', `${n0(S.views30)} saw it in 30 days`, S.decide === 'trials' ? `${n0(S.trial30)} started a trial` : `${n0(S.paid30)} paid`];
  bits.push(trialText());
  bits.push(`decide on ${{ money: 'revenue', paid: 'conversion', trials: 'trials' }[S.decide] || S.decide}`);   // the plan card no longer says it
  if (S.traffic !== 100) bits.push(`${S.traffic}% of traffic`);
  if (S.versions === 2 && S.split !== 50) bits.push(`${S.split}/${100 - S.split} split`);
  if (S.versions === 3) bits.push('A/B/C');
  if (S.goal === 'notworse') bits.push('prove not worse');
  return bits.join(' · ');
}

// ------------------------------------------------------------------ screens
function startScreen() {
  return top() + `<main class="page">
  <section class="hero"><svg class="hero-art" viewBox="0 0 358 300" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><defs><filter id="heroNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="m"/><feComponentTransfer in="m" result="a"><feFuncA type="linear" slope="0.4" intercept="0"/></feComponentTransfer><feComposite in="a" in2="SourceGraphic" operator="in" result="g"/><feBlend in="SourceGraphic" in2="g" mode="overlay"/></filter><linearGradient id="heroBlk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0466BB"/><stop offset="1" stop-color="#000"/></linearGradient><linearGradient id="heroMix" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0466BB"/><stop offset="1" stop-color="#FF4710"/></linearGradient></defs><rect x="196" y="132" width="162" height="168" fill="#0466BB"/><rect x="196" y="144" width="112" height="20" fill="#EA6905"/><rect x="196" y="184" width="112" height="20" fill="#EA6905"/><rect x="196" y="224" width="112" height="20" fill="#EA6905"/><rect x="196" y="264" width="112" height="20" fill="#EA6905"/><rect x="308" y="132" width="50" height="168" fill="url(#heroBlk)" filter="url(#heroNoise)"/><rect x="132" y="216" width="64" height="84" fill="url(#heroMix)" filter="url(#heroNoise)"/></svg><div><small>For designers who ship onboarding and paywalls</small><strong>Will your test see your change?</strong></div></section>
  <div class="stack">${pick(G.plan, 'Plan a test', 'How bold your change must be to show up, how long the test runs, the day you decide. A few questions.', 'area')}
  ${pick(G.read, 'Read a finished test', 'Win, loss or too early to tell, with the likely range. Same terms as the plan.', 'results')}</div>
  <p class="fine" style="text-align:center;margin:0">Free. What you type stays on this page.</p></main>`;
}
function areaScreen() {
  return top() + `<main class="page q">${heading('What are you testing?', 'Tap one. A few questions follow.')}
  <div class="stack">${pick(G.onboarding, 'Onboarding', 'Questions, personalisation, the first screens. We’ll count new users.', 'area:onboarding')}
  ${pick(G.paywall, 'Paywall', 'Plans, trial, layout, copy. We’ll count people who see it.', 'area:paywall')}</div></main>`;
}
function trafficScreen() {
  const onb = S.area === 'onboarding', t = hasTrial();
  return top() + `<main class="page q">${onb ? heading('How many new users started onboarding in the last 30 days?', 'Count people, not screens.') : heading('How many people saw this paywall in the last 30 days?', 'Count people, not views: the test splits people.')}
  ${bigValue(onb ? 'users30' : 'views30')}${chips(onb ? 'users30' : 'views30')}<div class="grow"></div>${nav(onb ? 'Next: free trial' : 'Next: what it sells', 2, 'trial', 'area')}</main>`;
}
function startsScreen() {
  const onb = S.area === 'onboarding';
  return top() + `<main class="page q">${heading('How many of them started a free trial?', 'The same 30 days.')}
  ${bigValue(onb ? 'otrial30' : 'trial30')}<div class="hintgroup">${chips(onb ? 'otrial30' : 'trial30', 'No numbers yet? Start from a typical app')}</div>
  <div class="grow"></div>${nav('Next: how many pay', 4, 'conv', 'trial')}</main>`;
}
function convScreen() {
  const onb = S.area === 'onboarding', t = hasTrial();
  return top() + `<main class="page q">${heading('How many of them paid?', t ? 'The same 30 days, payments after the free trial included.' : 'The same 30 days.')}
  ${bigValue(onb ? 'opaid30' : 'paid30')}<div class="hintgroup">${chips(onb ? 'opaid30' : 'paid30', 'No numbers yet? Start from a typical app')}</div>${!onb && S.plans.length > 1 ? `<div class="nextq">${mixBlock('Which plans they bought')}</div>` : ''}
  <div class="grow"></div>${nav('Show my test', STEPS().length, 'test', t ? 'starts' : 'trial')}</main>`;
}
function trialScreen() {
  const onb = S.area === 'onboarding';
  if (!onb) {        // paywall: what it sells comes before the counts, so we know whether to ask about trials
    const lt = longestTrial(S.plans);
    return top() + `<main class="page q">${heading('What does this paywall sell?', 'Tick the plans it shows, then each one’s price and free trial.')}
  ${plansPick()}<span class="wait">${lt ? `You decide ${lt >= 14 ? '14+' : lt} days after the test stops, when the last trials bill.` : 'No trial, so no extra wait.'}</span>
  <div class="grow"></div>${nav(hasTrial() ? 'Next: how many start a trial' : 'Next: how many pay', 3, hasTrial() ? 'starts' : 'conv', 'traffic')}</main>`;
  }
  const tiles = TRIALS.map(([d, sub]) => `<button class="tile" data-set="trial" data-val="${d}" aria-pressed="${S.trial === d}"><span class="n"><b>${d === 0 ? 'None' : d >= 14 ? '14+' : d}</b>${d ? '<span>days</span>' : ''}</span><span class="days" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i${i < d ? ' class="on"' : ''}></i>`).join('')}</span><em>${sub}</em></button>`).join('');
  return top() + `<main class="page q">${heading('How long is the free trial?', 'People who start a trial pay only when it ends, so the test waits for them.')}
  <div class="tiles">${tiles}</div><p class="hint tilehint">Judged on trial starts, the test doesn’t wait for the trial. Judged on paid, it waits for it.</p>
  <div class="grow"></div>${nav(hasTrial() ? 'Next: how many start a trial' : 'Next: how many pay', 3, hasTrial() ? 'starts' : 'conv', 'traffic')}</main>`;
}

function thresholdBlock(p) {
  if (p.notWorse) return `<section class="thr"><h1>To show B is no more than <span>5% worse</span>, run ${p.notWorse.weeks} weeks</h1><p class="sub">Proving “not worse” takes ${t1(p.notWorse.times)}× the people of catching a 10% win. Use it when the change has to ship anyway and you only need to know it doesn’t hurt.</p></section>`;
  const abs = p.unit === 'money'
    ? `Revenue per viewer: $${p.today.toFixed(2)} today, $${(p.today * (1 + p.thr / 100)).toFixed(2)} or more to show up. Smaller changes look like noise.`
    : (() => { const onb = S.area === 'onboarding', ppl = onb ? S.users30 : S.views30, ck = onb ? (S.decide === 'paid' ? 'opaid30' : 'otrial30') : (S.decide === 'trials' ? 'trial30' : 'paid30'), verb = /trial/.test(ck) ? 'start a trial' : 'pay';
      return `Today ${n0(S[ck])} of ${n0(ppl)} ${onb ? 'new users' : 'viewers'} ${verb} in 30 days. B needs about ${n0(Math.round(S[ck] * (1 + p.thr / 100)))} from as many people to show up. Smaller changes look like noise.`; })();
  return `<section class="thr"><h1>Your test catches changes of <span data-swap>+${t1(p.thr)}%</span> or more</h1><p class="sub">${abs}</p>
  <div class="weeks" role="radiogroup" aria-label="How long the test runs">${p.options.map((o) => `<button role="radio" aria-checked="${o.weeks === S.weeks}" data-set="weeks" data-val="${o.weeks}"><b>${o.weeks} wk</b><span data-swap="center">+${t1(o.thr)}%</span></button>`).join('')}</div></section>`;
}
function planBlock(p) {
  const legs = [[`${p.collect} days of traffic`, '#FFFFFF']];
  if (p.wait) legs.push([`${p.wait} days for the last trials`, 'rgba(255,255,255,.6)']);   // orange only on what the screen answers
  if (p.watch) legs.push([`${p.watch} days to watch refunds`, 'rgba(255,255,255,.28)']);
  const unitP = p.onb ? ' new users' : '';
  const rows = [S.versions === 2 && S.split !== 50 ? ['People', `A ${k100(p.perVersion * p.split[0] * 2)} · B ${k100(p.perVersion * p.split[1] * 2)}`] : ['People per version', k100(p.perVersion) + unitP]];
  // no “Judge by” or “Plans” rows: the headline names the metric and the form holds the plans (owner, 2026-11-02)
  rows.push(['Also watch', p.onb ? (p.decide === 'trials' ? 'paid conversions, refunds' : 'trial starts, refunds') : (p.decide === 'money' ? 'refunds, trial to paid' : 'revenue per viewer, refunds')]);
  const prices = '';
  return `<section class="card plan"><span class="dates"><label class="startbtn" aria-label="Change start date">Start ${day(p.start)}${I.chevDS}<input type="date" data-date value="${iso(p.start)}" min="${iso(new Date())}"></label><br>Decision day <span class="acc" data-swap>${day(p.decideDate)}</span>${p.checkPaid ? `<br><small class="chk">Check paid <span data-swap>${day(p.checkPaid)}</span>, once the last trials bill</small>` : ''}</span>
  <div style="display:flex;flex-direction:column;gap:8px" role="img" aria-label="${legs.map((l) => l[0]).join(' + ')}"><div class="phases">${[[p.collect, '#FFFFFF'], [p.wait, 'rgba(255,255,255,.6)'], [p.watch, 'rgba(255,255,255,.28)']].filter((x) => x[0]).map(([d, c]) => `<span style="flex:${d} 0 0;background:${c}"></span>`).join('')}</div>
  <div class="legend">${legs.map(([t, c]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}</div></div>
  <div class="rows">${rows.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('')}${prices}</div></section>`;
}
// What changes in B (owner, 2026-11-02): pick from the chart's ideas, or Something else with your own words.
// Only the pick is counted (anonymous, per day); the words never leave the page.
function whatOptions(p) {
  const shown = ideasFor(p).filter((x) => !x.lost), ids = new Set(shown.map((x) => x.id));
  return [...shown, ...IDEAS[S.area].filter((x) => !x.lost && !ids.has(x.id))];
}
function whatField(p) {
  const id = S.whatId === 'other' || IDEAS[S.area].some((x) => x.id === S.whatId) ? S.whatId : (S.what ? 'other' : '');
  const opts = whatOptions(p).map((x) => `<option value="${x.id}"${id === x.id ? ' selected' : ''}>${esc(x.t)}</option>`).join('');
  return `<div class="what"><span>What changes in B</span><div class="dd${id ? '' : ' empty'}"><select data-what-pick aria-label="What changes in B"><option value=""${id ? '' : ' selected'} disabled>Pick what B changes</option>${opts}<option value="other"${id === 'other' ? ' selected' : ''}>Something else</option></select>${I.chevD}</div>
  ${id === 'other' ? `<input data-what maxlength="120" placeholder="Describe the change (stays on this page)" value="${esc(S.what)}" aria-label="Describe the change in B">` : ''}<p class="whatnote">Only the pick is counted, anonymously.</p></div>`;
}
const counted = new Set();
const countOnce = (e, v) => { const k = e + ':' + v + ':' + S.area; if (counted.has(k)) return; counted.add(k); count(e, v); };   // once per page load
const count = (e, v) => {   // anonymous daily count; skipped when the browser asks not to be tracked
  try { if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return; navigator.sendBeacon('/api/e', new Blob([JSON.stringify({ e, v, a: S.area })], { type: 'application/json' })); } catch { /* never in the way */ }
};
// Plan by date (owner, 2026-11-02): the change worth catching → how much traffic each length needs, and who sees B.
function suggestedTarget(p) {
  const lows = ideasFor(p).filter((r) => r.same && !r.lost && r.lo > 0).map((r) => r.lo).sort((a, b) => a - b);
  return lows.length ? Math.max(2, Math.round(lows[Math.floor((lows.length - 1) / 2)])) : 10;   // the middle low end of ideas measured on this metric
}
function dateBlock(p) {     // optional (owner, 2026-11-02: “feels optional, MDE is jargon”): one row that opens in place
  if (p.notWorse) return '';
  const tg = S.target > 0 ? S.target : suggestedTarget(p), rows = p.byDate(tg), r = rows.find((x) => x.weeks === S.weeks) || rows[1];
  const sum = r.traffic ? `+${tg}% needs ${r.traffic}% of traffic` : `+${tg}% is out of reach`;
  const head = `<button class="bd-acc" data-bd-toggle aria-expanded="${!!UI.bdOpen}"><span><b>Plan for a specific change</b><small>${UI.bdOpen ? 'Pick the change, see the traffic it needs' : sum}</small></span>${UI.bdOpen ? I.chevU : I.chevD}</button>`;
  if (!UI.bdOpen) return `<section class="card bydate">${head}</section>`;
  const src = UI.targetFrom && UI.targetFrom !== '~' ? `Low end of “${esc(UI.targetFrom)}”` : '';   // only when an idea set it: it names the idea; the default needs no caption (owner, 2026-11-04)
  let body;
  if (r.traffic) {
    const pct = r.traffic * (1 - p.split[0]), on = S.traffic === r.traffic;
    body = `<p class="bdans">Needs <b data-swap>${r.traffic}%</b> of traffic for ${S.weeks} weeks. ${S.versions === 3 ? 'B and C get' : 'B gets'} ${t1(pct)}% of ${p.onb ? 'new users' : 'viewers'}, about ${k100(p.base * S.weeks * pct / 100)}.</p>
    ${on ? '<span class="bdset done">Traffic set</span>' : `<button class="btn sec2 bdset" data-bydate="${S.weeks}.${r.traffic}">Set traffic to ${r.traffic}%</button>`}`;
  } else {
    const earliest = rows.find((x) => x.traffic), alt = [];
    if (earliest) alt.push(`Run longer: ${earliest.weeks} weeks at ${earliest.traffic}% of traffic`);
    if (p.decide !== 'trials') { const f = planOf({ ...S, decide: 'trials' }).byDate(tg).find((x) => x.weeks === S.weeks); if (f && f.traffic) alt.push(`Decide on trials: ${f.traffic}% for ${S.weeks} weeks`); }
    if (S.versions === 3) { const f = planOf({ ...S, versions: 2 }).byDate(tg).find((x) => x.weeks === S.weeks); if (f && f.traffic) alt.push(`Drop C: ${f.traffic}% for ${S.weeks} weeks`); }
    if (S.versions === 2 && S.split !== 50) alt.push('Split 50/50');
    if (!alt.length) alt.push('Aim for a bigger change, or test where more people pass');
    body = `<p class="bdans">Out of reach in ${S.weeks} weeks: even 100% of traffic catches only +${t1(r.best)}% or more.</p><div class="bdalt"><span>Try</span>${alt.map((x) => `<p>${x}</p>`).join('')}</div>`;
  }
  if (!(S.target > 0)) { S.target = tg; UI.targetFrom = '~'; }   // the slider shows a real value; '~' = still the suggestion
  return `<section class="card bydate open">${head}<div class="bdbody">${railSlider('Smallest change to catch', 'target')}${src ? `<span class="bdsrc">${src}</span>` : ''}${body}</div></section>`;
}
// Ideas that fit this test: filtered by its plans and trial, ranked by the metric it decides on, six at most.
function ideasFor(p) {
  const pl = S.plans, year = pl.find((x) => x.t === 'year');
  const c = { trial: pl.some((x) => planTrial(x) > 0), year: !!year, multi: pl.length > 1, once: pl.some((x) => x.t === 'once'), plans: pl.length, onbTrial: S.trial > 0,
    trialOnlyAnnual: !!year && planTrial(year) > 0 && pl.every((x) => x === year || planTrial(x) === 0) };
  const want = DECIDE_METRIC[p.decide];
  return IDEAS[S.area].filter((it) => it.fits(c)).map((it) => {
    const m = it.r[want] ? want : Object.keys(it.r)[0], [lo, hi] = it.r[m];
    return { ...it, m, lo, hi, same: m === want, weak: !!(it.weak || {})[m] || noControl(it) };
  }).sort((a, b) => (!!a.lost - !!b.lost) || (b.same - a.same) || (a.weak - b.weak) || ((b.lo + b.hi) - (a.lo + a.hi)));   // no-control results sit below controlled ones (owner, 2026-10-31)
}
// Where a row's number comes from: onboarding ranges are single tests (counted on the row's metric); paywall ranges are Adapty bands, said once in the footnote.
// every published test behind an idea ran without a control group: the row says so and sorts below controlled ones (DESIGN_RULES §2.4)
const NOCTRL = /no control group|method not stated|no method given|founder report|staged rollout|before\/after/i;
function noControl(it) {
  const list = (TESTS[S.area] || {})[it.id] || [];
  return list.length > 0 && list.every((t) => NOCTRL.test(t[2] || ''));
}
function srcLine(r) {
  return '';   // owner, 2026-10-31: no test counts on the chart; the idea card lists the tests
}
function seenBy(it) {
  if (it.id === 'copy') return 'Adapty’s expected effect for copy-only changes:';
  if (/^One test behind/.test(it.trap || '')) return 'One published test:';   // the source line never claims more tests than there are
  if (S.area === 'paywall' && !it.lost) return 'Adapty’s library, many tests:';
  return (COUNT[it.id] || {})[it.m] === 0 ? 'Adapty’s library, many tests:' : 'Other apps saw';
}
function testsList(id) {
  const list = (TESTS[S.area] || {})[id] || [];
  if (!list.length) return '<p class="para muted">No single published test yet.</p>';
  // the latest three by publish date (undated last), with the total under the heading (owner, 2026-10-31)
  const shown = [...list].sort((a, b) => (b[4] || '').localeCompare(a[4] || '')).slice(0, 3), n = list.length;
  return `<div class="tests"><span class="th">Single published tests</span><span class="tn">${n > 3 ? `Latest 3 of ${n}` : `${n} in total`}</span>${shown.map(([app, num, what, url]) => `<a class="test" href="${url}" target="_blank" rel="noopener"><span><b>${app} · ${num}</b><small>${what}</small></span>${I.ext}</a>`).join('')}</div>`;
}
const sgn = (v) => (v < 0 ? `−${-v}` : `+${v}`);
const pctR = (lo, hi) => (lo === hi ? `${sgn(lo)}%` : `${sgn(lo)}% to ${sgn(hi)}%`);   // one range format everywhere (DESIGN_RULES §3)
function ideasBlock(p) {
  const every = ideasFor(p), all = every.filter((r) => !r.lost), lost = every.filter((r) => r.lost), rows = UI.allIdeas ? all : all.slice(0, 6), thr = p.thr, nw = S.goal === 'notworse';
  const max = Math.max(45, ...rows.map((r) => Math.max(r.hi, ((r.split || {})[r.m] || {}).to || 0) + 3)), step = max > 60 ? 20 : 10, x = (v) => Math.max(0, Math.min(100, v / max * 100));
  const col = (pc) => `calc(var(--lc) + (100% - var(--lc)) * ${pc / 100})`;
  const ticks = []; for (let v = 0; v <= max - step / 2; v += step) ticks.push(v);
  return `<section class="card ideas"><span class="kick">Lift in ${METRIC[DECIDE_METRIC[p.decide]]}, B against A</span><span class="head">${nw ? 'Sized to rule out harm, not to find these' : `Your test catches +${t1(thr)}% or more`}</span><div class="fp">
  ${nw ? '' : `<span class="zone" style="width:calc((100% - var(--lc)) * ${x(thr) / 100})"></span><span class="line" style="left:${col(x(thr))}"></span>`}
  <div class="axis"><span></span><span>${ticks.map((v) => `<span class="tick" style="left:${x(v)}%;transform:translateX(${v ? '-50%' : '0'})">${v ? `+${v}%` : '0'}</span>`).join('')}</span></div>
  ${rows.map((r) => { const ok = !nw && r.same && r.lo >= thr, sp = (r.split || {})[r.m], src = sp ? sp.note : srcLine(r), one = r.lo === r.hi;
    return `<button class="row${ok ? '' : ' dim'}" data-idea="${r.id}"><span class="t"><b>${r.t}</b><span>${pctR(r.lo, r.hi)}${I.chevS}</span>${src || !r.same || r.weak ? `<small>${[src, r.weak ? 'No control group' : '', r.same ? '' : `on ${METRIC[r.m]}`].filter(Boolean).join(' · ')}</small>` : ''}</span><span class="bar"><i class="${one ? 'dot' : ''}" style="left:${one ? `calc(${x(r.lo)}% - 7px)` : `${x(r.lo)}%`};width:${one ? '14px' : `${Math.max(3, x(r.hi) - x(r.lo))}%`};background:${ok ? '#FFFFFF' : 'rgba(255,255,255,.3)'}"></i>${sp && sp.to ? `<b class="ext" style="left:${x(r.hi)}%;width:${x(sp.to) - x(r.hi)}%"></b><b class="ring" style="left:calc(${x(sp.to)}% - 6px)"></b>` : ''}</span></button>`; }).join('')}
  </div><span class="legend"><span><i class="lb"></i>Lowest to highest result</span><span><i class="ld"></i>One number (one test, or a band given as one figure)</span>${rows.some((r) => ((r.split || {})[r.m] || {}).to) ? '<span><i class="le"></i><i class="lr"></i>Same test, another market</span>' : ''}</span>${UI.allIdeas && lost.length ? `<div class="lost"><span class="lh">Lost in published tests</span>${lost.map((r) => `<button class="row" data-idea="${r.id}"><span class="t"><b>${r.t}</b><span>${r.about ? 'about ' : ''}${pctR(r.lo, r.hi)}${I.chevS}</span>${r.same ? '' : `<small>on ${METRIC[r.m]}</small>`}</span></button>`).join('')}</div>` : ''}${every.length > 6 ? `<button class="more" data-more-ideas>${UI.allIdeas ? 'Show fewer' : `Show all ${every.length}`}</button>` : ''}<span class="src">${IDEAS_SRC[S.area]}</span></section>`;
}
function ideaCard(p) {
  const it = ideasFor(p).find((x) => x.id === UI.idea) || IDEAS[S.area].map((x) => ({ ...x, m: Object.keys(x.r)[0], lo: Object.values(x.r)[0][0], hi: Object.values(x.r)[0][1], same: false })).find((x) => x.id === UI.idea);
  if (!it) return '';
  const catches = it.lost ? 'This lost in published tests. Don’t run it hoping for a win.' : S.goal === 'notworse' ? 'This test is sized to rule out harm, not to find it.' : !it.same ? `Measured on ${METRIC[it.m]}, not on ${p.metricName}, so compare with care.` : it.lo >= p.thr ? 'Your test catches it.' : it.hi >= p.thr ? 'Your test may catch the high end.' : 'Too small for this test alone.';
  const range = (it.about ? 'about ' : '') + (it.lo === it.hi ? `${sgn(it.lo)}%` : `${sgn(it.lo)}% to ${sgn(it.hi)}%`);
  const other = Object.entries(it.r).filter(([k]) => k !== it.m).map(([k, [lo, hi]]) => `${pctR(lo, hi)} ${METRIC[k]}${S.area === 'onboarding' && (COUNT[it.id] || {})[k] === 0 ? ' in Adapty’s library' : ''}`).join(', ');
  return `<div class="ihead"><b>${it.t}</b><button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
  <div class="igrp"><p class="para">${it.what}</p><p class="para">${seenBy(it)} ${range} ${METRIC[it.m]}${other ? ` (and ${other})` : ''}. ${catches}</p></div>${testsList(it.id)}<p class="para icare">Careful: ${it.trap[0].toLowerCase() + it.trap.slice(1)}</p>${!it.lost && it.same && S.goal !== 'notworse' && it.lo > 0 ? `<button class="btn sec2" data-plan-idea="${it.id}">Plan for this idea: catch +${it.lo}%</button>` : ''}`;
}
// Plans inside the form (owner, 2026-11-02): they shape the answer only when deciding on money, so they sit in the form then;
// otherwise one Free trial control does the job (it sets every plan's trial).
const PLAN_ORDER = { week: 0, month: 1, year: 2, once: 3 };
const sortPlans = () => S.plans.sort((a, b) => PLAN_ORDER[a.t] - PLAN_ORDER[b.t]);   // rows and the share bar read short to long (owner, 2026-11-02)
function mixBlock(label) {     // one bar for all plans, a segment per plan, drag a divider (owner, 2026-11-02)
  const w = shares(S.plans);
  return `<div class="mix"><span class="mixlab">${label}</span><div class="mixnames" aria-hidden="true">${S.plans.map((x, i) => `<span>${PLAN_TYPES[x.t][0]} <b>${Math.round(w[i] * 100)}%</b></span>`).join('')}</div><div class="mixbar" data-mixbar>${S.plans.map((x, i) => `<span class="mseg" style="flex:${Math.max(0.001, w[i])} 0 0"></span>${i < S.plans.length - 1 ? `<span class="mh" data-mix-handle="${i}" role="slider" tabindex="0" aria-label="Between ${PLAN_TYPES[x.t][0]} and ${PLAN_TYPES[S.plans[i + 1].t][0]}" aria-valuetext="${PLAN_TYPES[x.t][0]} ${Math.round(w[i] * 100)}%, ${PLAN_TYPES[S.plans[i + 1].t][0]} ${Math.round(w[i + 1] * 100)}%"></span>` : ''}`).join('')}</div></div>`;
}
// the plans question (owner, 2026-11-04, variant B3): tick the plans it shows; each ticked plan gets its own price and trial
const PLAN_DEF = { week: 6.99, month: 14.99, year: 39.99, once: 29.99 };
function plansPick() {
  return `<div class="pp">${['week', 'month', 'year', 'once'].map((t) => { const i = S.plans.findIndex((x) => x.t === t), on = i >= 0, x = S.plans[i];
    const box = `<button class="pp-tog" data-plan-toggle="${t}" aria-pressed="${on}"><span class="pp-box" aria-hidden="true">${on ? '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 10.5l3.2 3L15 6.5" stroke="#151515" stroke-width="2" stroke-linejoin="miter"/></svg>' : ''}</span>${PLAN_TYPES[t][0]}</button>`;
    if (!on) return `<div class="pp-row">${box}</div>`;
    const tr = t === 'once' ? '<span class="pi-f pp-f pi-na">No trial</span>' : `<div class="pi-f pp-f dd"><select data-plan-trial="${i}" aria-label="Free trial, ${PLAN_TYPES[t][1]} plan">${[[0, 'No trial'], [3, '3-day trial'], [7, '7-day trial'], [14, '14-day trial']].map(([d, l]) => `<option value="${d}"${planTrial(x) === d ? ' selected' : ''}>${l}</option>`).join('')}</select>${I.chevD}</div>`;
    return `<div class="pp-row on">${box}<div class="pp-fields"><label class="pi-f pp-f pp-price"><span>$</span><input data-plan-price="${i}" inputmode="decimal" value="${x.p}" aria-label="Price, ${PLAN_TYPES[t][1]} plan"></label>${tr}</div></div>`; }).join('')}</div>`;
}
function plansInline(step) {
  const many = S.plans.length > 1, w = shares(S.plans), open = step || UI.plansOpen;
  const sum = S.plans.map((x) => `$${x.p} ${PLAN_TYPES[x.t][2]}`).join(' · ');
  const head = `<button class="pi-acc" data-plans-toggle aria-expanded="${!!open}" aria-label="Plans: ${sum}"><span>${sum}</span>${open ? I.chevU : I.chevD}</button>`;   // a label over a field, like every other control
  if (!open) return `<div class="plans-inline" id="plans-inline"><span class="lab">Plans</span><div class="pi-box">${head}</div></div>`;
  const types = (x) => Object.entries(PLAN_TYPES).map(([k, v]) => `<option value="${k}"${x.t === k ? ' selected' : ''}>${v[0]}</option>`).join('') + (many ? '<option value="-">Remove</option>' : '');
  const trials = (x) => [[0, 'None'], [3, '3d'], [7, '7d'], [14, '14d+']].map(([d, t]) => `<option value="${d}"${planTrial(x) === d ? ' selected' : ''}>${t}</option>`).join('');
  const mixCol = false;      // the share of sales sits under the rows as sliders: four columns don't fit 320
  const row = (x, i) => `<div class="pi-row${mixCol ? ' mix' : ''}"><div class="pi-f dd"><select data-plan-type="${i}" aria-label="Plan ${i + 1} type">${types(x)}</select>${I.chevD}</div>
    <label class="pi-f"><span>$</span><input data-plan-price="${i}" inputmode="decimal" value="${x.p}" aria-label="Price, ${PLAN_TYPES[x.t][1]} plan"></label>
    ${x.t === 'once' ? '<span class="pi-f pi-na">—</span>' : `<div class="pi-f dd"><select data-plan-trial="${i}" aria-label="Free trial, ${PLAN_TYPES[x.t][1]} plan">${trials(x)}</select>${I.chevD}</div>`}
    ${mixCol ? `<label class="pi-f pi-sh"><input data-plan-share="${i}" inputmode="numeric" value="${Math.round(w[i] * 100)}" aria-label="Share of sales, ${PLAN_TYPES[x.t][1]} plan"><span>%</span></label>` : ''}</div>`;
  // share of sales: one bar for all plans, a segment per plan in the same order as the rows; drag a divider (owner, 2026-11-02: a lone slider read as “50% of what?”)
  const mix = many ? mixBlock('Share of sales') : '';
  const body = `<div class="pi-head${mixCol ? ' mix' : ''}"><span>Plan</span><span>Price</span><span>Trial</span>${mixCol ? '<span>Mix</span>' : ''}</div>${S.plans.map(row).join('')}${S.plans.length < 4 ? '<button class="addplan" data-plan-add>+ Add a plan</button>' : ''}${mix}`;
  if (step) return `<div class="plans-inline plans-step" id="plans-inline">${body}</div>`;   // the wizard's plans question: the same editor, always open
  return `<div class="plans-inline open" id="plans-inline"><span class="lab">Plans</span><div class="pi-box open">${head}<div class="pi-body">${plansPick()}${mix}</div></div></div>`;   // one way to enter plans everywhere (owner, 2026-11-04): the same rows as the plans question
}
// the hint speaks only about the metric picked (owner, 2026-11-02)
const DECIDE_HINT = {
  paywall: { money: 'Revenue per viewer (per person who saw the paywall). Use it for changes to prices, plans or the trial offer.', paid: 'Share of viewers who pay. Answers faster for copy and layout changes.', trials: 'Trial start rate. Answers fastest, but a trial isn’t revenue yet.' },
  onboarding: { trials: 'Trial start rate. Answers in weeks.', paid: 'Share of new users who pay. Waits for the trial to end.' },
};
function facts30() {
  const onb = S.area === 'onboarding', ks = onb ? ['users30', 'otrial30', 'opaid30'] : ['views30', 'trial30', 'paid30'], t = hasTrial();
  const lab = [onb ? 'New users' : 'Saw the paywall', 'Started a trial', 'Paid'], short = [onb ? 'new users' : 'saw', 'trial', 'paid'];
  const idx = t ? [0, 1, 2] : [0, 2], sum = idx.map((i) => `${kfmt(S[ks[i]])} ${short[i]}`).join(' · '), open = UI.factsOpen;
  const head = `<button class="pi-acc" data-facts-toggle aria-expanded="${!!open}" aria-label="Last 30 days: ${sum}"><span>${sum}</span>${open ? I.chevU : I.chevD}</button>`;
  if (!open) return `<div class="plans-inline"><span class="lab">Last 30 days</span><div class="pi-box">${head}</div></div>`;
  return `<div class="plans-inline open"><span class="lab">Last 30 days</span><div class="pi-box open">${head}<div class="pi-body facts">${idx.map((i) => railSlider(lab[i], ks[i])).join('')}</div></div></div>`;
}
function controls() {
  const onb = S.area === 'onboarding';
  const dec = decideOptions(S.area).map((v) => [v, { money: 'Revenue', paid: 'Conversion', trials: 'Trials' }[v]]);
  // order (owner, 2026-11-02): what you test → what decides it → the goal → your numbers for that metric → how traffic is split
  return `<div class="controls">${seg('Testing', 'area', [['onboarding', 'Onboarding'], ['paywall', 'Paywall']])}
  ${whatField(planOf(S))}
  ${onb || S.decide !== 'money' ? seg('Free trial', 'trial', [[0, 'None'], [3, '3 days'], [7, '7 days'], [14, '14+']]) : plansInline()}
  ${facts30()}
  ${seg('Decide on', 'decide', dec)}<span class="hint">${DECIDE_HINT[S.area][S.decide] || ''}</span>
  ${seg('Goal', 'goal', [['win', 'Find a win'], ['notworse', 'Not worse']])}
  ${railSlider('Traffic in test', 'traffic')}
  ${seg('Versions', 'versions', [[2, 'A/B'], [3, 'A/B/C']])}
  ${S.versions === 2 ? seg('Split A / B', 'split', [[50, '50/50'], [70, '70/30'], [80, '80/20'], [90, '90/10']]) : ''}</div>`;
}
// Start date: edited in the plan, where it's read (defaults to next Monday: whole weeks, a few days to set up)
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const pseg = (label, i, f, opts) => `<div class="seg"${label ? '' : ' aria-label="Plan type"'}>${label ? `<span>${label}</span>` : ''}<div class="opts" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))"><span class="pill" data-js-style aria-hidden="true"></span>${opts.map(([v, t]) => `<button data-plan="${i}.${f}" data-val="${v}" aria-pressed="${String(S.plans[i][f]) === String(v)}">${t}</button>`).join('')}</div></div>`;
function pricesCard() {           // the paywall's plans: type, price, free trial, share of buyers
  const many = S.plans.length > 1;
  const one = (x, i) => `<section class="pl">
    <div class="plhead"><div class="dd"><select data-plan-type="${i}" aria-label="Plan type">${Object.entries(PLAN_TYPES).map(([k, v]) => `<option value="${k}"${x.t === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select>${I.chevD}</div>${many ? `<button class="icon-btn sm" data-plan-del="${i}" aria-label="Remove this plan">${I.minus}</button>` : ''}</div>
    <div class="plrow"><label class="rr"><span>Price</span><div style="grid-template-columns:1fr"><label><span>$</span><input data-plan-price="${i}" inputmode="decimal" value="${x.p}" aria-label="Price, ${PLAN_TYPES[x.t][1]} plan"></label></div></label>
    ${x.t === 'once' ? '' : pseg('Free trial', i, 'tr', [[0, 'None'], [3, '3'], [7, '7'], [14, '14+']])}</div>
    ${many ? railSlider('Buyers who pick it', 'sh' + i, true) : ''}</section>`;
  return `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px;font-weight:500">Plans</b><button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
  ${S.plans.map(one).join('')}${S.plans.length < 4 ? '<button class="addplan" data-plan-add>+ Add a plan</button>' : ''}`;
}
function testScreen() {
  const p = planOf(S);
  const main = `<main class="page" id="main">${thresholdBlock(p)}${dateBlock(p)}${sec('Your plan')}${planBlock(p)}${wide() ? '' : `<div class="share-row"><button class="btn" data-go="share">${I.share}<span>Share plan</span></button></div>`}${sec('What usually moves it that much')}${ideasBlock(p)}<div class="spacer-peek mobile-only"></div></main>`;
  let overlay = '';
  if (wide()) {
    // details float in the bottom-left corner: the rail on the right is for controls, and a fixed card can't scroll away
    const extra = UI.overlay === 'idea' ? `<section class="float" role="dialog" aria-label="Idea details">${ideaCard(p)}</section>` : '';
    const plans = UI.overlay === 'prices' ? `<div class="half plans"><section class="card plans-panel" role="dialog" aria-label="Plans">${pricesCard()}</section></div>` : '';
    const share = `<button class="share-float" data-go="share">${I.share}<span>Share plan</span></button>`;   // bottom-left: frees the top for the rail and the content
    const settings = `<section class="card" style="padding:16px;display:flex;flex-direction:column;gap:16px">${controls()}</section>`;
    return top() + main + share + `<aside class="rail${plans ? ' split' : ''}" id="rail">${plans ? `<div class="half">${settings}</div>${plans}` : settings}</aside>` + extra;
  }
  if (UI.overlay === 'edit') overlay = `<div class="scrim" data-close></div><div class="sheet" id="sheet"><div class="sheet-in"><span class="grab"></span><button class="sumrow" data-close aria-label="Close"><span><small>Your test</small><em>${summary(p)}</em></span><span class="icon-btn">${I.down}</span></button>${controls()}</div></div>`;
  else if (UI.overlay === 'idea') overlay = `<div class="scrim" data-close></div><div class="sheet"><div class="sheet-in text"><span class="grab"></span>${ideaCard(p)}</div></div>`;
  else if (UI.overlay === 'prices') overlay = `<div class="scrim" data-close></div><div class="sheet"><div class="sheet-in"><span class="grab"></span>${pricesCard()}</div></div>`;
  const peek = `<div class="peek"><div><span class="grab"></span><button class="sumrow" data-overlay="edit" aria-label="Change your test"><span><small>Your test</small><em>${summary(p)}</em></span></button></div></div>`;   // no arrow: the grabber and the whole row say it opens, like iOS mini-players (owner, 2026-11-04)
  return top() + main + peek + overlay;   // Share never in the top bar (DESIGN_RULES §2.7)
}

// ------------------------------------------------------------------ share
const LINK = (withRead) => `${location.origin}${location.pathname}#/${withRead ? 'verdict' : 'test'}?${toQuery(withRead)}`;
// what B changes, in the team's words, as part of the sentence (owner, 2026-11-02: not a “B:” line stuck on top)
const lcFirst = (t) => (t.length > 1 && t[1] === t[1].toUpperCase() && /[A-Z]/.test(t[1]) ? t : t[0].toLowerCase() + t.slice(1));
function planTones(p) {
  const what = S.area === 'onboarding' ? 'onboarding' : 'paywall', b = S.what.trim();
  const vol = S.area === 'onboarding' ? `${n0(S.users30)} new users a month` : `${n0(S.views30)} paywall viewers a month`;
  const link = LINK(false);
  if (S.goal === 'notworse') {
    return {
      Short: `${cap(what)} test${b ? ` (B: ${lcFirst(b)})` : ''}: ${day(p.start)} → ${day(p.decideDate)}.\nGoal: show B is no more than 5% worse on ${p.metricName}.\nNo early stop unless something breaks. ${link}`,
      Friendly: `Hey team, here’s the plan for the ${what} test.${b ? ` B tries ${lcFirst(b)}, A stays as it is.` : ''}\nWe start ${day(p.start)} and call it on ${day(p.decideDate)}. We only need to show B doesn’t hurt: no more than 5% worse on ${p.metricName}.\nThat takes ${p.weeks} weeks with our ${vol}. ${link}`,
      Detailed: `${cap(what)} test plan\n${b ? `A: current ${what}. B: ${b}.\n` : ''}Start ${day(p.start)}, decide ${day(p.decideDate)}: ${p.weeks} weeks of traffic${p.wait ? `, ${p.wait} days for the last trials to bill` : ''}${p.watch ? `, ${p.watch} days to watch refunds` : ''}.\n${k100(p.perVersion)} per version. Goal: B no more than 5% worse on ${p.metricName}.\n${link}`,
    };
  }
  return {
    Short: `${cap(what)} test${b ? ` (B: ${lcFirst(b)})` : ''}: ${day(p.start)} → ${day(p.decideDate)}.\nCatches changes of +${t1(p.thr)}% or more in ${p.metricName}. Copy tweaks won’t show.\nNo early stop unless something breaks. ${link}`,
    Friendly: `Hey team, here’s the plan for the ${what} test.${b ? ` B tries ${lcFirst(b)}, A stays as it is.` : ''}\nWe start ${day(p.start)} and call it on ${day(p.decideDate)}. That’s ${p.weeks} weeks of traffic${p.wait ? ' plus time for the last trials to bill and refunds to show' : ''}.\nWith our ${vol} it only sees changes of ${t1(p.thr)}% or more, so let’s test something bold, not a copy tweak.\nWe judge on ${p.metricName} and only stop early if something breaks. ${link}`,
    Detailed: `${cap(what)} test plan\n${b ? `A: current ${what}. B: ${b}.\n` : ''}Start ${day(p.start)}, decide ${day(p.decideDate)}: ${p.weeks} weeks of traffic${p.wait ? `, ${p.wait} days for the last trials to bill` : ''}${p.watch ? `, ${p.watch} days to watch refunds` : ''}.\n${k100(p.perVersion)} per version. The test sees changes of ${t1(p.thr)}% or more in ${p.metricName}.\nStop early only for harm.\n${link}`,
  };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const more = (c) => `${Math.abs(Math.round(c * 100))}% ${c >= 0 ? 'more' : 'fewer'}`;
function resultTones(p, v) {
  const what = S.area === 'onboarding' ? 'onboarding' : 'paywall', link = LINK(true), b = S.what.trim();
  const checks = v.r.checks.map((c) => `${c.label.toLowerCase()}${c.ok ? '' : ' (failed)'}`).join(', ');
  const range = v.range ? ` (${v.range})` : '';
  return {
    Short: `${cap(what)} test${b ? ` (B: ${lcFirst(b)})` : ''}: ${v.title}${range}.\n${v.next}. ${link}`,
    Friendly: `Hey team, the ${what} test is in.${b ? ` B tried ${lcFirst(b)}.` : ''} ${v.title}.\n${v.sub}\nChecks: ${checks}.\n${v.next}. ${link}`,
    Detailed: `${cap(what)} test result\n${b ? `A: current ${what}. B: ${b}.\n` : ''}Decided on ${p.metricName}, as planned. ${v.sub}${v.versions ? `\n${v.versions.map((x) => `${x.v} vs A: ${sign(x.metric.lift)} (${sign(x.metric.lo)} to ${sign(x.metric.hi)})`).join('; ')}.` : ''}\nChecks: ${checks}.${v.source ? `\nWhere it came from: ${v.source}` : ''}\nNext: ${v.next}. ${v.small}\n${link}`,
  };
}
function shareBody(texts, title, sub) {
  const tones = Object.keys(texts);
  if (!texts[UI.tone]) UI.tone = 'Friendly';
  return `${heading(title, sub)}<section style="display:flex;flex-direction:column;gap:12px"><div class="tones" role="radiogroup" aria-label="Tone">${['Short', 'Friendly', 'Detailed'].filter((t) => tones.includes(t)).map((t) => `<button role="radio" aria-checked="${t === UI.tone}" data-tone="${t}">${t}</button>`).join('')}</div>
  <div class="msg"><div contenteditable="true" id="msgtext" aria-label="Message, editable" role="textbox" aria-multiline="true">${esc(texts[UI.tone])}</div><div class="foot"><span>Tap the text to edit</span><button class="icon-btn" data-copy aria-label="Copy message">${I.copy}</button></div></div></section>`;
}
function shareScreen(result) {
  const p = planOf(S);
  const v = result ? verdictOf(p) : null;
  const texts = result ? resultTones(p, v) : planTones(p);   // what B changes is woven into each tone
  const title = result ? 'Send the result to your team' : 'Send it to your team';
  const sub = result ? 'Pick a tone, edit if you like. Numbers come from your result.' : 'Pick a tone, edit if you like. The link opens this exact test.';
  if (wide()) {
    const under = result ? verdictScreen() : testScreen();
    return under + `<div class="scrim" data-go="${result ? 'verdict' : 'test'}"></div><div class="modal" role="dialog" aria-modal="true" aria-label="${title}"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">${heading(title, sub)}<button class="icon-btn" data-go="${result ? 'verdict' : 'test'}" aria-label="Close">${I.x}</button></div>
    ${shareBody(texts, '', '').replace(/^<div class="heading">.*?<\/div>/s, '')}<button class="btn" data-copy>Copy message</button></div>`;
  }
  return top() + `<main class="page">${shareBody(texts, title, sub)}<div class="grow"></div><div class="nav"><button class="back" data-go="${result ? 'verdict' : 'test'}" aria-label="Back">${I.back}</button><button class="next full" data-native-share><span>Share</span></button></div></main>`;
}

// ------------------------------------------------------------------ decision day
function readRows(p) {
  const onb = p.onb;
  const rows = [[onb ? 'New users' : 'Saw the paywall', 'people', onb ? 'People per version, from the moment they were split.' : 'People per version.']];
  if (p.decide === 'trials') {
    rows.push(['Started a trial', 'trials', 'Trial starts per version.']);
    rows.push(['Paid', 'p0', 'After the last trials bill. Checks the trial win holds.', 'optional']);
  } else S.plans.forEach((x, i) => rows.push([`Paid · ${PLAN_TYPES[x.t][1]} $${x.p}`, 'p' + i, i === 0 ? 'First payments after the last trials billed.' : i === S.plans.length - 1 ? 'Prices come from your plan.' : '']));
  rows.push(['Refunds', 'refunds', 'Leave empty if you don’t have it yet.', 'optional']);
  return rows;
}
function readRow([label, f, why, opt]) {
  const inp = (v) => `<label><span>${v}</span><input data-read="${v}.${f}" inputmode="numeric" placeholder="0" value="${esc(READ[v][f] ?? '')}" aria-label="${label}, version ${v}"></label>`;
  return `<div class="rr"><span>${label}${opt ? `<small>${opt}</small>` : ''}</span><div${LETTERS().length === 3 ? ' class="three"' : ''}>${LETTERS().map(inp).join('')}</div><p>${why}</p></div>`;
}
const VARIANT_URL = 'https://github.com/theoutlines/growth-skills/tree/main/plugins/growth-skills/skills/variant-check';
// paywall tests: before launch, check the variant against what won in published tests (the variant-check skill)
// promo cards (owner, 2026-11-02, option A): our glyph on the left, short copy, a real button
const promo = (href, glyph, title, text) => `<a class="card skill" data-promo="${href === VARIANT_URL ? 'variant' : 'data'}" href="${href}" target="_blank" rel="noopener">${glyph}<span class="sk"><b>${title}</b><span>${text}</span><span class="btn sec2 skbtn">Get the plugin</span></span></a>`;
const variantCard = () => promo(VARIANT_URL, `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="8" y="16" width="21" height="40" rx="4" fill="#4A4A4A"/><rect x="12" y="22" width="13" height="4" fill="#FFF"/><rect x="12" y="44" width="13" height="7" fill="#777"/><rect x="35" y="16" width="21" height="40" rx="4" fill="#FFF"/><rect x="39" y="22" width="13" height="4" fill="#151515"/><rect x="39" y="44" width="13" height="7" fill="${ACC}"/><rect x="8" y="64" width="48" height="3" fill="#4A4A4A"/><rect x="8" y="64" width="34" height="3" fill="${ACC}"/><rect x="8" y="72" width="22" height="3" fill="#4A4A4A"/></svg>`, 'Variant ready? Check it before launch', `Claude checks your A and B ${S.area === 'onboarding' ? 'flows' : 'screens'}: will this test see the change?`);
const SKILL = promo(SKILL_URL, `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="14" width="30" height="5" fill="#FFF"/><rect x="10" y="62" width="44" height="2" fill="#4A4A4A"/><rect x="12" y="40" width="8" height="22" fill="#4A4A4A"/><rect x="24" y="32" width="8" height="30" fill="#777"/><rect x="36" y="24" width="8" height="38" fill="${ACC}"/><rect x="10" y="70" width="28" height="4" fill="#4A4A4A"/></svg>`, 'Test data in Amplitude or Mixpanel?', 'Let Claude pull it and read it for you. Nothing to type.');
const PRIVACY = `<p class="fine" style="margin:0;padding:0 4px">What you type stays on this page. We don’t store it or send it anywhere.</p>`;
function resultsScreen() {
  const p = planOf(S);
  const plan = UI.readPlan ? `<div class="acc-body">${seg('Testing', 'area', [['onboarding', 'Onboarding'], ['paywall', 'Paywall']])}${seg('Decide on', 'decide', decideOptions(S.area).map((v) => [v, { money: 'Revenue', paid: 'Conversion', trials: 'Trials' }[v]]))}${seg('Goal', 'goal', [['win', 'Find a win'], ['notworse', 'Not worse']])}</div>` : '';
  const body = `${heading('What did each version get?', 'Totals for the whole test, per version. We check whether the test can be trusted, then read it.')}
  ${seg('Versions', 'versions', [[2, 'A/B'], [3, 'A/B/C']])}
  ${readRows(p).map(readRow).join('')}
  ${p.decide !== 'trials' ? `<div class="seg"><span>Have the last free trials billed?</span><div class="opts" style="grid-template-columns:1fr 1fr"><span class="pill" data-js-style aria-hidden="true"></span><button data-billed data-val="1" aria-pressed="${READ.billed}">Yes</button><button data-billed data-val="0" aria-pressed="${!READ.billed}">Not yet</button></div></div>` : ''}
  <section class="card planacc"><button class="acc-head" data-toggle-plan aria-expanded="${UI.readPlan}"><span><small>Reading as planned</small><b>${cap(p.metricName)} · ${S.goal === 'notworse' ? 'prove not worse' : 'find a win'}</b></span>${I.chevD}</button>${plan}</section>
  ${PRIVACY}${UI.readError ? `<p class="err">${UI.readError}</p>` : ''}<button class="btn" data-read-go>Read my result</button>`;
  return top() + `<main class="page">${body}</main>` + `<aside class="rail"></aside>`;
}
function num(x) { const v = Number(String(x ?? '').replace(/[ ,]/g, '')); return Number.isFinite(v) && String(x ?? '').trim() !== '' ? v : null; }
function readInputs(p) {
  const need = p.decide === 'trials' ? ['people', 'trials'] : ['people'];
  const out = { billed: READ.billed };
  for (const v of LETTERS()) {
    const o = {};
    for (const f of ['people', 'trials', 'refunds']) o[f] = num(READ[v][f]);
    if (need.some((f) => o[f] == null) || !o.people) return null;
    o.trials = o.trials ?? 0; o.paid = S.plans.map((_, i) => num(READ[v]['p' + i]) ?? 0);
    out[v] = o;
  }
  if (p.decide !== 'trials' && LETTERS().some((v) => !out[v].paid.some((n) => n > 0))) return null;
  return out;
}
function verdictOf(p) {
  const inp = readInputs(p); if (!inp) return null;
  const r = readOf(S, inp, p), m = r.metric;
  const range = `${sign(m.lo)} to ${sign(m.hi)}`;
  const tag = `Decision day · ${S.goal === 'notworse' ? 'goal: not worse than A by 5%' : (p.decide === 'money' ? 'revenue per viewer' : 'decided on ' + p.metricName)}`;
  const paidBad = p.decide === 'trials' && r.checks.some((c) => c.label.startsWith('Paid') && !c.ok);
  const early = p.decide === 'trials' && !inp[LETTERS()[1]].paid.some((n) => n > 0) && r.verdict.startsWith('win');
  const L = r.lead, three = r.versions.length > 1, other = three ? r.versions.find((x) => x.v !== L) : null;
  const both = (vd) => three && r.versions.every((x) => x.verdict === vd);
  const also = three && r.verdict.startsWith('win') && other.verdict === 'win' ? ` ${other.v} won too (${sign(other.metric.lift)}), ${L} by more.` : '';
  const V = {
    win: [`${L} wins ${sign(m.lift)}`, `Most likely ${sign(m.lo)} to ${sign(m.hi)}. Plan on ${sign(m.lo)}.${also}`, `Ship ${L} and make it the new control`, 'Wins usually shrink after launch, so expect the low end.'],
    win_with_cost: [`${L} wins ${sign(m.lift)}, with a cost`, `Most likely ${sign(m.lo)} to ${sign(m.hi)}. ${r.checks.filter((c) => !c.ok).map((c) => c.label).join(', ')} went the wrong way.`, 'Fix what broke before you ship', `A win that costs refunds isn’t a win yet. Fix it and run ${L} again.`],
    loss: three ? ['B and C both lose', `Best of them, ${L}, is most likely ${sign(m.lo)} to ${sign(m.hi)}.`, 'Keep A', 'Both made things worse. Keep what you learned and try a different idea.']
      : [`B loses ${sign(m.lift)}`, `Most likely ${sign(m.lo)} to ${sign(m.hi)}.`, 'Keep A', 'B made things worse. Keep what you learned and try a different idea.'],
    cant_tell: three ? ['Can’t tell yet', `Neither B nor C clearly beats A. Best guess: ${L} ${sign(m.lift)}, but anywhere from ${sign(m.lo)} to ${sign(m.hi)}.`, `Keep A. Try a bolder version of ${L}`, `This test could only see changes of ${t1(p.thr)}% or more. Shipping either now is a coin toss.`]
      : ['Can’t tell yet', `B looks ${sign(m.lift)} ${m.lift >= 0 ? 'better' : 'worse'}, but the real change could be anywhere from ${sign(m.lo)} to ${sign(m.hi)}.`, 'Keep A. Try a bolder version of B', `This test could only see changes of ${t1(p.thr)}% or more. Shipping B now is a coin toss.`],
    not_worse: both('not_worse') ? ['Both safe to ship', `At worst B is ${sign(r.versions[0].metric.lo)} and C ${sign(r.versions[1].metric.lo)}, both inside your −5% limit.`, 'Ship the one you prefer', 'You only had to show they don’t hurt, and they don’t. Don’t present either as a win: the test wasn’t sized to find one.']
      : [three ? `${L} is safe to ship` : 'Safe to ship', `At worst ${L} is ${sign(m.lo)}, inside your −5% limit. Most likely ${sign(m.lift)}.${three ? ` ${other.v} can’t rule out harm (at worst ${sign(other.metric.lo)}).` : ''}`, `Ship ${L}`, 'You only had to show it doesn’t hurt, and it doesn’t. Don’t present it as a win: the test wasn’t sized to find one.'],
    maybe_worse: ['Can’t rule out harm', three ? `At worst B is ${sign(r.versions[0].metric.lo)} and C ${sign(r.versions[1].metric.lo)}, past your −5% limit.` : `At worst B is ${sign(m.lo)}, past your −5% limit. Most likely ${sign(m.lift)}.`, 'Keep A, or run it longer', `More people would narrow the range. Until then, ${three ? 'either' : 'B'} might cost more than 5%.`],
    broken: ['Test broken', `The groups split ${r.split.all.map((x) => t1(x)).join(' / ')} instead of ${three ? 'even thirds' : r.split.want.map((x) => Math.round(x)).join(' / ')}. Something sent different people to each version.`, 'Fix the split, then rerun', 'Common causes: one version loads slower, or is shown only on some devices or app versions.'],
    too_early: ['Too early', `The last free trials haven’t billed, so paid numbers will still grow in ${three ? 'every version' : 'both versions'}.`, `Come back on ${day(p.decideDate)}`, 'Reading now anchors on a number that will change.'],
  }[r.verdict];
  let source = '';
  if (r.source && !['broken', 'too_early'].includes(r.verdict) && p.decide !== 'trials') {
    const s = r.source, a = Math.round(s.topA * 100), b = Math.round(s.topB * 100);
    if (p.decide === 'money' && s.fromMix != null && s.fromMix > 0.5 && s.fromMix <= 1) source = `About ${Math.round(s.fromMix * 100)}% from plans: the ${s.top} plan went from ${a}% to ${b}% of buyers. ${more(s.conv)} people paid. ${L} ${m.lift >= 0 ? `sold the ${s.top} plan better` : `sold the ${s.top} plan worse`}.`;
    else if (s.fromConv != null && s.fromConv >= 0 && s.fromMix >= 0) source = `${cap(more(s.conv))} people paid; the plan mix barely moved (${s.top} ${a}% → ${b}%). So ${L} changed how many people pay, not which plan they pick.`;
    else source = `Paid conversion ${sign(s.conv * 100)}, revenue per payer ${sign(s.perPayer * 100)}. They pulled in different directions; the net is their difference.`;
  }
  const note = r.verdict === 'broken' ? 'Fix this before you trust any number.' : paidBad ? 'More trials, fewer payments: the extra trials didn’t pay.' : r.checks.some((c) => !c.ok) ? 'Something went wrong. Fix it before you trust the result.'
    : r.split.warn ? `Groups split ${r.split.all.map((x) => t1(x)).join(' / ')}. On a test this big that gap is visible but small: it can shift the result by less than 1%. Read on, but find what dropped people from one group.`
    : r.verdict === 'cant_tell' ? 'The test is sound. It just can’t see a change this small.' : 'The test can be trusted.';
  if (paidBad && r.verdict === 'win_with_cost') { const pc = r.checks.find((c) => c.label.startsWith('Paid') && !c.ok); V[0] = `${L} wins on trials, not on paid`; V[1] = `Trial starts most likely ${sign(m.lo)} to ${sign(m.hi)}, but ${pc.label.replace(/ · \w$/, '').toLowerCase()}.`; V[2] = 'Keep A'; V[3] = `${L} started more trials that didn’t pay. Find what made them cancel before you try it again.`; }
  if (early) { V[2] = `${L} leads on trial starts. Check paid before you ship`; V[3] = `A trial start isn’t a payment. ${p.checkPaid ? `On ${day(p.checkPaid)} the last trials have billed: add paid` : 'Add paid'} to your numbers, and ship ${L} if it doesn’t go the other way.`; }
  return { r, kind: r.verdict.startsWith('win') && r.verdict === 'win' ? 'win' : 'flat', title: V[0], sub: V[1], next: V[2], small: V[3], tag, source,
    showBar: !['broken', 'too_early'].includes(r.verdict), range: ['broken', 'too_early'].includes(r.verdict) ? '' : range, note,
    srcLabel: (p.decide === 'money' && m.lift > 0 ? 'Where the money came from' : 'Where the difference came from') + (three ? ` · ${L}` : ''),
    versions: three && !['broken', 'too_early'].includes(r.verdict) ? r.versions : null };
}
function rangeBar(m, win, margin) {
  const lo = m.lo, hi = m.hi, dmin0 = Math.min(lo, 0, margin ?? 0), dmax0 = Math.max(hi, 0), pad = Math.max(2, (dmax0 - dmin0) * 0.18);
  const x = (v) => Math.max(0, Math.min(100, (v - dmin0 + pad) / (dmax0 - dmin0 + 2 * pad) * 100));
  const cross = lo < 0 && hi > 0;
  const zero = margin == null ? `<span class="zero" style="left:${x(0)}%;top:${cross ? -2 : 2}px;height:${cross ? 6 : 26}px"></span>` : `<span class="lim" style="left:${x(margin)}%"></span>`;
  const lbl = margin == null ? `<span style="left:${x(0)}%;transform:translateX(-50%)">no change</span>` : `<span style="left:${x(margin)}%;padding-left:8px;color:${ACC};font-weight:500">${sign(margin)} limit</span>`;
  return `<div class="rb" role="img" aria-label="Likely change from ${sign(lo)} to ${sign(hi)}, best guess ${sign(m.lift)}"><div class="lbls">${lbl}</div><div class="bar"><span class="base"></span>${zero}<span class="range" style="left:${x(lo)}%;width:${x(hi) - x(lo)}%"><span>${sign(lo)}</span><span>${sign(hi)}</span></span></div></div>`;
}
function vsPlot(versions, lead, margin) {     // A/B/C: both versions on one scale, one "no change" (or limit) line through both rows
  const ms = versions.map((x) => x.metric), lo0 = Math.min(0, margin ?? 0, ...ms.map((m) => m.lo)), hi0 = Math.max(0, ...ms.map((m) => m.hi)), pad = Math.max(2, (hi0 - lo0) * 0.1);
  const x = (val) => ((val - lo0 + pad) / (hi0 - lo0 + 2 * pad) * 100).toFixed(2);
  const ref = margin ?? 0;
  const rows = versions.map((v) => `<div class="vsrow${v.v === lead ? ' lead' : ''}"><div class="vshead"><b>${v.v}</b><span>${sign(v.metric.lift)}</span><em>${sign(v.metric.lo)} to ${sign(v.metric.hi)}</em></div><div class="vsbar"><span class="base"></span><span class="vszero${margin == null ? '' : ' lim'}" style="left:${x(ref)}%${v.metric.lo < ref && v.metric.hi > ref ? ';top:-8px;height:8px' : ''}"></span><span class="range" style="left:${x(v.metric.lo)}%;width:${x(v.metric.hi) - x(v.metric.lo)}%"></span></div></div>`).join('');
  return `<section class="card vs"><small>Each version against A</small><div class="vsplot" role="img" aria-label="${versions.map((v) => `${v.v}: ${sign(v.metric.lo)} to ${sign(v.metric.hi)}`).join(', ')}"><span class="vsref${margin == null ? '' : ' lim'}" style="left:${x(ref)}%"><i>${margin == null ? 'no change' : sign(margin) + ' limit'}</i></span>${rows}</div><p>Wider than an A/B range: two comparisons share one 5% error budget.</p></section>`;
}
function numbersRow() {
  const pe = LETTERS().map((v) => `${v} ${n0(num(READ[v].people) ?? 0)}`).join(' · ');
  return `<button class="card numrow" data-go="results:read"><span><small>Your numbers</small><b>${pe} people</b></span><span class="numedit">Edit</span></button>`;   // edits the numbers in place (owner, 2026-11-04: a chevron read as “goes somewhere”)
}
function verdictScreen() {
  const p = planOf(S), v = verdictOf(p);
  if (!v) return resultsScreen();
  const win = v.kind === 'win';
  countOnce('verdict', v.r.verdict.replace(/[^A-Za-z]/g, '') || 'none');
  const card = `<section class="verdict${win ? ' win' : ''}"><span class="tag">${v.tag}</span>${S.what ? `<span class="vwhat">B: ${esc(S.what)}</span>` : ''}<span class="title">${v.title}</span><span class="vsub">${v.sub}</span>${v.showBar ? rangeBar(v.r.metric, win, S.goal === 'notworse' ? -5 : null) : ''}</section>`;
  const checks = `<div class="checks"><div>${v.r.checks.map((c) => `<span class="ck${c.ok ? (c.warn ? ' warn' : '') : ' bad'}" title="${esc(c.detail)}">${c.ok && !c.warn ? '' : '<b>!</b>'}${c.label}</span>`).join('')}</div><span>${v.note}</span></div>`;
  const info = (icon, label, text, line) => `<section class="card info"><span class="ic">${icon}</span><span><small>${label}</small>${line ? `<b>${line}.</b>` : ''}<p>${text}</p></span></section>`;
  const vs = v.versions ? vsPlot(v.versions, v.r.lead, S.goal === 'notworse' ? -5 : null) : '';
  const from = ['win', 'win_with_cost', 'not_worse'].includes(v.r.verdict) && v.r.verdict !== 'win_with_cost' ? v.r.lead : 'A';
  const next = v.r.verdict === 'broken' || v.r.verdict === 'too_early' ? '' : `<button class="card numrow nextrow" data-next-from="${from}"><span><small>Next test</small><b>Plan it from ${from}’s numbers</b></span>${I.chev}</button>`;
  const body = card + vs + checks + (wide() ? '' : numbersRow()) + (v.source ? info(I.money, v.srcLabel, v.source) : '') + info(I.flag, 'What to do', v.small, v.next) + next;   // mobile: the numbers sit right under the answer they produce (owner, 2026-11-04)   // mobile: the numbers can be fixed from here (desktop has them in the rail)   // desktop: bottom-left, like Share plan
  const rail = `<aside class="rail"><section class="card" style="padding:16px;display:flex;flex-direction:column;gap:12px"><small style="font-size:12px;font-weight:500;color:rgba(255,255,255,.5)">Your numbers · change any, the answer updates</small>${readRows(p).map(readRow).join('')}</section></aside>`;
  const share = wide() ? `<button class="share-float" data-go="share-result">${I.share}<span>Share result</span></button>`
    : `<div class="dock"><button class="btn" data-go="share-result">${I.share}<span>Share result</span></button></div>`;   // mobile: pinned to the bottom of the screen (owner, 2026-11-02)
  return top() + `<main class="page${wide() ? '' : ' docked'}" id="main">${body}</main>` + share + rail;
}

const FOOTER = `<span>© ${new Date().getFullYear()} Ivan Polushin</span><a href="https://github.com/theoutlines/growth-test-planner" target="_blank" rel="noopener">Source</a>`;

function addFooter(pg) {
  if (!pg || pg.querySelector('.foot')) return;
  const sp = pg.querySelector('.spacer-peek'), f = document.createElement('footer');
  f.className = 'foot'; f.innerHTML = FOOTER; sp ? pg.insertBefore(f, sp) : pg.appendChild(f);
}
function swapMain(html) {           // live updates touch only the content column; it keeps its footer
  const main = document.getElementById('main'); if (!main) return null;
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const fresh = tmp.querySelector('#main'); addFooter(fresh); morphNode(main, fresh); afterPaint();
  return tmp;
}

// ------------------------------------------------------------------ motion (transitions.dev tokens and patterns)
// Inside one page the DOM is patched in place (morph), so CSS transitions run on what changed: pills slide,
// bars and lines move, short values cross-blur. A new page is drawn fresh and rises in.
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cssMs = (name) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

function softSwap(el, next) {                         // transitions.dev 34 · text swap soft, without resizing anything:
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
function endSwap(el) {
  clearTimeout(el._softTimer); el._softTimer = null;
  el.classList.remove('t-swap');
  if (el.dataset.text !== undefined) { el.textContent = el.dataset.text; delete el.dataset.text; }
}
const SOFT_MAX = 32;                                   // only the answer cross-blurs (data-swap: the headline value, week thresholds, decision day); everything else just changes
const onlyText = (el) => el.childNodes.length === 1 && el.firstChild.nodeType === 3;
function morphNode(a, b) {
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
function accToggle(head, bodySel, flip) {
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
function placePills() {                                // transitions.dev 16 · tabs sliding (measured pill)
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
const pillRO = 'ResizeObserver' in window ? new ResizeObserver((es) => {
  es.forEach((e) => {
    const box = e.target, sz = Math.round(e.contentRect.width) + 'x' + Math.round(e.contentRect.height);
    const was = box._sz; box._sz = sz;
    if (was === undefined || was === sz) return;   // the first report on observe() is not a resize: resetting here killed every slide
    const p = box.querySelector(':scope > .pill'); if (p) p._placed = false;
  });
  placePills();
}) : null;
function layoutMix() {        // every plan name stays visible: ends pinned to the bar's edges, middle names centred, pushed apart when segments are narrow
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
function afterPaint() { layoutMix(); placePills(); if (pillRO) document.querySelectorAll('.pill').forEach((p) => { const box = p.parentElement; if (!box._ro) { box._ro = true; pillRO.observe(box); } }); }
const PAGE = (r) => (wide() && r === 'share' ? 'test' : wide() && r === 'share-result' ? 'verdict' : r);   // desktop share is a modal over its page
let lastPage = null;
function closeThen(after) {                            // overlays leave before the state changes
  const els = document.querySelectorAll('.sheet, .float, .modal, .scrim, .rail .half.plans');
  if (!els.length || reduced()) return after();
  els.forEach((el) => el.classList.add('is-closing'));
  setTimeout(after, document.querySelector('.sheet, .rail .half.plans') ? cssMs('--duration-medium') : cssMs('--duration-quick'));
}
// ------------------------------------------------------------------ render + events
const app = document.getElementById('app');
document.getElementById('about')?.remove();   // the plain-text description is for readers without JavaScript (and agents); the app replaces it
function render() {
  const { r } = route();
  const sheet = document.getElementById('sheet'), st = sheet ? sheet.scrollTop : 0;
  const html = { '': startScreen, area: areaScreen, traffic: trafficScreen, starts: startsScreen, conv: convScreen, trial: trialScreen, test: testScreen, share: () => shareScreen(false),
    results: resultsScreen, verdict: verdictScreen, 'share-result': () => shareScreen(true) }[r]();
  const page = PAGE(r);
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  addFooter(tmp.querySelector('main.page:not(.q)'));               // the footer closes every content page, not the four questions
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
function onRoute() { const { r, qs } = route(); if (qs) fromQuery(qs); UI.overlay = null; const turn = PAGE(r) !== lastPage; render(); if (turn) window.scrollTo(0, 0); }

function set(key, raw) {
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

function planChanged() { save(); const { r } = route(); if (['test', 'results', 'verdict'].includes(r)) history.replaceState(null, '', '#/' + r + '?' + toQuery(r === 'verdict')); render(); }
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
    READ = { A: {}, B: {}, C: {}, billed: true }; S.what = ''; S.target = 0; S.start = ''; UI.targetFrom = ''; save();
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
  if (el.dataset.set) return set(el.dataset.set, el.dataset.val);
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
const numField = (t) => t && t.tagName === 'INPUT' && ('type' in t.dataset || 'target' in t.dataset || 'planPrice' in t.dataset || 'planShare' in t.dataset || 'read' in t.dataset);
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
function syncTrack(k, except) {
  if (PEOPLE[k]) PEOPLE[k][1].forEach((d) => document.querySelectorAll(`[data-slide="${d}"]`).forEach((tr) => { tr.querySelector('.end.l').textContent = SL[d].l; tr.querySelector('.end.r').textContent = SL[d].h; tr.style.setProperty('--p', pctOf(d, S[d])); }));
  if (/^sh\d$/.test(k) && !syncTrack.busy) { syncTrack.busy = true; S.plans.forEach((_, i) => { if ('sh' + i !== k) syncTrack('sh' + i); }); syncTrack.busy = false; }
  document.querySelectorAll(`[data-slide="${k}"]`).forEach((tr) => { tr.style.setProperty('--p', pctOf(k, S[k])); tr.setAttribute('aria-valuetext', SL[k].fmt(S[k])); });
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
function refreshMain() {           // update the answer without touching the control being used
  if (route().r !== 'test') return;
  const tmp = swapMain(testScreen()); if (!tmp) return;
  const em = tmp.querySelector('.sumrow em'); document.querySelectorAll('.sumrow em').forEach((x) => { if (em) x.textContent = em.textContent; });
  history.replaceState(null, '', '#/test?' + toQuery());
}
// dragging a track
let drag = null;
// share-of-sales bar: a divider moves sales between the two plans it sits between
let mixDrag = null;
function mixSet(i, boundary) {      // boundary: % from the bar's left edge
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
  drag = { tr, k: tr.dataset.slide }; tr.classList.add('dragging'); UI.instant = true; tr.setPointerCapture(e.pointerId); move(e); e.preventDefault();
});
app.addEventListener('pointermove', (e) => { if (mixDrag) { const b = mixDrag.bar.getBoundingClientRect(); mixSet(mixDrag.i, (e.clientX - b.left) / b.width * 100); return; } if (drag) move(e); });
app.addEventListener('pointerup', () => { if (mixDrag) { mixDrag = null; UI.instant = false; planChanged(); return; } if (drag) { drag.tr.classList.remove('dragging'); drag = null; UI.instant = false; save(); if (route().r !== 'test') render(); } });
function move(e) {
  const b = drag.tr.getBoundingClientRect();
  const p = Math.max(0, Math.min(100, (e.clientX - b.left) / b.width * 100));
  S[drag.k] = valOf(drag.k, p); syncTrack(drag.k);
  refreshMain();
}
function copy(text) {
  const done = () => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = 'Copied'; document.body.appendChild(t); setTimeout(() => t.remove(), 1400); };
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(done).catch(() => fallback());
  fallback();
  function fallback() { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch {} ta.remove(); }
}

// ------------------------------------------------------------------ scale: drawn at 1440, bigger screens zoom the whole page
function scale() {
  const z = window.innerWidth > 1440 ? window.innerWidth / 1440 : 1;
  document.body.style.zoom = z === 1 ? '' : String(z);
  document.documentElement.style.setProperty('--vh', window.innerHeight / z + 'px');   // the rail's height limit in unzoomed pixels
}
let lastWide = wide();
window.addEventListener('resize', () => { scale(); if (wide() !== lastWide) { lastWide = wide(); lastPage = null; render(); } else document.querySelectorAll('.pill').forEach((p) => p._placed = false), placePills(); });
window.addEventListener('hashchange', onRoute);

const saved = store.get('gtp:last');
if (saved) {
  const { pw, pa, mixA, ...rest } = saved; Object.assign(S, rest);
  if (!Array.isArray(S.plans) || !S.plans.length) S.plans = pw != null ? legacyPlans(pw, pa, mixA, S.trial) : fresh().plans;
}
if (!location.hash && saved) history.replaceState(null, '', '#/test?' + toQuery());
scale();
onRoute();
// the fade under the mobile top bar appears only once the page is scrolled
const onScrollFade = () => document.documentElement.classList.toggle('scrolled', window.scrollY > 0);
window.addEventListener('scroll', onScrollFade, { passive: true }); onScrollFade();
// mobile sheet: swipe down to close (from anywhere in it once it is scrolled to the top; sliders keep their horizontal drag)
let sw = null;
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
