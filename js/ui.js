// Formatting, icons, sliders and the small pieces every screen uses.
import { shares, planTrial } from './math.js';
import { CHIPS } from './data.js';
import { S, UI } from './state.js';

// ------------------------------------------------------------------ formatting
export const n0 = (x) => Math.round(x).toLocaleString('en-US');
export const k100 = (x) => (Math.round(x / 100) * 100).toLocaleString('en-US');
export const day = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const t1 = (x) => x.toFixed(1);

// ------------------------------------------------------------------ icons (filled where they are pictures)
export const I = {
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
export const ACC = '#FF4C00';
export const G = {
  onboarding: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="10" width="13" height="4" fill="#FFF"/><rect x="25.5" y="10" width="13" height="4" fill="#FFF"/><rect x="41" y="10" width="13" height="4" fill="#4A4A4A"/><rect x="10" y="21" width="36" height="7" fill="#FFF"/><rect x="10" y="35" width="44" height="12" fill="#4A4A4A"/><rect x="10" y="51" width="44" height="12" fill="${ACC}"/><rect x="10" y="67" width="44" height="12" fill="#4A4A4A"/></svg>`,
  paywall: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="12" width="40" height="7" fill="#FFF"/><rect x="10" y="23" width="28" height="4" fill="#4A4A4A"/><rect x="10" y="36" width="21" height="28" fill="${ACC}"/><rect x="33" y="36" width="21" height="28" fill="#4A4A4A"/><rect x="14" y="42" width="10" height="4" fill="#FFF"/><rect x="37" y="42" width="10" height="4" fill="#7A7A7A"/><rect x="10" y="70" width="44" height="10" fill="#FFF"/></svg>`,
  plan: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="12" width="36" height="7" fill="#FFF"/><rect x="10" y="23" width="24" height="4" fill="#4A4A4A"/><rect x="10" y="38" width="24" height="14" fill="#FFF"/><rect x="36" y="38" width="8" height="14" fill="${ACC}"/><rect x="46" y="38" width="8" height="14" fill="#4A4A4A"/><rect x="10" y="62" width="44" height="14" fill="${ACC}"/></svg>`,
  read: `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="12" width="30" height="7" fill="#FFF"/><rect x="10" y="23" width="40" height="4" fill="#4A4A4A"/><rect x="10" y="49" width="44" height="2" fill="#4A4A4A"/><rect x="21" y="38" width="3" height="24" fill="#FFF"/><rect x="29" y="43" width="25" height="14" fill="${ACC}"/><rect x="10" y="68" width="44" height="10" fill="#4A4A4A"/></svg>`,
};

// ------------------------------------------------------------------ inputs that slide (log scale)
export const SL = {
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
export const D30 = 30 / 7, kfmt = (x) => (x >= 1e6 ? +(x / 1e6).toFixed(1) + 'M' : x >= 1e3 ? +(x / 1e3).toFixed(x < 1e5 ? 1 : 0) + 'k' : String(Math.round(x)));
export const roundCount = (v) => (v < 1000 ? Math.round(v) : v < 10000 ? Math.round(v / 10) * 10 : Math.round(v / 100) * 100);
export const COUNTS = {   // count key: [people key (weekly), rate key, slider range as % of people]
  paid30: ['views', 'conv', 0.4, 6], trial30: ['views', 'trialView', 0.2, 30],
  otrial30: ['users', 'trialRate', 0.5, 25], opaid30: ['users', 'paidRate', 0.2, 8],
};
export const PEOPLE = { views30: ['views', ['paid30', 'trial30']], users30: ['users', ['otrial30', 'opaid30']] };
Object.entries(PEOPLE).forEach(([k, [base, deps]]) => {
  Object.defineProperty(S, k, { enumerable: false, configurable: true, get: () => Math.round(S[base] * D30), set: (v) => { v = Number(v); if (!(v > 0)) return; const keep = deps.map((d) => S[d]); S[base] = v / D30; deps.forEach((d, i) => { S[COUNTS[d][1]] = keep[i] / v * 100; }); } });
  SL[k] = base === 'views' ? { lo: 5000, hi: 3000000, l: '5k', h: '3M', fmt: n0, round: roundCount } : { lo: 4000, hi: 1500000, l: '4k', h: '1.5M', fmt: n0, round: roundCount };   // ends picked so every typical chip lands on the middle of a figure
});
Object.entries(COUNTS).forEach(([k, [base, rate, lo, hi]]) => {
  const people = () => S[base] * D30;
  Object.defineProperty(S, k, { enumerable: false, configurable: true, get: () => Math.round(people() * S[rate] / 100), set: (v) => { v = Number(v); if (v >= 0) S[rate] = v / people() * 100; } });
  SL[k] = { get lo() { return Math.max(1, people() * lo / 100); }, get hi() { return people() * hi / 100; }, get l() { return kfmt(this.lo); }, get h() { return kfmt(this.hi); }, fmt: n0, round: roundCount };
});
export function setShare(i, v) {
  const pl = S.plans; if (!pl[i]) return;
  v = Math.max(0, Math.min(100, Math.round(v)));
  const w = shares(pl).map((x) => x * 100), rest = w.reduce((t, x, j) => t + (j === i ? 0 : x), 0), others = pl.length - 1;
  pl.forEach((x, j) => { x.s = j === i ? v : rest > 0 ? w[j] / rest * (100 - v) : (100 - v) / others; });
  const ints = pl.map((x) => Math.round(x.s)), diff = 100 - ints.reduce((t, x) => t + x, 0);
  if (diff) { const j = ints.reduce((b, x, k) => (k !== i && x > ints[b] ? k : b), i === 0 && pl.length > 1 ? 1 : 0); ints[j] += diff; }
  pl.forEach((x, j) => { x.s = ints[j]; });
}
export const pctOf = (k, v) => SL[k].linear ? Math.max(0, Math.min(100, (v - SL[k].lo) / (SL[k].hi - SL[k].lo) * 100)) : Math.max(0, Math.min(100, Math.log(v / SL[k].lo) / Math.log(SL[k].hi / SL[k].lo) * 100));
export const valOf = (k, pct) => SL[k].round(SL[k].linear ? SL[k].lo + (SL[k].hi - SL[k].lo) * pct / 100 : SL[k].lo * Math.pow(SL[k].hi / SL[k].lo, pct / 100));

// Metaphor sliders (draft, branch sliders-proto): on the question steps the fill is the thing counted, square glyphs on a 24 px grid
// with one 6 px gap (20 people, 12 clocks, 12 coins); the glyph under the handle fills up to it; typical values are chips on the scale,
// their tick on the middle of a glyph; a haptic tick each time the handle reaches the next glyph. Sheet and rail keep the standard track.
export const GLYPH = {
  person: [20, '<rect x="8" y="0" width="8" height="8"/><rect x="6" y="10" width="12" height="14"/>'],
  clock: [12, '<path fill-rule="evenodd" d="M2 0h20a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM11 5v8h7v-2h-5V5z"/>'],
  coin: [12, '<path fill-rule="evenodd" d="M2 0h20a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/><text x="12" y="17.5" text-anchor="middle" class="cut">$</text>'],
};
export const GLYPH_OF = { views30: 'person', users30: 'person', trial30: 'clock', otrial30: 'clock', paid30: 'coin', opaid30: 'coin' };
export const gRow = (g) => { const [n, svg] = GLYPH[g]; return Array.from({ length: n }, (_, i) => `<svg viewBox="0 0 24 24" style="left:${(i + .5) / n * 100}%">${svg}</svg>`).join(''); };
export function mtrack(k) {
  const g = GLYPH_OF[k], n = GLYPH[g][0], p = pctOf(k, S[k]), cnt = COUNTS[k];
  const ends = cnt ? [cnt[2] + '%', cnt[3] + '%'] : [SL[k].l, SL[k].h];
  // one row of chips on the scale: added in data order (the main benchmark first); a chip may slide sideways off its tick to make room,
  // as long as the tick stays under it; a chip that can't fit is left out (all of them still sit in the sheet's chip list)
  const W = 358, short = (b) => b.replace(/ app$/, '').replace('Europe', 'EU').replace('Health & Fitness', 'Health').replace('Photo & Video', 'Photo');
  const fit = (set) => { const s = [...set].sort((x, y) => x.t - y.t); s.forEach((c) => { c.l = c.t - c.w / 2; });
    for (let it = 0; it < 80; it++) { s.forEach((c) => { c.l = Math.max(32, Math.min(W - 32 - c.w, c.l)); }); let moved = false; for (let i = 1; i < s.length; i++) { const o = s[i - 1].l + s[i - 1].w + 4 - s[i].l; if (o > 0) { s[i - 1].l -= o / 2; s[i].l += o / 2; moved = true; } } s.forEach((c) => { c.l = Math.max(32, Math.min(W - 32 - c.w, c.l)); }); if (!moved) break; }
    for (let i = 1; i < s.length; i++) if (s[i - 1].l + s[i - 1].w + 4 > s[i].l + .5) return null;
    return s.every((c) => c.t >= c.l + 8 && c.t <= c.l + c.w - 8) ? s : null; };
  let placed = [];
  chipList(k).forEach(([v, a, b]) => { const q = pctOf(k, v), t = q / 100 * W, bb = short(b), w = (a.length + bb.length + 1) * 6.8 + 24;
    const tryS = fit([...placed.map((c) => ({ ...c })), { v, a, b: bb, q, t, w }]); if (tryS) placed = tryS; });
  const chipsOn = placed.map((c) => `<i class="mtick" style="left:${c.t / W * 100}%"></i><button class="chip mchip${Math.abs(c.q - p) < .5 ? ' on' : ''}" data-set="${k}" data-val="${c.v}" style="left:${c.l / W * 100}%"><b>${c.a}</b> ${c.b}</button>`).join('');
  return `<div class="mt"><div class="track mtr" data-slide="${k}" data-n="${n}" role="slider" tabindex="0" style="--p:${p}" aria-valuetext="${SL[k].fmt(S[k])}"><div class="grow-off">${gRow(g)}</div><div class="grow-on">${gRow(g)}</div><div class="handle"></div></div>
  <div class="mchips" data-mchips="${k}"><span class="mend l">${ends[0]}</span><span class="mend r">${ends[1]}</span>${chipsOn}</div></div>`;
}
export function bigValue(k) {
  const v = S[k], txt = SL[k].fmt(v), size = Math.min(80, Math.floor(600 / txt.length / 4) * 4);
  return `<div class="big"><label class="num"><span class="sr">Value</span><input data-type="${k}" inputmode="decimal" value="${txt}" style="font-size:${size}px;width:${Math.max(2, txt.length) + 0.1}ch">${SL[k].unit ? `<span class="unit">${SL[k].unit}</span>` : ''}</label>
  ${GLYPH_OF[k] ? mtrack(k) : track(k)}${rangeNote(k)}</div>`;
}
// a typed rate above the slider's top is almost always a typo (2.75 → 32.75): say so, softly, next to the number
export const RATE = { conv: 1, trialRate: 1, paidRate: 1, trialView: 1, paid30: 1, trial30: 1, otrial30: 1, opaid30: 1 };
export const rangeText = (k) => (COUNTS[k] ? (S[k] > S[COUNTS[k][0]] * D30 ? `More than the ${n0(S[COUNTS[k][0]] * D30)} people above. Typo?` : S[k] > SL[k].hi ? `Unusually high for ${n0(S[COUNTS[k][0]] * D30)} people. Typo?` : '') : RATE[k] && S[k] > SL[k].hi ? `${SL[k].fmt(S[k])}% is unusually high, most apps are under ${SL[k].h}%. Typo?` : '');
export const rangeNote = (k) => (RATE[k] ? `<span class="rng" data-rng-of="${k}">${rangeText(k)}</span>` : '');
export function track(k, sm) {
  const p = pctOf(k, S[k]);
  return `<div class="track${sm ? ' sm' : ''}" data-slide="${k}" role="slider" tabindex="0" style="--p:${p}" aria-valuetext="${SL[k].fmt(S[k])}${SL[k].unit || ''}"><div class="clip"><div class="fill"></div></div><div class="handle"></div><span class="end l">${SL[k].l}</span><span class="end r">${SL[k].h}</span></div>`;
}
export const TYPICAL = { paid30: 'conv', trial30: 'trialView', otrial30: 'trialRate', opaid30: 'paidRate' };
export const chipList = (k) => (TYPICAL[k] ? CHIPS[TYPICAL[k]].map(([r, a, b]) => [Math.round(S[COUNTS[k][0]] * D30 * r / 100), a, b]) : CHIPS[k]);
export const seg = (label, key, opts) => `<div class="seg"><span>${label}</span><div class="opts" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))"><span class="pill" data-js-style aria-hidden="true"></span>${opts.map(([v, t]) => `<button data-set="${key}" data-val="${v}" aria-pressed="${String(S[key]) === String(v)}">${t}</button>`).join('')}</div></div>`;
export const railSlider = (label, k, small) => `<div class="rs${small ? ' small' : ''}"><div class="top2"><span class="lab">${label}</span><label class="valbox"><span class="sr">${label}</span><input class="val" data-type="${k}" data-small inputmode="decimal" value="${SL[k].fmt(S[k])}" size="${Math.max(2, SL[k].fmt(S[k]).length)}">${SL[k].unit ? `<span class="u">${SL[k].unit}</span>` : ''}</label></div>${track(k, true)}${rangeNote(k)}</div>`;   // drag the track or type the number

