import { DEFAULTS, planOf, readOf, decideOptions, sign, PLAN_TYPES, fresh, shares, planTrial } from './math.js';
import { IDEAS, IDEAS_SRC, CHIPS, TRIALS, SKILL_URL, METRIC, DECIDE_METRIC, TESTS, COUNT } from './data.js';

// ------------------------------------------------------------------ state
// Nothing typed here leaves the browser. The last inputs are kept in localStorage (this browser only);
// a shared link carries them after "#", which browsers never send to the server.
const S = fresh();
let READ = { A: {}, B: {}, C: {}, billed: true };
const LETTERS = () => (S.versions === 3 ? ['A', 'B', 'C'] : ['A', 'B']);
let UI = { overlay: null, idea: -1, tone: 'Friendly', readPlan: false, readError: '' };
const ROUTES = ['', 'area', 'traffic', 'conv', 'trial', 'test', 'share', 'results', 'verdict', 'share-result'];
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

const KEYS = { a: 'area', v: 'views', c: 'conv', u: 'users', r: 'trialRate', t: 'trial', s: 'traffic', k: 'versions', d: 'decide', g: 'goal', w: 'weeks', st: 'start' };
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
  for (const [k, f] of Object.entries(KEYS)) if (S[f] !== DEFAULTS[f] || k === 'a') q.set(k, S[f]);   // short links: defaults are left out
  if (plansOut(S.plans) !== plansOut(DEFAULTS.plans)) q.set('pl', plansOut(S.plans));
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
  back: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg class="chev" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ext: '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="flex:none;opacity:.6"><path d="M8 4h8v8M16 4 7 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevS: '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" style="opacity:.6"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 12.5l6-6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 7.5l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  minus: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  chevD: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5.5 8 10 12.5 14.5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  share: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 12.5V3.5M6.5 7l3.5-3.5L13.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 10.5v4.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  copy: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M13 4.5v-.5A1.5 1.5 0 0 0 11.5 2.5h-7A1.5 1.5 0 0 0 3 4v7a1.5 1.5 0 0 0 1.5 1.5H5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  money: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path fill-rule="evenodd" d="M1 5h20v12H1zM11 7.5l3.5 3.5-3.5 3.5-3.5-3.5z" fill="#FFFFFF"/></svg>',
  flag: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 1h3v20H3zM6 2h13l-4 5 4 5H6z" fill="#FFFFFF"/></svg>',
};
const ACC = '#FF6B3D';
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
};
// each plan's share of buyers slides 0–100 and the other plans make room, so the shares always add up to 100
for (let i = 0; i < 4; i++) {
  SL['sh' + i] = { lo: 0, hi: 100, l: '0', h: '100', fmt: (v) => String(Math.round(v)), round: (v) => Math.round(v), unit: '%', linear: true };
  Object.defineProperty(S, 'sh' + i, { enumerable: false, get: () => (S.plans[i] ? Math.round(shares(S.plans)[i] * 100) : 0), set: (v) => setShare(i, v) });
}
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
  const v = S[k], txt = SL[k].fmt(v), size = Math.min(80, Math.floor(600 / txt.length));
  return `<div class="big"><label class="num"><span class="sr">Value</span><input data-type="${k}" inputmode="decimal" value="${txt}" style="font-size:${size}px;width:${Math.max(2, txt.length) * size * 0.56}px">${SL[k].unit ? `<span class="unit">${SL[k].unit}</span>` : ''}</label>
  ${track(k)}</div>`;
}
function track(k, sm) {
  const p = pctOf(k, S[k]);
  return `<div class="track${sm ? ' sm' : ''}" data-slide="${k}" role="slider" tabindex="0" aria-valuetext="${SL[k].fmt(S[k])}${SL[k].unit || ''}"><div class="fill" style="width:${p}%"></div><div class="handle" style="left:${p}%"></div><span class="end l">${SL[k].l}</span><span class="end r">${SL[k].h}</span></div>`;
}
const chips = (k, label) => (label ? `<span class="chips-label">${label}</span>` : '') + `<div class="chips">${CHIPS[k].map(([v, a, b]) => `<button class="chip" data-set="${k}" data-val="${v}">${a} <span>${b}</span></button>`).join('')}</div>`;
const seg = (label, key, opts) => `<div class="seg"><span>${label}</span><div class="opts" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))"><span class="pill" data-js-style aria-hidden="true"></span>${opts.map(([v, t]) => `<button data-set="${key}" data-val="${v}" aria-pressed="${String(S[key]) === String(v)}">${t}</button>`).join('')}</div></div>`;
const railSlider = (label, k, small) => `<div class="rs${small ? ' small' : ''}"><div class="top2"><span class="lab">${label}</span><label class="valbox"><span class="sr">${label}</span><input class="val" data-type="${k}" data-small inputmode="decimal" value="${SL[k].fmt(S[k])}" size="${Math.max(2, SL[k].fmt(S[k]).length)}">${SL[k].unit ? `<span class="u">${SL[k].unit}</span>` : ''}</label></div>${track(k, true)}</div>`;   // drag the track or type the number

// ------------------------------------------------------------------ shared pieces
const top = (action) => `<header class="top"><a class="brand" href="#/" aria-label="Growth Test Planner, start"><i></i>Growth Test Planner</a>${action || ''}</header>`;
const shareBtn = `<button class="icon-btn" data-go="share" aria-label="Share">${I.share}</button>`;
const heading = (h, sub) => `<div class="heading"><h1>${h}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
const sec = (t, sub) => `<div class="sec"><b>${t}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
const nav = (label, step, next, back) => `<div class="nav"><button class="back" data-go="${back}" aria-label="Back to the previous question">${I.back}</button><button class="next${step >= 4 ? ' full' : ''}" data-go="${next}" aria-label="${label} (question ${step} of 4 answered)">${step < 4 ? `<i style="width:${step * 25}%;--fill-from:${Math.max(0, (UI.lastStep ?? step - 1)) * 25}%"></i>` : ''}<span>${label}</span></button></div>`;
const pick = (glyph, t, sub, goTo) => `<button class="pick" data-go="${goTo}"><span>${glyph}</span><span><b>${t}</b><em>${sub}</em></span>${I.chev}</button>`;

