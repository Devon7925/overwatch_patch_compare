// import units from "./units.json" with { type: "json" };
// cant use because firefox dumb https://bugzilla.mozilla.org/show_bug.cgi?id=1736059

type Unit = "none" | "percent" | "meters" | "seconds" | "health per second" | "meters per second" | "relative percent" | "flag"
type WithRemainder<T extends string, R extends any[]> = T extends any ? [T, ...R] : never
type WithAppend<T extends string | [string, ...any], R extends string> = T extends [infer First extends string, ...infer Rest extends any[]] ? [`${First}${R}`, ...Rest] : T extends string ? `${T}${R}` : never
type X = WithAppend<WithRemainder<"total instance crit" | "total crit", [string, string]> | "total crit", " damage" | " healing">
type CalculationUnit =
    WithRemainder<"damage instance" | "healing instance" | "pellet count" | "bullets per burst", [string]>
    | WithAppend<
        WithRemainder<"total instance" | "total", [string]>
        | WithRemainder<"total instance crit" | "total crit", [string, string]>
        | "total" | "total crit",
        " damage" | " healing">
    | ["critical multiplier", string]| ["critical multiplier", string, string] | "bullets per burst" | "ammo" | "charges" | "reload time" | "health" | "breakpoint damage" | "time between shots" | "burst recovery time" | "reload time per ammo" | "ammo per shot" | "damage per second" | "healing per second"
type Value = string | number | boolean
type PatchStructure<T> = {
    general: { [key: string]: T }
    heroes: {
        [key: string]: {
            general: { [key: string]: T },
        } & {
            [key: string]: {
                general: { [key: string]: T },
                abilities: { [key: string]: { [key: string]: T } }
                breakpoints?: { [key: string]: T },
            }
        }
    },
    "Map list": {
        [map: string]: number
    },
    "modes": {
        [key: string]: { [key: string]: T }
    }
}
type PatchData = PatchStructure<Value>
type Units = PatchStructure<Unit>
type CalculationUnits = PatchStructure<CalculationUnit[]>

const damageBreakPointHealthValues = [150, 175, 200, 225, 250, 300];

const patchList: { [key: string]: string[] } = await fetch("./patch_list.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text, (key, value) => {
        if (typeof value != "string") {
            return value;
        }
        return value.replace(/(\.\w+)+$/, "")
    }));

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
type SiteState = {
    before_patch: string,
    after_patch: string,
    show_calculated_properties: boolean,
    show_breakpoints: boolean,
    apply_to_armor: boolean,
    before_dmg_boost: number,
    after_dmg_boost: number,
};
let siteState: SiteState;
let defaultSiteState: SiteState = {
    before_patch: "Overwatch 2:recent",
    after_patch: "Overwatch 2:latest",
    show_calculated_properties: false,
    show_breakpoints: false,
    apply_to_armor: false,
    before_dmg_boost: 1,
    after_dmg_boost: 1,
}
type Rest<T extends any[]> = T extends [infer _, ...infer Rest extends any[]] ? Rest : []
function rest<T extends any[]>(array: T): Rest<T> {
    return array.slice(1) as Rest<T>
}

function patch_from_path(joined_path: string) {
    let path = joined_path.split(":");
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
    return `${versionType}:${version}`
}

