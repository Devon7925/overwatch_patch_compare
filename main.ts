// import units from "./units.json" with { type: "json" };
// cant use because firefox dumb https://bugzilla.mozilla.org/show_bug.cgi?id=1736059

import { autoTypeguard, erroringAutoTypeguard, erroringIsObjectWithValues, erroringIsString, isArrayMatchingTypeguard, isKeyOf, isLiteral, isNumber, isObjectWithValues, isString, isTupleMatchingTypeguards, partialTypeguard, reorder, Rest, rest, unionTypeguard, UnwrapSingleton } from "./utils.js"

type DisplayUnit = "percent" | "meters" | "seconds" | "health per second" | "meters per second" | "relative percent" | "flag" | "degrees"
type WithRemainder<T extends string, R extends any[]> = T extends any ? [T, ...R] : never
type WithAppend<T extends string | [string, ...any], R extends string> = R extends any ? (T extends [infer First extends string, ...infer Rest extends any[]] ? [`${First}${R}`, ...Rest] : T extends string ? `${T}${R}` : never) : never

type Situation = string
type DamageType = string
type CritType = string

type Unit =
    WithRemainder<"damage instance" | "healing instance" | "pellet count" | "bullets per burst", [DamageType]>
    | WithAppend<
        WithRemainder<"total instance" | "total", [DamageType]>
        | WithRemainder<"total instance crit" | "total crit", [DamageType, CritType]>
        | "total" | "total crit",
        " damage" | " healing">
    | ["situation", Situation]
    | ["special armor mitigation", DamageType]
    | ["display unit", DisplayUnit]
    | ["damage per second", DamageType]
    | ["critical multiplier", CritType] | ["critical multiplier", CritType, DamageType] | "bullets per burst" | "ammo" | "charges" | "reload time" | "health" | "breakpoint damage" | "time between shots" | "burst recovery time" | "reload time per ammo" | "ammo per shot" | "damage per second" | "healing per second"
type Value = string | number | boolean
type Hero = "D.Va" |
    "Doomfist" |
    "Junker Queen" |
    "Mauga" |
    "Orisa" |
    "Ramattra" |
    "Reinhardt" |
    "Roadhog" |
    "Sigma" |
    "Winston" |
    "Wrecking Ball" |
    "Zarya" |
    "Ashe" |
    "Bastion" |
    "Cassidy" |
    "Echo" |
    "Genji" |
    "Hanzo" |
    "Junkrat" |
    "Mei" |
    "Pharah" |
    "Reaper" |
    "Sojourn" |
    "Soldier: 76" |
    "Sombra" |
    "Symmetra" |
    "Torbjörn" |
    "Tracer" |
    "Venture" |
    "Widowmaker" |
    "Ana" |
    "Baptiste" |
    "Brigitte" |
    "Illari" |
    "Juno" |
    "Kiriko" |
    "Lifeweaver" |
    "Lúcio" |
    "Mercy" |
    "Moira" |
    "Zenyatta"
type PatchStructure<T> = {
    general: { [key: string]: T }
    roles: { [key: string]: { [key: string]: T } },
    heroes: {
        [key in Hero]?: {
            role: string,
            general: { [key: string]: T },
            abilities: { [key: string]: { [key: string]: T } }
            perks?: { [key: string]: { [key: string]: T } }
            breakpoints?: { [key: string]: T },
            breakpoints_data?: { [key: string]: { [key: string]: number } }
        }
    },
    "modes": {
        [key: string]: { [key: string]: T }
    }
}
type PatchData = PatchStructure<Value> & {
    "Map list": {
        [map: string]: number
    }
}
type UnitsStructure<T> = {
    general: { [key: string]: T },
    roles: { [key: string]: { [key: string]: T } },
    heroes: {
        [key in Hero]?: {
            general: { [key: string]: T },
            abilities: { [key: string]: { [key: string]: T } }
            perks?: { [key: string]: { [key: string]: T } }
            breakpoints?: { [key: string]: T },
            breakpoints_data?: { [key: string]: { [key: string]: number } }
        }
    },
    "modes": {
        [key: string]: { [key: string]: T }
    }
}
type Units = UnitsStructure<Unit[]>

type SpecialArmorBehavior = ["flat percent mit", number] | undefined

const patch_type_before_box = document.querySelector<HTMLSelectElement>("select#patch_type_before")!;
const patch_type_after_box = document.querySelector<HTMLSelectElement>("select#patch_type_after")!;
const patch_before_box = document.querySelector<HTMLSelectElement>("select#patch_before")!;
const patch_after_box = document.querySelector<HTMLSelectElement>("select#patch_after")!;
const display_calculated_properties_box = document.querySelector<HTMLInputElement>("input#disp_calc_props")!;
const display_breakpoints_box = document.querySelector<HTMLInputElement>("input#disp_breakpoints")!;
const apply_damage_to_armor_box = document.querySelector<HTMLInputElement>("input#apply_damage_to_armor")!;
const last_patch_buttons = document.querySelectorAll<HTMLButtonElement>(".last_patch_button")!;
const next_patch_buttons = document.querySelectorAll<HTMLButtonElement>(".next_patch_button")!;
const swap_patches_button = document.querySelector<HTMLButtonElement>("#swap-patches-button")!;
const patch_before_dmg_boost = document.querySelector<HTMLInputElement>("input#patch_before_dmg_boost")!;
const patch_before_dmg_boost_slider = document.querySelector<HTMLInputElement>("input#patch_before_dmg_boost_slider")!;
const patch_after_dmg_boost = document.querySelector<HTMLInputElement>("input#patch_after_dmg_boost")!;
const patch_after_dmg_boost_slider = document.querySelector<HTMLInputElement>("input#patch_after_dmg_boost_slider")!;

const patchList = await fetch("./patch_list.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text, (key, value) => {
        if (typeof value != "string") {
            return value;
        }
        return value.replace(/(\.\w+)+$/, "")
    })).then((patchList) => {
        if (!(isObjectWithValues(isArrayMatchingTypeguard(isString)))(patchList)) throw new Error("patchList could not be verified");
        return patchList;
    });

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
type SiteState = {
    before_patch: [string, string],
    after_patch: [string, string],
    show_calculated_properties: boolean,
    show_breakpoints: boolean,
    apply_to_armor: boolean,
    before_dmg_boost: number,
    after_dmg_boost: number,
};
let siteState: SiteState;
const DEFAULT_SITE_STATE: SiteState = {
    before_patch: ["Previous", "previous"],
    after_patch: ["Overwatch 2", "latest"],
    show_calculated_properties: false,
    show_breakpoints: false,
    apply_to_armor: false,
    before_dmg_boost: 1,
    after_dmg_boost: 1,
}

function patch_from_path(path: [string, string]): [string, string] {
    let versionType = path[0];
    let version = "";
    if (path[1] == "oldest") {
        version = patchList[path[0]][0];
    } else if (path[1] == "latest") {
        version = patchList[path[0]][patchList[path[0]].length - 1];
    } else if (path[1] == "recent") {
        version = patchList[path[0]][patchList[path[0]].length - 2];
    } else {
        version = path[1];
    }
    return [versionType, version]
}

{
    let patch_type_options = Object.entries(patchList)
        .map(([k, v], i) => `<option value="${k}">${k}</option>`).join();

    let patch_type_selectors = document.getElementsByClassName("patch-type-selector");
    for (let i = 0; i < patch_type_selectors.length; i++) {
        patch_type_selectors[i].innerHTML = patch_type_options;
    }
}

{
    siteState = structuredClone(DEFAULT_SITE_STATE)
    {
        let url_before = urlParams.get("before")
        if (url_before) {
            siteState.before_patch = url_before.split(":", 2) as [string, string]
        }
        let url_after = urlParams.get("after")
        if (url_after) {
            siteState.after_patch = url_after.split(":", 2) as [string, string]
        }
        url_before = urlParams.get("before_patch")
        if (url_before) {
            siteState.before_patch = url_before.split(":", 2) as [string, string]
        }
        url_after = urlParams.get("after_patch")
        if (url_after) {
            siteState.after_patch = url_after.split(":", 2) as [string, string]
        }
    }
    if (urlParams.get("show_calculated_properties")) {
        siteState.show_calculated_properties = urlParams.get("show_calculated_properties") === "true"
    }
    if (urlParams.get("show_breakpoints")) {
        siteState.show_breakpoints = urlParams.get("show_breakpoints") === "true"
    }
    if (urlParams.get("apply_to_armor")) {
        siteState.apply_to_armor = urlParams.get("apply_to_armor") === "true"
    }
    let before_dmg_boost_param = urlParams.get("before_dmg_boost")
    if (typeof before_dmg_boost_param == "string") {
        siteState.before_dmg_boost = parseFloat(before_dmg_boost_param)
    }
    let after_dmg_boost_param = urlParams.get("after_dmg_boost")
    if (typeof after_dmg_boost_param == "string") {
        siteState.after_dmg_boost = parseFloat(after_dmg_boost_param)
    }

    siteState.before_patch = patch_from_path(siteState.before_patch)
    siteState.after_patch = patch_from_path(siteState.after_patch)
    patch_type_before_box.value = siteState.before_patch[0];
    patch_type_after_box.value = siteState.after_patch[0];
}

{
    let newUrlParams = new URLSearchParams();
    let encoded: { [key: string]: any } = structuredClone(siteState);
    if (Array.isArray(encoded["before_patch"])) {
        encoded["before_patch"] = encoded["before_patch"].join(":")
    }
    if (Array.isArray(encoded["after_patch"])) {
        encoded["after_patch"] = encoded["after_patch"].join(":")
    }

    for (let key in encoded) {
        newUrlParams.append(key, `${encoded[key]}`)
    }
    window.history.replaceState(siteState, "", "index.html?" + newUrlParams)
}

