# Generated patch-note correction audit

Reviewed 2026-09-09, starting from `58a64b4`.

## Why the errors escaped

The previous update verified snapshot schemas and selected weapon DPS calculations, but did not verify the complete breakpoint comparison and rendered text. That was insufficient. The spread error was introduced by the data migration; existing calculator defects were exposed by the updated roster and weapon models.

| Symptom | Root cause | Correction |
| --- | --- | --- |
| Unchanged Domina, Hazard, Roadhog, Ashe, Anran and other attacks acquired changed breakpoints | Before and after used different target-health lists. The target builder also iterated heroes twice and compared hero names, not roles, to `tank`. | Use a shared union of non-tank health pools and inspect actual roles. Target health changes remain hero-stat changes, not offensive weapon changes. |
| Missing four-swing Plasma Saber breakpoint | `shots per second` was not recognized as repeatable fire; mixed combinations were bounded to three attacks. | Recognize both rate representations. Add standalone repeated-weapon sequences beyond three, bounded by ammo/charges and relevant target health. Derive compatible search limits from both snapshots. |
| Valid combinations disappeared | The redundancy filter read attack counts from a sparse diff, where unchanged counts are absent. The renderer also suppressed changes touching the highest target threshold. | Filter against full before/after metadata and preserve real highest-threshold crossings. Four Plasma Saber hits change from 260 to 240 raw damage, so the displayed reachable-health threshold changes from 250 to 225. |
| Mauga dual-gun spread allegedly increased 488.24% | A degree value of 5 replaced a preview-relative coefficient of 0.85, while the field retained `relative percent` units. | Separate the dimensions. The September angle changes from 4 to 5 degrees; the retained historical coefficient changes from 0.85 to 1.0625, a 25% increase. |
| Fractional percentage changes could still be inaccurate | The formatter rounded operands before dividing and mutated its input array. | Calculate ratios from original values and round only the final percentage. |
| Calculation units could depend on earlier renders | Derived units were added to the shared global unit map. | Use isolated unit maps for each calculation and explicitly combine generated rendering metadata. |

## Spread provenance

[Blizzard's September notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/09) specify simultaneous maximum spread increasing from 4 to 5 degrees. The existing 0.85 scalar represented the 15% reduction relative to Mauga's release preview, not 0.85 degrees. These are not competing measurements.

`scripts/fix_spread_units.mjs` preserves the historical scalar under an explicit label throughout both active groups. Absolute angles are backfilled only to the last source-reviewed May 12, 2026 baseline, across which the June-August notes do not change simultaneous maximum spread. Earlier absolute angles remain unverified in `unadded_changes.md`; no conversion from 0.85 to an invented historical angle was made. Unrelated historical formatting is preserved.

## Coverage and limits

`tests/breakpoints.test.ts` exercises production functions for every consecutive added date from April 22, 2025 through September 8, 2026 in both active groups. This is 64 date/mode pairs, each tested with armor off and on: 128 comparisons and 5,606 unchanged-attacker checks. Results, including changed-breakpoint row counts by hero, are recorded in `breakpoint-review.json`.

Focused regressions cover D.Mon's four swings, the named phantom changes, non-tank targets, health-only changes, repeatable processing without input/global-unit mutation, full-metadata redundancy filtering, maximum-threshold rendering, and exact Mauga degree/percentage text. The ordinary CI test command includes these regressions and the full comparison sweep.

This is a calculator/reporting audit across the added history, not a fresh claim that every historical number has been independently rechecked against Blizzard. Unresolved source-data questions in `unadded_changes.md` remain unresolved. Mixed-ability combinations retain their bounded search; standalone longer sequences do not imply exhaustive mixed critical/body-shot, reload, cooldown, or combat simulation.

## Reproduction

- Run `npm test` with `WRITE_COMPARISON_AUDIT=1` to regenerate the comparison report. The complete suite passes 402 tests.
- Run `npm run typecheck` and `npm run build`; both pass.
- Serve the built repository locally and run `node scripts/check_breakpoint_ui.mjs`. Playwright and Edge must be available; `PLAYWRIGHT_MODULE` may point to an externally installed Playwright module and `SITE_URL` may override the local address.
- Set `AUDIT_ALL_PATCHES=1` to check rendered breakpoint row counts against every armor/mode/date entry in the regenerated report, in addition to the four latest-patch desktop/mobile checks.

All 128 historical browser comparisons and the four latest-patch viewport checks passed in headless Edge. No page runtime errors or missing-unit diagnostics were reported by those checks.

The updated `agents.md` requires rendered comparisons, dimensional checks before reusing keys, unchanged-attacker assertions, and regression tests for reporting defects. Passing schema tests alone must not be described as a complete patch-note audit.
