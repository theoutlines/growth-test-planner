# Growth Test Planner

**Will your A/B test see your change?** A free planner for paywall and onboarding tests, for designers and anyone who isn't a statistician.

Live: https://planner.theoutlines.xyz

- **Plan a test.** Four questions (what you test, weekly traffic, conversion, free trial). You get the smallest change the test can catch for 2, 4, 6 or 8 weeks, the start and decision day (with time for the last trials to bill and refunds to show), people per version, and published test ideas big enough to show up.
- **Read a finished test.** Three numbers per version. Trust checks first (fair split, trials billed, refunds), then the result with its likely range, where the money came from, and what to do.
- **Share** the plan or the result as a message for your team chat, in three tones.

What you type stays on the page (the only thing sent is an anonymous daily count of which idea people pick for B): the numbers are computed in your browser, the last inputs are kept in this browser only, and a shared link carries them after `#`, which browsers never send to a server.

## How the numbers work

- Plan: per-version sample size `n = 2·(z₁₋α/₂ + z₁₋β)²·CV² / MDE²` at 95% confidence and 80% power, solved for the change a given number of people can see. Money per paywall view uses `CV² = (σ²/μ² + 1)/p − 1` from the price mix; conversion uses `(1 − p)/p`. Three versions use a Bonferroni-corrected α. “Prove it’s not worse” is a one-sided test with a 5% margin.
- Read: the same rules as the [`test-readout`](https://github.com/theoutlines/growth-skills) skill: chi-square sample-ratio check (p < 0.001), delta-method 95% range for money per person, log-ratio range for proportions, refunds as a two-proportion test, and a split of the change into how many paid vs which plans they chose.
- Benchmarks: Adapty State of Paywalls 2026 (paywall conversion), RevenueCat State of Subscription Apps 2026 (install → trial). Test ideas: Adapty A/B test library and State of In-App Subscriptions 2026; the onboarding-teardown evidence library. Ranges are what other apps saw, not a forecast for yours.

Want the read done from your analytics instead of typing? The [Growth Skills](https://github.com/theoutlines/growth-skills) Claude plugin pulls the test from Amplitude, Mixpanel, RevenueCat or Adapty.

## Run locally

Static site, no build step:

```
python3 -m http.server 8000
```

Deployed on Cloudflare Pages from `main`.

## Licence

Code: MIT. Fonts: Uncut Sans and Geist Mono, SIL Open Font License 1.1 (see `LICENSES/`). The character illustration and the author photo are © Ivan Polushin, not covered by the MIT licence.