// ------------------------------------------------------------------ shared pieces
export const top = (action) => `<header class="top"><a class="brand" href="#/" aria-label="Growth Test Planner, start"><i></i>Growth Test Planner</a>${action || ''}</header>`;
export const shareBtn = `<button class="icon-btn" data-go="share" aria-label="Share">${I.share}</button>`;
export const heading = (h, sub) => `<div class="heading"><h1>${h}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
export const sec = (t, sub) => `<div class="sec"><b>${t}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
// questions follow the funnel (draft facts30): what you test → what it sells → people → trial starts (only with a trial) → paid
export const hasTrial = () => (S.area === 'onboarding' ? S.trial > 0 : S.plans.some((x) => planTrial(x) > 0));
export const STEPS = () => ['area', 'traffic', 'trial', ...(hasTrial() ? ['starts'] : []), 'conv'];
export const nav = (label, step, next, back) => { const of = STEPS().length, u = 100 / of; return `<div class="nav"><button class="back" data-go="${back}" aria-label="Back to the previous question">${I.back}</button><button class="next${step >= of ? ' full' : ''}" data-go="${next}" aria-label="${label} (question ${step} of ${of} answered)">${step < of ? `<i style="width:${step * u}%;--fill-from:${Math.max(0, (UI.lastStep ?? step - 1)) * u}%"></i>` : ''}<span>${label}</span></button></div>`; };
export const pick = (glyph, t, sub, goTo) => `<button class="pick" data-go="${goTo}"><span>${glyph}</span><span><b>${t}</b><em>${sub}</em></span>${I.chev}</button>`;

