import { afterAll, describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { loadMainFunctions } from "./helpers/mainFunctions.js";
import type { PatchData, Units } from "../schema.js";

const load = <T>(file: string) => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8")) as T;
const units = load<Units>("units.json");
const modes = ["Overwatch 2", "Overwatch 2 6v6"];
const patch = (mode: string, date: string) => load<PatchData>(`patches/${mode}/${date}.json`);
const engine = loadMainFunctions({ units, siteState: { show_calculated_properties: true, show_breakpoints: true, apply_to_armor: false } });
const armoredEngine = loadMainFunctions({ units, siteState: { show_calculated_properties: true, show_breakpoints: true, apply_to_armor: true } });

function compare(before: PatchData, after: PatchData, engineOverride = engine) {
    const [[a], [b]] = engineOverride.processPatchPair(before, after, 1, 1) as [[PatchData], [PatchData]];
    const changes = engine.removeRedundantBreakpoints(engine.convert_to_changes(a, b, ["role"]), a, b);
    return { before: a, after: b, changes };
}

describe("breakpoint comparison regressions", () => {
    for (const mode of modes) {
        it(`${mode}: shows the four-swing Plasma Saber nerf without phantom hero changes`, () => {
            const { changes } = compare(patch(mode, "2026-08-14"), patch(mode, "2026-09-08"));
            const label = "Breakpoint for Plasma Saber 4x Total normal damage";
            expect(changes.heroes["D.Mon"].breakpoints[label]).toEqual([250, 225]);
            expect(changes.heroes["D.Mon"].breakpoints["Breakpoint for Plasma Saber 5x Total normal damage"]).toBeUndefined();
            for (const hero of ["Domina", "Hazard", "Roadhog", "Ashe", "Anran"]) {
                expect(Object.keys(changes.heroes?.[hero]?.breakpoints ?? {}), hero).toEqual([]);
            }
        }, 30000);
    }

    it("excludes tanks and deduplicates actual non-tank health pools", () => {
        const data = patch(modes[0], "2026-09-08");
        data.heroes = { "D.Mon": data.heroes["D.Mon"], Ashe: data.heroes.Ashe, Hanzo: data.heroes.Hanzo };
        expect(engine.getBreakpointHealthValues(data, units)).toEqual([250]);
    });

    it("renders a real change that crosses the highest target-health threshold", () => {
        const section = { innerHTML: "" };
        const renderer = loadMainFunctions({ document: { getElementsByClassName: () => [section] }, image_map: {} });
        renderer.displayPatchNotes({ roles: { tank: {} }, heroes: {
            "D.Mon": { role: "tank", breakpoints: { "Breakpoint for Plasma Saber 4x Total normal damage": [250, 225] } },
        } }, [250, 250], units);
        expect(section.innerHTML).toContain("Breakpoint for Plasma Saber 4x Total normal damage reduced from 250 to 225.");
    });

    it("is invariant to target-only health changes and repeated processing", () => {
        const before = patch(modes[0], "2026-08-14");
        before.heroes = { "D.Mon": before.heroes["D.Mon"], Ashe: before.heroes.Ashe };
        const after = structuredClone(before);
        after.heroes.Ashe!.general["Base health"] = 240;
        const savedUnits = structuredClone(units), savedBefore = structuredClone(before);
        const first = compare(before, after), second = compare(before, after);
        expect(first.changes.heroes["D.Mon"]).toBeUndefined();
        expect(first.changes).toEqual(second.changes);
        expect(units).toEqual(savedUnits);
        expect(before).toEqual(savedBefore);
    });

    it("prunes redundant combinations using full attack counts, not the sparse diff", () => {
        const a = patch(modes[0], "2026-08-14"), b = structuredClone(a);
        const before = a.heroes["D.Mon"]!, after = b.heroes["D.Mon"]!;
        before.breakpoints = { four: 250, five: 250, other: 250 };
        after.breakpoints = { four: 225, five: 225, other: 225 };
        before.breakpoints_data = { four: { saber: 4 }, five: { saber: 5 }, other: { repeater: 4 } };
        after.breakpoints_data = structuredClone(before.breakpoints_data);
        const changes = engine.removeRedundantBreakpoints(engine.convert_to_changes(a, b, ["role"]), a, b);
        expect(changes.heroes["D.Mon"].breakpoints).toEqual({ four: [250, 225], other: [250, 225] });
    });

    it("renders Mauga's angle and legacy multiplier as distinct, dimensionally valid changes", () => {
        const name = "Spread for firing both guns", weapon = "Incendiary and Volatile Changuns";
        for (const mode of modes) {
            const a = patch(mode, "2026-08-14").heroes.Mauga!.abilities[weapon];
            const b = patch(mode, "2026-09-08").heroes.Mauga!.abilities[weapon];
            const displayUnit = engine.getDisplayUnit(units.heroes.Mauga!.abilities[weapon][name]);
            expect(engine.getChangeText(name, [a[name], b[name]], displayUnit, false)).toBe("Spread for firing both guns increased from 4 to 5 degrees.");
            expect(a["Dual-gun spread multiplier relative to preview"]).toBe(0.85);
            expect(b["Dual-gun spread multiplier relative to preview"]).toBeCloseTo(1.0625);
            const values = [0.85, 1.0625];
            expect(engine.getChangeText("Spread multiplier", values, "relative percent", false)).toBe("Spread multiplier increased by 25%.");
            expect(values).toEqual([0.85, 1.0625]);
            expect(engine.getChangeText("Spread multiplier", [0.854, 0.851], "relative percent", false)).toBe("Spread multiplier reduced by 0.35%.");
        }
    });
});

// Only calculator inputs belong here: cost, cooldown, range and target health
// cannot turn an unchanged attack sequence into an offensive breakpoint change.
function offensiveInputs(hero: NonNullable<PatchData["heroes"][keyof PatchData["heroes"]]>, heroUnits: NonNullable<Units["heroes"][keyof Units["heroes"]]>) {
    const inputs: Record<string, unknown> = { meleeOverride: hero.general["has overridden melee"] };
    for (const [ability, stats] of Object.entries(hero.abilities)) {
        for (const [key, value] of Object.entries(stats)) {
            if (heroUnits.abilities[ability][key].some(unit => Array.isArray(unit)
                ? /damage|critical multiplier|pellet count|bullets per burst|situation/.test(unit[0])
                : ["ammo", "charges", "bullets per burst", "ammo per shot", "time between shots", "shots per second", "damage per second"].includes(unit))) {
                inputs[`${ability}/${key}`] = value;
            }
        }
    }
    return inputs;
}

const review: { mode: string; before: string; after: string; armor: boolean; unchangedAttackHeroesChecked: number; breakpointChanges: Record<string, number> }[] = [];
describe("all added patch comparisons", () => {
    const list = load<Record<string, string[]>>("patch_list.json");
    for (const mode of modes) {
        for (let i = 1; i < list[mode].length; i++) {
            const date = list[mode][i].replace(/\.json$/, ""), previous = list[mode][i - 1].replace(/\.json$/, "");
            if (date < "2025-04-22") continue;
            for (const armor of [false, true]) {
                it(`${mode} ${previous} -> ${date}, armor=${armor}: no unexplained offensive breakpoint drift`, () => {
                    const before = patch(mode, previous), after = patch(mode, date);
                    const { changes } = compare(before, after, armor ? armoredEngine : engine);
                    const record = { mode, before: previous, after: date, armor, unchangedAttackHeroesChecked: 0, breakpointChanges: {} as Record<string, number> };
                    for (const hero of Object.keys(after.heroes) as (keyof PatchData["heroes"])[]) {
                        const a = before.heroes[hero], b = after.heroes[hero];
                        const heroChanges = changes.heroes?.[hero];
                        const actual = Object.keys((Array.isArray(heroChanges) ? heroChanges[1] : heroChanges)?.breakpoints ?? {});
                        if (actual.length) record.breakpointChanges[hero] = actual.length;
                        if (!a || !b || before.general["Quick melee damage"] !== after.general["Quick melee damage"]) continue;
                        if (armor && JSON.stringify(before.general) !== JSON.stringify(after.general)) continue;
                        if (JSON.stringify(offensiveInputs(a, units.heroes[hero]!)) === JSON.stringify(offensiveInputs(b, units.heroes[hero]!))) {
                            expect(actual, `${hero}: unchanged offensive inputs`).toEqual([]);
                            record.unchangedAttackHeroesChecked++;
                        }
                    }
                    review.push(record);
                }, 30000);
            }
        }
    }
});

afterAll(() => {
    if (process.env.WRITE_COMPARISON_AUDIT === "1") {
        writeFileSync(new URL("../audits/breakpoint-review.json", import.meta.url), JSON.stringify(review, null, 2) + "\n");
    }
});
