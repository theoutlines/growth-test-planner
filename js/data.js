// Content written once from public sources. Lifts are ranges seen in published tests, not forecasts.
// Paywall: Adapty A/B test library and State of In-App Subscriptions 2026.
// Onboarding: the onboarding-teardown evidence library (theoutlines/growth-skills), test numbers in brackets.

export const IDEAS = {
  paywall: [
    { t: 'Explain the trial next to the price', lo: 12, hi: 36, metric: 'revenue per user', what: 'A 3-step timeline: today, reminder, first charge.', trap: 'Shown too early, it adds drop-off before the paywall.' },
    { t: 'Make annual the hero', lo: 25, hi: 40, metric: 'revenue per user', what: 'Annual preselected, trial on annual, weekly price shown per week.', trap: 'Conversion can drop while revenue rises. Judge by revenue.' },
    { t: 'Trial on annual only', lo: 15, hi: 30, metric: 'conversion', what: 'Trial badge and copy on the annual option only.', trap: 'Flips by platform. Read iOS and Android apart.' },
    { t: 'Richer visuals or motion', lo: 13, hi: 27, metric: 'conversion', what: 'Animated hero or product preview instead of a static image.', trap: 'Adds load time; slow devices may lose more than they gain.' },
    { t: 'Headline and copy tweaks', lo: 0, hi: 5, metric: 'LTV', what: 'New headline, button text, small reorders.', trap: 'Only a third of text and visual changes raised LTV at all. Fold them into a bigger change.' },
  ],
  onboarding: [
    { t: 'Ask goals, tailor what follows', lo: 8, hi: 17, metric: 'conversion', what: '2–4 questions; the plan, the next screens and the paywall headline use the answers.', trap: 'Questions that change nothing feel like a survey and add drop-off.' },
    { t: 'Try the core action first', lo: 25, hi: 25, metric: 'trial starts', what: 'One lesson, one result on their own input, then the paywall.', trap: 'In AI apps each free result costs money; pair it with a short trial.' },
    { t: 'Outcomes, not features', lo: 17, hi: 17, metric: 'trial conversion', what: 'Each screen says what changes for the user, not what the app has.', trap: 'Wording-only edits are small; change what the screens show.' },
    { t: 'Drop an empty loader', lo: 22, hi: 22, metric: 'trial conversion', what: 'Drop the “building your plan” wait unless a real personal plan follows.', trap: 'A loader followed by a personal plan lost ARPU by half in another app.' },
    { t: 'Shorter onboarding', lo: 0, hi: 0, metric: 'trial conversion', what: 'Fewer screens, same content.', trap: 'Cutting onboarding to make it shorter lost about 13% in one app (#14).' },
  ],
};
export const IDEAS_SRC = {
  paywall: 'Typical lift in Adapty’s A/B test library and State of In-App Subscriptions 2026. Other apps’ results, not a forecast for yours.',
  onboarding: 'Typical lift in published tests (onboarding-teardown library). Other apps’ results, not a forecast for yours.',
};

export const CHIPS = {
  views: [[10000, '10k', 'small app'], [50000, '50k', 'mid'], [250000, '250k', 'large']],
  users: [[5000, '5k', 'small app'], [20000, '20k', 'mid'], [100000, '100k', 'large']],
  conv: [[2.75, '2.75%', 'US median'], [1.38, '1.38%', 'Europe median']],                 // Adapty, State of Paywalls 2026
  trialRate: [[5.8, '5.8%', 'all apps'], [6.9, '6.9%', 'Health & Fitness'], [6.5, '6.5%', 'Education']],   // RevenueCat SOSA 2026, install → trial
};

export const TRIALS = [[0, 'People pay right away'], [3, 'Common for weekly plans'], [7, 'Common for annual plans'], [14, 'Rare, long wait for results']];

export const SKILL_URL = 'https://github.com/theoutlines/growth-skills';
