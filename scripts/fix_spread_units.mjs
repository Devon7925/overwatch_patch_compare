// Separate the release-preview multiplier from measured spread angles.
// The June-September source review supports 4 degrees before September 8;
// earlier absolute angles remain unverified, so retain their original multiplier.
import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 4) + '\n');
const list = read('patch_list.json');
const units = read('units.json');
const weapon = 'Incendiary and Volatile Changuns';
const angle = 'Spread for firing both guns';
const legacy = 'Dual-gun spread multiplier relative to preview';
const degrees = [['display unit', 'degrees']];

export function migrateSnapshotText(raw, date) {
    const patch = JSON.parse(raw);
    const stats = patch.heroes.Mauga?.abilities[weapon];
    if (!stats || legacy in stats) return raw;
    stats[legacy] = date >= '2026-09-08' ? 0.85 * 5 / 4 : stats[angle];
    if (date >= '2026-05-12') stats[angle] = date >= '2026-09-08' ? 5 : 4;
    else delete stats[angle];
    // Preserve unrelated whitespace and number formatting in historical files.
    const newline = raw.includes('\r\n') ? '\r\n' : '\n';
    let matches = 0;
    const result = raw.replace(/^(\s*)"Spread for firing both guns": ([^\r\n]+)$/gm, (_, indent, value) => {
        matches++;
        const comma = value.endsWith(',') ? ',' : '';
        const fields = [[legacy, stats[legacy]]];
        if (angle in stats) fields.push([angle, stats[angle]]);
        return fields.map(([key, number], i) => `${indent}"${key}": ${number}${i < fields.length - 1 ? ',' : comma}`).join(newline);
    });
    if (matches !== 1 || !isDeepStrictEqual(JSON.parse(result), patch)) throw new Error(`Unsafe spread migration: ${date}`);
    return result;
}
units.heroes.Mauga.abilities[weapon][angle] = degrees;
units.heroes.Mauga.abilities[weapon][legacy] = [['display unit', 'relative percent']];
units.heroes.Mauga.abilities[weapon]['Spread when only one Chaingun is active'] = degrees;

for (const mode of ['Overwatch 2', 'Overwatch 2 6v6']) {
    for (const date of list[mode]) {
        const file = `patches/${mode}/${date}`;
        const raw = fs.readFileSync(file, 'utf8');
        const updated = migrateSnapshotText(raw, date);
        if (updated !== raw) fs.writeFileSync(file, updated);
    }
}
write('units.json', units);
