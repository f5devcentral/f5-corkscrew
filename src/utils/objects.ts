/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */


// import lodash from 'lodash-es';
// import deepdash from 'deepdash-es';

import logger from "../logger";
import { BigipConfObj } from "../models";


// const _ldd = deepdash(lodash);

// import deepDs from 'deepdash-es/standalone';



// const testObj2 = {
//     obj1: {
//         obj2: {
//             data1: 213,
//             data2: "1231",
//             obj3: {
//                 data: "milf"
//             }
//         }
//     },
//     obj4: {
//         description: "toto"
//     }
// };

type RetObj = {
    path?: string,
    key?: string,
    value?: string
}


/**
 * searches object for key
 * *** need to retype the object input
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