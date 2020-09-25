/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */


// import * as _ from 'lodash';
import object from 'lodash/fp/object';
import { RegExTree, TmosRegExTree } from './regex'
import logger from './logger';
import { poolsInRule } from './pools';
import { pathValueFromKey } from './utils/objects'
import { AppMap, BigipConfObj, BigipObj } from './models'



/**
 * Class to consume bigip.conf
 * 
 */
export class BigipConfig {
    public bigipConf: string;
    /**
     * simple array of each bigip.conf parent object
     * (ex. "[ltm node /Common/192.168.1.20 { address 192.168.1.20 }, ...]")
     */
    public configAsSingleLevelArray: string[];
    /**
     * object form of bigip.conf
     *  key = full object name, value = body
     * *** this one doesn't seem to be useful at all...
     */
    public configSingleLevelObjects: BigipObj = {};
    /**
     *  tmos configuration as a single level object
     * ex. [{name: 'parent object  name', config: 'parent config obj body'}]
     */
    public configArrayOfSingleLevelObjects = [];
    /**
     * tmos config as nested json objects 
     * - consolidated parant object keys like ltm/apm/sys/...
     */
    public configMultiLevelObjects: BigipConfObj = {};
    public tmosVersion: string;
    private rx: TmosRegExTree;

    /**
     * 
     * @param config full bigip.conf as string
     */
    constructor(config: string) {
        config = standardizeLineReturns(config);    
        this.bigipConf = config; // assign orginal config for later use
        const rex = new RegExTree();  // instantiate regex tree
        this.tmosVersion = this.getTMOSversion(config, rex.tmosVersionReg);  // get tmos version
        // this.rx = rex.get();  // get regex tree
        this.rx = rex.get(this.tmosVersion)
        logger.info(`Recieved bigip.conf of version: ${this.tmosVersion}`)
        this.parse(config);
    }

    /**
     * Get processing logs
     */
    public logs() {
        return logger.getLogs();
    }

    

