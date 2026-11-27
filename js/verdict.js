// Reading a finished test: inputs, the verdict and its charts.
import { planOf, readOf, decideOptions, sign, PLAN_TYPES, fresh } from './math.js';
import { SKILL_URL } from './data.js';
import { LETTERS, READ, S, UI, wide } from './state.js';
import { ACC, I, day, esc, heading, n0, seg, t1, top } from './ui.js';
import { countOnce } from './screens.js';
import { cap, more } from './share.js';
import { afterPaint, morphNode } from './motion.js';

// ------------------------------------------------------------------ decision day
export function readRows(p) {
  const onb = p.onb;
  const rows = [[onb ? 'New users' : 'Saw the paywall', 'people', onb ? 'People per version, from the moment they were split.' : 'People per version.']];
  if (p.decide === 'trials') {
    rows.push(['Started a trial', 'trials', 'Trial starts per version.']);
    rows.push(['Paid', 'p0', 'After the last trials bill. Checks the trial win holds.', 'optional']);
  } else S.plans.forEach((x, i) => rows.push([`Paid · ${PLAN_TYPES[x.t][1]} $${x.p}`, 'p' + i, i === 0 ? 'First payments after the last trials billed.' : i === S.plans.length - 1 ? 'Prices come from your plan.' : '']));
  rows.push(['Refunds', 'refunds', 'Leave empty if you don’t have it yet.', 'optional']);
  return rows;
}
export function readRow([label, f, why, opt]) {
  const inp = (v) => `<label><span>${v}</span><input data-read="${v}.${f}" inputmode="numeric" placeholder="0" value="${esc(READ[v][f] ?? '')}" aria-label="${label}, version ${v}"></label>`;
  return `<div class="rr"><span>${label}${opt ? `<small>${opt}</small>` : ''}</span><div${LETTERS().length === 3 ? ' class="three"' : ''}>${LETTERS().map(inp).join('')}</div><p>${why}</p></div>`;
}
export const VARIANT_URL = 'https://github.com/theoutlines/growth-skills/tree/main/plugins/growth-skills/skills/variant-check';
// paywall tests: before launch, check the variant against what won in published tests (the variant-check skill)
// promo cards (owner, 2026-11-02, option A): our glyph on the left, short copy, a real button
export const promo = (href, glyph, title, text) => `<a class="card skill" data-promo="${href === VARIANT_URL ? 'variant' : 'data'}" href="${href}" target="_blank" rel="noopener">${glyph}<span class="sk"><b>${title}</b><span>${text}</span><span class="btn sec2 skbtn">Get the plugin</span></span></a>`;
export const variantCard = () => promo(VARIANT_URL, `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="8" y="16" width="21" height="40" rx="4" fill="#4A4A4A"/><rect x="12" y="22" width="13" height="4" fill="#FFF"/><rect x="12" y="44" width="13" height="7" fill="#777"/><rect x="35" y="16" width="21" height="40" rx="4" fill="#FFF"/><rect x="39" y="22" width="13" height="4" fill="#151515"/><rect x="39" y="44" width="13" height="7" fill="${ACC}"/><rect x="8" y="64" width="48" height="3" fill="#4A4A4A"/><rect x="8" y="64" width="34" height="3" fill="${ACC}"/><rect x="8" y="72" width="22" height="3" fill="#4A4A4A"/></svg>`, 'Variant ready? Check it before launch', `Claude checks your A and B ${S.area === 'onboarding' ? 'flows' : 'screens'}: will this test see the change?`);
export const SKILL = promo(SKILL_URL, `<svg width="64" height="88" viewBox="0 0 64 88" aria-hidden="true"><rect width="64" height="88" rx="10" fill="#2C2C2C"/><rect x="10" y="14" width="30" height="5" fill="#FFF"/><rect x="10" y="62" width="44" height="2" fill="#4A4A4A"/><rect x="12" y="40" width="8" height="22" fill="#4A4A4A"/><rect x="24" y="32" width="8" height="30" fill="#777"/><rect x="36" y="24" width="8" height="38" fill="${ACC}"/><rect x="10" y="70" width="28" height="4" fill="#4A4A4A"/></svg>`, 'Test data in Amplitude or Mixpanel?', 'Let Claude pull it and read it for you. Nothing to type.');
export const PRIVACY = `<p class="fine" style="margin:0;padding:0 4px">What you type stays on this page. We don’t store it or send it anywhere.</p>`;
export function resultsScreen() {
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
export function num(x) { const v = Number(String(x ?? '').replace(/[ ,]/g, '')); return Number.isFinite(v) && String(x ?? '').trim() !== '' ? v : null; }
export function readInputs(p) {
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
export function verdictOf(p) {
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
    cant_tell: three ? ['Can’t tell yet', `Neither B nor C clearly beats A. Best guess: ${L} ${sign(m.lift)}, but anywhere from ${sign(m.lo)} to ${sign(m.hi)}.`, `Keep A. Try a bolder version of ${L}`, `This test could only see changes of +${t1(p.thr)}% or more. Shipping either now is a coin toss.`]
      : ['Can’t tell yet', `B looks ${sign(m.lift)} ${m.lift >= 0 ? 'better' : 'worse'}, but the real change could be anywhere from ${sign(m.lo)} to ${sign(m.hi)}.`, 'Keep A. Try a bolder version of B', `This test could only see changes of +${t1(p.thr)}% or more. Shipping B now is a coin toss.`],
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
export function rangeBar(m, win, margin) {
  const lo = m.lo, hi = m.hi, dmin0 = Math.min(lo, 0, margin ?? 0), dmax0 = Math.max(hi, 0), pad = Math.max(2, (dmax0 - dmin0) * 0.18);
  const x = (v) => Math.max(0, Math.min(100, (v - dmin0 + pad) / (dmax0 - dmin0 + 2 * pad) * 100));
  const cross = lo < 0 && hi > 0;
  const zero = margin == null ? `<span class="zero" style="left:${x(0)}%;top:${cross ? -2 : 2}px;height:${cross ? 6 : 26}px"></span>` : `<span class="lim" style="left:${x(margin)}%"></span>`;
  const lbl = margin == null ? `<span style="left:${x(0)}%;transform:translateX(-50%)">no change</span>` : `<span style="left:${x(margin)}%;padding-left:8px;color:${ACC};font-weight:500">${sign(margin)} limit</span>`;
  return `<div class="rb" role="img" aria-label="Likely change from ${sign(lo)} to ${sign(hi)}, best guess ${sign(m.lift)}"><div class="lbls">${lbl}</div><div class="bar"><span class="base"></span>${zero}<span class="range" style="left:${x(lo)}%;width:${x(hi) - x(lo)}%"><span>${sign(lo)}</span><span>${sign(hi)}</span></span></div></div>`;
}
export function vsPlot(versions, lead, margin) {     // A/B/C: both versions on one scale, one "no change" (or limit) line through both rows
  const ms = versions.map((x) => x.metric), lo0 = Math.min(0, margin ?? 0, ...ms.map((m) => m.lo)), hi0 = Math.max(0, ...ms.map((m) => m.hi)), pad = Math.max(2, (hi0 - lo0) * 0.1);
  const x = (val) => ((val - lo0 + pad) / (hi0 - lo0 + 2 * pad) * 100).toFixed(2);
  const ref = margin ?? 0;
  const rows = versions.map((v) => `<div class="vsrow${v.v === lead ? ' lead' : ''}"><div class="vshead"><b>${v.v}</b><span>${sign(v.metric.lift)}</span><em>${sign(v.metric.lo)} to ${sign(v.metric.hi)}</em></div><div class="vsbar"><span class="base"></span><span class="vszero${margin == null ? '' : ' lim'}" style="left:${x(ref)}%${v.metric.lo < ref && v.metric.hi > ref ? ';top:-8px;height:8px' : ''}"></span><span class="range" style="left:${x(v.metric.lo)}%;width:${x(v.metric.hi) - x(v.metric.lo)}%"></span></div></div>`).join('');
  return `<section class="card vs"><small>Each version against A</small><div class="vsplot" role="img" aria-label="${versions.map((v) => `${v.v}: ${sign(v.metric.lo)} to ${sign(v.metric.hi)}`).join(', ')}"><span class="vsref${margin == null ? '' : ' lim'}" style="left:${x(ref)}%"><i>${margin == null ? 'no change' : sign(margin) + ' limit'}</i></span>${rows}</div><p>Wider than an A/B range: two comparisons share one 5% error budget.</p></section>`;
}
export function numbersRow() {
  const pe = LETTERS().map((v) => `${v} ${n0(num(READ[v].people) ?? 0)}`).join(' · ');
  return `<button class="card numrow" data-go="results:read"><span><small>Your numbers</small><b>${pe} people</b></span><span class="numedit">Edit</span></button>`;   // edits the numbers in place (owner, 2026-11-04: a chevron read as “goes somewhere”)
}
export function verdictScreen() {
  const p = planOf(S), v = verdictOf(p);
  if (!v) return resultsScreen();
  const win = v.kind === 'win';
  countOnce('verdict', v.r.verdict.replace(/[^A-Za-z]/g, '') || 'none');
  const card = `<div class="vhead"><span class="vtag">${v.tag}</span>${S.what ? `<span class="vwhat">B: ${esc(S.what)}</span>` : ''}</div><section class="verdict${win ? ' win' : ''}"><span class="title">${v.title}</span><span class="vsub">${v.sub}</span>${v.showBar ? rangeBar(v.r.metric, win, S.goal === 'notworse' ? -5 : null) : ''}</section>`;
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

export const FOOTER = `<span>© ${new Date().getFullYear()} Ivan Polushin</span><a href="https://github.com/theoutlines/growth-test-planner" target="_blank" rel="noopener">Source</a>`;

export function addFooter(pg) {
  if (!pg || pg.querySelector('.foot')) return;
  const sp = pg.querySelector('.spacer-peek'), f = document.createElement('footer');
  f.className = 'foot'; f.innerHTML = FOOTER; sp ? pg.insertBefore(f, sp) : pg.appendChild(f);
}
export function swapMain(html) {           // live updates touch only the content column; it keeps its footer
  const main = document.getElementById('main'); if (!main) return null;
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const fresh = tmp.querySelector('#main'); addFooter(fresh); morphNode(main, fresh); afterPaint();
  return tmp;
}
