import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadMainFunctions } from "./helpers/mainFunctions.js";
import type { PatchData, Units } from "../schema.js";

const load = <T = unknown>(file: string): T => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8")) as T;
const modes = ["Overwatch 2", "Overwatch 2 6v6"];
const dates = ["2026-06-16", "2026-06-23", "2026-06-25", "2026-07-14", "2026-08-11", "2026-08-12", "2026-08-14", "2026-09-08"];
const patch = (mode: string, date: string): PatchData => load<PatchData>(`patches/${mode}/${date}.json`);

const calculations = loadMainFunctions();
function calculate(p: PatchData) {
    const units = load<Units>("units.json");
    calculations.calculatePreArmorProperties(p, units);
    calculations.calculatePostArmorProperties(p, units);
    return calculations.calculateRates(p, units);
}

describe("June-September 2026 snapshots", () => {
    for (const mode of modes) {
        it(`${mode}: includes every date once, with hero release boundaries`, () => {
            const list = load<Record<string, string[]>>("patch_list.json")[mode];
            expect(list.slice(-dates.length)).toEqual(dates.map(d => `${d}.json`));
            expect(new Set(list).size).toBe(list.length);
            expect(patch(mode, "2026-05-12").heroes.Shion).toBeUndefined();
            expect(patch(mode, "2026-06-16").heroes.Shion?.general.Subrole).toBe("Flanker");
            expect(patch(mode, "2026-07-14").heroes["D.Mon"]).toBeUndefined();
            expect(patch(mode, "2026-08-11").heroes["D.Mon"]?.general.Subrole).toBe("Stalwart");
        });

        it(`${mode}: represents map revisions on their actual dates`, () => {
            expect(patch(mode, "2026-06-16")["Map list"]["Neon Junction"]).toBe(1);
            expect(patch(mode, "2026-06-23")["Map list"]["Neon Junction"]).toBe(2);
            for (const name of ["Busan", "Eichenwalde", "Para\u00edso"]) {
                expect(patch(mode, "2026-08-11")["Map list"][name]).toBe(patch(mode, "2026-07-14")["Map list"][name] + 1);
            }
        });

        it(`${mode}: removes replaced perks and retains earlier entries`, () => {
            for (const [hero, removed, added, date, previous] of [
                ["Domina", "Power Move", "Corporate Retreat", "2026-06-16", "2026-05-12"],
                ["Bastion", "Armored Artillery", "Smart Bomb", "2026-06-16", "2026-05-12"],
                ["Orisa", "Charged Javelin", "Heavy Javelin", "2026-08-11", "2026-07-14"],
                ["Cassidy", "Even the Odds", "Giddy Up", "2026-08-11", "2026-07-14"],
                ["Echo", "High Beams", "Aerial Munitions", "2026-08-11", "2026-07-14"],
                ["Tracer", "Chronal Dash", "Temporal Regen", "2026-08-11", "2026-07-14"],
                ["Jetpack Cat", "Headbutt", "Purrfect Form", "2026-08-11", "2026-07-14"],
            ]) {
                expect((patch(mode, previous).heroes as any)[hero].perks[removed]).toBeDefined();
                expect((patch(mode, date).heroes as any)[hero].perks[removed]).toBeUndefined();
                expect((patch(mode, date).heroes as any)[hero].perks[added]).toBeDefined();
            }
        });

        it(`${mode}: calculates Shion primary DPS and Execution volley damage`, () => {
            const p = patch(mode, "2026-06-16");
            p.heroes = { Shion: p.heroes.Shion };
            const abilities = calculate(p).heroes.Shion!.abilities;
            expect(abilities["Kira Pistols"]["Damage per second"]).toBeCloseTo(140);
            expect(abilities["Kira Pistols"]["Damage per second(including reload)"]).toBeCloseTo(105);
            expect(abilities.Execution["Total normal damage"]).toBe(140);
            expect(abilities.Execution["Total headshot damage"]).toBe(280);
        });

        it(`${mode}: calculates D.Mon weapon rates without treating cast times as fire rates`, () => {
            for (const [date, saberDps, repeaterDps] of [
                ["2026-08-11", 91.2, 135], ["2026-08-12", 98.8, 144], ["2026-09-08", 91.2, 144],
            ] as const) {
                const p = patch(mode, date);
                p.heroes = { "D.Mon": p.heroes["D.Mon"] };
                const hero = calculate(p).heroes["D.Mon"]!;
                expect(hero.abilities["Plasma Saber"]["Damage per second"]).toBeCloseTo(saberDps);
                expect(hero.abilities["Fusion Repeater"]["Damage per second"]).toBeCloseTo(repeaterDps);
                expect(hero.abilities["Portable Fusion Repeater"]["Damage per second"]).toBeCloseTo(93.756);
                expect(hero.abilities["Portable Fusion Repeater"]["Damage per second(including reload)"]).toBeUndefined();
                if (mode === modes[0]) expect(hero.general["Total health"]).toBe(600);
                else expect(hero.general["Total health"]).toBeUndefined();
            }
        });

        it(`${mode}: preserves perk tiers and correctly separates Inspire from perks`, () => {
            const june = patch(mode, "2026-06-16");
            expect(june.heroes.Hazard!.perks!.Reconstitution.Tier).toBe("Minor");
            expect(june.heroes.Hazard!.perks!["Deep Leap"].Tier).toBe("Major");
            expect(patch(mode, "2026-08-11").heroes.Echo!.perks!["Focused Rush"].Tier).toBe("Major");
            const brig = patch(mode, "2026-07-14").heroes.Brigitte!;
            expect(brig.abilities.Inspire["Instant healing"]).toBe(12);
            expect(Number(brig.abilities.Inspire["Healing per second"]) * Number(brig.abilities.Inspire.Duration)).toBe(45);
            expect(brig.perks!.Whiplash.Damage).toBe(60);
            expect(patch(mode, "2026-09-08").heroes.Vendetta!.abilities["Palatine Fang"]["Average swing rate"]).toBeUndefined();
        });
    }

    it("keeps explicitly mode-specific changes in their own snapshots", () => {
        for (const [mode, cooldown] of [[modes[0], 10], [modes[1], 13]] as const) {
            expect(patch(mode, "2026-07-14").heroes["Junker Queen"]!.abilities["Commanding Shout"].Cooldown).toBe(cooldown);
        }
        const before = patch(modes[1], "2026-08-14"), after = patch(modes[1], "2026-09-08");
        expect(after.heroes["D.Va"]!.general["Base health"]).toBe(before.heroes["D.Va"]!.general["Base health"]);
        expect(after.heroes.Winston!.abilities["Barrier Projector"].Cooldown).toBe(before.heroes.Winston!.abilities["Barrier Projector"].Cooldown);
        expect(after.heroes.Zarya!.abilities["Particle Barrier"].Cooldown).toBe(before.heroes.Zarya!.abilities["Particle Barrier"].Cooldown);
        expect(after.heroes["D.Mon"]!.general["Armor health"]).toBe(300);
        expect(patch(modes[0], "2026-09-08").heroes["D.Mon"]!.general["Armor health"]).toBe(325);
    });

    it("uses official assets for both new heroes, every ability and every new perk", () => {
        const images = load<Record<string, string>>("image_map.json");
        const latest = patch(modes[0], "2026-09-08");
        const labels = ["Corporate Retreat", "Smart Bomb", "Heavy Javelin", "Giddy Up", "Aerial Munitions", "Temporal Regen", "Purrfect Form"];
        for (const hero of ["Shion", "D.Mon"] as const) {
            labels.push(hero, ...Object.keys(latest.heroes[hero]!.abilities), ...Object.keys(latest.heroes[hero]!.perks!));
        }
        for (const label of labels) expect(images[label], label).toMatch(/^https:\/\/d15f34w2p8l1cc\.cloudfront\.net\/overwatch\//);
        expect(images["Call Mech (D.Mon)"]).not.toBe(images["Call Mech"]);
        expect(load<Units>("units.json").heroes["D.Mon"]!.general["Pilot health"]).not.toContain("health");
    });
});
