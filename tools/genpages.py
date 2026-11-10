import os, json
import pathlib
ROOT = str(pathlib.Path(__file__).resolve().parent.parent)
SITE = 'https://planner.theoutlines.xyz'
PAGES = [
 ('paywall-ab-test-duration', 'How long should a paywall A/B test run?'),
 ('free-trial-ab-test', 'A/B testing a paywall with a free trial: when can you decide?'),
 ('minimum-detectable-effect', 'Minimum detectable effect for subscription app A/B tests'),
 ('onboarding-ab-test', 'Onboarding A/B test: decide on trial starts or paid conversion?'),
 ('ab-test-split-90-10', 'A/B test split: 90/10, 80/20 or 50/50?'),
 ('abc-test', 'A/B/C test: how much longer than an A/B test?'),
 ('paywall-ab-test-sample-size', 'How many users do you need for a paywall A/B test?'),
 ('ab-tests-that-lost', 'Paywall and onboarding A/B tests that lost'),
 ('subscription-conversion-benchmarks', 'Why RevenueCat and Adapty conversion numbers don’t match'),
]

def table(head, rows):
    h = ''.join(f'<th>{x}</th>' for x in head)
    b = ''.join('<tr>' + ''.join(f'<td>{x}</td>' for x in r) + '</tr>' for r in rows)
    # Wide tables scroll sideways on a phone: the first column stays, a fade and a hint show there is more (page.js adds .has-more only when it overflows).
    return f'<div class="tblw"><div class="tblbox"><div class="tbl"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div></div><p class="swipe">Swipe the table to see every column</p></div>'

def plink(href, label, title='Your numbers are different', line='The planner works this out from your last 30 days.'):
    return f'<div class="plink"><b>{title}</b><p>{line}</p><a class="cta" href="{href}">{label}</a></div>'

def pct(s): return ['+' + x.strip() + '%' for x in s.split('/')]

PAY_MONEY = {'10,000': '28.9 / 20.5 / 16.7 / 14.5', '25,000': '18.3 / 12.9 / 10.6 / 9.1', '50,000': '12.9 / 9.1 / 7.5 / 6.5', '100,000': '9.1 / 6.5 / 5.3 / 4.6', '250,000': '5.8 / 4.1 / 3.3 / 2.9'}
PAY_PAID = {'10,000': '23.6 / 16.7 / 13.6 / 11.8', '25,000': '14.9 / 10.5 / 8.6 / 7.5', '50,000': '10.5 / 7.5 / 6.1 / 5.3', '100,000': '7.5 / 5.3 / 4.3 / 3.7', '250,000': '4.7 / 3.3 / 2.7 / 2.4'}
ONB_TR = {'5,000': '22.6 / 16.0 / 13.0 / 11.3', '10,000': '16.0 / 11.3 / 9.2 / 8.0', '20,000': '11.3 / 8.0 / 6.5 / 5.6', '50,000': '7.1 / 5.0 / 4.1 / 3.6', '100,000': '5.0 / 3.6 / 2.9 / 2.5'}
ONB_PAID = {'5,000': '39.2 / 27.7 / 22.6 / 19.6', '10,000': '27.7 / 19.6 / 16.0 / 13.9', '20,000': '19.6 / 13.9 / 11.3 / 9.8', '50,000': '12.4 / 8.8 / 7.2 / 6.2', '100,000': '8.8 / 6.2 / 5.1 / 4.4'}
WK = ['2 wk', '4 wk', '6 wk', '8 wk']

def k30(k):   # the planner asks for the last 30 days; the tables keep weekly rows and show the 30-day count next to them
    n = round(int(k.replace(',', '')) * 30 / 7, -3)
    return f'{k} <small>{n / 1e6:.2f}M in 30 days</small>'.replace('.00M', 'M') if n >= 1e6 else f'{k} <small>{int(n):,} in 30 days</small>'
def t(label, d): return table([label] + WK, [[k30(k)] + pct(v) for k, v in d.items()])

