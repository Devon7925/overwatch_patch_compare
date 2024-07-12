// import units from "./units.json" with { type: "json" };
// cant use because firefox dumb https://bugzilla.mozilla.org/show_bug.cgi?id=1736059

const patchList = await fetch("./patch_list.json")
    .then((res) => res.text())
    .then((text) => JSON.parse(text, (key, value) => {
        if (typeof value != "string") {
            return value;
        }
        return value.replace(/(\.\w+)+$/, "")
    }));

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let before_patch_path = "Overwatch 2:recent"
let after_patch_path = "Overwatch 2:latest"
if (urlParams.get("before")) {
    before_patch_path = urlParams.get("before")
}
if (urlParams.get("after")) {
    after_patch_path = urlParams.get("after")
}

function patch_from_path(joined_path) {
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

let siteState = {
    before_patch: patch_from_path(before_patch_path),
    after_patch: patch_from_path(after_patch_path),
}

{
    let newUrlParams = new URLSearchParams();
    for (let key in siteState) {
        newUrlParams.append(key, siteState[key])
    }
    window.history.replaceState(siteState, "", "index.html?" + newUrlParams)
}

let units = {};
let hero_images = {};
let ability_images = {};
export let patches = {};

let promises = [];
promises.push(fetch("./units.json")
    .then((res) => res.text())
    .then((text) => units = JSON.parse(text)))
promises.push(fetch("./hero_images.json")
    .then((res) => res.text())
    .then((text) => hero_images = JSON.parse(text)))
promises.push(fetch("./ability_images.json")
    .then((res) => res.text())
    .then((text) => ability_images = JSON.parse(text)))
await Promise.all(promises);

function isEmpty(obj) {
    for (var i in obj) { return false; }
    return true;
}

function round(num, decimalPlaces = 0) {
    num = Math.round(num + "e" + decimalPlaces);
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

async function updatePatchNotes() {
    let urlParams = new URLSearchParams();
    for (let key in siteState) {
        urlParams.append(key, siteState[key])
    }
    window.history.pushState(siteState, "", "index.html?" + urlParams)
    document.getElementById("patch_before").value = siteState.before_patch;
    document.getElementById("patch_after").value = siteState.after_patch;
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
    let changes = convert_to_changes(patches[siteState.before_patch], patches[siteState.after_patch]);
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
                heroData = heroData[1];
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
                    abilityData = abilityData[1];
                }
                for (let stat in abilityData) {
                    if (!units.heroes[role][hero].abilities[ability]) {
                        console.error(`Missing ability for ${hero} - ${ability}`)
                    }
                    if (!units.heroes[role][hero].abilities[ability][stat]) {
                        console.error(`Missing units for ${hero} - ${ability} - ${stat}`)
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

document.getElementById("patch_before").onchange = async function () {
    siteState.before_patch = this.value;
    await updatePatchNotes()
};

document.getElementById("patch_after").onchange = async function () {
    siteState.after_patch = this.value;
    await updatePatchNotes()
};

window.addEventListener("popstate", async (event) => {
    if (event.state) {
        siteState = event.state;
        await updatePatchNotes()
    }
});

await updatePatchNotes();