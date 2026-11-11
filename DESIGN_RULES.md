# DESIGN_RULES.md — The Outlines (live 2026-11-10)

Read this before building any page for theoutlines.xyz tools (Growth Test Planner, its answer pages, future planners).
The component library gives you parts. This file gives you the decisions. The ticket decides what a page says; these rules decide how it looks and behaves.

## 1. Pick a frame first
| You are building | Use |
| --- | --- |
| A tool's entry screen | StartFrame |
| One question in a flow | QuestionFrame |
| Anything that plans forward from inputs (duration, sample size, what a test can catch, goal-first) | CalculatorFrame |
| Anything that reads real test numbers and gives a verdict (incl. comparing two designs) | ReaderFrame |
| A page someone lands on from search, or 404 | AnswerPageFrame |
Do not set your own width, header, footer or section order. If no frame fits, stop and ask.

## 2. Global rules
1. Mobile first, dark only. Design at 390, check at 358. Desktop = the phone column (440) + a 320 rail; answer pages = one 680 column.
2. Orange (#FF4C00) highlights one thing: what the screen answers (headline number, decision day, the threshold your test catches). It also belongs to emotional moments: start hero, win verdict card, share card, brand mark, illustrations, glyphs, and a likely mistake (typo note, field error, failed check "!"), which is also "look here". Never focus rings, carets or decoration. The 3D character appears only in emotional moments.
3. Monospace (Geist Mono) only for numbers by charts (axis ticks, bar-end labels) and at slider ends. Everything else is Uncut Sans, numbers with tabular figures.
4. Pages stay short: show what fits the test first, the rest behind "Show all N" in the same order. Results with no control group sit below controlled ones; losses come last.
5. The answer comes first: result above explanation and inputs.
6. Plans update live. Readings of real numbers wait for "Read my result", then stay live.
7. One CTA per screen. White = the screen's main action. Grey = the rest. Orange = only the landing's "Plan a test". Share result is white in the bottom dock (phone) or bottom-left float (desktop); Share plan is the top-bar icon on the phone.
8. Every number has a source, says "example", or says how we worked it out. Example inputs come from `DEFAULTS.md`, per area.
9. States: a plan is never empty (it starts from typical-app numbers labelled “example”); a reading before “Read my result” shows the inputs only; nothing loads in the tools. Where something does load: under 300 ms show nothing; a boot that reads several parts shows the step list (what is loading, row by row, 220 ms a row, at most 1.3 s); a wait of seconds shows MatrixLoader with a line that names the action. Errors are calm: orange "!" or note + one line under the field; the result says "Check your numbers". Never blocking.
10. 4px grid. Type sizes 10/12/16/20/24/28/32/40/44; weights 400/500; lines 1/2/4 px.
11. Version letters A, B, C in running text are grey chips (VersionChip: 14% fill, white, 0.8em, radius .35em), so they never read as the article "a". Not in headlines, buttons, segmented controls or charts.
12. Footer, everywhere: “© 2026 Ivan Polushin” + a “Source” link (https://github.com/theoutlines/growth-test-planner), 12/16 at 50%; centred in the tools, left in the 680 column on static pages, which add a “Growth Test Planner” link. No other lines.

## 3. Numbers (one format per kind; in the planner `sign()` in js/math.js and `pctR()` in js/app.js produce them)
| Kind | Format | Example |
| --- | --- | --- |
| What a test can catch | signed, 1 decimal | +9.1% |
| Measured lift | signed, whole | +13%, −5% |
| Range | "lo to hi", both signed | +5% to +21% |
| Verdict sub line | range + plan on the low end | Most likely +5% to +21%. Plan on +5%. |
| Rate | 2 decimals | 2.75% |
| Count | typed counts exact with commas; worked-out counts (30-day equivalents, people per version, “about N”) to 3 significant figures | 85,700; 43,000; 1.07M; 40,100 |
| Money per viewer | $, 2 decimals | $0.65 |
| Date | weekday, month, day; never “day 42” | Mon, Dec 28 |
| Published result | as the source wrote it, with its metric | +25% to +40% revenue per viewer |
Never: "–" ranges, "…", "between", "≥", "and up", a change without its sign.

## 4. Words
- Metrics: revenue per viewer (Revenue), paid conversion (Conversion), trial starts (Trials). Define "viewer = a person who saw the paywall" once per page.
- Never "revenue per user", never "MDE" alone ("smallest change to catch"), never "views" for people.
- Sentence case, no exclamation marks, no emoji, English.

## 5. Evidence
- Static pages (answer pages) show up to 3 ideas per group; tools show 6 that fit, then “Show all N”. Within a group, sort by the middle of the range, highest first.
- StrengthTag: “Many tests” = 3 or more published tests behind the range, “One test” = 1, “2 tests” = 2; plus “No control group” and “Lost”.
- The Reader (a verdict) shows no evidence: published results live in the plan.
- Cite only `evidence/ideas.json` (or a source named on the page). No placeholder sources, no invented ranges.
- EvidenceList / IdeasChart order: Tested against a control group → No control group → Lost.
- Every item: what changed, result with metric, StrengthTag, source link.

## 6. Statistics
Plan and read with the methods in `STATS.md` (95%, 80% power, Bonferroni for C, decision day, verdict thresholds, split check). Never pick your own.

## 7. Frames in brief
- QuestionFrame: one question, h1 28/32 + one line, input centred, back + Next pinned bottom; progress from the real step count.
- CalculatorFrame: ResultBlock → PlanTimeline → EvidenceList/IdeasChart. Inputs only in ControlsPanel (sheet on phone, rail on desktop), fixed order. Live.
- ReaderFrame: inputs + "Read my result" → VerdictBanner → ChecksRow → DesignPair? → numbers → NextSteps (max 3). Only a win is orange.
- AnswerPageFrame: question h1 → ShortAnswer → DataTable + SourceLine → PlannerLink (opens the first question) → steps → EvidenceList → More answers → footer. No inputs, no rail.

## 8. When you are unsure
If a decision is not in this file or in a frame's header, do not invent it: write it down as an open question in your notes and pick the option closest to an existing screen. New patterns go into the system first, then into pages.
