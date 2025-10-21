import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isPatchData, isCalculationUnits } from "../schema.js";
import type { PatchData, Units } from "../schema.js";
import { isArrayMatchingTypeguard, isObjectWithValues, isString } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function loadJSON<T>(relativePath: string): T {
    const filePath = path.resolve(repoRoot, relativePath);
    const fileContents = readFileSync(filePath, "utf-8");
    return JSON.parse(fileContents) as T;
}

function loadPatchList(): Record<string, string[]> {
    const filePath = path.resolve(repoRoot, "patch_list.json");
    const fileContents = readFileSync(filePath, "utf-8");
    return JSON.parse(fileContents, (_key, value) => {
        if (typeof value === "string") {
            return value.replace(/(\.\w+)+$/, "");
        }
        return value;
    }) as Record<string, string[]>;
}

describe("static data integrity", () => {
    const patchList = loadPatchList();
    const isPatchList = isObjectWithValues(isArrayMatchingTypeguard(isString));

    it("patch_list.json should describe arrays of patch identifiers", () => {
        expect(isPatchList(patchList)).toBe(true);
    });

    it("units.json should match the calculation units schema", () => {
        const units = loadJSON<unknown>("units.json");
        expect(isCalculationUnits(units)).toBe(true);
    });

    describe("patch payloads", () => {
        const units: Units = (() => {
            const loaded = loadJSON<unknown>("units.json");
            if (!isCalculationUnits(loaded)) {
                throw new Error("units.json failed validation");
            }
            return loaded as Units;
        })();

        for (const [category, entries] of Object.entries(patchList)) {
            if (category === "Previous") continue;

            for (const patchName of entries) {
                const patchPath = path.join("patches", category, `${patchName}.json`);
                const fullPath = path.resolve(repoRoot, patchPath);

                it(`${category}/${patchName} should exist, match the schema, and have units`, () => {
                    expect(existsSync(fullPath), `${patchPath} is missing`).toBe(true);
                    const patchData = loadJSON<unknown>(patchPath);
                    expect(isPatchData(patchData), `${patchPath} failed validation`).toBe(true);
                    if (!isPatchData(patchData)) {
                        return;
                    }

                    const missingUnits = collectMissingUnits(patchData, units);
                    expect(missingUnits, `${patchPath} is missing unit definitions for: ${missingUnits.join(", ")}`).toEqual([]);
                });
            }
        }
    });
});
function collectMissingUnits(patch: PatchData, units: Units): string[] {
    const missing: string[] = [];

    for (const generalKey of Object.keys(patch.general)) {
        if (!(generalKey in units.general)) {
            missing.push(`general.${generalKey}`);
        }
    }

    for (const [roleName, roleChanges] of Object.entries(patch.roles)) {
        const roleUnits = units.roles[roleName];
        if (!roleUnits) {
            missing.push(`roles.${roleName}`);
            continue;
        }
        for (const changeKey of Object.keys(roleChanges)) {
            if (!(changeKey in roleUnits)) {
                missing.push(`roles.${roleName}.${changeKey}`);
            }
        }
    }

    for (const [heroName, heroData] of Object.entries(patch.heroes)) {
        const heroUnits = units.heroes[heroName as keyof typeof units.heroes];
        if (!heroUnits) {
            missing.push(`heroes.${heroName}`);
            continue;
        }

        for (const generalKey of Object.keys(heroData.general)) {
            if (!(generalKey in heroUnits.general)) {
                missing.push(`heroes.${heroName}.general.${generalKey}`);
            }
        }

        for (const [abilityName, abilityData] of Object.entries(heroData.abilities)) {
            const abilityUnits = heroUnits.abilities[abilityName];
            if (!abilityUnits) {
                missing.push(`heroes.${heroName}.abilities.${abilityName}`);
                continue;
            }

            for (const statName of Object.keys(abilityData)) {
                if (!(statName in abilityUnits)) {
                    missing.push(`heroes.${heroName}.abilities.${abilityName}.${statName}`);
                }
            }
        }

        if (heroData.perks) {
            if (!heroUnits.perks) {
                missing.push(`heroes.${heroName}.perks`);
            } else {
                for (const [perkName, perkData] of Object.entries(heroData.perks)) {
                    const perkUnits = heroUnits.perks[perkName];
                    if (!perkUnits) {
                        missing.push(`heroes.${heroName}.perks.${perkName}`);
                        continue;
                    }

                    for (const statName of Object.keys(perkData)) {
                        if (!(statName in perkUnits)) {
                            missing.push(`heroes.${heroName}.perks.${perkName}.${statName}`);
                        }
                    }
                }
            }
        }

        if (heroData.breakpoints) {
            if (!heroUnits.breakpoints) {
                missing.push(`heroes.${heroName}.breakpoints`);
            } else {
                for (const statName of Object.keys(heroData.breakpoints)) {
                    if (!(statName in heroUnits.breakpoints)) {
                        missing.push(`heroes.${heroName}.breakpoints.${statName}`);
                    }
                }
            }
        }
    }

    for (const [modeName, modeChanges] of Object.entries(patch.modes)) {
        const modeUnits = units.modes[modeName];
        if (!modeUnits) {
            missing.push(`modes.${modeName}`);
            continue;
        }
        for (const changeKey of Object.keys(modeChanges)) {
            if (!(changeKey in modeUnits)) {
                missing.push(`modes.${modeName}.${changeKey}`);
            }
        }
    }

    return missing;
}
