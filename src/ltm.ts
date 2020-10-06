/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */


// import * as _ from 'lodash';
// import object from 'lodash/fp/object';
import { RegExTree, TmosRegExTree } from './regex'
import logger from './logger';
import { poolsInRule } from './pools';

import { deepGet, getPathOfValue, pathValueFromKey, setNestedKey, tmosChildToObj } from './utils/objects'
import { AppMap, BigipConfObj, BigipObj, Stats } from './models'

import { deepMergeObj } from './utils/objects'

import { v4 as uuidv4 } from 'uuid';


/**
 * Class to consume bigip.conf
 * 
 */
export default class BigipConfig {
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
    public configFullObject: BigipConfObj = {};
    public tmosVersion: string;
    private rx: TmosRegExTree;
    public parseTime: number;
    public appTime: number;
    private objCount: number;
    private stats: Stats | undefined;

    /**
     * 
     * @param config full bigip.conf as string
     */
    constructor(config: string) {

        config = standardizeLineReturns(config);
        this.bigipConf = config; // assign orginal config for later use
        const rex = new RegExTree();  // instantiate regex tree
        this.tmosVersion = this.getTMOSversion(config, rex.tmosVersionReg);  // get tmos version
        logger.info(`Recieved bigip.conf of version: ${this.tmosVersion}`)
        
        // assign regex tree for particular version
        this.rx = rex.get(this.tmosVersion)
        // this.parse(config);

    }

    /**
     * returns all details from processing
     * 
     * - 
     */
    public explode () {
        this.parse(this.bigipConf); // parse config files
        const apps = this.apps();   // extract apps
        const startTime = process.hrtime.bigint();  // start pack timer
        const id = uuidv4();        // generat uuid
        const dateTime = new Date();    // generate date/time
        const logs = this.logs();   // get all the processing logs
        // capture pack time
        const packTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        return {
            id,
            dateTime,
            config: {
                sources: [ 'bigip.conf', 'bigip_base.conf', 'partition?'],
                apps
            },
            stats: {
                parseTime: this.parseTime,
                appTime: this.appTime,
                packTime,
                totalProcessingTime: this.parseTime + this.appTime + packTime,
                sourceTmosVersion: this.tmosVersion,
                objCount: this.objCount
            },
            logs
        }
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
        const startTime = process.hrtime.bigint();
        logger.debug('Begining to parse configs')
        // parse the major config pieces
        this.configAsSingleLevelArray = [...config.match(this.rx.parentObjects)];
        // const configAsSingleLevelArray = [...config.match(this.rx.parentObjects)];
        logger.debug('configAsSingleLevelArray complete')

        // lines in config?
        this.objCount = this.configAsSingleLevelArray.length
        this.stats = nestedObjValue(['objectCount'], this.objCount);
        logger.debug(`detected ${this.stats.objectCount} parent objects`)

        
        logger.debug(`creating more detailed arrays/objects for deeper inspection`)
        this.configAsSingleLevelArray.forEach(el => {
            const name = el.match(this.rx.parentNameValue);

            if (name && name.length === 3) {

                // this.configSingleLevelObjects[name[1]] = name[2];

                // this.configArrayOfSingleLevelObjects.push({name: name[1], config: name[2]});

                // split extracted name element by spaces
                const names = name[1].split(' ');
                // create new nested objects with each of the names, assigning value on inner-most
                const newObj = nestedObjValue(names, name[2]);

                /**
                 * original version that produced a multi-level object tree for parent items ONLY
                 */
                this.configMultiLevelObjects = deepMergeObj([this.configMultiLevelObjects, newObj]);
            }
        });

        this.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000; // convert microseconds to miliseconds
    }

    /**
     * **DEV**  working to fully jsonify the entire config
     */
    private parse2() {


        // copy over our base tree so we don't mess with existing functionality
        this.configFullObject = this.configMultiLevelObjects;
        // this.configFullObject = Object.assign(this.configFullObject, this.configMultiLevelObjects);

        // const rrr = findPathOfValue('string-to-find', this.configFullObject.ltm.virtual);
        // const uuu = getPathOfValue2('\n', this.configFullObject);
        
        // const testPath = 'apm.epsec.epsec-package./Common/epsec-1.0.0-892.0.iso';
        // const testPath2 = ['apm','epsec','epsec-package','/Common/epsec-1.0.0-892.0.iso'];
        
        let pathToConvert = ['x']
        while(pathToConvert) {
        // if (pathToConvert) {

            // search values for line return
            pathToConvert = getPathOfValue('\n', this.configFullObject.ltm.virtual);
            
            const body = deepGet(pathToConvert, this.configFullObject.ltm.virtual);

            const childBodyAsObj = tmosChildToObj(body);

            setNestedKey(
                this.configFullObject.ltm.virtual,
                pathToConvert,
                childBodyAsObj
            );

            // const obj = {a: {b:{c:'initial'}}}
            // const uuu = setNestedKey(obj, ['a', 'b', 'c'], 'changed-value')
            // const rrr = uuu;

            // const ddd = body;

        }
        
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

        const startTime = process.hrtime.bigint();

        // eslint-disable-next-line prefer-const
        let apps = [];

        // this.configArrayOfSingleLevelObjects

        // #################################################
        // old method utilizing json tree - removed cause of lodash bloat
        const i = this.configMultiLevelObjects.ltm.virtual;
        for (const [key, value] of Object.entries(i)) {
            const vsConfig = this.getVsConfig(key, value);
            const x = JSON.stringify({name: key, config: vsConfig});
            const y = JSON.parse(x);
            apps.push(y);
        }

        this.appTime = Number(process.hrtime.bigint() - startTime) / 1000000;
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