{
    siteState = structuredClone(defaultSiteState)
    {
        let url_before = urlParams.get("before")
        if (url_before) {
            siteState.before_patch = url_before
        }
        let url_after = urlParams.get("after")
        if (url_after) {
            siteState.after_patch = url_after
        }
        url_before = urlParams.get("before_patch")
        if (url_before) {
            siteState.before_patch = url_before
        }
        url_after = urlParams.get("after_patch")
        if (url_after) {
            siteState.after_patch = url_after
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
}

{
    let newUrlParams = new URLSearchParams();
    let key: keyof typeof siteState;
    for (key in siteState) {
        newUrlParams.append(key, `${siteState[key]}`)
    }
    window.history.replaceState(siteState, "", "index.html?" + newUrlParams)
}

let units: Units;
let calculation_units: CalculationUnits;
let hero_images: { [key: string]: string } = {};
let ability_images: { [key: string]: string } = {};
export let patches: { [key: string]: PatchData } = {};

let promises = [];
promises.push(fetch("./units.json")
    .then((res) => res.text())
    .then((text) => units = JSON.parse(text)))
promises.push(fetch("./calculation_units.json")
    .then((res) => res.text())
    .then((text) => calculation_units = JSON.parse(text)))
promises.push(fetch("./hero_images.json")
    .then((res) => res.text())
    .then((text) => hero_images = JSON.parse(text)))
promises.push(fetch("./ability_images.json")
    .then((res) => res.text())
    .then((text) => ability_images = JSON.parse(text)))
await Promise.all(promises);

function isEmpty(obj: any) {
    for (var i in obj) { return false; }
    return true;
}

function round(num: number, decimalPlaces = 0) {
    num = Math.round(parseFloat(num + "e" + decimalPlaces));
    return Number(num + "e" + -decimalPlaces);
}

export function convert_to_changes<T extends { [key: string]: any }>(before: T, after: T): { [key in keyof T]: any };
export function convert_to_changes(before: any, after: any) {
    if (typeof before == "object" && typeof after == "object") {
        let result: { [key: string]: any } = {};
        for (let key in before) {
            if (before[key] != after[key]) {
                let changes = convert_to_changes(before[key], after[key]);
                if (!isEmpty(changes)) {
                    result[key] = changes;
                }
            }
        }
        for (let key in after) {
            if (!(key in before)) {
                result[key] = [undefined, after[key]];
            }
        }
        return result;
    }
    return [before, after];
}

export function getChangeText(name: string, change: [any, any], units: Unit) {
    if (typeof change[0] === "number") {
        change[0] = round(change[0], 2)
    }
    if (typeof change[1] === "number") {
        change[1] = round(change[1], 2)
    }
    if (change[0] === undefined || !Array.isArray(change)) {
        let new_value = change[1];
        if (!Array.isArray(change)) {
            new_value = change;
        }
        if (units == "percent") {
            return `There is now ${new_value}% ${name.toLowerCase()}.`;
        } else if (units == "meters") {
            return `There is now ${new_value} meter ${name.toLowerCase()}.`;
        } else if (units == "seconds") {
            return `There is now ${new_value} second ${name.toLowerCase()}.`;
        } else if (units == "flag") {
            if (new_value === false) {
                return `No longer ${name}.`;
            } else {
                return `Now ${name}.`;
            }
        }
        return `There is now ${new_value} ${name.toLowerCase()}.`;
    } else if (typeof change[0] == "number") {
        if (change[1] === undefined) {
            return `${name} removed.`;
        } else if (units == "percent") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]}% to ${change[1]}%.`;
        } else if (units == "health per second") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} health per second.`;
        } else if (units == "meters per second") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} meters per second.`;
        } else if (units == "seconds") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} seconds.`;
        } else if (units == "meters") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} meters.`;
        } else if (units == "relative percent") {
            if (change[0] > change[1]) {
                return `${name} reduced by ${round(100 * (1.0 - change[1] / change[0]), 2)}%.`;
            } else {
                return `${name} increased by ${round(100 * (change[1] / change[0] - 1.0), 2)}%.`;
            }
        }
        let change_type = "increased";
        if (change[0] > change[1]) {
            change_type = "reduced";
        }
        return `${name} ${change_type} from ${change[0]} to ${change[1]}.`;
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

let patch_before_box = document.querySelector<HTMLSelectElement>("select#patch_before")!;
let patch_after_box = document.querySelector<HTMLSelectElement>("select#patch_after")!;
let display_calculated_properties_box = document.querySelector<HTMLInputElement>("input#disp_calc_props")!;
let display_breakpoints_box = document.querySelector<HTMLInputElement>("input#disp_breakpoints")!;
let apply_damage_to_armor_box = document.querySelector<HTMLInputElement>("input#apply_damage_to_armor")!;
let last_patch_button = document.querySelector<HTMLButtonElement>("button#last_patch_button")!;
let next_patch_button = document.querySelector<HTMLButtonElement>("button#next_patch_button")!;
let patch_before_dmg_boost = document.querySelector<HTMLInputElement>("input#patch_before_dmg_boost")!;
let patch_before_dmg_boost_slider = document.querySelector<HTMLInputElement>("input#patch_before_dmg_boost_slider")!;
let patch_after_dmg_boost = document.querySelector<HTMLInputElement>("input#patch_after_dmg_boost")!;
let patch_after_dmg_boost_slider = document.querySelector<HTMLInputElement>("input#patch_after_dmg_boost_slider")!;
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

async function updatePatchNotes() {
    patch_before_box.value = siteState.before_patch;
    patch_after_box.value = siteState.after_patch;
    display_calculated_properties_box.checked = siteState.show_calculated_properties
    if (siteState.show_calculated_properties) {
        (display_breakpoints_box.parentElement?.parentElement?.parentElement as HTMLElement).style.display = "flex";
        (apply_damage_to_armor_box.parentElement?.parentElement?.parentElement as HTMLElement).style.display = "flex";
        (patch_before_dmg_boost.parentElement?.parentElement as HTMLElement).style.display = "flex";
        (patch_after_dmg_boost.parentElement?.parentElement as HTMLElement).style.display = "flex";
    } else {
        (display_breakpoints_box.parentElement?.parentElement?.parentElement as HTMLElement).style.display = "none";
        (apply_damage_to_armor_box.parentElement?.parentElement?.parentElement as HTMLElement).style.display = "none";
        (patch_before_dmg_boost.parentElement?.parentElement as HTMLElement).style.display = "none";
        (patch_after_dmg_boost.parentElement?.parentElement as HTMLElement).style.display = "none";
        siteState.before_dmg_boost = 1
        siteState.after_dmg_boost = 1
        siteState.show_breakpoints = false;
        siteState.apply_to_armor = false;
    }
    display_breakpoints_box.checked = siteState.show_breakpoints
    apply_damage_to_armor_box.checked = siteState.apply_to_armor
    patch_before_dmg_boost.value = "" + (100 * siteState.before_dmg_boost)
    patch_before_dmg_boost_slider.value = "" + (100 * siteState.before_dmg_boost)
    patch_after_dmg_boost.value = "" + (100 * siteState.after_dmg_boost)
    patch_after_dmg_boost_slider.value = "" + (100 * siteState.after_dmg_boost)

    {
        let urlParams = new URLSearchParams();
        let key: keyof typeof siteState
        for (key in siteState) {
            if (siteState[key] !== defaultSiteState[key]) {
                urlParams.append(key, `${siteState[key]}`)
            }
        }
        window.history.replaceState(siteState, "", "index.html?" + urlParams)
    }

    {
        let before_patch_path = siteState.before_patch.split(":")
        let after_patch_path = siteState.after_patch.split(":")
        const last_patch_exists = (before_patch_path[0] === after_patch_path[0]) && patchList[before_patch_path[0]].indexOf(before_patch_path[1]) > 0;
        const next_patch_exists = (before_patch_path[0] === after_patch_path[0]) && patchList[after_patch_path[0]].indexOf(after_patch_path[1]) < patchList[after_patch_path[0]].length - 1;
        last_patch_button.style.visibility = last_patch_exists ? 'visible' : 'hidden';
        next_patch_button.style.visibility = next_patch_exists ? 'visible' : 'hidden';
    }

    await Promise.all([siteState.before_patch, siteState.after_patch]
        .filter((patch) => !(patch in patchList))
        .map(async (patch) => {
            let [versionType, version] = patch.split(":")
            return fetch(`./patches/${versionType}/${version}.json`)
                .then((res) => res.text())
                .then((text) => {
                    patches[`${versionType}:${version}`] = JSON.parse(text);
                })
        }))
    let before_patch_data = structuredClone(patches[siteState.before_patch]);
    let after_patch_data = structuredClone(patches[siteState.after_patch]);
    before_patch_data = reorder(before_patch_data, units)
    after_patch_data = reorder(after_patch_data, units)
    before_patch_data = applyDamageMultiplier(before_patch_data, parseFloat(patch_before_dmg_boost_slider.value) / 100, calculation_units)
    after_patch_data = applyDamageMultiplier(after_patch_data, parseFloat(patch_after_dmg_boost_slider.value) / 100, calculation_units)
    if (siteState.show_calculated_properties) {
        before_patch_data = calculatePreArmorProperties(before_patch_data, calculation_units)
        after_patch_data = calculatePreArmorProperties(after_patch_data, calculation_units)
    }
    if (siteState.apply_to_armor) {
        before_patch_data = applyArmor(before_patch_data, calculation_units)
        after_patch_data = applyArmor(after_patch_data, calculation_units)
    }
    if (siteState.show_calculated_properties) {
        before_patch_data = calculatePostArmorProperties(before_patch_data, calculation_units)
        after_patch_data = calculatePostArmorProperties(after_patch_data, calculation_units)
    }
    if (siteState.show_breakpoints) {
        before_patch_data = calculateBreakpoints(before_patch_data, calculation_units)
        after_patch_data = calculateBreakpoints(after_patch_data, calculation_units)
    }
    if (siteState.show_calculated_properties) {
        before_patch_data = calculateRates(before_patch_data, calculation_units)
        after_patch_data = calculateRates(after_patch_data, calculation_units)
        before_patch_data = cleanupProperties(before_patch_data, calculation_units)
        after_patch_data = cleanupProperties(after_patch_data, calculation_units)
    }
    let changes = convert_to_changes(before_patch_data, after_patch_data);
    let hero_section = document.getElementsByClassName("PatchNotes-section-hero_update")[0];
    hero_section.innerHTML = "";
    if (changes.general) {
        let changeRender = "";
        for (let generalRule in changes.general) {
            changeRender += `<li>${getChangeText(generalRule, changes.general[generalRule], units.general[generalRule])}</li>`
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
        `;
    }
    for (let role in changes.heroes) {
        let generalChangeRender = "";
        if (changes.heroes[role].general) {
            for (let generalRule in changes.heroes[role].general) {
                generalChangeRender += `<li>${getChangeText(generalRule, changes.heroes[role].general[generalRule], units.heroes[role].general[generalRule])}</li>`
            }
            generalChangeRender = `
                <div class="PatchNotes-sectionDescription">
                    <ul>
                        ${generalChangeRender}
                    </ul>
                </div>
            `;
        }
        let heroChanges = "";
        for (let hero of Object.keys(changes.heroes[role]).sort()) {
            if (hero == "general") continue;
            let generalChangesRender = "";
            let heroData = changes.heroes[role][hero];
            if (Array.isArray(heroData)) {
                if (heroData[1] != undefined) {
                    heroData = heroData[1];
                } else {
                    heroChanges += `
                    <div class="PatchNotesHeroUpdate">
                        <div class="PatchNotesHeroUpdate-header"><img class="PatchNotesHeroUpdate-icon" src="${hero_images[hero]}">
                            <h5 class="PatchNotesHeroUpdate-name">${hero}</h5>
                        </div>
                        <div class="PatchNotesHeroUpdate-body">
                            <div class="PatchNotesHeroUpdate-generalUpdates">
                                <ul><li>Removed</li></ul>
                            </div>
                        </div>
                    </div>`;
                    continue;
                }
            }
            if (heroData.general) {
                generalChangesRender += "<ul>";
                for (let property in heroData.general) {
                    generalChangesRender += `<li>${getChangeText(property, heroData.general[property], units.heroes[role][hero].general[property])}</li>`
                }
                generalChangesRender += "</ul>";
            }
            let abilities = "";
            for (let ability in heroData.abilities) {
                let ability_changes = "";
                let abilityData = heroData.abilities[ability];
                if (Array.isArray(abilityData)) {
                    if (abilityData[1] != undefined) {
                        abilityData = abilityData[1];
                    } else {
                        abilities += `
                            <div class="PatchNotesAbilityUpdate">
                                <div class="PatchNotesAbilityUpdate-icon-container"><img class="PatchNotesAbilityUpdate-icon" src="${ability_images[ability]}">
                                </div>
                                <div class="PatchNotesAbilityUpdate-text">
                                    <div class="PatchNotesAbilityUpdate-name">${ability}</div>
                                    <div class="PatchNotesAbilityUpdate-detailList">
                                        <ul>
                                            <li>Removed</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        `;
                        continue;
                    }
                }
                for (let stat in abilityData) {
                    if (!units.heroes[role][hero].abilities[ability]) {
                        console.error(`Missing ability for ${hero} - ${ability}`)
                        break;
                    }
                    if (!units.heroes[role][hero].abilities[ability][stat]) {
                        if (calculation_units.heroes[role][hero].abilities[ability][stat]) {
                            units.heroes[role][hero].abilities[ability][stat] = "none"
                        } else {
                            console.error(`Missing units for ${hero} - ${ability} - ${stat}`)
                        }
                    }
                    ability_changes += `<li>${getChangeText(stat, abilityData[stat], units.heroes[role][hero].abilities[ability][stat])}</li>`;
                }
                abilities += `
                    <div class="PatchNotesAbilityUpdate">
                        <div class="PatchNotesAbilityUpdate-icon-container"><img class="PatchNotesAbilityUpdate-icon" src="${ability_images[ability]}">
                        </div>
                        <div class="PatchNotesAbilityUpdate-text">
                            <div class="PatchNotesAbilityUpdate-name">${ability}</div>
                            <div class="PatchNotesAbilityUpdate-detailList">
                                <ul>
                                    ${ability_changes}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }
            let breakpointsRender = ""
            if (heroData.breakpoints) {
                breakpointsRender += "<ul>";
                for (let property in heroData.breakpoints) {
                    breakpointsRender += `<li>${getChangeText(property, heroData.breakpoints[property], "none")}</li>`
                }
                breakpointsRender += "</ul>";
            }
            heroChanges += `
            <div class="PatchNotesHeroUpdate">
                <div class="PatchNotesHeroUpdate-header"><img class="PatchNotesHeroUpdate-icon" src="${hero_images[hero]}">
                    <h5 class="PatchNotesHeroUpdate-name">${hero}</h5>
                </div>
                <div class="PatchNotesHeroUpdate-body">
                    <div class="PatchNotesHeroUpdate-generalUpdates">
                    ${generalChangesRender}
                    </div>
                    <div class="PatchNotesHeroUpdate-abilitiesList">
                    ${abilities}
                    </div>
                    <div class="PatchNotesHeroUpdate-generalUpdates">
                    ${breakpointsRender}
                    </div>
                </div>
            </div>`;
        }
        hero_section.innerHTML += `
        <div class="PatchNotes-section PatchNotes-section-hero_update">
            <h4 class="PatchNotes-sectionTitle">${role}</h4>
            ${generalChangeRender}
            <div class="PatchNotes-update PatchNotes-section-hero_update"></div>
            ${heroChanges}
        </div>
        `;
    }
    if (changes["Map list"]) {
        let change_render = "";
        for (let map in changes["Map list"]) {
            let map_change = changes["Map list"][map];
            if (map_change[0] === undefined) {
                change_render += `<li>New map ${map}.</li>`;
            } else {
                change_render += `<li>${map} majorly updated.</li>`;
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
        `;
    }

    if (changes.modes) {
        let changeRender = "";
        for (let mode in changes.modes) {
            if (Array.isArray(changes.modes[mode])) {
                if (changes.modes[mode][1] == undefined) {
                    changeRender += `
                            <div class="PatchNotesGeneralUpdate-title">${mode}</div>
                            <div class="PatchNotesGeneralUpdate-description">
                                <ul>Removed</ul>
                            </div>`
                } else {
                    let mode_changes = "";
                    for (let change in changes.modes[mode][1]) {
                        mode_changes += `<li>${getChangeText(change, [undefined, changes.modes[mode][1][change]], units.modes[mode][change])}</li>`
                    }
                    changeRender += `
                            <div class="PatchNotesGeneralUpdate-title">${mode}</div>
                            <div class="PatchNotesGeneralUpdate-description">
                                <ul><li>Mode added</li>${mode_changes}</ul>
                            </div>`
                }
                continue;
            }
            let mode_changes = "";
            for (let change in changes.modes[mode]) {
                mode_changes += `<li>${getChangeText(change, changes.modes[mode][change], units.modes[mode][change])}</li>`
            }
            changeRender += `
                    <div class="PatchNotesGeneralUpdate-title">${mode}</div>
                    <div class="PatchNotesGeneralUpdate-description">
                        <ul>${mode_changes}</ul>
                    </div>`
        }
        hero_section.innerHTML += `
            <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Mode Updates</h4>
                <div class="PatchNotes-update PatchNotes-section-generic_update"></div>
                <div class="PatchNotesGeneralUpdate">
                    ${changeRender}
                </div>
            </div>
        `;
    }
}

export function applyDamageMultiplier(patch_data: PatchData, multiplier: number, calculation_units: CalculationUnits): PatchData {
    if (typeof patch_data.general["Quick melee damage"] == "number") {
        patch_data.general["Quick melee damage"] *= multiplier
    }
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general") continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];

            for (let ability in patch_data.heroes[role][hero].abilities) {
                for (let ability_property in heroData.abilities[ability]) {
                    let property_units = heroUnits.abilities[ability][ability_property]
                    if (typeof heroData.abilities[ability][ability_property] === "number") {
                        if (property_units.some((unit) => ["damage instance"].includes(unit[0]))) {
                            heroData.abilities[ability][ability_property] *= multiplier
                        }
                    }
                }
            }
        }
    }
    return patch_data
}

