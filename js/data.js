// Content written once from public sources. Lifts are ranges seen in published tests, not forecasts.
// Paywall: Adapty A/B test library and State of In-App Subscriptions 2026.
// Onboarding: the onboarding-teardown evidence library (theoutlines/growth-skills), test numbers in brackets.

// Idea pool. Each idea keeps the ranges published tests measured, per metric (never merged), and when it applies.
// split: { metric: { note, to } } when one test behind the range reported a different figure for a market or platform (the range keeps the lower one; growth-skills evidence `split`)
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
    { id: 'timeline', t: 'Trial timeline and reminder promise', r: { trials: [13.6, 23] }, fits: (c) => c.onbTrial, what: 'On the paywall: today, reminder before the charge, first charge.', trap: 'Only works if the reminder really comes. Ship the reminder too.' },
    { id: 'quickstart', t: 'One-tap trial start', r: { trials: [25, 25] }, fits: (c) => c.onbTrial, what: 'The trial starts from one clear button, plan picked for them.', trap: 'More trial starts, but trial-to-paid stayed flat. Judge by paid.' },
    { id: 'echo', t: 'Paywall echoes their answers', r: { conv: [10, 50], arpu: [13, 13] }, weak: { arpu: true }, fits: () => true, what: 'The paywall headline and benefits repeat the goal they picked.', trap: 'The big numbers came bundled with price changes. Treat as directional.' },
    { id: 'split', t: 'A short pre-paywall before the price', r: { conv: [16, 27], arpu: [12, 36], trials: [60, 60] }, weak: { trials: true }, fits: () => true, what: 'One screen with the value, then the plans on the next.', trap: 'An extra step loses people if it repeats what they just saw.' },
    { id: 'reminder', t: 'Set a reminder inside onboarding', r: { arpu: [24, 24] }, fits: () => true, what: 'Ask when they want to practise and set it up before the paywall.', trap: 'One anonymised test behind this. Small, but cheap.' },
    { id: 'loader', t: 'Drop an empty loader', r: { arpu: [30, 30] }, fits: () => true, what: 'Drop the “building your plan” wait unless a real personal plan follows.', trap: 'A loader followed by a personal plan lost ARPU by half in another app.' },
    { id: 'promise', t: 'Value promise on the first screen', r: { conv: [30, 30] }, fits: () => true, what: 'Screen one says what they will get, in their words, before any question.', trap: 'One test, bundled with shorter copy and testimonials. Expect less on its own.' },
    { id: 'signup', t: 'Ask to sign up later', r: { conv: [8, 8], arpu: [17, 17], trials: [37, 37] }, weak: { trials: true }, fits: () => true, what: 'Move account creation after the first value, or make it skippable.', trap: 'Cut sign-up friction, not the whole flow: shortening everything lost.' },
    { id: 'plan', t: 'Show a plan built from their answers', r: { conv: [10, 17], trials: [8.5, 8.5] }, split: { conv: { note: 'US +27% in one test', to: 27 } }, fits: () => true, what: 'A screen that repeats their goal and shows the plan made for it, before the paywall.', trap: 'A plan screen after a fake loader lost revenue by half in another app. It has to use the answers.' },
    { id: 'depth', t: 'A fuller onboarding instead of none', r: { conv: [40, 40], arpu: [20, 20] }, split: { conv: { note: 'iOS only' } }, fits: () => true, what: 'If people land straight on the paywall or the app, add a few screens that set up the value.', trap: 'From one anonymised app. Every added step has to earn its place; cutting onboarding down lost about 13% in the same app.' },
    // Lost in published tests: shown only under “Show all”, at the bottom
    { id: 'shorter', lost: true, t: 'Shorter onboarding', r: { conv: [-13, -13], arpu: [-13, -13] }, about: true, fits: () => true, what: 'Fewer screens: cutting the steps that ask, show a result or set something up.', trap: 'Cutting those steps lost about 13% of conversion and revenue per user (#14; Adapty library). Condensing long reading screens into a short carousel is different: it won in one test (TomTom, paid +8%).' },
    { id: 'loaderPlan', lost: true, t: 'A loader, then a plan that ignores the answers', r: { arpu: [-50, -50] }, about: true, fits: () => true, what: 'A “building your plan” wait followed by a plan screen that looks the same whatever people answered.', trap: 'Lost about half of revenue per user in one flow (Adapty library). A plan that really changes with the answers is a different idea: “Show a plan built from their answers”.' },
  ],
};
// the metric each decision reads, so ideas measured on it rank first
export const DECIDE_METRIC = { money: 'arpu', paid: 'conv', trials: 'trials' };
export const IDEAS_SRC = {
  paywall: 'Ranges from Adapty’s A/B library. Not a forecast for your test.',
  onboarding: 'From other apps’ published tests, the lower figure where a test split by market. Results with no control group sit lower. Not a forecast for your test.',
};

