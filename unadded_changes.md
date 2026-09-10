* 2025/07/22 D.Va `Heavy Rockets projectile gravity increased.` The official notes do not provide a numeric gravity value.
* 2025/07/22 Juno `Glide Boost movement acceleration in air reduced when changing directions, after the initial movement burst.` The official notes do not provide a numeric acceleration value.
* Sojourn `Secondary fire damage now scales linearly with energy from 30 to 130 damage (1 energy converts to 1 damage added)` (how tf did it work before)
* Pharah `Reload starts 0.25 seconds sooner when out of ammo` What tf? is there a delay on reload when out of ammo?
* Junkrat `Projectiles preserve slightly more velocity on ricochet.` How much more? How much was there before?
* Zarya `Beam damage now scales from 75-170 damage-per-second, down from 95-170` minimum damage was later increased from 85 so I'm not sure when it was increased to 85 from 75
* 2020/05
    * `Reduced the height of Reinhardt's head hit volume, making it harder to hit him in the head from behind` how much?
    * Echo `Reduced the height of Echo's head hit volume` how much?
    * Junkrat
        * Primary fire `Projectiles maintain slightly more velocity on ricochet` how much more?
        * Concussion Mine `Ricochet distance off of enemy players greatly reduced` how much?
    * Doom changes
    * Ashe Secondary Fire `Now reaches max zoom halfway through Ashe's aim down sights, instead of at its conclusion`
* 2020/04 
    * `Improved the accuracy of Tracer's blink movement such that Tracer will more likely end up where the crosshair is pointing` its a little unclear exactly what was changed here
    * Ashe timing changes since the numbers aren't listed
* 2020/03 Mei `Player collision now allows large heroes to fit through 1 pillar gaps` how so? I presume hitbox reduced, but how much and does it only apply to players or also bullets.
* 2019/11 `Mei's Icewall, Baptiste's Immortality Field, and Sigma's Gravitic Flux will now more heavily prefer edges over placing as far away as possible` how much?
* 2019/03 `Grenades now bounce less but explode sooner` how much sooner? how much less?
* 2019/02 `Knockback distance is now more consistent` I need numbers.
* 2018/11
    * `Made jump height consistent across hero roster` how did it work before?
    * Reaper - Hellfire Shotguns
        * `Spread randomization reduced by 50%`
        * `Spread pattern adjusted`
    * Roadhog - Scrap gun
        * `Spread randomization reduced by 50%`
        * `Spread pattern adjusted`
    * Roadhog - Whole hog
        * `Horizontal recoil decreased slightly`
    * Roadhog - Chain hook
        * `Now greatly reduces the target’s momentum upon being hooked`
* 2018/10 Torb
    * Alternate fire `Spread randomization readjusted`
    * Forge Hammer `Radius increased to align with Quick Melee`
* 2018/09 Reinhardt
    * `Now consistently hits enemies near walls` feels like a bug fix
    * `Always travels up inclines and around the payload` feels like a bug fix
* 2018/08
    * Reinhardt `Decorative insignia no longer protrudes from the shield’s surface`
    * Sombra `Reduced the size of Sombra’s head hit volume`
* 2018/07
    * When final objectives on non-control maps are contested for extended amounts of time and attackers have an advantage in numbers, the respawn time for defenders now increases even faster
    * Sombra Translocator `Radius reduced`
* 2018/05 Genji Deflect `Hitbox size has been reduced`
* 2017/08
    * Junkrat RIP-Tire `There is no longer a time limit when wall climbing`
    * Orisa `Barrier shape has been changed to allow for more coverage from enemies that are below the barrier`
    * `Defensive spawn times will now slowly increase earlier in the battle when the attacking team has more players on the objective`
* 2017/08
    * Cassidy `Stunned targets are now slowed heavily, meaning they're less likely to escape while stunned (especially while in the air)`
*2017/05
    * Genij `Removed the attack delay from Genji’s wall climbing ability, allowing him to engage with enemies immediately after he finishes climbing`
    * Hanzo `Removed the attack cooldown from Hanzo’s wall climbing ability, allowing him to engage with enemies immediately after he finishes climbing`
* 2017/03
    * `On Route 66, the attacking team is now given 60 additional seconds after pushing the payload to the first checkpoint.`
    * Sombra `Sound effects and VO distance has been reduced to 15 meters when Sombra enters or exits Stealth`
    * Zenyatta `Weapon spread has been removed`
* 2017/02
    * Torbjorn `Ammo is now loaded earlier in the reload animation`
* 2016/11
    * Pharah `Minimum explosion knockback has been decreased to 0%`
