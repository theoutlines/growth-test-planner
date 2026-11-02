// Growth Test Planner — the numbers. Pure functions, no DOM.
// Plan: two-sample size formula, n per version = 2·(z₁₋α/₂ + z₁₋β)²·CV² / MDE², solved for the MDE a given
// number of people can see. Read: the same rules as the test-readout skill in theoutlines/growth-skills.

// Inverse normal CDF (Acklam's approximation, |error| < 1.2e-9)
export function zInv(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425, hi = 1 - lo;
  let q, r;
  if (p < lo) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > hi) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

const POWER = 0.8, ALPHA = 0.05, WATCH_DAYS = 7, NOT_WORSE_MARGIN = 0.05;
// Defaults: onboarding from RevenueCat SOSA 2026 medians (install→trial 5.8%, install→paid 2.0%); paywall from Adapty
// State of Paywalls 2026, US median app (view→paid 2.75%, view→trial start 6.94% in apps with trials).

export const DEFAULTS = {
  area: 'paywall',        // paywall | onboarding
  views: 50000,           // paywall views a week
  conv: 2.75,             // % of paywall views that end in a payment
  users: 20000,           // new users a week (onboarding)
  trialRate: 5.8,         // % of new users who start a trial
  paidRate: 2.0,          // % of new users who make a first payment (onboarding, decided on paid)
  trialView: 6.94,        // % of paywall views that start a trial (paywall, decided on trial starts)
  split: 50,              // % of test traffic that stays on A (two versions): 50 | 70 | 80 | 90
  target: 0,              // smallest change worth catching, % (0 = suggested from the ideas)
  trial: 3,               // free trial days: 0 | 3 | 7 | 14
  traffic: 100,           // % of traffic in the test
  versions: 2,            // 2 | 3
  decide: 'money',        // money | paid | trials
  goal: 'win',            // win | notworse
  weeks: 4,
  start: '',             // ISO date; empty = next Monday (whole weeks from a clean start)
  // paywall plans: type (week | month | year | once), price, share of buyers (weights, shown as %), free-trial days
  plans: [{ t: 'week', p: 6.99, s: 50, tr: 3 }, { t: 'year', p: 39.99, s: 50, tr: 3 }],
};
export const PLAN_TYPES = { week: ['Week', 'weekly', 'wk'], month: ['Month', 'monthly', 'mo'], year: ['Year', 'annual', 'yr'], once: ['Lifetime', 'lifetime', 'lifetime'] };
export const fresh = () => JSON.parse(JSON.stringify(DEFAULTS));   // DEFAULTS holds an array: never share it
export const shares = (plans) => { const t = plans.reduce((a, x) => a + x.s, 0) || 1; return plans.map((x) => x.s / t); };
export const planTrial = (x) => (x.t === 'once' ? 0 : x.tr);
// the longest free trial among plans people actually buy: the last trials bill that many days after the test stops
export const longestTrial = (plans) => { const w = shares(plans); return Math.max(0, ...plans.map((x, i) => (w[i] > 0 ? planTrial(x) : 0))); };

function k2(versions) {                      // 2·(z₁₋α/₂ + z₁₋β)², Bonferroni for more than two versions
  const a = ALPHA / (versions - 1);
  return 2 * (zInv(1 - a / 2) + zInv(POWER)) ** 2;
}
function k2OneSided(versions) {
  const a = ALPHA / (versions - 1);
  return 2 * (zInv(1 - a) + zInv(POWER)) ** 2;
}

export function decideOptions(area) { return area === 'onboarding' ? ['trials', 'paid'] : ['money', 'paid', 'trials']; }
// shares of test traffic per version: A keeps `split`% with two versions; three versions split evenly
export function splitOf(s) { return s.versions === 2 ? [s.split / 100, 1 - s.split / 100] : [1 / 3, 1 / 3, 1 / 3]; }
// how much an uneven split costs against an even one: (1/a + 1/b) / 4, so 50/50 = 1, 80/20 ≈ 1.56
const spread = (s) => { const [a, b] = splitOf(s); return s.versions === 2 ? (1 / a + 1 / b) / 4 : 1; };

