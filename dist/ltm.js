"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigipConfig = void 0;
// import * as _ from 'lodash';
// import object from 'lodash/fp/object';
const regex_1 = require("./regex");
const logger_1 = __importDefault(require("./logger"));
const pools_1 = require("./pools");
const objects_1 = require("./utils/objects");
const objects_2 = require("./utils/objects");
/**
 * Class to consume bigip.conf
 *
 */
class BigipConfig {
    /**
     *
     * @param config full bigip.conf as string
     */
    constructor(config) {
        /**
         * object form of bigip.conf
         *  key = full object name, value = body
         * *** this one doesn't seem to be useful at all...
         */
        this.configSingleLevelObjects = {};
        /**
         *  tmos configuration as a single level object
         * ex. [{name: 'parent object  name', config: 'parent config obj body'}]
         */
        this.configArrayOfSingleLevelObjects = [];
        /**
         * tmos config as nested json objects
         * - consolidated parant object keys like ltm/apm/sys/...
         */
        this.configMultiLevelObjects = {};
        this.configFullObject = {};
        config = standardizeLineReturns(config);
        this.bigipConf = config; // assign orginal config for later use
        const rex = new regex_1.RegExTree(); // instantiate regex tree
        this.tmosVersion = this.getTMOSversion(config, rex.tmosVersionReg); // get tmos version
        // this.rx = rex.get();  // get regex tree
        this.rx = rex.get(this.tmosVersion);
        this.parse(config);
        // this.parse2();
        logger_1.default.info(`Recieved bigip.conf of version: ${this.tmosVersion}`);
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
                // ###################################################
                /**
                 * the folling is used to json-ify the tmos config it is the main reason for
                 *  lodash, which takes the project size from <100k (with no deps) to >80MB
                 *  with a ton of dependencies
                 *      was able to just import the object function, we'll see how that works
                 * https://www.blazemeter.com/blog/the-correct-way-to-import-lodash-libraries-a-benchmark
                 */
                // split extracted name element by spaces
                const names = name[1].split(' ');
                // create new nested objects with each of the names, assigning value on inner-most
                const newObj = nestedObjValue(names, name[2]);
                /**
                 * original version that produced a multi-level object tree for parent items ONLY
                 */
                this.configMultiLevelObjects = objects_2.deepMergeObj([this.configMultiLevelObjects, newObj]);
                /**
                 * if we go down the path of turning the entire config into a json tree
                 *  (which seems like the most flexible path), then we will need a function to
                 *  search for "key" (object(profile) name), and return an array of matches, including
                 *  the path to object, and it's value.
                 *
                 * This is needed since, for example, monitors are referenced on the pool only by name,
                 *  but thier object has a subtype definition like "http" or "tcp" or "https". So,
                 *  there is a need to do a recursive multi level search starting at "ltm monitor" or ltm.monitor
                 *  and search within the objects there for the monitor name, the returned path will tell
                 *  the monitor type.  We will need to verify object types since different type objects
                 *  can have the same name, but vs refence doesn't tell us type.
                 *
                 * Should be able to use an example function from the article below and modify as needed
                 *
                 * https://stackoverflow.com/questions/43636000/javascript-find-path-to-object-reference-in-nested-object
                 */
                /**
                 * todo:  look into exploding each config piece to json-ify the entire config...
                 *  - this seems like it could be the same process used for parent objects
                 *      - extract each object
                 *      - split object names on spaces for nested object names
                 *      - assign values as needed
                 *      - items with out objects, get key: value assign at that object level
                 */
                // ######################################################
            }
            /**
             * second try to fully jsonify config
             *  this method will be a bit slower, but should be easier to code
             *
             * So, instead of crawling the tree from top to bottom, iterating each child,
             *  converting from text to json, creating the entire tree in one pass,
             *  which I consider the true iterative approach.
             *
             * This approach will take the same tree we had before (step 1) and search it
             *  for string values with line returns, probably any white space,
             *  when found, parse the value and try to convert it to json
             *  - use the find value return path function
             *  - convert
             *  - repeat
             */
        });
    }
    parse2() {
        // copy over our base tree so we don't mess with existing functionality
        this.configFullObject = this.configMultiLevelObjects;
        // this.configFullObject = Object.assign(this.configFullObject, this.configMultiLevelObjects);
        // const rrr = findPathOfValue('string-to-find', this.configFullObject.ltm.virtual);
        // const uuu = getPathOfValue2('\n', this.configFullObject);
        // const testPath = 'apm.epsec.epsec-package./Common/epsec-1.0.0-892.0.iso';
        // const testPath2 = ['apm','epsec','epsec-package','/Common/epsec-1.0.0-892.0.iso'];
        let pathToConvert = ['x'];
        while (pathToConvert) {
            // if (pathToConvert) {
            // search values for line return
            pathToConvert = objects_1.getPathOfValue('\n', this.configFullObject.ltm.virtual);
            const body = objects_1.deepGet(pathToConvert, this.configFullObject.ltm.virtual);
            const childBodyAsObj = objects_1.tmosChildToObj(body);
            objects_1.setNestedKey(this.configFullObject.ltm.virtual, pathToConvert, childBodyAsObj);
            // const obj = {a: {b:{c:'initial'}}}
            // const uuu = setNestedKey(obj, ['a', 'b', 'c'], 'changed-value')
            // const rrr = uuu;
            const ddd = body;
        }
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
        // this.configArrayOfSingleLevelObjects
        // #################################################
        // old method utilizing json tree - removed cause of lodash bloat
        const i = this.configMultiLevelObjects.ltm.virtual;
        for (const [key, value] of Object.entries(i)) {
            const vsConfig = this.getVsConfig(key, value);
            apps.push({ name: key, config: vsConfig });
        }
        return apps;
    }
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
        let fullConfig = `ltm virtual ${vsName} {${vsConfig}}\n`;
        if (pool && pool[1]) {
            const x = this.digPoolConfig(pool[1]);
            fullConfig += x.config;
            vsMap.pools = x.map;
            logger_1.default.debug(`[${vsName}] found the following pool`, pool[1]);
        }
        if (profiles && profiles[1]) {
            fullConfig += this.digProfileConfigs(profiles[1]);
            logger_1.default.debug(`[${vsName}] found the following profiles`, profiles[1]);
        }
        if (rules && rules[1]) {
            // add irule connection destination mapping
            fullConfig += this.digRuleConfigs(rules[1]);
            logger_1.default.debug(`[${vsName}] found the following rules`, rules[1]);
        }
        if (snat && snat[1]) {
            fullConfig += this.digSnatConfig(snat[1]);
            logger_1.default.debug(`[${vsName}] found snat configuration`, snat[1]);
        }
        if (ltPolicies && ltPolicies[1]) {
            // add ltp destination mapping
            fullConfig += this.digLtPolicyConfig(ltPolicies[1]);
            logger_1.default.debug(`[${vsName}] found the following ltPolices`, ltPolicies[1]);
        }
        if (persistence && persistence[1]) {
            fullConfig += this.digPersistConfig(persistence[1]);
            logger_1.default.debug(`[${vsName}] found the following persistence`, persistence[1]);
        }
        if (fallBackPersist && fallBackPersist[1]) {
            fullConfig += this.digFbPersistConfig(fallBackPersist[1]);
            logger_1.default.debug(`[${vsName}] found the following persistence`, fallBackPersist[1]);
        }
        return fullConfig;
    }
    /**
     * analyzes vs snat config, returns full snat configuration if pool reference
     * @param snat vs snat reference as string
     */
    digSnatConfig(snat) {
        let config = '';
        if (snat.includes('pool')) {
            const snatName = snat.match(this.rx.vs.snat.name);
            this.configAsSingleLevelArray.forEach((el) => {
                if (el.startsWith(`ltm snatpool ${snatName[1]}`)) {
                    config += el;
                    logger_1.default.debug(`adding snat pool config\n`, el);
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
                    const monitorNameConfigs = [];
                    monitorNames.forEach(name => {
                        // new way look for key in .ltm.monitor
                        const pv = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.monitor, name);
                        if (pv) {
                            // rebuild tmos object
                            monitorNameConfigs.push(`ltm monitor ${pv.path} ${name} {${pv.value}}\n`);
                        }
                        // // original way, by looping through entire config
                        // this.configAsSingleLevelArray.forEach((el: string) => {
                        //     if(el.match(`ltm monitor (.+?) ${name} `)) {
                        //         monitorNameConfigs.push(el);
                        //         // foundName = name;
                        //     }
                        // })
                    });
                    logger_1.default.debug('pool monitor configs found:', monitorNameConfigs);
                    const defaultMonitors = monitorNames.length - monitorNameConfigs.length;
                    if (defaultMonitors) {
                        logger_1.default.debug(`[${poolName}] references ${defaultMonitors} system default monitors, compare previous arrays for details`);
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
            // search config, return matches
            this.configAsSingleLevelArray.forEach((el) => {
                if (el.startsWith(`ltm rule ${name}`)) {
                    ruleList.push(el);
                    // const x = el;
                    // call irule pool extractor function
                    const y = pools_1.poolsInRule(el);
                    if (y) {
                        logger_1.default.info('***Dev*** pools in irule: ', el);
                    }
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
/**
 * Reverse string
 * @param str string to reverse
 */
// function reverse(str: string){
//     return [...str].reverse().join('');
//   }
//# sourceMappingURL=ltm.js.map