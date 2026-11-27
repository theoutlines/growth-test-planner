// Share texts for a plan and for a result.
import { planOf, sign } from './math.js';
import { S, UI, toQuery, wide } from './state.js';
import { I, day, esc, heading, k100, n0, t1, top } from './ui.js';
import { testScreen } from './screens.js';
import { resultsScreen, verdictOf, verdictScreen } from './verdict.js';

// ------------------------------------------------------------------ share
export const LINK = (withRead) => `${location.origin}${location.pathname}#/${withRead ? 'verdict' : 'test'}?${toQuery(withRead)}`;
// what B changes, in the team's words, as part of the sentence (owner, 2026-11-02: not a “B:” line stuck on top)
export const lcFirst = (t) => (t.length > 1 && t[1] === t[1].toUpperCase() && /[A-Z]/.test(t[1]) ? t : t[0].toLowerCase() + t.slice(1));
export function planTones(p) {
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
export const cap = (s) => s[0].toUpperCase() + s.slice(1);
export const more = (c) => `${Math.abs(Math.round(c * 100))}% ${c >= 0 ? 'more' : 'fewer'}`;
export function resultTones(p, v) {
  const what = S.area === 'onboarding' ? 'onboarding' : 'paywall', link = LINK(true), b = S.what.trim();
  const checks = v.r.checks.map((c) => `${c.label.toLowerCase()}${c.ok ? '' : ' (failed)'}`).join(', ');
  const range = v.range ? ` (${v.range})` : '';
  return {
    Short: `${cap(what)} test${b ? ` (B: ${lcFirst(b)})` : ''}: ${v.title}${range}.\n${v.next}. ${link}`,
    Friendly: `Hey team, the ${what} test is in.${b ? ` B tried ${lcFirst(b)}.` : ''} ${v.title}.\n${v.sub}\nChecks: ${checks}.\n${v.next}. ${link}`,
    Detailed: `${cap(what)} test result\n${b ? `A: current ${what}. B: ${b}.\n` : ''}Decided on ${p.metricName}, as planned. ${v.sub}${v.versions ? `\n${v.versions.map((x) => `${x.v} vs A: ${sign(x.metric.lift)} (${sign(x.metric.lo)} to ${sign(x.metric.hi)})`).join('; ')}.` : ''}\nChecks: ${checks}.${v.source ? `\nWhere it came from: ${v.source}` : ''}\nNext: ${v.next}. ${v.small}\n${link}`,
  };
}
export function shareBody(texts, title, sub) {
  const tones = Object.keys(texts);
  if (!texts[UI.tone]) UI.tone = 'Friendly';
  return `${heading(title, sub)}<section style="display:flex;flex-direction:column;gap:12px"><div class="tones" role="radiogroup" aria-label="Tone">${['Short', 'Friendly', 'Detailed'].filter((t) => tones.includes(t)).map((t) => `<button role="radio" aria-checked="${t === UI.tone}" data-tone="${t}">${t}</button>`).join('')}</div>
  <div class="msg"><div contenteditable="true" id="msgtext" aria-label="Message, editable" role="textbox" aria-multiline="true">${esc(texts[UI.tone])}</div><div class="foot"><span>Tap the text to edit</span><button class="icon-btn" data-copy aria-label="Copy message">${I.copy}</button></div></div></section>`;
}
export function shareScreen(result) {
  const p = planOf(S);
  const v = result ? verdictOf(p) : null;
  if (result && !v) return resultsScreen();   // no numbers to share yet: ask for them, as the verdict screen does
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
