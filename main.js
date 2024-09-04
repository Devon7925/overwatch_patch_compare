// import units from "./units.json" with { type: "json" };
// cant use because firefox dumb https://bugzilla.mozilla.org/show_bug.cgi?id=1736059
const damageBreakPointHealthValues = [150, 175, 200, 225, 250, 300];
const patchList = await fetch("./patch_list.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text, (key, value) => {
    if (typeof value != "string") {
        return value;
    }
    return value.replace(/(\.\w+)+$/, "");
}));
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let siteState;
let defaultSiteState = {
    before_patch: "Overwatch 2:recent",
    after_patch: "Overwatch 2:latest",
    show_calculated_properties: false,
    show_breakpoints: false,
    before_dmg_boost: 1,
    after_dmg_boost: 1,
};
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
let units;
let hero_images = {};
let ability_images = {};
export let patches = {};
let promises = [];
promises.push(fetch("./units.json")
    .then((res) => res.text())
    .then((text) => units = JSON.parse(text)));
promises.push(fetch("./hero_images.json")
    .then((res) => res.text())
    .then((text) => hero_images = JSON.parse(text)));
promises.push(fetch("./ability_images.json")
    .then((res) => res.text())
    .then((text) => ability_images = JSON.parse(text)));
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
export function getChangeText(name, change, units) {
    if (typeof change[0] === "number") {
        change[0] = round(change[0], 2);
    }
    if (typeof change[1] === "number") {
        change[1] = round(change[1], 2);
    }
    if (change[0] === undefined || !Array.isArray(change)) {
        let new_value = change[1];
        if (!Array.isArray(change)) {
            new_value = change;
        }
        if (units == "percent") {
            return `There is now ${new_value}% ${name.toLowerCase()}.`;
        }
        else if (units == "meters") {
            return `There is now ${new_value} meter ${name.toLowerCase()}.`;
        }
        else if (units == "seconds") {
            return `There is now ${new_value} second ${name.toLowerCase()}.`;
        }
        else if (units == "flag") {
            if (new_value === false) {
                return `No longer ${name}.`;
            }
            else {
                return `Now ${name}.`;
            }
        }
        return `There is now ${new_value} ${name.toLowerCase()}.`;
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
const calculated_properties = [
    "Total damage",
    "Total healing",
    "Headshot damage",
    "Total headshot damage",
    "Total maximum damage",
    "Damage per second",
    "Damage per second(including reload)",
    "Headshot damage per second",
    "Maximum headshot damage",
    "Maximum total damage",
    "Maximum damage per second",
    "Maximum damage per second(including reload)",
    "Healing per second",
    "Healing per second(including reload)",
    "Maximum healing per second",
    "Maximum healing per second(including reload)",
];
let patch_before_box = document.querySelector("select#patch_before");
let patch_after_box = document.querySelector("select#patch_after");
let display_calculated_properties_box = document.querySelector("input#disp_calc_props");
let display_breakpoints_box = document.querySelector("input#disp_breakpoints");
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
    let urlParams = new URLSearchParams();
    let key;
    for (key in siteState) {
        if (siteState[key] !== defaultSiteState[key]) {
            urlParams.append(key, `${siteState[key]}`);
        }
    }
    window.history.replaceState(siteState, "", "index.html?" + urlParams);
    patch_before_box.value = siteState.before_patch;
    patch_after_box.value = siteState.after_patch;
    display_calculated_properties_box.checked = siteState.show_calculated_properties;
    display_breakpoints_box.checked = siteState.show_breakpoints;
    patch_before_dmg_boost.value = "" + (100 * siteState.before_dmg_boost);
    patch_before_dmg_boost_slider.value = "" + (100 * siteState.before_dmg_boost);
    patch_after_dmg_boost.value = "" + (100 * siteState.after_dmg_boost);
    patch_after_dmg_boost_slider.value = "" + (100 * siteState.after_dmg_boost);
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
            patches[`${versionType}:${version}`] = JSON.parse(text);
        });
    }));
    let before_patch_data = structuredClone(patches[siteState.before_patch]);
    let after_patch_data = structuredClone(patches[siteState.after_patch]);
    if (siteState.show_calculated_properties) {
        before_patch_data = calculateProperties(before_patch_data);
        after_patch_data = calculateProperties(after_patch_data);
    }
    if (siteState.show_breakpoints) {
        before_patch_data = calculateBreakpoints(before_patch_data, parseFloat(patch_before_dmg_boost_slider.value) / 100);
        after_patch_data = calculateBreakpoints(after_patch_data, parseFloat(patch_after_dmg_boost_slider.value) / 100);
    }
    let changes = convert_to_changes(before_patch_data, after_patch_data);
    let hero_section = document.getElementsByClassName("PatchNotes-section-hero_update")[0];
    hero_section.innerHTML = "";
    if (changes.general) {
        let changeRender = "";
        for (let generalRule in changes.general) {
            changeRender += `<li>${getChangeText(generalRule, changes.general[generalRule], units.general[generalRule])}</li>`;
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
                generalChangeRender += `<li>${getChangeText(generalRule, changes.heroes[role].general[generalRule], units.heroes[role].general[generalRule])}</li>`;
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
            if (hero == "general")
                continue;
            let generalChangesRender = "";
            let heroData = changes.heroes[role][hero];
            if (Array.isArray(heroData)) {
                if (heroData[1] != undefined) {
                    heroData = heroData[1];
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
            if (heroData.general) {
                generalChangesRender += "<ul>";
                for (let property in heroData.general) {
                    generalChangesRender += `<li>${getChangeText(property, heroData.general[property], units.heroes[role][hero].general[property])}</li>`;
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
                        console.error(`Missing ability for ${hero} - ${ability}`);
                        break;
                    }
                    if (!units.heroes[role][hero].abilities[ability][stat] && !(calculated_properties.includes(stat))) {
                        console.error(`Missing units for ${hero} - ${ability} - ${stat}`);
                        continue;
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
            let breakpointsRender = "";
            if (heroData.breakpoints) {
                breakpointsRender += "<ul>";
                for (let property in heroData.breakpoints) {
                    breakpointsRender += `<li>${getChangeText(property, heroData.breakpoints[property], "none")}</li>`;
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
                        mode_changes += `<li>${getChangeText(change, [undefined, changes.modes[mode][1][change]], units.modes[mode][change])}</li>`;
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
                mode_changes += `<li>${getChangeText(change, changes.modes[mode][change], units.modes[mode][change])}</li>`;
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
export function calculateProperties(patch_data) {
    for (let role in patch_data.heroes) {
        for (let hero in patch_data.heroes[role]) {
            if (hero == "general")
                continue;
            const generalHeroData = patch_data.heroes[role][hero].general;
            if (generalHeroData === undefined) {
                console.error(`No general hero data for ${hero}`);
                continue;
            }
            let total_health = 0;
            if (typeof generalHeroData["Base health"] === "number") {
                total_health += generalHeroData["Base health"];
            }
            if (typeof generalHeroData["Armor health"] === "number") {
                total_health += generalHeroData["Armor health"];
            }
            if (typeof generalHeroData["Shield health"] === "number") {
                total_health += generalHeroData["Shield health"];
            }
            patch_data.heroes[role][hero].general["Total health"] = total_health;
            for (let ability in patch_data.heroes[role][hero].abilities) {
                const abilityData = patch_data.heroes[role][hero].abilities[ability];
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
                {
                    let total_damage = 0;
                    if (typeof abilityData["Impact damage"] === "number") {
                        total_damage += abilityData["Impact damage"];
                    }
                    if (typeof abilityData["Wall impact damage"] === "number") {
                        total_damage += abilityData["Wall impact damage"];
                    }
                    if (typeof abilityData["Damage over time"] === "number") {
                        total_damage += abilityData["Damage over time"];
                    }
                    if (typeof abilityData["Direct damage"] === "number") {
                        total_damage += abilityData["Direct damage"];
                    }
                    if (typeof abilityData["Maximum explosion damage"] === "number") {
                        total_damage += abilityData["Maximum explosion damage"];
                    }
                    if (typeof abilityData["Maximum impact damage"] === "number") {
                        total_damage += abilityData["Maximum impact damage"];
                    }
                    if (typeof abilityData["Explosion damage"] === "number") {
                        total_damage += abilityData["Explosion damage"];
                    }
                    if (typeof abilityData["Damage per bullet"] === "number") {
                        total_damage += abilityData["Damage per bullet"];
                    }
                    if (typeof abilityData["Damage per pellet"] === "number" && typeof abilityData["Pellet count"] === "number") {
                        let pellet_damage = 1;
                        pellet_damage *= abilityData["Damage per pellet"];
                        pellet_damage *= abilityData["Pellet count"];
                        total_damage += pellet_damage;
                    }
                    if (typeof abilityData["Damage per shrapnel"] === "number" && typeof abilityData["Shrapnel count"] === "number") {
                        let shrapnel_damage = 1;
                        shrapnel_damage *= abilityData["Damage per shrapnel"];
                        shrapnel_damage *= abilityData["Shrapnel count"];
                        total_damage += shrapnel_damage;
                    }
                    if (typeof abilityData["Bullets per burst"] === "number") {
                        total_damage *= abilityData["Bullets per burst"];
                    }
                    if (total_damage > 0) {
                        patch_data.heroes[role][hero].abilities[ability]["Total damage"] = total_damage;
                    }
                }
                {
                    let total_healing = 0;
                    if (typeof abilityData["Direct healing"] === "number") {
                        total_healing += abilityData["Direct healing"];
                    }
                    if (typeof abilityData["Explosion healing"] === "number") {
                        total_healing += abilityData["Explosion healing"];
                    }
                    if (typeof abilityData["Healing per bullet"] === "number") {
                        total_healing += abilityData["Healing per bullet"];
                    }
                    if (typeof abilityData["Bullets per burst"] === "number") {
                        total_healing *= abilityData["Bullets per burst"];
                    }
                    if (total_healing > 0) {
                        patch_data.heroes[role][hero].abilities[ability]["Total healing"] = total_healing;
                    }
                }
                {
                    let total_damage = 0;
                    if (typeof abilityData["Max impact damage"] === "number") {
                        total_damage += abilityData["Max impact damage"];
                    }
                    if (typeof abilityData["Max wall slam damage"] === "number") {
                        total_damage += abilityData["Max wall slam damage"];
                    }
                    if (typeof abilityData["Max damage"] === "number") {
                        total_damage += abilityData["Max damage"];
                    }
                    if (total_damage > 0) {
                        patch_data.heroes[role][hero].abilities[ability]["Total maximum damage"] = total_damage;
                    }
                }
                if (typeof abilityData["Damage per second per level"] === "number" && typeof abilityData["Maximum beam level"] === "number") {
                    patch_data.heroes[role][hero].abilities[ability]["Maximum damage per second"] = abilityData["Damage per second per level"] * abilityData["Maximum beam level"];
                }
                let time_between_shots = 0;
                if (typeof abilityData["Recovery time"] === "number") {
                    time_between_shots += abilityData["Recovery time"];
                }
                if (typeof abilityData["Maximum charge time"] === "number") {
                    time_between_shots += abilityData["Maximum charge time"];
                }
                if (time_between_shots > 0) {
                    let damage_per_second = 1 / time_between_shots;
                    let healing_per_second = 1 / time_between_shots;
                    if (typeof abilityData["Damage"] === "number") {
                        damage_per_second *= abilityData["Damage"];
                        patch_data.heroes[role][hero].abilities[ability]["Damage per second"] = damage_per_second;
                    }
                    if (typeof abilityData["Maximum damage"] === "number") {
                        damage_per_second *= abilityData["Maximum damage"];
                        patch_data.heroes[role][hero].abilities[ability]["Maximum damage per second"] = damage_per_second;
                    }
                    if (typeof abilityData["Total damage"] === "number") {
                        damage_per_second *= abilityData["Total damage"];
                        patch_data.heroes[role][hero].abilities[ability]["Damage per second"] = damage_per_second;
                    }
                    if (typeof abilityData["Healing"] === "number") {
                        healing_per_second *= abilityData["Healing"];
                        patch_data.heroes[role][hero].abilities[ability]["Healing per second"] = healing_per_second;
                    }
                    if (typeof abilityData["Maximum healing"] === "number") {
                        healing_per_second *= abilityData["Maximum healing"];
                        patch_data.heroes[role][hero].abilities[ability]["Maximum healing per second"] = healing_per_second;
                    }
                    if (typeof abilityData["Total healing"] === "number") {
                        healing_per_second *= abilityData["Total healing"];
                        patch_data.heroes[role][hero].abilities[ability]["Healing per second"] = healing_per_second;
                    }
                    if (typeof abilityData["Total maximum damage"] === "number") {
                        damage_per_second *= abilityData["Total maximum damage"];
                        patch_data.heroes[role][hero].abilities[ability]["Maximum damage per second"] = damage_per_second;
                    }
                }
                let reload_time = 0;
                if (typeof abilityData["Reload time"] === "number") {
                    reload_time += abilityData["Reload time"];
                }
                if (typeof abilityData["Reload time per ammo"] === "number" && typeof abilityData["Ammo"] === "number") {
                    reload_time += abilityData["Reload time per ammo"] * abilityData["Ammo"];
                }
                if (typeof abilityData["Bullets per burst"] === "number" && typeof abilityData["Burst recovery time"] === "number") {
                    reload_time += (abilityData["Bullets per burst"] - 1) * abilityData["Burst recovery time"];
                }
                if (typeof abilityData["Ammo"] === "number" && reload_time > 0) {
                    let time_before_reload = abilityData["Ammo"];
                    if (time_between_shots > 0) {
                        time_before_reload *= time_between_shots;
                    }
                    if (typeof abilityData["Ammo per shot"] === "number") {
                        time_before_reload /= abilityData["Ammo per shot"];
                    }
                    if (typeof abilityData["Bullets per burst"] === "number") {
                        time_before_reload /= abilityData["Bullets per burst"];
                    }
                    if (typeof abilityData["Ammo per second"] === "number") {
                        time_before_reload /= abilityData["Ammo per second"];
                    }
                    if (typeof patch_data.heroes[role][hero].abilities[ability]["Damage per second"] === "number") {
                        let damage_per_second_incl_reload = patch_data.heroes[role][hero].abilities[ability]["Damage per second"] * time_before_reload / (time_before_reload + reload_time);
                        patch_data.heroes[role][hero].abilities[ability]["Damage per second(including reload)"] = damage_per_second_incl_reload;
                    }
                    if (typeof patch_data.heroes[role][hero].abilities[ability]["Healing per second"] === "number") {
                        let damage_per_second_incl_reload = patch_data.heroes[role][hero].abilities[ability]["Healing per second"] * time_before_reload / (time_before_reload + reload_time);
                        patch_data.heroes[role][hero].abilities[ability]["Healing per second(including reload)"] = damage_per_second_incl_reload;
                    }
                    if (typeof patch_data.heroes[role][hero].abilities[ability]["Maximum healing per second"] === "number") {
                        let damage_per_second_incl_reload = patch_data.heroes[role][hero].abilities[ability]["Maximum healing per second"] * time_before_reload / (time_before_reload + reload_time);
                        patch_data.heroes[role][hero].abilities[ability]["Maximum healing per second(including reload)"] = damage_per_second_incl_reload;
                    }
                    if (typeof patch_data.heroes[role][hero].abilities[ability]["Maximum damage per second"] === "number") {
                        let damage_per_second_incl_reload = patch_data.heroes[role][hero].abilities[ability]["Maximum damage per second"] * time_before_reload / (time_before_reload + reload_time);
                        patch_data.heroes[role][hero].abilities[ability]["Maximum damage per second(including reload)"] = damage_per_second_incl_reload;
                    }
                }
                if (typeof abilityData["Recharge rate"] === "number" && typeof abilityData["Depletion rate"] === "number") {
                    let uptime = (1 / abilityData["Depletion rate"]) / (1 / abilityData["Recharge rate"] + 1 / abilityData["Depletion rate"]);
                    if (typeof patch_data.heroes[role][hero].abilities[ability]["Healing per second"] === "number") {
                        patch_data.heroes[role][hero].abilities[ability]["Healing per second(including reload)"] = uptime * patch_data.heroes[role][hero].abilities[ability]["Healing per second"];
                    }
                }
                if (typeof abilityData["Critical multiplier"] === "number") {
                    let headshot_damage = abilityData["Critical multiplier"];
                    if (typeof abilityData["Damage"] === "number") {
                        headshot_damage *= abilityData["Damage"];
                        patch_data.heroes[role][hero].abilities[ability]["Headshot damage"] = headshot_damage;
                    }
                    if (typeof abilityData["Maximum damage"] === "number") {
                        headshot_damage *= abilityData["Maximum damage"];
                        patch_data.heroes[role][hero].abilities[ability]["Maximum headshot damage"] = headshot_damage;
                    }
                    headshot_damage = abilityData["Critical multiplier"];
                    if (typeof abilityData["Damage per second"] === "number") {
                        headshot_damage *= abilityData["Damage per second"];
                        patch_data.heroes[role][hero].abilities[ability]["Headshot damage per second"] = headshot_damage;
                    }
                    headshot_damage = abilityData["Critical multiplier"];
                    if (typeof abilityData["Total damage"] === "number") {
                        headshot_damage *= abilityData["Total damage"];
                        patch_data.heroes[role][hero].abilities[ability]["Total headshot damage"] = headshot_damage;
                    }
                }
            }
        }
    }
    return patch_data;
}
export function calculateBreakpoints(patchData, multiplier) {
    for (let role in patchData.heroes) {
        for (let hero in patchData.heroes[role]) {
            if (hero == "general")
                continue;
            let heroData = patchData.heroes[role][hero];
            let damageOptions = {};
            if (typeof patchData.general["Quick melee damage"] == "number" && heroData.general["has overridden melee"] !== true) {
                damageOptions["Melee"] = [patchData.general["Quick melee damage"], 1];
            }
            for (let ability in heroData.abilities) {
                let is_cooldown = true;
                if ("Recovery time" in heroData.abilities[ability]) {
                    is_cooldown = false;
                }
                if ("Cooldown" in heroData.abilities[ability]) {
                    is_cooldown = true;
                }
                if ("Ultimate cost" in heroData.abilities[ability]) {
                    is_cooldown = true;
                }
                let max_damage_instances = is_cooldown ? 1 : 3;
                if (typeof heroData.abilities[ability]["Total damage"] == "number") {
                    damageOptions[ability] = [heroData.abilities[ability]["Total damage"], max_damage_instances];
                }
                else if (typeof heroData.abilities[ability]["Damage"] == "number") {
                    damageOptions[ability] = [heroData.abilities[ability]["Damage"], max_damage_instances];
                }
                else if (typeof heroData.abilities[ability]["Total maximum damage"] == "number") {
                    damageOptions[ability] = [heroData.abilities[ability]["Total maximum damage"], max_damage_instances];
                }
                else if (typeof heroData.abilities[ability]["Maximum damage"] == "number") {
                    damageOptions[ability] = [heroData.abilities[ability]["Maximum damage"], max_damage_instances];
                }
                if (typeof heroData.abilities[ability]["Total headshot damage"] == "number") {
                    damageOptions[`${ability} headshot`] = [heroData.abilities[ability]["Total headshot damage"], max_damage_instances];
                }
                else if (typeof heroData.abilities[ability]["Headshot damage"] == "number") {
                    damageOptions[`${ability} headshot`] = [heroData.abilities[ability]["Headshot damage"], max_damage_instances];
                }
                else if (typeof heroData.abilities[ability]["Maximum headshot damage"] == "number") {
                    damageOptions[`${ability} maximum headshot`] = [heroData.abilities[ability]["Maximum headshot damage"], max_damage_instances];
                }
            }
            for (let damageOption in damageOptions) {
                damageOptions[damageOption][0] = damageOptions[damageOption][0] * multiplier;
            }
            let breakpointDamage = { "": 0 };
            for (let damageOption in damageOptions) {
                for (let damageEntry in breakpointDamage) {
                    for (let i = 1; i <= damageOptions[damageOption][1]; i++) {
                        if (i === 1) {
                            breakpointDamage[`${damageEntry}, ${damageOption}`] = breakpointDamage[damageEntry] + i * damageOptions[damageOption][0];
                        }
                        else {
                            breakpointDamage[`${damageEntry}, ${i}x ${damageOption}`] = breakpointDamage[damageEntry] + i * damageOptions[damageOption][0];
                        }
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
            patchData.heroes[role][hero].breakpoints = breakpointDamageEntries;
        }
    }
    return patchData;
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
