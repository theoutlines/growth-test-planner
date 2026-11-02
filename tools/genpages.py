import os, json
import pathlib
ROOT = str(pathlib.Path(__file__).resolve().parent.parent)
SITE = 'https://planner.theoutlines.xyz'
PAGES = [
 ('paywall-ab-test-duration', 'How long should a paywall A/B test run?'),
 ('free-trial-ab-test', 'A/B testing a paywall with a free trial: when can you decide?'),
 ('minimum-detectable-effect', 'Minimum detectable effect for subscription app A/B tests'),
 ('onboarding-ab-test', 'Onboarding A/B test: decide on trial starts or paid conversion?'),
]

def table(head, rows):
    h = ''.join(f'<th>{x}</th>' for x in head)
    b = ''.join('<tr>' + ''.join(f'<td>{x}</td>' for x in r) + '</tr>' for r in rows)
    return f'<div class="tbl"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'

def pct(s): return ['+' + x.strip() + '%' for x in s.split('/')]

PAY_MONEY = {'10,000': '28.9 / 20.5 / 16.7 / 14.5', '25,000': '18.3 / 12.9 / 10.6 / 9.1', '50,000': '12.9 / 9.1 / 7.5 / 6.5', '100,000': '9.1 / 6.5 / 5.3 / 4.6', '250,000': '5.8 / 4.1 / 3.3 / 2.9'}
PAY_PAID = {'10,000': '23.6 / 16.7 / 13.6 / 11.8', '25,000': '14.9 / 10.5 / 8.6 / 7.5', '50,000': '10.5 / 7.5 / 6.1 / 5.3', '100,000': '7.5 / 5.3 / 4.3 / 3.7', '250,000': '4.7 / 3.3 / 2.7 / 2.4'}
ONB_TR = {'5,000': '22.6 / 16.0 / 13.0 / 11.3', '10,000': '16.0 / 11.3 / 9.2 / 8.0', '20,000': '11.3 / 8.0 / 6.5 / 5.6', '50,000': '7.1 / 5.0 / 4.1 / 3.6', '100,000': '5.0 / 3.6 / 2.9 / 2.5'}
ONB_PAID = {'5,000': '39.2 / 27.7 / 22.6 / 19.6', '10,000': '27.7 / 19.6 / 16.0 / 13.9', '20,000': '19.6 / 13.9 / 11.3 / 9.8', '50,000': '12.4 / 8.8 / 7.2 / 6.2', '100,000': '8.8 / 6.2 / 5.1 / 4.4'}
WK = ['2 wk', '4 wk', '6 wk', '8 wk']

def t(label, d): return table([label] + WK, [[k] + pct(v) for k, v in d.items()])

PLAN_PW = '/#/test?a=paywall'
PLAN_ONB = '/#/test?a=onboarding'