PLAN_PW = '/#/area?a=paywall'
PLAN_ONB = '/#/area?a=onboarding'

BODY = {
'ab-test-split-90-10': f'''
<p class="lead">An even split is the fastest way to an answer. Every step away from 50/50 costs people: 80/20 needs about 1.6 times as many people (or weeks) to catch the same change, and 90/10 almost 2.8 times. Use an uneven split when B could hurt revenue and you would rather wait longer than risk it.</p>
<h2>What each split catches</h2>
<p>A paywall with 50,000 people a week (about 214,000 in 30 days), 2.75% paying, weekly $6.99 and annual $39.99 sold half and half. The smallest change in revenue per viewer the test can catch (95% confidence, 80% power):</p>
{table(['Split', 'People needed', 'Catches in 4 wk', '8 wk'], [["50/50", "1×", "+9.1%", "+6.5%"], ["60/40", "1.04×", "+9.3%", "+6.6%"], ["70/30", "1.19×", "+10.0%", "+7.1%"], ["80/20", "1.56×", "+11.4%", "+8.1%"], ["90/10", "2.78×", "+15.2%", "+10.8%"]])}
<p class="note">“People needed” is how many people the test needs, against a 50/50 split, to catch the same change. It works out as (1/A share + 1/B share) / 4.</p>
<h2>When to split unevenly</h2>
<ol class="steps">
<li><b>B touches the price, the plans or the trial.</b> A bad price can cost real money for weeks. 80/20 limits the damage; plan the longer run up front.</li>
<li><b>B changes copy or layout.</b> Little risk. Split 50/50 and get the answer sooner.</li>
<li><b>You want to protect A but have little traffic.</b> 90/10 on a small paywall often can’t catch anything a design change will do. Test something bolder, or wait for more traffic.</li>
<li><b>Don’t change the split mid-test.</b> People who arrived under one split and people under another aren’t comparable; restart instead.</li>
</ol>
{plink(PLAN_PW, 'Plan your split')}
''',
'abc-test': f'''
<p class="lead">About 1.8 times as long for the same change. Each version gets a third of the traffic instead of half, and comparing B and C with A means two comparisons, so each one needs a slightly wider margin to stay at 95% confidence.</p>
<h2>What A/B and A/B/C catch</h2>
<p>The same paywall: 50,000 people a week (about 214,000 in 30 days), 2.75% paying, weekly $6.99 and annual $39.99 sold half and half. The smallest change each version must make to be caught:</p>
{table(['Test', 'Decide on', '4 wk', '8 wk'], [["A/B", "Revenue", "+9.1%", "+6.5%"], ["A/B/C", "Revenue", "+12.3%", "+8.7%"], ["A/B", "Paid", "+7.5%", "+5.3%"], ["A/B/C", "Paid", "+10.0%", "+7.1%"]])}
<p class="note">With three versions, each of B and C is compared with A, with the margin split between the two comparisons (Bonferroni). The planner reads A/B/C results the same way.</p>
<h2>When a third version is worth it</h2>
<ol class="steps">
<li><b>Both B and C are bold.</b> On the paywall above, each version has to move revenue by about +12% to show up in 4 weeks. Two small tweaks won’t.</li>
<li><b>You would ship either one.</b> If you only care about one of them, test that one against A and get the answer sooner.</li>
<li><b>Don’t compare B with C.</b> The test is sized for each one against A. If B and C both win, pick on the range, not on which number is higher.</li>
<li><b>Short on traffic?</b> Run A/B first, then test the next idea against the winner.</li>
</ol>
{plink(PLAN_PW, 'Plan an A/B/C test')}
''',
'paywall-ab-test-sample-size': f'''
<p class="lead">It depends on the change you want to catch more than on anything else. Halve the change and you need four times the people. For a typical paywall, catching +10% in paid conversion takes about 56,000 people in each version; catching +5% takes about 220,000.</p>
<h2>Paywall: people per version</h2>
<p>People who see the paywall, in each version, to catch a change in revenue per viewer, paid conversion or trial starts (95% confidence, 80% power, split 50/50):</p>
{table(['Change', 'Revenue', 'Paid', 'Trials'], [["+5%", "330,000", "220,000", "84,000"], ["+10%", "84,000", "56,000", "21,000"], ["+15%", "37,000", "25,000", "9,400"], ["+20%", "21,000", "14,000", "5,300"], ["+30%", "9,300", "6,200", "2,300"]])}
<p class="note">Assumes 2.75% of viewers pay and 6.94% start a trial (US medians per paywall view, <a href="https://adapty.io/state-of-paywalls/">Adapty State of Paywalls 2026</a>), with buyers split half and half between weekly $6.99 and annual $39.99. Revenue needs the most people because the price mix adds noise on top of who pays.</p>
<h2>Onboarding: new users per version</h2>
{table(['Change', 'Trials', 'Paid'], [["+5%", "100,000", "310,000"], ["+10%", "25,000", "77,000"], ["+15%", "11,000", "34,000"], ["+20%", "6,400", "19,000"], ["+30%", "2,800", "8,500"]])}
<p class="note">Assumes 5.8% of new users start a trial and 2.0% pay (medians from <a href="https://www.revenuecat.com/state-of-subscription-apps">RevenueCat State of Subscription Apps 2026</a>).</p>
<h2>When the number is out of reach</h2>
<ol class="steps">
<li><b>Test a bolder change.</b> A +20% change needs a sixteenth of the people a +5% change does. Copy tweaks rarely move revenue that much; plans, prices and the trial offer can.</li>
<li><b>Decide on trial starts first.</b> They need about 40% of the people that paid conversion does; check paid once the last trials bill.</li>
<li><b>Keep it to two versions and split 50/50.</b> A third version or an 80/20 split costs people you may not have.</li>
<li><b>Run longer, in whole weeks.</b> Divide the people you need by the people who see the paywall each week.</li>
</ol>
<p>Your own conversion, prices and trial change these numbers. The planner works them out from your last 30 days.</p>
{plink(PLAN_PW, 'Work out your sample size')}
''',
'ab-tests-that-lost': f'''
<p class="lead">Most teams publish their wins. These are published tests from subscription apps where B lost: higher prices, discounts, longer trials, more plans, a paywall you can’t close, one more onboarding step. Each one is a test somebody already paid for, so you don’t have to.</p>
<h2>Tests that lost, with what happened</h2>
<ul class="lost"><li><b>Raise both prices for owners of expensive iPhones ($59.99 → $79.99 a year, $8.99 → $11.99 a week).</b> Conversion 2.55% → 2.09%, revenue per user flat. <a href="https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/">Glam AI, Adapty</a></li><li><b>Raise the price by 30%.</b> Conversion −5%. <a href="https://adapty.io/case-studies/travel-app/">Travel app, Adapty</a></li><li><b>Intro offer: a year for $59 against the standing $79.</b> 0 yearly purchases out of 2,500 people. <a href="https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/">Glam AI, Adapty</a></li><li><b>50% coupon on the Business plan.</b> Placement revenue per user down 5×. <a href="https://web.archive.org/web/20260909143308/https://adapty.io/blog/glam-ai-paywall-tests/">Glam AI, Adapty</a></li><li><b>Extra phone number field before web payment.</b> About 30% fewer people reached payment. <a href="https://community.web2wave.com/t/what-tiny-onboarding-change-stopped-30-of-our-signups-after-moving-paywall-to-web/3488">web2wave forum</a></li><li><b>Add web checkout next to in-app purchase.</b> Paying conversion 7.8% → 7.4%. <a href="https://www.revenuecat.com/blog/growth/why-you-shouldnt-use-app-to-web">RevenueCat</a></li><li><b>Remove the close button so people must start a trial.</b> More trial starts, then more refunds than the gain. <a href="https://www.revenuecat.com/blog/growth/anada-lakra-boldvoice-sub-club-podcast-2026">BoldVoice, Sub Club</a></li><li><b>Trial 7 → 14 days.</b> Slightly more trials, fewer paid; went back to 7 days. <a href="https://www.revenuecat.com/blog/growth/7-day-trial-subscription-app">Wellness app, RevenueCat</a></li><li><b>Several prices on the paywall instead of one.</b> Lower conversion; a single weekly price “always won”. <a href="https://adapty.io/case-studies/glowup/">GlowUp, Adapty</a></li><li><b>Weekly + monthly or weekly + annual instead of monthly + annual.</b> Both weekly pairs lost on revenue per user and total revenue. <a href="https://adapty.io/case-studies/travel-app/">Travel app, Adapty</a></li><li><b>A “set a carb goal” step added to onboarding.</b> “Lost quite badly”. <a href="https://subclub.com/episode/achieving-mission-profit-with-freemium-erin-webster-shaller-and-paul-apollo-lose-it">Lose It!, Sub Club</a></li><li><b>A red brand-promise banner above the plan cards.</b> Conversion “dropped drastically”. <a href="https://blog.funnelfox.com/cracking-the-app-paywall-playbook/">The Economist, FunnelFox</a></li></ul>
<p class="note">The first six have numbers. The rest come from interviews and case studies that say B lost without a figure. A loss in one app is a warning for yours, not a forecast. They come from a base of 390 published tests, 33 of which lost.</p>
<h2>What the losses have in common</h2>
<ol class="steps">
<li><b>Trial starts went up, money went down.</b> Forcing a trial or pushing an unclosable offer lifted trial starts, and refunds took it back. Decide on paid or revenue per viewer, not on trial starts alone.</li>
<li><b>A discount next to the full price teaches people to wait.</b> The intro year at $59 sold zero against a standing $79, and a 50% coupon cut revenue per user five times.</li>
<li><b>More choice, less buying.</b> Extra price points and extra plan pairs lowered conversion in more than one app.</li>
<li><b>Every extra field and step costs people.</b> A phone number field before payment lost about 30% of people on the way to it.</li>
<li><b>The same change flips by market.</b> A weekly price rise that worked in Europe failed in the UK for <a href="https://adapty.io/case-studies/appdevlabs/">the same company</a>. Read results by country.</li>
</ol>
<h2>Before you run one of these</h2>
<p>Check whether your test can even see the change you hope for. The planner shows what your traffic can catch in 2 to 8 weeks, and next to it the ideas that lost in other apps.</p>
{plink(PLAN_PW, 'Plan your test')}
''',
'subscription-conversion-benchmarks': f'''
<p class="lead">“Conversion” means a different thing in each report. RevenueCat counts per install or per trial start. Adapty’s paywall report counts per paywall view. Adapty’s subscriptions report counts per install. Compare your number only with one that has the same thing below the line.</p>
<h2>The same word, three denominators</h2>
{table(['Step, counted per', 'Median', 'Report'], [
 ['Install → trial, in 30 days', '5.8%', 'RevenueCat'],
 ['Trial start → paid', '32.2%', 'RevenueCat'],
 ['Install → paid, by day 35', '2.0%', 'RevenueCat'],
 ['Install → trial', '10.92%', 'Adapty SOIS'],
 ['Trial start → paid', '25.59%', 'Adapty SOIS'],
 ['Install → paid, no trial', '3.71%', 'Adapty SOIS'],
 ['Paywall view → trial, US', '6.94%', 'Adapty SOP'],
 ['Paywall view → paid, US', '2.75%', 'Adapty SOP'],
])}
<p class="note">Medians across apps, all categories; RevenueCat’s install → trial counts only apps that offer a trial. SOIS = State of In-App Subscriptions, SOP = State of Paywalls. Sources: <a href="https://www.revenuecat.com/state-of-subscription-apps">RevenueCat, State of Subscription Apps 2026</a>; <a href="https://adapty.io/state-of-in-app-subscriptions-report/">Adapty, State of In-App Subscriptions 2026</a>; <a href="https://adapty.io/state-of-paywalls/">Adapty, State of Paywalls 2026</a>. Each report also splits these by category and region.</p>
<h2>Where people mix them up</h2>
<ol class="steps">
<li><b>Per view is not per install.</b> A paywall where 2.75% of viewers pay is a typical US paywall. An app where 2.75% of installs pay is above RevenueCat’s 2.0% median. Same number, different stories, because many installs never see a paywall and some see it several times.</li>
<li><b>Trial → paid differs between reports.</b> 32.2% at RevenueCat, 25.59% at Adapty. Different customers, different samples. Neither is wrong; pick one and stay with it.</li>
<li><b>Hard paywalls sit in another league.</b> In RevenueCat’s data, apps with a hard paywall convert 10.7% of installs to paid by day 35, against 2.1% for freemium. Compare a hard-paywall app with the 10.7%, not the overall median.</li>
<li><b>Read the chart, not only the summary.</b> RevenueCat’s AI chapter calls 8.5% vs 5.6% “trial-to-paid”. The charts show it is the trial start rate.</li>
</ol>
<h2>How to compare your number</h2>
<ol class="steps">
<li>Write down what is below the line: installs, trial starts, paywall views, or people who saw the paywall.</li>
<li>Pick the report that counts the same way, then the closest category and region.</li>
<li>Place your number against the median and the top quartile, not against one figure from a blog post.</li>
</ol>
<p>The planner works per person who saw the paywall, so its defaults come from Adapty’s per-view medians.</p>
{plink(PLAN_PW, 'Plan a paywall test with your numbers')}
''',
'paywall-ab-test-duration': f'''
<p class="lead">Whole weeks of traffic until your test can see the change you expect, then the longest free trial, then a week for refunds. For most subscription apps that is 4 to 8 weeks of traffic.</p>
<div class="formula">
<ol>
<li><span>1</span><div><b>Traffic: 2 to 8 whole weeks</b>Until the smallest change your test can catch is smaller than the change you expect.</div></li>
<li><span>2</span><div><b>Plus the longest free trial</b>People who start a trial on the last day pay only when it ends.</div></li>
<li><span>3</span><div><b>Plus about 7 days for refunds</b>A win on first payments can still lose once refunds land.</div></li>
</ol>
<p class="sum">4 weeks of traffic with a 7-day trial: start Mon, Nov 16, decide <em>Mon, Dec 28</em>.</p>
</div>
<h2>What a test can catch, by traffic and weeks</h2>
<p>The smallest change in revenue per viewer a test can tell apart from chance.</p>
{t('People who see it a week', PAY_MONEY)}
<p class="note">Assumes 2.75% of viewers pay, buyers split half and half between weekly $6.99 and annual $39.99, 95% confidence, 80% power, split 50/50. Conversion: <a href="https://adapty.io/state-of-paywalls/">Adapty State of Paywalls 2026</a>, US median per paywall view.</p>
{plink(PLAN_PW, 'Plan your paywall test', 'Your traffic and prices are different', 'The planner works this out from your last 30 days and gives you the decision day.')}
<h2>How to pick the length</h2>
<ol class="steps">
<li><b>Start from the change you expect.</b> If your test only catches +9.1% or more, a headline tweak won’t show. Test a bolder change.</li>
<li><b>Run whole weeks.</b> Weekdays and weekends convert differently; a test that stops mid-week reads that as an effect.</li>
<li><b>Add the trial and the refunds.</b> With a 3-day trial, decide 3 + 7 days after the traffic stops.</li>
<li><b>Don’t stop early on a good day.</b> Pick the length first, then wait.</li>
</ol>
<h2>Judge on revenue or on conversion?</h2>
<p>Prices, plans or trial changes: revenue per viewer, because conversion can fall while revenue rises. Copy and layout changes: paid conversion answers faster, and catches +7.5% in 4 weeks where revenue catches +9.1%.</p>
<h2>What changes have moved revenue</h2>
<p>Published paywall tests, so you can see whether your test is big enough for them.</p>
<div class="ev">
<p class="ev-group">Tested against a control group</p>
<div class="ev-item"><span class="what">Make the annual plan the hero</span><span class="res">+25% to +40% revenue per viewer</span><span class="meta"><span class="tag">Many tests</span>Adapty A/B test library</span></div>
<div class="ev-item"><span class="what">Show the annual price as a monthly price</span><span class="res">+8% revenue per viewer, US</span><span class="meta"><span class="tag">One test</span><a href="https://www.revenuecat.com/blog/growth/mojo-60-percent-arpu-growth-five-months/">Mojo, RevenueCat</a></span></div>
<p class="ev-group">No control group</p>
<div class="ev-item"><span class="what">Two-step paywall with the trial as a timeline</span><span class="res">+50% lifetime value</span><span class="meta"><span class="tag">No control group</span><a href="https://superwall.com/case-studies/pepper">Pepper, Superwall</a></span></div>
<p class="ev-group">Lost</p>
<div class="ev-item"><span class="what">Trial 7 → 14 days</span><span class="res">Slightly more trials, fewer paid; went back to 7 days</span><span class="meta"><span class="tag">Lost</span><a href="https://www.revenuecat.com/blog/growth/7-day-trial-subscription-app">Wellness app, RevenueCat</a></span></div>
</div>
''',
'free-trial-ab-test': f'''
<p class="lead">Not when the traffic stops. Wait for the longest free trial among the plans people buy to end, then about a week for refunds. Until then, a trial start isn't a payment and the test can't tell you which version earns more.</p>
<h2>When the decision day falls</h2>
<p>A 4-week paywall test that starts on Monday, November 9:</p>
{table(['Free trial', 'Traffic ends', 'Decide on'], [['None', 'Dec 6', 'Mon, Dec 14'], ['3 days', 'Dec 6', 'Thu, Dec 17'], ['7 days', 'Dec 6', 'Mon, Dec 21'], ['14 days', 'Dec 6', 'Mon, Dec 28']])}
<p class="note">The week after the last trials bill is for refunds: a version that wins on first payments can still lose once refunds land.</p>
<h2>Why waiting matters</h2>
<ol class="steps">
<li><b>Trials aren't payments.</b> A version can win trial starts by making the price harder to see and then lose on paid. Read the result on paid conversion or revenue per viewer.</li>
<li><b>The last trials bill late.</b> Someone who starts a 7-day trial on the last day of the test pays a week later.</li>
<li><b>Refunds come after.</b> Watch refunds as a guardrail: if B's refund share is clearly higher, its win may not hold.</li>
<li><b>Testing the trial itself?</b> Adding a trial, changing its length or putting it on the annual plan changes who pays and when; judge it on revenue per paywall viewer after the longest trial has billed.</li>
</ol>
{plink(PLAN_PW, 'Find your decision day')}
''',
'minimum-detectable-effect': f'''
<p class="lead">The minimum detectable effect (MDE) is the smallest change your A/B test can tell apart from chance. It shrinks as traffic and weeks grow. If the change you're testing is likely smaller than your MDE, the test will most likely end "can't tell", however good the idea.</p>
<h2>Typical MDEs for subscription apps</h2>
<p>Paywall, judged on revenue per paywall viewer (2.75% of the people who see it pay, weekly $6.99 and annual $39.99 half and half), at 95% confidence and 80% power:</p>
{t('People who see it a week', PAY_MONEY)}
<p>Onboarding, judged on trial starts (5.8% of new users start a trial):</p>
{t('Users a week', ONB_TR)}
<h2>How it's worked out</h2>
<p>Per-version sample size n = 2·(z₁₋α/₂ + z₁₋β)²·CV² / MDE², solved for the MDE a given number of people can see. For conversion CV² = (1 − p)/p; for revenue per viewer it also counts the spread of prices people buy. Three versions use a Bonferroni correction. The planner shows the MDE for 2, 4, 6 and 8 weeks next to published test ideas, so you can see which ones your test is big enough to catch.</p>
<h2>What to do when your MDE is high</h2>
<ol class="steps">
<li>Test a bolder change: change what the screen shows or the offer, not just the words.</li>
<li>Run longer, in whole weeks.</li>
<li>Put more traffic into the test, or test two versions instead of three.</li>
<li>Decide on a metric that answers faster (paid conversion or trial starts) when the change doesn't touch prices.</li>
</ol>
{plink(PLAN_PW, 'Work out your MDE')}
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
<ol class="steps">
<li><b>Trial starts:</b> copy, questions, screen order, a value screen before the paywall, sign-up moved later. Watch paid conversion as a guardrail: more trials of people who never pay isn't a win.</li>
<li><b>Paid conversion:</b> anything that could change who starts a trial or what they buy: the paywall offer, the trial itself, a plan built from answers that leads to a different plan.</li>
<li><b>Cutting screens:</b> published tests where onboarding was cut down lost about 13% of conversion; condensing long reading screens into a short carousel won once. Cut steps whose answers are never used, not the ones that set up the value.</li>
</ol>
{plink(PLAN_ONB, 'Plan your onboarding test')}
''',
}

