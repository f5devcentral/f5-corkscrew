"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathValueFromKey = exports.deepGet = exports.getPathOfValue = exports.setNestedKey = exports.simpleMergeDeep = exports.deepMergeObj = exports.nestedObjValue = exports.cleanObject = void 0;
const deepmerge_1 = __importDefault(require("deepmerge"));
const logger_1 = __importDefault(require("../logger"));
/**
 * recursively removes empty value/objects/arrays
 * @param obj
 */
function cleanObject(obj) {
    // This needs to be fully tested to confirm full functionality,
    //   but this helped accmoplish what I needed at this time
    cleanEmpty(obj);
    clearEmpties(obj);
    // following is also a way to remove empty values from stuff
    //  but can be process intensive
    function removeUndefined(json) {
        return JSON.parse(JSON.stringify(json));
    }
}
exports.cleanObject = cleanObject;
/**
 * recursively removes empty values from objects/arrays
 * @param obj
 */
function cleanEmpty(obj) {
    if (Array.isArray(obj)) {
        return obj
            .map(v => (v && typeof v === 'object') ? cleanEmpty(v) : v)
            .filter(v => !(v == null));
    }
    else {
        return Object.entries(obj)
            .map(([k, v]) => [k, v && typeof v === 'object' ? cleanEmpty(v) : v])
            .reduce((a, [k, v]) => (v == null ? a : (a[k] = v, a)), {});
    }
}
/**
 * recursively removes empty objects
 * @param obj
 */
function clearEmpties(obj) {
    for (const k in obj) {
        if (!obj[k] || typeof obj[k] !== "object") {
            continue; // If null or not an object, skip to the next iteration
        }
        // The property is an object
        clearEmpties(obj[k]); // <-- Make a recursive call on the nested object
        if (Object.keys(obj[k]).length === 0) {
            delete obj[k]; // The object had no properties, so delete that property
        }
    }
}
/**
 * builds multi-level nested objects with data
 * https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
 * @param fields array of nested object params
 * @param value value of the inner most object param value
 */
function nestedObjValue(fields, value) {
    const reducer = (acc, item, index, arr) => ({ [item]: index + 1 < arr.length ? acc : value });
    return fields.reduceRight(reducer, {});
}
exports.nestedObjValue = nestedObjValue;
/**
* provides deep merge of multi-level objects
*  subsequent items in list overwrite conflicting entries
* @param objs list of objects to merge
 */
function deepMergeObj(target, source) {
    return deepmerge_1.default(target, source, { clone: false });
}
exports.deepMergeObj = deepMergeObj;
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
/**
 * Deep merge two objects.
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 * @param target
 * @param ...sources
 */
function simpleMergeDeep(target, ...sources) {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });
                simpleMergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return simpleMergeDeep(target, ...sources);
}
exports.simpleMergeDeep = simpleMergeDeep;
/**
 * this will overwrite existing data
 * @param obj
 * @param path
 * @param value
 */
function setNestedKey(obj, path, value) {
    /**
     * https://stackoverflow.com/questions/18936915/dynamically-set-property-of-nested-object
     */
    if (path.length === 1) {
        obj[path[0]] = value;
        return;
    }
    return setNestedKey(obj[path[0]], path.slice(1), value);
}
exports.setNestedKey = setNestedKey;
/**
 * deep search object for value using regex
 * @param vtf value to find (regex capable)
 * @param obj to search
 * @param return array of path steps
 */
function getPathOfValue(vtf, obj) {
    /**
     * https://stackoverflow.com/questions/53543303/find-a-full-object-path-to-a-given-value-with-javascript
     */
    // function maybeMatch(reg, str) {
    //     var m = str.match(reg);
    //     return m ? m[0] : null;
    // }
    // if (vtf instanceof RegExp) vtf = maybeMatch(vtf, str); 
    const regex = new RegExp(vtf);
    return find(obj);
    function find(obj, item) {
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === "object") {
                const result = find(obj[key], item);
                if (result) {
                    result.unshift(key);
                    return result;
                }
            }
            else if (regex.test(obj[key])) {
                return [key];
            }
        }
    }
}
exports.getPathOfValue = getPathOfValue;
/**
 * gets value by deep path in array form
 *  (ex. ['ltm','monitor','http'])
 *
 * *** paths have to be in array form since names can have '.' in them ***
 *
 * @param path to fetch value
 * @param obj containing path/value to get
 */
function deepGet(path, obj) {
    /**
     * this seems to be the best way to GET a value (by far)
     *
     * https://stackoverflow.com/questions/6393943/convert-javascript-string-in-dot-notation-into-an-object-reference
     */
    const xxx = index(obj, path);
    return xxx;
    function index(obj, is, value) {
        if (typeof is == 'string')
            return index(obj, is.split('.'), value);
        else if (is.length == 1 && value !== undefined)
            return obj[is[0]] = value;
        else if (is.length == 0)
            return obj;
        else
            return index(obj[is[0]], is.slice(1), value);
    }
}
exports.deepGet = deepGet;
/**
 * searches object for key
 *
 * *** todo: update path to be array, not dot(.) notation
 *  - pretty sure this is complete...
 *
 * @param obj to search
 * @param key to find
 * @param return [{ path: string, key: string, value: string }]
 */
function pathValueFromKey(obj, key) {
    const results = [];
    const objType = typeof obj;
    if (objType !== "object") {
        logger_1.default.error(`findValueFromKey function expected object, got: ${objType}`);
        return;
    }
    /**
     * iterate through json tree looking for key match
     */
    function findKey(obj, key, path) {
        /**
         * if the current object we are on has the key we are looking for,
         * push result details
         *
         */
        if (obj.hasOwnProperty(key)) {
            results.push({
                path,
                key,
                value: obj[key]
            });
        }
        /**
         * append path as we iterate
         */
        path = `${path ? path + "." : ""}`;
        for (const k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (obj[k] && typeof obj[k] === "object") {
                    findKey(obj[k], key, `${path}${k}`);
                }
            }
        }
    }
    // call functoin to start iteration
    findKey(obj, key);
    if (results.length = 1) {
        // return array of results
        return results[0];
    }
    else {
        logger_1.default.error(`pathValueFromKey found more than one match, returning first, full list: ${results}`);
        return results[0];
    }
}
exports.pathValueFromKey = pathValueFromKey;
//# sourceMappingURL=objects.js.map