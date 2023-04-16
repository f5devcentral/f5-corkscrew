
'use strict';

import logger from './logger';
import { AppMap, BigipConfObj } from './models'
import { TmosRegExTree } from './regex';
import { cleanObject, pathValueFromKey } from './objects';
import { poolsInPolicy, poolsInRule } from './pools';
import { digDataGroupsiniRule } from './digiRules';


/**
 * scans vs config, and discovers child configs
 * @param vsName virtual server name
 * @param vsConfig virtual server tmos config body 
 */
export async function digVsConfig(vsName: string, vsConfig: string, configTree: BigipConfObj, rx: TmosRegExTree) {

    /**
     * 
     * What do we need to map on next on the virtual servers?:
     *  - oneConnect?
     *  - expand the discovery of all profiles (apm and supporting)
     * 
     * Or do we expand the irule references like pools/policies?
     * 
     */

    logger.info(`digging vs config for ${vsName}`);

    const pool = vsConfig.match(rx.vs.pool.obj);
    const profiles = vsConfig.match(rx.vs.profiles.obj);
    const rules = vsConfig.match(rx.vs.rules.obj);
    const snat = vsConfig.match(rx.vs.snat.obj);
    const policies = vsConfig.match(rx.vs.ltPolicies.obj);
    const persistence = vsConfig.match(rx.vs.persist.obj);
    const fallBackPersist = vsConfig.match(rx.vs.fbPersist);
    const destination = vsConfig.match(rx.vs.destination);

    // base vsMap config object
    const map: AppMap = {
        // vsName,
        vsDest: ''
    };

    // add destination to vsMap object
    if (destination && destination[1]) {
        map.vsDest = destination[1];

    }
    let config = [];
    config.push(`ltm virtual ${vsName} {${vsConfig}}`);

    if (pool && pool[1]) {
        const x = digPoolConfig(pool[1], configTree, rx);
        config.push(...x.config);
        map.pool = x.map;
        logger.debug(`[${vsName}] found the following pool`, pool[1]);
    }

    if (profiles && profiles[1]) {
        const x = digProfileConfigs(profiles[1], configTree, rx);
        config.push(...x.config);
        logger.debug(`[${vsName}] found the following profiles`, profiles[1]);
    }

    if (rules && rules[1]) {
        // add irule connection destination mapping

        await digRuleConfigs(rules[1], configTree, rx)
            .then(x => {
                config.push(...x.config);
                if (x.map) {
                    map.irule = x.map;
                }
                logger.debug(`[${vsName}] found the following rules`, rules[1]);
            })
    }

    if (snat && snat[1]) {
        const x = digSnatConfig(snat[1], configTree, rx);
        config.push(...x.config);
        logger.debug(`[${vsName}] found snat configuration`, snat[1])
    }

    if (policies && policies[1]) {
        // add ltp destination mapping
        const x = digPolicyConfig(policies[1], configTree, rx);
        config.push(...x.config);
        logger.debug(`[${vsName}] found the following policies`, policies[1]);
    }

    if (persistence && persistence[1]) {
        const x = digPersistConfig(persistence[1], configTree, rx);
        config.push(...x.config);
        logger.debug(`[${vsName}] found the following persistence`, persistence[1]);
    }

    if (fallBackPersist && fallBackPersist[1]) {
        const x = digFbPersistConfig(fallBackPersist[1], configTree);
        config.push(...x.config);
        logger.debug(`[${vsName}] found the following persistence`, fallBackPersist[1]);
    }

    // remove any duplicate entries
    config = uniqueList(config);

    // removed empty values and objects
    cleanObject(config);
    cleanObject(map);

    return { config, map };

}

/**
 * get full pool config and supporting node/monitor configs
 * @param poolName 
 */