export function calculatePreArmorProperties(patch_data: PatchData, calculation_units: CalculationUnits) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general") continue;

            for (let ability in patch_data.heroes[role][hero].abilities) {
                const abilityData = patch_data.heroes[role][hero].abilities[ability];
                const abilityDataUnits = calculation_units.heroes[role][hero].abilities[ability];

                for (let damage_or_healing of ["damage", "healing"] as const) {
                    let total_damage = Object.keys(abilityData)
                        .flatMap((property) => abilityDataUnits[property]
                            .filter((unit) => Array.isArray(unit))
                            .filter((unit) => unit[0] === `${damage_or_healing} instance`)
                            .map((unit) => [unit[1], abilityData[property]] as const))
                        .reduce<{ [key: string]: number }>((acc, [dmg_type, amount]) => {
                            if (!(dmg_type in acc)) acc[dmg_type] = 0;
                            if (typeof amount === "number") acc[dmg_type] += amount;
                            return acc
                        }, {})

                    let crit_data =
                        Object.entries(calculation_units.heroes[role][hero].abilities[ability])
                            .map(([key, calc_units]) => [calc_units, patch_data.heroes[role][hero].abilities[ability][key]] as const)
                            .filter((entry): entry is [CalculationUnit[], number] => typeof entry[1] === "number")
                            .map(([calc_units, multiplier]) =>
                                [calc_units
                                    .filter((unit) => Array.isArray(unit))
                                    .filter((unit) => unit[0] === "critical multiplier")
                                    .map((unit) => rest(unit)), multiplier] as const)
                            .flatMap(([crit_types, multiplier]) => crit_types.map((crit_type) => [crit_type, multiplier] as const))
                    for (let total_damage_type in total_damage) {
                        patch_data.heroes[role][hero].abilities[ability][`Total ${total_damage_type} instance ${damage_or_healing}`] = total_damage[total_damage_type]
                        calculation_units.heroes[role][hero].abilities[ability][`Total ${total_damage_type} instance ${damage_or_healing}`] = [[`total instance ${damage_or_healing}`, total_damage_type]]

                        for (let [crit_type, critical_multiplier] of crit_data) {
                            let adj_critical_multiplier = 1
                            if(crit_type[1] === undefined || crit_type[1] === total_damage_type) {
                                adj_critical_multiplier = critical_multiplier
                            }
                            patch_data.heroes[role][hero].abilities[ability][`Total ${total_damage_type} instance ${crit_type} ${damage_or_healing}`] = total_damage[total_damage_type] * adj_critical_multiplier
                            calculation_units.heroes[role][hero].abilities[ability][`Total ${total_damage_type} instance ${crit_type} ${damage_or_healing}`] = [[`total instance crit ${damage_or_healing}`, total_damage_type, crit_type[0]]]
                        }
                    }
                }
            }
        }
    }
    return patch_data
}