* 2016/10 Junkrat Riptire `Ability now activates more quickly`
* 2016/09
    * Reverted a recent change that reduced the size of heroes' projectiles
    * Most hero abilities will no longer interrupt quick melee attacks
    * Ultimate abilities will now interrupt quick melee attacks
    * Soldier: 76
        * Bullet spread now happens more quickly when unloading fully-automatic pulse fire
        * Significantly Increased bullet spread recovery time
* 2016/07
    * Spread recovery will begin after a short delay (rather than instantly)
## 2025-08-26

- General armor damage-reduction stacking/bug-fix behavior was not separately modeled. Existing data still records the 50% damage-reduction cap and armor mitigation values, but the notes describe interaction behavior rather than a new standalone numeric stat.
- Several Season 18 perk replacements are represented as empty entries when the official notes only describe conditional behavior with no stable numeric value to track.
- Roadhog's full classic Scrap Gun secondary-fire behavior is only partially represented; the data tracks the pellet-count, pellet-damage, crit behavior, and perk deltas from the notes, but does not attempt to model the entire secondary detonation profile.
## 2025-10-14

- Hero Mastery sunset and text chat customization changes are outside the current numeric hero/mode stat model.
## 2025-11-11

- Player progression/card UI changes, lore video access, and Advanced Info Panel keyword text were not added to core patch data.
- Echo and Juno air-acceleration changes are tracked as numeric perk/ability fields, but the exact movement model is not represented.
## 2025-12-09

- Challenger Score, aim-assist settings, and Saves-for-overhealth scoring behavior were not added to core patch data.
- Vendetta launch data uses Blizzard patch notes for launch deltas and Overwatch Wiki for ability baseline numbers; some animation/recovery details are approximate where Blizzard only gave percentage reductions.
## 2026-01-08

- Aim-assist/weapon-range UI options were not added to core patch data.
- Doomfist Power Matrix projectile absorption area was scaled down, but Blizzard did not provide a numeric size value to model.
- Freja Revdraw Crossbow spread behavior now ramps more slowly and fans horizontally; only the numeric maximum spread change is modeled.
## 2026-02-10

- Rise of Talon/Conquest event rules, communications UI changes, loot box/title/notification/FOV option updates, competitive reset and Challenger Score details, Advanced Info Panel keyword text, and Watchpoint: Gibraltar/Rialto layout or cosmetic changes were not added to core patch data.
- The sub-role passive overhaul is only partially represented through existing role/general fields. The project does not currently model per-hero sub-role assignments or multiple simultaneous role passive variants cleanly.
- Five new hero launch baselines were added from Blizzard notes and Overwatch Wiki data, but animation nuance and several purely descriptive interactions are summarized into numeric fields where practical.
## 2026-03-10

- Conquest event finale rewards and most sub-role passive retuning are not fully represented because the current data model does not cleanly assign subroles and passive variants per hero.
## 2026-04-14

- General / console aim assist: Blizzard reduced hitscan auto assist strength by 4%. The data model does not currently separate platform/input assist values, so this was not added.
- Map voting / post-match systems / Antarctic Peninsula rework: skipped because these are UI or map-system changes outside comparable hero balance data.
- Ramattra perk tier changes, Junkrat perk tier swaps, and other perk tier-only moves: skipped where the current schema tracks perk existence and values but not minor/major tier placement.
- Reinhardt Shield Slam custom binding and Soldier: 76 Sprint cancel-reload custom setting: skipped because hero-specific settings are not currently modeled as balance values.
- Emre Siphon Blaster hold-to-fire accessibility option: skipped because it changes input behavior at a reduced fire rate rather than a tracked baseline stat.
- Pharah Concussive Implosion removal could not be reflected because that perk was not present in the latest project snapshot. Concussive Callout was added.
- Mercy Guardian Angel launch speed was modeled as a 90% launch speed multiplier because the patch note gives only a 10% reduction and the existing data did not store the absolute launch speed.
- Jetpack Cat Frenetic Flight acceleration was modeled as an 89% acceleration multiplier because the official note gives only an 11% reduction and the existing data did not store the absolute acceleration.
## 2026-05-12

- Anniversary event, Junkrat's Loot Hunt, hero progression speed, default sound settings, competitive unlock requirement, post-match accolade tuning, website changes, and UI-only hero updates were not added because they are not comparable hero balance stats in the current data model.
- The new Inactive Reload keyword was not modeled because it is a tooltip/keyword presentation change for existing passive reload behavior, not a new numeric balance value.
- Doomfist animation/camera timing and VFX updates were skipped because the notes do not provide a comparable gameplay value.
- Sierra weapon fire volume and the listed major hero bug fixes were skipped as audio/bug-fix items. L?cio's passive self-healing penalty bug fix and Wuyang's armor double-application fix may affect gameplay but do not map cleanly to existing snapshot stats without changing calculation semantics.

## 2026-06-16

Source: [Blizzard June patch notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/06).

