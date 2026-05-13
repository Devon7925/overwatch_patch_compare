import {
    autoTypeguard,
    erroringAutoTypeguard,
    erroringIsObjectWithValues,
    erroringIsString,
    isArrayMatchingTypeguard,
    isLiteral,
    isNumber,
    isObjectWithValues,
    isString,
    isTupleMatchingTypeguards,
    unionTypeguard,
} from "./utils.js";

export type DisplayUnit = "percent" | "meters" | "seconds" | "health per second" | "meters per second" | "relative percent" | "flag" | "degrees";
export type WithRemainder<T extends string, R extends any[]> = T extends any ? [T, ...R] : never;
export type WithAppend<T extends string | [string, ...any], R extends string> = R extends any ? (T extends [infer First extends string, ...infer Rest extends any[]] ? [`${First}${R}`, ...Rest] : T extends string ? `${T}${R}` : never) : never;

export type Situation = string;
export type DamageType = string;
export type CritType = string;

export type Unit =
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
    | ["critical multiplier", CritType] | ["critical multiplier", CritType, DamageType] | "bullets per burst" | "ammo" | "charges" | "reload time" | "health" | "breakpoint damage" | "time between shots" | "shots per second" | "burst recovery time" | "reload time per ammo" | "ammo per shot" | "damage per second" | "healing per second";

export type Value = string | number | boolean;
export type Hero = "D.Va" |
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
    "Sierra" |
    "Vendetta" |
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
    "Domina" |
    "Anran" |
    "Emre" |
    "Jetpack Cat" |
    "Mizuki" |
    "Wuyang" |
    "Zenyatta";
export type PatchStructure<T> = {
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
};
export type PatchData = PatchStructure<Value> & {
    "Map list": {
        [map: string]: number
    }
};
export type UnitsStructure<T> = {
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
};
export type Units = UnitsStructure<Unit[]>;

export type SpecialArmorBehavior = ["flat percent mit", number] | undefined;

export const isDisplayUnit = unionTypeguard<DisplayUnit>([
    isLiteral("percent"),
    isLiteral("meters"),
    isLiteral("seconds"),
    isLiteral("health per second"),
    isLiteral("meters per second"),
    isLiteral("relative percent"),
    isLiteral("flag"),
    isLiteral("degrees"),
]);

export const isUnit = unionTypeguard<Unit>([
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
    isLiteral("shots per second"),
    isLiteral("burst recovery time"),
    isLiteral("reload time per ammo"),
    isLiteral("ammo per shot"),
    isLiteral("damage per second"),
    isLiteral("healing per second"),
]);

export const isCalculationUnits = erroringAutoTypeguard<Units>({
    general: isObjectWithValues(isArrayMatchingTypeguard(isUnit)),
    roles: erroringIsObjectWithValues(erroringIsObjectWithValues(isArrayMatchingTypeguard(isUnit))),
    heroes: erroringIsObjectWithValues(autoTypeguard({
        general: erroringIsObjectWithValues(isArrayMatchingTypeguard(isUnit)),
        abilities: erroringIsObjectWithValues(isObjectWithValues(isArrayMatchingTypeguard(isUnit))),
    }, {
        perks: erroringIsObjectWithValues(erroringIsObjectWithValues(isArrayMatchingTypeguard(isUnit))),
        breakpoints: isObjectWithValues(isArrayMatchingTypeguard(isUnit)),
        breakpoints_data: isObjectWithValues(isObjectWithValues(isNumber))
    })),
    modes: isObjectWithValues(isObjectWithValues(isArrayMatchingTypeguard(isUnit)))
}, {});

const isValue = unionTypeguard<Value>([isString, isNumber, isLiteral(false), isLiteral(true)]);

export const isPatchData = erroringAutoTypeguard<PatchData>({
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
}, {});