function applyArmorToStat(stat: number, min_damage_reduction: number, max_damage_reduction: number, flat_damage_reduction: number): number {
    return Math.min(Math.max(stat - flat_damage_reduction, stat * (1 - max_damage_reduction)), stat * (1 - min_damage_reduction))
}

export function applyArmor(patch_data: PatchData, calculation_units: CalculationUnits): PatchData {
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
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general") continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            for (let ability in heroData.abilities) {
                for (let ability_property in heroData.abilities[ability]) {
                    let property_units = heroUnits.abilities[ability][ability_property]
                    if (typeof heroData.abilities[ability][ability_property] === "number") {
                        if (property_units.some((unit) => ["total instance damage", "total instance crit damage"].includes(unit[0]))) {
                            heroData.abilities[ability][ability_property] = applyArmorToStat(heroData.abilities[ability][ability_property], min_damage_reduction, max_damage_reduction, flat_damage_reduction)
                        }
                    }
                }
            }
        }
    }
    return patch_data
}

export function calculatePostArmorProperties(patch_data: PatchData, calculation_units: CalculationUnits) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general") continue;
            const generalHeroData = patch_data.heroes[role][hero].general;
            const generalHeroDataUnits = calculation_units.heroes[role][hero].general;
            if (generalHeroData === undefined) {
                console.error(`No general hero data for ${hero}`)
                continue
            }
            let total_health = Object.keys(generalHeroData)
                .filter((general_property) => generalHeroDataUnits[general_property].includes("health"))
                .map((general_property) => generalHeroData[general_property])
                .filter((general_property) => typeof general_property === "number")
                .reduce((a, c) => a + c, 0)
            patch_data.heroes[role][hero].general["Total health"] = total_health;

            for (let ability in patch_data.heroes[role][hero].abilities) {
                const abilityData = patch_data.heroes[role][hero].abilities[ability];
                const abilityDataUnits = calculation_units.heroes[role][hero].abilities[ability];
                if (typeof abilityData["Alt fire of"] == "string") {
                    if (!("Ammo" in abilityData) && "Ammo" in patch_data.heroes[role][hero].abilities[abilityData["Alt fire of"]]) {
                        patch_data.heroes[role][hero].abilities[ability]["Ammo"] = patch_data.heroes[role][hero].abilities[abilityData["Alt fire of"]]["Ammo"];
                    }
                    if ("Reload time" in patch_data.heroes[role][hero].abilities[abilityData["Alt fire of"]]) {
                        patch_data.heroes[role][hero].abilities[ability]["Reload time"] = patch_data.heroes[role][hero].abilities[abilityData["Alt fire of"]]["Reload time"];
                    }
                    if ("Reload time per ammo" in patch_data.heroes[role][hero].abilities[abilityData["Alt fire of"]]) {
                        patch_data.heroes[role][hero].abilities[ability]["Reload time per ammo"] = patch_data.heroes[role][hero].abilities[abilityData["Alt fire of"]]["Reload time per ammo"];
                    }
                }
                for (let damage_or_healing of ["damage", "healing"] as const) {
                    for (let ability_property in abilityData) {
                        let property_units = abilityDataUnits[ability_property]
                        if (typeof abilityData[ability_property] === "number") {
                            let damage = abilityData[ability_property]
                            {
                                let damage_types = property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total instance ${damage_or_healing}`).map((unit) => unit[1]);
                                for (let damage_type of damage_types) {
                                    abilityData[`Total ${damage_type} ${damage_or_healing}`] = damage
                                    abilityDataUnits[`Total ${damage_type} ${damage_or_healing}`] = [[`total ${damage_or_healing}`, damage_type]]
                                }
                            }
                            {
                                let damage_types = property_units
                                    .filter((unit) => Array.isArray(unit))
                                    .filter((unit): unit is [`total instance crit ${typeof damage_or_healing}`, string, string] => unit[0] == `total instance crit ${damage_or_healing}`)
                                    .map((unit) => [unit[1], unit[2]] as const);
                                for (let [damage_type, crit_type] of damage_types) {
                                    abilityData[`Total ${damage_type} ${crit_type} ${damage_or_healing}`] = damage
                                    abilityDataUnits[`Total ${damage_type} ${crit_type} ${damage_or_healing}`] = [[`total crit ${damage_or_healing}`, damage_type, crit_type]]
                                }
                            }
                        }
                    }
                    for (let pellet_count_ability_property in abilityData) {
                        let pellet_count_property_units = abilityDataUnits[pellet_count_ability_property]
                        if (typeof abilityData[pellet_count_ability_property] === "number") {
                            let multiplier_types = pellet_count_property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == "pellet count" || unit[0] == "bullets per burst").map((unit) => unit[1]);
                            let multiplier = abilityData[pellet_count_ability_property]
                            for (let damage_type of multiplier_types) {
                                for (let ability_property in abilityData) {
                                    let property_units = abilityDataUnits[ability_property]
                                    if (typeof abilityData[ability_property] === "number") {
                                        if (property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]).includes(damage_type)) {
                                            abilityData[ability_property] *= multiplier
                                        }
                                        if (property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total crit ${damage_or_healing}`).map((unit) => unit[1]).includes(damage_type)) {
                                            abilityData[ability_property] *= multiplier
                                        }
                                    }
                                }
                            }
                        }
                    }
                    {
                        let total_damage = 0
                        let total_crit_damage: { [key: string]: number } = {}
                        for (let ability_property in abilityData) {
                            let property_units = abilityDataUnits[ability_property]
                            if (typeof abilityData[ability_property] === "number") {
                                let damage = abilityData[ability_property]
                                {
                                    let damage_types = property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]);
                                    if (damage_types.length > 0) {
                                        total_damage += damage
                                    }
                                }
                                {
                                    let damage_types = property_units.filter((unit) => Array.isArray(unit)).filter((unit): unit is [`total crit ${typeof damage_or_healing}`, string, string] => unit[0] == `total crit ${damage_or_healing}`).map((unit) => [unit[1], unit[2]] as const);
                                    for (let [_, crit_type] of damage_types) {
                                        if (!(crit_type in total_crit_damage)) {
                                            total_crit_damage[crit_type] = 0
                                        }
                                        total_crit_damage[crit_type] += damage
                                    }
                                }
                            }
                        }
                        if (total_damage > 0) {
                            abilityData[`Total ${damage_or_healing}`] = total_damage
                            abilityDataUnits[`Total ${damage_or_healing}`] = [`total ${damage_or_healing}`]
                            if (damage_or_healing === "damage") {
                                abilityDataUnits[`Total ${damage_or_healing}`].push("breakpoint damage")
                            }
                        }
                        for (let crit_damage_type in total_crit_damage) {
                            abilityData[`Total ${crit_damage_type} ${damage_or_healing}`] = total_crit_damage[crit_damage_type]
                            abilityDataUnits[`Total ${crit_damage_type} ${damage_or_healing}`] = [`total crit ${damage_or_healing}`]
                            if (damage_or_healing === "damage") {
                                abilityDataUnits[`Total ${crit_damage_type} ${damage_or_healing}`].push("breakpoint damage")
                            }
                        }
                    }
                }
            }
        }
    }
    return patch_data
}