function digPoolConfig(poolName: string, configObject: BigipConfObj, rx: TmosRegExTree) {

    logger.debug(`digging pool config for ${poolName}`);

    // const rx = this.rx.vs.pool; // get needed rx sub-tree

    const config = [];
    const map = [];

    const poolConfig = pathValueFromKey(configObject.ltm.pool, poolName)

    if (poolConfig) {

        config.push(`ltm pool ${poolName} {${poolConfig.value}}`);
        const members = poolConfig.value.match(rx.vs.pool.members);
        const monitors = poolConfig.value.match(rx.vs.pool.monitors);

        if (members && members[1]) {

            // TODO:  move all these regex's to the rx tree

            // dig node information from members
            const nodeNames = members[1].match(rx.vs.pool.nodesFromMembers);
            // const nodeAddresses = members[1].match(rx.n)

            // regular pool member definition regex
            const memberDef = members[1].match(/(\/[\w\-\/.]+:\d+) {\s+address(.+?)\s+}/g)

            // fqdn pool member definition regex
            const memberFqdnDef = members[1].match(/(\/[\w\-\/.]+:\d+) {\s+fqdn {\s+([\s\S]+?)\s+}\s+}/g)

            logger.debug(`Pool ${poolName} members found:`, nodeNames);

            if (memberDef) {
                memberDef.forEach((el: string) => {
                    const name = el.match(/(\/[\w\-\/.]+)/);
                    const port = el.match(/(?<=:)\d+(?= )/);
                    const addr = el.match(/(?<=address )[\d.]+/);

                    const x = pathValueFromKey(configObject.ltm.node, name[0])
                    config.push(`ltm node ${x.key} {${x.value}}`);
                    map.push(`${addr}:${port}`)
                })
            }

            if (memberFqdnDef) {
                memberFqdnDef.forEach((el: string) => {
                    // const memberFqdnNames = el.match(/([\s\S]+?)\n/g);
                    const name = el.match(/(\/[\w\-\/.]+)/);
                    const port = el.match(/(?<=:)\d+(?= )/);

                    const a = pathValueFromKey(configObject.ltm.node, name[0]);

                    config.push(`ltm node ${a.key} {${a.value}}`);
                    map.push(`${name}:${port}`)
                })
            }
        }

        if (monitors && monitors[1]) {

            //dig monitor configs like pool members above
            const monitorNames = monitors[1].split(/ and /);
            logger.debug('pool monitor references found:', monitorNames);

            // eslint-disable-next-line prefer-const
            const monitorNameConfigs = [];
            monitorNames.forEach(name => {

                // new way look for key in .ltm.monitor
                const x = pathValueFromKey(configObject.ltm.monitor, name)
                if (x) {
                    // rebuild tmos object
                    monitorNameConfigs.push(`ltm monitor ${x.path} ${x.key} {${x.value}}`);
                }
            })

            logger.debug('pool monitor configs found:', monitorNameConfigs);
            const defaultMonitors = monitorNames.length - monitorNameConfigs.length

            if (defaultMonitors) {
                logger.debug(`[${poolName}] references ${defaultMonitors} system default monitors, compare previous arrays for details`)
            }

            if (monitorNameConfigs) {
                // monitorNameConfigs.join('\n');
                config.push(...monitorNameConfigs);

            }
        }
    }
    return { config, map };
}






function digProfileConfigs(profilesList: string, configObject: BigipConfObj, rx: TmosRegExTree) {

    // regex profiles list to individual profiles
    const profileNames = profilesList.match(rx.vs.profiles.names);
    logger.debug(`profile references found: `, profileNames);

    const config = [];
    const map = [];
    profileNames.forEach(name => {

        // check the ltm profiles
        const x = pathValueFromKey(configObject.ltm.profile, name);
        if (x) {
            config.push(`ltm profile ${x.path} ${x.key} {${x.value}}`);
        }

        // check apm profiles
        const y =  pathValueFromKey(configObject.apm.profile, name);
        if (y) {
            config.push(`apm profile access ${y.path} ${y.key} {${y.value}}`);
        }

    })

    const defaultProfiles = profileNames.length - config.length;
    if (defaultProfiles) {
        logger.debug(`Found ${defaultProfiles} system default profiles, compare previous arrays for details`)
    }
    // return config.join('\n');
    return { config, map };
}







/**
 * 
 * @param rulesList raw irules regex from vs dig
 */
async function digRuleConfigs(rulesList: string, configObject: BigipConfObj, rx: TmosRegExTree) {

    const ruleNames = rulesList.match(rx.vs.rules.names);
    logger.debug(`rule references found: `, ruleNames);

    // list of rules on the vs
    const iRuleConfigs = [];
    // config list to return (includes irules and other objects referenced by irules)
    const config = [];

    type ruleMap = {
        pools?: string[] | string[][],
        virtuals?: string[]
        nodes?: string[]
    }

    // final config object
    const obj = {
        config: []
    }

    const map: ruleMap = {};

    await ruleNames.forEach(async name => {
        // search config, return matches
        const x = pathValueFromKey(configObject.ltm.rule, name)

        if (x) {
            iRuleConfigs.push(`ltm rule ${x.key} {${x.value}}`);

            const iRulePools = poolsInRule(x.value);
            if (iRulePools) {

                // for each pool reference found, get config
                iRulePools.forEach(el => {

                    // if no "/", this is a "/Common/" partition rule
                    if (/\//.test(el[0])) {
                        // found slash, so has parition prefix
                        const poolC = digPoolConfig(el[0], configObject, rx);

                        if (poolC) {
                            // obj.config.push(poolC.config[0]);
                            config.push(poolC.config[0]);
                            // deepMergeObj(obj, { map: { pools: poolC.map }})
                            map.pools = poolC.map;
                        }

                    } else {

                        // no slash, so adding commond partition prefix
                        const poolC = digPoolConfig(`/Common/${el[0]}`, configObject, rx);

                        if (poolC) {
                            // obj.config.push(poolC.config[0]);
                            config.push(poolC.config[0]);
                            // deepMergeObj(obj, { map: { pools: poolC.map }})
                            map.pools = poolC.map;
                        }
                    }
                })
                // add pools to map
                map.pools = iRulePools;
            }


            // if we have any internal data-groups, find data groups in irule
            if(configObject.ltm['data-group']?.internal) {

                const dataGroups = Object.keys(configObject.ltm['data-group'].internal)
                if (dataGroups.length > 0) {
                    await digDataGroupsiniRule(x.value, dataGroups)
                        .then(async dgNamesInRule => {
                            await dgNamesInRule.forEach(async dg => {
                                const dgBody = configObject.ltm['data-group'].internal[dg];
                                const fullDgConfig = `ltm data-group internal ${dg} { ${dgBody} }`
                                config.push(fullDgConfig);
                            })
                        })
                }
            }
        }
    })

    const defaultRules = ruleNames.length - iRuleConfigs.length;
    if (defaultRules) {
        logger.debug(`Found ${defaultRules} system default iRules, compare previous arrays for details`)
    }

    // add the irules to the beginning of the config array to be returned
    config.unshift(...iRuleConfigs);

    return { config, map };
}








