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

- Haunted Masquerade mask rules and Stadium-only updates were not added to core patch data.
- Hero Mastery sunset and text chat customization changes are outside the current numeric hero/mode stat model.
## 2025-11-11

- Player progression/card UI changes, lore video access, Advanced Info Panel keyword text, and Stadium updates were not added to core patch data.
- Echo and Juno air-acceleration changes are tracked as numeric perk/ability fields, but the exact movement model is not represented.
## 2025-12-09

- Challenger Score, aim-assist settings, Winter Wonderland event rules, Stadium roster/items, and Saves-for-overhealth scoring behavior were not added to core patch data.
- Vendetta launch data uses Blizzard patch notes for launch deltas and Overwatch Wiki for ability baseline numbers; some animation/recovery details are approximate where Blizzard only gave percentage reductions.
## 2026-01-08

- Showdown Shuffle modifiers, Quick Play: Hacked Assault availability, aim-assist/weapon-range UI options, and Stadium turret updates were not added to core patch data.
- Doomfist Power Matrix projectile absorption area was scaled down, but Blizzard did not provide a numeric size value to model.
- Freja Revdraw Crossbow spread behavior now ramps more slowly and fans horizontally; only the numeric maximum spread change is modeled.
## 2026-02-10

- Rise of Talon/Conquest event rules, communications UI changes, loot box/title/notification/FOV option updates, competitive reset and Challenger Score details, Advanced Info Panel keyword text, Stadium reworks, and Watchpoint: Gibraltar/Rialto layout or cosmetic changes were not added to core patch data.
- The sub-role passive overhaul is only partially represented through existing role/general fields. The project does not currently model per-hero sub-role assignments or multiple simultaneous role passive variants cleanly.
- Five new hero launch baselines were added from Blizzard notes and Overwatch Wiki data, but animation nuance and several purely descriptive interactions are summarized into numeric fields where practical.
## 2026-03-10

- Conquest event finale rewards, Stadium mod art/readability changes, and most sub-role passive retuning are not fully represented because the current data model does not cleanly assign subroles and passive variants per hero.
## 2026-04-14

- General / console aim assist: Blizzard reduced hitscan auto assist strength by 4%. The data model does not currently separate platform/input assist values, so this was not added.
- Mystery Heroes / map voting / post-match systems / Antarctic Peninsula rework: skipped because these are mode, UI, or map-system changes outside comparable hero balance data.
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
- Stadium, Stadium items, and Stadium powers were ignored per project standards.

