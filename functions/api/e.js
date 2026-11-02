// Anonymous counter (owner, 2026-11-02): which choices people make in the planner (fixed lists only).
// Stores only a daily count per (area, event, value). No IP, no cookie, no user id, never free text.
// Needs a D1 database bound to this Pages project as DB (Cloudflare → Pages → growth-test-planner → Settings → Bindings).
const V = /^[A-Za-z0-9]{1,24}$/;                 // values come from fixed lists in the app (idea ids, option keys); anything else is dropped
const EVENTS = Object.fromEntries(['what', 'page', 'area', 'decide', 'goal', 'weeks', 'versions', 'split', 'trial', 'idea', 'ideaplan', 'bydate', 'share', 'verdict', 'promo'].map((e) => [e, V]));
const AREAS = new Set(['paywall', 'onboarding']);
const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
export async function onRequestPost({ request, env }) {
  if (!env.DB) return done();
  let b; try { b = await request.json(); } catch { return done(); }
  const e = String(b?.e ?? ''), v = String(b?.v ?? ''), a = String(b?.a ?? '');
  if (!EVENTS[e] || !EVENTS[e].test(v) || !AREAS.has(a)) return done();
  const day = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS counts (day TEXT, area TEXT, event TEXT, value TEXT, n INTEGER, PRIMARY KEY (day, area, event, value))').run();
    await env.DB.prepare('INSERT INTO counts (day, area, event, value, n) VALUES (?1, ?2, ?3, ?4, 1) ON CONFLICT (day, area, event, value) DO UPDATE SET n = n + 1').bind(day, a, e, v).run();
  } catch { /* a counter must never break the page */ }
  return done();
}
export const onRequest = () => new Response(null, { status: 405 });