export function calculateBreakpoints(patch_data: PatchData, calculation_units: CalculationUnits): PatchData {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general") continue;
            let hero_data = patch_data.heroes[role][hero];
            let hero_data_units = calculation_units.heroes[role][hero];
            let damage_options: { [key: string]: { [key: string]: number } } = {};
            if (typeof patch_data.general["Quick melee damage"] == "number" && hero_data.general["has overridden melee"] !== true) {
                damage_options["Melee"] = {}
                damage_options["Melee"][""] = patch_data.general["Quick melee damage"]
            }
            for (let ability in hero_data.abilities) {
                let max_damage_instances = 1;
                let ability_damage_options: { [key: string]: number } = {}
                for (let ability_property in hero_data.abilities[ability]) {
                    for (let property_unit of hero_data_units.abilities[ability][ability_property]) {
                        if (property_unit == "breakpoint damage") {
                            if (typeof hero_data.abilities[ability][ability_property] === "number") {
                                ability_damage_options[ability_property] = hero_data.abilities[ability][ability_property]
                            }
                        } else if (property_unit == "ammo") {
                            if (typeof hero_data.abilities[ability][ability_property] === "number") {
                                max_damage_instances = Math.max(max_damage_instances, Math.min(3, hero_data.abilities[ability][ability_property]))
                            }
                        } else if (property_unit == "charges") {
                            if (typeof hero_data.abilities[ability][ability_property] === "number") {
                                max_damage_instances = Math.max(max_damage_instances, hero_data.abilities[ability][ability_property])
                            }
                        } else if (property_unit == "time between shots") {
                            max_damage_instances = Math.max(max_damage_instances, 3)
                        }
                    }
                }

                let ability_damage_option_set: { [key: string]: number } = { "": 0 }
                for (let damage_option in ability_damage_options) {
                    for (let i = 0; i < max_damage_instances; i++) {
                        for (let damage_option_set_element in ability_damage_option_set) {
                            if (damage_option_set_element.split(" + ").length <= max_damage_instances) {
                                ability_damage_option_set[`${damage_option_set_element} + ${damage_option}`] = ability_damage_options[damage_option] + ability_damage_option_set[damage_option_set_element]
                            }
                        }
                    }
                }
                delete ability_damage_option_set[""]
                damage_options[ability] = {}
                for (let ability_damage_option in ability_damage_option_set) {
                    damage_options[ability][`${ability_damage_option.substring(2).toLowerCase()}`] = ability_damage_option_set[ability_damage_option]
                }
            }
            let breakpointDamage: { [key: string]: number } = { "": 0 }
            for (let ability in damage_options) {
                for (let damageEntry in breakpointDamage) {
                    for (let damageOption in damage_options[ability]) {
                        breakpointDamage[`${damageEntry}, ${ability}${damageOption === "" ? "" : " "}${damageOption}`] = breakpointDamage[damageEntry] + damage_options[ability][damageOption]
                    }
                }
            }
            let breakpointDamageEntries: { [key: string]: number } = {}
            for (let breakpoint in breakpointDamage) {
                let breakpointHealth = damageBreakPointHealthValues.findLast((v) => v <= breakpointDamage[breakpoint]);
                if (breakpointHealth !== undefined) {
                    breakpointDamageEntries[`Breakpoint for ${breakpoint.substring(2)}`] = breakpointHealth
                }
            }
            patch_data.heroes[role][hero].breakpoints = breakpointDamageEntries;
        }
    }
    return patch_data
}

