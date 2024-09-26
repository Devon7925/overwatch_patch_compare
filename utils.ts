

type CapitalLetter = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"|"O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z"
type LowerLetter = Lowercase<CapitalLetter>
type Whitespace = " "|"\t"|"\n"|"\r"
type Character = LowerLetter|CapitalLetter|Whitespace|"<"|">"|"="|"\""|"'"|"."|"/"
type MapV<V extends string, M extends string> = M extends `${infer C extends Character}${infer Rest extends string}` ? `${C}${MapV<V, Rest>}` : M extends `${infer _ extends string}${infer Rest extends string}`?`${V}${MapV<V, Rest>}`:M
type Map<T extends string[], U extends string> = { [K in keyof T]: MapV<T[K], U> }
type JoinStrings<T extends string[]> = T extends [T[0], ...infer V extends string[]] ? `${T[0]}${JoinStrings<V>}` : ""

declare global {
    interface JSON {
        parse(text: string, reviver?: (this: any, key: string, value: any) => any): unknown;
    }
    interface ArrayConstructor {
        isArray(arg: unknown): arg is unknown[] | readonly unknown[];
    }

    interface ObjectConstructor {
        values<T>(o: { [s: string]: T } | ArrayLike<T>): T[];
        values(o: {}): unknown[];
        entries<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][];
        entries(o: {}): [string, unknown][];
    }

    interface Array<T extends string> {
        map<V extends string[], U extends string>(this:string[] extends V?never:V, u: (value: string, index: number, array: V) => U):Map<V, U>
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
        join<V extends T[]>(this: V):JoinStrings<V>;
        join(separator?: string): string;
    }
}

/**
 * Takes a type and returns a modified version of it where all properties and subproperties are optional.
 * 
 * @typeparam T The type to make optional.
 */
export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

type Primatives = string | number | boolean
/**
 * A type largely used to avoid the `any` type. Represents arbitrary JSON data
 */
export type JSONObj = { [key: string]: JSONObj } | JSONObj[] | Primatives
export type NullableJSONObj = undefined | { [key: string]: NullableJSONObj } | NullableJSONObj[] | Primatives

/**
 * Waits for a given amount of time and then resolves.
 * 
 * @param ms The amount of time to wait in milliseconds.
 */
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Delays execution of a function until all curently executing code is finished.
 * 
 * @param callback The function to call.
 */
export function delayExecution(callback: () => void) {
    setTimeout(callback, 0)
}

/**
 * Escapes a string for use in a RegExp.
 * 
 * @param string The string to escape.
 * @returns The escaped string.
 */
export function escapeRegex(string: string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Returns if a KeyboardEvent would cause text in a textbox to change.
 * 
 * @param event The KeyboardEvent to check.
 * @returns Whether the event would cause text in a textbox to change.
 */
export function isTextChangingEvent(event: KeyboardEvent) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Escape', 'Control', 'Alt', 'Shift'].includes(event.key)) return false
    if (event.ctrlKey) {
        if (['Backspace', 'Delete'].includes(event.key)) return true
        return false
    }
    return true
}

/**
 * Takes an event to a InputBox and returns what the result would be if the event were to be resolved.
 * 
 * @param e Either a {@link KeyboardEvent} or a {@link ClipboardEvent}.
 * @returns The result value of the textbox if the event were to be resolved.
 */
