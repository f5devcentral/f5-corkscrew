import balanced from 'balanced-match';
import logger from "./logger";

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


/**
 * 
 * @param cfg child config to parse
 * @param obj used to iterate
 */
export function tmosChildToObj(cfg: string, obj?: unknown): unknown {

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

        const blncd = balanced('{', '}', cfg);
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
                const rebuiltObj = `${name2} {${body}}`
                cfg = cfg.replace(rebuiltObj, '');
                obj[name2] = body;

            } else if (body.trim().includes('\n')) {

                //regex single-line key-value pairs
                const singleLineKVpairsRegex = /([\w-]+) (.+)/g
                const childKVpair = cfg.match(singleLineKVpairsRegex);
                if (childKVpair) {
                    childKVpair.forEach(el2 => {
                        // remove items as we convert them
                        cfg = cfg.replace(el2, '')
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
            } else if (body.trim().includes(' ')) {

                const keyVal = body.split(' ')
                obj[keyVal[0]] = keyVal[1];
                cfg = cfg.replace(body, '');

            } else {
                // no line returns, split on spaces return array
                const arr1 = body.trim().split(' ')
                obj[name2] = arr1;
                const rebuiltObj = `${name2} {${body}}`
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

    const singleLineKVpairsRegex = /([\w-]+) (.+)/g
    const childKVpair = cfg.match(singleLineKVpairsRegex);
    if (childKVpair) {
        childKVpair.forEach(el2 => {
            // remove items as we convert them
            cfg = cfg.replace(el2, '')
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
    const regex = new RegExp(/\S/);     // any non-white space characters
    if (regex.test(cfg)) {
        logger.error('parsing child object has leftover config:', cfg)
        logger.error('parsing child object original config:', startingCfg);
    }
    return obj;
}