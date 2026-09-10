# Agent Instructions

## Project Shape

This repo stores Overwatch balance snapshots for the patch comparison UI.

- Patch files live under `patches/<patch group>/<date>.json`.
- `patch_list.json` is the ordered source of patch availability for the app.
- `units.json` must define units for every stat key present in patch data.
- `image_map.json` maps heroes, abilities, perks, and other UI labels to image assets when available.
- `unadded_changes.md` is the record for balance-relevant changes that cannot be represented confidently in the current data model.

Run `npm test` after data edits. The validation tests require every listed patch file to exist, conform to `schema.ts`, and have unit definitions for all included stats.

For TypeScript or workflow changes, also run `npm run typecheck` and `npm run build`. CI and Pages deployment must install lockfile dependencies with `npm ci` before running these checks; passing data tests alone does not verify the browser entry point or deployment build.

## Patch Data Update Workflow

When updating current Overwatch 2 data, update both active patch groups unless the source patch is clearly specific to only one of them:

- `Overwatch 2` for current 5v5.
- `Overwatch 2 6v6` for current 6v6.

Use Blizzard's official patch notes as the primary source. Use the Overwatch wiki or other sources only to fill in numeric data that Blizzard's notes omit, and prefer noting uncertainty in `unadded_changes.md` over guessing.

1. Identify every missing balance patch since the latest entry in `patch_list.json` for the relevant patch group. Do not collapse multiple missed patches into one file; create one snapshot per official balance patch date.
2. For each new patch, copy the latest recorded patch file in that same patch group to a new file named with the new patch date.
   Finish and verify both modes for that date before proceeding to the next date.
3. Add each new file name to the matching array in `patch_list.json`, preserving chronological order and the `.json` suffix convention used in the file.
4. Apply changes to the new snapshot only, unless you are backfilling a stat that should have existed in previous snapshots.
5. For changes to stats that already exist in patch data, update the existing key and preserve the existing stat name unless there is a strong reason to rename it across the data set.
6. For entries in existing heroes, abilities, perks, roles, modes, or general data where the new patch provides a number but previous patches did not track that stat:
   - Add the new stat to the new patch.
   - Add the old value to every previous patch where that value applied, back to the hero, ability, perk, role rule, mode rule, or system rule introduction.
   - Add the corresponding unit path to `units.json`.
   - If the old value or start date is uncertain, document the uncertainty in `unadded_changes.md` instead of inventing a value.
7. For new abilities or perks:
   - Add an entry in the new patch.
   - Add units for every tracked stat.
   - Add an `image_map.json` entry from Blizzard patch notes or official hero pages. Never use wiki images. Verify hero, ability, and perk labels, including reused names; do not substitute Stadium icons.
   - Include balance-relevant numeric, boolean, and string values that could plausibly change in future patches.
8. For removed abilities or perks, remove their entries entirely from the new patch snapshot. Do not remove them from historical snapshots where they existed.
9. For added heroes, add the hero, role, general stats, abilities, perks, and units needed by the new patch. Also update `schema.ts` if the hero union requires it.
10. Add hard-to-model or uncertain changes to `unadded_changes.md` with the patch date, affected hero/system, the exact change summary, and why it was not added.
11. Ignore Stadium changes and arcade-mode-only changes. Do not record minor visual changes or minor bug fixes unless they also change a balance-relevant stat represented by the data model.
12. If a change is explicitly 5v5-only or 6v6-only, apply it only to that patch group. If the source does not clearly specify the mode and the live game mode is standard Overwatch 2, apply it to `Overwatch 2`; add a note to `unadded_changes.md` if 6v6 applicability is unclear.

## What To Track

Track values that the comparison UI can meaningfully compare and that could change in a later balance patch:

- Hero health, armor, shields, role, and model or hit volume changes when numeric.
- Ability and weapon damage, healing, ammo, spread, recovery, reload, projectile size, projectile speed, range, radius, duration, cooldown, ultimate cost, damage reduction, movement speed, knockback, resource, charge, and similar gameplay values.
- Perk values and perk existence.
- Role passives, global rules, and game mode rules.
- Boolean or string behavior switches when the existing data model already tracks similar behavior or the behavior is likely to matter in comparisons.

Do not track cosmetic-only notes, wording-only notes, minor animation or VFX fixes, crash fixes, map bug fixes, Stadium-only content, or arcade-mode-only content.

## Verification Standard

After editing data for a patch, inspect the generated comparison between the previous patch and the new patch and compare it against Blizzard's official notes for that same date.

The diff should include every balance-relevant official change that belongs in the model, and it should not include unrelated drift from accidental edits. If a larger system change does not fit the existing schema, look for precedent in older patches before adding a new structure. If there is no clear precedent, add the unresolved item to `unadded_changes.md` and keep the snapshot otherwise accurate.

Schema and DPS tests alone are not a patch-note audit. Check both the raw snapshot diff and the rendered comparison with calculated properties and breakpoints enabled, in both modes and with armor on and off. Include negative assertions: an ultimate-cost, cooldown, or target-health-only change must not appear as an offensive breakpoint change for an otherwise unchanged attack.

- Before reusing a stat key, verify its meaning and unit tags, not just its name. Absolute spread angles, relative multipliers, and percentage points are different quantities. Never store degrees in a relative-percent field. If the meaning changes, use distinct keys and document any unsupported historical baseline.
- Compare attack sequences against the same target-health thresholds and compatible search limits on both sides. Check actual hero roles when selecting targets. Preserve threshold-crossing changes at the highest target health.
- New weapon models must be tested through the actual breakpoint calculator and renderer, not just DPS. Cover rate tags, burst/volley counts, ammo limits, and representative multi-hit kills (including more than three hits). Mixed-ability searches remain bounded and are not an exhaustive combat simulator.
- Redundancy filtering must use full before/after attack-count metadata; missing values in a sparse diff do not mean zero attacks. Processing and formatting must not mutate source data or global units.
- Run the all-added-date regressions in `tests/breakpoints.test.ts`. To refresh the checked-in report, run `npm test` with `WRITE_COMPARISON_AUDIT=1`. This verifies calculator invariants, not the factual accuracy of every source value; state that distinction in audit reports.
- Add an exact rendered-text regression for each reporting defect, including fractional relative changes. Calculate percentages before rounding for display.

## Ambiguities To Resolve Conservatively

- "Latest recorded patch" means the final date listed in `patch_list.json` for the relevant patch group, not filesystem modification time.
- "New patch" means each official balance patch date being added, not just the newest currently available date.
- "Back to when it applies" requires a supportable source boundary such as hero release, ability introduction, perk introduction, or an earlier patch note. If that boundary cannot be determined, do not backfill blindly.
- "Could feasibly change" is intentionally broad; keep it to balance-relevant data that can be represented with the current schema and compared usefully by the UI.
- When official notes and wiki data disagree, prefer official notes for changed values and use the wiki mainly for missing baseline values. Record unresolved conflicts in `unadded_changes.md`.
