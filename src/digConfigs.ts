
'use strict';

import logger from './logger';
import { BigipConfObj, TmosApp } from './models'
import { RegExTree } from './regex';
import { pathValueFromKey } from './objects';
import { poolsInPolicy } from './pools';


/**
 * scans vs config, and discovers child configs
 * @param vsName virtual server name
 * @param vsConfig virtual server tmos config body 
 */
export async function digVsConfig(vsName: string, vsConfig: BigipConfObj["ltm"]['virtual']['key'], configTree: BigipConfObj, rx: RegExTree) {

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

    // clone the app config
    const tmpObj = JSON.parse(JSON.stringify(vsConfig));

    // move and recrate the original config line
    delete tmpObj.line;
    const originalCfg = `ltm virtual ${vsName} {${vsConfig.line}}`
    tmpObj.lines = [originalCfg];
    const appObj = tmpObj as TmosApp;

    if (appObj.pool) {
        // dig pool details
        // just reassign the parsed pool details into the vs
        const body = configTree.ltm.pool[vsConfig.pool];
        appObj.lines.push(`ltm pool ${appObj.pool} {${body.line}}`);
        // raw copy the pool config
        appObj.pool = JSON.parse(JSON.stringify(configTree.ltm.pool[vsConfig.pool]));
        delete appObj.pool.line;

        if(appObj.pool?.members) {

            Object.keys(appObj.pool?.members).forEach( n => {
                // loop through all the pool members and get the node details
                const name = n.split(':')[0];
                const body = configTree.ltm.node[name]
                if (body) {
                    appObj.lines.push(`ltm node ${name} {${body.line}}`);
                }
    
            })
        }
    }

    if (appObj.profiles) {
        // dig profiles details

        // todo: dig profiles deeper => deep parse profiles/settings

        appObj.profiles.forEach(name => {
            // check the ltm profiles
            const x = pathValueFromKey(configTree.ltm?.profile, name);
            if (x) {
                appObj.lines.push(`ltm profile ${x.path} ${x.key} {${x.value}}`);
            }

            // check apm profiles
            const y = pathValueFromKey(configTree?.apm?.profile?.access, name);
            if (y) {
                appObj.lines.push(`apm profile access ${y.path} ${y.key} {${y.value}}`);
            }

            // check asm profile
            const z = pathValueFromKey(configTree?.asm?.policy, name);
            if (z) {
                appObj.lines.push(`asm policy ${z.path} ${z.key} {${z.value}}`);
            }
        })
    }

    if (appObj.rules) {
        // dig iRule details

        // todo: dig deeper like digRuleConfigs() in digConfigs.ts.331
        appObj.rules.forEach(name => {

            const x = pathValueFromKey(configTree.ltm?.rule, name)
            if (x) {
                appObj.lines.push(`ltm rule ${x.key} {${x.value}}`);
            }
        })
    }

    if (appObj.snat) {
        // dig snat details

        // if this snat string is the name of a snat pool, then replace with snatpool details
        //  if not, then its 'automap' or 'none' => nothing to add here
        if (configTree.ltm.snatpool[vsConfig.snat]) {
            const c = JSON.parse(JSON.stringify(configTree.ltm.snatpool[vsConfig.snat]));
            appObj.lines.push(`ltm snatpool ${vsConfig.snat} { ${c.line} }`)
            delete c.line;
            appObj.snat = c;
        }
    }

    if (appObj.policies) {
        // dig profiles details
        appObj.policies.forEach(name => {

            const x = pathValueFromKey(configTree.ltm?.policy, name)
            if (x) {
                appObj.lines.push(`ltm policy ${x.key} {${x.value}}`);

                // got through each policy and dig references (like pools)
                const pools = poolsInPolicy(x.value)

                if (pools) {
                    pools.forEach(pool => {
                        const cfg = configTree.ltm.pool[pool]
                        // if we got here there should be a pool for the reference, 
                        // but just in case, we confirm with (if) statement
                        if (cfg) {
                            // push pool config to list
                            logger.debug(`policy [${x.key}], pool found [${cfg.name}]`);
                            appObj.lines.push(`ltm pool ${cfg.name} {${cfg.line}}`)
                        }
                    })
                }
            }
        })
    }

    if (appObj.persist) {
        // dig profiles details
        const x = pathValueFromKey(configTree.ltm?.persistence, appObj.persist)
        if (x) {
            appObj.lines.push(`ltm persistence ${x.path} ${x.key} {${x.value}}`);
        }
    }

    if (appObj['fallback-persistence']) {
        // dig profiles details
        const x = pathValueFromKey(configTree.ltm?.persistence, appObj['fallback-persistence'])
        if (x) {
            appObj.lines.push(`ltm persistence ${x.path} ${x.key} {${x.value}}`);
        }
    }

    return appObj;

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