// Everything the test screen shows, from the inputs.
export function planOf(s) {
  const onb = s.area === 'onboarding';
  const decide = decideOptions(s.area).includes(s.decide) ? s.decide : decideOptions(s.area)[0];
  const exposure = (onb ? s.users : s.views) * s.traffic / 100;          // people (or views) a week in the test
  const perVersionWeek = exposure / s.versions / spread(s);              // effective people per version (an uneven split counts for less)
  let p, cv2, metricName, today, unit;
  if (!onb && decide === 'trials') { p = s.trialView / 100; cv2 = (1 - p) / p; metricName = 'trial starts'; today = p; unit = 'rate'; }
  else if (!onb) {
    p = s.conv / 100;
    if (decide === 'money') {
      const w = shares(s.plans), mu = s.plans.reduce((a, x, i) => a + w[i] * x.p, 0);
      const v = s.plans.reduce((a, x, i) => a + w[i] * x.p ** 2, 0) - mu * mu;
      cv2 = (v / mu ** 2 + 1) / p - 1;
      metricName = 'revenue per paywall view'; today = mu * p; unit = 'money';
    } else { cv2 = (1 - p) / p; metricName = 'paid conversion'; today = p; unit = 'rate'; }
  } else {
    p = decide === 'trials' ? s.trialRate / 100 : s.paidRate / 100;
    cv2 = (1 - p) / p; metricName = decide === 'trials' ? 'trial starts' : 'paid conversion'; today = p; unit = 'rate';
  }
  const K = k2(s.versions);
  const mdeAt = (w) => Math.sqrt(K * cv2 / (perVersionWeek * w)) * 100;
  const options = [2, 4, 6, 8].map((w) => ({ weeks: w, thr: mdeAt(w) }));
  const payments = decide !== 'trials';
  const wait = payments ? (onb ? s.trial : longestTrial(s.plans)) : 0, watch = payments ? WATCH_DAYS : 0;
  let weeks = s.weeks, notWorse = null;
  if (s.goal === 'notworse') {
    const n = k2OneSided(s.versions) * cv2 / NOT_WORSE_MARGIN ** 2;
    weeks = Math.max(2, Math.ceil(n / perVersionWeek));
    const nWin = K * cv2 / 0.1 ** 2;
    notWorse = { weeks, margin: NOT_WORSE_MARGIN * 100, times: n / nWin };
  }
  const thr = mdeAt(weeks);
  const start = s.start && /^\d{4}-\d{2}-\d{2}$/.test(s.start) ? new Date(s.start + 'T00:00:00') : nextMonday(new Date());
  const decideDate = addDays(start, weeks * 7 + wait + watch);
  // decided on trial starts: an early read; paid is checked once the last trials have billed
  const trialLen = onb ? s.trial : longestTrial(s.plans), checkPaid = decide === 'trials' && trialLen > 0 ? addDays(start, weeks * 7 + trialLen) : null;
  // planning by date: the traffic share each length needs to catch `target`% (null when even 100% isn't enough)
  const base = onb ? s.users : s.views, sh = splitOf(s);
  const need = (tg, w, c = cv2, vers = s.versions) => K * c * vers * spread(s) / (base * w * (tg / 100) ** 2) * 100;
  const byDate = (tg) => [2, 4, 6, 8].map((w) => { const t = need(tg, w); return { weeks: w, traffic: t <= 100 ? Math.max(1, Math.ceil(t)) : null, best: Math.sqrt(K * cv2 * s.versions * spread(s) / (base * w)) * 100 }; });
  return { onb, decide, metricName, unit, today, thr, options, weeks, notWorse, start, decideDate, collect: weeks * 7, wait, watch, checkPaid,
           perVersion: perVersionWeek * weeks * spread(s), exposure, p, byDate, need, split: sh,
           seeB: s.traffic * (1 - sh[0]), base };
}

