// Reviewed changes from Blizzard's June-September 2026 retail patch notes.
// Run once on the May 12 baseline. Each date is written for both modes together.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const modes = ['Overwatch 2', 'Overwatch 2 6v6'];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 4) + '\n');
const baseline = '55981ca';
assert(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).startsWith(baseline), 'Run this one-time migration on its documented baseline commit.');
const original = p => JSON.parse(execFileSync('git',['show',`${baseline}:${p.replaceAll('\\','/')}`],{encoding:'utf8',maxBuffer:8*1024*1024}));
const list = original('patch_list.json');
const units = original('units.json');
const conflicts = [];
const logs = [];
const history = Object.fromEntries(modes.map(m => [m, list[m].map(f => ({ date: f.slice(0, 10), file: path.join('patches', m, f), data: original(path.join('patches', m, f)) }))]));
for (const m of modes) assert.equal(history[m].at(-1).date, '2026-05-12');
const du = s => [['display unit', s]];
const sec = du('seconds'), pct = du('percent'), meters = du('meters'), speed = du('meters per second'), degrees = du('degrees');
let mode, date, data;
function object(d, h, section, ability) {
    const hero = d.heroes[h];
    return section === 'general' ? hero?.general : hero?.[section]?.[ability];
}
function set(h, section, ability, key, value, old, unit = [], since = '2026-05-12') {
    const target = object(data, h, section, ability);
    assert(target, `${h}/${section}/${ability}`);
    const u = units.heroes[h][section] ??= {};
    const dest = section === 'general' ? u : (u[ability] ??= {});
    dest[key] ??= unit;
    if (old !== undefined) {
        if (target[key] !== undefined && Math.abs(Number(target[key]) - Number(old)) > 0.00001) {
            conflicts.push(`${date} ${mode}: ${h} / ${ability ?? 'general'} / ${key}: recorded ${target[key]}, official preceding value ${old}.`);
        }
        // Only backfill absent stats. Conflicting existing history is preserved and reported.
        for (const snapshot of history[mode]) {
            const previous = object(snapshot.data, h, section, ability);
            if (snapshot.date >= since && previous && previous[key] === undefined) previous[key] = old;
        }
    }
    target[key] = value;
}
const a = (h, ability, key, val, old, unit, since) => set(h, 'abilities', ability, key, val, old, unit, since);
const p = (h, perk, key, val, old, unit, since) => set(h, 'perks', perk, key, val, old, unit, since);
const g = (h, key, val, old, unit) => set(h, 'general', undefined, key, val, old, unit);
function remove(h, perk) { assert(data.heroes[h].perks[perk]); delete data.heroes[h].perks[perk]; }
function perk(h, name, stats, defs = {}) {
    assert(!data.heroes[h].perks[name]);
    data.heroes[h].perks[name] = stats;
    Object.assign(units.heroes[h].perks[name] ??= {}, Object.fromEntries(Object.keys(stats).map(k => [k, defs[k] ?? []])));
}
function cost(h, ability, factor) {
    const old = data.heroes[h].abilities[ability]['Ultimate cost'];
    a(h, ability, 'Ultimate cost', Math.round(old * factor * 10000) / 10000);
}
function newHero(name, hero, definitions) {
    assert(!data.heroes[name]);
    data.heroes[name] = structuredClone(hero);
    units.heroes[name] = definitions;
}
function diff(before, after, prefix = '') {
    const result = [];
    for (const k of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
        const x = before?.[k], y = after?.[k], loc = prefix ? `${prefix} / ${k}` : k;
        if (JSON.stringify(x) === JSON.stringify(y)) continue;
        if (x && y && typeof x === 'object' && typeof y === 'object') result.push(...diff(x, y, loc));
        else result.push(`${loc}: ${JSON.stringify(x) ?? 'absent'} -> ${JSON.stringify(y) ?? 'absent'}`);
    }
    return result;
}