export function calculateRates(patch_data: PatchData, calculation_units: CalculationUnits) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general") continue;
            const generalHeroData = patch_data.heroes[role][hero].general;
            if (generalHeroData === undefined) {
                console.error(`No general hero data for ${hero}`)
                continue
            }

            for (let ability in patch_data.heroes[role][hero].abilities) {
                const abilityData = patch_data.heroes[role][hero].abilities[ability];
                const abilityDataUnits = calculation_units.heroes[role][hero].abilities[ability];

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
                            abilityData["Damage per second"] = damage_per_second
                            abilityDataUnits["Damage per second"] = ["damage per second"]
                        }
                        if (crit_damage_per_second > 0) {
                            abilityData["Critical damage per second"] = crit_damage_per_second
                            abilityDataUnits["Critical damage per second"] = []
                        }
                        if (healing_per_second > 0) {
                            abilityData["Healing per second"] = healing_per_second
                            abilityDataUnits["Healing per second"] = ["healing per second"]
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
                    if (damage_per_second > 0) {
                        let damage_per_second_incl_reload = damage_per_second * time_before_reload / (time_before_reload + reload_time)
                        abilityData["Damage per second(including reload)"] = damage_per_second_incl_reload
                        abilityDataUnits["Damage per second(including reload)"] = []
                    }
                    if (healing_per_second > 0) {
                        let healing_per_second_incl_reload = healing_per_second * time_before_reload / (time_before_reload + reload_time)
                        abilityData["Healing per second(including reload)"] = healing_per_second_incl_reload
                        abilityDataUnits["Healing per second(including reload)"] = []
                    }
                }
            }
        }
    }
    return patch_data
}