export function nextMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const add = ((8 - x.getDay()) % 7) || 7;
  return addDays(x, add);
}
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

// ------------------------------------------------------------------ reading a finished test
const erfc = (x) => {        // Numerical Recipes erfc, |error| < 1.2e-7
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
};

function relCI(mA, vA, nA, mB, vB, nB, z = 1.96) {
  const r = mB / mA - 1;
  const se = Math.sqrt(vB / nB / mA ** 2 + mB ** 2 * vA / nA / mA ** 4);
  return [r, r - z * se, r + z * se];
}
function propRel(xA, nA, xB, nB, z = 1.96) {
  if (!xA || !xB) return [NaN, NaN, NaN];
  const pA = xA / nA, pB = xB / nB;
  const se = Math.sqrt((1 - pA) / xA + (1 - pB) / xB), lr = Math.log(pB / pA);
  return [Math.exp(lr) - 1, Math.exp(lr - z * se) - 1, Math.exp(lr + z * se) - 1];
}
function z2(xA, nA, xB, nB) {
  const p = (xA + xB) / (nA + nB), se = Math.sqrt(p * (1 - p) * (1 / nA + 1 / nB));
  return se ? (xB / nB - xA / nA) / se : 0;
}

// One version against A: the decision metric with its range, guardrails, and where the difference came from.
function pairOf(s, plan, A, X, z, tag) {
  const out = { checks: [] };
  const P = s.plans, sum = (a) => a.reduce((t, x) => t + x, 0);
  const payA = sum(A.paid), payX = sum(X.paid);
  const rev = (v) => { const s1 = sum(v.paid.map((n, i) => n * P[i].p)), s2 = sum(v.paid.map((n, i) => n * P[i].p ** 2)), m = s1 / v.people; return [m, s2 / v.people - m * m, s1]; };
  const [mA, vA, revA] = rev(A), [mX, vX, revX] = rev(X);
  let lift, lo, hi;
  if (plan.decide === 'money') [lift, lo, hi] = relCI(mA, vA, A.people, mX, vX, X.people, z);
  else if (plan.decide === 'trials') [lift, lo, hi] = propRel(A.trials, A.people, X.trials, X.people, z);
  else [lift, lo, hi] = propRel(payA, A.people, payX, X.people, z);
  out.metric = { lift: lift * 100, lo: lo * 100, hi: hi * 100 };
  if (plan.decide === 'paid' && payA && payX && s.area === 'paywall') {      // revenue per view stays a guardrail
    const [g, , gHi] = relCI(mA, vA, A.people, mX, vX, X.people, z);
    out.checks.push({ label: `Revenue per view ${sign(g * 100)}${tag}`, ok: gHi > 0, detail: '' });
  }
  if (plan.decide === 'trials' && payA && payX) {        // trial starts decide; paid, once in, must not go the other way
    const [pl, , ph] = propRel(payA, A.people, payX, X.people, z);
    out.checks.push({ label: `Paid ${sign(pl * 100)}${tag}`, ok: ph > 0, detail: `${(payA / A.people * 100).toFixed(2)}% → ${(payX / X.people * 100).toFixed(2)}%` });
  }
  if (A.refunds != null && X.refunds != null && payA && payX) {
    const zr = z2(A.refunds, payA, X.refunds, payX);
    out.checks.push({ label: `Refunds held${tag}`, ok: zr <= 2.58, detail: `${(A.refunds / payA * 100).toFixed(1)}% → ${(X.refunds / payX * 100).toFixed(1)}%` });
  }
  if (payA && payX && revA && revX) {        // revenue per person = how many paid × what they paid
    const cA = payA / A.people, cX = payX / X.people, aA = revA / payA, aX = revX / payX;
    const lr = Math.log(mX / mA), lc = Math.log(cX / cA), la = Math.log(aX / aA);
    const top = P.reduce((b, x, i) => (x.p > P[b].p ? i : b), 0);          // the priciest plan: where a mix shift shows
    out.source = { conv: cX / cA - 1, perPayer: aX / aA - 1, fromConv: lr ? lc / lr : null, fromMix: lr ? la / lr : null, topA: A.paid[top] / payA, topB: X.paid[top] / payX, top: PLAN_TYPES[P[top].t][1], plans: P.length };
  }
  out.guardBad = out.checks.some((c) => !c.ok);
  return out;
}

