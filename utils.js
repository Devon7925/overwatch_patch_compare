/**
 * Waits for a given amount of time and then resolves.
 *
 * @param ms The amount of time to wait in milliseconds.
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Delays execution of a function until all curently executing code is finished.
 *
 * @param callback The function to call.
 */
export function delayExecution(callback) {
    setTimeout(callback, 0);
}
/**
 * Escapes a string for use in a RegExp.
 *
 * @param string The string to escape.
 * @returns The escaped string.
 */
export function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
/**
 * Returns if a KeyboardEvent would cause text in a textbox to change.
 *
 * @param event The KeyboardEvent to check.
 * @returns Whether the event would cause text in a textbox to change.
 */
export function isTextChangingEvent(event) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Escape', 'Control', 'Alt', 'Shift'].includes(event.key))
        return false;
    if (event.ctrlKey) {
        if (['Backspace', 'Delete'].includes(event.key))
            return true;
        return false;
    }
    return true;
}
/**
 * Takes an event to a InputBox and returns what the result would be if the event were to be resolved.
 *
 * @param e Either a {@link KeyboardEvent} or a {@link ClipboardEvent}.
 * @returns The result value of the textbox if the event were to be resolved.
 */
export function getNewInputValue(e) {
    if (!e.target)
        throw new Error("e.target is null");
    if (!(e.target instanceof HTMLInputElement))
        throw new Error("e.target is not an HTMLInputElement");
    let newValue = e.target.value;
    let valueArray = newValue.split('');
    const selectionStart = e.target.selectionStart !== null ? e.target.selectionStart : 0;
    const selectionEnd = e.target.selectionEnd !== null ? e.target.selectionEnd : selectionStart;
    const selectionLength = (selectionEnd - selectionStart);
    if (e instanceof KeyboardEvent) {
        if (e.ctrlKey) {
            if (e.key === 'Backspace') {
                if (selectionLength === 0 && selectionStart > 0) {
                    let wordStart = selectionStart;
                    let spaceMode = true;
                    while (wordStart > 0) {
                        if (spaceMode && valueArray[wordStart - 1] !== ' ')
                            spaceMode = false;
                        if (!spaceMode && valueArray[wordStart - 1] === ' ')
                            break;
                        wordStart--;
                    }
                    let deleteLength = selectionStart - wordStart;
                    valueArray.splice(wordStart, deleteLength);
                }
                else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            }
            else if (e.key === 'Delete') {
                if (selectionLength === 0) {
                    let wordEnd = selectionStart + 1;
                    let spaceMode = true;
                    while (wordEnd < valueArray.length) {
                        if (spaceMode && valueArray[wordEnd] !== ' ')
                            spaceMode = false;
                        if (!spaceMode && valueArray[wordEnd] === ' ')
                            break;
                        wordEnd++;
                    }
                    let deleteLength = wordEnd - selectionStart;
                    valueArray.splice(selectionStart, deleteLength);
                }
                else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            }
        }
        else {
            if (e.key === 'Backspace') {
                if (selectionLength === 0 && selectionStart > 0) {
                    valueArray.splice(selectionStart - 1, selectionLength + 1);
                }
                else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            }
            else if (e.key === 'Delete') {
                if (selectionLength === 0) {
                    valueArray.splice(selectionStart, selectionLength + 1);
                }
                else {
                    valueArray.splice(selectionStart, selectionLength);
                }
            }
            else if (!(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key))) {
                valueArray.splice(selectionStart, selectionLength, e.key);
            }
        }
    }
    else {
        if (e.clipboardData)
            valueArray.splice(selectionStart, selectionLength, e.clipboardData.getData('Text'));
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
export function deepAssign(address, value) {
    for (const k in value) {
        if (hasOwnProperty(address, k)) {
            const addressVal = address[k];
            const valueVal = value[k];
            if (valueVal === undefined)
                throw new Error(`valueVal is undefined for key ${k}`);
            if (isObject(addressVal) && isObject(valueVal)) {
                deepAssign(addressVal, valueVal);
                continue;
            }
            address[k] = valueVal;
        }
    }
}
/**
 * U Combinator (https://en.wikipedia.org/wiki/U_combinator). Applies the given function to itself.
 *
 * @param f The function to apply to itself
 * @returns The result of applying f to itself.
 */
export const U = f => f(f);
/**
 * Y Combinator (https://en.wikipedia.org/wiki/Fixed-point_combinator#Y_combinator). Takes a function that takes itself as an argument and returns something. Returns the thing that the function argument returns.
 * Used for creating anonymous recursive functions.
 */
export const Y = U((h) => (f) => f((x) => h(h)(f)(x)));
/**
 * Typeguards for whether the given object is an array where all the elements match the given typeguard.
 *
 * @typeparam T The type to check the elements of the array for.
 * @param typeguard The typeguard to check the elements of the array against.
 * @param data The array to check.
 * @returns Whether the array is an array of all the given type.
 */
export function isArrayMatchingTypeguard(typeguard) {
    return (data) => {
        if (!Array.isArray(data))
            return false;
        return data.every(typeguard);
    };
}
/**
 * Typeguards for a given object to have values all of the type for the given typeguard.
 *
 * @param typeguard The typeguard to check the values of the object against.
 * @returns A typeguard for the object to have values all of the type for the given typeguard.
 */
export function isObjectWithValues(typeguard) {
    return (data) => {
        if (!isObject(data))
            return false;
        return Object.values(data).every(typeguard);
    };
}
/**
 * Typeguards for whether the given object matches one of the given typeguards.
 *
 * @param aTypeGuard The first typeguard to check the object against.
 * @param bTypeGuard The second typeguard to check the object against.
 * @returns Whether the object matches one of the given typeguards.
 */
export function eitherType(aTypeGuard, bTypeGuard) {
    return (x) => {
        return aTypeGuard(x) || bTypeGuard(x);
    };
}
/**
 * Returns a typeguard for a tuple given typeguards for each of it's elements.
 *
 * @param typeguards The typeguards for each of the tuple's elements.
 * @returns A typeguard for the tuple.
 */
export function isTupleMatchingTypeguards(...typeguards) {
    return (data) => {
        if (!Array.isArray(data))
            return false;
        if (data.length !== typeguards.length)
            return false;
        for (let i = 0; i < typeguards.length; i++) {
            const typeguard = typeguards[i];
            if (typeguard === undefined)
                throw new Error("typeguard is undefined");
            if (!typeguard(data[i]))
                return false;
        }
        return true;
    };
}
/**
 * Generates a typeguard for a tuple given a typeguard for its first element and a typeguard for the rest of its elements. Useful for generating typeguards for tuples of varying length where the first element(s) have a different type(ex. [string, ...number]).
 *
 * @param startTypeguard The typeguard to check the start of the tuple against.
 * @param restTypeguard The typeguard to check the rest of the tuple against.
 * @returns A typeguard for the tuple.
 */
export function isSplitTupleMatchingTypeguards(startTypeguard, restTypeguard) {
    return (data) => {
        if (!Array.isArray(data))
            return false;
        if (data.length === 0)
            return false;
        if (!startTypeguard(data[0]))
            return false;
        if (!restTypeguard(data.slice(1)))
            return false;
        return true;
    };
}
/**
 * Typeguards for whether the given value is null.
 *
 * @param value The value to check.
 * @returns Whether the value is null.
 */
export function isNull(value) {
    return value === null;
}
/**
 * Typeguards for whether the given value is never. Always returns false.
 *
 * @param value The value to check.
 * @returns Whether the value is never.
 */
export function isNever(_) {
    return false;
}
/**
 * Typeguards for whether the given value is undefined.
 *
 * @param value The value to check.
 * @returns Whether the value is undefined.
 */
export function isUndefined(value) {
    return value === undefined;
}
/**
 * Typeguards for whether the given value is a boolean.
 *
 * @param value The value to check.
 * @returns Whether the value is a boolean.
 */
export function isBoolean(value) {
    return typeof value === "boolean";
}
/**
 * Typeguards for whether the given value is a number.
 *
 * @param value The value to check.
 * @returns Whether the value is a number.
 */
export function isNumber(value) {
    return typeof value === "number";
}
/**
 * Typeguards for whether the given value is a string.
 *
 * @param value The value to check.
 * @returns Whether the value is a string.
 */
export function isString(value) {
    return typeof value === "string";
}
/**
 * Returns a typeguard for whether the given value is the given string literal
 *
 * @param value The value to check.
 * @returns A typeguard for whether the value is the given string literal.
 */
export function isLiteral(literal) {
    return (value) => value === literal;
}
/**
 * Typeguards for whether the given value is an object and not an array.
 *
 * @param value The value to check.
 * @returns Whether the value is an object and not an array.
 */
export function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
 * Typeguards for whether the given value is a {@link Element}
 *
 * @param data The data to check.
 * @returns Whether the data is a {@link Element}
 */
export function isElement(data) {
    return data instanceof Element;
}
let parser;
/**
 * Converts a html string to a {@link Element}
 *
 * @param string The html string to convert.
 * @returns The {@link Element} that was created from the html string.
 */
export function stringToElement(string) {
    if (!parser)
        parser = new DOMParser();
    const children = parser.parseFromString(string, 'text/html').body.children;
    if (!children || !children[0])
        throw new Error("Invalid HTML");
    return children[0];
}
export function hasOwnProperty(obj, prop) {
    return obj.hasOwnProperty(prop);
}
/**
 * Returns a function that can check for required properties of the given type on an object.
 *
 * @typeparam T The type to check
 * @returns A function that can check for required properties of the given type on an object.
 */
export function checkRequiredProperty() {
    return function (obj, prop, typeGuard) {
        if (!hasOwnProperty(obj, prop))
            return false;
        return typeGuard ? typeGuard(obj[prop]) : true;
    };
}
/**
 * Returns a function that can check for optional properties of the given type on an object.
 *
 * @typeparam T The type to check
 * @returns A function that can check for optional properties of the given type on an object.
 */
export function checkOptionalProperty() {
    return function (obj, prop, typeGuard) {
        if (!hasOwnProperty(obj, prop))
            return true;
        return typeGuard ? typeGuard(obj[prop]) : true;
    };
}
/**
 * Creates a automatic typeguard for the given type.
 *
 * @param typeGuardRequiredKeys An object from required keys on the type to the typeguard for that key.
 * @param typeGuardOptionalKeys An object from optional keys on the type to the typeguard for that key.
 * @returns A typeguard for the given type.
 */
export function autoTypeguard(typeGuardRequiredKeys, typeGuardOptionalKeys) {
    return function (data) {
        if (data === null || data === undefined || typeof data !== "object" || Array.isArray(data))
            return false;
        for (const key in typeGuardRequiredKeys) {
            const requiredKey = key;
            if (!checkRequiredProperty()(data, requiredKey, typeGuardRequiredKeys[requiredKey]))
                return false;
        }
        for (const key in typeGuardOptionalKeys) {
            const optionalKey = key;
            if (!checkOptionalProperty()(data, optionalKey, typeGuardOptionalKeys[optionalKey]))
                return false;
        }
        return true;
    };
}
/**
 * Returns a function that checks an array of elements to ensure it matches all of the cases in the optional type.
 * @returns A function that returns the input if it matches the type, otherwise never(compiler error).
 */
export const arrayOfAll = () => (array) => array;
/**
 * Typeguards for whether a given key is a property of the given type.
 *
 * @param obj The object to check.
 * @param key The key to check whether it is a key of the object.
 * @returns Whether the key is a property of the object.
 */
export function isKeyOf(obj, key) {
    if (!isString(key))
        return false;
    return obj.hasOwnProperty(key);
}
export function unionTypeguard(typeguards) {
    return function (data) {
        for (const typeguard of typeguards) {
            if (typeguard(data))
                return true;
        }
        return false;
    };
}
/**
 * Typeguards for an object by checking a typeguard for a specific required key. And then checking a typeguard for the object without the key. Useful for checking unions where all cases include the same key.
 *
 * @param key The key to check.
 * @param partialTypeguard The typeguard for the value of the key.
 * @param restTypeguard The typeguard for the object without the key.
 * @returns A typeguard for the object.
 */
export function partialTypeguard(key, partialTypeguard, restTypeguard) {
    return function (data) {
        if (data === null || typeof data !== "object" || Array.isArray(data))
            return false;
        if (!hasOwnProperty(data, key))
            return false;
        if (!partialTypeguard(data[key]))
            return false;
        let datacopy = structuredClone(data);
        delete datacopy[key];
        return restTypeguard(datacopy);
    };
}
/**
 * Typeguards for an object by checking a typeguard for a specific optional key. And then checking a typeguard for the object without the key. Useful for checking unions where all cases include the same key.
 *
 * @param key The key to check.
 * @param partialTypeguard The typeguard for the value of the key if it exists.
 * @param restTypeguard The typeguard for the object without the key.
 * @returns A typeguard for the object.
 */
export function partialTypeguardOptional(key, partialTypeguard, restTypeguard) {
    return function (data) {
        if (data === null || typeof data !== "object" || Array.isArray(data))
            return false;
        if (!hasOwnProperty(data, key))
            return true;
        if (!partialTypeguard(data[key]))
            return false;
        let datacopy = structuredClone(data);
        delete datacopy[key];
        return restTypeguard(datacopy);
    };
}