    /**
     * parse bigip.conf into parent objects
     * @param config bigip.conf as string
     */
    private parse(config: string) {

        // parse the major config pieces
        this.configAsSingleLevelArray = [...config.match(this.rx.parentObjects)];

        this.configAsSingleLevelArray.forEach(el => {
            const name = el.match(this.rx.parentNameValue);

            if (name && name.length === 3) {
                this.configSingleLevelObjects[name[1]] = name[2];

                this.configArrayOfSingleLevelObjects.push({name: name[1], config: name[2]});

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
                // merge new object with existing object ***lodash***
                // this.configMultiLevelObjects = _.merge(this.configMultiLevelObjects, newObj);
                this.configMultiLevelObjects = object.merge(this.configMultiLevelObjects, newObj);

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
        });
    }


    /**
     * extracts individual apps
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    public apps() {
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
            apps.push({name: key, config: vsConfig});
        }

        return apps;
    }
    
    

    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    private getTMOSversion(config: string, regex: RegExp): string {
        const version = config.match(regex);
        if(version) {
            //found tmos version
            return version[1];
        } else {
            const msg = 'tmos version not detected -> meaning this probably is not a bigip.conf'
            logger.error(msg)
            throw new Error(msg)
        }
    }

    /**
     * scans vs config, and discovers child configs
     * @param vsName virtual server name
     * @param vsConfig virtual server tmos config body 
     */
    private getVsConfig(vsName: string, vsConfig: string) {

        logger.info(`digging vs config for ${vsName}`);

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
        const vsMap: AppMap = {
            vsName,
            vsDest: ''
        };

        // add destination to vsMap object
        if (destination && destination[1]) {
            vsMap.vsDest = destination[1];

        }
        let fullConfig = `ltm virtual ${vsName} {${vsConfig}}\n`

        if(pool && pool[1]) {
            const x = this.digPoolConfig(pool[1]);
            fullConfig += x.config;
            vsMap.pools = x.map;
            logger.debug(`[${vsName}] found the following pool`, pool[1]);
        }

        if(profiles && profiles[1]){
            fullConfig += this.digProfileConfigs(profiles[1])
            logger.debug(`[${vsName}] found the following profiles`, profiles[1]);
        }

        if(rules && rules[1]) {
            // add irule connection destination mapping

            fullConfig += this.digRuleConfigs(rules[1])
            logger.debug(`[${vsName}] found the following rules`, rules[1]);
        }

        if(snat && snat[1]) {
            fullConfig += this.digSnatConfig(snat[1])
            logger.debug(`[${vsName}] found snat configuration`, snat[1])
        }

        if(ltPolicies && ltPolicies[1]) {
            // add ltp destination mapping
            fullConfig += this.digLtPolicyConfig(ltPolicies[1])
            logger.debug(`[${vsName}] found the following ltPolices`, ltPolicies[1]);
        }
    
        if(persistence && persistence[1]) {
            fullConfig += this.digPersistConfig(persistence[1])
            logger.debug(`[${vsName}] found the following persistence`, persistence[1]);
        }
        
        if(fallBackPersist && fallBackPersist[1]) {
            fullConfig += this.digFbPersistConfig(fallBackPersist[1])
            logger.debug(`[${vsName}] found the following persistence`, fallBackPersist[1]);
        }

        return fullConfig;
    }


    /**
     * analyzes vs snat config, returns full snat configuration if pool reference
     * @param snat vs snat reference as string
     */
    private digSnatConfig(snat: string) {
        let config = '';
        if (snat.includes('pool')) {
            const snatName = snat.match(this.rx.vs.snat.name);
            this.configAsSingleLevelArray.forEach(( el: string) => {
                if(el.startsWith(`ltm snatpool ${snatName[1]}`)){
                    config += el;
                    logger.debug(`adding snat pool config\n`, el);
                }
            })
        }
        return config;
    }


    /**
     * get fall back persistence config
     * @param fbPersist vs fallback-persistence
     */
    private digFbPersistConfig(fbPersist: string) {

        let config = '';
        // const persistName = persist.match(this.rx.vs.persist.name);
        this.configAsSingleLevelArray.forEach((el: string) => {
            if(el.match(`ltm persistence (.+?) ${fbPersist} `)) {
                config += el;
            }
        })
        return config;
    }

    /**
     * get persistence config
     * @param persistence vs persistence referecne
     */
    private digPersistConfig(persist: string) {

        let config = '';
        const persistName = persist.match(this.rx.vs.persist.name);
        this.configAsSingleLevelArray.forEach((el: string) => {
            if(el.match(`ltm persistence (.+?) ${persistName[1]} `)) {
                config += el;
            }
        })
        return config;
    }

    /**
     * get full pool config and supporting node/monitor configs
     * @param poolName 
     */
    private digPoolConfig(poolName: string) {

        logger.debug(`digging pool config for ${poolName}`);

        const rx = this.rx.vs.pool; // get needed rx sub-tree

        let config = '\n';
        const map = [];
        this.configAsSingleLevelArray.forEach((el: string) => {

            if(el.startsWith(`ltm pool ${poolName}`)) {

                config += el;
                const members = el.match(rx.members);
                const monitors = el.match(rx.monitors);

                if(members && members[1]){

                    // dig node information from members
                    const nodeNames = members[1].match(rx.nodesFromMembers);
                    // const nodeAddresses = members[1].match(rx.n)
                    const memberDef = members[1].match(/(\/[\w\-\/.]+:\d+) {\s+address(.+?)\s+}/g)
                    logger.debug(`Pool ${poolName} members found:`, nodeNames);

                    memberDef.forEach((el: string) => {
                        const name = el.match(/(\/[\w\-\/.]+)/);
                        const port = el.match(/(?<=:)\d+(?= )/);
                        const addr = el.match(/(?<=address )[\d.]+/);

                        this.configAsSingleLevelArray.forEach((el: string) => {
                            if (el.startsWith(`ltm node ${name[1]}`)) {
                                config += el;
                            }
                        })
                        map.push(`${addr}:${port}`)

                    })

                    // nodeNames.forEach( name => {
                    //     this.configAsSingleLevelArray.forEach((el: string) => {
                    //         if (el.startsWith(`ltm node ${name}`)) {
                    //             config += el;
                    //         }
                    //     })
                    // })
                }

                if(monitors && monitors[1]) {

                    //dig monitor configs like pool members above
                    const monitorNames = monitors[1].split(/ and /);
                    logger.debug('pool monitor references found:', monitorNames);

                    // eslint-disable-next-line prefer-const
                    const monitorNameConfigs = [];
                    monitorNames.forEach( name => {

                        // new way look for key in .ltm.monitor
                        const pv = pathValueFromKey(this.configMultiLevelObjects.ltm.monitor, name)
                        if(pv){
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
                    })
                    
                    logger.debug('pool monitor configs found:', monitorNameConfigs);
                    const defaultMonitors = monitorNames.length - monitorNameConfigs.length
                    
                    if(defaultMonitors){
                        logger.debug(`[${poolName}] references ${defaultMonitors} system default monitors, compare previous arrays for details`)
                    }
                    
                    if(monitorNameConfigs){
                        config += monitorNameConfigs.join('');
                    }
                }
            }
        });
        return { config, map };
    }

    private digProfileConfigs(profilesList: string) {

        // regex profiles list to individual profiles
        const rx = this.rx.vs.profiles;
        const profileNames = profilesList.match(rx.names);
        logger.debug(`profile references found: `, profileNames);

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
        profileNames.forEach( name => {
            this.configAsSingleLevelArray.forEach((el: string) => {
                if(el.match(`ltm profile (.+?) ${name} `)) {
                    configList.push(el);
                }
            })
        })
        
        const defaultProfiles = profileNames.length - configList.length;
        if(defaultProfiles){
            logger.debug(`Found ${defaultProfiles} system default profiles, compare previous arrays for details`)
        }
        return configList.join('');
    }

    /**
     * 
     * @param rulesList raw irules regex from vs dig
     */
    private digRuleConfigs(rulesList: string) {

        // const rx = this.rx.vs.rules
        const ruleNames = rulesList.match(this.rx.vs.rules.names);
        logger.debug(`rule references found: `, ruleNames);

        // eslint-disable-next-line prefer-const
        let ruleList = [];
        ruleNames.forEach( name => {
            // search config, return matches
            this.configAsSingleLevelArray.forEach((el:string) => {
                if(el.startsWith(`ltm rule ${name}`)) {
                    ruleList.push(el);
                    // const x = el;
                    // call irule pool extractor function
                    const y = poolsInRule(el);
                    if(y) {
                        logger.info('***Dev*** pools in irule: ', el);
                    }
                }
            })
        })

        const defaultRules = ruleNames.length - ruleList.length;
        if(defaultRules) {
            logger.debug(`Found ${defaultRules} system default iRules, compare previous arrays for details`)
        }
        return ruleList.join('');
    }


    /**
     * loops through vs ltp list and returns full ltp configs
     * @param ltPolicys vs ltp config
     */
    private digLtPolicyConfig(ltPolicys: string) {

        // regex local traffic list to individual profiles
        const rx = this.rx.vs.ltPolicies;
        const ltPolicyNames = ltPolicys.match(rx.names);
        logger.debug(`profile references found: `, ltPolicyNames);

        // eslint-disable-next-line prefer-const
        let configList = [];
        ltPolicyNames.forEach( name => {
            this.configAsSingleLevelArray.forEach((el: string) => {
                if(el.startsWith(`ltm policy ${name} `)) {
                    configList.push(el);
                }
            })
        })

        return configList.join('');
    }
}



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
function standardizeLineReturns (config: string){
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