// r = { A: {people, paid: [n per plan], trials, refunds}, B: {...}, C?: {...}, billed: true|false }
// With three versions each of B and C is read against A, ranges widened for two comparisons (same Bonferroni split as the plan).
export function readOf(s, r, plan) {
  const letters = r.C ? ['A', 'B', 'C'] : ['A', 'B'];
  const k = letters.length, n = letters.reduce((t, v) => t + r[v].people, 0), want = k === 2 ? splitOf(s) : [1 / 3, 1 / 3, 1 / 3];
  const chi = letters.reduce((t, v, i) => t + (r[v].people - n * want[i]) ** 2 / (n * want[i]), 0);
  const pSrm = k === 2 ? erfc(Math.sqrt(chi / 2)) : Math.exp(-chi / 2);       // chi-square, 1 or 2 degrees of freedom
  const split = letters.map((v) => r[v].people / n * 100);
  // On big tests chi-square flags tiny gaps (49.9 / 50.1 on 1.6M people). A gap under 1% of a group's expected size can move the
  // result by about that much at most, so it's a warning, not a broken test. A bigger gap with p < 0.001 still breaks it.
  const drift = Math.max(...split.map((x, i) => Math.abs(x / (100 * want[i]) - 1)));
  const srmOff = pSrm < 0.001, srmOk = !srmOff || drift < 0.01;
  const out = { checks: [{ label: srmOff && srmOk ? 'Split slightly off' : 'Fair split', ok: srmOk, warn: srmOff && srmOk, detail: split.map((x) => x.toFixed(1)).join(' / ') }] };
  const payments = plan.decide !== 'trials';
  if (payments) out.checks.push({ label: 'Trials billed', ok: r.billed, detail: r.billed ? 'Decision day passed' : 'Not yet' });
  const z = zInv(1 - ALPHA / (k - 1) / 2);
  out.versions = letters.slice(1).map((v) => ({ v, ...pairOf(s, plan, r.A, r[v], z, k > 2 ? ` · ${v}` : '') }));
  out.versions.forEach((x) => out.checks.push(...x.checks));
  const notWorse = s.goal === 'notworse', lim = -NOT_WORSE_MARGIN * 100;
  out.versions.forEach((x) => {
    const m = x.metric;
    x.verdict = notWorse ? (m.lo > lim ? 'not_worse' : 'maybe_worse') : m.lo > 0 ? (x.guardBad ? 'win_with_cost' : 'win') : m.hi < 0 ? 'loss' : 'cant_tell';
  });
  // the version the answer is about: the best clear winner, else the best guess
  const rank = { win: 4, win_with_cost: 3, not_worse: 2, cant_tell: 1, maybe_worse: 1, loss: 0 };
  const lead = [...out.versions].sort((a, b) => (rank[b.verdict] - rank[a.verdict]) || (b.metric.lift - a.metric.lift))[0];
  out.lead = lead.v; out.metric = lead.metric; out.source = lead.source;
  let v;
  if (!srmOk) v = 'broken';
  else if (payments && !r.billed) v = 'too_early';
  else v = lead.verdict;
  out.verdict = v;
  out.split = { a: split[0], b: split[1], c: split[2], all: split, want: want.map((x) => x * 100), warn: srmOff && srmOk, drift };
  return out;
}

export const sign = (x, digits = 0) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(digits) + '%';