export function trialText() {          // paywall: each plan has its own trial
  if (S.area === 'onboarding') return S.trial ? `${S.trial}-day trial` : 'no trial';
  const t = [...new Set(S.plans.map(planTrial))];
  return t.length > 1 ? 'trials vary by plan' : t[0] ? `${t[0]}-day trial` : 'no trial';
}
export function summary(p) {
  const bits = S.area === 'onboarding' ? ['Onboarding', `${n0(S.users30)} new users in 30 days`, S.decide === 'paid' ? `${n0(S.opaid30)} paid` : `${n0(S.otrial30)} started a trial`] : ['Paywall', `${n0(S.views30)} saw it in 30 days`, S.decide === 'trials' ? `${n0(S.trial30)} started a trial` : `${n0(S.paid30)} paid`];
  bits.push(trialText());
  bits.push(`decide on ${{ money: 'revenue', paid: 'conversion', trials: 'trials' }[S.decide] || S.decide}`);   // the plan card no longer says it
  if (S.traffic !== 100) bits.push(`${S.traffic}% of traffic`);
  if (S.versions === 2 && S.split !== 50) bits.push(`${S.split}/${100 - S.split} split`);
  if (S.versions === 3) bits.push('A/B/C');
  if (S.goal === 'notworse') bits.push('prove not worse');
  return bits.join(' · ');
}