function trialText() {          // paywall: each plan has its own trial
  if (S.area === 'onboarding') return S.trial ? `${S.trial}-day trial` : 'no trial';
  const t = [...new Set(S.plans.map(planTrial))];
  return t.length > 1 ? 'trials vary by plan' : t[0] ? `${t[0]}-day trial` : 'no trial';
}
function summary(p) {
  const bits = S.area === 'onboarding' ? ['Onboarding', `${n0(S.users)} new users a week`, `${S.trialRate}% start a trial`] : ['Paywall', `${n0(S.views)} views a week`, `${S.conv}% pay`];
  bits.push(trialText());
  if (S.traffic !== 100) bits.push(`${S.traffic}% of traffic`);
  if (S.versions === 3) bits.push('A/B/C');
  if (S.goal === 'notworse') bits.push('prove not worse');
  return bits.join(' · ');
}

// ------------------------------------------------------------------ screens
function startScreen() {   // test build: the landing is the start screen (exported from the canvas boards L4M / L4D)
  const L = window.LANDING;
  if (!L) return oldStartScreen();
  return `<main class="landing"><div class="l-m">${L.m}</div><div class="l-d">${L.d}</div></main>`;
}
function oldStartScreen() {
  return top() + `<main class="page">
  <section class="hero"><img src="assets/character.png" alt=""><div><small>For designers who ship onboarding and paywalls</small><strong>Will your test see your change?</strong></div></section>
  <div class="stack">${pick(G.plan, 'Plan a test', 'How bold your change must be to show up, how long the test runs, the day you decide. Four questions.', 'area')}
  ${pick(G.read, 'Read a finished test', 'Win, loss or too early to tell, with the likely range. Same terms as the plan.', 'results')}</div>
  <p class="fine" style="text-align:center;margin:0">Free. Nothing you type leaves this page.</p></main>`;
}
function areaScreen() {
  return top() + `<main class="page q">${heading('What are you testing?', 'Tap one. Three quick questions follow.')}
  <div class="stack">${pick(G.onboarding, 'Onboarding', 'Questions, personalisation, the first screens. We’ll count new users.', 'area:onboarding')}
  ${pick(G.paywall, 'Paywall', 'Plans, trial, layout, copy. We’ll count paywall views.', 'area:paywall')}</div></main>`;
}
function trafficScreen() {
  const onb = S.area === 'onboarding';
  return top() + `<main class="page q">${onb ? heading('How many new users start onboarding a week?', 'Count people, not screens. The test splits them as they arrive.') : heading('How many times a week is this paywall shown?', 'Count views, not people. More views means a shorter test.')}
  ${bigValue(onb ? 'users' : 'views')}${chips(onb ? 'users' : 'views')}<div class="grow"></div>${nav(onb ? 'Next: how many start a trial' : 'Next: how many pay', 2, 'conv', 'area')}</main>`;
}
function convScreen() {
  const onb = S.area === 'onboarding';
  return top() + `<main class="page q">${onb ? heading('Out of 100 new users, how many start a trial?', 'Your current onboarding, last 30 days.') : heading('Out of 100 paywall views, how many end in a payment?', 'Your current paywall, last 30 days.')}
  ${bigValue(onb ? 'trialRate' : 'conv')}<div style="display:flex;flex-direction:column;gap:8px">${chips(onb ? 'trialRate' : 'conv', 'Not sure? Start from a typical app')}</div>
  <div class="grow"></div>${nav('Next: free trial', 3, 'trial', 'traffic')}</main>`;
}
function trialScreen() {
  const onb = S.area === 'onboarding';
  const tiles = TRIALS.map(([d, sub]) => `<button class="tile" data-set="trial" data-val="${d}" aria-pressed="${S.trial === d}"><span class="n"><b>${d === 0 ? 'None' : d >= 14 ? '14+' : d}</b>${d ? '<span>days</span>' : ''}</span><span class="days" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i${i < d ? ' class="on"' : ''}></i>`).join('')}</span><em>${sub}</em></button>`).join('');
  const wait = onb ? '' : `<span class="wait">${S.trial ? `You decide ${S.trial >= 14 ? '14+' : S.trial} days after the test stops` : 'No extra wait'}</span>`;
  return top() + `<main class="page q">${heading('How long is the free trial?', 'People who start a trial pay only when it ends, so the test waits for them.')}
  <div class="tiles">${tiles}</div>${wait}<p class="note">${onb ? 'Judged on trial starts, the test doesn’t wait for the trial. Judged on paid, it waits for the longest one.' : 'Different trials on different plans? Pick the longest. The test waits for the last trial to end before anyone can pay.'}</p>
  <div class="grow"></div>${nav('Show my test', 4, 'test', 'conv')}</main>`;
}

function thresholdBlock(p) {
  if (p.notWorse) return `<section class="thr"><h1>To show B is no more than <span>5% worse</span>, run ${p.notWorse.weeks} weeks</h1><p class="sub">Proving “not worse” takes ${t1(p.notWorse.times)}× the people of catching a 10% win. Use it when the change has to ship anyway and you only need to know it doesn’t hurt.</p></section>`;
  const abs = p.unit === 'money'
    ? `Money per paywall view: $${p.today.toFixed(2)} today, $${(p.today * (1 + p.thr / 100)).toFixed(2)} or more to show up. Smaller changes look like noise.`
    : `${p.metricName[0].toUpperCase() + p.metricName.slice(1)}: ${(p.today * 100).toFixed(2)}% today, ${(p.today * 100 * (1 + p.thr / 100)).toFixed(2)}% or more to show up. Smaller changes look like noise.`;
  return `<section class="thr"><h1>Your test catches changes of <span data-swap>+${t1(p.thr)}%</span> or more</h1><p class="sub">${abs}</p>
  <div class="weeks" role="radiogroup" aria-label="How long the test runs">${p.options.map((o) => `<button role="radio" aria-checked="${o.weeks === S.weeks}" data-set="weeks" data-val="${o.weeks}"><b>${o.weeks} wk</b><span data-swap="center">≥${t1(o.thr)}%</span></button>`).join('')}</div></section>`;
}
function planBlock(p) {
  const legs = [[`${p.collect} days of traffic`, '#FFFFFF']];
  if (p.wait) legs.push([`${p.wait} days for the last trials`, ACC]);
  if (p.watch) legs.push([`${p.watch} days to watch refunds`, 'rgba(255,255,255,.28)']);
  const unitP = p.onb ? ' new users' : '';
  const rows = [['People per version', k100(p.perVersion) + unitP]];
  rows.push(S.goal === 'notworse' ? ['Goal', 'not worse than A by 5%'] : ['Judge by', p.metricName]);
  rows.push(['Also watch', p.onb ? (p.decide === 'trials' ? 'paid conversions, refunds' : 'trial starts, refunds') : (p.decide === 'money' ? 'refunds, trial to paid' : 'money per view, refunds')]);
  const prices = !p.onb ? `<button class="rowbtn" data-overlay="prices" aria-label="Change plans"><span>Plans</span><span>${S.plans.map((x) => `$${x.p} ${PLAN_TYPES[x.t][2]}`).join(' · ')} ${I.chevS}</span></button>` : '';   // the whole row opens the editor, like the idea rows
  return `<section class="card plan"><span class="dates"><label class="startbtn" aria-label="Change start date">Start ${day(p.start)}${I.chevS}<input type="date" data-date value="${iso(p.start)}" min="${iso(new Date())}"></label><br>Decision day <span class="acc" data-swap>${day(p.decideDate)}</span></span>
  <div style="display:flex;flex-direction:column;gap:8px" role="img" aria-label="${legs.map((l) => l[0]).join(' + ')}"><div class="phases">${[[p.collect, '#FFFFFF'], [p.wait, ACC], [p.watch, 'rgba(255,255,255,.28)']].filter((x) => x[0]).map(([d, c]) => `<span style="flex:${d} 0 0;background:${c}"></span>`).join('')}</div>
  <div class="legend">${legs.map(([t, c]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}</div></div>
  <div class="rows">${rows.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('')}${prices}</div></section>`;
}
// Ideas that fit this test: filtered by its plans and trial, ranked by the metric it decides on, six at most.
function ideasFor(p) {
  const pl = S.plans, year = pl.find((x) => x.t === 'year');
  const c = { trial: pl.some((x) => planTrial(x) > 0), year: !!year, multi: pl.length > 1, once: pl.some((x) => x.t === 'once'), plans: pl.length, onbTrial: S.trial > 0,
    trialOnlyAnnual: !!year && planTrial(year) > 0 && pl.every((x) => x === year || planTrial(x) === 0) };
  const want = DECIDE_METRIC[p.decide];
  return IDEAS[S.area].filter((it) => it.fits(c)).map((it) => {
    const m = it.r[want] ? want : Object.keys(it.r)[0], [lo, hi] = it.r[m];
    return { ...it, m, lo, hi, same: m === want, weak: !!(it.weak || {})[m] };
  }).sort((a, b) => (!!a.lost - !!b.lost) || (b.same - a.same) || (a.weak - b.weak) || ((b.lo + b.hi) - (a.lo + a.hi)));   // no-control results sit below controlled ones (owner, 2026-10-31)
}
// Where a row's number comes from: onboarding ranges are single tests (counted on the row's metric); paywall ranges are Adapty bands, said once in the footnote.
function srcLine(r) {
  return '';   // owner, 2026-10-31: no test counts on the chart; the idea card lists the tests
}
function seenBy(it) {
  if (it.id === 'copy') return 'Adapty’s expected effect for copy-only changes:';
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
const pctR = (lo, hi) => (lo === hi ? sgn(lo) : `${sgn(lo)}–${hi}`) + '%';
function ideasBlock(p) {
  const every = ideasFor(p), all = every.filter((r) => !r.lost), lost = every.filter((r) => r.lost), rows = UI.allIdeas ? all : all.slice(0, 6), thr = p.thr, nw = S.goal === 'notworse';
  const max = Math.max(45, ...rows.map((r) => Math.max(r.hi, ((r.split || {})[r.m] || {}).to || 0) + 3)), step = max > 60 ? 20 : 10, x = (v) => Math.max(0, Math.min(100, v / max * 100));
  const col = (pc) => `calc(var(--lc) + (100% - var(--lc)) * ${pc / 100})`;
  const ticks = []; for (let v = 0; v <= max - step / 2; v += step) ticks.push(v);
  return `<section class="card ideas"><span class="kick">Lift in ${METRIC[DECIDE_METRIC[p.decide]]}, B against A</span><span class="head">${nw ? 'Sized to rule out harm, not to find these' : `Your test catches +${t1(thr)}% and up`}</span><div class="fp">
  ${nw ? '' : `<span class="zone" style="width:calc((100% - var(--lc)) * ${x(thr) / 100})"></span><span class="line" style="left:${col(x(thr))}"></span>`}
  <div class="axis"><span></span><span>${ticks.map((v) => `<span class="tick" style="left:${x(v)}%;transform:translateX(${v ? '-50%' : '0'})">${v ? `+${v}%` : '0'}</span>`).join('')}</span></div>
  ${rows.map((r) => { const ok = !nw && r.same && r.lo >= thr, sp = (r.split || {})[r.m], src = sp ? sp.note : srcLine(r), one = r.lo === r.hi;
    return `<button class="row${ok ? '' : ' dim'}" data-idea="${r.id}"><span class="t"><b>${r.t}</b><span>${pctR(r.lo, r.hi)}${I.chevS}</span>${src || !r.same ? `<small>${[src, r.same ? '' : `on ${METRIC[r.m]}`].filter(Boolean).join(' · ')}</small>` : ''}</span><span class="bar"><i class="${one ? 'dot' : ''}" style="left:${one ? `calc(${x(r.lo)}% - 7px)` : `${x(r.lo)}%`};width:${one ? '14px' : `${Math.max(3, x(r.hi) - x(r.lo))}%`};background:${ok ? '#FFFFFF' : 'rgba(255,255,255,.3)'}"></i>${sp && sp.to ? `<b class="ext" style="left:${x(r.hi)}%;width:${x(sp.to) - x(r.hi)}%"></b><b class="ring" style="left:calc(${x(sp.to)}% - 6px)"></b>` : ''}</span></button>`; }).join('')}
  </div><span class="legend"><span><i class="lb"></i>Lowest to highest result</span><span><i class="ld"></i>One number (one test, or a band given as one figure)</span>${rows.some((r) => ((r.split || {})[r.m] || {}).to) ? '<span><i class="le"></i><i class="lr"></i>Same test, another market</span>' : ''}</span>${UI.allIdeas && lost.length ? `<div class="lost"><span class="lh">Lost in published tests</span>${lost.map((r) => `<button class="row" data-idea="${r.id}"><span class="t"><b>${r.t}</b><span>${r.about ? 'about ' : ''}${pctR(r.lo, r.hi)}${I.chevS}</span>${r.same ? '' : `<small>on ${METRIC[r.m]}</small>`}</span></button>`).join('')}</div>` : ''}${every.length > 6 ? `<button class="more" data-more-ideas>${UI.allIdeas ? 'Show fewer' : `Show all ${every.length}`}</button>` : ''}<span class="src">${IDEAS_SRC[S.area]}${rows.some((r) => !r.same) ? ` Rows marked “on …” were measured on another metric than yours.` : ''}</span></section>`;
}
function ideaCard(p) {
  const it = ideasFor(p).find((x) => x.id === UI.idea) || IDEAS[S.area].map((x) => ({ ...x, m: Object.keys(x.r)[0], lo: Object.values(x.r)[0][0], hi: Object.values(x.r)[0][1], same: false })).find((x) => x.id === UI.idea);
  if (!it) return '';
  const catches = it.lost ? 'This lost in published tests. Don’t run it hoping for a win.' : S.goal === 'notworse' ? 'This test is sized to rule out harm, not to find it.' : !it.same ? `Measured on ${METRIC[it.m]}, not on ${p.metricName}, so compare with care.` : it.lo >= p.thr ? 'Your test catches it.' : it.hi >= p.thr ? 'Your test may catch the high end.' : 'Too small for this test alone.';
  const range = (it.about ? 'about ' : '') + (it.lo === it.hi ? `${sgn(it.lo)}%` : `${sgn(it.lo)}% to ${sgn(it.hi)}%`);
  const other = Object.entries(it.r).filter(([k]) => k !== it.m).map(([k, [lo, hi]]) => `${pctR(lo, hi)} ${METRIC[k]}${S.area === 'onboarding' && (COUNT[it.id] || {})[k] === 0 ? ' in Adapty’s library' : ''}`).join(', ');
  return `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><b style="font-size:21px;font-weight:600;letter-spacing:-.02em;line-height:1.2">${it.t}</b><button class="icon-btn" data-close aria-label="Close">${wide() ? I.x : I.down}</button></div>
  <p class="para">${it.what}</p><p class="para">${seenBy(it)} ${range} ${METRIC[it.m]}${other ? ` (and ${other})` : ''}. ${catches}</p>${testsList(it.id)}<p class="para">Careful: ${it.trap[0].toLowerCase() + it.trap.slice(1)}</p>`;
}
function controls() {
  const onb = S.area === 'onboarding';
  const dec = decideOptions(S.area).map((v) => [v, { money: 'Money per view', paid: 'Paid', trials: 'Trial starts' }[v]]);
  return `<div class="controls">${seg('Testing', 'area', [['onboarding', 'Onboarding'], ['paywall', 'Paywall']])}
  ${onb ? railSlider('New users a week', 'users') + railSlider('New users who start a trial', 'trialRate') : railSlider('Paywall views a week', 'views') + railSlider('Views that end in payment', 'conv')}
  ${onb ? seg('Free trial', 'trial', [[0, 'None'], [3, '3 days'], [7, '7 days'], [14, '14+']]) : ''}
  ${seg('Traffic in test', 'traffic', [[100, '100%'], [50, '50%'], [20, '20%']])}
  ${seg('Versions', 'versions', [[2, 'A/B'], [3, 'A/B/C']])}
  ${seg('Decide on', 'decide', dec)}<span class="hint">${onb ? 'Trial starts answer in weeks. Paid answers what you care about, after the trial.' : 'Prices, plans or trial: money per view. Copy and layout: paid answers faster.'}</span>
  ${seg('Goal', 'goal', [['win', 'Find a win'], ['notworse', 'Prove it’s not worse']])}</div>`;
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
  return `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:21px;font-weight:600">Plans</b><button class="icon-btn" data-close aria-label="Close">${wide() ? I.x : I.down}</button></div>
  ${S.plans.map(one).join('')}${S.plans.length < 4 ? '<button class="addplan" data-plan-add>+ Add a plan</button>' : ''}`;
}
function testScreen() {
  const p = planOf(S);
  const main = `<main class="page" id="main">${thresholdBlock(p)}${sec('Your plan')}${planBlock(p)}${sec('What usually moves it that much', 'Lifts other apps saw in published tests.')}${ideasBlock(p)}${variantCard()}<div class="spacer-peek mobile-only"></div></main>`;
  let overlay = '';
  if (wide()) {
    // details float in the bottom-left corner: the rail on the right is for controls, and a fixed card can't scroll away
    const extra = UI.overlay === 'idea' ? `<section class="float" role="dialog" aria-label="Idea details">${ideaCard(p)}</section>` : '';
    const plans = UI.overlay === 'prices' ? `<div class="half plans"><section class="card plans-panel" role="dialog" aria-label="Plans">${pricesCard()}</section></div>` : '';
    const share = `<button class="share-float" data-go="share">${I.share}<span>Share plan</span></button>`;   // bottom-left: frees the top for the rail and the content
    const settings = `<section class="card" style="padding:18px;display:flex;flex-direction:column;gap:16px">${controls()}</section>`;
    return top() + main + share + `<aside class="rail${plans ? ' split' : ''}" id="rail">${plans ? `<div class="half">${settings}</div>${plans}` : settings}</aside>` + extra;
  }
  if (UI.overlay === 'edit') overlay = `<div class="scrim" data-close></div><div class="sheet" id="sheet"><div class="sheet-in"><span class="grab"></span><button class="sumrow" data-close aria-label="Close"><span><small>Your test</small><em>${summary(p)}</em></span><span class="icon-btn">${I.down}</span></button>${controls()}</div></div>`;
  else if (UI.overlay === 'idea') overlay = `<div class="scrim" data-close></div><div class="sheet"><div class="sheet-in text"><span class="grab"></span>${ideaCard(p)}</div></div>`;
  else if (UI.overlay === 'prices') overlay = `<div class="scrim" data-close></div><div class="sheet"><div class="sheet-in"><span class="grab"></span>${pricesCard()}</div></div>`;
  const peek = `<div class="peek"><div><span class="grab"></span><button class="sumrow" data-overlay="edit" aria-label="Change your test"><span><small>Your test</small><em>${summary(p)}</em></span><span class="icon-btn">${I.up}</span></button></div></div>`;
  return top(shareBtn) + main + peek + overlay;
}

// ------------------------------------------------------------------ share
const LINK = (withRead) => `${location.origin}${location.pathname}#/${withRead ? 'verdict' : 'test'}?${toQuery(withRead)}`;
function planTones(p) {
  const what = S.area === 'onboarding' ? 'onboarding' : 'paywall';
  const vol = S.area === 'onboarding' ? `${n0(S.users)} new users a week` : `${n0(S.views)} views a week`;
  const link = LINK(false);
  if (S.goal === 'notworse') {
    return {
      Short: `${cap(what)} test: ${day(p.start)} → ${day(p.decideDate)}.\nGoal: show B is no more than 5% worse on ${p.metricName}.\nNo early stop unless something breaks. ${link}`,
      Friendly: `Hey team, here’s the plan for the ${what} test.\nWe start ${day(p.start)} and call it on ${day(p.decideDate)}. We only need to show B doesn’t hurt: no more than 5% worse on ${p.metricName}.\nThat takes ${p.weeks} weeks with our ${vol}. ${link}`,
      Detailed: `${cap(what)} test plan\nStart ${day(p.start)}, decide ${day(p.decideDate)}: ${p.weeks} weeks of traffic${p.wait ? `, ${p.wait} days for the last trials to bill` : ''}${p.watch ? `, ${p.watch} days to watch refunds` : ''}.\n${k100(p.perVersion)} per version. Goal: B no more than 5% worse on ${p.metricName}.\n${link}`,
    };
  }
  return {
    Short: `${cap(what)} test: ${day(p.start)} → ${day(p.decideDate)}.\nSees changes ≥ ${t1(p.thr)}% in ${p.metricName}. Copy tweaks won’t show.\nNo early stop unless something breaks. ${link}`,
    Friendly: `Hey team, here’s the plan for the ${what} test.\nWe start ${day(p.start)} and call it on ${day(p.decideDate)}. That’s ${p.weeks} weeks of traffic${p.wait ? ' plus time for the last trials to bill and refunds to show' : ''}.\nWith our ${vol} it only sees changes of ${t1(p.thr)}% or more, so let’s test something bold, not a copy tweak.\nWe judge on ${p.metricName} and only stop early if something breaks. ${link}`,
    Detailed: `${cap(what)} test plan\nStart ${day(p.start)}, decide ${day(p.decideDate)}: ${p.weeks} weeks of traffic${p.wait ? `, ${p.wait} days for the last trials to bill` : ''}${p.watch ? `, ${p.watch} days to watch refunds` : ''}.\n${k100(p.perVersion)} per version. The test sees changes of ${t1(p.thr)}% or more in ${p.metricName}.\nStop early only for harm.\n${link}`,
  };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const more = (c) => `${Math.abs(Math.round(c * 100))}% ${c >= 0 ? 'more' : 'fewer'}`;
function resultTones(p, v) {
  const what = S.area === 'onboarding' ? 'onboarding' : 'paywall', link = LINK(true);
  const checks = v.r.checks.map((c) => `${c.label.toLowerCase()}${c.ok ? '' : ' (failed)'}`).join(', ');
  const range = v.range ? ` (${v.range})` : '';
  return {
    Short: `${cap(what)} test: ${v.title}${range}.\n${v.next}. ${link}`,
    Friendly: `Hey team, the ${what} test is in: ${v.title}.\n${v.sub}\nChecks: ${checks}.\n${v.next}. ${link}`,
    Detailed: `${cap(what)} test result\nDecided on ${p.metricName}, as planned. ${v.sub}${v.versions ? `\n${v.versions.map((x) => `${x.v} vs A: ${sign(x.metric.lift)} (${sign(x.metric.lo)} to ${sign(x.metric.hi)})`).join('; ')}.` : ''}\nChecks: ${checks}.${v.source ? `\nWhere it came from: ${v.source}` : ''}\nNext: ${v.next}. ${v.small}\n${link}`,
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
  const texts = result ? resultTones(p, v) : planTones(p);
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
  if (p.decide === 'trials') rows.push(['Started a trial', 'trials', 'Trial starts per version.']);
  else S.plans.forEach((x, i) => rows.push([`Paid · ${PLAN_TYPES[x.t][1]} $${x.p}`, 'p' + i, i === 0 ? 'First payments after the last trials billed.' : i === S.plans.length - 1 ? 'Prices come from your plan.' : '']));
  rows.push(['Refunds', 'refunds', 'Leave empty if you don’t have it yet.', 'optional']);
  return rows;
}
function readRow([label, f, why, opt]) {
  const inp = (v) => `<label><span>${v}</span><input data-read="${v}.${f}" inputmode="numeric" placeholder="0" value="${esc(READ[v][f] ?? '')}" aria-label="${label}, version ${v}"></label>`;
  return `<div class="rr"><span>${label}${opt ? `<small>${opt}</small>` : ''}</span><div${LETTERS().length === 3 ? ' class="three"' : ''}>${LETTERS().map(inp).join('')}</div><p>${why}</p></div>`;
}
const VARIANT_URL = 'https://github.com/theoutlines/growth-skills/tree/main/plugins/growth-skills/skills/variant-check';
// paywall tests: before launch, check the variant against what won in published tests (the variant-check skill)
const variantCard = () => `<a class="card skill" href="${VARIANT_URL}" target="_blank" rel="noopener"><b>Variant ready? Check it before launch</b><span>${S.area === 'onboarding' ? 'Give Claude your A and B flows' : 'Give Claude your A and B screens'}: can this test see the change, and what did the winning versions have that B lacks. Free Growth Skills plugin.</span><em>Get the plugin →</em></a>`;
const SKILL = `<a class="card skill" href="${SKILL_URL}" target="_blank" rel="noopener"><b>Test data in Amplitude or Mixpanel?</b><span>Let Claude pull it and read it for you with the free Growth Skills plugin. Nothing to type.</span><em>Get the plugin →</em></a>`;
const PRIVACY = `<p class="fine" style="margin:0;padding:0 4px">Nothing you type leaves this page. We don’t store it or send it anywhere.</p>`;
function resultsScreen() {
  const p = planOf(S);
  const plan = UI.readPlan ? `<div class="acc-body">${seg('Testing', 'area', [['onboarding', 'Onboarding'], ['paywall', 'Paywall']])}${seg('Decide on', 'decide', decideOptions(S.area).map((v) => [v, { money: 'Money per view', paid: 'Paid', trials: 'Trial starts' }[v]]))}${seg('Goal', 'goal', [['win', 'Find a win'], ['notworse', 'Prove it’s not worse']])}</div>` : '';
  const body = `${heading('What did each version get?', 'Three numbers per version. We check whether the test can be trusted, then read it.')}
  <div class="mobile-only">${SKILL}</div>
  ${seg('Versions', 'versions', [[2, 'A/B'], [3, 'A/B/C']])}
  ${readRows(p).map(readRow).join('')}
  ${p.decide !== 'trials' ? `<div class="seg"><span>Have the last free trials billed?</span><div class="opts" style="grid-template-columns:1fr 1fr"><span class="pill" data-js-style aria-hidden="true"></span><button data-billed data-val="1" aria-pressed="${READ.billed}">Yes</button><button data-billed data-val="0" aria-pressed="${!READ.billed}">Not yet</button></div></div>` : ''}
  <section class="card planacc"><button class="acc-head" data-toggle-plan aria-expanded="${UI.readPlan}"><span><small>Reading as planned</small><b>${cap(p.metricName)} · ${S.goal === 'notworse' ? 'prove not worse' : 'find a win'}</b></span>${I.down}</button>${plan}</section>
  ${PRIVACY}${UI.readError ? `<p class="err">${UI.readError}</p>` : ''}<button class="btn" data-read-go>Read my result</button>`;
  return top() + `<main class="page">${body}</main>` + `<aside class="rail">${SKILL}</aside>`;
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
  const tag = `Decision day · ${S.goal === 'notworse' ? 'goal: not worse than A by 5%' : (p.decide === 'money' ? 'money per paywall view' : 'decided on ' + p.metricName)}`;
  const L = r.lead, three = r.versions.length > 1, other = three ? r.versions.find((x) => x.v !== L) : null;
  const both = (vd) => three && r.versions.every((x) => x.verdict === vd);
  const also = three && r.verdict.startsWith('win') && other.verdict === 'win' ? ` ${other.v} won too (${sign(other.metric.lift)}), ${L} by more.` : '';
  const V = {
    win: [`${L} wins ${sign(m.lift)}`, `Most likely between ${sign(m.lo)} and ${sign(m.hi)}. Plan on ${sign(m.lo)}.${also}`, `Ship ${L} and make it the new control`, 'Wins usually shrink after launch, so expect the low end.'],
    win_with_cost: [`${L} wins ${sign(m.lift)}, with a cost`, `Most likely between ${sign(m.lo)} and ${sign(m.hi)}. ${r.checks.filter((c) => !c.ok).map((c) => c.label).join(', ')} went the wrong way.`, 'Fix what broke before you ship', `A win that costs refunds isn’t a win yet. Fix it and run ${L} again.`],
    loss: three ? ['B and C both lose', `Best of them, ${L}, is most likely between ${sign(m.lo)} and ${sign(m.hi)}.`, 'Keep A', 'Both made things worse. Keep what you learned and try a different idea.']
      : [`B loses ${sign(m.lift)}`, `Most likely between ${sign(m.lo)} and ${sign(m.hi)}.`, 'Keep A', 'B made things worse. Keep what you learned and try a different idea.'],
    cant_tell: three ? ['Can’t tell yet', `Neither B nor C clearly beats A. Best guess: ${L} ${sign(m.lift)}, but anywhere from ${sign(m.lo)} to ${sign(m.hi)}.`, `Keep A. Try a bolder version of ${L}`, `This test could only see changes of ${t1(p.thr)}% or more. Shipping either now is a coin toss.`]
      : ['Can’t tell yet', `B looks ${sign(m.lift)} ${m.lift >= 0 ? 'better' : 'worse'}, but the real change could be anywhere from ${sign(m.lo)} to ${sign(m.hi)}.`, 'Keep A. Try a bolder version of B', `This test could only see changes of ${t1(p.thr)}% or more. Shipping B now is a coin toss.`],
    not_worse: both('not_worse') ? ['Both safe to ship', `At worst B is ${sign(r.versions[0].metric.lo)} and C ${sign(r.versions[1].metric.lo)}, both inside your −5% limit.`, 'Ship the one you prefer', 'You only had to show they don’t hurt, and they don’t. Don’t present either as a win: the test wasn’t sized to find one.']
      : [three ? `${L} is safe to ship` : 'Safe to ship', `At worst ${L} is ${sign(m.lo)}, inside your −5% limit. Most likely ${sign(m.lift)}.${three ? ` ${other.v} can’t rule out harm (at worst ${sign(other.metric.lo)}).` : ''}`, `Ship ${L}`, 'You only had to show it doesn’t hurt, and it doesn’t. Don’t present it as a win: the test wasn’t sized to find one.'],
    maybe_worse: ['Can’t rule out harm', three ? `At worst B is ${sign(r.versions[0].metric.lo)} and C ${sign(r.versions[1].metric.lo)}, past your −5% limit.` : `At worst B is ${sign(m.lo)}, past your −5% limit. Most likely ${sign(m.lift)}.`, 'Keep A, or run it longer', `More people would narrow the range. Until then, ${three ? 'either' : 'B'} might cost more than 5%.`],
    broken: ['Test broken', `The groups split ${r.split.all.map((x) => t1(x)).join(' / ')} instead of ${three ? 'even thirds' : '50 / 50'}. Something sent different people to each version.`, 'Fix the split, then rerun', 'Common causes: one version loads slower, or is shown only on some devices or app versions.'],
    too_early: ['Too early', `The last free trials haven’t billed, so paid numbers will still grow in ${three ? 'every version' : 'both versions'}.`, `Come back on ${day(p.decideDate)}`, 'Reading now anchors on a number that will change.'],
  }[r.verdict];
  let source = '';
  if (r.source && !['broken', 'too_early'].includes(r.verdict) && p.decide !== 'trials') {
    const s = r.source, a = Math.round(s.topA * 100), b = Math.round(s.topB * 100);
    if (p.decide === 'money' && s.fromMix != null && s.fromMix > 0.5 && s.fromMix <= 1) source = `About ${Math.round(s.fromMix * 100)}% from plans: the ${s.top} plan went from ${a}% to ${b}% of buyers. ${more(s.conv)} people paid. ${L} ${m.lift >= 0 ? `sold the ${s.top} plan better` : `sold the ${s.top} plan worse`}.`;
    else if (s.fromConv != null && s.fromConv >= 0 && s.fromMix >= 0) source = `${cap(more(s.conv))} people paid; the plan mix barely moved (${s.top} ${a}% → ${b}%). So ${L} changed how many people pay, not which plan they pick.`;
    else source = `Paid conversion ${sign(s.conv * 100)}, money per payer ${sign(s.perPayer * 100)}. They pulled in different directions; the net is their difference.`;
  }
  const note = r.verdict === 'broken' ? 'Fix this before you trust any number.' : r.checks.some((c) => !c.ok) ? 'Something went wrong. Fix it before you trust the result.'
    : r.verdict === 'cant_tell' ? 'The test is sound. It just can’t see a change this small.' : 'The test can be trusted.';
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
  const lbl = margin == null ? `<span style="left:${x(0)}%;transform:translateX(-50%)">no change</span>` : `<span style="left:${x(margin)}%;padding-left:6px;color:${ACC};font-weight:600">${sign(margin)} limit</span>`;
  return `<div class="rb" role="img" aria-label="Likely change from ${sign(lo)} to ${sign(hi)}, best guess ${sign(m.lift)}"><div class="lbls">${lbl}</div><div class="bar"><span class="base"></span>${zero}<span class="range" style="left:${x(lo)}%;width:${x(hi) - x(lo)}%"><span>${sign(lo)}</span><span>${sign(hi)}</span></span></div></div>`;
}
function vsPlot(versions, lead, margin) {     // A/B/C: both versions on one scale, one "no change" (or limit) line through both rows
  const ms = versions.map((x) => x.metric), lo0 = Math.min(0, margin ?? 0, ...ms.map((m) => m.lo)), hi0 = Math.max(0, ...ms.map((m) => m.hi)), pad = Math.max(2, (hi0 - lo0) * 0.1);
  const x = (val) => ((val - lo0 + pad) / (hi0 - lo0 + 2 * pad) * 100).toFixed(2);
  const ref = margin ?? 0;
  const rows = versions.map((v) => `<div class="vsrow${v.v === lead ? ' lead' : ''}"><div class="vshead"><b>${v.v}</b><span>${sign(v.metric.lift)}</span><em>${sign(v.metric.lo)} to ${sign(v.metric.hi)}</em></div><div class="vsbar"><span class="base"></span><span class="range" style="left:${x(v.metric.lo)}%;width:${x(v.metric.hi) - x(v.metric.lo)}%"></span></div></div>`).join('');
  return `<section class="card vs"><small>Each version against A</small><div class="vsplot" role="img" aria-label="${versions.map((v) => `${v.v}: ${sign(v.metric.lo)} to ${sign(v.metric.hi)}`).join(', ')}"><span class="vsref${margin == null ? '' : ' lim'}" style="left:${x(ref)}%"><i>${margin == null ? 'no change' : sign(margin) + ' limit'}</i></span>${rows}</div><p>Wider than an A/B range: two comparisons share one 5% error budget.</p></section>`;
}
function numbersRow() {
  const pe = LETTERS().map((v) => `${v} ${n0(num(READ[v].people) ?? 0)}`).join(' · ');
  return `<button class="card numrow" data-go="results:read"><span><small>Your numbers</small><b>${pe} people</b></span>${I.chevS}</button>`;
}
function verdictScreen() {
  const p = planOf(S), v = verdictOf(p);
  if (!v) return resultsScreen();
  const win = v.kind === 'win';
  const card = `<section class="verdict${win ? ' win' : ''}"><span class="tag">${v.tag}</span><span class="title">${v.title}</span><span class="vsub">${v.sub}</span>${v.showBar ? rangeBar(v.r.metric, win, S.goal === 'notworse' ? -5 : null) : ''}</section>`;
  const checks = `<div class="checks"><div>${v.r.checks.map((c) => `<span class="ck${c.ok ? '' : ' bad'}" title="${esc(c.detail)}">${c.ok ? '' : '<b>!</b>'}${c.label}</span>`).join('')}</div><span>${v.note}</span></div>`;
  const info = (icon, label, text, line) => `<section class="card info"><span class="ic">${icon}</span><span><small>${label}</small>${line ? `<b>${line}.</b>` : ''}<p>${text}</p></span></section>`;
  const vs = v.versions ? vsPlot(v.versions, v.r.lead, S.goal === 'notworse' ? -5 : null) : '';
  const body = card + vs + checks + (v.source ? info(I.money, v.srcLabel, v.source) : '') + info(I.flag, 'What to do', v.small, v.next) + (wide() ? '' : numbersRow() + `<button class="btn sec2" data-go="share-result">Share result</button>`);   // mobile: the numbers can be fixed from here (desktop has them in the rail)   // desktop: bottom-left, like Share plan
  const rail = `<aside class="rail"><section class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px"><small style="font-size:13px;font-weight:500;color:rgba(255,255,255,.5)">Your numbers · change any, the answer updates</small>${readRows(p).map(readRow).join('')}</section></aside>`;
  const share = wide() ? `<button class="share-float" data-go="share-result">${I.share}<span>Share result</span></button>` : '';
  return top() + `<main class="page" id="main">${body}</main>` + share + rail;
}

const FOOTER = `<span>© ${new Date().getFullYear()} Ivan Polushin</span><a href="https://github.com/theoutlines/growth-test-planner" target="_blank" rel="noopener">Source</a><a href="https://github.com/theoutlines/growth-skills" target="_blank" rel="noopener">Growth Skills for Claude</a>`;

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
const pillRO = 'ResizeObserver' in window ? new ResizeObserver((es) => { es.forEach((e) => { const p = e.target.querySelector(':scope > .pill'); if (p) p._placed = false; }); placePills(); }) : null;
function afterPaint() { placePills(); if (pillRO) document.querySelectorAll('.pill').forEach((p) => { const box = p.parentElement; if (!box._ro) { box._ro = true; pillRO.observe(box); } }); }
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
  const html = { '': startScreen, area: areaScreen, traffic: trafficScreen, conv: convScreen, trial: trialScreen, test: testScreen, share: () => shareScreen(false),
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
  lastPage = page; UI.areaSwap = false;
  if (/^(area|traffic|conv|trial)$/.test(r)) UI.lastStep = { area: 1, traffic: 2, conv: 3, trial: 4 }[r];
  const s2 = document.getElementById('sheet'); if (s2) s2.scrollTop = st;
  document.documentElement.style.overflow = document.querySelector('.scrim') ? 'hidden' : '';   // a modal or sheet holds the page still
  document.title = 'Growth Test Planner';
  requestAnimationFrame(afterPaint);
}
function onRoute() { const { r, qs } = route(); if (qs) fromQuery(qs); UI.overlay = null; const turn = PAGE(r) !== lastPage; render(); if (turn) window.scrollTo(0, 0); }

function set(key, raw) {
  const v = typeof DEFAULTS[key] === 'number' ? Number(raw) : raw;
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
app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-copytext],[data-more-ideas],[data-go],[data-set],[data-plan],[data-plan-del],[data-plan-add],[data-idea],[data-overlay],[data-close],[data-tone],[data-copy],[data-native-share],[data-billed],[data-toggle-plan],[data-read-go]');
  if (!el) return;
  if (el.dataset.copytext) return copy(el.dataset.copytext);
  if (el.dataset.go) {
    e.preventDefault();
    const [r, arg] = el.dataset.go.split(':');
    if (arg === 'read') return go(r, true);                 // back to the numbers, with them in the link
    if (r === 'area' && arg) { S.area = arg; if (!decideOptions(S.area).includes(S.decide)) S.decide = decideOptions(S.area)[0]; save(); return go('traffic'); }
    if (document.querySelector('.modal')) return closeThen(() => go(r));   // the share modal leaves before the page underneath updates
    return go(r);
  }
  if (el.dataset.set) return set(el.dataset.set, el.dataset.val);
  if (el.dataset.plan) { const [i, f] = el.dataset.plan.split('.'); const x = S.plans[+i]; x[f] = f === 'tr' ? Number(el.dataset.val) : el.dataset.val; if (x.t === 'once') x.tr = 0; return planChanged(); }
  if (el.dataset.planDel) { S.plans.splice(+el.dataset.planDel, 1); setShare(0, S.plans.length === 1 ? 100 : S.sh0); return planChanged(); }
  if ('planAdd' in el.dataset) { const used = S.plans.map((x) => x.t), t = ['month', 'year', 'week', 'once'].find((k) => !used.includes(k)) || 'month'; S.plans.push({ t, p: { week: 6.99, month: 14.99, year: 39.99, once: 29.99 }[t], s: 0, tr: t === 'once' ? 0 : S.plans[0].tr }); setShare(S.plans.length - 1, Math.round(100 / S.plans.length)); return planChanged(); }
  if ('moreIdeas' in el.dataset) { UI.allIdeas = !UI.allIdeas; return render(); }
  if (el.dataset.idea) { UI.overlay = 'idea'; UI.idea = el.dataset.idea; return render(); }
  if (el.dataset.overlay) { UI.overlay = el.dataset.overlay; return render(); }
  if ('close' in el.dataset) return closeThen(() => { UI.overlay = null; render(); });
  if (el.dataset.tone) { UI.tone = el.dataset.tone; return render(); }
  if ('copy' in el.dataset) return copy(document.getElementById('msgtext').innerText);
  if ('nativeShare' in el.dataset) {
    const text = document.getElementById('msgtext').innerText;
    if (navigator.share) return navigator.share({ text }).catch(() => {});
    return copy(text);
  }
  if ('billed' in el.dataset) { READ.billed = el.dataset.val === '1'; return render(); }
  if ('togglePlan' in el.dataset) { UI.readPlan = !UI.readPlan; return render(); }
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
  if (t.dataset.type) { const k = t.dataset.type, v = num(t.value); if (v != null && (v > 0 || SL[k].linear)) { S[k] = SL[k].linear ? Math.min(100, v) : Math.min(SL[k].hi * 10, v); save(); syncTrack(k, t); refreshMain(); } }
  if ('date' in t.dataset) { if (/^\d{4}-\d{2}-\d{2}$/.test(t.value)) { S.start = t.value; save(); history.replaceState(null, '', '#/' + route().r + '?' + toQuery(route().r === 'verdict')); render(); } }
  if (t.dataset.planPrice) { const v = num(t.value); if (v != null && v > 0) { S.plans[+t.dataset.planPrice].p = v; save(); refreshMain(); } }
});
app.addEventListener('change', (e) => { const pt = e.target.dataset.planType; if (pt !== undefined) { const x = S.plans[+pt]; x.t = e.target.value; if (x.t === 'once') x.tr = 0; return planChanged(); } if (e.target.dataset.type) { syncTrack(e.target.dataset.type); if (route().r !== 'test') render(); } });
app.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && UI.overlay) { closeThen(() => { UI.overlay = null; render(); }); return; }
  if (e.target.dataset.type && e.key === 'Enter') e.target.blur();
  const tr = e.target.closest('[data-slide]');
  if (tr && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { const k = tr.dataset.slide; const p = pctOf(k, S[k]) + (e.key === 'ArrowRight' ? 2 : -2); S[k] = valOf(k, Math.max(0, Math.min(100, p))); save(); syncTrack(k); refreshMain(); e.preventDefault(); }
});
function syncTrack(k, except) {
  if (/^sh\d$/.test(k) && !syncTrack.busy) { syncTrack.busy = true; S.plans.forEach((_, i) => { if ('sh' + i !== k) syncTrack('sh' + i); }); syncTrack.busy = false; }
  document.querySelectorAll(`[data-slide="${k}"]`).forEach((tr) => { const p = pctOf(k, S[k]); tr.querySelector('.fill').style.width = p + '%'; tr.querySelector('.handle').style.left = p + '%'; tr.setAttribute('aria-valuetext', SL[k].fmt(S[k])); });
  document.querySelectorAll(`[data-val-of="${k}"]`).forEach((el) => { el.textContent = SL[k].fmt(S[k]) + (SL[k].unit || ''); });
  const txt = SL[k].fmt(S[k]);
  document.querySelectorAll(`[data-type="${k}"]`).forEach((inp) => {
    if (inp === except) return;                                  // never rewrite the field someone is typing in
    inp.value = txt;
    if ('small' in inp.dataset) inp.size = Math.max(2, txt.length);
    else { const size = Math.min(80, Math.floor(600 / txt.length)); inp.style.fontSize = size + 'px'; inp.style.width = Math.max(2, txt.length) * size * 0.56 + 'px'; }
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
app.addEventListener('pointerdown', (e) => {
  const tr = e.target.closest('[data-slide]'); if (!tr) return;
  drag = { tr, k: tr.dataset.slide }; tr.classList.add('dragging'); UI.instant = true; tr.setPointerCapture(e.pointerId); move(e); e.preventDefault();
});
app.addEventListener('pointermove', (e) => { if (drag) move(e); });
app.addEventListener('pointerup', () => { if (drag) { drag.tr.classList.remove('dragging'); drag = null; UI.instant = false; save(); if (route().r !== 'test') render(); } });
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
  document.documentElement.style.setProperty('--lmz', String(Math.min(1, window.innerWidth / 390)));     // landing (test build): the 390 board fits narrow phones
  document.documentElement.style.setProperty('--ldz', String(Math.min(1, window.innerWidth / 1440)));    // and the 1440 board fits 1200–1440 windows
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
