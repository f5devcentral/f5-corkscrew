"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathValueFromKey = exports.deepGet = exports.getPathOfValue = exports.setNestedKey = exports.simpleMergeDeep = exports.tmosChildToObj = exports.deepMergeObj = exports.nestedObjValue = void 0;
const deepmerge_1 = __importDefault(require("deepmerge"));
const logger_1 = __importDefault(require("../logger"));
const balanced_match_1 = __importDefault(require("balanced-match"));
/**
 * builds multi-level nested objects with data
 * https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
 * @param fields array of nested object params
 * @param value value of the inner most object param value
 */
exports.nestedObjValue = (fields, value) => {
    const reducer = (acc, item, index, arr) => ({ [item]: index + 1 < arr.length ? acc : value });
    return fields.reduceRight(reducer, {});
};
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
 *
 * @param cfg child config to parse
 * @param obj used to iterate
 */
function tmosChildToObj(cfg, obj) {
    /**
     * input tmos parent object body
     *  (ex. ltm virtual { <...everything_here...> })
     *
     * 1. capture single line 'key': 'value' pairs
     *      (ex 'destination /Common/192.168.1.51:8443')
     * 2. capture lists
     *      (ex )
     *
     */
    // used for iteration in the future
    obj = obj ? obj : {};
    const startingCfg = cfg;
    /**
     * loop through each of the objects
     *  remove the match, check if "{}" in match
     *  If bracket, re-iterate tmosChildtoObj to convert to child object
     *  if no brackets, split each new line
     *      split each new line
     *          if two elements in array, set key/value pair
     *          if >2 el in array, set value as array
     */
    // while this part of the config has brackets...
    while (/{/.test(cfg)) {
        const blncd = balanced_match_1.default('{', '}', cfg);
        if (blncd) {
            // get line up to first '{'
            const name = blncd.pre;
            const name2 = name.split(/\n/).pop().trim();
            const body = blncd.body;
            /**
             * does body include:
             *  if {} = means it's another object
             *
             */
            const xx = body.trim().includes('\n');
            if (body.includes('{') || body === ' ') {
                //  it's a nested object, put in body for next round
                const rebuiltObj = `${name2} {${body}}`;
                cfg = cfg.replace(rebuiltObj, '');
                obj[name2] = body;
            }
            else if (body.trim().includes('\n')) {
                //regex single-line key-value pairs
                const singleLineKVpairsRegex = /([\w-]+) (.+)/g;
                const childKVpair = cfg.match(singleLineKVpairsRegex);
                if (childKVpair) {
                    childKVpair.forEach(el2 => {
                        // remove items as we convert them
                        cfg = cfg.replace(el2, '');
                        const [key, val] = el2.split(' ');
                        obj[key] = val;
                    });
                }
                // // split on line returns
                // const body2 = body.split('\n');
                // // check each line for spaces
                // body2.forEach(el => {
                //     const line = el.split(' ');
                //     if (line.length > 1) {
                //     }
                // });
            }
            else if (body.trim().includes(' ')) {
                const keyVal = body.split(' ');
                obj[keyVal[0]] = keyVal[1];
                cfg = cfg.replace(body, '');
            }
            else {
                // no line returns, split on spaces return array
                const arr1 = body.trim().split(' ');
                obj[name2] = arr1;
                const rebuiltObj = `${name2} {${body}}`;
                cfg = cfg.replace(rebuiltObj, '');
            }
            // const cfg2 = cfg;
        }
    }
    // const childObjectsRegex = /([\w\-.]+) {\n([\s\S]+?)\n    }/
    // const childObjects = cfg.match(childObjectsRegex);
    // // parsing child objects and removing
    // if (childObjects && childObjects.length === 3) {
    //     childObjects.forEach(el => {
    //         // if(el.includes('{')) {
    //         //     // const objName = el.match(/\s([\w\-.]+) {/)[1]
    //         //     //     const objBody = el.match(/\s([ \w\-.]+) {\n([\s\S]+?)\n    }/)
    //         //     if (objName) {
    //         //         obj[objName] = objBody;
    //         //     }
    //         // }
    //         cfg = cfg.replace(el, '');
    //         obj[childObjects[1]] = childObjects[2]
    //     });
    // }
    // const childObjectsSLRegex = /[\/ \w\-.]+ {(.+?)}/g
    // const childObjectsSL = cfg.match(childObjectsSLRegex);
    // if(childObjectsSL) {
    //     childObjectsSL.forEach(el => {
    //         cfg = cfg.replace(el, '');
    //         const objName = el.match(/([\w\-.]+) {/)[1]
    //         obj[objName] = ''
    //     })
    // }
    const singleLineKVpairsRegex = /([\w-]+) (.+)/g;
    const childKVpair = cfg.match(singleLineKVpairsRegex);
    if (childKVpair) {
        childKVpair.forEach(el2 => {
            // remove items as we convert them
            cfg = cfg.replace(el2, '');
            const [key, val] = el2.split(' ');
            obj[key] = val;
        });
    }
    // /**
    //  * down here, we didn't detect any objects "{}",
    //  *  nor single line key: value pair (name<space>value)
    //  * it must be a list, so lets see what kind of list it is
    //  */
    // if (cfg.trim().includes('\n')) {
    //     //
    // }
    // split on lines
    const regex = new RegExp(/\S/); // any non-white space characters
    if (regex.test(cfg)) {
        logger_1.default.error('parsing child object has leftover config:', cfg);
        logger_1.default.error('parsing child object original config:', startingCfg);
    }
    return obj;
}
exports.tmosChildToObj = tmosChildToObj;
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
// /**
//  * search object for nested value, return path to value
//  * 
//  * Initial goal for this is to find all the final children
//  *  values that have not been coverted to json
//  * if they include a line return "\n", crawl them till they
//  *  are converted to json
//  * 
//  * Other than irules/datagroups, everything shouldn't have a LR
//  * 
//  * @param obj 
//  * @param val 
//  */
// export function getPathFromValue(obj: any, val: string) {
//     // asdf
// }
// /**
//  * *** Gets value by key, don't really need this since 
//  *  we should be using pathValueFromKey
//  * 
//  * https://stackoverflow.com/questions/40603913/search-recursively-for-value-in-object-by-property-name/40604103
//  * 
//  * if we go the lodash route, this can be replaces with _.get
//  * 
//  * @param object to search
//  * @param key to find
//  */
// function findVal(object, key) {
//     let value;
//     Object.keys(object).some(function(k) {
//         if (k === key) {
//             value = object[k];
//             return true;
//         }
//         if (object[k] && typeof object[k] === 'object') {
//             // const x = k;
//             // const y = object[k];
//             // const z = key;
//             value = findVal(object[k], key);
//             return value !== undefined;
//         }
//     });
//     // if(value){
//     //     return value;
//     // }
//     return value;
// }
// export function key1() {
//     // ################################################
//     // https://stackoverflow.com/questions/25403781/how-to-get-the-path-from-javascript-object-from-key-and-value
//     // function path(c, name, v, currentPath?, t?){
//     //     // let currentPath = currentPath || "root";
//     //     if(!currentPath) {
//     //         currentPath = "root"
//     //     }
//     //     if (!t) {
//     //         t = '-'
//     //     }
//     //     for(const i in c){
//     //       if(i == name && c[i] == v){
//     //         t = currentPath;
//     //       }
//     //       else if(typeof c[i] == "object"){
//     //         return path(c[i], name, v, currentPath + "." + i);
//     //       }
//     //     }
//     //     return t + "." + name;
//     // };
//     // const aaa = path(testObj, 'b');
//     // const bbb = aaa;
//     // ############################################
//     // const aaa = _ldd.findDeep(obj, );
//     // const bbb = _ldd.index(testObj);
//     // const ddd = deepdash (testObj);
//     // let breakLoop = false;
//     // const bbb = deepDs.index(testObj)
//     // deepDs.eachDeep({ id: 1, children: [ {id: 2, children: [ { id: 3, children: []}]}]},
//     //     (v,k, parent, context) => {
//     //     if(breakLoop || v == 2) {
//     //       breakLoop = true;
//     //       return false;
//     //     }
//     //     console.log(k);
//     //   });
//     // const ccc = bbb;
// }
// /**
//  * test function to find obj path
//  * https://stackoverflow.com/questions/25403781/how-to-get-the-path-from-javascript-object-from-key-and-value
//  */
// export function findPath1(): void {
//     const testObj = { a: [1, 2, { o: 5 }, 7], b: [0, [{ bb: [0, "str"] }]] };
//     function findPath(a, obj) {
//         function iter(o, p) {
//             return Object.keys(o).some(function (k) {
//                 result = p.concat(Array.isArray(o) ? +k : k);
//                 return o[k] === a || o[k] && typeof o[k] === 'object' && iter(o[k], result);
//             });
//         }
//         let result;
//         return iter(obj, []) && result || undefined;
//     }
//     console.log(findPath(5, testObj));     // ["a", 2, "o"]
//     console.log(findPath("str", testObj)); // ["b", 1, 0, "bb", 1]
//     console.log(findPath(42, testObj));    // undefined
// }
// ############################################################
// /**
//  * attempt to flatten object to make searching easier
//  *  not really sure this is worth it
//  */
// export function flattenD2() {
//     const flattendObj = {};
//     const flattenObject = (obj, keyName) => {
//         Object.keys(obj).forEach(key => {
//             const newKey = `${keyName}_${key}`
//             if (typeof obj[key] === "object") {
//                 // calling the function again
//                 flattenObject(obj[key], newKey);
//             } else {
//                 flattendObj[newKey] = obj[key];
//             }
//         });
//     };
//     console.log(flattendObj);
// }
// #########################################################
//  https://www.npmjs.com/package/flat
//  https://github.com/hughsk/flat/blob/90f7397659e5cee55ec96874903aae143cd92d91/index.js#L16
// export function objSearch1(key?: string, inObj?: any): void {
//     const testObj = { a: [1, 2, { o: 5 }, 7], b: [0, [{ bb: [0, "str"] }]] };
//     inObj = testObj;
//     function keyIdentity(key) {
//         return key
//     }
//     function isBuffer(obj) {
//         return obj &&
//             obj.constructor &&
//             (typeof obj.constructor.isBuffer === 'function') &&
//             obj.constructor.isBuffer(obj)
//     }
//     const flatA = flatten(inObj);
//     const flatB = flatA;
//     function flatten(target, opts?) {
//         opts = opts || {}
//         const delimiter = opts.delimiter || '.'
//         const maxDepth = opts.maxDepth
//         const transformKey = opts.transformKey || keyIdentity
//         const output = {}
//         function step(object, prev?, currentDepth?) {
//             currentDepth = currentDepth || 1
//             Object.keys(object).forEach(function (key) {
//                 const value = object[key]
//                 const isarray = opts.safe && Array.isArray(value)
//                 const type = Object.prototype.toString.call(value)
//                 const isbuffer = isBuffer(value)
//                 const isobject = (
//                     type === '[object Object]' ||
//                     type === '[object Array]'
//                 )
//                 const newKey = prev
//                     ? prev + delimiter + transformKey(key)
//                     : transformKey(key)
//                 if (!isarray && !isbuffer && isobject && Object.keys(value).length &&
//                     (!opts.maxDepth || currentDepth < maxDepth)) {
//                     return step(value, newKey, currentDepth + 1)
//                 }
//                 output[newKey] = value
//             })
//         }
//         step(target);
//         return output
//     }
// }
// export function findPathOfValue(val: string, obj: string) {
//     const foundName = 'value-to-find'
//     const testObj = { a: [1, 2, { o: 5 }, 7], b: [0, [{ bb: [0, "value-to-find"] }]] };
//     const treeData = [{
//         id: 1,
//         children: [{
//           id: 2
//         }]
//       }, {
//         id: 3,
//         children: [{
//           id: 4,
//           children: [{
//             id: 'value-to-find'
//           }]
//         }]
//       }]
//     const answer = [1, 'children', 0, 'children', 0, 'id'];
//     const aaa = findPath(foundName, treeData);
//     if (aaa) {
//         console.log(aaa);
//         const bbb = aaa;
//     }
//     function findPath(a, obj) {
//         let result;
//         function iter(o, p) {
//             return Object.keys(o).some(function (k) {
//                 const x = Array.isArray(o) ? +k : k
//                 result = p.concat(x);
//                 // result = p.concat(Array.isArray(o) ? +k : k);
//                 const one = o[k] === a;
//                 const two = o[k] === a || o[k]
//                 const three = typeof o[k] === 'object';
//                 return o[k] === a || o[k] && typeof o[k] === 'object' && iter(o[k], result);
//             });
//         }
//         const xxxA =  iter(obj, []) && result
//         const xxxB = xxxA || undefined;
//         return xxxB;
//     }
// }
// /**
//  * deep search object for value using regex
//  * @param vtf value to find (regex capable)
//  * @param obj to search
//  * @param return array of path steps
//  */
// export function getPathOfValue (vtf: string, obj: any) {
//     /**
//      * modified the following to support regex as value search param
//      * https://stackoverflow.com/questions/25403781/how-to-get-the-path-from-javascript-object-from-key-and-value
//      * https://jsfiddle.net/pa5gcvvx/
//      */
//     const regex = new RegExp(`${vtf}`)
//     return getPath(obj, regex);
//     function getPath(obj, value, path?) {
//         try {
//             if (typeof obj !== 'object') {
//                 return;
//             }
//         for (const key in obj) {
//             if (obj.hasOwnProperty(key)) {
//                 let newPath;
//                 let newPath2;
//                 const t = path;
//                 const v = obj[key];
//                 if (!path) {
//                     newPath = key;
//                     // newPath2.push(key);
//                 } else {
//                     newPath = path + '.' + key;
//                     // newPath2.push(key)
//                 }
//                 if (regex.test(v)) {
//                     return newPath;
//                     // return [newPath, newPath2];
//                 } else if (typeof v !== 'object') {
//                     newPath = t;
//                 }
//                 const res = getPath(v, value, newPath);
//                 if (res) {
//                     return res;
//                 }
//             }
//         }
//         } catch (e) {
//         console.error(e.message);
//         }
//     }
// }
//# sourceMappingURL=objects.js.map