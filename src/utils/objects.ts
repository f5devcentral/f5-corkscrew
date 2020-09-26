/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import deepmerge from 'deepmerge'

import logger from "../logger";
import { BigipConfObj } from "../models";


type RetObj = {
    path?: string,
    key?: string,
    value?: string
}


/**
 * provides deep merge of multi-level objects
 *  subsequent items in list overwrite conflicting entries
 * @param objs list of objects to merge
 */
export function deepMergeObj(objs: unknown[]) {
    return deepmerge.all(objs)
}

/**
 * 
 * @param cfg child config to parse
 * @param obj used to iterate
 */
export function tmosChildToObj (cfg: string, obj?) {

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

    obj = obj ? obj : {};
    
    const childObjectsRegex = /([ \w\-.]+) {([\s\S]+?)\n    }\n/g
    const childObjects = cfg.match(childObjectsRegex);
    
    /**
     * loop through each of the objects
     *  remove the match, check if "{}" in match
     *  If bracket, re-iterate tmosChildtoObj to convert to child object
     *  if no brackets, split each new line
     *      split each new line
     *          if two elements in array, set key/value pair
     *          if >2 el in array, set value as array
     */
    
    
    // parsing child objects and removing
    if (childObjects) {
        childObjects.forEach(el => {
            if(el.includes('{')) {
                const found = 'anotherObject'
            }
        });
    }
    
    
    const singleLineKVpairsRegex = /([\w-]+) ([\/\w.:-]+)/g
    const childKVpair = cfg.match(singleLineKVpairsRegex);

    if (childKVpair) {
        childKVpair.forEach(el2 => {

            // remove the items we are taking out of the config
            cfg.replace(el2, '') 
            const [key, val] = el2.split(' ');
            // const nnn = val;
            obj[key] = val;
        });
    }

    if(cfg.match(/\s/g)) {
        return obj;
    } else {
        tmosChildToObj(cfg, obj);
    }

    // split on lines
    
}


/**
 * searches object for key
 * 
 * @param obj to search
 * @param key to find
 * @param return [{ path: string, key: string, value: string }]
 */
export function pathValueFromKey(obj: BigipConfObj, key: string): RetObj {
    
    const results: RetObj[] = [];

    const objType = typeof obj;
    if (objType !== "object") {
        logger.error(`findValueFromKey function expected object, got: ${objType}`);
        return;
    }
    
    /**
     * iterate through json tree looking for key match
     */
    function findKey(obj: BigipConfObj, key: string, path?: string) {

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
            })
        }

        /**
         * append path as we iterate
         */
        path = `${path ? path + "." : ""}`;
        
        for (const k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (obj[k] && typeof obj[k] === "object") {
                    findKey( obj[k], key, `${path}${k}` );
                }
            }
        }
    }

    // call functoin to start iteration
    findKey(obj, key)

    if (results.length = 1) {
        // return array of results
        return results[0];
    } else {
        logger.error(`pathValueFromKey found more than one match, returning first, full list: ${results}`)
        return results[0]; 
    }
    
}


/**
 * search object for nested value, return path to value
 * 
 * Initial goal for this is to find all the final children
 *  values that have not been coverted to json
 * if they include a line return "\n", crawl them till they
 *  are converted to json
 * 
 * Other than irules/datagroups, everything shouldn't have a LR
 * 
 * @param obj 
 * @param val 
 */
export function getPathFromValue(obj: any, val: string) {
    // asdf
}


/**
 * *** Gets value by key, don't really need this since 
 *  we should be using pathValueFromKey
 * 
 * https://stackoverflow.com/questions/40603913/search-recursively-for-value-in-object-by-property-name/40604103
 * 
 * if we go the lodash route, this can be replaces with _.get
 * 
 * @param object to search
 * @param key to find
 */
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


