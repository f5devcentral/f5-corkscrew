/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */


import * as _ from 'lodash';
import { EOL } from 'os'
// import { add, forEach } from 'lodash';
// import { lodas} from 'lodash'
import { object as _obj } from 'lodash/fp/object';



interface bigipObj {
    [key: string]: unknown
}

/**
 * Class to consume bigip.conf
 * 
 */
export class LTMconfig {
    public bigipConf: string;
    /**
     * simple array of each bigip.conf parent object
     */
    public configAsSingleLevelArray: string[];
    /**
     * object form of bigip.conf
     *  key = full object name, value = body
     */
    public configSingleLevelObjects: bigipObj = {};  // item name as key, item body as value
    public configArrayOfSingleLevelObjects = [];
    /**
     * nested objects - consolidated parant object keys like ltm/apm/sys/...
     */
    public configMultiLevelObjects: goodBigipObj = {};
    public tmosVersion: number;

    // public apps = [];
    // public apps2 = [];
    private tmosVersionReg = /#TMSH-VERSION: (\d.+)\n/;
    /**
     * if match, returns object name in [1] object value in [2]
     */
    private parentNameValueRegex = /([ \w\-\/.]+) {([\s\S]+?\n| )}/;
    // private regex1 = /[ \w\-\/.]+{([\s\S]+?)\n}\n/g;
    // private regFull = /(apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom) [ \w\-\/.]+({.*}\n|{[\s\S]+?\n}\n)/g;
    // private regexNoCG = /[ \w\-\/.]+{[\s\S]+?\n}\n/g;
    private regexSingleline = '(apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom)';

    //commented/multi-line regex
    private regexTmosParentObjects = multilineRegExp([
        // parent level object beginnings with trailing space
        /(apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom) /,  
        // include any child object definitions and object name
        /[ \w\-\/.]+/,
        // capture single line data or everything till "\n}\n"
        /({.*}\n|{[\s\S]+?\n}\n)/,
        // look forward to capture the last "}" before the next parent item name
        /(?=(apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom))/   
    ], 'g');

    /**
     * 
     * @param config bigip.conf as string
     */
    constructor(config: string) {
        config = standardizeLineReturns(config);    
        this.bigipConf = config; // assign orginal config for later use
        this.tmosVersion = this.getTMOSversion(config);  // get tmos version
        this.parse(config);
        console.log('log');
    }

    

    /**
     * parse bigip.conf into parent objects
     * @param config bigip.conf
     */
    private parse(config: string) {
        // parse the major config pieces
        this.configAsSingleLevelArray = [...config.match(this.regexTmosParentObjects)];

        this.configAsSingleLevelArray.forEach(el => {
            const name = el.match(this.parentNameValueRegex);

            if (name && name.length === 3) {
                this.configSingleLevelObjects[name[1]] = name[2];

                // this.configArrayOfSingleLevelObjects.push
                this.configArrayOfSingleLevelObjects.push({name: name[1], config: name[2]})

                // split extracted name element by spaces
                const names = name[1].split(' ');
                // create new nested objects with each of the names, assigning value on inner-most
                const newObj = nestedObjValue(names, name[2]);
                // merge new object with existing object
                this.configMultiLevelObjects = _.merge(this.configMultiLevelObjects, newObj)
            }
        });
    }

    apps() {
        /**
         * loop through list of viruals
         *  build config for each
         */
        // eslint-disable-next-line prefer-const
        let apps = [];
        let apps2 = [];
        const i = this.configMultiLevelObjects.ltm.virtual;
        for (const [key, value] of Object.entries(i)) {
            // x = _.merge(x, {name: k, config: `${k} {${v}}`});
            const appRefs = /\/\w+\/[/\w.-]+/mg

            apps.push({name: key, config: `${key} {${value}}`});

            const vsConfig = this.getVsConfig(key, value);


            // /**
            //  * find all the referece to other config objects in the VS config
            //  * ex. /Common/app1_tcp443_pool
            //  */
            // const appConfigLines = value.match(appRefs);

            // /**
            //  * loop thorugh list and extract supporting config
            //  */
            // let addConfig = [];
            // appConfigLines.forEach(el => {
            //     /**
            //      * build new regex
            //      * run regex against full config
            //      * filter responses?
            //      * 
            //      */
            //     const one = findVal(this.configMultiLevelObjects, el)
            //     // addConfig.push()
            //     const fasdf = 4;
            //     this.configArrayOfSingleLevelObjects.forEach(el2 => {

            //         if (el2.name.includes(el)) {
            //             addConfig.push(el2.config);
            //         }
            //     });
            // });
            // const ttmp = addConfig.join();
            // value.concat(ttmp);
            apps2.push({name: key, config: vsConfig});

            const f = 2;
        }
        return apps2;
    }

    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    private getTMOSversion(config: string) {
        const version = config.match(this.tmosVersionReg);
        if(version) {
            //found tmos version
            return parseFloat(version[1]);
        } else {
            // tmos version not detected -> meaning this probably isn't a bigip.conf
            throw new Error('tmos version not detected -> meaning this probably is not a bigip.conf')
        }
    }