function cleanupProperties(patch_data: PatchData, calculation_units: CalculationUnits) {
    // return patch_data;
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general") continue;
            let heroData = patch_data.heroes[role][hero]
            let heroDataUnits = calculation_units.heroes[role][hero]
            for (let ability in patch_data.heroes[role][hero].abilities) {
                for (let damage_or_healing of ["damage", "healing"]) {
                    const abilityData = heroData.abilities[ability];
                    const abilityDataUnits = heroDataUnits.abilities[ability];
                    let damage_type_damage: { [key: string]: number } = {}
                    let crit_damage_type_damage: { [key: string]: number } = {}
                    for (let property in abilityData) {
                        if (typeof abilityData[property] === "number") {
                            let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]);
                            for (let property_damage_type of property_damage_types) {
                                damage_type_damage[property_damage_type] = abilityData[property]
                            }
                            let crit_property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total crit ${damage_or_healing}`).map((unit) => unit[1]);
                            for (let property_damage_type of crit_property_damage_types) {
                                crit_damage_type_damage[property_damage_type] = abilityData[property]
                            }
                        }
                    }
                    let damage_type_instance_damage: { [key: string]: number } = {}
                    for (let property in abilityData) {
                        if (typeof abilityData[property] === "number") {
                            let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total instance ${damage_or_healing}`).map((unit) => unit[1])
                            for (let property_damage_type of property_damage_types) {
                                damage_type_instance_damage[property_damage_type] = abilityData[property]
                                if (damage_type_damage[property_damage_type] === abilityData[property]) {
                                    delete abilityData[property]
                                    break
                                }
                            }
                            let property_crit_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total instance crit ${damage_or_healing}`).map((unit) => unit[1]);
                            for (let property_damage_type of property_crit_damage_types) {
                                if (crit_damage_type_damage[property_damage_type] === abilityData[property]) {
                                    delete abilityData[property]
                                    break
                                }
                            }
                        }
                    }
                    for (let property in abilityData) {
                        if (typeof abilityData[property] === "number") {
                            let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `${damage_or_healing} instance`).map((unit) => unit[1])
                            for (let property_damage_type of property_damage_types) {
                                if (damage_type_instance_damage[property_damage_type] === abilityData[property]) {
                                    delete abilityData[property]
                                    break
                                }
                            }
                        }
                    }
                    if (Object.keys(damage_type_damage).length == 1) {
                        for (let property in abilityData) {
                            if (typeof abilityData[property] === "number") {
                                let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]);
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
                                let crit_property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total crit ${damage_or_healing}`).map((unit) => unit[1]);
                                if (crit_property_damage_types.length > 0) {
                                    delete abilityData[property]
                                    continue
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return patch_data
}

let patch_options = Object.entries(patchList)
    .flatMap(([k, v]) => v
        .map((p) => {
            let split_date = p.split("-").map((s) => parseInt(s))
            let pretty_date = new Date(split_date[0], split_date[1] - 1, split_date[2])
            return `<option value=\"${k}:${p}\">${k} - ${pretty_date.toLocaleDateString()}</option>`
        })
    ).join();

let patch_selectors = document.getElementsByClassName("patch-selector");
for (let i = 0; i < patch_selectors.length; i++) {
    patch_selectors[i].innerHTML = patch_options;
}

patch_before_box.onchange = async function () {
    siteState.before_patch = (this as HTMLSelectElement).value;
    await updatePatchNotes()
};

patch_after_box.onchange = async function () {
    siteState.after_patch = (this as HTMLSelectElement).value;
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

patch_before_dmg_boost.onchange = async function () {
    siteState.before_dmg_boost = parseFloat((this as HTMLInputElement).value) / 100.0;
    await updatePatchNotes()
};
patch_before_dmg_boost_slider.onchange = async function () {
    siteState.before_dmg_boost = parseFloat((this as HTMLInputElement).value) / 100.0;
    await updatePatchNotes()
};

patch_after_dmg_boost.onchange = async function () {
    siteState.after_dmg_boost = parseFloat((this as HTMLInputElement).value) / 100.0;
    await updatePatchNotes()
};
patch_after_dmg_boost_slider.onchange = async function () {
    siteState.after_dmg_boost = parseFloat((this as HTMLInputElement).value) / 100.0;
    await updatePatchNotes()
};

window.addEventListener("popstate", async (event) => {
    if (event.state) {
        siteState = event.state;
        await updatePatchNotes()
    }
});

last_patch_button.onclick = async function () {
    let before_path = siteState.before_patch.split(":");
    let before_index = patchList[before_path[0]].indexOf(before_path[1]);
    if (before_index > 0) {
        siteState.before_patch = `${before_path[0]}:${patchList[before_path[0]][before_index - 1]}`
    }
    let after_path = siteState.after_patch.split(":");
    let after_index = patchList[after_path[0]].indexOf(after_path[1]);
    if (after_index > 0) {
        siteState.after_patch = `${after_path[0]}:${patchList[after_path[0]][after_index - 1]}`
    }
    await updatePatchNotes()
};

next_patch_button.onclick = async function () {
    let before_path = siteState.before_patch.split(":");
    let before_index = patchList[before_path[0]].indexOf(before_path[1]);
    if (before_index < patchList[before_path[0]].length) {
        siteState.before_patch = `${before_path[0]}:${patchList[before_path[0]][before_index + 1]}`
    }
    let after_path = siteState.after_patch.split(":");
    let after_index = patchList[after_path[0]].indexOf(after_path[1]);
    if (after_index < patchList[after_path[0]].length) {
        siteState.after_patch = `${after_path[0]}:${patchList[after_path[0]][after_index + 1]}`
    }
    await updatePatchNotes()
};

await updatePatchNotes();

function reorder<T extends { [key: string]: any }>(to_reorder: T, pattern: { [key: string]: any }): T {
    let reordered: { [key: string]: any } = {}
    for (let key in pattern) {
        if (key in to_reorder) {
            if (typeof pattern[key] === "object") {
                reordered[key] = reorder(to_reorder[key], pattern[key])
            } else {
                reordered[key] = to_reorder[key]
            }
        }
    }
    for (let key in to_reorder) {
        if (!(key in reordered)) {
            reordered[key] = to_reorder[key]
        }
    }
    return reordered as T
}
