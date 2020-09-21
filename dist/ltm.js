"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigipConfig = void 0;
const _ = __importStar(require("lodash"));
// import { EOL } from 'os'
// import { add, forEach } from 'lodash';
// import { lodas} from 'lodash'
// import { object as _obj } from 'lodash/fp/object';
const regex_1 = require("./regex");
// import regexTree from './regex'
// import TmosRegExTree from './regex';
const logger_1 = __importDefault(require("./logger"));
/**
 * Class to consume bigip.conf
 *
 */
class BigipConfig {
    /**
     *
     * @param config bigip.conf as string
     */
    constructor(config) {
        /**
         * object form of bigip.conf
         *  key = full object name, value = body
         */
        this.configSingleLevelObjects = {};
        /**
         *
         */
        this.configArrayOfSingleLevelObjects = [];
        /**
         * nested objects - consolidated parant object keys like ltm/apm/sys/...
         */
        this.configMultiLevelObjects = {};
        config = standardizeLineReturns(config);
        this.bigipConf = config; // assign orginal config for later use
        const rex = new regex_1.RegExTree(); // instantiate regex tree
        this.tmosVersion = this.getTMOSversion(config, rex.tmosVersionReg); // get tmos version
        // this.rx = rex.get();  // get regex tree
        this.rx = rex.get(this.tmosVersion);
        logger_1.default.info(`Recieved bigip.conf, version: ${this.tmosVersion}`);
        this.parse(config);
    }
    /**
     * Get processing logs
     */
    logs() {
        return logger_1.default.getLogs();
    }
    /**
     * parse bigip.conf into parent objects
     * @param config bigip.conf as string
     */
    parse(config) {
        // parse the major config pieces
        this.configAsSingleLevelArray = [...config.match(this.rx.parentObjects)];
        this.configAsSingleLevelArray.forEach(el => {
            const name = el.match(this.rx.parentNameValue);
            if (name && name.length === 3) {
                this.configSingleLevelObjects[name[1]] = name[2];
                this.configArrayOfSingleLevelObjects.push({ name: name[1], config: name[2] });
                // split extracted name element by spaces
                const names = name[1].split(' ');
                // create new nested objects with each of the names, assigning value on inner-most
                const newObj = nestedObjValue(names, name[2]);
                // merge new object with existing object ***lodash***
                this.configMultiLevelObjects = _.merge(this.configMultiLevelObjects, newObj);
                /**
                 * todo:  look into exploding each config piece to json-ify the entire config...
                 *  - this seems like it could be the same process used for parent objects
                 *      - extract each object
                 *      - split object names on spaces for nested object names
                 *      - assign values as needed
                 *      - items with out objects, get key: value assign at that object level
                 */
            }
        });
    }
    /**
     * extracts individual apps
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    apps() {
        /**
         * loop through list of viruals
         *  build config for each
         */
        // eslint-disable-next-line prefer-const
        let apps = [];
        const i = this.configMultiLevelObjects.ltm.virtual;
        for (const [key, value] of Object.entries(i)) {
            const vsConfig = this.getVsConfig(key, value);
            // const map = this.mapApp(vsConfig);
            apps.push({ name: key, config: vsConfig });
        }
        return apps;
    }
    // /**
    //  * add on app map
    //  * @param apps [{ name: <appName>, config: <appConfig> }]
    //  */
    // private mapApp(app: TmosApp[]) {
    //     // loop through list of apps and extract connection maps
    //     app.forEach( el => {
    //         // detect pool reference
    //         // detect rule references
    //         // detect ltp references
    //     })
    // }
    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    getTMOSversion(config, regex) {
        const version = config.match(regex);
        if (version) {
            //found tmos version
            return version[1];
        }
        else {
            const msg = 'tmos version not detected -> meaning this probably is not a bigip.conf';
            logger_1.default.error(msg);
            throw new Error(msg);
        }
    }
    /**
     * scans vs config, and discovers child configs
     * @param vsName virtual server name
     * @param vsConfig virtual server tmos config body
     */
    getVsConfig(vsName, vsConfig) {
        logger_1.default.info(`digging vs config for ${vsName}`);
        const rx = this.rx.vs; // get needed rx tree
        const pool = vsConfig.match(rx.pool.obj);
        const profiles = vsConfig.match(rx.profiles.obj);
        const rules = vsConfig.match(rx.rules.obj);
        const snat = vsConfig.match(rx.snat.obj);
        const ltPolicies = vsConfig.match(rx.ltPolicies.obj);
        const persistence = vsConfig.match(rx.persist.obj);
        const fallBackPersist = vsConfig.match(rx.fbPersist);
        //  exploring more efficient ways of regexing stuff
        // const rulesReg = /rules {([\s\S]+?)\n    }\n/gm;
        // const rulesReg2 = /rules {\s+(\/\w+\/[\w+\.\-]+)/gm;
        // const rules2 = vsConfig.matchAll(rulesReg2);
        const destination = vsConfig.match(rx.destination);
        // base vsMap config object
        const vsMap = {
            vsName,
            vsDest: ''
        };
        // add destination to vsMap object
        if (destination && destination[1]) {
            vsMap.vsDest = destination[1];
        }
        let fullConfig = `${vsName} {${vsConfig}}`;
        if (pool && pool[1]) {
            const x = this.digPoolConfig(pool[1]);
            fullConfig += x.config;
            vsMap.pool = x.map;
            logger_1.default.debug(`[${vsName}] found the following pool\n`, pool[1]);
        }
        if (profiles && profiles[1]) {
            fullConfig += this.digProfileConfigs(profiles[1]);
            logger_1.default.debug(`[${vsName}] found the following profiles\n`, profiles[1]);
        }
        if (rules && rules[1]) {
            // add irule connection destination mapping
            fullConfig += this.digRuleConfigs(rules[1]);
            logger_1.default.debug(`[${vsName}] found the following rules\n`, rules[1]);
        }
        if (snat && snat[1]) {
            fullConfig += this.digSnatConfig(snat[1]);
            logger_1.default.debug(`[${vsName}] found snat configuration\n`, snat[1]);
        }
        if (ltPolicies && ltPolicies[1]) {
            // add ltp destination mapping
            fullConfig += this.digLtPolicyConfig(ltPolicies[1]);
            logger_1.default.debug(`[${vsName}] found the following ltPolices\n`, ltPolicies[1]);
        }
        if (persistence && persistence[1]) {
            fullConfig += this.digPersistConfig(persistence[1]);
            logger_1.default.debug(`[${vsName}] found the following persistence\n`, persistence[1]);
        }
        if (fallBackPersist && fallBackPersist[1]) {
            fullConfig += this.digFbPersistConfig(fallBackPersist[1]);
            logger_1.default.debug(`[${vsName}] found the following persistence\n`, fallBackPersist[1]);
        }
        return fullConfig;
    }
    digSnatConfig(snat) {
        let config = '';
        if (snat.includes('pool')) {
            // ltm snatpool <name>
            const snatName = snat.match(this.rx.vs.snat.name);
            this.configAsSingleLevelArray.forEach((el) => {
                if (el.startsWith(`ltm snatpool ${snatName[1]}`)) {
                    config += el;
                    // logger.debug(`[${vsName}] snat pool config \n`, el);
                }
            });
        }
        return config;
    }
    /**
     * get fall back persistence config
     * @param fbPersist vs fallback-persistence
     */
    digFbPersistConfig(fbPersist) {
        let config = '';
        // const persistName = persist.match(this.rx.vs.persist.name);
        this.configAsSingleLevelArray.forEach((el) => {
            if (el.match(`ltm persistence (.+?) ${fbPersist} `)) {
                config += el;
            }
        });
        return config;
    }
    /**
     * get persistence config
     * @param persistence vs persistence referecne
     */
    digPersistConfig(persist) {
        let config = '';
        const persistName = persist.match(this.rx.vs.persist.name);
        this.configAsSingleLevelArray.forEach((el) => {
            if (el.match(`ltm persistence (.+?) ${persistName[1]} `)) {
                config += el;
            }
        });
        return config;
    }
    /**
     * get full pool config and supporting node/monitor configs
     * @param poolName
     */
    digPoolConfig(poolName) {
        logger_1.default.debug(`digging pool config for ${poolName}`);
        const rx = this.rx.vs.pool; // get needed rx sub-tree
        let config = '\n';
        const map = [];
        this.configAsSingleLevelArray.forEach((el) => {
            if (el.startsWith(`ltm pool ${poolName}`)) {
                config += el;
                const members = el.match(rx.members);
                const monitors = el.match(rx.monitors);
                if (members && members[1]) {
                    // dig node information from members
                    const nodeNames = members[1].match(rx.nodesFromMembers);
                    // const nodeAddresses = members[1].match(rx.n)
                    const memberDef = members[1].match(/(\/[\w\-\/.]+:\d+) {\s+address(.+?)\s+}/g);
                    logger_1.default.debug(`Pool ${poolName} members found:`, nodeNames);
                    memberDef.forEach((el) => {
                        const name = el.match(/(\/[\w\-\/.]+)/);
                        const port = el.match(/(?<=:)\d+(?= )/);
                        const addr = el.match(/(?<=address )[\d.]+/);
                        this.configAsSingleLevelArray.forEach((el) => {
                            if (el.startsWith(`ltm node ${name[1]}`)) {
                                config += el;
                            }
                        });
                        map.push(`${addr}:${port}`);
                    });
                    // nodeNames.forEach( name => {
                    //     this.configAsSingleLevelArray.forEach((el: string) => {
                    //         if (el.startsWith(`ltm node ${name}`)) {
                    //             config += el;
                    //         }
                    //     })
                    // })
                }
                if (monitors && monitors[1]) {
                    //dig monitor configs like pool members above
                    const monitorNames = monitors[1].split(/ and /);
                    logger_1.default.debug('pool monitor references found:', monitorNames);
                    // eslint-disable-next-line prefer-const
                    let monitorNameConfigs = [];
                    monitorNames.forEach(name => {
                        this.configAsSingleLevelArray.forEach((el) => {
                            if (el.match(`ltm monitor (.+?) ${name} `)) {
                                monitorNameConfigs.push(el);
                            }
                        });
                    });
                    logger_1.default.debug('pool monitor configs found:', monitorNameConfigs);
                    const defaultMonitors = monitorNames.length - monitorNameConfigs.length;
                    if (defaultMonitors) {
                        logger_1.default.debug(`${poolName} references ${defaultMonitors} system default monitors, compare previous arrays for details`);
                    }
                    if (monitorNameConfigs) {
                        config += monitorNameConfigs.join('');
                    }
                }
            }
        });
        return { config, map };
    }
    digProfileConfigs(profilesList) {
        // regex profiles list to individual profiles
        const rx = this.rx.vs.profiles;
        const profileNames = profilesList.match(rx.names);
        logger_1.default.debug(`profile references found: `, profileNames);
        // #####################################################
        //      Looking into another way to search the tree
        // this method uses findVal to recrusively search the json tree
        // it will return the value for the specified key, but we also
        //  need to know what the full parent object key,
        //  to be able to trace back what kind of profile it was 
        //      (since different profile types can have the same name 
        //      and the profile type is not specified in the vs definition)
        // const ray1 = profileNames.forEach( el => {
        //     const y = findVal(this.configMultiLevelObjects.ltm.profile, el)
        //     if(y) {
        //         const x = 5;
        //     }
        // })
        // ######################################################
        // eslint-disable-next-line prefer-const
        let configList = [];
        profileNames.forEach(name => {
            this.configAsSingleLevelArray.forEach((el) => {
                if (el.match(`ltm profile (.+?) ${name} `)) {
                    configList.push(el);
                }
            });
        });
        const defaultProfiles = profileNames.length - configList.length;
        if (defaultProfiles) {
            logger_1.default.debug(`Found ${defaultProfiles} system default profiles, compare previous arrays for details`);
        }
        return configList.join('');
    }
    /**
     *
     * @param rulesList raw irules regex from vs dig
     */
    digRuleConfigs(rulesList) {
        // const rx = this.rx.vs.rules
        const ruleNames = rulesList.match(this.rx.vs.rules.names);
        logger_1.default.debug(`rule references found: `, ruleNames);
        // eslint-disable-next-line prefer-const
        let ruleList = [];
        ruleNames.forEach(name => {
            this.configAsSingleLevelArray.forEach((el) => {
                if (el.startsWith(`ltm rule ${name}`)) {
                    ruleList.push(el);
                }
            });
        });
        const defaultRules = ruleNames.length - ruleList.length;
        if (defaultRules) {
            logger_1.default.debug(`Found ${defaultRules} system default iRules, compare previous arrays for details`);
        }
        return ruleList.join('');
    }
    /**
     * loops through vs ltp list and returns full ltp configs
     * @param ltPolicys vs ltp config
     */
    digLtPolicyConfig(ltPolicys) {
        // regex local traffic list to individual profiles
        const rx = this.rx.vs.ltPolicies;
        const ltPolicyNames = ltPolicys.match(rx.names);
        logger_1.default.debug(`profile references found: `, ltPolicyNames);
        // eslint-disable-next-line prefer-const
        let configList = [];
        ltPolicyNames.forEach(name => {
            this.configAsSingleLevelArray.forEach((el) => {
                if (el.startsWith(`ltm policy ${name} `)) {
                    configList.push(el);
                }
            });
        });
        return configList.join('');
    }
}
exports.BigipConfig = BigipConfig;
/**
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
function standardizeLineReturns(config) {
    const regex = /(\r\n|\r)/g;
    return config.replace(regex, "\n");
}
//# sourceMappingURL=ltm.js.map