export function getNewInputValue(e: KeyboardEvent | ClipboardEvent) {
    if (!e.target) throw new Error("e.target is null")
    if (!(e.target instanceof HTMLInputElement)) throw new Error("e.target is not an HTMLInputElement")
    let newValue = e.target.value;
    let valueArray = newValue.split('');
    const selectionStart = e.target.selectionStart !== null ? e.target.selectionStart : 0;
    const selectionEnd = e.target.selectionEnd !== null ? e.target.selectionEnd : selectionStart;
    const selectionLength = (selectionEnd - selectionStart);
    if (e instanceof KeyboardEvent) {
        if (e.ctrlKey) {
            if (e.key === 'Backspace') {
                if (selectionLength === 0 && selectionStart > 0) {
                    let wordStart = selectionStart
                    let spaceMode = true
                    while (wordStart > 0) {
                        if (spaceMode && valueArray[wordStart - 1] !== ' ') spaceMode = false
                        if (!spaceMode && valueArray[wordStart - 1] === ' ') break
                        wordStart--
                    }
                    let deleteLength = selectionStart - wordStart
                    valueArray.splice(wordStart, deleteLength);
                } else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            } else if (e.key === 'Delete') {
                if (selectionLength === 0) {
                    let wordEnd = selectionStart + 1
                    let spaceMode = true
                    while (wordEnd < valueArray.length) {
                        if (spaceMode && valueArray[wordEnd] !== ' ') spaceMode = false
                        if (!spaceMode && valueArray[wordEnd] === ' ') break
                        wordEnd++
                    }
                    let deleteLength = wordEnd - selectionStart
                    valueArray.splice(selectionStart, deleteLength);
                } else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            }
        } else {
            if (e.key === 'Backspace') {
                if (selectionLength === 0 && selectionStart > 0) {
                    valueArray.splice(selectionStart - 1, selectionLength + 1);
                } else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            } else if (e.key === 'Delete') {
                if (selectionLength === 0) {
                    valueArray.splice(selectionStart, selectionLength + 1);
                } else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            } else if (!(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key))) {
                valueArray.splice(selectionStart, selectionLength, e.key);
            }
        }
    } else {
        if (e.clipboardData)
            valueArray.splice(selectionStart, selectionLength, e.clipboardData.getData('Text'))
    }
    newValue = valueArray.join('');
    return newValue;
}

/**
 * Attempts to assign one value to another value while keeping the pointers of the original value the same. Only works through objects, not arrays.
 * 
 * @param address The value to assign to.
 * @param value The value to assign from.
 */
export function deepAssign(address: { [key: string]: NullableJSONObj }, value: { [key: string]: NullableJSONObj }) {
    for (const k in value) {
        if (hasOwnProperty(address, k)) {
            const addressVal = address[k]
            const valueVal = value[k]
            if(valueVal === undefined) throw new Error(`valueVal is undefined for key ${k}`)
            if (isObject(addressVal) && isObject(valueVal)) {
                deepAssign(addressVal, valueVal)
                continue;
            }
            address[k] = valueVal
        }
    }
}

type SelfRecursive<O> = (fn: SelfRecursive<O>) => O
/**
 * U Combinator (https://en.wikipedia.org/wiki/U_combinator). Applies the given function to itself.
 * 
 * @param f The function to apply to itself
 * @returns The result of applying f to itself.
 */
export const U:<T>(f:SelfRecursive<T>) => T = f => f (f)
/**
 * Y Combinator (https://en.wikipedia.org/wiki/Fixed-point_combinator#Y_combinator). Takes a function that takes itself as an argument and returns something. Returns the thing that the function argument returns.
 * Used for creating anonymous recursive functions.
 */
export const Y:<T extends Function>(a:(b:T)=>T)=>T = U ((h:Function) => (f:Function) => f ((x:any) => h (h) (f) (x)))

/**
 * Converts a tuple into an array of typeguards for the tuple's elements.
 */
type TupleToTypeguards<T extends unknown[]> = { [K in keyof T]: (data: unknown) => data is T[K] }
type Tail<T extends unknown[]> = T extends [T[0], ...infer V] ? V : never
type Push<T extends unknown[], V> = [...T, V];
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type LastOf<T> = UnionToIntersection<T extends unknown ? () => T : never> extends () => (infer R) ? R : never
type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>
type NoArrayUnionTypeguards<T> = TupleToTypeguards<TuplifyUnion<T>>
type CheckNotUnion<T> = TuplifyUnion<T> extends [infer _] ? T : unknown
type TupleOmit<T extends unknown[], Key extends string> = { [K in keyof T]: Omit<T[K], Key> }
type BetterOmit<T extends {}, K extends keyof T> = TupleOmit<TuplifyUnion<T>, K & string>[number]

/**
 * Typeguards for whether the given object is an array where all the elements match the given typeguard.
 * 
 * @typeparam T The type to check the elements of the array for.
 * @param typeguard The typeguard to check the elements of the array against.
 * @param data The array to check.
 * @returns Whether the array is an array of all the given type.
 */