BODY = {
'paywall-ab-test-duration': f'''
<p class="lead">Long enough for the change you expect to be bigger than the noise, in whole weeks, plus the longest free trial and about a week for refunds before you decide. For most subscription apps that is 4 to 8 weeks of traffic, and the smaller your traffic, the bolder the change has to be.</p>
<h2>What a test can catch, by traffic and weeks</h2>
<p>The smallest change in revenue per paywall view an A/B test can tell apart from chance (95% confidence, 80% power), for a paywall where 2.75% of views end in a payment and buyers split half and half between weekly $6.99 and annual $39.99:</p>
{t('Views a week', PAY_MONEY)}
<p class="note">Judged on paid conversion instead, the same paywall catches a little less: 50,000 views a week catch +7.5% in 4 weeks (+9.1% on revenue per view). Your own numbers change these figures; the planner works them out for your traffic, conversion, prices and trial.</p>
<h2>How to pick the length</h2>
<ul>
<li><b>Start from what you expect the change to do.</b> A headline or button tweak rarely moves revenue by more than a few percent. Making the annual plan the hero has moved revenue per user by +25% to +40% in Adapty's A/B test library. If your test only catches +9%, test the bolder change.</li>
<li><b>Run whole weeks.</b> Weekdays and weekends convert differently; a test that stops mid-week reads that as an effect.</li>
<li><b>Add the trial and the refunds.</b> People who start a trial on the last day pay only when it ends, and refunds arrive in the days after. With a 3-day trial, decide 3 + 7 days after the traffic stops.</li>
<li><b>Don't stop early on a good day.</b> Peeking and stopping the moment B looks ahead turns noise into wins. Pick the length first, then wait.</li>
</ul>
<h2>Judge on revenue or on conversion?</h2>
<p>Prices, plans or trial changes: revenue per paywall view, because conversion can fall while revenue rises. Copy and layout changes: paid conversion answers faster.</p>
<a class="cta" href="{PLAN_PW}">Plan your paywall test</a>
''',
'free-trial-ab-test': f'''
<p class="lead">Not when the traffic stops. Wait for the longest free trial among the plans people buy to end, then about a week for refunds. Until then, a trial start isn't a payment and the test can't tell you which version earns more.</p>
<h2>When the decision day falls</h2>
<p>A 4-week paywall test that starts on Monday, November 9:</p>
{table(['Free trial', 'Traffic ends', 'Decide on'], [['None', 'Dec 6', 'Mon, Dec 14'], ['3 days', 'Dec 6', 'Thu, Dec 17'], ['7 days', 'Dec 6', 'Mon, Dec 21'], ['14 days', 'Dec 6', 'Mon, Dec 28']])}
<p class="note">The week after the last trials bill is for refunds: a version that wins on first payments can still lose once refunds land.</p>
<h2>Why waiting matters</h2>
<ul>
<li><b>Trials aren't payments.</b> A version can win trial starts by making the price harder to see and then lose on paid. Read the result on paid conversion or revenue per view.</li>
<li><b>The last trials bill late.</b> Someone who starts a 7-day trial on the last day of the test pays a week later.</li>
<li><b>Refunds come after.</b> Watch refunds as a guardrail: if B's refund share is clearly higher, its win may not hold.</li>
<li><b>Testing the trial itself?</b> Adding a trial, changing its length or putting it on the annual plan changes who pays and when; judge it on revenue per paywall view after the longest trial has billed.</li>
</ul>
<a class="cta" href="{PLAN_PW}">Find your decision day</a>
''',
'minimum-detectable-effect': f'''
<p class="lead">The minimum detectable effect (MDE) is the smallest change your A/B test can tell apart from chance. It shrinks as traffic and weeks grow. If the change you're testing is likely smaller than your MDE, the test will most likely end "can't tell", however good the idea.</p>
<h2>Typical MDEs for subscription apps</h2>
<p>Paywall, judged on revenue per paywall view (2.75% of views pay, weekly $6.99 and annual $39.99 half and half), at 95% confidence and 80% power:</p>
{t('Views a week', PAY_MONEY)}
<p>Onboarding, judged on trial starts (5.8% of new users start a trial):</p>
{t('Users a week', ONB_TR)}
<h2>How it's worked out</h2>
<p>Per-version sample size n = 2·(z₁₋α/₂ + z₁₋β)²·CV² / MDE², solved for the MDE a given number of people can see. For conversion CV² = (1 − p)/p; for revenue per view it also counts the spread of prices people buy. Three versions use a Bonferroni correction. The planner shows the MDE for 2, 4, 6 and 8 weeks next to published test ideas, so you can see which ones your test is big enough to catch.</p>
<h2>What to do when your MDE is high</h2>
<ul>
<li>Test a bolder change: change what the screen shows or the offer, not just the words.</li>
<li>Run longer, in whole weeks.</li>
<li>Put more traffic into the test, or test two versions instead of three.</li>
<li>Decide on a metric that answers faster (paid conversion or trial starts) when the change doesn't touch prices.</li>
</ul>
<a class="cta" href="{PLAN_PW}">Work out your MDE</a>
''',
'onboarding-ab-test': f'''
<p class="lead">Trial starts answer in weeks; paid conversion is what you care about but waits for the trial to end and needs more traffic. Decide on trial starts when the change is about getting people to the offer, and on paid when it could change who pays.</p>
<h2>What an onboarding test can catch</h2>
<p>On trial starts, when 5.8% of new users start a trial:</p>
{t('Users a week', ONB_TR)}
<p>On paid conversion, estimated from the same trial rate (install to paid taken as 2.0% for 5.8% trial starts, the RevenueCat State of Subscription Apps 2026 medians):</p>
{t('Users a week', ONB_PAID)}
<p class="note">Paid needs about three times as many people for the same change, and the decision waits for the trial to end plus a week for refunds.</p>
<h2>Which to choose</h2>
<ul>
<li><b>Trial starts:</b> copy, questions, screen order, a value screen before the paywall, sign-up moved later. Watch paid conversion as a guardrail: more trials of people who never pay isn't a win.</li>
<li><b>Paid conversion:</b> anything that could change who starts a trial or what they buy: the paywall offer, the trial itself, a plan built from answers that leads to a different plan.</li>
<li><b>Cutting screens:</b> published tests where onboarding was cut down lost about 13% of conversion; condensing long reading screens into a short carousel won once. Cut steps whose answers are never used, not the ones that set up the value.</li>
</ul>
<a class="cta" href="{PLAN_ONB}">Plan your onboarding test</a>
''',
}

