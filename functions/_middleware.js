// The site is served straight from the repo root, so repo files are URLs too.
// Never serve notes, docs or tooling: only the planner's pages and assets.
const HIDDEN = /(\.md$|^\/tools\/|^\/\.github\/)/i;

export async function onRequest({ request, next }) {
  if (HIDDEN.test(new URL(request.url).pathname)) {
    return new Response('Not found', { status: 404 });
  }
  return next();
}