const isDisplayUnit = unionTypeguard<DisplayUnit>([
    isLiteral("percent"),
    isLiteral("meters"),
    isLiteral("seconds"),
    isLiteral("health per second"),
    isLiteral("meters per second"),
    isLiteral("relative percent"),
    isLiteral("flag"),
    isLiteral("degrees"),
])
const isUnit = unionTypeguard<Unit>([
    isLiteral("bullets per burst"),
    isTupleMatchingTypeguards(isLiteral("damage instance"), isString),
    isTupleMatchingTypeguards(isLiteral("healing instance"), isString),
    isTupleMatchingTypeguards(isLiteral("pellet count"), isString),
    isTupleMatchingTypeguards(isLiteral("bullets per burst"), isString),
    isLiteral("total damage"),
    isTupleMatchingTypeguards(isLiteral("total instance damage"), isString),
    isTupleMatchingTypeguards(isLiteral("total damage"), isString),
    isLiteral("total crit damage"),
    isTupleMatchingTypeguards(isLiteral("total instance crit damage"), isString, isString),
    isTupleMatchingTypeguards(isLiteral("total crit damage"), isString, isString),
    isLiteral("total healing"),
    isTupleMatchingTypeguards(isLiteral("total instance healing"), isString),
    isTupleMatchingTypeguards(isLiteral("total healing"), isString),
    isLiteral("total crit healing"),
    isTupleMatchingTypeguards(isLiteral("total instance crit healing"), isString, isString),
    isTupleMatchingTypeguards(isLiteral("total crit healing"), isString, isString),
    isTupleMatchingTypeguards(isLiteral("situation"), isString),
    isTupleMatchingTypeguards(isLiteral("special armor mitigation"), isString),
    isTupleMatchingTypeguards(isLiteral("display unit"), isDisplayUnit),
    isTupleMatchingTypeguards(isLiteral("damage per second"), isString),
    isTupleMatchingTypeguards(isLiteral("critical multiplier"), isString),
    isTupleMatchingTypeguards(isLiteral("critical multiplier"), isString, isString),
    isLiteral("ammo"),
    isLiteral("charges"),
    isLiteral("reload time"),
    isLiteral("health"),
    isLiteral("breakpoint damage"),
    isLiteral("time between shots"),
    isLiteral("burst recovery time"),
    isLiteral("reload time per ammo"),
    isLiteral("ammo per shot"),
    isLiteral("damage per second"),
    isLiteral("healing per second"),
])
const isCalculationUnits = erroringAutoTypeguard<Units>({
    general: isObjectWithValues(isArrayMatchingTypeguard(isUnit)),
    roles: erroringIsObjectWithValues(erroringIsObjectWithValues(isArrayMatchingTypeguard(isUnit))),
    heroes: erroringIsObjectWithValues(autoTypeguard({
        general: erroringIsObjectWithValues(isArrayMatchingTypeguard(isUnit)),
        abilities: erroringIsObjectWithValues(isObjectWithValues(isArrayMatchingTypeguard(isUnit))),
    }, {
        perks: erroringIsObjectWithValues(isObjectWithValues(isArrayMatchingTypeguard(isUnit))),
        breakpoints: isObjectWithValues(isArrayMatchingTypeguard(isUnit)),
        breakpoints_data: isObjectWithValues(isObjectWithValues(isNumber))
    })),
    modes: isObjectWithValues(isObjectWithValues(isArrayMatchingTypeguard(isUnit)))
}, {})
const isValue = unionTypeguard<Value>([isString, isNumber, isLiteral(false), isLiteral(true)])
const isPatchData = erroringAutoTypeguard<PatchData>({
    general: isObjectWithValues(isValue),
    roles: erroringIsObjectWithValues(erroringIsObjectWithValues(isValue)),
    heroes: erroringIsObjectWithValues(erroringAutoTypeguard({
        role: erroringIsString,
        general: erroringIsObjectWithValues(isValue),
        abilities: erroringIsObjectWithValues(erroringIsObjectWithValues(isValue)),
    }, {
        perks: erroringIsObjectWithValues(erroringIsObjectWithValues(isValue)),
        breakpoints: isObjectWithValues(isValue),
        breakpoints_data: isObjectWithValues(isObjectWithValues(isNumber))
    })),
    modes: isObjectWithValues(isObjectWithValues(isValue)),
    "Map list": isObjectWithValues(isNumber),
}, {})

let units: Units;
let image_map: { [key: string]: string } = {};
export let patches: { [key: string]: { [key: string]: PatchData } } = {};

