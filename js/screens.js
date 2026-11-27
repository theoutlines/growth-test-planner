// The question screens and the test plan screen.
import { planOf, decideOptions, PLAN_TYPES, shares, planTrial, longestTrial } from './math.js';
import { IDEAS, IDEAS_SRC, TRIALS, METRIC, DECIDE_METRIC, TESTS, COUNT } from './data.js';
import { S, UI, wide } from './state.js';
import { G, I, STEPS, bigValue, day, esc, hasTrial, heading, k100, kfmt, n0, nav, pick, railSlider, sec, seg, shareBtn, summary, t1, top } from './ui.js';

// ------------------------------------------------------------------ screens
export function startScreen() {
  return top() + `<main class="page">
  <section class="hero"><svg class="hero-art" viewBox="0 0 358 300" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><defs><filter id="heroNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="m"/><feComponentTransfer in="m" result="a"><feFuncA type="linear" slope="0.4" intercept="0"/></feComponentTransfer><feComposite in="a" in2="SourceGraphic" operator="in" result="g"/><feBlend in="SourceGraphic" in2="g" mode="overlay"/></filter><linearGradient id="heroBlk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0466BB"/><stop offset="1" stop-color="#000"/></linearGradient><linearGradient id="heroMix" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0466BB"/><stop offset="1" stop-color="#FF4710"/></linearGradient></defs><rect x="196" y="132" width="162" height="168" fill="#0466BB"/><rect x="196" y="144" width="112" height="20" fill="#EA6905"/><rect x="196" y="184" width="112" height="20" fill="#EA6905"/><rect x="196" y="224" width="112" height="20" fill="#EA6905"/><rect x="196" y="264" width="112" height="20" fill="#EA6905"/><rect x="308" y="132" width="50" height="168" fill="url(#heroBlk)" filter="url(#heroNoise)"/><rect x="132" y="216" width="64" height="84" fill="url(#heroMix)" filter="url(#heroNoise)"/></svg><div><small>For designers who ship onboarding and paywalls</small><strong>Will your test see your change?</strong></div></section>
  <div class="stack">${pick(G.plan, 'Plan a test', 'How bold your change must be to show up, how long the test runs, the day you decide. A few questions.', 'area')}
  ${pick(G.read, 'Read a finished test', 'Win, loss or too early to tell, with the likely range. Same terms as the plan.', 'results')}</div>
  <p class="fine" style="text-align:center;margin:0">Free. What you type stays on this page.</p></main>`;
}
export function areaScreen() {
  return top() + `<main class="page q">${heading('What are you testing?', 'Tap one. A few questions follow.')}
  <div class="stack">${pick(G.onboarding, 'Onboarding', 'Questions, personalisation, the first screens. We’ll count new users.', 'area:onboarding')}
  ${pick(G.paywall, 'Paywall', 'Plans, trial, layout, copy. We’ll count people who see it.', 'area:paywall')}</div></main>`;
}
export function trafficScreen() {
  const onb = S.area === 'onboarding', t = hasTrial();
  return top() + `<main class="page q">${onb ? heading('How many new users started onboarding in the last 30 days?', 'Count people, not screens.') : heading('How many people saw this paywall in the last 30 days?', 'Count people, not views: the test splits people.')}
  ${bigValue(onb ? 'users30' : 'views30')}<div class="grow"></div>${nav(onb ? 'Next: free trial' : 'Next: what it sells', 2, 'trial', 'area')}</main>`;
}
export function startsScreen() {
  const onb = S.area === 'onboarding';
  return top() + `<main class="page q">${heading('How many of them started a free trial?', 'The same 30 days.')}
  ${bigValue(onb ? 'otrial30' : 'trial30')}
  <div class="grow"></div>${nav('Next: how many pay', 4, 'conv', 'trial')}</main>`;
}
export function convScreen() {
  const onb = S.area === 'onboarding', t = hasTrial();
  return top() + `<main class="page q">${heading('How many of them paid?', t ? 'The same 30 days, payments after the free trial included.' : 'The same 30 days.')}
  ${bigValue(onb ? 'opaid30' : 'paid30')}
  <div class="grow"></div>${nav('Show my test', STEPS().length, 'test', t ? 'starts' : 'trial')}</main>`;
}
export function trialScreen() {
  const onb = S.area === 'onboarding';
  if (!onb) {        // paywall: what it sells comes before the counts, so we know whether to ask about trials
    const lt = longestTrial(S.plans);
    return top() + `<main class="page q">${heading('What does this paywall sell?', 'Tick the plans it shows, then each one’s price and free trial.')}
  ${plansPick()}<span class="wait">${lt ? `You decide ${lt >= 14 ? '14+' : lt} days after the test stops, when the last trials bill.` : 'No trial, so no extra wait.'}</span>${S.plans.length > 1 ? `<div class="nextq">${mixBlock('Share of sales')}</div>` : ''}
  <div class="grow"></div>${nav(hasTrial() ? 'Next: how many start a trial' : 'Next: how many pay', 3, hasTrial() ? 'starts' : 'conv', 'traffic')}</main>`;
  }
  const tiles = TRIALS.map(([d, sub]) => `<button class="tile" data-set="trial" data-val="${d}" aria-pressed="${S.trial === d}"><span class="n"><b>${d === 0 ? 'None' : d >= 14 ? '14+' : d}</b>${d ? '<span>days</span>' : ''}</span><span class="days" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i${i < d ? ' class="on"' : ''}></i>`).join('')}</span><em>${sub}</em></button>`).join('');
  return top() + `<main class="page q">${heading('How long is the free trial?', 'People who start a trial pay only when it ends, so the test waits for them.')}
  <div class="tiles">${tiles}</div><p class="hint tilehint">Judged on trial starts, the test doesn’t wait for the trial. Judged on paid, it waits for it.</p>
  <div class="grow"></div>${nav(hasTrial() ? 'Next: how many start a trial' : 'Next: how many pay', 3, hasTrial() ? 'starts' : 'conv', 'traffic')}</main>`;
}

export function thresholdBlock(p) {
  if (p.notWorse) return `<section class="thr"><h1>To show B is no more than <span>5% worse</span>, run ${p.notWorse.weeks} weeks</h1><p class="sub">Proving “not worse” takes ${t1(p.notWorse.times)}× the people of catching a 10% win. Use it when the change has to ship anyway and you only need to know it doesn’t hurt.</p></section>`;
  const abs = p.unit === 'money'
    ? `Revenue per viewer: $${p.today.toFixed(2)} today, $${(p.today * (1 + p.thr / 100)).toFixed(2)} or more to show up. Smaller changes look like noise.`
    : (() => { const onb = S.area === 'onboarding', ppl = onb ? S.users30 : S.views30, ck = onb ? (S.decide === 'paid' ? 'opaid30' : 'otrial30') : (S.decide === 'trials' ? 'trial30' : 'paid30'), verb = /trial/.test(ck) ? 'start a trial' : 'pay';
      return `Today ${n0(S[ck])} of ${n0(ppl)} ${onb ? 'new users' : 'viewers'} ${verb} in 30 days. B needs about ${n0(Math.round(S[ck] * (1 + p.thr / 100)))} from as many people to show up. Smaller changes look like noise.`; })();
  return `<section class="thr"><h1>Your test catches changes of <span data-swap>+${t1(p.thr)}%</span> or more</h1><p class="sub">${abs}</p>
  <div class="weeks" role="radiogroup" aria-label="How long the test runs">${p.options.map((o) => `<button role="radio" aria-checked="${o.weeks === S.weeks}" data-set="weeks" data-val="${o.weeks}"><b>${o.weeks} wk</b><span data-swap="center">+${t1(o.thr)}%</span></button>`).join('')}</div>${reachNote(p)}</section>`;
}
// Too little traffic for any length (owner, 2026-11-10, variant A under the weeks): one line, only when even 8 weeks miss what most ideas lift.
export function reachNote(p) {
  const w8 = p.options[p.options.length - 1].thr;
  return w8 > suggestedTarget(p) ? `<p class="reach"><span class="ri">!</span>Even 8 weeks catch only +${t1(w8)}%, more than most ideas below lift.</p>` : '';
}
export function planBlock(p) {
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
export function whatOptions(p) {
  const shown = ideasFor(p).filter((x) => !x.lost), ids = new Set(shown.map((x) => x.id));
  return [...shown, ...IDEAS[S.area].filter((x) => !x.lost && !ids.has(x.id))];
}
export function whatField(p) {
  const id = S.whatId === 'other' || IDEAS[S.area].some((x) => x.id === S.whatId) ? S.whatId : (S.what ? 'other' : '');
  const opts = whatOptions(p).map((x) => `<option value="${x.id}"${id === x.id ? ' selected' : ''}>${esc(x.t)}</option>`).join('');
  return `<div class="what"><span>What changes in B</span><div class="dd${id ? '' : ' empty'}"><select data-what-pick aria-label="What changes in B"><option value=""${id ? '' : ' selected'} disabled>Pick what B changes</option>${opts}<option value="other"${id === 'other' ? ' selected' : ''}>Something else</option></select>${I.chevD}</div>
  ${id === 'other' ? `<input data-what maxlength="120" placeholder="Describe the change (stays on this page)" value="${esc(S.what)}" aria-label="Describe the change in B">` : ''}<p class="whatnote">Only the pick is counted, anonymously.</p></div>`;
}
export const counted = new Set();
export const countOnce = (e, v) => { const k = e + ':' + v + ':' + S.area; if (counted.has(k)) return; counted.add(k); count(e, v); };   // once per page load
export const count = (e, v) => {   // anonymous daily count; skipped when the browser asks not to be tracked
  try { if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return; navigator.sendBeacon('/api/e', new Blob([JSON.stringify({ e, v, a: S.area })], { type: 'application/json' })); } catch { /* never in the way */ }
};
// Plan by date (owner, 2026-11-02): the change worth catching → how much traffic each length needs, and who sees B.
export function suggestedTarget(p) {
  const lows = ideasFor(p).filter((r) => r.same && !r.lost && r.lo > 0).map((r) => r.lo).sort((a, b) => a - b);
  return lows.length ? Math.max(2, Math.round(lows[Math.floor((lows.length - 1) / 2)])) : 10;   // the middle low end of ideas measured on this metric
}
export function dateBlock(p) {     // optional (owner, 2026-11-02: “feels optional, MDE is jargon”): one row that opens in place
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
export function ideasFor(p) {
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
export const NOCTRL = /no control group|method not stated|no method given|founder report|staged rollout|before\/after/i;
export function noControl(it) {
  const list = (TESTS[S.area] || {})[it.id] || [];
  return list.length > 0 && list.every((t) => NOCTRL.test(t[2] || ''));
}
export function srcLine(r) {
  return '';   // owner, 2026-10-31: no test counts on the chart; the idea card lists the tests
}
export function seenBy(it) {
  if (it.id === 'copy') return 'Adapty’s expected effect for copy-only changes:';
  if (/^One test behind/.test(it.trap || '')) return 'One published test:';   // the source line never claims more tests than there are
  if (S.area === 'paywall' && !it.lost) return 'Adapty’s library, many tests:';
  return (COUNT[it.id] || {})[it.m] === 0 ? 'Adapty’s library, many tests:' : 'Other apps saw';
}
export function testsList(id) {
  const list = (TESTS[S.area] || {})[id] || [];
  if (!list.length) return '<p class="para muted">No single published test yet.</p>';
  // the latest three by publish date (undated last), with the total under the heading (owner, 2026-10-31)
  const shown = [...list].sort((a, b) => (b[4] || '').localeCompare(a[4] || '')).slice(0, 3), n = list.length;
  return `<div class="tests"><span class="th">Single published tests</span><span class="tn">${n > 3 ? `Latest 3 of ${n}` : `${n} in total`}</span>${shown.map(([app, num, what, url]) => `<a class="test" href="${url}" target="_blank" rel="noopener"><span><b>${app} · ${num}</b><small>${what}</small></span>${I.ext}</a>`).join('')}</div>`;
}
export const sgn = (v) => (v < 0 ? `−${-v}` : `+${v}`);
export const pctR = (lo, hi) => (lo === hi ? `${sgn(lo)}%` : `${sgn(lo)}% to ${sgn(hi)}%`);   // one range format everywhere (DESIGN_RULES §3)
export function ideasBlock(p) {
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
export function ideaCard(p) {
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
export const PLAN_ORDER = { week: 0, month: 1, year: 2, once: 3 };
export const sortPlans = () => S.plans.sort((a, b) => PLAN_ORDER[a.t] - PLAN_ORDER[b.t]);   // rows and the share bar read short to long (owner, 2026-11-02)
export function mixBlock(label) {     // one bar for all plans, a segment per plan, drag a divider (owner, 2026-11-02)
  const w = shares(S.plans);
  return `<div class="mix"><span class="mixlab">${label}</span><div class="mixnames" aria-hidden="true">${S.plans.map((x, i) => `<span>${PLAN_TYPES[x.t][0]} <b>${Math.round(w[i] * 100)}%</b></span>`).join('')}</div><div class="mixbar" data-mixbar>${S.plans.map((x, i) => `<span class="mseg" style="flex:${Math.max(0.001, w[i])} 0 0"></span>${i < S.plans.length - 1 ? `<span class="mh" data-mix-handle="${i}" role="slider" tabindex="0" aria-label="Between ${PLAN_TYPES[x.t][0]} and ${PLAN_TYPES[S.plans[i + 1].t][0]}" aria-valuetext="${PLAN_TYPES[x.t][0]} ${Math.round(w[i] * 100)}%, ${PLAN_TYPES[S.plans[i + 1].t][0]} ${Math.round(w[i + 1] * 100)}%"></span>` : ''}`).join('')}</div></div>`;
}
// the plans question (owner, 2026-11-04, variant B3): tick the plans it shows; each ticked plan gets its own price and trial
export const PLAN_DEF = { week: 6.99, month: 14.99, year: 39.99, once: 29.99 };
export function plansPick() {
  return `<div class="pp">${['week', 'month', 'year', 'once'].map((t) => { const i = S.plans.findIndex((x) => x.t === t), on = i >= 0, x = S.plans[i];
    const box = `<button class="pp-tog" data-plan-toggle="${t}" aria-pressed="${on}"><span class="pp-box" aria-hidden="true">${on ? '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 10.5l3.2 3L15 6.5" stroke="#151515" stroke-width="2" stroke-linejoin="miter"/></svg>' : ''}</span>${PLAN_TYPES[t][0]}</button>`;
    if (!on) return `<div class="pp-row">${box}</div>`;
    const tr = t === 'once' ? '<span class="pi-f pp-f pi-na">No trial</span>' : `<div class="pi-f pp-f dd"><select data-plan-trial="${i}" aria-label="Free trial, ${PLAN_TYPES[t][1]} plan">${[[0, 'No trial'], [3, '3-day trial'], [7, '7-day trial'], [14, '14-day trial']].map(([d, l]) => `<option value="${d}"${planTrial(x) === d ? ' selected' : ''}>${l}</option>`).join('')}</select>${I.chevD}</div>`;
    return `<div class="pp-row on">${box}<div class="pp-fields"><label class="pi-f pp-f pp-price"><span>$</span><input data-plan-price="${i}" inputmode="decimal" value="${x.p}" aria-label="Price, ${PLAN_TYPES[t][1]} plan"></label>${tr}</div></div>`; }).join('')}</div>`;
}
export function plansInline(step) {
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
export const DECIDE_HINT = {
  paywall: { money: 'Revenue per viewer. Use it for changes to prices, plans or the trial offer.', paid: 'Share of viewers who pay. Answers faster for copy and layout changes.', trials: 'Trial start rate. Answers fastest, but a trial isn’t revenue yet.' },
  onboarding: { trials: 'Trial start rate. Answers in weeks.', paid: 'Share of new users who pay. Waits for the trial to end.' },
};
export function facts30() {
  const onb = S.area === 'onboarding', ks = onb ? ['users30', 'otrial30', 'opaid30'] : ['views30', 'trial30', 'paid30'], t = hasTrial();
  const lab = [onb ? 'New users' : 'Saw the paywall', 'Started a trial', 'Paid'], short = [onb ? 'new users' : 'saw', 'trial', 'paid'];
  const idx = t ? [0, 1, 2] : [0, 2], sum = idx.map((i) => `${kfmt(S[ks[i]])} ${short[i]}`).join(' · '), open = UI.factsOpen;
  const head = `<button class="pi-acc" data-facts-toggle aria-expanded="${!!open}" aria-label="Last 30 days: ${sum}"><span>${sum}</span>${open ? I.chevU : I.chevD}</button>`;
  if (!open) return `<div class="plans-inline"><span class="lab">Last 30 days</span><div class="pi-box">${head}</div></div>`;
  return `<div class="plans-inline open"><span class="lab">Last 30 days</span><div class="pi-box open">${head}<div class="pi-body facts">${idx.map((i) => railSlider(lab[i], ks[i])).join('')}</div></div></div>`;
}
export function controls() {
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
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const pseg = (label, i, f, opts) => `<div class="seg"${label ? '' : ' aria-label="Plan type"'}>${label ? `<span>${label}</span>` : ''}<div class="opts" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))"><span class="pill" data-js-style aria-hidden="true"></span>${opts.map(([v, t]) => `<button data-plan="${i}.${f}" data-val="${v}" aria-pressed="${String(S.plans[i][f]) === String(v)}">${t}</button>`).join('')}</div></div>`;
export function pricesCard() {           // the paywall's plans: type, price, free trial, share of buyers
  const many = S.plans.length > 1;
  const one = (x, i) => `<section class="pl">
    <div class="plhead"><div class="dd"><select data-plan-type="${i}" aria-label="Plan type">${Object.entries(PLAN_TYPES).map(([k, v]) => `<option value="${k}"${x.t === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select>${I.chevD}</div>${many ? `<button class="icon-btn sm" data-plan-del="${i}" aria-label="Remove this plan">${I.minus}</button>` : ''}</div>
    <div class="plrow"><label class="rr"><span>Price</span><div style="grid-template-columns:1fr"><label><span>$</span><input data-plan-price="${i}" inputmode="decimal" value="${x.p}" aria-label="Price, ${PLAN_TYPES[x.t][1]} plan"></label></div></label>
    ${x.t === 'once' ? '' : pseg('Free trial', i, 'tr', [[0, 'None'], [3, '3'], [7, '7'], [14, '14+']])}</div>
    ${many ? railSlider('Buyers who pick it', 'sh' + i, true) : ''}</section>`;
  return `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px;font-weight:500">Plans</b><button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
  ${S.plans.map(one).join('')}${S.plans.length < 4 ? '<button class="addplan" data-plan-add>+ Add a plan</button>' : ''}`;
}
export function testScreen() {
  const p = planOf(S);
  const main = `<main class="page" id="main">${thresholdBlock(p)}${dateBlock(p)}${sec('Your plan')}${planBlock(p)}${sec('What usually moves it that much')}${ideasBlock(p)}<div class="spacer-peek mobile-only"></div></main>`;
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
  return top(shareBtn) + main + peek + overlay;
}