/**
 * analyzes vs snat config, returns full snat configuration if pool reference
 * @param snat vs snat reference as string
 */
function digSnatConfig(snat: string, configObject: BigipConfObj, rx: TmosRegExTree) {
    const config = [];
    const map = [];
    if (snat.includes('pool')) {
        const snatName = snat.match(rx.vs.snat.name);
        if (snatName) {
            const x = pathValueFromKey(configObject.ltm.snatpool, snatName[1])
            config.push(`ltm snatpool ${x.key} {${x.value}}`);
        } else {
            logger.error(`Detected following snat pool configuration, but did not find in config [${snat}]`)
        }
    } else {
        logger.debug(`snat configuration detected, but no pool reference found, presume -> automap`)
    }
    return { config, map };
}





/**
 * loops through vs ltp list and returns full ltp configs
 * @param ltPolicys vs ltp config
 */
function digPolicyConfig(policys: string, configObject: BigipConfObj, rx: TmosRegExTree) {

    // regex local traffic list to individual profiles
    const policyNames = policys.match(rx.vs.ltPolicies.names);
    logger.debug(`policy references found: `, policyNames);

    const config = [];
    const map = [];

    // get policy references from vs
    policyNames.forEach(name => {

        const x = pathValueFromKey(configObject.ltm.policy, name)

        if (x) {
            logger.debug(`policy found [${x.key}]`);
            config.push(`ltm policy ${x.key} {${x.value}}`)

            // got through each policy and dig references (like pools)
            const pools = poolsInPolicy(x.value)

            if (pools) {
                pools.forEach(pool => {
                    const cfg = pathValueFromKey(configObject.ltm.pool, pool)
                    // if we got here there should be a pool for the reference, 
                    // but just in case, we confirm with (if) statement
                    if (cfg) {
                        // push pool config to list
                        logger.debug(`policy [${x.key}], pool found [${cfg.key}]`);
                        config.push(`ltm pool ${cfg.key} {${cfg.value}}`)
                    }
                })
            }


        } else {
            logger.error(`Could not find ltPolicy named: ${name}`)
        }

    })

    // removde duplicates
    // const unique = uniqueList(config);
    // join list with line returns to return a single config string
    // return unique.join('\n');
    return { config, map };
}


/**
 * removes duplicates
 * @param x list of strings
 * @return list of unique strings
 */
export function uniqueList(x: string[]) {
    return Array.from(new Set(x));
}




/**
 * get persistence config
 * @param persistence vs persistence referecne
 */
function digPersistConfig(persist: string, configObject: BigipConfObj, rx: TmosRegExTree) {

    const config = [];
    const map = [];

    const persistName = persist.match(rx.vs.persist.name);
    if (persistName) {
        const x = pathValueFromKey(configObject.ltm.persistence, persistName[1])
        if (x) {
            config.push(`ltm persistence ${x.path} ${x.key} {${x.value}}`);
        }
    }
    return { config, map };
}





/**
 * get fall back persistence config
 * @param fbPersist vs fallback-persistence
 */
function digFbPersistConfig(fbPersist: string, configObject: BigipConfObj) {

    const config = [];
    const map = [];
    const x = pathValueFromKey(configObject.ltm.persistence, fbPersist);
    if (x) {
        config.push(`ltm persistence ${x.path} ${x.key} {${x.value}}`);
    }
    return { config, map };
}



/**
 * get hostname from json config tree (if present)
 * @param configObject to search for hostname
 */
export function getHostname(configObject: BigipConfObj): string {

    if (configObject?.sys?.['global-settings']) {

        const hostname = configObject.sys["global-settings"].match(/hostname ([\w-.]+)\s/)

        if (hostname && hostname[1]) {
            // return just capture group
            return hostname[1];
        }
    }
}