let promises: Promise<unknown>[] = [];
promises.push(fetch("./units.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text))
    .then((possible_calculation_units) => {
        if (!isCalculationUnits(possible_calculation_units)) throw new Error("Units are incorrect")
        return possible_calculation_units
    })
    .then((units_data) => units = units_data))
promises.push(fetch("./image_map.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text))
    .then((possible_hero_images) => {
        if (!(isObjectWithValues(isString))(possible_hero_images)) throw new Error("Images are incorrect")
        return possible_hero_images
    })
    .then((hero_images_data) => image_map = hero_images_data))
await Promise.all(promises);

function isEmpty(obj: any) {
    for (var i in obj) { return false; }
    return true;
}

function round(num: number, decimalPlaces = 0) {
    num = Math.round(parseFloat(num + "e" + decimalPlaces));
    return Number(num + "e" + -decimalPlaces);
}

type Changes<T> = (
    T extends string ? [string, string] :
    T extends number ? [number, number] :
    T extends object ? { [K in keyof T]: (string extends K ? ([undefined, T[K]] | [T[K], undefined]) : (undefined extends T[K] ? ([undefined, T[K]] | [T[K], undefined]) : never)) | Changes<T[K]> } :
    never) | T
export function convert_to_changes<T extends { [key: string]: any }>(before: T, after: T, preserved_keys: string[]): Changes<T>;
export function convert_to_changes(before: any, after: any, preserved_keys: string[]) {
    if (typeof before == "object" && typeof after == "object") {
        let result: { [key: string]: any } = {};
        let real_changes = false;
        for (let key in before) {
            if (before[key] != after[key]) {
                let changes = convert_to_changes(before[key], after[key], preserved_keys);
                if (!isEmpty(changes)) {
                    result[key] = changes;
                    real_changes = true;
                }
            } else if (preserved_keys.includes(key)) {
                result[key] = after[key];
            }
        }
        for (let key in after) {
            if (!(key in before)) {
                result[key] = [undefined, after[key]];
                real_changes = true;
            }
        }
        if (!real_changes) {
            return {};
        }
        return result;
    }
    return [before, after];
}

export function getChangeText(name: string, change: [any, any] | string | number | boolean, units: DisplayUnit | undefined, display_as_new: boolean) {
    if (!Array.isArray(change)) {
        change = [undefined, change]
    }
    if (typeof change[0] === "number") {
        change[0] = round(change[0], 2)
    }
    if (typeof change[1] === "number") {
        change[1] = round(change[1], 2)
    }
    const unitDisplayMap: Partial<Record<DisplayUnit, string>> = {
        "percent": "%",
        "meters": " meters",
        "meters per second": " meters per second",
        "health per second": " health per second",
        "seconds": " seconds",
        "degrees": " degrees",
    }
    if (change[0] === undefined) {
        let new_value = change[1];
        if (!Array.isArray(change)) {
            new_value = change;
        }
        let prefix = display_as_new ? "" : "There is now "
        if (units == undefined) {
            return `${prefix}${new_value} ${name.toLowerCase()}.`;
        } else if (unitDisplayMap[units]) {
            return `${prefix}${new_value}${unitDisplayMap[units]} ${name.toLowerCase()}.`;
        } else if (units == "flag") {
            if (display_as_new) {
                if (new_value === false) {
                    return `Doesn't ${name}.`;
                } else {
                    return `Does ${name}.`;
                }
            }
            if (new_value === false) {
                return `No longer ${name}.`;
            } else {
                return `Now ${name}.`;
            }
        } else if (units == "relative percent") {
            return `${prefix}${new_value} ${name.toLowerCase()}.`;
        } else {
            // Exhaustiveness check
            throw new Error(`Invalid units "${units}" for ${name}`)
        }
    } else if (typeof change[0] == "number") {
        let change_type = "increased";
        if (change[0] > change[1]) {
            change_type = "reduced";
        }
        if (change[1] === undefined) {
            return `${name} removed.`;
        } else if (units == undefined) {
            return `${name} ${change_type} from ${change[0]} to ${change[1]}.`;
        } else if (unitDisplayMap[units] != undefined) {
            return `${name} ${change_type} from ${change[0]} to ${change[1]}${unitDisplayMap[units]}.`;
        } else if (units == "relative percent") {
            if (change[0] > change[1]) {
                return `${name} reduced by ${round(100 * (1.0 - change[1] / change[0]), 2)}%.`;
            } else {
                return `${name} increased by ${round(100 * (change[1] / change[0] - 1.0), 2)}%.`;
            }
        } else if (units == "flag") {
            throw new Error(`Number ${name} should not be a flag`)
        } else {
            // Exhaustiveness check
            throw new Error(`Invalid units "${units}" for ${name}`)
        }
    } else if (typeof change[0] == "boolean") {
        let change_type = "Now";
        if (change[0]) {
            change_type = "No longer";
        }
        return `${change_type} ${name}.`;
    } else if (typeof change[0] == "string") {
        return `${name} changed from ${change[0]} to ${change[1]}.`;
    }
}

pair_box_slider(patch_before_dmg_boost, patch_before_dmg_boost_slider);
pair_box_slider(patch_after_dmg_boost, patch_after_dmg_boost_slider);
function pair_box_slider(patch_after_dmg_boost: HTMLInputElement, patch_after_dmg_boost_slider: HTMLInputElement) {
    let min_val = parseFloat(patch_after_dmg_boost_slider.min)
    let max_val = parseFloat(patch_after_dmg_boost_slider.max)
    let oldValue = patch_after_dmg_boost_slider.value;
    patch_after_dmg_boost.oninput = (e) => {
        let value = parseFloat(patch_after_dmg_boost.value);
        if (patch_after_dmg_boost.value === "") {
            patch_after_dmg_boost.value = "0"
        } else if (+patch_after_dmg_boost.value !== +patch_after_dmg_boost.value || value < min_val || value > max_val || isNaN(value)) {
            patch_after_dmg_boost.value = oldValue;
        }
        patch_after_dmg_boost.value = "" + parseFloat(patch_after_dmg_boost.value)
        oldValue = patch_after_dmg_boost.value
        patch_after_dmg_boost_slider.value = oldValue
    }
    patch_after_dmg_boost_slider.oninput = (e) => {
        let value = parseFloat(patch_after_dmg_boost_slider.value);
        oldValue = patch_after_dmg_boost_slider.value
        patch_after_dmg_boost.value = oldValue
    }
}

type FilteredUnits<T extends Unit[0]> = Extract<Unit, [T, ...any]>
function getUnitsOfType<T extends Unit[0]>(units: Unit[], type: T): FilteredUnits<T>[] {
    return units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == type) as FilteredUnits<T>[]
}
type FilteredArrayUnitData<T extends Unit[0]> = Rest<FilteredUnits<T>>
function getUnitArrayDataOfType<T extends Unit[0]>(units: Unit[], type: T): FilteredArrayUnitData<T>[] {
    return getUnitsOfType(units, type).map(rest) as FilteredArrayUnitData<T>[]
}
type FilteredUnitData<T extends Unit[0]> = UnwrapSingleton<FilteredArrayUnitData<T>>
function getUnitDataOfType<T extends Unit[0]>(units: Unit[], type: T): FilteredUnitData<T>[] {
    return getUnitArrayDataOfType(units, type).map((unit) => unit.length == 1 ? unit[0] : unit) as FilteredUnitData<T>[]
}

function getDisplayUnit(units: Unit[]): DisplayUnit | undefined {
    if (units == undefined) {
        return undefined
    }
    let display_units = getUnitDataOfType(units, "display unit")
    if (display_units.length > 1) {
        throw new Error(`More than one display unit`)
    }
    return display_units[0]
}

function processPatch(patch: PatchData, multiplier: number): [PatchData, number | null] {
    let patch_data = structuredClone(patch);
    verifyPatchNotes(patch_data, units)
    patch_data = reorder(patch_data, units)
    patch_data = applyDamageMultiplier(patch_data, multiplier, units)
    if (siteState.show_calculated_properties) {
        patch_data = calculatePreArmorProperties(patch_data, units)
    }
    let special_armor_behaviors = getSpecialArmorBehaviors(patch_data, units);

    if (siteState.apply_to_armor) {
        patch_data = applyArmor(patch_data, units, special_armor_behaviors)
    }
    if (siteState.show_calculated_properties) {
        patch_data = calculatePostArmorProperties(patch_data, units)
    }
    let max_damage_break_point: number | null = null
    if (siteState.show_breakpoints) {
        let damage_break_point_values = getBreakpointHealthValues(patch_data)
        patch_data = calculateBreakpoints(patch_data, units, damage_break_point_values)
        max_damage_break_point = damage_break_point_values.at(-1) || null
    }
    if (siteState.show_calculated_properties) {
        patch_data = calculateRates(patch_data, units)
        patch_data = cleanupProperties(patch_data, units)
    }
    return [patch_data, max_damage_break_point]
}

async function updatePatchNotes() {
    resetUI()

    let before_patch = resolvePatch(siteState.before_patch)
    let after_patch = resolvePatch(siteState.after_patch)
    await Promise.all([before_patch, after_patch]
        .filter((patch) => !(patch[0] in patches) || !(patch[1] in patches[patch[0]]))
        .map(async (patch) => {
            return fetch(`./patches/${patch[0]}/${patch[1]}.json`)
                .then((res) => res.text())
                .then((text) => {
                    let patch_data = JSON.parse(text);
                    if (!isPatchData(patch_data)) {
                        console.error("Invalid patch data", patch_data)
                        throw new Error("Invalid patch data")
                    }
                    if (patches[patch[0]] === undefined) patches[patch[0]] = {}
                    patches[patch[0]][patch[1]] = patch_data;
                })
        }))
    let [before_patch_data, before_max_breakpoint] = processPatch(patches[before_patch[0]][before_patch[1]], parseFloat(patch_before_dmg_boost_slider.value) / 100);
    let [after_patch_data, after_max_breakpoint] = processPatch(patches[after_patch[0]][after_patch[1]], parseFloat(patch_after_dmg_boost_slider.value) / 100);
    let changes = convert_to_changes(before_patch_data, after_patch_data, ["role"]);

    if (changes.roles == undefined) changes.roles = {};
    for (let role in before_patch_data.roles) {
        if (changes.roles[role] == undefined) changes.roles[role] = {}
    }
    for (let role in after_patch_data.roles) {
        if (changes.roles[role] == undefined) changes.roles[role] = {}
    }

    if (siteState.show_breakpoints) {
        changes = removeRedundantBreakpoints(changes, after_patch_data);
    }

    let breakpoint_data: [number, number] | null = [0, 0]
    if (before_max_breakpoint !== null) {
        breakpoint_data[0] = before_max_breakpoint
    }
    if (after_max_breakpoint !== null) {
        breakpoint_data[1] = after_max_breakpoint
    }
    if (before_max_breakpoint === null && after_max_breakpoint === null) {
        breakpoint_data = null
    }

    displayPatchNotes(changes, breakpoint_data);
}

function resolvePatch(patch: [string, string]): [string, string] {
    if (patch[0] == "Previous") {
        return getPreviousPatch()
    }
    return patch
}

function resetUI() {
    updatePatchSelectors(siteState.before_patch, patch_type_before_box, patch_before_box);
    updatePatchSelectors(siteState.after_patch, patch_type_after_box, patch_after_box);
    display_calculated_properties_box.checked = siteState.show_calculated_properties

    let extra_controls_display = "flex"
    if (!siteState.show_calculated_properties) {
        extra_controls_display = "none"
        siteState.before_dmg_boost = 1
        siteState.after_dmg_boost = 1
        siteState.show_breakpoints = false
        siteState.apply_to_armor = false
    }
    (display_breakpoints_box.parentElement?.parentElement?.parentElement as HTMLElement).style.display = extra_controls_display;
    (apply_damage_to_armor_box.parentElement?.parentElement?.parentElement as HTMLElement).style.display = extra_controls_display;
    (patch_before_dmg_boost.parentElement?.parentElement as HTMLElement).style.display = extra_controls_display;
    (patch_after_dmg_boost.parentElement?.parentElement as HTMLElement).style.display = extra_controls_display

    display_breakpoints_box.checked = siteState.show_breakpoints
    apply_damage_to_armor_box.checked = siteState.apply_to_armor
    patch_before_dmg_boost.value = "" + (100 * siteState.before_dmg_boost)
    patch_before_dmg_boost_slider.value = "" + (100 * siteState.before_dmg_boost)
    patch_after_dmg_boost.value = "" + (100 * siteState.after_dmg_boost)
    patch_after_dmg_boost_slider.value = "" + (100 * siteState.after_dmg_boost)

    {
        let urlParams = new URLSearchParams()
        let key: keyof typeof siteState
        for (key in siteState) {
            if (siteState[key] !== DEFAULT_SITE_STATE[key]) {
                let encoding: any = siteState[key];
                if (Array.isArray(encoding)) {
                    encoding = encoding.join(":")
                }
                urlParams.append(key, `${encoding}`)
            }
        }
        window.history.replaceState(siteState, "", "?" + urlParams)
    }

    {
        const last_patch_exists = !patchEquals(siteState.after_patch, getShiftedPatch(siteState.after_patch, -1)) && !patchEquals(siteState.before_patch, getShiftedPatch(siteState.before_patch, -1))
        const next_patch_exists = !patchEquals(siteState.after_patch, getShiftedPatch(siteState.after_patch, 1)) && !patchEquals(siteState.before_patch, getShiftedPatch(siteState.before_patch, 1))
        last_patch_buttons.forEach((last_patch_button) => last_patch_button.style.visibility = last_patch_exists ? 'visible' : 'hidden')
        next_patch_buttons.forEach((next_patch_button) => next_patch_button.style.visibility = next_patch_exists ? 'visible' : 'hidden')
    }
}

function patchEquals(patch1: [string, string], patch2: [string, string]) {
    if (patch1[0] == "Previous") return false;
    return patch1[0] == patch2[0] && patch1[1] == patch2[1];
}

function displayPatchNotes(changes: Changes<PatchData>, breakpoint_data: [number, number] | null) {
    let hero_section = document.getElementsByClassName("PatchNotes-section-hero_update")[0]
    if (Object.keys(changes).length === 0) {
        hero_section.innerHTML = "<h2>No changes to show</h2>"
        return;
    }
    hero_section.innerHTML = ""
    if (changes.general) {
        let changeRender = ""
        for (let generalRule in changes.general) {
            changeRender += `<li>${getChangeText(generalRule, changes.general[generalRule], getDisplayUnit(units.general[generalRule]), false)}</li>`
        }
        hero_section.innerHTML += `
            <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Hero Updates</h4>
                <div class="PatchNotes-update PatchNotes-section-generic_update"></div>
                <div class="PatchNotesGeneralUpdate">
                    <div class="PatchNotesGeneralUpdate-title">General</div>
                    <div class="PatchNotesGeneralUpdate-description">
                        <ul>
                            ${changeRender}
                        </ul>
                    </div>
                </div>
            </div>
        `
    }
    const heroesData = changes.heroes
    if (heroesData != undefined) {
        for (let role in changes.roles) {
            let generalChangeRender = ""
            let roleData = changes.roles[role]
            let isNewRole = false;
            if (Array.isArray(roleData)) {
                if (roleData[1] != undefined) {
                    isNewRole = true;
                    roleData = roleData[1];
                } else {
                    hero_section.innerHTML += `
                    <div class="PatchNotes-section PatchNotes-section-hero_update">
                        <h4 class="PatchNotes-sectionTitle">${role} Removed</h4>
                        <div class="PatchNotes-update PatchNotes-section-hero_update"></div>
                    </div>
                    `;
                    continue;
                }
            }

            for (let generalRule in roleData) {
                generalChangeRender += `<li>${getChangeText(generalRule, roleData[generalRule], getDisplayUnit(units.roles[role][generalRule]), false)}</li>`
            }
            if (generalChangeRender != "") {
                generalChangeRender = `
                    <div class="PatchNotes-sectionDescription">
                        <ul>
                            ${generalChangeRender}
                        </ul>
                    </div>
                `;
            }

            let heroChanges = ""
            for (let hero of Object.keys(heroesData).sort()) {
                if (!isKeyOf(heroesData, hero)) {
                    throw new Error("Invalid state")
                }
                let generalChangesRender = ""
                let heroData = heroesData[hero]

                let display_as_new = false
                if (Array.isArray(heroData)) {
                    if (heroData[1] !== undefined) {
                        heroData = heroData[1]
                        display_as_new = true
                    } else {
                        heroChanges += renderHeroChanges(hero, false, `<li>Removed</li>`, "", "")
                        continue
                    }
                }
                if (heroData === undefined) {
                    throw new Error("Invalid state")
                }

                if (Array.isArray(heroData.role)) {
                    if (heroData.role[1] != role) continue
                } else if (heroData.role != role) continue

                if (units.heroes[hero] === undefined) {
                    throw new Error(`Units is missing hero ${hero}`)
                }
                if (Array.isArray(heroData.role)) {
                    generalChangesRender += `<li>${getChangeText("Role", heroData.role, undefined, display_as_new)}</li>`
                }
                if (heroData.general) {
                    for (let property in heroData.general) {
                        generalChangesRender += `<li>${getChangeText(property, heroData.general[property], getDisplayUnit(units.heroes[hero].general[property]), display_as_new)}</li>`
                    }
                }
                let abilities = ""
                for (let ability in heroData.abilities) {
                    let ability_changes = ""
                    let abilityData = heroData.abilities[ability]
                    let display_ability_as_new = display_as_new
                    if (Array.isArray(abilityData)) {
                        if (abilityData[1] != undefined) {
                            abilityData = abilityData[1]
                            display_ability_as_new = true
                        } else {
                            abilities += renderAbility(ability, false, `<li>Removed</li>`)
                            continue
                        }
                    }
                    for (let stat in abilityData) {
                        if (!units.heroes[hero].abilities[ability]) {
                            console.error(`Missing ability units for ${hero} - ${ability}`)
                            break
                        }
                        if (!(stat in units.heroes[hero].abilities[ability])) {
                            console.error(`Missing units for ${hero} - ${ability} - ${stat}`)
                        }
                        ability_changes += `<li>${getChangeText(stat, abilityData[stat], getDisplayUnit(units.heroes[hero].abilities[ability][stat]), display_ability_as_new)}</li>`
                    }
                    abilities += renderAbility(ability, display_ability_as_new, ability_changes)
                }
                
                if (Array.isArray(heroData.perks)) {
                    if(heroData.perks[1] != undefined) {
                        heroData.perks = heroData.perks[1]
                    } else {
                        abilities += "<li>Perks removed</li>";
                        heroData.perks = undefined;
                    }
                }
                if("perks" in heroData) {
                    for (let ability in heroData.perks) {
                        let ability_changes = ""
                        let abilityData = heroData.perks[ability]
                        let display_ability_as_new = display_as_new
                        if (Array.isArray(abilityData)) {
                            if (abilityData[1] != undefined) {
                                abilityData = abilityData[1]
                                display_ability_as_new = true
                            } else {
                                abilities += renderAbility(ability, false, `<li>Removed</li>`)
                                continue
                            }
                        }
                        for (let stat in abilityData) {
                            if (!units.heroes[hero].abilities[ability]) {
                                console.error(`Missing ability units for ${hero} - ${ability}`)
                                break
                            }
                            if (!(stat in units.heroes[hero].abilities[ability])) {
                                console.error(`Missing units for ${hero} - ${ability} - ${stat}`)
                            }
                            ability_changes += `<li>${getChangeText(stat, abilityData[stat], getDisplayUnit(units.heroes[hero].abilities[ability][stat]), display_ability_as_new)}</li>`
                        }
                        abilities += renderAbility(ability, display_ability_as_new, ability_changes)
                    }
                }
                let breakpointsRender = ""
                if (heroData.breakpoints) {
                    if (breakpoint_data === null) {
                        throw new Error("Invalid State")
                    }
                    if (Array.isArray(heroData.breakpoints)) {
                        throw new Error("Invalid State")
                    }
                    for (let property in heroData.breakpoints) {
                        if (Array.isArray(heroData.breakpoints[property])) {
                            if (heroData.breakpoints[property][0] === breakpoint_data[0]) continue
                            if (heroData.breakpoints[property][1] === breakpoint_data[1]) continue
                        } else if (typeof heroData.breakpoints[property] === "number") {
                            if (heroData.breakpoints[property] === Math.max(breakpoint_data[0], breakpoint_data[1])) continue
                        }
                        breakpointsRender += `<li>${getChangeText(property, heroData.breakpoints[property], undefined, true)}</li>`
                    }
                }
                heroChanges += renderHeroChanges(hero, display_as_new, generalChangesRender, abilities, `<ul>${breakpointsRender}</ul>`)
            }
            if (generalChangeRender == "" && heroChanges == "") continue;
            hero_section.innerHTML += `
            <div class="PatchNotes-section PatchNotes-section-hero_update">
                <h4 class="PatchNotes-sectionTitle">${isNewRole ? "(NEW) " : ""}${role}</h4>
                ${generalChangeRender}
                <div class="PatchNotes-update PatchNotes-section-hero_update"></div>
                ${heroChanges}
            </div>
            `
        }
    }
    if (changes["Map list"]) {
        let change_render = ""
        for (let map in changes["Map list"]) {
            let map_change = changes["Map list"][map]
            if (!Array.isArray(map_change)) {
                map_change = [undefined, map_change]
            }
            if (map_change[0] === undefined) {
                change_render += `<li>New map ${map}.</li>`
            } else if (map_change[1] === undefined) {
                change_render += `<li>${map} removed.</li>`
            } else{
                change_render += `<li>${map} majorly updated.</li>`
            }
        }
        hero_section.innerHTML += `
            <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Map Updates</h4>
                <div class="PatchNotes-update PatchNotes-section-generic_update"></div>
                <div class="PatchNotesGeneralUpdate">
                    <div class="PatchNotesGeneralUpdate-description">
                        <ul>
                            ${change_render}
                        </ul>
                    </div>
                </div>
            </div>
        `
    }

    if (changes.modes) {
        let changeRender = ""
        for (let mode in changes.modes) {
            if (Array.isArray(changes.modes[mode])) {
                if (changes.modes[mode][1] == undefined) {
                    changeRender += renderModeChanges(mode, "<li>Removed</li>")
                } else {
                    let mode_changes = "<li>Mode added</li>"
                    for (let change in changes.modes[mode][1]) {
                        mode_changes += `<li>${getChangeText(change, [undefined, changes.modes[mode][1][change]], getDisplayUnit(units.modes[mode][change]), true)}</li>`
                    }
                    changeRender += renderModeChanges(mode, mode_changes)
                }
                continue
            }
            let mode_changes = ""
            for (let change in changes.modes[mode]) {
                mode_changes += `<li>${getChangeText(change, changes.modes[mode][change], getDisplayUnit(units.modes[mode][change]), false)}</li>`
            }
            changeRender += renderModeChanges(mode, mode_changes)
        }
        hero_section.innerHTML += `
            <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Mode Updates</h4>
                <div class="PatchNotes-update PatchNotes-section-generic_update"></div>
                <div class="PatchNotesGeneralUpdate">
                    ${changeRender}
                </div>
            </div>
        `
    }
}

function renderModeChanges(mode: string, changes: string) {
    return `
        <div class="PatchNotesGeneralUpdate-title">${mode}</div>
        <div class="PatchNotesGeneralUpdate-description">
            <ul>${changes}</ul>
        </div>`
}

function renderAbility(ability: string, display_ability_as_new: boolean, ability_changes: string) {
    return `
        <div class="PatchNotesAbilityUpdate">
            <div class="PatchNotesAbilityUpdate-icon-container"><img class="PatchNotesAbilityUpdate-icon" src="${image_map[ability]}">
            </div>
            <div class="PatchNotesAbilityUpdate-text">
                <div class="PatchNotesAbilityUpdate-name">${display_ability_as_new ? "(NEW) " : ""}${ability}</div>
                <div class="PatchNotesAbilityUpdate-detailList">
                    <ul>
                        ${ability_changes}
                    </ul>
                </div>
            </div>
        </div>`
}

function renderHeroChanges(hero: string, display_as_new: boolean, generalChangesRender: string, abilities: string, breakpointsRender: string) {
    return `
        <div class="PatchNotesHeroUpdate">
            <div class="PatchNotesHeroUpdate-header"><img class="PatchNotesHeroUpdate-icon" src="${image_map[hero]}">
                <h5 class="PatchNotesHeroUpdate-name">${display_as_new ? "(NEW) " : ""}${hero}</h5>
            </div>
            <div class="PatchNotesHeroUpdate-body">
                <div class="PatchNotesHeroUpdate-generalUpdates">
                    <ul>
                        ${generalChangesRender}
                    </ul>
                </div>
                <div class="PatchNotesHeroUpdate-abilitiesList">
                    ${abilities}
                </div>
                <div class="PatchNotesHeroUpdate-generalUpdates">
                    ${breakpointsRender}
                </div>
            </div>
        </div>`
}

export function verifyPatchNotes(patch_data: PatchData, units: Units) {
    for (let general_property in patch_data.general) {
        let property_units = units.general[general_property]
        if (property_units === undefined) {
            console.error(`Cannot find units for ${general_property}`)
        }
    }

    forEachHero(patch_data, units, (heroData, heroUnits, hero) => {
        for (let general_property in heroData.general) {
            let property_units = heroUnits.general[general_property]
            if (property_units === undefined) {
                console.error(`Cannot find units for ${hero} - ${general_property}`)
            }
        }
        for (let ability in heroData.abilities) {
            let ability_units = heroUnits.abilities[ability];
            if (ability_units === undefined) {
                console.error(`Cannot find units for ${hero} - ${ability}`);
                continue;
            }
            for (let ability_property in heroData.abilities[ability]) {
                let property_units = heroUnits.abilities[ability][ability_property];
                if (property_units === undefined) {
                    console.error(`Cannot find units for ${hero} - ${ability} - ${ability_property}`)
                }
            }
        }
    })

    for (let mode in patch_data.modes) {
        if (units.modes[mode] === undefined) {
            console.error(`Cannot find units for ${mode}`)
        }
        for (let change in patch_data.modes[mode]) {
            if (units.modes[mode][change] === undefined) {
                console.error(`Cannot find units for ${mode} - ${change}`)
            }
        }
    }
}

function forEachHero(patch_data: PatchData, calculation_units: Units, callback: (heroData: NonNullable<PatchData["heroes"][Hero]>, heroUnits: NonNullable<Units["heroes"][Hero]>, hero: string) => void) {
    for (let hero in patch_data.heroes) {
        if (!isKeyOf(patch_data.heroes, hero)) {
            throw new Error("Invalid state")
        }
        let heroData = patch_data.heroes[hero];
        let heroUnits = calculation_units.heroes[hero];
        if (heroData === undefined) {
            throw new Error("Invalid state")
        }
        if (heroUnits === undefined) {
            throw new Error("Invalid state")
        }

        callback(heroData, heroUnits, hero)
    }
}

function forEachAbility(patch_data: PatchData, calculation_units: Units, callback: (abilityData: NonNullable<PatchData["heroes"][Hero]>["abilities"][string], abilityUnits: NonNullable<Units["heroes"][Hero]>["abilities"][string], ability: string, heroData: NonNullable<PatchData["heroes"][Hero]>) => void) {
    forEachHero(patch_data, calculation_units, (heroData, heroUnits) => {
        for (let ability in heroData.abilities) {
            const abilityData = heroData.abilities[ability];
            const abilityDataUnits = heroUnits.abilities[ability];

            callback(abilityData, abilityDataUnits, ability, heroData)
        }
    })
}

function assignValueAndUnits<T, U>(patch_data: { [key: string]: T }, calculation_units: { [key: string]: U }, property: string, value: T, units: U) {
    patch_data[property] = value
    calculation_units[property] = units
}

export function applyDamageMultiplier(patch_data: PatchData, multiplier: number, calculation_units: Units): PatchData {
    if (typeof patch_data.general["Quick melee damage"] == "number") {
        patch_data.general["Quick melee damage"] *= multiplier
    }
    forEachAbility(patch_data, calculation_units, (abilityData, abilityUnits) => {
        for (let ability_property in abilityData) {
            let property_units = abilityUnits[ability_property]

            if (typeof abilityData[ability_property] !== "number") {
                continue;
            }

            if (property_units.some((unit) => ["damage instance"].includes(unit[0]))) {
                abilityData[ability_property] *= multiplier
            }
        }
    })
    return patch_data
}

export function calculatePreArmorProperties(patch_data: PatchData, calculation_units: Units) {
    forEachAbility(patch_data, calculation_units, (abilityData, abilityUnits) => {
        for (let ability_property in abilityData) {
            let property_units = abilityUnits[ability_property]

            if (typeof abilityData[ability_property] !== "number") {
                continue;
            }

            if (property_units.some((unit) => Array.isArray(unit) && unit[0] === "damage per second")) {
                abilityUnits[ability_property].push("damage per second")
            }
        }
        for (let damage_or_healing of ["damage", "healing"] as const) {
            let total_damage = Object.keys(abilityData)
                .flatMap((property) => {
                    let situations = getUnitDataOfType(abilityUnits[property], "situation")
                    if (situations.length == 0) {
                        situations.push("normal")
                    }
                    return getUnitsOfType(abilityUnits[property], `${damage_or_healing} instance`)
                        .map((unit) => [unit[1], abilityData[property], situations] as const)
                })
                .reduce<{ [key: string]: [string, number][] }>((acc, [dmg_type, amount, situations]) => {
                    if (!(dmg_type in acc)) acc[dmg_type] = [];
                    if (typeof amount !== "number") {
                        return acc
                    }

                    for (let situation of situations) {
                        let idx = acc[dmg_type].findIndex((v) => v[0] === situation);
                        if (idx === -1) {
                            acc[dmg_type].push([situation, amount])
                        } else {
                            acc[dmg_type][idx][1] += amount;
                        }
                    }

                    return acc
                }, {})

            let crit_data =
                Object.entries(abilityUnits)
                    .map(([key, calc_units]) => [calc_units, abilityData[key]] as const)
                    .filter((entry): entry is [Unit[], number] => typeof entry[1] === "number")
                    .map(([calc_units, multiplier]) =>
                        [getUnitArrayDataOfType(calc_units, "critical multiplier"), multiplier] as const)
                    .flatMap(([crit_types, multiplier]) => crit_types.map((crit_type) => [crit_type, multiplier] as const))
            for (let total_damage_type in total_damage) {
                for (let situation of total_damage[total_damage_type]) {
                    assignValueAndUnits(abilityData, abilityUnits, `Total ${total_damage_type} ${situation[0]} instance ${damage_or_healing}`, situation[1], [[`total instance ${damage_or_healing}`, total_damage_type], ["situation", situation[0]]])

                    for (let [crit_type, critical_multiplier] of crit_data) {
                        let adj_critical_multiplier = 1
                        if (crit_type[1] === undefined || crit_type[1] === total_damage_type) {
                            adj_critical_multiplier = critical_multiplier
                        }
                        assignValueAndUnits(abilityData, abilityUnits, `Total ${total_damage_type} ${situation[0]} instance ${crit_type} ${damage_or_healing}`, situation[1] * adj_critical_multiplier, [[`total instance crit ${damage_or_healing}`, total_damage_type, crit_type[0]], ["situation", situation[0]]])
                    }
                }
            }
        }
    })

    return patch_data
}

function applyArmorToStat(stat: number, min_damage_reduction: number, max_damage_reduction: number, flat_damage_reduction: number): number {
    return Math.min(Math.max(stat - flat_damage_reduction, stat * (1 - max_damage_reduction)), stat * (1 - min_damage_reduction))
}

function getSpecialArmorBehaviors(patch_data: PatchData, calculation_units: Units): { [damage_type: string]: SpecialArmorBehavior } {
    const special_armor_behaviors: { [damage_type: string]: SpecialArmorBehavior } = {};

    for (let key in calculation_units.general) {
        let types = getUnitDataOfType(calculation_units.general[key], "special armor mitigation")

        if (typeof patch_data.general[key] !== "number") {
            continue;
        }

        for (let type of types) {
            special_armor_behaviors[type] = ["flat percent mit", patch_data.general[key] / 100]
        }
    }

    return special_armor_behaviors;
}

export function applyArmor(patch_data: PatchData, calculation_units: Units, special_armor_behaviors: { [damage_type: string]: SpecialArmorBehavior }): PatchData {
    let min_damage_reduction = 0;
    let max_damage_reduction = 1;
    let flat_damage_reduction = 0;

    if (typeof patch_data.general["Armor minimum damage reduction"] === "number") {
        min_damage_reduction = patch_data.general["Armor minimum damage reduction"] / 100
    }
    if (typeof patch_data.general["Armor maximum damage reduction"] === "number") {
        max_damage_reduction = patch_data.general["Armor maximum damage reduction"] / 100
    }
    if (typeof patch_data.general["Armor flat damage reduction"] === "number") {
        flat_damage_reduction = patch_data.general["Armor flat damage reduction"]
    }
    if (typeof patch_data.general["Quick melee damage"] == "number") {
        patch_data.general["Quick melee damage"] = applyArmorToStat(patch_data.general["Quick melee damage"], min_damage_reduction, max_damage_reduction, flat_damage_reduction)
    }

    forEachAbility(patch_data, calculation_units, (abilityData, abilityUnits) => {
        for (let ability_property in abilityData) {
            let property_units = abilityUnits[ability_property]
            if (typeof abilityData[ability_property] === "number") {
                let damage_type = property_units
                    .filter((unit) => Array.isArray(unit))
                    .filter((unit) => unit[0] == "total instance damage" || unit[0] == "total instance crit damage" || unit[0] == "damage per second")
                    .map(unit => unit[1]);
                if (damage_type.length > 1) {
                    throw new Error("should not have multiple damage types")
                }
                if (damage_type.length > 0) {
                    let possible_special_behavior = special_armor_behaviors[damage_type[0]];
                    if (possible_special_behavior !== undefined) {
                        if (possible_special_behavior[0] === "flat percent mit") {
                            abilityData[ability_property] = (1 - possible_special_behavior[1]) * abilityData[ability_property]
                        } else {
                            // exhaustiveness check
                            let x: never = possible_special_behavior[0]
                        }
                    } else {
                        abilityData[ability_property] = applyArmorToStat(abilityData[ability_property], min_damage_reduction, max_damage_reduction, flat_damage_reduction)
                    }
                }
            }
        }
    })

    return patch_data
}

export function calculatePostArmorProperties(patch_data: PatchData, calculation_units: Units) {
    forEachHero(patch_data, calculation_units, (heroData, heroUnits, hero) => {
        const generalHeroData = heroData.general;
        const generalHeroDataUnits = heroUnits.general;
        if (generalHeroData === undefined) {
            console.error(`General hero data for ${hero}`)
            return
        }
        let total_health = Object.keys(generalHeroData)
            .filter((general_property) => generalHeroDataUnits[general_property].includes("health"))
            .map((general_property) => generalHeroData[general_property])
            .filter((general_property) => typeof general_property === "number")
            .reduce((a, c) => a + c, 0)
        heroData.general["Total health"] = total_health;
    })
    forEachAbility(patch_data, calculation_units, (abilityData, abilityUnits, ability, heroData) => {
        if (typeof abilityData["Alt fire of"] == "string") {
            const ALT_FIRE_TRANSFER_PROPERTIES = ["Ammo", "Reload time", "Reload time per ammo"]
            for (let alt_fire_transfer_property of ALT_FIRE_TRANSFER_PROPERTIES) {
                if (!(alt_fire_transfer_property in abilityData) && alt_fire_transfer_property in heroData.abilities[abilityData["Alt fire of"]]) {
                    heroData.abilities[ability][alt_fire_transfer_property] = heroData.abilities[abilityData["Alt fire of"]][alt_fire_transfer_property];
                }
            }
        }
        for (let damage_or_healing of ["damage", "healing"] as const) {
            for (let ability_property in abilityData) {
                let property_units = abilityUnits[ability_property]
                if (typeof abilityData[ability_property] === "number") {
                    let situations = getUnitsOfType(property_units, "situation");
                    let situations_display = situations.map((s) => s[1]).join(", ");
                    let damage = abilityData[ability_property]
                    {
                        let damage_types = getUnitDataOfType(property_units, `total instance ${damage_or_healing}`);
                        for (let damage_type of damage_types) {
                            assignValueAndUnits(abilityData, abilityUnits, `Total ${damage_type} ${situations_display} ${damage_or_healing}`, damage, [[`total ${damage_or_healing}`, damage_type], ...situations])
                        }
                    }
                    {
                        let damage_types = getUnitDataOfType(property_units, `total instance crit ${damage_or_healing}`);
                        for (let [damage_type, crit_type] of damage_types) {
                            assignValueAndUnits(abilityData, abilityUnits, `Total ${damage_type} ${crit_type} ${damage_or_healing}`, damage, [[`total crit ${damage_or_healing}`, damage_type, crit_type], ...situations])
                        }
                    }
                }
            }
            for (let pellet_count_ability_property in abilityData) {
                if (typeof abilityData[pellet_count_ability_property] !== "number") {
                    continue;
                }
                let pellet_count_property_units = abilityUnits[pellet_count_ability_property]
                let multiplier_types = pellet_count_property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == "pellet count" || unit[0] == "bullets per burst").map((unit) => unit[1]);
                let multiplier = abilityData[pellet_count_ability_property]
                for (let damage_type of multiplier_types) {
                    for (let ability_property in abilityData) {
                        let property_units = abilityUnits[ability_property]
                        if (typeof abilityData[ability_property] === "number") {
                            if (getUnitDataOfType(property_units, `total ${damage_or_healing}`).includes(damage_type)) {
                                abilityData[ability_property] *= multiplier
                            }
                            if (getUnitDataOfType(property_units, `total crit ${damage_or_healing}`).map((unit) => unit[0]).includes(damage_type)) {
                                abilityData[ability_property] *= multiplier
                            }
                        }
                    }
                }
            }
            {
                let total_damage: { [key: string]: number } = {};
                let total_crit_damage: { [key: string]: number } = {}
                for (let ability_property in abilityData) {
                    let property_units = abilityUnits[ability_property]
                    if (typeof abilityData[ability_property] === "number") {
                        let damage = abilityData[ability_property]
                        {
                            let damage_types = getUnitsOfType(property_units, `total ${damage_or_healing}`);
                            if (damage_types.length > 0) {
                                let situations = getUnitDataOfType(property_units, "situation");
                                for (let situation of situations) {
                                    if (!(situation in total_damage)) {
                                        total_damage[situation] = 0
                                    }
                                    total_damage[situation] += damage
                                }
                            }
                        }
                        {
                            let damage_types = getUnitDataOfType(property_units, `total crit ${damage_or_healing}`);
                            for (let [_, crit_type] of damage_types) {
                                if (!(crit_type in total_crit_damage)) {
                                    total_crit_damage[crit_type] = 0
                                }
                                total_crit_damage[crit_type] += damage
                            }
                        }
                    }
                }
                for (let total_damage_situation in total_damage) {
                    assignValueAndUnits(abilityData, abilityUnits, `Total ${total_damage_situation} ${damage_or_healing}`, total_damage[total_damage_situation], [`total ${damage_or_healing}`, ["situation", total_damage_situation]])
                    if (damage_or_healing === "damage") {
                        abilityUnits[`Total ${total_damage_situation} ${damage_or_healing}`].push("breakpoint damage")
                    }
                }
                for (let crit_damage_type in total_crit_damage) {
                    assignValueAndUnits(abilityData, abilityUnits, `Total ${crit_damage_type} ${damage_or_healing}`, total_crit_damage[crit_damage_type], [`total crit ${damage_or_healing}`])
                    if (damage_or_healing === "damage") {
                        abilityUnits[`Total ${crit_damage_type} ${damage_or_healing}`].push("breakpoint damage")
                    }
                }
            }
        }
    })

    return patch_data
}