const shion = {
    role: 'damage', general: { 'Base health': 250, Subrole: 'Flanker', 'Minor perk cost': 1625, 'Major perk cost': 4065 },
    abilities: {
        'Kira Pistols': { Damage: 35, 'Minimum damage': 10.5, 'Minimum falloff range': 20, 'Maximum falloff range': 30, 'Critical multiplier': 2, 'Recovery time': 0.25, Ammo: 18, 'Reload time': 1.5, 'Projectile size': 0.07 },
        Execution: { Cooldown: 5, 'Damage per bullet': 10, 'Minimum damage per bullet': 3, 'Bullets per burst': 14, 'Critical multiplier': 2, 'Cast time': 0.096, 'Recovery time': 0, 'Volley duration': 0.3, 'Projectile size': 0.17, 'Minimum falloff range': 20, 'Maximum falloff range': 30, 'Maximum horizontal spread': 8.5, 'Minimum horizontal spread': 1.3, 'Maximum vertical spread': 1, 'Minimum vertical spread': 0.7, 'Time to minimum spread': 0.7, 'Maximum hold after charge': 1.3 },
        Evade: { Cooldown: 6, Overhealth: 75, 'Recovery time': 0.48, 'Overhealth duration': 1.2, 'Overhealth decay delay': 0.6, Range: 8, 'Movement speed': 20, 'usable while reloading': true, 'usable while charging Execution': true },
        Joyride: { Cooldown: 15, 'Riding impact damage': 60, 'Ground launch damage': 130, 'Air launch impact damage': 30, 'Air launch explosion damage': 100, 'Cast time': 0.384, 'Ground launch recovery': 0.4, 'Air launch cast time': 0.56, 'Air launch recovery': 0.372, 'Maximum duration': 4, 'Air targeting duration': 1.5, 'Automatic reload time': 1.5, 'Inner explosion radius': 1.5, 'Outer explosion radius': 4, 'Ground launch detection radius': 1.5, 'Movement speed': 13, 'Knockback speed': 10 },
        'Satsuriku Spree': { 'Ultimate cost': 2400, Charges: 3, 'Damage per burst': 180, 'Minimum damage per burst': 90, 'Damage instances per burst': 4, 'Burst duration': 0.4, 'Activation recovery': 0.4, 'Rush cast time': 0.032, 'Rush recovery': 0.16, 'Stationary cast time': 0.576, 'Stationary recovery': 0.128, 'Maximum duration': 6, 'Dash duration': 0.528, 'Dash range': 12, 'Inner radius': 5, 'Outer radius': 7, 'Rush movement speed': 20, 'Stationary movement speed penalty': 50 }
    },
    perks: {
        'Rapid Reload': { Tier: 'Minor', 'Ammo reloaded': 9 },
        'X Machina': { Tier: 'Minor', 'Execution damage increase': 20, 'Enemy health threshold': 50 },
        Refuel: { Tier: 'Major', 'Instant healing': 50, 'Healing per second': 20 },
        'Faces of Death': { Tier: 'Major', 'Additional subroles': 'Recon, Specialist, Sharpshooter' }
    }
};
const dmon = {
    role: 'tank', general: { 'Base health': 275, 'Armor health': 325, 'Pilot health': 175, Subrole: 'Stalwart' },
    abilities: {
        'Plasma Saber': { Damage: 60, 'Swings per second': 1.52, Range: 4, 'ignores barriers': true },
        'Portable Fusion Repeater': { Damage: 12, 'Critical multiplier': 2, 'Shots per second': 7.813, Ammo: 30, Spread: 2, 'Minimum falloff range': 30, 'Maximum falloff range': 40 },
        'Power Barrier': { Health: 650, 'Regeneration rate': 65, 'Regeneration delay': 2, 'Destroyed cooldown': 5, 'Movement speed penalty': 30, 'Cast time': 0.065 },
        'Propulsors': { Cooldown: 1, 'Fuel drain rate': 40, 'Fuel regeneration rate': 15, 'Regeneration delay': 1, 'Movement speed increase': 70, 'Impact damage': 15, 'Knockback speed': 6.4 },
        'Fusion Repeater': { Damage: 15, 'Critical multiplier': 2, 'Shots per second': 9, Cooldown: 6, 'Maximum duration': 4, 'Maximum spread': 1.3, 'Shots to maximum spread': 10, 'Minimum falloff range': 30, 'Maximum falloff range': 40, 'Cast time': 0.3, 'Recovery time': 0.5, 'Cooldown start': 'ability end', 'can be cancelled early': true },
        'Surging Strike': { Cooldown: 6, Damage: 70, 'Area range': 5, 'Dash range': 10, 'Knockback speed': 20, 'Cast time': 0.15, 'Recovery time': 0.25, 'requires Power Barrier': true },
        'Eject!': { 'Invulnerability duration': 1.4 },
        'Limit Break': { Damage: 125, 'Initial overhealth': 250, 'Overhealth per enemy hit': 50, 'Incoming damage amplification': 50, 'Overhealth decay delay': 3, 'Damage amplification duration': 5, 'Self movement speed penalty': 30, 'Enemy movement speed slow': 50, 'Slow decay duration': 2.5, Range: 20 },
        'Call Mech (D.Mon)': { 'Maximum damage': 150, 'Minimum damage': 75, 'Transformation duration': 1.95, 'Knockback speed': 20.6, 'usable in midair': true }
    },
    perks: {
        'Beast Within': { Tier: 'Minor', 'Barrier healing per Plasma Saber hit': 40 },
        'MEKA Mobility': { Tier: 'Minor', 'Propulsors fuel cost reduction while shielding': 30 },
        Overstrike: { Tier: 'Major', 'Surging Strike lifesteal': 150 },
        'Focused Fusion': { Tier: 'Major', Damage: 45, 'Shots per second': 3.25, Spread: 0, 'Pilot weapon spread': 0 }
    }
};
// Explicit dimensional groups for launch baselines. Only weapon statistics get
// calculation tags; conditional ability numbers must not become primary-fire DPS.
function heroUnits(hero) {
    const out = { general: {}, abilities: {}, perks: {} };
    const percentages = /penalty|increase|amplification|slow$|threshold|lifesteal|reduction|fuel drain rate|fuel regeneration rate/i;
    for (const section of ['general', 'abilities', 'perks']) {
        const groups = section === 'general' ? { general: hero.general } : hero[section];
        for (const [name, values] of Object.entries(groups)) {
            const def = section === 'general' ? out.general : (out[section][name] = {});
            for (const [key, value] of Object.entries(values)) {
                let u = [];
                if (typeof value === 'boolean') u = du('flag');
                else if (/duration|cooldown|delay|cast time|recovery|time to|hold after|reload time/i.test(key) && typeof value === 'number') u = sec;
                else if (percentages.test(key)) u = pct;
                else if (/spread/i.test(key) && !/shots/i.test(key)) u = degrees;
                else if (/movement speed|knockback speed/i.test(key)) u = speed;
                else if (/range|radius|projectile size/.test(key.toLowerCase())) u = meters;
                else if (key === 'Healing per second' || (name === 'Power Barrier' && key === 'Regeneration rate')) u = du('health per second');
                else if (section === 'general' && ['Base health', 'Armor health', 'Shield health'].includes(key)) u = ['health'];
                def[key] = u;
            }
        }
    }
    return out;
}
const su = heroUnits(shion), dm = heroUnits(dmon);
Object.assign(su.abilities['Kira Pistols'], { Damage: [['damage instance','normal']], 'Critical multiplier': [['critical multiplier','headshot','normal']], 'Recovery time': ['time between shots',...sec], Ammo: ['ammo'], 'Reload time': ['reload time',...sec] });
Object.assign(su.abilities.Execution, { 'Damage per bullet': [['damage instance','normal']], 'Bullets per burst': ['bullets per burst',['bullets per burst','normal']], 'Critical multiplier': [['critical multiplier','headshot','normal']] });
Object.assign(dm.abilities['Plasma Saber'], { Damage: [['damage instance','normal']], 'Swings per second': ['shots per second'] });
for (const ability of ['Portable Fusion Repeater','Fusion Repeater']) Object.assign(dm.abilities[ability], { Damage: [['damage instance','normal']], 'Shots per second': ['shots per second'], 'Critical multiplier': [['critical multiplier','headshot','normal']] });
dm.abilities['Portable Fusion Repeater'].Ammo = ['ammo'];

