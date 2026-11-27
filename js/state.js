// State, links and routing: what the planner remembers and how a link carries it.
import { DEFAULTS, decideOptions, fresh } from './math.js';
import { IDEAS } from './data.js';

// ------------------------------------------------------------------ state
// Nothing typed here leaves the browser; the only things sent are anonymous daily counts of choices from fixed lists and of which site the visit came from (functions/api/e.js, js/ref.js). The last inputs are kept in localStorage (this browser only);
// a shared link carries them after "#", which browsers never send to the server.
export const S = fresh();
export const READ = { A: {}, B: {}, C: {}, billed: true };
export const LETTERS = () => (S.versions === 3 ? ['A', 'B', 'C'] : ['A', 'B']);
export let UI = { overlay: null, idea: -1, tone: 'Friendly', readPlan: false, readError: '' };
export const ROUTES = ['', 'area', 'traffic', 'starts', 'conv', 'trial', 'test', 'share', 'results', 'verdict', 'share-result'];
export const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

export const KEYS = { hi: 'whatId', h: 'what', a: 'area', v: 'views', c: 'conv', u: 'users', r: 'trialRate', pr: 'paidRate', tv: 'trialView', t: 'trial', s: 'traffic', sp: 'split', k: 'versions', d: 'decide', g: 'goal', w: 'weeks', st: 'start', tg: 'target' };
// plans in a link: w6.99-50-3_y39.99-50-3 (type letter, price, share, trial days)
export const TL = { week: 'w', month: 'm', year: 'y', once: 'o' }, LT = { w: 'week', m: 'month', y: 'year', o: 'once' };
export const plansOut = (pl) => pl.map((x) => `${TL[x.t]}${x.p}-${Math.round(x.s)}-${x.tr}`).join('_');
export const plansIn = (str) => {
  const pl = String(str).split('_').map((t) => { const m = /^([wmyo])([\d.]+)-(\d+)-(\d+)$/.exec(t); return m && { t: LT[m[1]], p: Number(m[2]) || 1, s: Number(m[3]), tr: [0, 3, 7, 14].includes(Number(m[4])) ? Number(m[4]) : 0 }; }).filter(Boolean).slice(0, 4);
  return pl.length ? pl : null;
};
// links and saved state from before plans existed: weekly + annual price and the annual share
export const legacyPlans = (pw, pa, mix, tr) => [{ t: 'week', p: Number(pw) || 6.99, s: 100 - (Number(mix) || 50), tr: Number(tr) || 0 }, { t: 'year', p: Number(pa) || 39.99, s: Number(mix) || 50, tr: Number(tr) || 0 }];
export function toQuery(withRead) {
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
export function fromQuery(qs) {
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
export function route() { const h = location.hash.replace(/^#\/?/, ''); const [r, qs] = h.split('?'); return { r: ROUTES.includes(r) ? r : '', qs: qs || '' }; }
export function go(r, withRead) { UI.overlay = null; location.hash = '#/' + r + (['test', 'share', 'results', 'verdict', 'share-result'].includes(r) ? '?' + toQuery(withRead || r === 'verdict' || r === 'share-result') : ''); }
export function save() { store.set('gtp:last', S); }
export const wide = () => window.innerWidth >= 1200;