export function isArrayMatchingTypeguard<T>(typeguard: (x: unknown) => x is T) {
    return (data: unknown): data is T[] => {
        if (!Array.isArray(data)) return false
        return data.every(typeguard)
    }
}

/**
 * Typeguards for a given object to have values all of the type for the given typeguard.
 * 
 * @param typeguard The typeguard to check the values of the object against.
 * @returns A typeguard for the object to have values all of the type for the given typeguard.
 */
export function isObjectWithValues<T>(typeguard: (x: unknown) => x is T) {
    return (data: unknown): data is { [key: string]: T } => {
        if (!isObject(data)) return false
        return Object.values(data).every(typeguard)
    }
}

/**
 * Typeguards for whether the given object matches one of the given typeguards.
 * 
 * @param aTypeGuard The first typeguard to check the object against.
 * @param bTypeGuard The second typeguard to check the object against.
 * @returns Whether the object matches one of the given typeguards.
 */
export function eitherType<A, B>(aTypeGuard: (x: unknown) => x is A, bTypeGuard: (x: unknown) => x is B): (x: unknown) => x is A | B {
    return (x: unknown): x is A | B => {
        return aTypeGuard(x) || bTypeGuard(x)
    }
}

/**
 * Returns a typeguard for a tuple given typeguards for each of it's elements.
 * 
 * @param typeguards The typeguards for each of the tuple's elements.
 * @returns A typeguard for the tuple.
 */
export function isTupleMatchingTypeguards<T extends any[]>(...typeguards: TupleToTypeguards<T>): (x: unknown) => x is T {
    return (data: unknown): data is T => {
        if (!Array.isArray(data)) return false
        if (data.length !== typeguards.length) return false
        for (let i = 0; i < typeguards.length; i++) {
            const typeguard = typeguards[i]
            if (typeguard === undefined) throw new Error("typeguard is undefined")
            if (!typeguard(data[i])) return false
        }
        return true
    }
}

/**
 * Generates a typeguard for a tuple given a typeguard for its first element and a typeguard for the rest of its elements. Useful for generating typeguards for tuples of varying length where the first element(s) have a different type(ex. [string, ...number]).
 * 
 * @param startTypeguard The typeguard to check the start of the tuple against.
 * @param restTypeguard The typeguard to check the rest of the tuple against.
 * @returns A typeguard for the tuple.
 */
export function isSplitTupleMatchingTypeguards<T extends any[]>(startTypeguard: (d: unknown) => d is T[0], restTypeguard: (d: unknown) => d is Tail<T>): (x: unknown) => x is T {
    return (data: unknown): data is T => {
        if (!Array.isArray(data)) return false
        if (data.length === 0) return false
        if (!startTypeguard(data[0])) return false
        if (!restTypeguard(data.slice(1))) return false
        return true
    }
}


/**
 * Typeguards for whether the given value is null.
 * 
 * @param value The value to check.
 * @returns Whether the value is null.
 */
export function isNull(value: unknown): value is null {
    return value === null
}

/**
 * Typeguards for whether the given value is never. Always returns false.
 * 
 * @param value The value to check.
 * @returns Whether the value is never.
 */
export function isNever(_: unknown): _ is never {
    return false
}

/**
 * Typeguards for whether the given value is undefined.
 * 
 * @param value The value to check.
 * @returns Whether the value is undefined.
 */
export function isUndefined(value: unknown): value is undefined {
    return value === undefined;
}

/**
 * Typeguards for whether the given value is a boolean.
 * 
 * @param value The value to check.
 * @returns Whether the value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean"
}

/**
 * Typeguards for whether the given value is a number.
 * 
 * @param value The value to check.
 * @returns Whether the value is a number.
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number"
}

/**
 * Typeguards for whether the given value is a string.
 * 
 * @param value The value to check.
 * @returns Whether the value is a string.
 */
export function isString(value: unknown): value is string {
    return typeof value === "string"
}

/**
 * Returns a typeguard for whether the given value is the given string literal
 * 
 * @param value The value to check.
 * @returns A typeguard for whether the value is the given string literal.
 */
export function isLiteral<T extends any>(literal: T): (value: unknown) => value is T {
    return (value: unknown): value is T => value === literal
}