export function calculateBreakpoints(patch_data: PatchData, calculation_units: Units, damage_break_point_values: number[]): PatchData {
    forEachHero(patch_data, calculation_units, (heroData, heroUnits) => {
        let damage_options: { [key: string]: { [key: string]: number } } = {};
        let damage_option_data: { [ability: string]: { [label: string]: { [ability_usage: string]: number } } } = {};
        if (typeof patch_data.general["Quick melee damage"] == "number" && heroData.general["has overridden melee"] !== true) {
            damage_options["Melee"] = {
                "": patch_data.general["Quick melee damage"]
            }
            damage_option_data["Melee"] = {
                "": {
                    "normal": 1
                }
            }
        }
        for (let ability in heroData.abilities) {
            let ability_damage_options: { [key: string]: [number, number] } = {}
            let ability_normal_max_damage_instances: number | null = null;

            for (let ability_property in heroData.abilities[ability]) {
                if (typeof heroData.abilities[ability][ability_property] !== "number") {
                    continue
                }
                for (let property_unit of heroUnits.abilities[ability][ability_property]) {
                    if (property_unit == "ammo") {
                        ability_normal_max_damage_instances = Math.min(3, heroData.abilities[ability][ability_property])
                    } else if (property_unit == "charges") {
                        ability_normal_max_damage_instances = heroData.abilities[ability][ability_property]
                    } else if (property_unit == "time between shots" && ability_normal_max_damage_instances == null) {
                        ability_normal_max_damage_instances = 3
                    }
                }
            }
            if (ability_normal_max_damage_instances == null) {
                ability_normal_max_damage_instances = 1;
            }
            for (let ability_property in heroData.abilities[ability]) {
                let is_damage_property = false
                let max_damage_instances: number = ability_normal_max_damage_instances;
                if (typeof heroData.abilities[ability][ability_property] !== "number") {
                    continue
                }
                for (let property_unit of heroUnits.abilities[ability][ability_property]) {
                    if (property_unit == "breakpoint damage") {
                        is_damage_property = true
                    } else if (Array.isArray(property_unit) && property_unit[0] == "situation" && property_unit[1] == "cast") {
                        max_damage_instances = 1
                    }
                }

                if (is_damage_property) {
                    ability_damage_options[ability_property] = [heroData.abilities[ability][ability_property], max_damage_instances]
                }
            }

            let ability_damage_option_set: [{ [dmg_case: string]: number }, number][] = [[{}, 0]]
            for (let damage_option in ability_damage_options) {
                for (let i = 0; i < ability_damage_options[damage_option][1]; i++) {
                    for (let damage_option_set_element of structuredClone(ability_damage_option_set)) {
                        if (Object.values(damage_option_set_element[0]).reduce((s, a) => s + a, 0) < ability_normal_max_damage_instances) {
                            let new_damage_option_set_element = damage_option_set_element
                            if (!(damage_option in new_damage_option_set_element[0])) {
                                new_damage_option_set_element[0][damage_option] = 0
                            }
                            new_damage_option_set_element[0][damage_option] += 1
                            new_damage_option_set_element[1] += ability_damage_options[damage_option][0]

                            ability_damage_option_set.push(new_damage_option_set_element)
                        }
                    }
                }
            }
            ability_damage_option_set = ability_damage_option_set.filter((dmg_case) => dmg_case[1] > 0)
            damage_options[ability] = {}
            damage_option_data[ability] = {}
            for (let ability_damage_option of ability_damage_option_set) {
                let label = Object.entries(ability_damage_option[0]).map((e) => e[1] > 1 ? `${e[1]}x ${e[0]}` : e[0]).join(" + ")
                damage_options[ability][label] = ability_damage_option[1]
                damage_option_data[ability][label] = ability_damage_option[0]
            }
        }
        let breakpointDamage: { [key: string]: number } = { "": 0 }
        let breakpointDamageData: { [label: string]: { [damage_instance: string]: number } } = { "": {} }
        for (let ability in damage_options) {
            for (let damageEntry in breakpointDamage) {
                for (let damageOption in damage_options[ability]) {
                    let label = `${damageEntry}, ${ability}${damageOption === "" ? "" : " "}${damageOption}`;
                    breakpointDamage[label] = breakpointDamage[damageEntry] + damage_options[ability][damageOption]
                    breakpointDamageData[label] = structuredClone(breakpointDamageData[damageEntry])
                    for (let ability_use in damage_option_data[ability][damageOption]) {
                        breakpointDamageData[label][`${ability} ${ability_use}`] = damage_option_data[ability][damageOption][ability_use]
                    }
                }
            }
        }
        let breakpointDamageEntries: { [key: string]: number } = {}
        let breakpointDamageDataEntries: { [key: string]: { [ability_use: string]: number } } = {}
        for (let breakpoint in breakpointDamage) {
            let breakpointHealth = damage_break_point_values.findLast((v) => v <= breakpointDamage[breakpoint]);
            if (breakpointHealth !== undefined) {
                breakpointDamageEntries[`Breakpoint for ${breakpoint.substring(2)}`] = breakpointHealth
                breakpointDamageDataEntries[`Breakpoint for ${breakpoint.substring(2)}`] = breakpointDamageData[breakpoint]
            }
        }
        heroData.breakpoints = breakpointDamageEntries;
        heroData.breakpoints_data = breakpointDamageDataEntries;
    })

    return patch_data
}