export const CHIPS = {
  views30: [[40000, '40k', 'small app'], [200000, '200k', 'mid'], [1000000, '1M', 'large']],
  users30: [[20000, '20k', 'small app'], [90000, '90k', 'mid'], [400000, '400k', 'large']],
  views: [[10000, '10k', 'small app'], [50000, '50k', 'mid'], [250000, '250k', 'large']],
  users: [[5000, '5k', 'small app'], [20000, '20k', 'mid'], [100000, '100k', 'large']],
  conv: [[2.75, '2.75%', 'US'], [1.38, '1.38%', 'Europe']],                 // Adapty, State of Paywalls 2026
  trialView: [[6.94, '6.94%', 'US'], [4.62, '4.62%', 'Europe']],
  paidRate: [[2.0, '2.0%', 'all apps']],   // RevenueCat SOSA 2026, install → paid           // Adapty, State of Paywalls 2026, view → trial start
  trialRate: [[5.8, '5.8%', 'all apps'], [6.9, '6.9%', 'Health & Fitness'], [6.5, '6.5%', 'Education'], [5.2, '5.2%', 'Photo & Video']],   // RevenueCat SOSA 2026, install → trial
};

export const TRIALS = [[0, 'People pay right away'], [3, 'Common for weekly plans'], [7, 'Common for annual plans'], [14, 'Rare, long wait for results']];

export const SKILL_URL = 'https://github.com/theoutlines/growth-skills';

