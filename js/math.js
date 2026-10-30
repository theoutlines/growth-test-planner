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
// Onboarding, decided on paid: install→paid is taken as the same share of install→trial as in RevenueCat SOSA 2026
// medians (2.0% paid vs 5.8% trial), because the planner asks for the trial rate only.
const PAID_PER_TRIAL = 2.0 / 5.8;

export const DEFAULTS = {
  area: 'paywall',        // paywall | onboarding
  views: 50000,           // paywall views a week
  conv: 2.75,             // % of paywall views that end in a payment
  users: 20000,           // new users a week (onboarding)
  trialRate: 5.8,         // % of new users who start a trial
  trial: 3,               // free trial days: 0 | 3 | 7 | 14
  traffic: 100,           // % of traffic in the test
  versions: 2,            // 2 | 3
  decide: 'money',        // money | paid | trials
  goal: 'win',            // win | notworse
  weeks: 4,
  start: '',             // ISO date; empty = next Monday (whole weeks from a clean start)
  pw: 6.99, pa: 39.99, mixA: 50,   // weekly price, annual price, % of buyers on annual
};

function k2(versions) {                      // 2·(z₁₋α/₂ + z₁₋β)², Bonferroni for more than two versions
  const a = ALPHA / (versions - 1);
  return 2 * (zInv(1 - a / 2) + zInv(POWER)) ** 2;
}
function k2OneSided(versions) {
  const a = ALPHA / (versions - 1);
  return 2 * (zInv(1 - a) + zInv(POWER)) ** 2;
}

export function decideOptions(area) { return area === 'onboarding' ? ['trials', 'paid'] : ['money', 'paid']; }

// Everything the test screen shows, from the inputs.
export function planOf(s) {
  const onb = s.area === 'onboarding';
  const decide = decideOptions(s.area).includes(s.decide) ? s.decide : decideOptions(s.area)[0];
  const exposure = (onb ? s.users : s.views) * s.traffic / 100;          // people (or views) a week in the test
  const perVersionWeek = exposure / s.versions;
  let p, cv2, metricName, today, unit;
  if (!onb) {
    p = s.conv / 100;
    if (decide === 'money') {
      const mix = s.mixA / 100, mu = (1 - mix) * s.pw + mix * s.pa;
      const v = (1 - mix) * s.pw ** 2 + mix * s.pa ** 2 - mu * mu;
      cv2 = (v / mu ** 2 + 1) / p - 1;
      metricName = 'money per paywall view'; today = mu * p; unit = 'money';
    } else { cv2 = (1 - p) / p; metricName = 'paid conversion'; today = p; unit = 'rate'; }
  } else {
    p = decide === 'trials' ? s.trialRate / 100 : s.trialRate / 100 * PAID_PER_TRIAL;
    cv2 = (1 - p) / p; metricName = decide === 'trials' ? 'trial starts' : 'paid conversion'; today = p; unit = 'rate';
  }
  const K = k2(s.versions);
  const mdeAt = (w) => Math.sqrt(K * cv2 / (perVersionWeek * w)) * 100;
  const options = [2, 4, 6, 8].map((w) => ({ weeks: w, thr: mdeAt(w) }));
  const payments = decide !== 'trials';
  const wait = payments ? s.trial : 0, watch = payments ? WATCH_DAYS : 0;
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
  return { onb, decide, metricName, unit, today, thr, options, weeks, notWorse, start, decideDate, collect: weeks * 7, wait, watch,
           perVersion: perVersionWeek * weeks, exposure, p };
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
  const payA = A.weekly + A.annual, payX = X.weekly + X.annual;
  const rev = (v) => { const s1 = v.weekly * s.pw + v.annual * s.pa, s2 = v.weekly * s.pw ** 2 + v.annual * s.pa ** 2, m = s1 / v.people; return [m, s2 / v.people - m * m, s1]; };
  const [mA, vA, revA] = rev(A), [mX, vX, revX] = rev(X);
  let lift, lo, hi;
  if (plan.decide === 'money') [lift, lo, hi] = relCI(mA, vA, A.people, mX, vX, X.people, z);
  else if (plan.decide === 'trials') [lift, lo, hi] = propRel(A.trials, A.people, X.trials, X.people, z);
  else [lift, lo, hi] = propRel(payA, A.people, payX, X.people, z);
  out.metric = { lift: lift * 100, lo: lo * 100, hi: hi * 100 };
  if (plan.decide === 'paid' && payA && payX && s.area === 'paywall') {      // money per view stays a guardrail
    const [g, , gHi] = relCI(mA, vA, A.people, mX, vX, X.people, z);
    out.checks.push({ label: `Money per view ${sign(g * 100)}${tag}`, ok: gHi > 0, detail: '' });
  }
  if (A.refunds != null && X.refunds != null && payA && payX) {
    const zr = z2(A.refunds, payA, X.refunds, payX);
    out.checks.push({ label: `Refunds held${tag}`, ok: zr <= 2.58, detail: `${(A.refunds / payA * 100).toFixed(1)}% → ${(X.refunds / payX * 100).toFixed(1)}%` });
  }
  if (payA && payX && revA && revX) {        // revenue per person = how many paid × what they paid
    const cA = payA / A.people, cX = payX / X.people, aA = revA / payA, aX = revX / payX;
    const lr = Math.log(mX / mA), lc = Math.log(cX / cA), la = Math.log(aX / aA);
    out.source = { conv: cX / cA - 1, perPayer: aX / aA - 1, fromConv: lr ? lc / lr : null, fromMix: lr ? la / lr : null, annualA: A.annual / payA, annualB: X.annual / payX };
  }
  out.guardBad = out.checks.some((c) => !c.ok);
  return out;
}

// r = { A: {people, weekly, annual, trials, refunds}, B: {...}, C?: {...}, billed: true|false }
// With three versions each of B and C is read against A, ranges widened for two comparisons (same Bonferroni split as the plan).
export function readOf(s, r, plan) {
  const letters = r.C ? ['A', 'B', 'C'] : ['A', 'B'];
  const k = letters.length, n = letters.reduce((t, v) => t + r[v].people, 0), e = n / k;
  const chi = letters.reduce((t, v) => t + (r[v].people - e) ** 2 / e, 0);
  const pSrm = k === 2 ? erfc(Math.sqrt(chi / 2)) : Math.exp(-chi / 2);       // chi-square, 1 or 2 degrees of freedom
  const srmOk = pSrm >= 0.001;
  const split = letters.map((v) => r[v].people / n * 100);
  const out = { checks: [{ label: 'Fair split', ok: srmOk, detail: split.map((x) => x.toFixed(1)).join(' / ') }] };
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
  out.split = { a: split[0], b: split[1], c: split[2], all: split };
  return out;
}

export const sign = (x, digits = 0) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(digits) + '%';