function getBreakpointHealthValues(patch_data: PatchData) {
    let damage_break_point_values: number[] = []

    for (let role in patch_data.heroes) {
        if (role == "tank") continue
        for (let hero in patch_data.heroes) {
            if (!isKeyOf(patch_data.heroes, hero)) {
                throw new Error("Invalid state")
            }
            let heroData = patch_data.heroes[hero]
            if (heroData === undefined) {
                throw new Error("Invalid state")
            }

            if (typeof heroData.general["Total health"] === "number") {
                damage_break_point_values.push(heroData.general["Total health"])
            }
        }
    }
    damage_break_point_values = [...new Set(damage_break_point_values)]
    damage_break_point_values.sort((a, b) => a - b)
    return damage_break_point_values
}

export function calculateRates(patch_data: PatchData, calculation_units: Units) {
    forEachAbility(patch_data, calculation_units, (abilityData, abilityDataUnits) => {
        let time_between_shots = 0
        {
            let damage_per_second = 0
            let crit_damage_per_second = 0
            let healing_per_second = 0
            for (let property in abilityData) {
                if (typeof abilityData[property] === "number") {
                    if (abilityDataUnits[property].includes("time between shots")) {
                        time_between_shots += abilityData[property]
                    }
                    if (abilityDataUnits[property].includes("total damage")) {
                        damage_per_second += abilityData[property]
                    }
                    if (abilityDataUnits[property].includes("total crit damage")) {
                        crit_damage_per_second += abilityData[property]
                    }
                    if (abilityDataUnits[property].includes("total healing")) {
                        healing_per_second += abilityData[property]
                    }
                }
            }
            if (time_between_shots > 0) {
                damage_per_second /= time_between_shots
                crit_damage_per_second /= time_between_shots
                healing_per_second /= time_between_shots
                if (damage_per_second > 0) {
                    assignValueAndUnits(abilityData, abilityDataUnits, "Damage per second", damage_per_second, ["damage per second"])
                }
                if (crit_damage_per_second > 0) {
                    assignValueAndUnits(abilityData, abilityDataUnits, "Critical damage per second", crit_damage_per_second, [])
                }
                if (healing_per_second > 0) {
                    assignValueAndUnits(abilityData, abilityDataUnits, "Healing per second", healing_per_second, ["healing per second"])
                }
            }
        }
        let reload_time = 0;
        let reload_time_per_ammo = 0;
        let ammo = 0;
        let bullets_per_burst = 1;
        let burst_recovery_time = 0;
        let ammo_per_shot = 1;
        let damage_per_second = 0
        let healing_per_second = 0
        for (let property in abilityData) {
            if (typeof abilityData[property] === "number") {
                if (abilityDataUnits[property].includes("reload time")) {
                    reload_time += abilityData[property]
                }
                if (abilityDataUnits[property].includes("reload time per ammo")) {
                    reload_time_per_ammo += abilityData[property]
                }
                if (abilityDataUnits[property].includes("ammo")) {
                    ammo += abilityData[property]
                }
                if (abilityDataUnits[property].includes("bullets per burst")) {
                    bullets_per_burst *= abilityData[property]
                }
                if (abilityDataUnits[property].includes("burst recovery time")) {
                    burst_recovery_time += abilityData[property]
                }
                if (abilityDataUnits[property].includes("ammo per shot")) {
                    ammo_per_shot *= abilityData[property]
                }
                if (abilityDataUnits[property].includes("damage per second")) {
                    damage_per_second = abilityData[property]
                }
                if (abilityDataUnits[property].includes("healing per second")) {
                    healing_per_second = abilityData[property]
                }
            }
        }
        reload_time += reload_time_per_ammo * ammo
        reload_time += (bullets_per_burst - 1) * burst_recovery_time

        if (ammo > 0 && reload_time > 0) {
            let time_before_reload = ammo
            if (time_between_shots > 0) {
                time_before_reload *= time_between_shots
            }
            time_before_reload /= ammo_per_shot
            time_before_reload /= bullets_per_burst
            if (typeof abilityData["Ammo per second"] === "number") {
                time_before_reload /= abilityData["Ammo per second"]
            }
            const reload_multiplier = time_before_reload / (time_before_reload + reload_time)
            if (damage_per_second > 0) {
                assignValueAndUnits(abilityData, abilityDataUnits, "Damage per second(including reload)", damage_per_second * reload_multiplier, [])
            }
            if (healing_per_second > 0) {
                let healing_per_second_incl_reload = healing_per_second * reload_multiplier
                assignValueAndUnits(abilityData, abilityDataUnits, "Healing per second(including reload)", healing_per_second_incl_reload, [])
            }
        }
    })

    return patch_data
}