DESC = {
'paywall-ab-test-duration': 'How long to run a paywall A/B test in a subscription app: what a test can catch by weekly traffic and weeks, plus the free trial and refunds before you decide.',
'free-trial-ab-test': 'When to decide a paywall A/B test with a free trial: wait for the longest trial to bill and a week for refunds. Decision days for 3, 7 and 14-day trials.',
'minimum-detectable-effect': 'Minimum detectable effect for subscription app A/B tests: typical MDEs for paywall and onboarding tests by traffic and weeks, how it is worked out, and what to do when it is high.',
'onboarding-ab-test': 'Should an onboarding A/B test decide on trial starts or paid conversion? What each can catch by traffic, and which to choose for which change.',
}

def page(slug, h1):
    more = ''.join(f'<a href="/{s}/">{t}</a>' for s, t in PAGES if s != slug)
    ld = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": h1, "description": DESC[slug], "url": f"{SITE}/{slug}/",
                     "author": {"@type": "Person", "name": "Ivan Polushin", "url": "https://github.com/theoutlines"}, "publisher": {"@type": "Person", "name": "Ivan Polushin"},
                     "datePublished": "2026-11-01", "image": f"{SITE}/assets/og.png"}, ensure_ascii=False)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{h1} | Growth Test Planner</title>
<meta name="description" content="{DESC[slug]}">
<link rel="canonical" href="{SITE}/{slug}/">
<meta name="theme-color" content="#151515">
<meta property="og:title" content="{h1}">
<meta property="og:description" content="{DESC[slug]}">
<meta property="og:url" content="{SITE}/{slug}/">
<meta property="og:type" content="article">
<meta property="og:image" content="{SITE}/assets/og.png?v=3">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/UncutSans-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/page.css">
<script type="application/ld+json">{ld}</script>
</head>
<body>
<div class="wrap">
<a class="brand" href="/"><i></i>Growth Test Planner</a>
<article>
<h1>{h1}</h1>
{BODY[slug]}
</article>
<h2>More answers</h2>
<div class="more">{more}</div>
<footer><span>© 2026 Ivan Polushin</span><a href="/">Growth Test Planner</a><a href="https://github.com/theoutlines/growth-test-planner">Source</a><a href="https://github.com/theoutlines/growth-skills">Growth Skills for Claude</a></footer>
</div>
</body>
</html>
'''

for slug, h1 in PAGES:
    os.makedirs(f'{ROOT}/{slug}', exist_ok=True)
    open(f'{ROOT}/{slug}/index.html', 'w').write(page(slug, h1))
print('ok')
