// Content written once from public sources. Lifts are ranges seen in published tests, not forecasts.
// Paywall: Adapty A/B test library and State of In-App Subscriptions 2026.
// Onboarding: the onboarding-teardown evidence library (theoutlines/growth-skills), test numbers in brackets.

// Idea pool. Each idea keeps the ranges published tests measured, per metric (never merged), and when it applies.
// r: { arpu | conv | trials | ltv: [low, high] }  ·  fits(c): c = { trial (any plan has one), year, multi, once, onbTrial }
// Paywall: Adapty's A/B test library (as summarised in the paywall-ab-test-assistant skill). Onboarding: the onboarding-teardown
// ranges (theoutlines/growth-skills), test numbers in brackets; aggregate rows are Adapty's library.
export const METRIC = { arpu: 'revenue per user', conv: 'paid conversion', trials: 'trial starts', ltv: 'LTV' };
export const IDEAS = {
  paywall: [
    { id: 'annual', t: 'Make annual the hero', r: { arpu: [25, 40] }, fits: (c) => c.year && c.multi, what: 'Annual preselected, trial on annual, weekly price shown per week.', trap: 'Conversion can drop while revenue rises. Judge by revenue.' },
    { id: 'explain', t: 'Explain the trial next to the price', r: { arpu: [12, 36] }, fits: (c) => c.trial, what: 'A 3-step timeline: today, reminder, first charge.', trap: 'Shown too early, it adds drop-off before the paywall.' },
    { id: 'annualTrial', t: 'Trial on annual only', r: { conv: [15, 30] }, fits: (c) => c.year && c.multi && !c.trialOnlyAnnual, what: 'Trial badge and copy on the annual option only.', trap: 'Flips by platform. Read iOS and Android apart.' },
    { id: 'compare', t: 'Free vs paid comparison paywall', r: { arpu: [15, 15] }, fits: () => true, what: 'A table of what free gets and what paid adds, as the paywall itself.', trap: 'Shown as a teaser before the paywall it lost. Put it on the paywall.' },
    { id: 'proof', t: 'Social proof on the paywall', r: { conv: [10, 30] }, fits: () => true, what: 'Rating, a few short reviews or a user count near the button.', trap: 'Stacked with a comparison table in one redesign, it lost. Test it alone.' },
    { id: 'visuals', t: 'Richer visuals or motion', r: { arpu: [16, 34], conv: [13, 27] }, fits: () => true, what: 'Animated hero or product preview instead of a static image.', trap: 'Adds load time; slow devices may lose more than they gain.' },
    { id: 'cta', t: 'Rewrite the button', r: { conv: [15, 30] }, fits: () => true, what: 'Button copy that says what happens next, e.g. “Start my free week”.', trap: 'One test behind this range. Cheap to try, easy to over-read.' },
    { id: 'close', t: 'Delay the close button', r: { conv: [8, 15] }, fits: () => true, what: 'The ✕ appears after a few seconds instead of at once.', trap: 'An “Are you sure?” popup on close lost. Delay, don’t nag.' },
    { id: 'lifetime', t: 'Add a lifetime option', r: { arpu: [10, 15] }, fits: (c) => !c.once && c.plans < 4, what: 'A one-time plan next to annual, priced well above it.', trap: 'Can pull buyers off annual. Watch the plan mix.' },
    { id: 'price', t: 'Raise the price in top markets', r: { arpu: [15, 25] }, fits: () => true, what: 'Higher prices in the US, Western Europe and similar markets.', trap: 'The same rise lost badly outside those markets. Test by region.' },
    { id: 'second', t: 'Offer right after the first paywall closes', r: { conv: [25, 30] }, fits: () => true, what: 'When someone closes the onboarding paywall, one more screen with a discount or another plan.', trap: 'Wins were mostly on iOS. After the main in-app paywall the same offer lost about half the revenue per user.' },
    { id: 'copy', t: 'Headline and copy tweaks', r: { conv: [3, 8], arpu: [1, 3] }, fits: () => true, what: 'New headline, button text, small reorders.', trap: 'Only about a third of visual or text-only tests lifted LTV at all (Adapty, 105,000 paywalls). Fold them into a bigger change.' },
    // Lost in published tests: shown only under “Show all”, at the bottom, never ranked or marked as caught
    { id: 'secondMain', lost: true, t: 'The same offer after the main in-app paywall', r: { arpu: [-50, -50] }, about: true, fits: () => true, what: 'The second-chance discount, shown after the paywall people meet inside the app instead of right after the onboarding paywall.', trap: 'Revenue per user fell by roughly half (Adapty library). Right after the onboarding paywall the same offer won.' },
  ],
  onboarding: [
    { id: 'goals', t: 'Ask goals, tailor what follows', r: { trials: [8.5, 25], conv: [8, 17], arpu: [13, 35] }, fits: () => true, what: '2–4 questions; the plan, the next screens and the paywall headline use the answers.', trap: 'Questions that change nothing feel like a survey and add drop-off.' },
    { id: 'core', t: 'Try the core action first', r: { trials: [25, 25], arpu: [78, 78] }, fits: () => true, what: 'One lesson, one result on their own input, then the paywall.', trap: 'In AI apps each free result costs money; pair it with a short trial.' },
    { id: 'outcomes', t: 'Outcomes, not features', r: { trials: [10, 10], arpu: [13, 20] }, fits: () => true, what: 'Each screen says what changes for the user, not what the app has.', trap: 'Wording-only edits are small; change what the screens show.' },
    { id: 'proof', t: 'Social proof before the ask', r: { conv: [30, 30], trials: [10, 10] }, fits: () => true, what: 'Reviews or results from people like them, a screen or two before the paywall.', trap: 'The biggest lift came bundled with other changes. Expect less from proof alone.' },
    { id: 'timeline', t: 'Trial timeline and reminder promise', r: { trials: [23, 23] }, fits: (c) => c.onbTrial, what: 'On the paywall: today, reminder before the charge, first charge.', trap: 'Only works if the reminder really comes. Ship the reminder too.' },
    { id: 'quickstart', t: 'One-tap trial start', r: { trials: [25, 25] }, fits: (c) => c.onbTrial, what: 'The trial starts from one clear button, plan picked for them.', trap: 'More trial starts, but trial-to-paid stayed flat. Judge by paid.' },
    { id: 'echo', t: 'Paywall echoes their answers', r: { conv: [10, 50] }, fits: () => true, what: 'The paywall headline and benefits repeat the goal they picked.', trap: 'The big numbers came bundled with price changes. Treat as directional.' },
    { id: 'split', t: 'A short pre-paywall before the price', r: { conv: [16, 27], arpu: [12, 36] }, fits: () => true, what: 'One screen with the value, then the plans on the next.', trap: 'An extra step loses people if it repeats what they just saw.' },
    { id: 'reminder', t: 'Set a reminder inside onboarding', r: { arpu: [24, 24] }, fits: () => true, what: 'Ask when they want to practise and set it up before the paywall.', trap: 'One anonymised test behind this. Small, but cheap.' },
    { id: 'loader', t: 'Drop an empty loader', r: { arpu: [30, 30] }, fits: () => true, what: 'Drop the “building your plan” wait unless a real personal plan follows.', trap: 'A loader followed by a personal plan lost ARPU by half in another app.' },
    { id: 'promise', t: 'Value promise on the first screen', r: { conv: [30, 30] }, fits: () => true, what: 'Screen one says what they will get, in their words, before any question.', trap: 'One test, bundled with shorter copy and testimonials. Expect less on its own.' },
    { id: 'signup', t: 'Ask to sign up later', r: { conv: [8, 8], arpu: [17, 17] }, fits: () => true, what: 'Move account creation after the first value, or make it skippable.', trap: 'Cut sign-up friction, not the whole flow: shortening everything lost.' },
    { id: 'plan', t: 'Show a plan built from their answers', r: { conv: [10, 17], trials: [8.5, 8.5] }, fits: () => true, what: 'A screen that repeats their goal and shows the plan made for it, before the paywall.', trap: 'A plan screen after a fake loader lost revenue by half in another app. It has to use the answers.' },
    { id: 'depth', t: 'A fuller onboarding instead of none', r: { conv: [40, 40], arpu: [20, 20] }, fits: () => true, what: 'If people land straight on the paywall or the app, add a few screens that set up the value.', trap: 'From one anonymised app. Every added step has to earn its place; cutting onboarding down lost about 13% in the same app.' },
    // Lost in published tests: shown only under “Show all”, at the bottom
    { id: 'shorter', lost: true, t: 'Shorter onboarding', r: { conv: [-13, -13], arpu: [-13, -13] }, about: true, fits: () => true, what: 'Fewer screens, same content: cutting the flow to reduce friction.', trap: 'Cutting onboarding down lost about 13% of conversion and revenue per user (#14; Adapty library). Cut only steps whose answers are never used; that has no published range.' },
    { id: 'loaderPlan', lost: true, t: 'A loader, then a plan that ignores the answers', r: { arpu: [-50, -50] }, about: true, fits: () => true, what: 'A “building your plan” wait followed by a plan screen that looks the same whatever people answered.', trap: 'Lost about half of revenue per user in one flow (Adapty library). A plan that really changes with the answers is a different idea: “Show a plan built from their answers”.' },
  ],
};
// the metric each decision reads, so ideas measured on it rank first
export const DECIDE_METRIC = { money: 'arpu', paid: 'conv', trials: 'trials' };
export const IDEAS_SRC = {
  paywall: 'Ranges from Adapty’s A/B test library. Other apps’ results, not a forecast for yours.',
  onboarding: 'Ranges from published tests (onboarding-teardown library). Other apps’ results, not a forecast for yours.',
};

export const CHIPS = {
  views: [[10000, '10k', 'small app'], [50000, '50k', 'mid'], [250000, '250k', 'large']],
  users: [[5000, '5k', 'small app'], [20000, '20k', 'mid'], [100000, '100k', 'large']],
  conv: [[2.75, '2.75%', 'US median'], [1.38, '1.38%', 'Europe median']],                 // Adapty, State of Paywalls 2026
  trialRate: [[5.8, '5.8%', 'all apps'], [6.9, '6.9%', 'Health & Fitness'], [6.5, '6.5%', 'Education'], [5.2, '5.2%', 'Photo & Video']],   // RevenueCat SOSA 2026, install → trial
};

export const TRIALS = [[0, 'People pay right away'], [3, 'Common for weekly plans'], [7, 'Common for annual plans'], [14, 'Rare, long wait for results']];

export const SKILL_URL = 'https://github.com/theoutlines/growth-skills';