function cleanupProperties(patch_data: PatchData, calculation_units: Units) {
    forEachAbility(patch_data, calculation_units, (abilityData, abilityDataUnits) => {
        for (let damage_or_healing of ["damage", "healing"]) {
            let damage_type_instance_damage: { [key: string]: { [key: string]: number } } = {}
            for (let property in abilityData) {
                if (typeof abilityData[property] !== "number") {
                    continue;
                }
                let property_damage_types = getUnitDataOfType(abilityDataUnits[property], `${damage_or_healing} instance`)
                let situations = getUnitDataOfType(abilityDataUnits[property], "situation");
                for (let property_damage_type of property_damage_types) {
                    if (!(property_damage_type in damage_type_instance_damage)) {
                        damage_type_instance_damage[property_damage_type] = {}
                    }
                    for (let situation of situations) {
                        damage_type_instance_damage[property_damage_type][situation] = abilityData[property]
                    }
                }
            }
            let damage_type_damage: { [key: string]: { [key: string]: number } } = {}
            let crit_damage_type_damage: { [key: string]: { [key: string]: number } } = {}
            for (let property in abilityData) {
                if (typeof abilityData[property] === "number") {
                    let property_damage_types = getUnitArrayDataOfType(abilityDataUnits[property], `total ${damage_or_healing}`).map((unit) => unit[0]);
                    let situations = getUnitDataOfType(abilityDataUnits[property], "situation");
                    for (let property_damage_type of property_damage_types) {
                        if (!(property_damage_type in damage_type_damage)) {
                            damage_type_damage[property_damage_type] = {}
                        }
                        for (let situation of situations) {
                            damage_type_damage[property_damage_type][situation] = abilityData[property]
                            if (damage_type_damage[property_damage_type][situation] == damage_type_instance_damage[property_damage_type][situation]) {
                                delete abilityData[property]
                            }
                        }
                    }
                    let crit_property_damage_types = getUnitArrayDataOfType(abilityDataUnits[property], `total crit ${damage_or_healing}`).map((unit) => unit[0]);
                    for (let property_damage_type of crit_property_damage_types) {
                        if (!(property_damage_type in crit_damage_type_damage)) {
                            crit_damage_type_damage[property_damage_type] = {}
                        }
                        for (let situation of situations) {
                            crit_damage_type_damage[property_damage_type][situation] = abilityData[property]
                        }
                    }
                }
            }
            for (let property in abilityData) {
                if (typeof abilityData[property] === "number") {
                    let property_damage_types = getUnitArrayDataOfType(abilityDataUnits[property], `total instance ${damage_or_healing}`).map((unit) => unit[0])
                    let situations = getUnitDataOfType(abilityDataUnits[property], "situation");
                    for (let property_damage_type of property_damage_types) {
                        for (let situation of situations) {
                            if (damage_type_damage[property_damage_type][situation] === abilityData[property]) {
                                delete abilityData[property]
                            }
                        }
                    }
                    let property_crit_damage_types = getUnitDataOfType(abilityDataUnits[property], `total instance crit ${damage_or_healing}`).map((unit) => unit[0]);
                    for (let property_damage_type of property_crit_damage_types) {
                        for (let situation of situations) {
                            if (crit_damage_type_damage[property_damage_type][situation] === abilityData[property]) {
                                delete abilityData[property]
                            }
                        }
                    }
                }
            }
            if (Object.keys(damage_type_damage).length == 1) {
                for (let property in abilityData) {
                    if (typeof abilityData[property] === "number") {
                        let property_damage_types = getUnitDataOfType(abilityDataUnits[property], `total ${damage_or_healing}`);
                        if (property_damage_types.length > 0) {
                            delete abilityData[property]
                            continue
                        }
                    }
                }
            }
            if (Object.keys(crit_damage_type_damage).length == 1) {
                for (let property in abilityData) {
                    if (typeof abilityData[property] === "number") {
                        let crit_property_damage_types = getUnitDataOfType(abilityDataUnits[property], `total crit ${damage_or_healing}`);
                        if (crit_property_damage_types.length > 0) {
                            delete abilityData[property]
                            continue
                        }
                    }
                }
            }
        }
    })

    return patch_data
}