/**
 * Typeguards for whether the given value is an object and not an array.
 * 
 * @param value The value to check.
 * @returns Whether the value is an object and not an array.
 */
export function isObject(value: unknown): value is {[key:string|number|symbol]: unknown} {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Typeguards for whether the given value is a {@link Element}
 * 
 * @param data The data to check.
 * @returns Whether the data is a {@link Element}
 */
export function isElement(data: unknown): data is Element {
    return data instanceof Element
}

let parser: DOMParser
type StripStartWhitespace<T extends string> = T extends `${Whitespace}${infer Rest extends string}` ? StripStartWhitespace<Rest> : T
type StripEndWhitespace<T extends string> = T extends `${infer Rest extends string}${Whitespace}` ? StripEndWhitespace<Rest> : T
type StripWhitespace<T extends string> = StripStartWhitespace<StripEndWhitespace<T>>
type TagLookup = {
    "div": HTMLDivElement,
    "p": HTMLParagraphElement,
}
type HTMLTags = TuplifyUnion<keyof TagLookup>
type StringToElem<T extends string> = StripWhitespace<T> extends `<${infer Tag extends HTMLTags[number]} ${infer Rest}`? Rest extends `${string}</${Tag}>`?TagLookup[Tag]: never : never
/**
 * Converts a html string to a {@link Element}
 * 
 * @param string The html string to convert.
 * @returns The {@link Element} that was created from the html string.
 */
export function stringToElement<T extends string>(string: T):StringToElem<T> {
    if (!parser) parser = new DOMParser()
    const children = parser.parseFromString(string, 'text/html').body.children
    if (!children || !children[0]) throw new Error("Invalid HTML")
    return children[0] as any
}

/**
 * Typeguards for whether the Object has a given property.
 * 
 * @param obj The object to check.
 * @param prop The property to check.
 * @returns Whether the property exists on the object.` 
 */
export function hasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown>;
export function hasOwnProperty<V, X extends { [key: PropertyKey]: V }, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, V>;
export function hasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop)
}

type ForcedOptionalKey<T extends {}> = keyof { [K in keyof T as undefined extends T[K] ? K : never]: K } & keyof T
type ForcedRequiredKey<T extends {}> = keyof { [K in keyof T as undefined extends T[K] ? never : K]: K } & keyof T

/**
 * Returns a function that can check for required properties of the given type on an object.
 * 
 * @typeparam T The type to check
 * @returns A function that can check for required properties of the given type on an object.
 */
export function checkRequiredProperty<T extends {}>() {
    return function <X extends {}, Y extends ForcedRequiredKey<T>, TG extends undefined | ((x: unknown) => x is T[Y])>(obj: X, prop: Y, typeGuard?: TG): obj is X & Record<Y, TG extends undefined ? unknown : T[Y]> {
        if (!hasOwnProperty(obj, prop)) return false
        return typeGuard ? typeGuard(obj[prop]) : true
    }
}

/**
 * Returns a function that can check for optional properties of the given type on an object.
 * 
 * @typeparam T The type to check
 * @returns A function that can check for optional properties of the given type on an object.
 */
export function checkOptionalProperty<T extends {}>() {
    return function <X extends {}, Y extends ForcedOptionalKey<T>, TG extends undefined | ((x: unknown) => x is T[Y])>(obj: X, prop: Y, typeGuard?: TG): obj is X & Record<Y, TG extends undefined ? unknown : (T[Y] | undefined)> {
        if (!hasOwnProperty(obj, prop)) return true
        return typeGuard ? typeGuard(obj[prop]) : true
    }
}

/**
 * Creates a automatic typeguard for the given type.
 * 
 * @param typeGuardRequiredKeys An object from required keys on the type to the typeguard for that key.
 * @param typeGuardOptionalKeys An object from optional keys on the type to the typeguard for that key.
 * @returns A typeguard for the given type.
 */