// Single published tests behind each idea (evidence base: theoutlines/growth-skills evidence/tests.csv, IDs in brackets in the comments).
// [app, number as published, what changed, link]. Shown in the idea card under the range; never merged into it.
const RC_MOJO = 'https://www.revenuecat.com/blog/growth/mojo-60-percent-arpu-growth-five-months/', ADAPTY_ONB = 'https://adapty.io/blog/how-to-fix-your-onboarding-flow/';
export const TESTS = {
  paywall: {
    annual: [['Mojo', 'Revenue per paywall view: US +8%, Mexico +26%, Brazil +45%', 'Annual price shown as a monthly price.', RC_MOJO, '2023-10'], // #43
      ['Rash ID', 'ARPU about +20%', 'Weekly plan added, annual flagged as the best choice. Several changes at once.', 'https://superwall.com/case-studies/rash-id', '2026-01'], // #80
      ['Preu AI', 'Proceeds per user +80%', 'An annual plan added next to a monthly-only paywall. Offer change.', 'https://superwall.com/case-studies/preu-ai', '2026-02'], // #79
      ['Mojo', 'Annual share +15 to +20 points, cancellations slightly up', 'Only yearly shown, monthly behind “View all plans”.', RC_MOJO, '2023-10'], // #42
      ['Stardust', 'Conversion +50%, proceeds per user +62.5%', 'Discount shown on the yearly plan, weekly price shown per week.', 'https://superwall.com/blog/how-stardust-increased-ios-app-revenue-by-4x-in-six-weeks', '2024-09'], // #94
      ['Glam AI', 'Conversion 3.14% → 3.77%', 'Year moved to the top with “Most Popular”, the pricier plan below.', 'https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/', '2026-09'], // #105
      ['Glam AI', 'Yearly 0.43% → 0.55%, revenue per user $0.261 → $0.292', 'A pricier “Business” year added as an anchor. Offer change.', 'https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/', '2026-09'], // #104
      ['TomTom', 'ARPU +56.8% (truck-plan users)', 'A discounted yearly plan offered next to the free trial. Offer change.', 'https://www.purchasely.com/case-studies/increasing-mrr-85-percent-against-free-competitors', '']], // #142
    explain: [['Blinkist', 'Trial sign-ups +23%, complaints −55%', 'Day-by-day trial timeline on the paywall, reminder opt-in after it.', 'https://uxplanet.org/how-solving-our-biggest-customer-complaint-at-blinkist-led-to-a-23-increase-in-conversion-b60ad514134b', '2021-01'], // #1
      ['Pepper', 'LTV +50%', 'Two-step paywall with the trial as a timeline. Staged rollout, no control group.', 'https://superwall.com/case-studies/pepper', '2026-02'], // #78
      ['Stardust', 'Trial starts +13.6%, trial to paid unchanged', 'Trial timeline design on the paywall.', 'https://superwall.com/blog/how-stardust-increased-ios-app-revenue-by-4x-in-six-weeks', '2024-09'], // #97
      ['Pregnancy+', 'Revenue +27%', 'A visual timeline: today, day 3, the charge day.', 'https://adapty.io/case-studies/pregnancy-plus/', '2026-04']], // #116
    annualTrial: [['Moonly', 'View to subscription +39%, revenue per 100 installs +47%', 'Free trial added to the annual plan only.', 'https://adapty.io/case-studies/moonly/', '2024-05']], // #41
    compare: [['Symmetry', 'Conversion “+1%”, paid activation +5%', 'Feature list turned into a Free vs Pro table. The page doesn’t say if +1% is relative.', 'https://superwall.com/case-studies/symmetry', '2025-12'], // #81
      ['Unnamed app', 'The simple page won by 111%', 'A comparison-chart paywall replaced with one simple page. Comparison lost. Several changes at once.', 'https://superwall.com/blog/the-paywall-tactics-behind-usd100k-month-apps', '2026-02']], // #100
    proof: [['Runtastic', 'Paid subscriptions +44%', 'A promo line replaced with a real 5-star review.', 'https://abtest.design/tests/user-reviews-on-paywall', '2017-05'], // #60
      ['Glam AI', '2.54% vs 2.43%, called noise', 'A social-proof video on the plan picker. No change.', 'https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/', '2026-09']], // #106
    visuals: [['Unchaind', 'Conversion over +50%, estimated ARPU +64%', 'Text paywall turned into a visual app preview.', 'https://superwall.com/case-studies/unchaind', '2025-12'], // #82
      ['Neos Kosmos', 'Conversion +13%', 'A different paywall image. News, on the web.', 'https://abtest.design/tests/paywall-visuals', ''], // #68
      ['Stardust', 'Conversion +67%, proceeds per user +12.5%', 'A video background instead of a text-heavy design.', 'https://superwall.com/blog/how-stardust-increased-ios-app-revenue-by-4x-in-six-weeks', '2024-09'], // #96
      ['Glam AI', 'View to payment 1% → 1.25%, revenue per user lower', 'A video hero instead of static images. Control kept.', 'https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/', '2026-09'], // #103
      ['CoinStats', 'Conversion 2.9x', 'An animated, playful paywall reveal.', 'https://www.revenuecat.com/blog/growth/weird-paywalls-drive-subscription-growth', '2025-08']], // #153
    cta: [['Going', 'Trial starts +104% month over month', '“Trial for free” instead of “Sign up for free”. On the web.', 'https://abtest.design/tests/trial-for-free-cta', ''], // #67
      ['Unnamed app', 'Registration to trial 3% → 27%', '“Subscribe” → “Start your 7-day free trial”. Method not stated.', 'https://adapty.io/blog/how-to-build-app-onboarding-flows-that-convert/', '2025-11'], // #132
      ['Going Merry', '1.14% vs 0.78%', '“Continue” → “Start for $0.00”. Several changes at once.', 'https://adapty.io/case-studies/going-merry/', '2025-09']], // #121
    lifetime: [['Dark Noise', 'Total initial conversions about +10%; lifetime +266%, annual −30%', 'All three plans shown by default, lifetime included.', 'https://www.revenuecat.com/blog/engineering/how-i-successfully-migrated-my-indie-app-to-revenuecat-paywalls/', '2024-01']], // U22
    price: [['BuyBye', 'Conversions −19%, proceeds per user +25%', 'Yearly price raised 50%.', 'https://superwall.com/case-studies/buybye', '2026-04'], // #85
      ['SellRaze', 'ARPU +10%', 'Annual price lowered from $59.99 to $44.99. A cut won here.', 'https://superwall.com/case-studies/sellraze', '2025-12'], // #84
      ['Travel app (unnamed)', 'Conversion −5%', 'Price raised 30%.', 'https://adapty.io/case-studies/travel-app/', ''], // #59
      ['PropGPT', 'Proceeds per user +47.5%, conversion slightly down', 'Weekly $6.99 → $9.99.', 'https://superwall.com/case-studies/propgpt', '2026-01'], // #91
      ['Planner 5D', 'ARPU +83% (highest tier)', 'Three price tiers on the same paywall; prices not given.', 'https://superwall.com/case-studies/planner-5d', '2026-01'], // #90
      ['Glam AI', 'Conversion 2.55% → 2.09%, ARPU flat', 'Year $59.99 → $79.99, week $8.99 → $11.99 for $800+ iPhone owners. Lost.', 'https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/', '2026-09'], // #107
      ['AppDevLabs', 'Won, conversion flat', 'Annual $9.99 → $14.99.', 'https://adapty.io/case-studies/appdevlabs/', '2026-03']], // #117
    second: [['Rizz God', 'Onboarding conversion +10%, trial conversion +10%', 'A second paywall at the end of onboarding. Several changes at once.', 'https://superwall.com/case-studies/rizz-god', '2026-01']], // #21
    copy: [['Neos Kosmos', 'Conversion +16%', '“Support our work” copy instead of a benefits list. News, on the web.', 'https://abtest.design/tests/benefits-driven-vs-emotional-appeal-messaging', ''], // #69
      ['Unnamed (conference talk)', 'Conversion +54% or more', 'Paywall copy from features to outcomes. No method given.', 'https://growthgems.substack.com/p/growth-gems-127-onboarding-activation', '2025-07']], // #58
  },
  onboarding: {
    goals: [['Education app (unnamed)', 'Trial starts +25%, ARPU +78%', 'Survey plus a trial lesson, against either alone. Several changes at once.', ADAPTY_ONB, '2025-11'], // #12
      ['Productivity app (unnamed)', 'Trial starts +8.5%, paid +17%, ARPU +22%', 'Goal questions and a loading screen instead of feature demos; US: paid +27%. Several changes at once.', ADAPTY_ONB, '2025-11'], // #13
      ['Headspace', 'Free-trial conversion about +10%', 'The intent question became multi-select. From an interview, no method.', 'https://www.insidergrowthhq.com/p/3-case-studies-from-headspace-on', '2024-06'], // #4
      ['Headspace', 'Course starts +7.6 points', 'A quiz before the same course. Active days didn’t change.', 'https://irrationallabs.com/case-studies/headspace-doubled-course-starts/', '']], // #3
    core: [['Education app (unnamed)', 'Trial starts +25%, ARPU +78%', 'A trial lesson plus a survey before the paywall. Several changes at once.', ADAPTY_ONB, '2025-11'], // #12
      ['Duolingo', 'Daily active users about +20%', 'Sign-up moved after a first lesson. A sign-up wall, not a paywall.', 'https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker', '2017-07'], // #5
      ['Fender Play', 'Engagement +4% at every step', '“Play a song” moved to the first screen.', 'https://amplitude.com/blog/aha-moment-fender', '']], // #77
    outcomes: [['Five Minute Journal', 'ARPU +20%, trial starts about +10%', 'Onboarding rebuilt around jobs to be done. Several changes at once.', 'https://www.revenuecat.com/blog/growth/five-minute-journal-onboarding-redesign-arpu/', '2024-10'], // #2
      ['Productivity app (unnamed)', 'Trial conversion +17%, ARPU +13%', 'Outcome-focused screens instead of features.', ADAPTY_ONB, '2025-11']], // #11
    proof: [['Travel app (unnamed)', 'Conversion to purchase +30%', 'Shorter copy, value up front and testimonials. Several changes at once.', 'https://adapty.io/case-studies/travel-app/', ''], // #17
      ['Five Minute Journal', 'Trial starts about +10%, ARPU +20%', 'Testimonials moved earlier inside a rebuild. Several changes at once.', 'https://www.revenuecat.com/blog/growth/five-minute-journal-onboarding-redesign-arpu/', '2024-10']], // #2
    timeline: [['Blinkist', 'Trial sign-ups +23%, complaints −55%', 'Day-by-day trial timeline on the paywall, reminder opt-in after it.', 'https://uxplanet.org/how-solving-our-biggest-customer-complaint-at-blinkist-led-to-a-23-increase-in-conversion-b60ad514134b', '2021-01'], // #1
      ['Pepper', 'LTV +50%', 'Two-step paywall with the trial as a timeline. Staged rollout, no control group.', 'https://superwall.com/case-studies/pepper', '2026-02'], // #78
      ['Stardust', 'Trial starts +13.6%, trial to paid unchanged', 'Trial timeline design on the paywall.', 'https://superwall.com/blog/how-stardust-increased-ios-app-revenue-by-4x-in-six-weeks', '2024-09'], // #97
      ['Pregnancy+', 'Revenue +27%', 'A visual timeline: today, day 3, the charge day.', 'https://adapty.io/case-studies/pregnancy-plus/', '2026-04']], // #116
    quickstart: [['Slopes', 'Trial starts +25%, trial-to-paid about flat', 'One tap starts the trial and skips the plan screen.', 'https://blog.curtisherbert.com/slopes-diaries-42-building-ramps-not-walls/', '2022-04']], // #45
    echo: [['Grammarly', 'Upgrades “10%+”', 'Survey answers drive a personal plan. The number has no source.', 'https://growth.design/case-studies/grammarly-onboarding-survey', ''], // #27
      ['JourneyStamp', 'Conversion +50%', 'Paywalls specific to where people come from. Several changes at once.', 'https://superwall.com/case-studies/journeystamp', '2026-02'], // #23
      ['Flirt AI', 'Trial-to-paid +20%, MRR +83%', 'Each segment routed to its own paywall, prices changed too.', 'https://superwall.com/case-studies/flirt-ai', '2026-02'], // #22
      ['Dogo', 'Paywall conversion +9.5%, ARPU +13%', 'A paywall per user segment, each leading with its own value.', 'https://www.botsi.com/blog/personalize-paywall-messaging', '2026-02']], // #139
    split: [['Speak4Me', 'Conversion +27%, proceeds +36%', 'Features first, then the price, on separate steps.', 'https://superwall.com/case-studies/speak4me', ''], // #55
      ['Stompers', 'Conversion +16%', 'Benefits, then the trial reminder, then the price.', 'https://superwall.com/case-studies/stompers', '2026-01'], // #56
      ['ASL Bloom', 'Trial conversion +15%, ARPU +12%', 'A value screen and a trial timeline before the price. Several changes at once.', 'https://www.revenuecat.com/blog/growth/asl-bloom-applica-case-study/', '2025-05'], // #18
      ['Unnamed app', 'Trial opt-in 2%, 8%, 15%', 'Paywall after home, after welcome, or after a new 3-slide carousel (15%).', 'https://www.revenuecat.com/blog/growth/how-top-apps-approach-paywalls', '2025-06'], // #151
      ['Mimo', 'Trial opt-in +60%', 'Single-screen paywall → multi-screen paywall.', 'https://subclub.com/episode/how-to-build-more-successful-paywalls-sylvain-gauchet', '2025-03']], // #157
    reminder: [['Education app (unnamed)', 'ARPU +24%, trial conversion +6.4%', 'Reminder set-up inside onboarding instead of on the home screen.', ADAPTY_ONB, '2025-11']], // #16
    loader: [['Education app (unnamed)', 'ARPU +30%, trial conversion +22%', 'The loading screen removed.', ADAPTY_ONB, '2025-11']], // #15
    promise: [['Travel app (unnamed)', 'Conversion to purchase +30%', 'Shorter copy, value up front and testimonials. Several changes at once.', 'https://adapty.io/case-studies/travel-app/', '']], // #17
    signup: [['Duolingo', 'Daily active users about +20%', 'Sign-up moved after a first lesson. A sign-up wall, not a paywall.', 'https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker', '2017-07'], // #5
      ['Duolingo', 'Daily active users +8.2%', 'A quiet “Later” instead of “Discard my progress”.', 'https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker', '2017-07'], // #6
      ['Coconote', 'A 10% drop-off removed', 'Login moved from the start to after the paywall. Founder report.', 'https://www.revenuecat.com/blog/growth/brett-zack-coconote-sub-club-podcast-2026', '2026-03']], // #148
    plan: [['Grammarly', 'Upgrades “10%+”', 'Survey answers drive a personal plan. The number has no source.', 'https://growth.design/case-studies/grammarly-onboarding-survey', ''], // #27
      ['Productivity app (unnamed)', 'Trial starts +8.5%, paid +17%', 'Goal questions and a “customising” screen instead of demos. Several changes at once.', ADAPTY_ONB, '2025-11'], // #13
      ['Headspace', 'Course starts about 31% → 63%', 'A quiz and a course picked for the answers.', 'https://irrationallabs.com/case-studies/headspace-doubled-course-starts/', '']], // #3
    depth: [['Entertainment app (unnamed)', 'Payment conversion +40% (iOS), ARPU +20%', 'A long onboarding instead of none.', ADAPTY_ONB, '2025-11'], // #14
      ['Coconote', 'Trial starts +16%', 'Onboarding doubled to 15 screens, more personal. Founder report.', 'https://www.revenuecat.com/blog/growth/brett-zack-coconote-sub-club-podcast-2026', '2026-03'], // #147
      ['TomTom', 'The short one won: trial starts +2.5%, paid +8%', 'Long-form onboarding against a simple carousel. The long one lost.', 'https://www.purchasely.com/case-studies/increasing-mrr-85-percent-against-free-competitors', '']], // #140
    shorter: [['Entertainment app (unnamed)', 'Conversion −13%', 'The long onboarding shortened.', ADAPTY_ONB, '2025-11'], // #14
      ['TomTom', 'Trial starts +2.5%, paid +8%', 'A simple carousel beat long-form onboarding. Shorter won here.', 'https://www.purchasely.com/case-studies/increasing-mrr-85-percent-against-free-competitors', '']], // #140
  },
};
// How many single tests stand behind each onboarding range, per metric; 0 = a band from Adapty's library (many tests).
export const COUNT = {
  goals: { trials: 2, conv: 0, arpu: 0 }, core: { trials: 1, arpu: 1 }, outcomes: { trials: 1, arpu: 2 }, proof: { conv: 1, trials: 1 },
  timeline: { trials: 2 }, quickstart: { trials: 1 }, echo: { conv: 2, arpu: 1 }, split: { conv: 2, arpu: 2, trials: 1 }, reminder: { arpu: 1 }, loader: { arpu: 1 },
  promise: { conv: 1 }, signup: { conv: 0, arpu: 0, trials: 1 }, plan: { conv: 2, trials: 1 }, depth: { conv: 1, arpu: 1 }, shorter: { conv: 1, arpu: 1 }, loaderPlan: { arpu: 0 },
};
