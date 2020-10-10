"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const regex_1 = require("./regex");
const logger_1 = __importDefault(require("./logger"));
const objects_1 = require("./utils/objects");
const objects_2 = require("./utils/objects");
const uuid_1 = require("uuid");
const objCounter_1 = require("./objCounter");
const unPacker_1 = require("./unPacker");
/**
 * Class to consume bigip.conf
 *
 */
class BigipConfig {
    /**
     *
     * @param config full bigip.conf as string
     */
    constructor() {
        // config = standardizeLineReturns(config);
        /**
         * tmos config as nested json objects
         * - consolidated parant object keys like ltm/apm/sys/...
         */
        this.configMultiLevelObjects = {};
        this.configFullObject = {};
        this.stats = {};
        // this.stats.configBytes = Buffer.byteLength(config, 'utf-8');
        // this.stats.lineCount = countLines(config);
        // this.bigipConf = config; // assign orginal config for later use
        // const rex = new RegExTree();  // instantiate regex tree
        // this.tmosVersion = this.getTMOSversion(config, rex.tmosVersionReg);  // get tmos version
        // logger.info(`Recieved bigip.conf of version: ${this.tmosVersion}`)
        // assign regex tree for particular version
        // this.rx = rex.get(this.tmosVersion)
    }
    /**
     * return list of applications
     */
    appList() {
        return Object.keys(this.configMultiLevelObjects.ltm.virtual);
    }
    /**
     * load .conf file or files from ucs/qkview
     *
     * @param config array of configs as strings
     */
    load(file) {
        return __awaiter(this, void 0, void 0, function* () {
            /**
             * setup event emitors to provide status of unPacking
             */
            const startTime = process.hrtime.bigint();
            this.configFiles = yield unPacker_1.unPacker(file);
            if (this.configFiles) {
                // unPacker returned something so respond with processing time
                return Number(process.hrtime.bigint() - startTime) / 1000000;
            }
            else {
                // unPacker failed and returned nothing, return up the chain...
                return;
            }
        });
    }
    /**
     * new parsing fuction to work on list of files from unPacker
     */
    parseNew() {
        const startTime = process.hrtime.bigint();
        logger_1.default.debug('Begining to parse configs');
        this.configFiles.forEach(el => {
            /**
             * for each file
             * 1. get tmos version
             * 2. extract parent objects to array
             * 3. convert array to main obj
             */
            if (this.rx) {
                // rex tree already assigned, lets confirm subsequent file tmos version match
                if (this.tmosVersion === this.getTMOSversion(el.content, this.rx.tmosVersion)) {
                    // do nothing, current file version matches existing files tmos verion
                }
                else {
                    logger_1.default.error(`Parsing [${el.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`);
                    return;
                }
            }
            else {
                // first time through - build everything
                const rex = new regex_1.RegExTree(); // instantiate regex tree
                this.tmosVersion = this.getTMOSversion(el.content, rex.tmosVersionReg); // get tmos version
                logger_1.default.info(`Recieved .conf file of version: ${this.tmosVersion}`);
                // assign regex tree for particular version
                this.rx = rex.get(this.tmosVersion);
            }
            let configAsSingleLevelArray = [];
            try {
                configAsSingleLevelArray = [...el.content.match(this.rx.parentObjects)];
            }
            catch (e) {
                logger_1.default.error('failed to extract any parent matches from file - might be a scripts file...');
            }
            if (configAsSingleLevelArray) {
                // get number of lines in config
                const lines = configAsSingleLevelArray.length;
                logger_1.default.debug(`detected ${this.stats.objectCount} parent objects in this file`);
                // add to main stats
                this.stats.objectCount += lines;
                logger_1.default.debug(`creating more detailed arrays/objects for deeper inspection`);
                configAsSingleLevelArray.forEach(el => {
                    // extract object name from body
                    const name = el.match(this.rx.parentNameValue);
                    if (name && name.length === 3) {
                        // split extracted name element by spaces
                        const names = name[1].split(' ');
                        // create new nested objects with each of the names, assigning value on inner-most
                        const newObj = objects_1.nestedObjValue(names, name[2]);
                        this.configMultiLevelObjects = objects_2.deepMergeObj(this.configMultiLevelObjects, newObj);
                    }
                });
            }
        });
        // get ltm object counts
        this.stats.objects = objCounter_1.countObjects(this.configMultiLevelObjects);
        // end processing time, convert microseconds to miliseconds
        this.stats.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        return this.stats.parseTime;
    }
    /**
     * returns all details from processing
     *
     * -
     */
    explode() {
        var _a;
        // if config has not been parsed yet...
        if (!((_a = this.configMultiLevelObjects.ltm) === null || _a === void 0 ? void 0 : _a.virtual)) {
            this.parseNew(); // parse config files
        }
        const apps = this.apps(); // extract apps
        const startTime = process.hrtime.bigint(); // start pack timer
        const id = uuid_1.v4(); // generat uuid
        const dateTime = new Date(); // generate date/time
        const logs = this.logs(); // get all the processing logs
        // capture pack time
        this.stats.packTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        return {
            id,
            dateTime,
            config: {
                sources: ['bigip.conf', 'bigip_base.conf', 'partition?', 'hook this info souce files'],
                apps
            },
            stats: this.stats,
            logs
        };
    }
    /**
     * Get processing logs
     */
    logs() {
        return logger_1.default.getLogs();
    }
    // /**
    //  * parse bigip.conf into parent objects
    //  * @param config bigip.conf as string
    //  */
    // public parse() {
    //     const startTime = process.hrtime.bigint();
    //     logger.debug('Begining to parse configs')
    //     // parse the major config pieces
    //     // this.configAsSingleLevelArray = [...config.match(this.rx.parentObjects)];
    //     const configAsSingleLevelArray = [...this.bigipConf.match(this.rx.parentObjects)];
    //     logger.debug('configAsSingleLevelArray complete')
    //     // lines in config?
    //     this.stats.objectCount = configAsSingleLevelArray.length
    //     // this.stats = nestedObjValue(['objectCount'], this.stats.objectCount);
    //     logger.debug(`detected ${this.stats.objectCount} parent objects`)
    //     logger.debug(`creating more detailed arrays/objects for deeper inspection`)
    //     configAsSingleLevelArray.forEach(el => {
    //         const name = el.match(this.rx.parentNameValue);
    //         if (name && name.length === 3) {
    //             // this.configSingleLevelObjects[name[1]] = name[2];
    //             // this.configArrayOfSingleLevelObjects.push({name: name[1], config: name[2]});
    //             // split extracted name element by spaces
    //             const names = name[1].split(' ');
    //             // create new nested objects with each of the names, assigning value on inner-most
    //             const newObj = nestedObjValue(names, name[2]);
    //             /**
    //              * original version that produced a multi-level object tree for parent items ONLY
    //              */
    //             this.configMultiLevelObjects = deepMergeObj(this.configMultiLevelObjects, newObj);
    //         }
    //     });
    //     // get ltm object counts
    //     this.stats.objects = countObjects(this.configMultiLevelObjects);
    //     this.stats.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000; // convert microseconds to miliseconds
    //     /**
    //      * update function to input config 
    //      */
    //     return this.stats.parseTime
    // }
    // /**
    //  * **DEV**  working to fully jsonify the entire config
    //  */
    // private parse2() {
    //     // copy over our base tree so we don't mess with existing functionality
    //     this.configFullObject = this.configMultiLevelObjects;
    //     let pathToConvert = ['x']
    //     while(pathToConvert) {
    //     // if (pathToConvert) {
    //         // search values for line return
    //         pathToConvert = getPathOfValue('\n', this.configFullObject.ltm.virtual);
    //         const body = deepGet(pathToConvert, this.configFullObject.ltm.virtual);
    //         const childBodyAsObj = tmosChildToObj(body);
    //         setNestedKey(
    //             this.configFullObject.ltm.virtual,
    //             pathToConvert,
    //             childBodyAsObj
    //         );
    //     }
    // }
    /**
     * extracts app(s)
     * @param app single app string
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    apps(app) {
        /**
         * todo:  add support for app array to return multiple specific apps at same time.
         */
        const startTime = process.hrtime.bigint();
        if (app) {
            // extract single app config
            const value = this.configMultiLevelObjects.ltm.virtual[app];
            if (value) {
                // dig config, then stop timmer, then return config...
                const x = [this.digVsConfig(app, value)];
                this.stats.appTime = Number(process.hrtime.bigint() - startTime) / 1000000;
                return x;
            }
        }
        else {
            // means we didn't get an app name, so try to dig all apps...
            // eslint-disable-next-line prefer-const
            let apps = [];
            const i = this.configMultiLevelObjects.ltm.virtual;
            for (const [key, value] of Object.entries(i)) {
                const vsConfig = this.digVsConfig(key, value);
                const x = JSON.stringify({ name: key, config: vsConfig });
                const y = JSON.parse(x);
                apps.push(y);
            }
            this.stats.appTime = Number(process.hrtime.bigint() - startTime) / 1000000;
            return apps;
        }
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
    digVsConfig(vsName, vsConfig) {
        logger_1.default.info(`digging vs config for ${vsName}`);
        const rx = this.rx.vs; // get needed rx tree
        const pool = vsConfig.match(rx.pool.obj);
        const profiles = vsConfig.match(rx.profiles.obj);
        const rules = vsConfig.match(rx.rules.obj);
        const snat = vsConfig.match(rx.snat.obj);
        const policies = vsConfig.match(rx.ltPolicies.obj);
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
        if (policies && policies[1]) {
            // add ltp destination mapping
            fullConfig += this.digLtPolicyConfig(policies[1]);
            logger_1.default.debug(`[${vsName}] found the following policies`, policies[1]);
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
            if (snatName) {
                const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.snatpool, snatName[1]);
                config += `ltm snatpool ${x.key} {${x.value}}\n`;
            }
            else {
                logger_1.default.error(`Detected following snat pool configuration, but did not find in config [${snat}]`);
            }
        }
        else {
            logger_1.default.debug(`snat configuration detected, but no pool reference found, presume -> automap`);
        }
        return config;
    }
    /**
     * get fall back persistence config
     * @param fbPersist vs fallback-persistence
     */
    digFbPersistConfig(fbPersist) {
        let config = '';
        const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.persistence, fbPersist);
        if (x) {
            config += `ltm persistence ${x.path} ${x.key} {${x.value}}\n`;
        }
        return config;
    }
    /**
     * get persistence config
     * @param persistence vs persistence referecne
     */
    digPersistConfig(persist) {
        let config = '';
        const persistName = persist.match(this.rx.vs.persist.name);
        if (persistName) {
            const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.persistence, persistName[1]);
            if (x) {
                config += `ltm persistence ${x.path} ${x.key} {${x.value}}\n`;
            }
        }
        return config;
    }
    /**
     * get full pool config and supporting node/monitor configs
     * @param poolName
     */
    digPoolConfig(poolName) {
        logger_1.default.debug(`digging pool config for ${poolName}`);
        const rx = this.rx.vs.pool; // get needed rx sub-tree
        let config = '';
        const map = [];
        const poolConfig = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.pool, poolName);
        if (poolConfig) {
            config += `ltm pool ${poolName} {${poolConfig.value}}\n`;
            const members = poolConfig.value.match(rx.members);
            const monitors = poolConfig.value.match(rx.monitors);
            if (members && members[1]) {
                // dig node information from members
                const nodeNames = members[1].match(rx.nodesFromMembers);
                // const nodeAddresses = members[1].match(rx.n)
                // regular pool member definition regex
                const memberDef = members[1].match(/(\/[\w\-\/.]+:\d+) {\s+address(.+?)\s+}/g);
                // fqdn pool member definition regex
                const memberFqdnDef = members[1].match(/(\/[\w\-\/.]+:\d+) {\s+fqdn {\s+([\s\S]+?)\s+}\s+}/g);
                logger_1.default.debug(`Pool ${poolName} members found:`, nodeNames);
                if (memberDef) {
                    memberDef.forEach((el) => {
                        const name = el.match(/(\/[\w\-\/.]+)/);
                        const port = el.match(/(?<=:)\d+(?= )/);
                        const addr = el.match(/(?<=address )[\d.]+/);
                        const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.node, name[0]);
                        config += `ltm node ${x.key} {${x.value}}\n`;
                        map.push(`${addr}:${port}`);
                    });
                }
                if (memberFqdnDef) {
                    memberFqdnDef.forEach((el) => {
                        // const memberFqdnNames = el.match(/([\s\S]+?)\n/g);
                        const name = el.match(/(\/[\w\-\/.]+)/);
                        const port = el.match(/(?<=:)\d+(?= )/);
                        const a = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.node, name[0]);
                        config += `ltm node ${a.key} {${a.value}}\n`;
                        map.push(`${name}:${port}`);
                    });
                }
            }
            if (monitors && monitors[1]) {
                //dig monitor configs like pool members above
                const monitorNames = monitors[1].split(/ and /);
                logger_1.default.debug('pool monitor references found:', monitorNames);
                // eslint-disable-next-line prefer-const
                const monitorNameConfigs = [];
                monitorNames.forEach(name => {
                    // new way look for key in .ltm.monitor
                    const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.monitor, name);
                    if (x) {
                        // rebuild tmos object
                        monitorNameConfigs.push(`ltm monitor ${x.path} ${x.key} {${x.value}}\n`);
                    }
                });
                logger_1.default.debug('pool monitor configs found:', monitorNameConfigs);
                const defaultMonitors = monitorNames.length - monitorNameConfigs.length;
                if (defaultMonitors) {
                    logger_1.default.debug(`[${poolName}] references ${defaultMonitors} system default monitors, compare previous arrays for details`);
                }
                if (monitorNameConfigs) {
                    config += monitorNameConfigs.join('\n');
                }
            }
        }
        return { config, map };
    }
    digProfileConfigs(profilesList) {
        // regex profiles list to individual profiles
        const rx = this.rx.vs.profiles;
        const profileNames = profilesList.match(rx.names);
        logger_1.default.debug(`profile references found: `, profileNames);
        // eslint-disable-next-line prefer-const
        let configList = [];
        profileNames.forEach(name => {
            const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.profile, name);
            if (x) {
                configList.push(`ltm profile ${x.path} ${x.key} {${x.value}}\n`);
            }
        });
        const defaultProfiles = profileNames.length - configList.length;
        if (defaultProfiles) {
            logger_1.default.debug(`Found ${defaultProfiles} system default profiles, compare previous arrays for details`);
        }
        return configList.join('\n');
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
            const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.rule, name);
            if (x) {
                ruleList.push(`ltm rule ${x.key} {${x.value}}\n`);
            }
        });
        const defaultRules = ruleNames.length - ruleList.length;
        if (defaultRules) {
            logger_1.default.debug(`Found ${defaultRules} system default iRules, compare previous arrays for details`);
        }
        return ruleList.join('\n');
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
            const x = objects_1.pathValueFromKey(this.configMultiLevelObjects.ltm.policy, name);
            if (x) {
                configList.push(`ltm policy ${x.key} {${x.value}}\n`);
            }
            else {
                logger_1.default.error(`Could not find ltPolicy named: ${name}`);
            }
        });
        return configList.join('\n');
    }
}
exports.default = BigipConfig;
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