    /**
     * scans vs config, and discovers child configs
     * @param vsName virtual server name
     * @param vsConfig virtual server tmos config body 
     */
    private getVsConfig(vsName: string, vsConfig: string) {
        /**
         * take in vs config body
         * extract: 
         *  - profiles
         *  - pool
         *  - rules
         *  - soure-address-translation
         *  - persist
         *  - fallback-persistence
         *  - policies
         */

        /**
         * get pool, but not snat pool...
         */
        const poolRegex = /(?<!source-address-translation {\n\s+)pool (.+?)\n/;
        const profilesRegex = /profiles {([\s\S]+?)\n    }\n/;
        const rulesRegex = /rules {([\s\S]+?)\n    }\n/;
        const snatRegex = /source-address-translation {([\s\S]+?)\n    }\n/;
        const ltpPoliciesRegex = /policies {([\s\S]+?)\n    }\n/;
        const persistRegex = /persist {([\s\S]+?)\n    }\n/;

        const pool = vsConfig.match(poolRegex);
        const profiles = vsConfig.match(profilesRegex);
        const rules = vsConfig.match(rulesRegex);
        const snat = vsConfig.match(snatRegex);
        const ltPolicies = vsConfig.match(ltpPoliciesRegex);
        const persistence = vsConfig.match(persistRegex);

        let fullConfig = `${vsName} {${vsConfig}}`
        if(pool) {
            fullConfig += '\n';
            const x = this.digPoolConfig(pool[1]);
            fullConfig += x;
            fullConfig += '\n';
        }
        // const e = 0;
        return fullConfig;
    }

    /**
     * get full pool config and supporting node/monitor configs
     * @param poolName 
     */
    private digPoolConfig(poolName: string) {
        // lookup pool config using name
            // get pool config
            // extract nodes?
            // extract monitors
        const membersRegex = /members {([\s\S]+?)\n    }\n/;
        const nodesFromMembersRegex = /(\/\w+\/.+?)(?=:)/g;
        const monitorRegex = /monitor {([\s\S]+?)\n    }\n/;
        let config = '';
        config += '\n';
        this.configAsSingleLevelArray.forEach((el: string) => {
            if(el.startsWith(`ltm pool ${poolName}`)) {
                // config.concat(el);
                config += el;
                let members = el.match(membersRegex);
                let monitors = el.match(monitorRegex);
                if(members && members[1]){
                    // dig node information from members
                    const nodeNames = members[1].match(nodesFromMembersRegex);
                    nodeNames.forEach( name => {
                        this.configAsSingleLevelArray.forEach((el: string) => {
                            if (el.startsWith(`ltm node ${name}`)) {
                                config += '\n';
                                config += el;
                            }
                        })
                    })
                    // config += '*** pool member nodes here ***'
                }
                if(monitors) {
                    //dig monitor configs like pool members above
                }
            }
        });
        return config;
    }
}



/**
 * https://stackoverflow.com/questions/40603913/search-recursively-for-value-in-object-by-property-name/40604103
 * @param object to search
 * @param key to find
 */
function findVal(object, key) {
    let value;
    Object.keys(object).some(function(k) {
        if (k === key) {
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findVal(object[k], key);
            return value !== undefined;
        }
    });
    return value;
}

/**
 * used to produce final regex from multiline/commented regex
 * @param regs regex pieces in array
 * @param opts regex options (g/m/s/i/y/u/s)
 */
function multilineRegExp(regs, opts: string) {
    return new RegExp(regs.map(reg => reg.source).join(''), opts);
}


/**
 * builds multi-level nested objects with data
 * https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
 * @param fields array of nested object params
 * @param value value of the inner most object param value
 */
const nestedObjValue = (fields, value) => {
    const reducer = (acc, item, index, arr) => ({ [item]: index + 1 < arr.length ? acc : value });
    return fields.reduceRight(reducer, {});
};





/**
 * standardize line endings to linux
 * "\r\n" and "\r" to "\n"
 * @param config config as string
 * @returns config
 */
function standardizeLineReturns (config: string){
    const regex = /(\r\n|\r)/g;
    return config.replace(regex, "\n");
}

/**
 * Reverse string
 * @param str string to reverse
 */
function reverse(str: string){
    return [...str].reverse().join('');
  }



type goodBigipObj = {
    ltm?: {
        virtual?: string;
        pool?: string;
        node?: any;
        monitor?: any;
        profile?: any;
        rule?: any;
        persistence?: any;
    },
    apm?: any;
    net?: any;
}