const updates = {
    '2026-06-16': () => {
        newHero('Shion', shion, su);
        data['Map list']['Neon Junction'] = 1;
        p('D.Va','Shield System','Converted shield health',100,150,['health']);
        remove('Domina','Power Move'); perk('Domina','Corporate Retreat',{Tier:'Major','Barrier Array relocations':1});
        p('Doomfist','Power Matrix','Duration',0.8,1,sec);
        p('Hazard','Anarchic Zeal','Lifesteal rate',40,30,pct);
        p('Hazard','Reconstitution','Tier','Minor','Major',[],'2026-02-10');
        p('Hazard','Reconstitution','Max energy restoration',25,50,pct);
        p('Hazard','Deep Leap','Tier','Major','Minor',[],'2025-02-18');
        p('Hazard','Deep Leap','Violent Leap additional range',20,15,pct);
        p('Hazard','Explosive Impalements','Explosion damage',30,40);
        a('Hazard','Spike Guard','Maximum duration',2.5,3,sec);
        p('Ramattra','Relentless Form','Duration increase on elimination',2,1,sec);
        p('Ramattra','Relentless Form','Duration increase during Annihilation',1,1,sec);
        p('Ramattra','Nanite Repair','Healing per second',100,75,du('health per second'));
        a('Reinhardt','Firestrike','Damage',125,120);
        a('Reinhardt','Firestrike','Projectile speed',33,30,speed);
        a('Zarya','Energy','Energy degeneration rate',2,2.5);
        a('Anran','Inferno Rush','Recovery time',0.1,0.3,sec);
        a('Anran','Dancing Blaze','Recovery time',0.1,0.2,sec);
        p('Ashe','Double-Barreled','Knockback reduction',0,25,pct);
        delete data.heroes.Ashe.perks["Viper's Sting"]['Ammo reloaded'];
        delete data.heroes.Ashe.perks["Viper's Sting"]['Ammo gained'];
        p('Ashe','Airburst','Ammo reloaded',6,3);
        remove('Bastion','Armored Artillery'); perk('Bastion','Smart Bomb',{Tier:'Minor','A-36 Tactical Grenade self-knockback increase':25,'A-36 Tactical Grenade deals self damage':false},{'A-36 Tactical Grenade self-knockback increase':pct,'A-36 Tactical Grenade deals self damage':du('flag')});
        p('Cassidy','Even the Odds','Healing per second per Deadeye target',40,30,du('health per second'));
        p('Cassidy','Silver Bullet','Bleed total damage',50,70,[],'2026-04-14');
        p('Cassidy','Silver Bullet','Bleed duration',1.5,2.5,sec,'2026-04-14');
        p('Echo','Partial Scan','Duplicate starting ultimate charge',30,50,pct);
        p('Echo','Full Salvo','Extra projectiles',100/3,50,pct);
        p('Echo','Full Salvo','Additional projectile count',2,3,[],'2025-02-18');
        cost('Emre','Override Protocol',1.1);
        p('Genji','Meditation','Healing per second',50,35,du('health per second'));
        a('Genji','Deflect','Cooldown',8,10,sec);
        p('Junkrat','Bomb Voyage','Attack speed increase',35,25,pct);
        p('Mei','Deep Freeze','Non-tank freeze rate increase',30,0,pct);
        a('Mei','Endothermic Blaster','Range',12,10,meters);
        g('Reaper','Base health',275,300,['health']);
        p('Reaper','Lingering Wraith','Movement speed increase',30,40,pct);
        p('Sierra','Tight Grip','Spread tighten speed increase',70,100,pct);
        p('Sierra','Locked In','requires Tracking Shot to hit an enemy hero',true,false,du('flag'),'2026-04-14');
        a('Sierra','Helix Rifle','Projectile size',0.15,0.175,meters,'2026-04-14');
        a('Sierra','Anchor Drone','Deploy speed',40,30,speed,'2026-04-14');
        a('Sierra','Anchor Drone','Deploy range',16,14,meters);
        a('Sierra','Anchor Drone','Grapple range',19,17,meters);
        p('Sojourn','Friction Generators','Maximum energy generated',75,50);
        p('Tracer','Kinetic Reload','Ammo gained from Quick Melee',12,20);
        cost('Vendetta','Sundering Blade',0.85);
        a('Vendetta','Onslaught','Movement speed increase per stack',3,2,pct);
        a('Vendetta','Onslaught','Duration',7.5,5.5,sec);
        p('Ana','Speed Serum','Movement speed increase',30,40,pct);
        p('Brigitte','Whiplash','Damage',60,50);
        p('Illari','Rapid Construction','Cooldown reduction',2,1.5,sec);
        p('Jetpack Cat','Transport Shielding','Duration',3,5,sec,'2026-02-10');
        p('Jetpack Cat','Transport Shielding','Shield health',50,75,['health']);
        p('Jetpack Cat','Headbutt','Speed threshold',14,16.5,speed);
        delete data.heroes['Jetpack Cat'].perks.Headbutt['Fuel on knockback'];
        p('Jetpack Cat','Headbutt','Damage',50,30);
        a('Jetpack Cat','Frenetic Flight','Fuel regeneration slowdown while carrying',3,2,[],'2026-02-10');
        // Store the absolute rate as well as the slowdown, avoiding contradictory duplicate stats.
        a('Jetpack Cat','Frenetic Flight','Regeneration rate while carrying',data.heroes['Jetpack Cat'].abilities['Frenetic Flight']['Regeneration rate']/3);
        a('Jetpack Cat','Biotic Pawjectiles','Paw pellet damage',4.5,4);
        a('Jetpack Cat','Biotic Pawjectiles','Center pellet damage',9,8);
        a('Jetpack Cat','Biotic Pawjectiles','Healing per volley',27,24);
        p('Juno','Faster Blaster','Shots per second',22,20,[]);
        cost('Lifeweaver','Tree of Life',1.09);
        a('Lifeweaver','Tree of Life','Overhealth conversion rate',50,100,pct);
        p('Mercy','Chain Boost','Additional damage boost',5,0,pct);
        a('Mercy','Caduceus Staff','Secondary fire damage boost',25,30,pct);
        cost('Mercy','Valkyrie',1.07);
        a('Mizuki','Katashiro Return','Cooldown',11,12,sec);
        a('Mizuki','Katashiro Return','Paper doll duration',5.5,4.5,sec);
        a('Moira','Biotic Orb','Damage per second',60,50,['damage per second']);
        a('Moira','Biotic Orb','Healing per second',75,65,['healing per second']);
        a('Moira','Biotic Orb','Damage Orb capacity',250,200);
        p('Wuyang','Ebb and Flow','Returning wave healing reduction',0,50,pct);
    },
    '2026-06-23': () => { data['Map list']['Neon Junction'] += 1; },
    '2026-06-25': () => {
        a('Shion','Execution','Projectile size',0.07,0.17,meters);
        a('Shion','Execution','Recovery time',0.4,0,sec);
    },
    '2026-07-14': () => {
        a('Doomfist','Rocket Punch','Empowered collateral range increase',40,75,pct);
        a('Doomfist','Rocket Punch','Empowered collateral radius increase',40,50,pct);
        // Existing radius is an absolute 3 m at +50%; retain the same base radius.
        a('Doomfist','Rocket Punch','Empowered Rocket Punch knockback radius',2.8,3,meters);
        a('Junker Queen','Commanding Shout','Cooldown',mode===modes[0]?10:13,mode===modes[0]?12:15,sec);
        a('Mauga','Incendiary and Volatile Changuns','Spread when only one Chaingun is active',1.5,1,degrees);
        a('Mauga','Incendiary and Volatile Changuns','Single-gun shots until maximum spread',30,0);
        a('Ramattra','Ravenous Vortex','Explosion damage',30,15);
        a('Ramattra','Block','Cooldown',0.5,1,sec);
        if(mode===modes[0]) g('Sigma','Shield health',250,275,['health']);
        p('Sigma','Hyper Regeneration','Barrier restoration from Hypersphere damage',30,40,pct);
        p('Cassidy','Silver Bullet','Projectile size',0.07,0.17,meters,'2026-04-14');
        a('Freja','Revdraw Crossbow','Recovery time',1/5.5,0.2,['time between shots']);
        a('Freja','Take Aim','Recovery time',0.4,0.5,sec);
        a('Freja','Take Aim','Explosion delay',0.8,1,sec);
        p('Reaper','Soul Reaving','Pickup radius',8,5,meters);
        a('Reaper','The Reaping','Lifesteal percentage',30,25,pct);
        a('Shion','Execution','Recovery time',0.3,0.4,sec);
        a('Shion','Joyride','Riding impact damage',30,60);
        a('Sierra','Anchor Drone','Cooldown',11,12,sec);
        a('Sierra','Anchor Drone','Duration',9,10,sec);
        a('Sierra','Anchor Drone','Health',125,80,['health']);
        a('Vendetta','Palatine Fang (Overhead Strike)','Overhead swing bonus range',2.5,2,meters);
        a('Vendetta','Palatine Fang (Overhead Strike)','Overhead critical range',6.8,6.3,meters);
        a('Venture','Clobber','Recovery time',1.2,1.6,sec);
        a('Ana','Biotic Grenade','Damage',90,75);
        a('Ana','Biotic Grenade','Healing',90,75);
        a('Brigitte','Inspire','Instant healing',12,0);
        a('Brigitte','Inspire','Healing per second',11.25,15,['healing per second']);
        a('Kiriko','Healing Ofuda','Healing per projectile',12,13);
        a('L\u00facio','Sonic Amplifier','Damage',22,20);
    },
    '2026-08-11': () => {
        newHero('D.Mon',dmon,dm);
        // 6v6 base mech health is not supplied by the sources; do not copy the 5v5 value.
        if(mode===modes[1]) delete data.heroes['D.Mon'].general['Base health'];
        data.roles.Flanker['Additional healing from health packs'] = 50;
        for(const map of ['Busan','Eichenwalde','Para\u00edso']) data['Map list'][map] += 1;
        a('Domina','Panopticon','Barrier health',500,450,['health']);
        a('Doomfist','Seismic Slam','Damage',60,50);
        cost('Hazard','Downpour',1.07);
        p('Hazard','Explosive Impalements','Bonespur hits required',12,14,[],'2026-04-14');
        p('Mauga','Combat Fuel','Stored overhealth per critical hit',4,3);
        if(mode===modes[0]) a('Mauga','Overrun','Cooldown',6,5,sec);
        remove('Orisa','Charged Javelin'); perk('Orisa','Heavy Javelin',{Tier:'Major','Energy Javelin knockback increase':25,'Additional wall impact damage':15},{'Energy Javelin knockback increase':pct});
        cost('Winston','Primal Rage',0.94);
        p('Winston','Revitalizing Barrier','Healing per second',35,30,du('health per second'));
        remove('Cassidy','Even the Odds'); perk('Cassidy','Giddy Up',{Tier:'Minor','Movement speed increase after Combat Roll':60,'Movement speed decay duration':1.5},{'Movement speed increase after Combat Roll':pct,'Movement speed decay duration':sec});
        remove('Echo','High Beams'); perk('Echo','Aerial Munitions',{Tier:'Minor','Infinite ammo during Flight':true},{'Infinite ammo during Flight':du('flag')});
        p('Echo','Focused Rush','Tier','Major','Minor',[],'2026-02-10');
        p('Echo','Focused Rush','Focusing Beam range increase',8,6,meters);
        p('Echo','Focused Rush','Movement speed increase',25,15,pct);
        cost('Emre','Override Protocol',0.94);
        p('Emre','Suppressive Security','Duration',1.5,1,sec);
        cost('Genji','Dragonblade',0.94);
        a('Pharah','Concussive Blast','Cooldown',8,7,sec);
        a('Shion','Joyride','Ground launch detection radius',1,1.5,meters);
        remove('Tracer','Chronal Dash'); perk('Tracer','Temporal Regen',{Tier:'Minor','Passive health regeneration delay reduction':50},{'Passive health regeneration delay reduction':pct});
        a('Tracer','Recall','Cooldown',12,13,sec);
        a('Vendetta','Soaring Slice','Respawn cooldown',3,7,sec,'2026-03-10');
        cost('Venture','Tectonic Shock',0.92);
        p('Venture','Deep Burrow','Drill Dash range increase while burrowed',75,50,pct);
        p('Venture','Covered In Dirt','Maximum additional shields',40,30,['health']);
        cost('Jetpack Cat','Catnapper',1.07);
        g('Jetpack Cat','Movement speed',6,5.5,speed);
        g('Jetpack Cat','Air acceleration',9.5,7.7);
        remove('Jetpack Cat','Headbutt'); perk('Jetpack Cat','Purrfect Form',{Tier:'Major','Waves per Purr pulse':3});
        a('Jetpack Cat','Lifeline','Movement speed increase',30,40,pct);
        a('Juno','Pulsar Torpedoes','Minimum lock-on time',0.35,0.5,sec);
        a('Lifeweaver','Life Grip','can be cancelled with Jump',true,false,du('flag'));
        a('Lifeweaver','Life Grip','Manual cancel delay',0.6,undefined,sec);
        a('Lifeweaver','Life Grip','Base pull speed',25,30,speed);
        a('Lifeweaver','Life Grip','Long-distance acceleration threshold',15,undefined,meters);
        p('Mizuki','Quickstep','Ally movement speed increase',20,25,pct);
        a('Mizuki','Binding Chain','Projectile size',0.3,0.35,meters,'2026-02-10');
        a('Mizuki','Katashiro Return','Cooldown',12,11,sec);
        a('Wuyang','Guardian Wave','Maximum view angle',15,10,degrees);
        p('Zenyatta','Discordant Repair','Lifesteal rate',15,10,pct);
    },
    '2026-08-12': () => {
        a('D.Mon','Plasma Saber','Damage',65,60);
        a('D.Mon','Propulsors','Fuel drain rate',25,40,pct);
        a('D.Mon','Propulsors','Fuel regeneration rate',22.5,15,pct);
        a('D.Mon','Fusion Repeater','Damage',16,15);
        a('D.Mon','Fusion Repeater','Cooldown',4,6,sec);
    },
    '2026-08-14': () => {
        a('D.Mon','Surging Strike','Cast time',0.05,0.15,sec);
        a('D.Mon','Surging Strike','Recovery time',0.15,0.25,sec);
        a('D.Mon','Fusion Repeater','Cast time',0.2,0.3,sec);
        a('D.Mon','Fusion Repeater','Recovery time',0.2,0.5,sec);
        g('Jetpack Cat','Movement speed',5.5,6,speed);
        a('Jetpack Cat','Purr','Self-healing penalty',40,25,pct,'2026-02-10');
    },
    '2026-09-08': () => {
        if(mode===modes[1]) g('D.Mon','Armor health',300,325,['health']);
        a('D.Mon','Plasma Saber','Damage',60,65);
        a('D.Mon','Power Barrier','Cast time',0.016,0.065,sec);
        a('D.Mon','Call Mech (D.Mon)','Transformation duration',0.95,1.95,sec);
        a('D.Mon','Portable Fusion Repeater','Spread',1.75,2,degrees);
        a('D.Mon','Portable Fusion Repeater','Minimum falloff range',20,30,meters);
        if(mode===modes[0]) g('D.Va','Base health',200,175,['health']);
        cost('Domina','Panopticon',0.94);
        if(mode===modes[0]) g('Mauga','Armor health',125,150,['health']);
        a('Mauga','Incendiary and Volatile Changuns','Spread when only one Chaingun is active',1,1.5,degrees);
        a('Mauga','Incendiary and Volatile Changuns','Spread for firing both guns',5,4,degrees);
        a('Mauga','Incendiary and Volatile Changuns','Dual-gun minimum falloff range',10,15,meters);
        if(mode===modes[0]) a('Winston','Barrier Projector','Cooldown',10,12,sec);
        a('Winston','Barrier Projector','Duration',7,8,sec);
        p('Wrecking Ball','Adaptive Barrier','Barrier duration',1,1.5,sec);
        if(mode===modes[0]) a('Zarya','Particle Barrier','Cooldown',12,11,sec);
        a('Anran','Vermillion Revival','Cast time',2.5,3,sec);
        p('Freja','Relentless Barrage','Refunded ammo',5,8);
        a('Freja','Revdraw Crossbow','Damage',28,30);
        a('Freja','Take Aim','Explosion damage',75,80);
        p('Junkrat','Nitro Boost','Movement speed increase',100,125,pct);
        a('Junkrat','Concussion Mine','Cooldown',7,8,sec);
        a('Sierra','Helix Rifle','Projectile speed',120,90,speed);
        a('Sierra','Helix Rifle','Damage per projectile',8.5,9);
        a('Sierra','Tracking Shot','Tracked projectile damage',8.5,9);
        a('Sierra','Tremor Charge','Cooldown',7,8.5,sec);
        a('Symmetra','Teleporter','Maximum range',25,30,meters);
        a('Symmetra','Teleporter','Reuse cooldown',1.25,1,sec);
        p('Torbj\u00f6rn','Anchor Bolts','Additional throw distance',25,50,pct);
        a('Torbj\u00f6rn','Rivet Gun Alt Fire','Spread',4,4.5,degrees);
        a('Vendetta','Palatine Fang','First swing startup',0.15,0.3,sec);
        a('Vendetta','Palatine Fang','Horizontal swing duration',0.2,0.25,sec);
        a('Vendetta','Palatine Fang','Combo input delay',0.9,0.75,sec);
        // The prior average rate uses pre-patch swing timings; a new full combo
        // measurement is needed before exposing a derived DPS for this snapshot.
        delete data.heroes.Vendetta.abilities['Palatine Fang']['Average swing rate'];
        a('Vendetta','Whirlwind Dash','Recovery time',0.75,0.5,sec);
        a('Vendetta','Sundering Blade','Recovery time',0.5,0.2,sec);
        a('Baptiste','Immortality Field','Minimum health threshold',25,20,pct);
        a('Baptiste','Immortality Field','Cooldown',20,22,sec);
        a('Baptiste','Immortality Field','Health',150,125,['health']);
        g('Brigitte','Base health',175,200,['health']);
        g('Brigitte','Armor health',75,50,['health']);
        a('Jetpack Cat','Biotic Pawjectiles','Paw pellet damage',4,4.5);
        a('Jetpack Cat','Biotic Pawjectiles','Center pellet damage',8,9);
        a('Jetpack Cat','Biotic Pawjectiles','Healing per volley',24,27);
        a('Jetpack Cat','Lifeline','carried target stuns and mobility locks disconnect tether',true,false,du('flag'),'2026-02-10');
        a('Jetpack Cat','Lifeline','allies automatically accept over death planes',true,false,du('flag'),'2026-02-10');
        a('Kiriko','Healing Ofuda','Projectile speed',18,24,speed);
        a('Kiriko','Healing Ofuda','Maximum seeking range',30,35,meters);
        a('Kiriko','Protection Suzu','Invulnerability duration',0.5,0.65,sec);
        a('Kiriko','Protection Suzu','Explosion radius',4,5,meters);
        a('Wuyang','Restorative Stream','Energy recharge per second',15,12.5,pct);
        a('Wuyang','Restorative Stream','Passive line of sight timeout',3,5,sec);
        a('Zenyatta','Harmony Orb','Time to wear off when not in line-of-sight',3,5,sec);
    }
};