function removeRedundantBreakpoints(changes: Changes<PatchData>, after_patch_data: PatchData): Changes<PatchData> {
    for (let hero of Object.keys(changes.heroes).sort()) {
        if (!isKeyOf(changes.heroes, hero)) {
            throw new Error("Invalid state")
        }
        let heroData = changes.heroes[hero];
        if (Array.isArray(heroData)) {
            if (heroData[1] !== undefined) {
                heroData = heroData[1];
            } else {
                continue;
            }
        }
        if (heroData === undefined) {
            throw new Error("Invalid state")
        }
        if (!heroData.breakpoints) continue;
        if (!heroData.breakpoints_data) continue;
        let breakpoints = heroData.breakpoints;
        let breakpoints_data = heroData.breakpoints_data;
        if (Array.isArray(breakpoints)) continue;
        if (Array.isArray(breakpoints_data)) continue;
        //TODO use es2024 Object.groupBy when typescript 5.7 releases
        let similar_breakpoints: { [key: string]: [string, { [key: string]: number }][] } = {};
        for (let breakpoint in breakpoints) {
            let breakpoint_data = breakpoints_data[breakpoint];
            if (Array.isArray(breakpoint_data)) {
                if (breakpoint_data[0] === undefined) {
                    breakpoint_data = breakpoint_data[1]
                } else if (breakpoint_data[1] === undefined) {
                    breakpoint_data = breakpoint_data[0]
                }
            }
            let unchanged_breakpoint_data: { [key: string]: number } = {};
            for (let damage_type in breakpoint_data) {
                let count = breakpoint_data[damage_type];
                if (Array.isArray(count)) {
                    if (count[0] === undefined) {
                        count = count[1]
                    } else if (count[1] === undefined) {
                        count = count[0]
                    } else {
                        throw new Error("Invalid state")
                    }
                }
                unchanged_breakpoint_data[damage_type] = count
            }
            if (!(`${breakpoints[breakpoint]}` in similar_breakpoints))
                similar_breakpoints[`${breakpoints[breakpoint]}`] = []
            similar_breakpoints[`${breakpoints[breakpoint]}`].push([breakpoint, unchanged_breakpoint_data])
        }
        let breakpoints_to_remove: string[] = []
        for (let breakpoint_type in similar_breakpoints) {
            let breakpoints = similar_breakpoints[breakpoint_type]
            let breakpoint_idx = 0;
            while (breakpoint_idx < breakpoints.length) {
                let breakpoint = breakpoints[breakpoint_idx]
                let sub_breakpoint = breakpoints.find((other_breakpoint) => breakpoint[0] !== other_breakpoint[0] && isSubBreakpoint(breakpoint[1], other_breakpoint[1]))
                if (sub_breakpoint !== undefined) {
                    breakpoints_to_remove.push(breakpoint[0])
                    breakpoints.splice(breakpoint_idx, 1)
                } else {
                    breakpoint_idx += 1
                }
            }
        }

        if (Array.isArray(heroData.breakpoints)) throw new Error("Invalid state")
        for (let remove_breakpoint of breakpoints_to_remove) {
            delete heroData.breakpoints[remove_breakpoint];
        }
        changes.heroes[hero] = heroData
    }
    return changes;
}

