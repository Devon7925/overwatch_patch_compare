// import units from "./units.json" with { type: "json" };
// cant use because firefox dumb https://bugzilla.mozilla.org/show_bug.cgi?id=1736059
import { autoTypeguard, isArrayMatchingTypeguard, isKeyOf, isLiteral, isNumber, isObjectWithValues, isString, isTupleMatchingTypeguards, partialTypeguard, unionTypeguard } from "./utils.js";
const damageBreakPointHealthValues = [150, 175, 200, 225, 250, 300];
const specialArmorBehaviorDamageTypes = {
    "damage over time": ["flat percent mit", 0],
    "lightning": ["flat percent mit", 0],
    "beam": ["flat percent mit", 0.3],
};
const patchList = await fetch("./patch_list.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text, (key, value) => {
    if (typeof value != "string") {
        return value;
    }
    return value.replace(/(\.\w+)+$/, "");
})).then((patchList) => {
    if (!(isObjectWithValues(isArrayMatchingTypeguard(isString)))(patchList))
        throw new Error("patchList could not be verified");
    return patchList;
});
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let siteState;
let defaultSiteState = {
    before_patch: "Overwatch 2:recent",
    after_patch: "Overwatch 2:latest",
    show_calculated_properties: false,
    show_breakpoints: false,
    apply_to_armor: false,
    before_dmg_boost: 1,
    after_dmg_boost: 1,
};
function rest(array) {
    return array.slice(1);
}
function patch_from_path(joined_path) {
    let path = joined_path.split(":");
    let versionType = path[0];
    let version = "";
    if (path[1] == "oldest") {
        version = patchList[path[0]][0];
    }
    else if (path[1] == "latest") {
        version = patchList[path[0]][patchList[path[0]].length - 1];
    }
    else if (path[1] == "recent") {
        version = patchList[path[0]][patchList[path[0]].length - 2];
    }
    else {
        version = path[1];
    }
    return `${versionType}:${version}`;
}
{
    siteState = structuredClone(defaultSiteState);
    {
        let url_before = urlParams.get("before");
        if (url_before) {
            siteState.before_patch = url_before;
        }
        let url_after = urlParams.get("after");
        if (url_after) {
            siteState.after_patch = url_after;
        }
        url_before = urlParams.get("before_patch");
        if (url_before) {
            siteState.before_patch = url_before;
        }
        url_after = urlParams.get("after_patch");
        if (url_after) {
            siteState.after_patch = url_after;
        }
    }
    if (urlParams.get("show_calculated_properties")) {
        siteState.show_calculated_properties = urlParams.get("show_calculated_properties") === "true";
    }
    if (urlParams.get("show_breakpoints")) {
        siteState.show_breakpoints = urlParams.get("show_breakpoints") === "true";
    }
    if (urlParams.get("apply_to_armor")) {
        siteState.apply_to_armor = urlParams.get("apply_to_armor") === "true";
    }
    let before_dmg_boost_param = urlParams.get("before_dmg_boost");
    if (typeof before_dmg_boost_param == "string") {
        siteState.before_dmg_boost = parseFloat(before_dmg_boost_param);
    }
    let after_dmg_boost_param = urlParams.get("after_dmg_boost");
    if (typeof after_dmg_boost_param == "string") {
        siteState.after_dmg_boost = parseFloat(after_dmg_boost_param);
    }
    siteState.before_patch = patch_from_path(siteState.before_patch);
    siteState.after_patch = patch_from_path(siteState.after_patch);
}
{
    let newUrlParams = new URLSearchParams();
    let key;
    for (key in siteState) {
        newUrlParams.append(key, `${siteState[key]}`);
    }
    window.history.replaceState(siteState, "", "index.html?" + newUrlParams);
}
const isUnit = unionTypeguard([
    isLiteral("none"),
    isLiteral("percent"),
    isLiteral("meters"),
    isLiteral("seconds"),
    isLiteral("health per second"),
    isLiteral("meters per second"),
    isLiteral("relative percent"),
    isLiteral("flag")
]);
const isUnits = autoTypeguard({
    general: isObjectWithValues(isUnit),
    heroes: isObjectWithValues(partialTypeguard("general", isObjectWithValues(isUnit), isObjectWithValues(autoTypeguard({
        general: isObjectWithValues(isUnit),
        abilities: isObjectWithValues(isObjectWithValues(isUnit)),
    }, {
        breakpoints: isObjectWithValues(isUnit)
    })))),
    modes: isObjectWithValues(isObjectWithValues(isUnit)),
}, {});
const isCalculationUnit = unionTypeguard([
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
]);
const isCalculationUnits = autoTypeguard({
    general: isObjectWithValues(isArrayMatchingTypeguard(isCalculationUnit)),
    heroes: isObjectWithValues(partialTypeguard("general", isObjectWithValues(isArrayMatchingTypeguard(isCalculationUnit)), isObjectWithValues(autoTypeguard({
        general: isObjectWithValues(isArrayMatchingTypeguard(isCalculationUnit)),
        abilities: isObjectWithValues(isObjectWithValues(isArrayMatchingTypeguard(isCalculationUnit))),
    }, {
        breakpoints: isObjectWithValues(isArrayMatchingTypeguard(isCalculationUnit))
    })))),
    modes: isObjectWithValues(isObjectWithValues(isArrayMatchingTypeguard(isCalculationUnit)))
}, {});
const isValue = unionTypeguard([isString, isNumber, isLiteral(false), isLiteral(true)]);
const isPatchData = autoTypeguard({
    general: isObjectWithValues(isValue),
    heroes: isObjectWithValues(partialTypeguard("general", isObjectWithValues(isValue), isObjectWithValues(autoTypeguard({
        general: isObjectWithValues(isValue),
        abilities: isObjectWithValues(isObjectWithValues(isValue)),
    }, {
        breakpoints: isObjectWithValues(isValue)
    })))),
    modes: isObjectWithValues(isObjectWithValues(isValue)),
    "Map list": isObjectWithValues(isNumber),
}, {});
let units;
let calculation_units;
let hero_images = {};
let ability_images = {};
export let patches = {};
let promises = [];
promises.push(fetch("./units.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text))
    .then((possible_units) => {
    if (!isUnits(possible_units))
        throw new Error("Units is incorrect");
    return possible_units;
})
    .then((units_data) => units = units_data));
promises.push(fetch("./calculation_units.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text))
    .then((possible_calculation_units) => {
    if (!isCalculationUnits(possible_calculation_units))
        throw new Error("Calculation units is incorrect");
    return possible_calculation_units;
})
    .then((calculation_units_data) => calculation_units = calculation_units_data));
promises.push(fetch("./hero_images.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text))
    .then((possible_hero_images) => {
    if (!(isObjectWithValues(isString))(possible_hero_images))
        throw new Error("Hero images is incorrect");
    return possible_hero_images;
})
    .then((hero_images_data) => hero_images = hero_images_data));
promises.push(fetch("./ability_images.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text))
    .then((possible_ability_images) => {
    if (!(isObjectWithValues(isString))(possible_ability_images))
        throw new Error("Ability images is incorrect");
    return possible_ability_images;
})
    .then((ability_images_data) => ability_images = ability_images_data));
await Promise.all(promises);
function isEmpty(obj) {
    for (var i in obj) {
        return false;
    }
    return true;
}
function round(num, decimalPlaces = 0) {
    num = Math.round(parseFloat(num + "e" + decimalPlaces));
    return Number(num + "e" + -decimalPlaces);
}
export function convert_to_changes(before, after) {
    if (typeof before == "object" && typeof after == "object") {
        let result = {};
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
export function getChangeText(name, change, units, display_as_new) {
    if (!Array.isArray(change)) {
        change = [undefined, change];
    }
    if (typeof change[0] === "number") {
        change[0] = round(change[0], 2);
    }
    if (typeof change[1] === "number") {
        change[1] = round(change[1], 2);
    }
    if (change[0] === undefined) {
        let new_value = change[1];
        if (!Array.isArray(change)) {
            new_value = change;
        }
        let prefix = display_as_new ? "" : "There is now ";
        if (units == "percent") {
            return `${prefix}${new_value}% ${name.toLowerCase()}.`;
        }
        else if (units == "meters") {
            return `${prefix}${new_value} meter ${name.toLowerCase()}.`;
        }
        else if (units == "seconds") {
            return `${prefix}${new_value} second ${name.toLowerCase()}.`;
        }
        else if (units == "flag") {
            if (new_value === false) {
                return `No longer ${name}.`;
            }
            else {
                return `Now ${name}.`;
            }
        }
        return `${prefix}${new_value} ${name.toLowerCase()}.`;
    }
    else if (typeof change[0] == "number") {
        if (change[1] === undefined) {
            return `${name} removed.`;
        }
        else if (units == "percent") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]}% to ${change[1]}%.`;
        }
        else if (units == "health per second") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} health per second.`;
        }
        else if (units == "meters per second") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} meters per second.`;
        }
        else if (units == "seconds") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} seconds.`;
        }
        else if (units == "meters") {
            let change_type = "increased";
            if (change[0] > change[1]) {
                change_type = "reduced";
            }
            return `${name} ${change_type} from ${change[0]} to ${change[1]} meters.`;
        }
        else if (units == "relative percent") {
            if (change[0] > change[1]) {
                return `${name} reduced by ${round(100 * (1.0 - change[1] / change[0]), 2)}%.`;
            }
            else {
                return `${name} increased by ${round(100 * (change[1] / change[0] - 1.0), 2)}%.`;
            }
        }
        let change_type = "increased";
        if (change[0] > change[1]) {
            change_type = "reduced";
        }
        return `${name} ${change_type} from ${change[0]} to ${change[1]}.`;
    }
    else if (typeof change[0] == "boolean") {
        let change_type = "Now";
        if (change[0]) {
            change_type = "No longer";
        }
        return `${change_type} ${name}.`;
    }
    else if (typeof change[0] == "string") {
        return `${name} changed from ${change[0]} to ${change[1]}.`;
    }
}
let patch_before_box = document.querySelector("select#patch_before");
let patch_after_box = document.querySelector("select#patch_after");
let display_calculated_properties_box = document.querySelector("input#disp_calc_props");
let display_breakpoints_box = document.querySelector("input#disp_breakpoints");
let apply_damage_to_armor_box = document.querySelector("input#apply_damage_to_armor");
let last_patch_button = document.querySelector("button#last_patch_button");
let next_patch_button = document.querySelector("button#next_patch_button");
let patch_before_dmg_boost = document.querySelector("input#patch_before_dmg_boost");
let patch_before_dmg_boost_slider = document.querySelector("input#patch_before_dmg_boost_slider");
let patch_after_dmg_boost = document.querySelector("input#patch_after_dmg_boost");
let patch_after_dmg_boost_slider = document.querySelector("input#patch_after_dmg_boost_slider");
pair_box_slider(patch_before_dmg_boost, patch_before_dmg_boost_slider);
pair_box_slider(patch_after_dmg_boost, patch_after_dmg_boost_slider);
function pair_box_slider(patch_after_dmg_boost, patch_after_dmg_boost_slider) {
    let min_val = parseFloat(patch_after_dmg_boost_slider.min);
    let max_val = parseFloat(patch_after_dmg_boost_slider.max);
    let oldValue = patch_after_dmg_boost_slider.value;
    patch_after_dmg_boost.oninput = (e) => {
        let value = parseFloat(patch_after_dmg_boost.value);
        if (patch_after_dmg_boost.value === "") {
            patch_after_dmg_boost.value = "0";
        }
        else if (+patch_after_dmg_boost.value !== +patch_after_dmg_boost.value || value < min_val || value > max_val || isNaN(value)) {
            patch_after_dmg_boost.value = oldValue;
        }
        patch_after_dmg_boost.value = "" + parseFloat(patch_after_dmg_boost.value);
        oldValue = patch_after_dmg_boost.value;
        patch_after_dmg_boost_slider.value = oldValue;
    };
    patch_after_dmg_boost_slider.oninput = (e) => {
        let value = parseFloat(patch_after_dmg_boost_slider.value);
        oldValue = patch_after_dmg_boost_slider.value;
        patch_after_dmg_boost.value = oldValue;
    };
}
async function updatePatchNotes() {
    patch_before_box.value = siteState.before_patch;
    patch_after_box.value = siteState.after_patch;
    display_calculated_properties_box.checked = siteState.show_calculated_properties;
    if (siteState.show_calculated_properties) {
        (display_breakpoints_box.parentElement?.parentElement?.parentElement).style.display = "flex";
        (apply_damage_to_armor_box.parentElement?.parentElement?.parentElement).style.display = "flex";
        (patch_before_dmg_boost.parentElement?.parentElement).style.display = "flex";
        (patch_after_dmg_boost.parentElement?.parentElement).style.display = "flex";
    }
    else {
        (display_breakpoints_box.parentElement?.parentElement?.parentElement).style.display = "none";
        (apply_damage_to_armor_box.parentElement?.parentElement?.parentElement).style.display = "none";
        (patch_before_dmg_boost.parentElement?.parentElement).style.display = "none";
        (patch_after_dmg_boost.parentElement?.parentElement).style.display = "none";
        siteState.before_dmg_boost = 1;
        siteState.after_dmg_boost = 1;
        siteState.show_breakpoints = false;
        siteState.apply_to_armor = false;
    }
    display_breakpoints_box.checked = siteState.show_breakpoints;
    apply_damage_to_armor_box.checked = siteState.apply_to_armor;
    patch_before_dmg_boost.value = "" + (100 * siteState.before_dmg_boost);
    patch_before_dmg_boost_slider.value = "" + (100 * siteState.before_dmg_boost);
    patch_after_dmg_boost.value = "" + (100 * siteState.after_dmg_boost);
    patch_after_dmg_boost_slider.value = "" + (100 * siteState.after_dmg_boost);
    {
        let urlParams = new URLSearchParams();
        let key;
        for (key in siteState) {
            if (siteState[key] !== defaultSiteState[key]) {
                urlParams.append(key, `${siteState[key]}`);
            }
        }
        window.history.replaceState(siteState, "", "index.html?" + urlParams);
    }
    {
        let before_patch_path = siteState.before_patch.split(":");
        let after_patch_path = siteState.after_patch.split(":");
        const last_patch_exists = (before_patch_path[0] === after_patch_path[0]) && patchList[before_patch_path[0]].indexOf(before_patch_path[1]) > 0;
        const next_patch_exists = (before_patch_path[0] === after_patch_path[0]) && patchList[after_patch_path[0]].indexOf(after_patch_path[1]) < patchList[after_patch_path[0]].length - 1;
        last_patch_button.style.visibility = last_patch_exists ? 'visible' : 'hidden';
        next_patch_button.style.visibility = next_patch_exists ? 'visible' : 'hidden';
    }
    await Promise.all([siteState.before_patch, siteState.after_patch]
        .filter((patch) => !(patch in patchList))
        .map(async (patch) => {
        let [versionType, version] = patch.split(":");
        return fetch(`./patches/${versionType}/${version}.json`)
            .then((res) => res.text())
            .then((text) => {
            let patch = JSON.parse(text);
            if (!isPatchData(patch)) {
                throw new Error("Invalid patch data");
            }
            patches[`${versionType}:${version}`] = patch;
        });
    }));
    let before_patch_data = structuredClone(patches[siteState.before_patch]);
    let after_patch_data = structuredClone(patches[siteState.after_patch]);
    verifyPatchNotes(before_patch_data, calculation_units, units);
    verifyPatchNotes(after_patch_data, calculation_units, units);
    before_patch_data = reorder(before_patch_data, units);
    after_patch_data = reorder(after_patch_data, units);
    before_patch_data = applyDamageMultiplier(before_patch_data, parseFloat(patch_before_dmg_boost_slider.value) / 100, calculation_units);
    after_patch_data = applyDamageMultiplier(after_patch_data, parseFloat(patch_after_dmg_boost_slider.value) / 100, calculation_units);
    if (siteState.show_calculated_properties) {
        before_patch_data = calculatePreArmorProperties(before_patch_data, calculation_units);
        after_patch_data = calculatePreArmorProperties(after_patch_data, calculation_units);
    }
    if (siteState.apply_to_armor) {
        before_patch_data = applyArmor(before_patch_data, calculation_units);
        after_patch_data = applyArmor(after_patch_data, calculation_units);
    }
    if (siteState.show_calculated_properties) {
        before_patch_data = calculatePostArmorProperties(before_patch_data, calculation_units);
        after_patch_data = calculatePostArmorProperties(after_patch_data, calculation_units);
    }
    if (siteState.show_breakpoints) {
        before_patch_data = calculateBreakpoints(before_patch_data, calculation_units);
        after_patch_data = calculateBreakpoints(after_patch_data, calculation_units);
    }
    if (siteState.show_calculated_properties) {
        before_patch_data = calculateRates(before_patch_data, calculation_units);
        after_patch_data = calculateRates(after_patch_data, calculation_units);
        before_patch_data = cleanupProperties(before_patch_data, calculation_units);
        after_patch_data = cleanupProperties(after_patch_data, calculation_units);
    }
    let changes = convert_to_changes(before_patch_data, after_patch_data);
    let hero_section = document.getElementsByClassName("PatchNotes-section-hero_update")[0];
    hero_section.innerHTML = "";
    if (changes.general) {
        let changeRender = "";
        for (let generalRule in changes.general) {
            changeRender += `<li>${getChangeText(generalRule, changes.general[generalRule], units.general[generalRule], false)}</li>`;
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
        const roleData = changes.heroes[role];
        if (Array.isArray(roleData)) {
            throw new Error("Not supported: role missing from one patch");
        }
        if (roleData.general) {
            for (let generalRule in roleData.general) {
                generalChangeRender += `<li>${getChangeText(generalRule, roleData.general[generalRule], units.heroes[role].general[generalRule], false)}</li>`;
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
        for (let hero of Object.keys(roleData).sort()) {
            if (!isKeyOf(roleData, hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let generalChangesRender = "";
            let heroData = roleData[hero];
            let display_as_new = false;
            if (Array.isArray(heroData)) {
                if (heroData[1] !== undefined) {
                    heroData = heroData[1];
                    display_as_new = true;
                }
                else {
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
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (units.heroes[role][hero] === undefined) {
                throw new Error(`Units is missing hero ${hero}`);
            }
            if (calculation_units.heroes[role][hero] === undefined) {
                throw new Error("Invalid state");
            }
            if (heroData.general) {
                generalChangesRender += "<ul>";
                for (let property in heroData.general) {
                    generalChangesRender += `<li>${getChangeText(property, heroData.general[property], units.heroes[role][hero].general[property], display_as_new)}</li>`;
                }
                generalChangesRender += "</ul>";
            }
            let abilities = "";
            for (let ability in heroData.abilities) {
                let ability_changes = "";
                let abilityData = heroData.abilities[ability];
                let display_ability_as_new = display_as_new;
                if (Array.isArray(abilityData)) {
                    if (abilityData[1] != undefined) {
                        abilityData = abilityData[1];
                        display_ability_as_new = true;
                    }
                    else {
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
                        console.error(`Missing ability units for ${hero} - ${ability}`);
                        break;
                    }
                    if (!units.heroes[role][hero].abilities[ability][stat]) {
                        if (calculation_units.heroes[role][hero].abilities[ability][stat]) {
                            units.heroes[role][hero].abilities[ability][stat] = "none";
                        }
                        else {
                            console.error(`Missing units for ${hero} - ${ability} - ${stat}`);
                        }
                    }
                    ability_changes += `<li>${getChangeText(stat, abilityData[stat], units.heroes[role][hero].abilities[ability][stat], display_ability_as_new)}</li>`;
                }
                abilities += `
                    <div class="PatchNotesAbilityUpdate">
                        <div class="PatchNotesAbilityUpdate-icon-container"><img class="PatchNotesAbilityUpdate-icon" src="${ability_images[ability]}">
                        </div>
                        <div class="PatchNotesAbilityUpdate-text">
                            <div class="PatchNotesAbilityUpdate-name">${display_ability_as_new ? "(NEW) " : ""}${ability}</div>
                            <div class="PatchNotesAbilityUpdate-detailList">
                                <ul>
                                    ${ability_changes}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }
            let breakpointsRender = "";
            if (heroData.breakpoints) {
                if (Array.isArray(heroData.breakpoints)) {
                    throw new Error("Invalid State");
                }
                breakpointsRender += "<ul>";
                for (let property in heroData.breakpoints) {
                    if (Array.isArray(heroData.breakpoints[property])) {
                        if (heroData.breakpoints[property][0] === damageBreakPointHealthValues.at(-1))
                            continue;
                        if (heroData.breakpoints[property][1] === damageBreakPointHealthValues.at(-1))
                            continue;
                    }
                    else if (typeof heroData.breakpoints[property] === "number") {
                        if (heroData.breakpoints[property] === damageBreakPointHealthValues.at(-1))
                            continue;
                    }
                    breakpointsRender += `<li>${getChangeText(property, heroData.breakpoints[property], "none", true)}</li>`;
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
            if (!Array.isArray(map_change)) {
                map_change = [undefined, map_change];
            }
            if (map_change[0] === undefined) {
                change_render += `<li>New map ${map}.</li>`;
            }
            else {
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
                            </div>`;
                }
                else {
                    let mode_changes = "";
                    for (let change in changes.modes[mode][1]) {
                        mode_changes += `<li>${getChangeText(change, [undefined, changes.modes[mode][1][change]], units.modes[mode][change], true)}</li>`;
                    }
                    changeRender += `
                            <div class="PatchNotesGeneralUpdate-title">${mode}</div>
                            <div class="PatchNotesGeneralUpdate-description">
                                <ul><li>Mode added</li>${mode_changes}</ul>
                            </div>`;
                }
                continue;
            }
            let mode_changes = "";
            for (let change in changes.modes[mode]) {
                mode_changes += `<li>${getChangeText(change, changes.modes[mode][change], units.modes[mode][change], false)}</li>`;
            }
            changeRender += `
                    <div class="PatchNotesGeneralUpdate-title">${mode}</div>
                    <div class="PatchNotesGeneralUpdate-description">
                        <ul>${mode_changes}</ul>
                    </div>`;
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
export function verifyPatchNotes(patch_data, calculation_units, units) {
    for (let general_property in patch_data.general) {
        let property_units = calculation_units.general[general_property];
        if (property_units === undefined) {
            console.log(`Cannot find calculation units for ${general_property}`);
        }
        let display_units = units.general[general_property];
        if (display_units === undefined) {
            console.log(`Cannot find units for ${general_property}`);
        }
    }
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            let heroDisplayUnits = units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            if (heroDisplayUnits === undefined) {
                throw new Error("Invalid state");
            }
            for (let general_property in heroData.general) {
                let property_units = heroUnits.general[general_property];
                if (property_units === undefined) {
                    console.log(`Cannot find calculation units for ${hero} - ${general_property}`);
                }
                let display_units = heroDisplayUnits.general[general_property];
                if (display_units === undefined) {
                    console.log(`Cannot find display units for ${hero} - ${general_property}`);
                }
            }
            for (let ability in heroData.abilities) {
                for (let ability_property in heroData.abilities[ability]) {
                    let property_units = heroUnits.abilities[ability][ability_property];
                    if (property_units === undefined) {
                        console.log(`Cannot find calculation units for ${hero} - ${ability} - ${ability_property}`);
                    }
                    let display_units = heroDisplayUnits.abilities[ability][ability_property];
                    if (display_units === undefined) {
                        console.log(`Cannot find display units for ${hero} - ${ability} - ${ability_property}`);
                    }
                }
            }
        }
    }
    for (let mode in patch_data.modes) {
        if (units.modes[mode] === undefined) {
            console.log(`Cannot find units for ${mode}`);
        }
        for (let change in patch_data.modes[mode]) {
            if (units.modes[mode][change] === undefined) {
                console.log(`Cannot find units for ${mode} - ${change}`);
            }
        }
    }
}
export function applyDamageMultiplier(patch_data, multiplier, calculation_units) {
    if (typeof patch_data.general["Quick melee damage"] == "number") {
        patch_data.general["Quick melee damage"] *= multiplier;
    }
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            for (let ability in heroData.abilities) {
                for (let ability_property in heroData.abilities[ability]) {
                    let property_units = heroUnits.abilities[ability][ability_property];
                    if (property_units === undefined) {
                        console.log(`Cannot find calculation units for ${ability} - ${ability_property}`);
                    }
                    if (typeof heroData.abilities[ability][ability_property] === "number") {
                        if (property_units.some((unit) => ["damage instance"].includes(unit[0]))) {
                            heroData.abilities[ability][ability_property] *= multiplier;
                        }
                    }
                }
            }
        }
    }
    return patch_data;
}
export function calculatePreArmorProperties(patch_data, calculation_units) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            for (let ability in heroData.abilities) {
                const abilityData = heroData.abilities[ability];
                const abilityDataUnits = heroUnits.abilities[ability];
                for (let damage_or_healing of ["damage", "healing"]) {
                    let total_damage = Object.keys(abilityData)
                        .flatMap((property) => {
                        let situations = abilityDataUnits[property]
                            .filter((unit) => Array.isArray(unit))
                            .filter((unit) => unit[0] === "situation")
                            .map((unit) => unit[1]);
                        if (situations.length == 0) {
                            situations.push("normal");
                        }
                        return abilityDataUnits[property]
                            .filter((unit) => Array.isArray(unit))
                            .filter((unit) => unit[0] === `${damage_or_healing} instance`)
                            .map((unit) => [unit[1], abilityData[property], situations]);
                    })
                        .reduce((acc, [dmg_type, amount, situations]) => {
                        if (!(dmg_type in acc))
                            acc[dmg_type] = [];
                        if (typeof amount === "number") {
                            for (let situation of situations) {
                                let idx = acc[dmg_type].findIndex((v) => v[0] === situation);
                                if (idx === -1) {
                                    acc[dmg_type].push([situation, amount]);
                                }
                                else {
                                    acc[dmg_type][idx][1] += amount;
                                }
                            }
                        }
                        return acc;
                    }, {});
                    let crit_data = Object.entries(heroUnits.abilities[ability])
                        .map(([key, calc_units]) => [calc_units, heroData.abilities[ability][key]])
                        .filter((entry) => typeof entry[1] === "number")
                        .map(([calc_units, multiplier]) => [calc_units
                            .filter((unit) => Array.isArray(unit))
                            .filter((unit) => unit[0] === "critical multiplier")
                            .map((unit) => rest(unit)), multiplier])
                        .flatMap(([crit_types, multiplier]) => crit_types.map((crit_type) => [crit_type, multiplier]));
                    for (let total_damage_type in total_damage) {
                        for (let situation of total_damage[total_damage_type]) {
                            heroData.abilities[ability][`Total ${total_damage_type} ${situation[0]} instance ${damage_or_healing}`] = situation[1];
                            heroUnits.abilities[ability][`Total ${total_damage_type} ${situation[0]} instance ${damage_or_healing}`] = [[`total instance ${damage_or_healing}`, total_damage_type], ["situation", situation[0]]];
                            for (let [crit_type, critical_multiplier] of crit_data) {
                                let adj_critical_multiplier = 1;
                                if (crit_type[1] === undefined || crit_type[1] === total_damage_type) {
                                    adj_critical_multiplier = critical_multiplier;
                                }
                                heroData.abilities[ability][`Total ${total_damage_type} ${situation[0]} instance ${crit_type} ${damage_or_healing}`] = situation[1] * adj_critical_multiplier;
                                heroUnits.abilities[ability][`Total ${total_damage_type} ${situation[0]} instance ${crit_type} ${damage_or_healing}`] = [[`total instance crit ${damage_or_healing}`, total_damage_type, crit_type[0]], ["situation", situation[0]]];
                            }
                        }
                    }
                }
            }
        }
    }
    return patch_data;
}
function applyArmorToStat(stat, min_damage_reduction, max_damage_reduction, flat_damage_reduction) {
    return Math.min(Math.max(stat - flat_damage_reduction, stat * (1 - max_damage_reduction)), stat * (1 - min_damage_reduction));
}
export function applyArmor(patch_data, calculation_units) {
    let min_damage_reduction = 0;
    let max_damage_reduction = 1;
    let flat_damage_reduction = 0;
    if (typeof patch_data.general["Armor minimum damage reduction"] === "number") {
        min_damage_reduction = patch_data.general["Armor minimum damage reduction"] / 100;
    }
    if (typeof patch_data.general["Armor maximum damage reduction"] === "number") {
        max_damage_reduction = patch_data.general["Armor maximum damage reduction"] / 100;
    }
    if (typeof patch_data.general["Armor flat damage reduction"] === "number") {
        flat_damage_reduction = patch_data.general["Armor flat damage reduction"];
    }
    if (typeof patch_data.general["Quick melee damage"] == "number") {
        patch_data.general["Quick melee damage"] = applyArmorToStat(patch_data.general["Quick melee damage"], min_damage_reduction, max_damage_reduction, flat_damage_reduction);
    }
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            for (let ability in heroData.abilities) {
                for (let ability_property in heroData.abilities[ability]) {
                    let property_units = heroUnits.abilities[ability][ability_property];
                    if (typeof heroData.abilities[ability][ability_property] === "number") {
                        let damage_type = property_units
                            .filter((unit) => Array.isArray(unit))
                            .filter((unit) => unit[0] == "total instance damage" || unit[0] == "total instance crit damage")
                            .map(unit => unit[1]);
                        if (damage_type.length > 1) {
                            throw new Error("should not have multiple damage types");
                        }
                        if (damage_type.length > 0) {
                            let possible_special_behavior = specialArmorBehaviorDamageTypes[damage_type[0]];
                            if (possible_special_behavior !== undefined) {
                                if (possible_special_behavior[0] === "flat percent mit") {
                                    heroData.abilities[ability][ability_property] = (1 - possible_special_behavior[1]) * heroData.abilities[ability][ability_property];
                                }
                            }
                            else {
                                heroData.abilities[ability][ability_property] = applyArmorToStat(heroData.abilities[ability][ability_property], min_damage_reduction, max_damage_reduction, flat_damage_reduction);
                            }
                        }
                    }
                }
            }
        }
    }
    return patch_data;
}
export function calculatePostArmorProperties(patch_data, calculation_units) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            const generalHeroData = heroData.general;
            const generalHeroDataUnits = heroUnits.general;
            if (generalHeroData === undefined) {
                console.error(`No general hero data for ${hero}`);
                continue;
            }
            let total_health = Object.keys(generalHeroData)
                .filter((general_property) => generalHeroDataUnits[general_property].includes("health"))
                .map((general_property) => generalHeroData[general_property])
                .filter((general_property) => typeof general_property === "number")
                .reduce((a, c) => a + c, 0);
            heroData.general["Total health"] = total_health;
            for (let ability in heroData.abilities) {
                const abilityData = heroData.abilities[ability];
                const abilityDataUnits = heroUnits.abilities[ability];
                if (typeof abilityData["Alt fire of"] == "string") {
                    if (!("Ammo" in abilityData) && "Ammo" in heroData.abilities[abilityData["Alt fire of"]]) {
                        heroData.abilities[ability]["Ammo"] = heroData.abilities[abilityData["Alt fire of"]]["Ammo"];
                    }
                    if ("Reload time" in heroData.abilities[abilityData["Alt fire of"]]) {
                        heroData.abilities[ability]["Reload time"] = heroData.abilities[abilityData["Alt fire of"]]["Reload time"];
                    }
                    if ("Reload time per ammo" in heroData.abilities[abilityData["Alt fire of"]]) {
                        heroData.abilities[ability]["Reload time per ammo"] = heroData.abilities[abilityData["Alt fire of"]]["Reload time per ammo"];
                    }
                }
                for (let damage_or_healing of ["damage", "healing"]) {
                    for (let ability_property in abilityData) {
                        let property_units = abilityDataUnits[ability_property];
                        if (typeof abilityData[ability_property] === "number") {
                            let situations = property_units
                                .filter((unit) => Array.isArray(unit))
                                .filter((unit) => unit[0] == "situation");
                            let damage = abilityData[ability_property];
                            {
                                let damage_types = property_units
                                    .filter((unit) => Array.isArray(unit))
                                    .filter((unit) => unit[0] == `total instance ${damage_or_healing}`)
                                    .map((unit) => unit[1]);
                                for (let damage_type of damage_types) {
                                    abilityData[`Total ${damage_type} ${situations.map((s) => s[1]).join(", ")} ${damage_or_healing}`] = damage;
                                    abilityDataUnits[`Total ${damage_type} ${situations.map((s) => s[1]).join(", ")} ${damage_or_healing}`] = [[`total ${damage_or_healing}`, damage_type], ...situations];
                                }
                            }
                            {
                                let damage_types = property_units
                                    .filter((unit) => Array.isArray(unit))
                                    .filter((unit) => unit[0] == `total instance crit ${damage_or_healing}`)
                                    .map((unit) => [unit[1], unit[2]]);
                                for (let [damage_type, crit_type] of damage_types) {
                                    abilityData[`Total ${damage_type} ${crit_type} ${damage_or_healing}`] = damage;
                                    abilityDataUnits[`Total ${damage_type} ${crit_type} ${damage_or_healing}`] = [[`total crit ${damage_or_healing}`, damage_type, crit_type], ...situations];
                                }
                            }
                        }
                    }
                    for (let pellet_count_ability_property in abilityData) {
                        let pellet_count_property_units = abilityDataUnits[pellet_count_ability_property];
                        if (typeof abilityData[pellet_count_ability_property] === "number") {
                            let multiplier_types = pellet_count_property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == "pellet count" || unit[0] == "bullets per burst").map((unit) => unit[1]);
                            let multiplier = abilityData[pellet_count_ability_property];
                            for (let damage_type of multiplier_types) {
                                for (let ability_property in abilityData) {
                                    let property_units = abilityDataUnits[ability_property];
                                    if (typeof abilityData[ability_property] === "number") {
                                        if (property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]).includes(damage_type)) {
                                            abilityData[ability_property] *= multiplier;
                                        }
                                        if (property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total crit ${damage_or_healing}`).map((unit) => unit[1]).includes(damage_type)) {
                                            abilityData[ability_property] *= multiplier;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    {
                        let total_damage = {};
                        let total_crit_damage = {};
                        for (let ability_property in abilityData) {
                            let property_units = abilityDataUnits[ability_property];
                            if (typeof abilityData[ability_property] === "number") {
                                let damage = abilityData[ability_property];
                                {
                                    let damage_types = property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]);
                                    if (damage_types.length > 0) {
                                        let situations = property_units
                                            .filter((unit) => Array.isArray(unit))
                                            .filter((unit) => unit[0] == "situation")
                                            .map((unit) => unit[1]);
                                        for (let situation of situations) {
                                            if (!(situation in total_damage)) {
                                                total_damage[situation] = 0;
                                            }
                                            total_damage[situation] += damage;
                                        }
                                    }
                                }
                                {
                                    let damage_types = property_units.filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total crit ${damage_or_healing}`).map((unit) => [unit[1], unit[2]]);
                                    for (let [_, crit_type] of damage_types) {
                                        if (!(crit_type in total_crit_damage)) {
                                            total_crit_damage[crit_type] = 0;
                                        }
                                        total_crit_damage[crit_type] += damage;
                                    }
                                }
                            }
                        }
                        for (let total_damage_situation in total_damage) {
                            abilityData[`Total ${total_damage_situation} ${damage_or_healing}`] = total_damage[total_damage_situation];
                            abilityDataUnits[`Total ${total_damage_situation} ${damage_or_healing}`] = [`total ${damage_or_healing}`, ["situation", total_damage_situation]];
                            if (damage_or_healing === "damage") {
                                abilityDataUnits[`Total ${total_damage_situation} ${damage_or_healing}`].push("breakpoint damage");
                            }
                        }
                        for (let crit_damage_type in total_crit_damage) {
                            abilityData[`Total ${crit_damage_type} ${damage_or_healing}`] = total_crit_damage[crit_damage_type];
                            abilityDataUnits[`Total ${crit_damage_type} ${damage_or_healing}`] = [`total crit ${damage_or_healing}`];
                            if (damage_or_healing === "damage") {
                                abilityDataUnits[`Total ${crit_damage_type} ${damage_or_healing}`].push("breakpoint damage");
                            }
                        }
                    }
                }
            }
        }
    }
    return patch_data;
}
export function calculateBreakpoints(patch_data, calculation_units) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            let damage_options = {};
            if (typeof patch_data.general["Quick melee damage"] == "number" && heroData.general["has overridden melee"] !== true) {
                damage_options["Melee"] = {};
                damage_options["Melee"][""] = patch_data.general["Quick melee damage"];
            }
            for (let ability in heroData.abilities) {
                let max_damage_instances = 1;
                let ability_damage_options = {};
                for (let ability_property in heroData.abilities[ability]) {
                    for (let property_unit of heroUnits.abilities[ability][ability_property]) {
                        if (property_unit == "breakpoint damage") {
                            if (typeof heroData.abilities[ability][ability_property] === "number") {
                                ability_damage_options[ability_property] = heroData.abilities[ability][ability_property];
                            }
                        }
                        else if (property_unit == "ammo") {
                            if (typeof heroData.abilities[ability][ability_property] === "number") {
                                max_damage_instances = Math.max(max_damage_instances, Math.min(3, heroData.abilities[ability][ability_property]));
                            }
                        }
                        else if (property_unit == "charges") {
                            if (typeof heroData.abilities[ability][ability_property] === "number") {
                                max_damage_instances = Math.max(max_damage_instances, heroData.abilities[ability][ability_property]);
                            }
                        }
                        else if (property_unit == "time between shots") {
                            max_damage_instances = Math.max(max_damage_instances, 3);
                        }
                    }
                }
                let ability_damage_option_set = [[{}, 0]];
                for (let damage_option in ability_damage_options) {
                    for (let i = 0; i < max_damage_instances; i++) {
                        for (let damage_option_set_element of ability_damage_option_set) {
                            if (Object.values(damage_option_set_element[0]).reduce((s, a) => s + a, 0) < max_damage_instances) {
                                let new_damage_option_set_element = structuredClone(damage_option_set_element);
                                if (!(damage_option in new_damage_option_set_element[0])) {
                                    new_damage_option_set_element[0][damage_option] = 0;
                                }
                                new_damage_option_set_element[0][damage_option] += 1;
                                new_damage_option_set_element[1] += ability_damage_options[damage_option];
                                ability_damage_option_set.push(new_damage_option_set_element);
                            }
                        }
                    }
                }
                ability_damage_option_set = ability_damage_option_set.filter((dmg_case) => dmg_case[1] > 0);
                damage_options[ability] = {};
                for (let ability_damage_option of ability_damage_option_set) {
                    let label = Object.entries(ability_damage_option[0]).map((e) => e[1] > 1 ? `${e[1]}x ${e[0]}` : e[0]).join(" + ");
                    damage_options[ability][label] = ability_damage_option[1];
                }
            }
            let breakpointDamage = { "": 0 };
            for (let ability in damage_options) {
                for (let damageEntry in breakpointDamage) {
                    for (let damageOption in damage_options[ability]) {
                        breakpointDamage[`${damageEntry}, ${ability}${damageOption === "" ? "" : " "}${damageOption}`] = breakpointDamage[damageEntry] + damage_options[ability][damageOption];
                    }
                }
            }
            let breakpointDamageEntries = {};
            for (let breakpoint in breakpointDamage) {
                let breakpointHealth = damageBreakPointHealthValues.findLast((v) => v <= breakpointDamage[breakpoint]);
                if (breakpointHealth !== undefined) {
                    breakpointDamageEntries[`Breakpoint for ${breakpoint.substring(2)}`] = breakpointHealth;
                }
            }
            heroData.breakpoints = breakpointDamageEntries;
        }
    }
    return patch_data;
}
export function calculateRates(patch_data, calculation_units) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            const generalHeroData = heroData.general;
            if (generalHeroData === undefined) {
                console.error(`No general hero data for ${hero}`);
                continue;
            }
            for (let ability in heroData.abilities) {
                const abilityData = heroData.abilities[ability];
                const abilityDataUnits = heroUnits.abilities[ability];
                let time_between_shots = 0;
                {
                    let damage_per_second = 0;
                    let crit_damage_per_second = 0;
                    let healing_per_second = 0;
                    for (let property in abilityData) {
                        if (typeof abilityData[property] === "number") {
                            if (abilityDataUnits[property].includes("time between shots")) {
                                time_between_shots += abilityData[property];
                            }
                            if (abilityDataUnits[property].includes("total damage")) {
                                damage_per_second += abilityData[property];
                            }
                            if (abilityDataUnits[property].includes("total crit damage")) {
                                crit_damage_per_second += abilityData[property];
                            }
                            if (abilityDataUnits[property].includes("total healing")) {
                                healing_per_second += abilityData[property];
                            }
                        }
                    }
                    if (time_between_shots > 0) {
                        damage_per_second /= time_between_shots;
                        crit_damage_per_second /= time_between_shots;
                        healing_per_second /= time_between_shots;
                        if (damage_per_second > 0) {
                            abilityData["Damage per second"] = damage_per_second;
                            abilityDataUnits["Damage per second"] = ["damage per second"];
                        }
                        if (crit_damage_per_second > 0) {
                            abilityData["Critical damage per second"] = crit_damage_per_second;
                            abilityDataUnits["Critical damage per second"] = [];
                        }
                        if (healing_per_second > 0) {
                            abilityData["Healing per second"] = healing_per_second;
                            abilityDataUnits["Healing per second"] = ["healing per second"];
                        }
                    }
                }
                let reload_time = 0;
                let reload_time_per_ammo = 0;
                let ammo = 0;
                let bullets_per_burst = 1;
                let burst_recovery_time = 0;
                let ammo_per_shot = 1;
                let damage_per_second = 0;
                let healing_per_second = 0;
                for (let property in abilityData) {
                    if (typeof abilityData[property] === "number") {
                        if (abilityDataUnits[property].includes("reload time")) {
                            reload_time += abilityData[property];
                        }
                        if (abilityDataUnits[property].includes("reload time per ammo")) {
                            reload_time_per_ammo += abilityData[property];
                        }
                        if (abilityDataUnits[property].includes("ammo")) {
                            ammo += abilityData[property];
                        }
                        if (abilityDataUnits[property].includes("bullets per burst")) {
                            bullets_per_burst *= abilityData[property];
                        }
                        if (abilityDataUnits[property].includes("burst recovery time")) {
                            burst_recovery_time += abilityData[property];
                        }
                        if (abilityDataUnits[property].includes("ammo per shot")) {
                            ammo_per_shot *= abilityData[property];
                        }
                        if (abilityDataUnits[property].includes("damage per second")) {
                            damage_per_second = abilityData[property];
                        }
                        if (abilityDataUnits[property].includes("healing per second")) {
                            healing_per_second = abilityData[property];
                        }
                    }
                }
                reload_time += reload_time_per_ammo * ammo;
                reload_time += (bullets_per_burst - 1) * burst_recovery_time;
                if (ammo > 0 && reload_time > 0) {
                    let time_before_reload = ammo;
                    if (time_between_shots > 0) {
                        time_before_reload *= time_between_shots;
                    }
                    time_before_reload /= ammo_per_shot;
                    time_before_reload /= bullets_per_burst;
                    if (typeof abilityData["Ammo per second"] === "number") {
                        time_before_reload /= abilityData["Ammo per second"];
                    }
                    if (damage_per_second > 0) {
                        let damage_per_second_incl_reload = damage_per_second * time_before_reload / (time_before_reload + reload_time);
                        abilityData["Damage per second(including reload)"] = damage_per_second_incl_reload;
                        abilityDataUnits["Damage per second(including reload)"] = [];
                    }
                    if (healing_per_second > 0) {
                        let healing_per_second_incl_reload = healing_per_second * time_before_reload / (time_before_reload + reload_time);
                        abilityData["Healing per second(including reload)"] = healing_per_second_incl_reload;
                        abilityDataUnits["Healing per second(including reload)"] = [];
                    }
                }
            }
        }
    }
    return patch_data;
}
function cleanupProperties(patch_data, calculation_units) {
    // return patch_data;
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (!isKeyOf(patch_data.heroes[role], hero)) {
                throw new Error("Invalid state");
            }
            if (hero == "general")
                continue;
            let heroData = patch_data.heroes[role][hero];
            let heroUnits = calculation_units.heroes[role][hero];
            if (heroData === undefined) {
                throw new Error("Invalid state");
            }
            if (heroUnits === undefined) {
                throw new Error("Invalid state");
            }
            for (let ability in heroData.abilities) {
                for (let damage_or_healing of ["damage", "healing"]) {
                    const abilityData = heroData.abilities[ability];
                    const abilityDataUnits = heroUnits.abilities[ability];
                    let damage_type_instance_damage = {};
                    for (let property in abilityData) {
                        if (typeof abilityData[property] === "number") {
                            let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `${damage_or_healing} instance`).map((unit) => unit[1]);
                            let situations = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == "situation").map((unit) => unit[1]);
                            for (let property_damage_type of property_damage_types) {
                                if (!(property_damage_type in damage_type_instance_damage)) {
                                    damage_type_instance_damage[property_damage_type] = {};
                                }
                                for (let situation of situations) {
                                    damage_type_instance_damage[property_damage_type][situation] = abilityData[property];
                                }
                            }
                        }
                    }
                    let damage_type_damage = {};
                    let crit_damage_type_damage = {};
                    for (let property in abilityData) {
                        if (typeof abilityData[property] === "number") {
                            let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]);
                            let situations = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == "situation").map((unit) => unit[1]);
                            for (let property_damage_type of property_damage_types) {
                                if (!(property_damage_type in damage_type_damage)) {
                                    damage_type_damage[property_damage_type] = {};
                                }
                                for (let situation of situations) {
                                    damage_type_damage[property_damage_type][situation] = abilityData[property];
                                    if (damage_type_damage[property_damage_type][situation] == damage_type_instance_damage[property_damage_type][situation]) {
                                        delete abilityData[property];
                                    }
                                }
                            }
                            let crit_property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total crit ${damage_or_healing}`).map((unit) => unit[1]);
                            for (let property_damage_type of crit_property_damage_types) {
                                if (!(property_damage_type in crit_damage_type_damage)) {
                                    crit_damage_type_damage[property_damage_type] = {};
                                }
                                for (let situation of situations) {
                                    crit_damage_type_damage[property_damage_type][situation] = abilityData[property];
                                }
                            }
                        }
                    }
                    for (let property in abilityData) {
                        if (typeof abilityData[property] === "number") {
                            let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total instance ${damage_or_healing}`).map((unit) => unit[1]);
                            let situations = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == "situation").map((unit) => unit[1]);
                            for (let property_damage_type of property_damage_types) {
                                for (let situation of situations) {
                                    if (damage_type_damage[property_damage_type][situation] === abilityData[property]) {
                                        delete abilityData[property];
                                    }
                                }
                            }
                            let property_crit_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total instance crit ${damage_or_healing}`).map((unit) => unit[1]);
                            for (let property_damage_type of property_crit_damage_types) {
                                for (let situation of situations) {
                                    if (crit_damage_type_damage[property_damage_type][situation] === abilityData[property]) {
                                        delete abilityData[property];
                                    }
                                }
                            }
                        }
                    }
                    if (Object.keys(damage_type_damage).length == 1) {
                        for (let property in abilityData) {
                            if (typeof abilityData[property] === "number") {
                                let property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total ${damage_or_healing}`).map((unit) => unit[1]);
                                if (property_damage_types.length > 0) {
                                    delete abilityData[property];
                                    continue;
                                }
                            }
                        }
                    }
                    if (Object.keys(crit_damage_type_damage).length == 1) {
                        for (let property in abilityData) {
                            if (typeof abilityData[property] === "number") {
                                let crit_property_damage_types = abilityDataUnits[property].filter((unit) => Array.isArray(unit)).filter((unit) => unit[0] == `total crit ${damage_or_healing}`).map((unit) => unit[1]);
                                if (crit_property_damage_types.length > 0) {
                                    delete abilityData[property];
                                    continue;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return patch_data;
}
let patch_options = Object.entries(patchList)
    .flatMap(([k, v]) => v
    .map((p) => {
    let split_date = p.split("-").map((s) => parseInt(s));
    let pretty_date = new Date(split_date[0], split_date[1] - 1, split_date[2]);
    return `<option value=\"${k}:${p}\">${k} - ${pretty_date.toLocaleDateString()}</option>`;
})).join();
let patch_selectors = document.getElementsByClassName("patch-selector");
for (let i = 0; i < patch_selectors.length; i++) {
    patch_selectors[i].innerHTML = patch_options;
}
patch_before_box.onchange = async function () {
    siteState.before_patch = this.value;
    await updatePatchNotes();
};
patch_after_box.onchange = async function () {
    siteState.after_patch = this.value;
    await updatePatchNotes();
};
display_calculated_properties_box.onchange = async function () {
    siteState.show_calculated_properties = this.checked;
    await updatePatchNotes();
};
display_breakpoints_box.onchange = async function () {
    siteState.show_breakpoints = this.checked;
    await updatePatchNotes();
};
apply_damage_to_armor_box.onchange = async function () {
    siteState.apply_to_armor = this.checked;
    await updatePatchNotes();
};
patch_before_dmg_boost.onchange = async function () {
    siteState.before_dmg_boost = parseFloat(this.value) / 100.0;
    await updatePatchNotes();
};
patch_before_dmg_boost_slider.onchange = async function () {
    siteState.before_dmg_boost = parseFloat(this.value) / 100.0;
    await updatePatchNotes();
};
patch_after_dmg_boost.onchange = async function () {
    siteState.after_dmg_boost = parseFloat(this.value) / 100.0;
    await updatePatchNotes();
};
patch_after_dmg_boost_slider.onchange = async function () {
    siteState.after_dmg_boost = parseFloat(this.value) / 100.0;
    await updatePatchNotes();
};
window.addEventListener("popstate", async (event) => {
    if (event.state) {
        siteState = event.state;
        await updatePatchNotes();
    }
});
last_patch_button.onclick = async function () {
    let before_path = siteState.before_patch.split(":");
    let before_index = patchList[before_path[0]].indexOf(before_path[1]);
    if (before_index > 0) {
        siteState.before_patch = `${before_path[0]}:${patchList[before_path[0]][before_index - 1]}`;
    }
    let after_path = siteState.after_patch.split(":");
    let after_index = patchList[after_path[0]].indexOf(after_path[1]);
    if (after_index > 0) {
        siteState.after_patch = `${after_path[0]}:${patchList[after_path[0]][after_index - 1]}`;
    }
    await updatePatchNotes();
};
next_patch_button.onclick = async function () {
    let before_path = siteState.before_patch.split(":");
    let before_index = patchList[before_path[0]].indexOf(before_path[1]);
    if (before_index < patchList[before_path[0]].length) {
        siteState.before_patch = `${before_path[0]}:${patchList[before_path[0]][before_index + 1]}`;
    }
    let after_path = siteState.after_patch.split(":");
    let after_index = patchList[after_path[0]].indexOf(after_path[1]);
    if (after_index < patchList[after_path[0]].length) {
        siteState.after_patch = `${after_path[0]}:${patchList[after_path[0]][after_index + 1]}`;
    }
    await updatePatchNotes();
};
await updatePatchNotes();
function reorder(to_reorder, pattern) {
    let reordered = {};
    for (let key in pattern) {
        if (key in to_reorder) {
            if (typeof pattern[key] === "object") {
                reordered[key] = reorder(to_reorder[key], pattern[key]);
            }
            else {
                reordered[key] = to_reorder[key];
            }
        }
    }
    for (let key in to_reorder) {
        if (!(key in reordered)) {
            reordered[key] = to_reorder[key];
        }
    }
    return reordered;
}