export function key1() {

    // ################################################
    // https://stackoverflow.com/questions/25403781/how-to-get-the-path-from-javascript-object-from-key-and-value

    // function path(c, name, v, currentPath?, t?){
    //     // let currentPath = currentPath || "root";
    //     if(!currentPath) {
    //         currentPath = "root"
    //     }

    //     if (!t) {
    //         t = '-'
    //     }

    //     for(const i in c){
    //       if(i == name && c[i] == v){
    //         t = currentPath;
    //       }
    //       else if(typeof c[i] == "object"){
    //         return path(c[i], name, v, currentPath + "." + i);
    //       }
    //     }

    //     return t + "." + name;
    // };

    // const aaa = path(testObj, 'b');

    // const bbb = aaa;

    // ############################################



    // const aaa = _ldd.findDeep(obj, );

    // const bbb = _ldd.index(testObj);
    // const ddd = deepdash (testObj);
    // let breakLoop = false;

    // const bbb = deepDs.index(testObj)

    // deepDs.eachDeep({ id: 1, children: [ {id: 2, children: [ { id: 3, children: []}]}]},
    //     (v,k, parent, context) => {
    //     if(breakLoop || v == 2) {
    //       breakLoop = true;
    //       return false;
    //     }
    //     console.log(k);
    //   });

    // const ccc = bbb;
}




/**
 * test function to find obj path
 * https://stackoverflow.com/questions/25403781/how-to-get-the-path-from-javascript-object-from-key-and-value
 */
export function findPath1(): void {
    
    const testObj = { a: [1, 2, { o: 5 }, 7], b: [0, [{ bb: [0, "str"] }]] };

    function findPath(a, obj) {
        function iter(o, p) {
            return Object.keys(o).some(function (k) {
                result = p.concat(Array.isArray(o) ? +k : k);
                return o[k] === a || o[k] && typeof o[k] === 'object' && iter(o[k], result);
            });
        }
        let result;
        return iter(obj, []) && result || undefined;
    }


    console.log(findPath(5, testObj));     // ["a", 2, "o"]
    console.log(findPath("str", testObj)); // ["b", 1, 0, "bb", 1]
    console.log(findPath(42, testObj));    // undefined
}


// ############################################################

/**
 * attempt to flatten object to make searching easier
 *  not really sure this is worth it
 */
export function flattenD2() {
    const flattendObj = {};
    const flattenObject = (obj, keyName) => {
        Object.keys(obj).forEach(key => {
            const newKey = `${keyName}_${key}`
            if (typeof obj[key] === "object") {
                // calling the function again
                flattenObject(obj[key], newKey);
            } else {
                flattendObj[newKey] = obj[key];
            }
        });
    };
    console.log(flattendObj);

}




// #########################################################
//  https://www.npmjs.com/package/flat
//  https://github.com/hughsk/flat/blob/90f7397659e5cee55ec96874903aae143cd92d91/index.js#L16

export function objSearch1(key?: string, inObj?: any): void {

    const testObj = { a: [1, 2, { o: 5 }, 7], b: [0, [{ bb: [0, "str"] }]] };

    inObj = testObj;

    function keyIdentity(key) {
        return key
    }

    function isBuffer(obj) {
        return obj &&
            obj.constructor &&
            (typeof obj.constructor.isBuffer === 'function') &&
            obj.constructor.isBuffer(obj)
    }

    const flatA = flatten(inObj);
    const flatB = flatA;

    function flatten(target, opts?) {
        opts = opts || {}

        const delimiter = opts.delimiter || '.'
        const maxDepth = opts.maxDepth
        const transformKey = opts.transformKey || keyIdentity
        const output = {}

        function step(object, prev?, currentDepth?) {
            currentDepth = currentDepth || 1
            Object.keys(object).forEach(function (key) {
                const value = object[key]
                const isarray = opts.safe && Array.isArray(value)
                const type = Object.prototype.toString.call(value)
                const isbuffer = isBuffer(value)
                const isobject = (
                    type === '[object Object]' ||
                    type === '[object Array]'
                )

                const newKey = prev
                    ? prev + delimiter + transformKey(key)
                    : transformKey(key)

                if (!isarray && !isbuffer && isobject && Object.keys(value).length &&
                    (!opts.maxDepth || currentDepth < maxDepth)) {
                    return step(value, newKey, currentDepth + 1)
                }

                output[newKey] = value
            })
        }

        step(target);

        return output
    }
}


export function findPathOfValue() {

    const foundName = 'value to find'
    const aaa = findPath(foundName, this.configMultiLevelObjects.ltm.monitor);
    
    if (aaa) {
        console.log(aaa);
        const bbb = aaa;
    }

    function findPath(a, obj) {

        let result;

        function iter(o, p) {

            return Object.keys(o).some(function (k) {
                result = p.concat(Array.isArray(o) ? +k : k);
            
                return o[k] === a || o[k] && typeof o[k] === 'object' && iter(o[k], result);
            });
        }


        const xxxA =  iter(obj, []) && result
        const xxxB = xxxA || undefined;
        
        return xxxB;
    }
}