export function autoTypeguard<T extends {}>(typeGuardRequiredKeys: { [key in ForcedRequiredKey<T>]-?: (d: unknown) => d is T[key] }, typeGuardOptionalKeys: { [key in ForcedOptionalKey<T>]-?: (d: unknown) => d is T[key] }): (data: unknown) => data is CheckNotUnion<T> {
    return function (data: unknown): data is CheckNotUnion<T> {
        if (data === null || data === undefined || typeof data !== "object" || Array.isArray(data)) return false
        for (const key in typeGuardRequiredKeys) {
            const requiredKey = key as ForcedRequiredKey<T>
            if (!checkRequiredProperty<T>()(data, requiredKey, typeGuardRequiredKeys[requiredKey])) return false
        }
        for (const key in typeGuardOptionalKeys) {
            const optionalKey = key as ForcedOptionalKey<T>
            if (!checkOptionalProperty<T>()(data, optionalKey, typeGuardOptionalKeys[optionalKey])) return false
        }
        return true
    }
}

/**
 * Returns a function that checks an array of elements to ensure it matches all of the cases in the optional type.
 * @returns A function that returns the input if it matches the type, otherwise never(compiler error).
 */
export const arrayOfAll = <T>() => <U extends T[]>(
    array: U & ([T] extends [U[number]] ? unknown : 'Invalid')
) => array

/**
 * Typeguards for whether a given key is a property of the given type.
 * 
 * @param obj The object to check.
 * @param key The key to check whether it is a key of the object.
 * @returns Whether the key is a property of the object.
 */
export function isKeyOf<T extends {}>(obj: T, key: unknown): key is keyof T {
    if (!isString(key)) return false
    return obj.hasOwnProperty(key)
}

/**
 * Typeguards for a union of different types given typeguards for each of the different types it could be.
 * @param typeguards An array of typeguards for each of the different types it could be.
 */
export function unionTypeguard<T>(typeguards: NoArrayUnionTypeguards<T>): (data: unknown) => data is T
export function unionTypeguard<T, U extends (NoArrayUnionTypeguards<T>[number][])>(typeguards: U): (data: NoArrayUnionTypeguards<T>[number][] extends U ? unknown : "You are missing checks for some union cases" | T) => data is T
export function unionTypeguard<T, U extends (NoArrayUnionTypeguards<T>[number][])>(typeguards: U): (data: NoArrayUnionTypeguards<T>[number][] extends U ? unknown : "You are missing checks for some union cases" | T) => data is T {
    return function (data: unknown): data is T {
        for (const typeguard of typeguards) {
            if (typeguard(data)) return true
        }
        return false
    }
}

/**
 * Typeguards for an object by checking a typeguard for a specific required key. And then checking a typeguard for the object without the key. Useful for checking unions where all cases include the same key.
 * 
 * @param key The key to check.
 * @param partialTypeguard The typeguard for the value of the key.
 * @param restTypeguard The typeguard for the object without the key.
 * @returns A typeguard for the object.
 */
export function partialTypeguard<T extends {}, K extends ForcedRequiredKey<T>>(key: K, partialTypeguard: (data: unknown) => data is T[K], restTypeguard: (data: unknown) => data is BetterOmit<T, K>): (data: unknown) => data is T {
    return function (data: unknown): data is T {
        if (data === null || typeof data !== "object" || Array.isArray(data)) return false
        if (!hasOwnProperty(data, key)) return false
        if (!partialTypeguard(data[key])) return false
        let datacopy = structuredClone(data)
        delete datacopy[key]
        return restTypeguard(datacopy)
    }
}

/**
 * Typeguards for an object by checking a typeguard for a specific optional key. And then checking a typeguard for the object without the key. Useful for checking unions where all cases include the same key.
 * 
 * @param key The key to check.
 * @param partialTypeguard The typeguard for the value of the key if it exists.
 * @param restTypeguard The typeguard for the object without the key.
 * @returns A typeguard for the object.
 */
export function partialTypeguardOptional<T extends {}, K extends ForcedOptionalKey<T>>(key: K, partialTypeguard: (data: unknown) => data is T[K], restTypeguard: (data: unknown) => data is BetterOmit<T, K>): (data: unknown) => data is T {
    return function (data: unknown): data is T {
        if (data === null || typeof data !== "object" || Array.isArray(data)) return false
        if (!hasOwnProperty(data, key)) return true
        if (!partialTypeguard(data[key])) return false
        let datacopy = structuredClone(data)
        delete datacopy[key]
        return restTypeguard(datacopy)
    }
}