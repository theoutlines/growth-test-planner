// Where a visit came from (owner, 2026-11-23): one anonymous daily count per browser tab, the referring site reduced to a fixed key
// (linkedin, google, …, other, direct) and the page it landed on. Never the URL, query or anything typed; skipped under GPC / Do Not Track.
(() => {
  const HOSTS = [[/(^|\.)linkedin\.com$|^lnkd\.in$/, 'linkedin'], [/(^|\.)google\./, 'google'], [/(^|\.)bing\.com$/, 'bing'], [/(^|\.)duckduckgo\.com$/, 'ddg'],
    [/(^|\.)yandex\./, 'yandex'], [/(^|\.)github\.com$/, 'github'], [/(^|\.)(chatgpt\.com|openai\.com)$/, 'chatgpt'], [/(^|\.)claude\.ai$/, 'claude'],
    [/(^|\.)perplexity\.ai$/, 'perplexity'], [/^(t\.co|x\.com|twitter\.com)$|\.x\.com$|\.twitter\.com$/, 'x'], [/(^|\.)reddit\.com$/, 'reddit'], [/(^|\.)theoutlines\.xyz$/, 'theoutlines']];
  const LAND = { '': 'planner', 'paywall-ab-test-duration': 'duration', 'free-trial-ab-test': 'freetrial', 'minimum-detectable-effect': 'mde', 'onboarding-ab-test': 'onboarding',
    'ab-test-split-90-10': 'split', 'abc-test': 'abc', 'paywall-ab-test-sample-size': 'samplesize', 'ab-tests-that-lost': 'lost', 'subscription-conversion-benchmarks': 'benchmarks' };
  try {
    if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || sessionStorage.getItem('gtp-ref')) return;
    sessionStorage.setItem('gtp-ref', '1');   // later pages in the same tab are not new visits
    let host = ''; try { host = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* unreadable referrer counts as direct */ }
    if (host === location.hostname) return;   // our own pages
    const ref = host ? (HOSTS.find(([re]) => re.test(host)) || [0, 'other'])[1] : 'direct';
    const land = LAND[location.pathname.replace(/^\/|\/$/g, '')] || 'other';
    const send = (e, v) => navigator.sendBeacon('/api/e', new Blob([JSON.stringify({ e, v, a: 'site' })], { type: 'application/json' }));
    send('ref', ref); send('land', land);
  } catch { /* never in the way */ }
})();