for (const [d, update] of Object.entries(updates)) {
    date = d;
    for (mode of modes) {
        data = structuredClone(history[mode].at(-1).data);
        update();
        history[mode].push({date, file:path.join('patches',mode,`${date}.json`), data});
        list[mode].push(`${date}.json`);
    }
    console.log(`Prepared ${date} in both modes`);
}
for (mode of modes) {
    for (let i=0;i<history[mode].length;i++) {
        const snapshot = history[mode][i];
        if(snapshot.date > '2026-05-12') logs.push(`## ${snapshot.date} ${mode}\n\n` + diff(history[mode][i-1].data,snapshot.data).map(x=>`- ${x}`).join('\n'));
        const original = fs.existsSync(snapshot.file) ? read(snapshot.file) : null;
        if(JSON.stringify(original)!==JSON.stringify(snapshot.data)) write(snapshot.file,snapshot.data);
    }
}
write('units.json',units); write('patch_list.json',list);
fs.mkdirSync('audits',{recursive:true});
fs.writeFileSync('audits/2026-09-update-diffs.md', '# June-September 2026 snapshot comparisons\n\nGenerated from consecutive snapshots after historical backfills. Source review and exceptions: `2026-09-update.md`.\n\n' + logs.join('\n\n')+'\n');
fs.writeFileSync(path.join(process.env.TEMP,'overwatch-september-audit','conflicts.txt'), conflicts.join('\n')+'\n');
console.log(conflicts.join('\n'));