DESC = {
'paywall-ab-test-duration': 'How long to run a paywall A/B test in a subscription app: what a test can catch by weekly traffic and weeks, plus the free trial and refunds before you decide.',
'free-trial-ab-test': 'When to decide a paywall A/B test with a free trial: wait for the longest trial to bill and a week for refunds. Decision days for 3, 7 and 14-day trials.',
'minimum-detectable-effect': 'Minimum detectable effect for subscription app A/B tests: typical MDEs for paywall and onboarding tests by traffic and weeks, how it is worked out, and what to do when it is high.',
'ab-test-split-90-10': 'How an uneven A/B split changes what a subscription paywall test can catch and how long it runs: 50/50 vs 60/40, 70/30, 80/20 and 90/10, with numbers.',
'abc-test': 'How much longer an A/B/C test on a subscription paywall runs than an A/B test, why, and when a third version is worth it.',
'paywall-ab-test-sample-size': 'Sample size for subscription paywall and onboarding A/B tests: people per version needed to catch a +5% to +30% change in revenue per viewer, paid conversion or trial starts, at typical app conversion rates.',
'ab-tests-that-lost': 'Published paywall and onboarding A/B tests from subscription apps that lost: price raises, discounts, longer trials, more plans, removed close buttons and extra onboarding steps, with the numbers and sources.',
'subscription-conversion-benchmarks': 'Conversion benchmarks for subscription apps from RevenueCat and Adapty, side by side with what each one counts: per install, per trial start or per paywall view. Which number to compare yours with.',
'onboarding-ab-test': 'Should an onboarding A/B test decide on trial starts or paid conversion? What each can catch by traffic, and which to choose for which change.',
}

def page(slug, h1):
    more = ''.join(f'<a href="/{s}/">{t}<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2"/></svg></a>' for s, t in PAGES if s != slug)
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
<meta property="og:image" content="{SITE}/assets/og.png?v=6">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/UncutSans-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/page.css">
<script src="/page.js" defer></script>
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
<footer><span>© 2026 Ivan Polushin</span><a href="/">Growth Test Planner</a><a href="https://github.com/theoutlines/growth-test-planner">Source</a></footer>
</div>
</body>
</html>
'''

for slug, h1 in PAGES:
    os.makedirs(f'{ROOT}/{slug}', exist_ok=True)
    open(f'{ROOT}/{slug}/index.html', 'w').write(page(slug, h1))
print('ok')