- Competitive hero bans now include a preferred-hero weight of -3 and a fifth, lobby-wide ban that can exceed the two-hero role limit. Lobby bans require votes from both teams and at least 10 total votes. Queue-specific multi-stage ban rules are not represented by the existing map-mode stats; a queue/ruleset model and verified earlier baseline are needed before backfilling this system.
- Map voting reduces the chance of offering maps played within the last five matches. The history window is stated, but no probability or selection-weight formula is supplied; the weighting behavior is not modeled.
- Historical source conflicts in both groups: Anran Dancing Blaze recovery is recorded as 0.256 seconds rather than the official old 0.2; Headbutt's speed threshold is 16 rather than 16.5 m/s. The new values (0.1 seconds and 14 m/s) are applied. The earlier change boundaries remain unresolved.
- Jetpack Cat's recorded carrying fuel regeneration is 15 while the base is 25. That does not agree with the stated old 2x slowdown. The new rate is derived as 25/3, and the slowdown is tracked separately; the historical 15 value is retained pending a supported correction boundary.
- Some newly exposed baseline stats are backfilled only as far as the previously audited May 12 snapshot, not silently assumed constant since launch. See `scripts/update_summer_2026.mjs` for explicit per-stat earlier boundaries. Earlier history for the remaining fields still needs source verification.

## 2026-07-14

Source: [Blizzard July patch notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/07).

- Freja's recorded recovery time is about 0.2079 seconds, whereas Blizzard's stated old rate of 5 shots/s implies 0.2 seconds. The new 5.5 shots/s rate is represented by 1/5.5 seconds; previous timing data is not rewritten without a supported boundary.
- Sigma's notes reduce shields from 275 to 250. The existing 6v6 baseline already has 250. The 5v5 change is applied; 6v6 remains 250 rather than assuming an unannounced reduction to 225.

## 2026-08-11

Sources: [Blizzard August patch notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/08), [D.Mon numeric baseline](https://overwatch.fandom.com/wiki/D.Mon).

- D.Mon: neither the official notes nor the consulted numeric baseline supplied 6v6 mech base health, ultimate costs, perk XP costs, or the pilot weapon's reload time. These fields are omitted rather than copying D.Va values or assuming the 5v5 health pool. Primary active-fire DPS is calculated, but pilot reload-inclusive DPS and 6v6 total health remain unavailable. Ejection invulnerability is an approximate 1.4-second wiki value, not an official precise timing.
- Life Grip's longer-distance pull now starts slower and accelerates beyond 15 meters. The threshold, base speed, and manual-cancel delay are tracked; the acceleration curve and initial long-distance speed were not published and are not invented.
- Echo Focused Rush's old movement bonus is recorded as 20%, but Blizzard specifies 15% before increasing it to 25%. The new 25% is applied; the previous discrepancy needs a historical source boundary.

## 2026-08-14

Source: [Blizzard August patch notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/08).

- D.Mon mech head hitbox height was adjusted to match the model. The notes give no dimensions or scale factor, so a numeric hit-volume change cannot be recorded confidently.

## 2026-09-08

Source: [Blizzard September patch notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/09).

- D.Va's official 5v5 mech base-health change is 175 to 200, while the repository has 325. The new snapshot follows the official 200 value. This produces an apparent reduction in the comparison until the conflicting historical 325 baseline is reconciled; it must not be described as the official delta. The wiki also listed 175 before this change but did not establish the historical correction boundary.
- Mauga's 6v6 armor is already 100, unlike the unqualified 150-to-125 note. The 5v5 change is applied and 6v6 remains 100 pending mode confirmation. The dual-gun spread change is now represented as 4 to 5 degrees in both groups. The older 0.85 field was a multiplier relative to the release preview, not an angle; it is preserved under an explicit multiplier label. Absolute angles before the last audited 2026-05-12 baseline remain unverified and are not backfilled by inference from 0.85.
- Other old-value conflicts in both groups: Adaptive Barrier duration is 1.4 rather than 1.5 seconds; Sierra's Helix Rifle speed is 85 rather than 90 m/s; Vendetta's first swing startup is 0.4 rather than 0.3 seconds; Sundering Blade recovery is 0.68 rather than 0.2 seconds. Official new values are applied, with historical reconciliation still outstanding.
- Zenyatta's existing 6v6 Harmony Orb line-of-sight timeout is already 3 seconds, so the official 5-to-3 change produces no new numerical 6v6 diff. Its earlier mode-specific history remains unresolved.
- Vendetta's new startup, horizontal swing duration, and combo window do not provide a verified complete repeat-combo duration. The wiki still contains pre-change timings and a 1.18 average swing rate. That average is omitted from the September snapshot to avoid presenting stale calculated DPS; a fresh complete-combo measurement is required.