function isSubBreakpoint(possible_super_breakpoint: { [key: string]: number }, possible_sub_breakpoint: { [key: string]: number }): boolean {
    for (let damage_type in possible_sub_breakpoint) {
        if (!(damage_type in possible_super_breakpoint)) return false;
        if (possible_super_breakpoint[damage_type] < possible_sub_breakpoint[damage_type]) return false;
    }
    return true;
}

const CATEGORY_PREV_MAP: { [k: string]: string } = {
    "Overwatch 2": "Overwatch 2 Beta",
    "Overwatch 2 Beta": "Overwatch 1",
    "Overwatch 2 6v6": "6v6 Adjustments",
    "6v6 Adjustments": "Overwatch 1",
    "Overwatch 1": "Empty",
    "Empty": "Empty",
}

const CATEGORY_POST_MAP: { [k: string]: string | undefined } = {
    "Overwatch 2": undefined,
    "Overwatch 2 Beta": "Overwatch 2",
    "Overwatch 2 6v6": undefined,
    "6v6 Adjustments": "Overwatch 2 6v6",
    "Overwatch 1": "Overwatch 2 Beta",
    "Empty": "Overwatch 1",
}

function getShiftedPatch(patch: [string, string], shift: number): [string, string] {
    let category = patch[0]
    if (category == "Previous") {
        return patch;
    }

    let patch_idx = patchList[patch[0]].indexOf(patch[1]) + shift
    while (patch_idx < 0) {
        category = CATEGORY_PREV_MAP[patch[0]];
        patch_idx += patchList[category].length;
    }
    while (patch_idx >= patchList[category].length) {
        let post_category = CATEGORY_POST_MAP[patch[0]];
        if (post_category == undefined) {
            return [category, patchList[category][patchList[category].length - 1]]
        }
        patch_idx -= patchList[category].length;
        category = post_category;
    }
    return [category, patchList[category][patch_idx]]
}

function getPreviousPatch(): [string, string] {
    if (siteState.after_patch[0] != "Previous") {
        return getShiftedPatch(siteState.after_patch, -1)
    }
    if (siteState.before_patch[0] != "Previous") {
        return getShiftedPatch(siteState.before_patch, -1)
    }
    return ["Empty", "0-01-01"]
}

function updatePatchSelectors(patch: [string, string], type_selector: HTMLSelectElement, main_selector: HTMLSelectElement) {
    type_selector.value = patch[0];

    if (patch[0] == "Previous") {
        let p = getPreviousPatch()[1];
        let split_date = p.split("-").map((s) => parseInt(s))
        let pretty_date = new Date(split_date[0], split_date[1] - 1, split_date[2])
        main_selector.innerHTML = `<option value="previous" selected>${pretty_date.toLocaleDateString()}</option>`;
        return;
    } else {
        let patch_options = patchList[patch[0]].map((p, i) => {
            let split_date = p.split("-").map((s) => parseInt(s))
            let pretty_date = new Date(split_date[0], split_date[1] - 1, split_date[2])
            return `<option value=\"${p}\" ${p == patch[1] ? "selected" : ""}>${pretty_date.toLocaleDateString()}</option>`
        }).join();
        main_selector.innerHTML = patch_options;
    }
    main_selector.value = patch[1]
}

patch_type_before_box.onchange = async function () {
    siteState.before_patch[0] = patch_type_before_box.value
    siteState.before_patch[1] = patchList[patch_type_before_box.value][0]

    await updatePatchNotes()
};
patch_type_after_box.onchange = async function () {
    siteState.after_patch[0] = patch_type_after_box.value
    siteState.after_patch[1] = patchList[patch_type_after_box.value][0]

    await updatePatchNotes()
};
patch_before_box.onchange = async function () {
    siteState.before_patch[1] = (this as HTMLSelectElement).value;
    await updatePatchNotes()
};

patch_after_box.onchange = async function () {
    siteState.after_patch[1] = (this as HTMLSelectElement).value;
    await updatePatchNotes()
};

display_calculated_properties_box.onchange = async function () {
    siteState.show_calculated_properties = (this as HTMLInputElement).checked;
    await updatePatchNotes()
};

display_breakpoints_box.onchange = async function () {
    siteState.show_breakpoints = (this as HTMLInputElement).checked;
    await updatePatchNotes()
};

apply_damage_to_armor_box.onchange = async function () {
    siteState.apply_to_armor = (this as HTMLInputElement).checked;
    await updatePatchNotes()
};

async function update_before_damage_boost(event: Event) {
    siteState.before_dmg_boost = parseFloat((event.target as HTMLInputElement).value) / 100.0;
    await updatePatchNotes()
}
async function update_after_damage_boost(event: Event) {
    siteState.after_dmg_boost = parseFloat((event.target as HTMLInputElement).value) / 100.0;
    await updatePatchNotes()
}

patch_before_dmg_boost.onchange = update_before_damage_boost;
patch_before_dmg_boost_slider.onchange = update_before_damage_boost;

patch_after_dmg_boost.onchange = update_after_damage_boost;
patch_after_dmg_boost_slider.onchange = update_after_damage_boost;

window.addEventListener("popstate", async (event) => {
    if (event.state) {
        let encoded = event.state;
        if (typeof encoded.before_patch == "string") {
            encoded.before_patch = encoded.before_patch.split(":")
        }
        if (typeof encoded.after_patch == "string") {
            encoded.after_patch = encoded.after_patch.split(":")
        }
        siteState = encoded;
        await updatePatchNotes()
    }
});

async function shiftPatches(shift: number) {
    if (siteState.before_patch[0] != "Previous") {
        siteState.before_patch = getShiftedPatch(siteState.before_patch, shift);
    }
    if (siteState.after_patch[0] != "Previous") {
        siteState.after_patch = getShiftedPatch(siteState.after_patch, shift);
    }
    await updatePatchNotes();
}

last_patch_buttons.forEach((last_patch_button) => last_patch_button.addEventListener("click", async () => shiftPatches(-1), false));
next_patch_buttons.forEach((next_patch_button) => next_patch_button.addEventListener("click", async () => shiftPatches(1), false));
swap_patches_button.addEventListener("click", async () => {
    let temp_patch = siteState.before_patch;
    siteState.before_patch = siteState.after_patch;
    siteState.after_patch = temp_patch;

    let temp_boost = siteState.before_dmg_boost;
    siteState.before_dmg_boost = siteState.after_dmg_boost;
    siteState.after_dmg_boost = temp_boost;

    await updatePatchNotes();
}, false);

await updatePatchNotes();