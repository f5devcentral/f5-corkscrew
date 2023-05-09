

'use strict';

import XRegExp from 'xregexp';
import { RegExTree } from './regex';
import { deepmergeInto } from 'deepmerge-ts';

import logger from './logger';
import { balancedRx1, balancedRxAll } from './tmos2json';


export async function parseDeep(obj: any, rx: RegExTree) {

    // GTM SERVER --------------------------------------------------
    if (obj.gtm?.server) {

        const key = Object.keys(obj.gtm.server)[0];
        let body = obj.gtm.server[key];
        obj.gtm.server[key] = { line: body };   // re-assign the original config string
        const sObj = obj.gtm.server[key];
        const devicesRx = body.match(rx.gtm.server.devices);
        const vsRx = body.match(rx.gtm.server["virtual-servers"]);

        // const serverObj: any = {}

        // if we detected gtm server devices
        if (devicesRx) {
            body = body.replace(devicesRx[0], '');  // remove this config piece from the body we are working with

            sObj.devices = []
            digBrackets(devicesRx[1]).forEach(x => {
                digBrackets(x.value).forEach(y => {

                    if (!sObj.devices[x.name]) sObj.devices[x.name] = {}

                    if (!sObj.devices[x.name][y.name]) sObj.devices[x.name][y.name] = []
                    // sObj.devices[x.name][y.name].push({: [] })    // initilaize the array
                    const dat = y.value.match(rx.gtm.server.dAddressT);
                    if (dat.groups.nat) {
                        const translation = dat.groups.nat
                        sObj.devices[x.name][y.name].push({ [dat.groups.ip]: { translation } });
                    } else {
                        sObj.devices[x.name][y.name].push({ [dat.groups.ip]: {} });
                    }
                })
            })

            // serverObj.devices = devices
            // return;
        }

        // if we detected gtm server, virtual-servers
        if (vsRx) {
            body = body.replace(vsRx[0], '');

            sObj['virtual-servers'] = []

            // there is a bunch of stuff to try to parse here, so, I'm just gonna dig out the important stuff...

            // this approach, was really a bunch of work for almost no return.
            // sugguest just regex parsing out the important information 
            //      if deeper parsing is needed, they can be expanded as needed
            //      this was basically very over complicated for minimal return
            //          *** do it like the wideip parsing -> everything is regex and simple loops ***

            digBrackets(vsRx[1]).forEach(x => {
                // initialize the object
                sObj['virtual-servers'][x.name] = {}
                if (x.value.includes('{')) {
                    digBrackets(x.value).forEach(y => {

                        const nyv = y.value.replace('} /', '}\n/')
                        sObj['virtual-servers'][x.name][y.name] = nyv.split('\n')

                        const fullS = `${y.name} { ${y.value} }`
                        const rest = x.value.replace(fullS, '')
                        rest.trim().split(' ').forEach((v, i, a) => {
                            if (i % 2 === 0) {
                                sObj['virtual-servers'][x.name][v] = a[i + 1];
                            }
                        });
                    })

                } else {
                    x.value.split(' ').forEach((v, i, a) => {
                        // if odd number (index starts at 0)
                        if (i % 2 === 0) {
                            // use the odd number as the key, and the next array item as the value
                            sObj['virtual-servers'][x.name][v] = a[i + 1]
                        }

                    });
                }
            })
        }

        // test function to handle what is below, so it can be reused
        const rest = keyValuePairs(body)
        deepmergeInto(sObj, rest);

        // at this point, the rest of the server config options should be single line touples [string, string]
        // so, split the lines, then split on the space, make object parameters {[0]: [1]}
        //      this will keep the regexing to a minimum
        //   if this approach doesn't work out, we will just have to regex all the lines
        // got this working, but regex approach is still recommended
        // body = body.trim()
        // body = body.split('\n')
        //     .forEach(b2 => {
        //         const b3 = b2.trim().split(' ')
        //         sObj[b3[0]] = b3[1];
        //     })

        // todo:  trim the body and see if anything is leftover
        //      Log an error that we missed something in extra parsing
        //      this should happen after EVERY option this function


        // GTM POOL --------------------------------------------------
    } else if (obj.gtm?.pool) {

        const dnsType = Object.keys(obj.gtm.pool)[0]    // there should always only be one key at this point
        const poolName = Object.keys(obj.gtm.pool[dnsType])[0]
        let body = obj.gtm.pool[dnsType][poolName];
        obj.gtm.pool[dnsType][poolName] = { line: body };   // re-assign the original config string
        const sObj = obj.gtm.pool[dnsType][poolName];  // local var the object we are working with

        sObj.type = dnsType;    // add dns type to object body

        const lbModeRx = body.match(rx.gtm.pool['load-balancing-mode']);
        const amRx = body.match(rx.gtm.pool['alternate-mode']);
        const fbModeRx = body.match(rx.gtm.pool['fallback-mode']);
        const fbIpRx = body.match(rx.gtm.pool['fallback-ip']);
        const vmaRx = body.match(rx.gtm.pool['verify-member-availability']);

        // regex out all the IMPORTANT details (not everything)


        if (lbModeRx) {
            // if regex found, add details to pool object
            sObj['load-balancing-mode'] = lbModeRx[1];
            // remove this config from original so other abstraction processes have a clear view
            body = body.replace(lbModeRx[0], '');
        }

        if (amRx) {
            sObj['alternate-mode'] = amRx[1];
            body = body.replace(amRx[0], '');
        }

        if (fbModeRx) {
            sObj['fallback-mode'] = fbModeRx[1];
            body = body.replace(fbModeRx[0], '');
        }

        if (fbIpRx) {
            sObj['fallback-ip'] = fbIpRx[1];
            body = body.replace(fbIpRx[0], '');
        }

        if (vmaRx) {
            sObj['verify-member-availability'] = vmaRx[1];
            body = body.replace(vmaRx[0], '');
        }

        const poolsMembersGroupRx = body.match(rx.gtm.pool.membersGroup);

        if (poolsMembersGroupRx) {

            sObj.members = []
            // capture an array of the different pool member strings
            const memberDetailsG = poolsMembersGroupRx[1].match(rx.gtm.pool.membersDetailsG)
            if (memberDetailsG) {

                memberDetailsG.forEach(g => {
                    // break down the individual pool member details
                    const d = g.match(rx.gtm.pool.membersDetails)

                    if (d) {

                        const memberObj = {
                            server: d.groups.server,
                            vs: d.groups.vs
                        }

                        // loop through the body lines and convert to object params
                        d.groups.body.split('\n').forEach(dg => {
                            const ss = dg.split(' ')
                            memberObj[ss[0]] = ss[1];
                        })

                        // now look up the server and find the final details like server/vs IP:Port

                        sObj.members.push(memberObj)
                    }

                })

            }
        }

        // GTM WIdEIP --------------------------------------------------
    } else if (obj.gtm?.wideip) {

        const dnsType = Object.keys(obj.gtm.wideip)[0]    // there should always only be one key at this point
        const wipName = Object.keys(obj.gtm.wideip[dnsType])[0]
        let body = obj.gtm.wideip[dnsType][wipName];
        obj.gtm.wideip[dnsType][wipName] = { line: body };   // re-assign the original config string
        const sObj = obj.gtm.wideip[dnsType][wipName];  // local var the object we are working with
        const nameRx = wipName.match(rx.gtm.wideip.name);

        sObj.fqdn = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;
        sObj.type = dnsType;    // add dns type to object body

        const descriptionRx = body.match(rx.gtm.wideip.description)
        const lrpRx = body.match(rx.gtm.wideip.lastResortPool)
        const persistRx = body.match(rx.gtm.wideip.persistence)   // todo: move to rx tree
        const lbModeRx = body.match(rx.gtm.wideip['pool-lb-mode'])   // todo: move to rx tree
        const aliasesRx = body.match(rx.gtm.wideip.aliases)   // todo: move to rx tree
        const rulesRx = body.match(rx.gtm.wideip.rules)   // todo: move to rx tree
        const poolsParentRx = body.match(rx.gtm.wideip.poolsParent)   // todo: move to rx tree

        if (descriptionRx) {
            body = body.replace(descriptionRx[0], '');
            sObj.description = descriptionRx.groups.desc;
        }

        if (lrpRx) {
            body = body.replace(lrpRx[0], '');
            sObj['last-resort-pool'] = lrpRx.groups;
        }
        if (persistRx) {
            body = body.replace(persistRx[0], '');
            sObj.persistence = persistRx.groups.bool;
        }

        if (lbModeRx) {
            body = body.replace(lbModeRx[0], '');
            sObj.persistence = lbModeRx.groups.mode;
        }

        // capture 'aliases' parent obj
        if (aliasesRx) {
            body = body.replace(aliasesRx[0], '');
            const a = aliasesRx[1].trim().split(/\n +/);
            sObj.aliases = a;
        }

        // capture 'rules' parent obj
        if (rulesRx) {
            body = body.replace(rulesRx[0], '');
            const r = rulesRx[1].trim().split('\n');
            sObj.rules = r;
        }

        // capture 'pools' parent obj
        if (poolsParentRx) {
            sObj.pools = []
            body = body.replace(poolsParentRx[0], '');
            poolsParentRx[1].match(rx.gtm.wideip.pools)
                .forEach(x => {
                    const a = x.match(rx.gtm.wideip.poolDetails);
                    const mObj = { name: a.groups.name };  // initiate the object
                    if (a) {
                        a[2].split('\n')
                            .forEach(y => {
                                const n = y.trim().split(' ');
                                mObj[n[0]] = n[1];
                            });
                    }
                    sObj.pools.push(mObj);
                })
        }


        // EXAMPLE NEXT PARSING OBJECT --------------------------------------------------
    } else if (obj?.asm?.policy) {


        const key = Object.keys(obj.asm.policy)[0]; // only one policy at this point
        let body = obj.asm.policy[key];
        obj.asm.policy[key] = { line: body };   // re-assign the original config string
        const sObj = obj.asm.policy[key];

        const statusRx = body.match(rx.asm.status);
        // const bmRx = body.match(rx.asm['blocking-mode']);
        // const descRx = body.match(rx.asm.description);
        // const encodingRx = body.match(rx.asm.encoding);
        // const pbRx = body.match(rx.asm['policy-builder']);
        // const pTempRx = body.match(rx.asm['policy-template']);
        // const pTypeRx = body.match(rx.asm['policy-type']);
        // const ppRx = body.match(rx.asm['parent-policy']);

        if (statusRx) {
            body = body.replace(statusRx[0], '')
            sObj.status = statusRx.groups.bool;
        }

        const rest = keyValuePairs(body)
        deepmergeInto(sObj, rest);
        
        // if (bmRx) {
        //     body = body.replace(bmRx[0], '')
        //     sObj['blocking-mode'] = bmRx.groups.bm;
        // }

        // if (descRx) {
        //     sObj.description = descRx.groups.desc;
        // }

        // if (encodingRx) {
        //     sObj.encoding = encodingRx.groups.emc;
        // }

        // if (pbRx) {
        //     sObj['policy-builder'] = pbRx.groups.status;
        // }

        // if (pTempRx) {
        //     sObj['policy-template'] = pTempRx.groups.name;
        // }

        // if (pTypeRx) {
        //     sObj['policy-type'] = pTypeRx.groups.type;
        // }

        // if (ppRx) {
        //     sObj['parent-policy'] = ppRx.groups.name;
        // }

        // body;

        return;

        // APM Access Profiles --------------------------------------------------
    } else if (obj.apm?.profile?.access) {

        const key = Object.keys(obj.apm.profile.access)[0]; // only one policy at this point
        let body = obj.apm.profile.access[key];
        obj.apm.profile.access[key] = { line: body };   // re-assign the original config string
        const sObj = obj.apm.profile.access[key];

        const nameRx = key.match(rx.apm.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        const alRx = body.match(rx.apm['accept-languages']);
        const apRx = body.match(rx.apm['access-policy']);
        const lsRx = body.match(rx.apm['log-settings'])

        if (alRx) {
            body = body.replace(alRx[0], '');
            const langs = alRx.groups.langs.split(' ');
            sObj['accept-languages'] = langs;
        }

        if (apRx) {
            body = body.replace(apRx[0], '');
            sObj['access-policy'] = apRx.groups.name;
        }

        if (lsRx) {
            body = body.replace(lsRx[0], '');
            const profs = lsRx.groups.profiles.split('\n')
                .map(x => {
                    return x.trim()
                });
            sObj['log-settings'] = profs;
        }

        const rest = keyValuePairs(body)

        deepmergeInto(sObj, rest);


        // APM Access Profiles --------------------------------------------------
    } else if (obj.apm?.policy?.['access-policy']) {

        const key = Object.keys(obj.apm.policy['access-policy'])[0]; // only one policy at this point
        let body = obj.apm.policy['access-policy'][key];
        obj.apm.policy['access-policy'][key] = { line: body };   // re-assign the original config string
        const sObj = obj.apm.policy['access-policy'][key];

        /**
         * not sure we need to parse this at this time since we parsed
         *       the access profile for policy reference
         * 
         * keeping here for now (4.29.2023)
         */


        // LTM Virtual Server --------------------------------------------------
    } else if (obj.ltm?.virtual) {

        const key = Object.keys(obj.ltm.virtual)[0]; // only one policy at this point
        let body = obj.ltm.virtual[key];
        obj.ltm.virtual[key] = { line: obj.ltm.virtual[key] };   // re-assign the original config string
        const sObj = obj.ltm.virtual[key];

        const nameRx = key.match(rx.ltm.virtual.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        const destination = body.match(rx.ltm.virtual.destination);
        body = body.replace(destination[0], '');
        sObj.destination = destination[1];

        const descRx = body.match(rx.ltm.virtual.description);
        const poolRx = body.match(rx.ltm.virtual.pool);
        const profilesRx = body.match(rx.ltm.virtual.profiles);
        const rulesRx = body.match(rx.ltm.virtual.rules);
        const snatRx = body.match(rx.ltm.virtual.snat);
        const policiesRx = body.match(rx.ltm.virtual.policies);
        const persistenceRx = body.match(rx.ltm.virtual.persist);
        const fallBackPersistRx = body.match(rx.ltm.virtual.fbPersist);

        if (descRx) {
            body = body.replace(descRx[0], '');
            sObj.pool = descRx[1];
        }

        if (poolRx) {
            body = body.replace(poolRx[0], '');
            sObj.pool = poolRx[1];
        }

        if (profilesRx) {
            body = body.replace(profilesRx[0], '');
            const pList = profilesRx[1].match(rx.ltm.profiles.names);
            sObj.profiles = pList;
        }

        if (rulesRx) {
            body = body.replace(rulesRx[0], '');
            const list = rulesRx[1].match(rx.ltm.rules.names);
            sObj.rules = list;
        }

        if (snatRx) {
            body = body.replace(snatRx[0], '');
            const sd = snatRx[1].match(rx.ltm.snat.details);
            sObj.snat = sd.groups.pool
                ? sd.groups.pool
                : sd.groups.type;
        }

        if (policiesRx) {
            body = body.replace(policiesRx[0], '');
            const list = policiesRx[1].match(rx.ltm.ltPolicies.names);
            sObj.policies = list;
        }

        if (persistenceRx) {
            body = body.replace(persistenceRx[0], '');
            const persist = persistenceRx[1].match(rx.ltm.persist.name)[0];
            sObj.persist = persist as string;
        }

        if (fallBackPersistRx) {
            body = body.replace(fallBackPersistRx[0], '');
            sObj['fallback-persistence'] = fallBackPersistRx[1];
        }

        const rest = keyValuePairs(body)
        deepmergeInto(sObj, rest);



        // LTM pool --------------------------------------------------
    } else if (obj.ltm?.pool) {

        const key = Object.keys(obj.ltm.pool)[0]; // only one policy at this point
        let body = obj.ltm.pool[key];
        obj.ltm.pool[key] = { line: obj.ltm.pool[key] };   // re-assign the original config string
        const sObj = obj.ltm.pool[key];

        const nameRx = key.match(rx.ltm.virtual.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        // const membersGroupRx = body.match(rx.ltm.pool.membersGroup);

        balancedRxAll(body).matches.forEach(e => {
            body = e.rest;  // re-assign the leftover config string from the match

            // if we have a parent pool 'members' group
            if (e.prefaceKey === 'members') {
                sObj.members = {}   // instantiate the members object

                balancedRxAll(e.body).matches.forEach(f => {

                    const n = f.prefaceKey.match(rx.ltm.pool.name)

                    const mbrObj = {
                        // name: n.groups.name,
                        // partition: n.groups.partition,
                    }

                    if (f.body.includes('metadata')) {
                      // remove all the metadata junk...
                        const meta = balancedRx1('metadata {', f.body)
                        f.body = meta.rest;
                    }

                    if (f.body.includes('fqdn')) {
                        const fqdnRx = f.body.match(rx.ltm.pool.fqdn)
                        f.body = f.body.replace(fqdnRx[0], '')
                        const fqdnPBody: any = keyValuePairs(fqdnRx.groups.body);
                        fqdnPBody.fqdn = fqdnPBody.name;
                        delete fqdnPBody.name;
                        deepmergeInto(mbrObj, fqdnPBody);
                    }

                    // merge whatever is left 
                    const pBody = keyValuePairs(f.body)
                    deepmergeInto(mbrObj, pBody);

                    sObj.members[f.prefaceKey] = mbrObj

                })


            }

            // if monitor...
            // monitor min 2 of { /Common/gateway_icmp /Common/http /Common/http2 }
            if (e.prefaceKey.includes('monitor')) {
                // here we have a monitor OBJECT, so we need to parse it a little differently
                const qualifier = e.prefaceKey.slice(8)
                sObj.monitorQualifier = qualifier;
                sObj.monitor = e.body.trim().split(' ');
            }
        });

        // continue withe parsing monitors
        const monitorRx = body.match(rx.ltm.pool.monitors)

        if (monitorRx) {
            // monitors parse situation 1.  "requirement=>ALL", list of monitors
            // monitor /Common/app1_tcp_half_open_quick_monitor and /Common/http_head_f5 and /Common/http2_head_f5 and /Common/http and /Common/tcp_half_open
            body = body.replace(monitorRx[0], '');
            sObj.monitor = monitorRx[1].split(/ and /);
        }

        const remaining = keyValuePairs(body)
        deepmergeInto(sObj, remaining);

        // continue withe parsing profiles
        //      profiles is not really needed, but it's a nested object 
        //      and will conflict with parsing the rest of the details



    } else if (obj.ltm?.node) {

        const key = Object.keys(obj.ltm.node)[0]; // only one policy at this point
        let body = obj.ltm.node[key];
        obj.ltm.node[key] = { line: body };   // re-assign the original config string
        const sObj = obj.ltm.node[key];

        const nameRx = key.match(rx.ltm.virtual.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        const m = balancedRx1('fqdn {', body)

        if(m) {
            body = m.rest;
            const fqdnBody: any = keyValuePairs(m.body);
            fqdnBody.fqdn = fqdnBody.name;
            delete fqdnBody.name;
            deepmergeInto(sObj, fqdnBody);
        }

        const remaining = keyValuePairs(body)
        deepmergeInto(sObj, remaining);
        sObj;




    } else if (obj.ltm?.snatpool) {

        const key = Object.keys(obj.ltm.snatpool)[0]; // only one policy at this point
        let body = obj.ltm.snatpool[key];
        obj.ltm.snatpool[key] = { line: body };   // re-assign the original config string
        const sObj = obj.ltm.snatpool[key];

        const nameRx = key.match(rx.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        balancedRxAll(body).matches.forEach(e => {
            body = e.rest;
            sObj[e.prefaceKey] = e.body.trim().split(/\n +/);
        });

        sObj;




    } else if (obj.ltm?.monitor) {

        const monType = Object.keys(obj.ltm.monitor)[0]; // only one policy at this point
        const key = Object.keys(obj.ltm.monitor[monType])[0]; // only one policy at this point
        let body = obj.ltm.monitor[monType][key];
        obj.ltm.monitor[monType][key] = { line: body };   // re-assign the original config string
        const sObj = obj.ltm.monitor[monType][key];

        const nameRx = key.match(rx.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        const remaining = keyValuePairs(body)
        deepmergeInto(sObj, remaining);
        sObj;





    } else if (obj.security?.dos?.profile) {

        const key = Object.keys(obj.security.dos.profile)[0]; // only one policy at this point
        let body = obj.security.dos.profile[key];
        obj.security.dos.profile[key] = { line: body };   // re-assign the original config string
        const sObj = obj.security.dos.profile[key];

        const nameRx = key.match(rx.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        // going three layers deep since this is only for visibility
        balancedRxAll(body).matches.forEach(e => {
            body = e.rest;
            sObj[e.prefaceKey] = {}

            balancedRxAll(e.body).matches.forEach( f => {
                e.body = f.rest;
                sObj[e.prefaceKey][f.prefaceKey] = {}
                // sObj[e.prefaceKey][f.prefaceKey] = f.body
                balancedRxAll(f.body).matches.forEach( g => {
                    f.body = g.rest;
                    sObj[e.prefaceKey][f.prefaceKey][g.prefaceKey] = g.body
                    g;
                })
    
                const rst = keyValuePairs(f.body);
                deepmergeInto(sObj[e.prefaceKey][f.prefaceKey], rst)
                f;
            })

            const rst = keyValuePairs(e.body);
            deepmergeInto(sObj[e.prefaceKey], rst)
            e;
        });

        const remaining = keyValuePairs(body)
        deepmergeInto(sObj, remaining);
        sObj;




    } else if (obj.security?.['bot-defense']?.profile) {


        const key = Object.keys(obj.security['bot-defense'].profile)[0]; // only one policy at this point
        let body = obj.security['bot-defense'].profile[key];
        obj.security['bot-defense'].profile[key] = { line: body };   // re-assign the original config string
        const sObj = obj.security['bot-defense'].profile[key];

        const nameRx = key.match(rx.name);
        sObj.name = nameRx.groups.name;
        sObj.partition = nameRx.groups.partition;

        // going three layers deep since this is only for visibility
        balancedRxAll(body).matches.forEach(e => {
            body = e.rest;
            sObj[e.prefaceKey] = {}

            // this header definition is quoted AND has line returns
            //      so we have to treat it special...
            const h = e.body.match(/\n +headers "(?<body>[\w:, \-\n]+)"/)
            if(h) {
                e.body = e.body.replace(h[0], '')
                sObj[e.prefaceKey].headers = h.groups.body.split('\n');
            }

            balancedRxAll(e.body).matches.forEach( f => {
                e.body = f.rest;
                sObj[e.prefaceKey][f.prefaceKey] = f.body
                f;
            })

            const rst = keyValuePairs(e.body);
            deepmergeInto(sObj[e.prefaceKey], rst)
            e;
        });

        const remaining = keyValuePairs(body)
        deepmergeInto(sObj, remaining);
        
        return;


        // EXAMPLE NEXT PARSING OBJECT --------------------------------------------------
    } else if (obj.some?.thing) {

    }
}






/**
 * breaks down tmos config bracketed objects (recursive)
 * 
 * *** depricated -> use balancedRx1 or balancedRxAll ***
 * 
 * input (note the line returns and spacing)
 * 
 *    pools {
 *        /Common/portal.benlab.io_a_pool {
 *            order 0
 *        }
 *    }
 *
 * 
 * 
 * @param config raw f5 config body with line returns and spaces
 * @returns 
 * {
 *   name: "pools",
 *   value: "/Common/portal.benlab.io_a_pool { order 0 }",
 * }[]
 */
export function digBrackets(config: string): {
    name: string;
    value: string
}[] {

    // example input

    //    members {
    //        /Common/coreltm01_02:/Common/sslvpn_tcp443_vs {
    //            member-order 0
    //        }
    //    }

    // todo: remove any lines with no brackets -> this will prevent the rest of this function from choking
    // config = config() // this won't work since there are single lines within some of the bracketed objects

    // flatten the config so we don't have to worry about line returns and excessive spaces
    const cFlat = config.replace(/\n +/g, ' ').replace(/\n/, '')

    // loop through and get all the first level matched bracket objects
    const x1 = XRegExp.matchRecursive(cFlat, '{', '}', 'g', {
        valueNames: ['kkk', null, 'vvv', null],
    })

    // example bracketry...
    // [
    //     { name: "kkk", value: " members ", start: 0, end: 9, },
    //     { name: "vvv", value: " /Common/coreltm01_02:/Common/sslvpn_tcp443_vs { member-order 0 } ", start: 10, end: 76, }
    // ]

    // final array to store everything
    const x2: { name: string, value: string }[] = [];

    // rework the bracket matches into pairs that make sense
    x1.forEach((v, i) => {
        if (v.name === 'kkk' && x1[i + 1]) {
            const nv = x1[i + 1].value;
            x2.push({ name: v.value.trim(), value: nv.trim() });
            // } else if( i === x1.length - 1 && v.value.trim() != '') {
            //     x2.push({ name: 'r', value: v.value})
        }
    })

    // example final output
    // {
    //     name: "members",
    //     value: "/Common/coreltm01_02:/Common/sslvpn_tcp443_vs { member-order 0 }",
    // }

    return x2;
}


export function keyValuePairs(body: string) {
    const obj = {}
    body = body.trim();
    body.split('\n')
        .forEach(line => {

            // catches lines/strings, with quotes (which include spaces)
            //      example:  description "yabba dappa doo!"
            const m = line.match(/(?<key>[\w]+) "(?<value>[\S\s]+)"/)
            const n = line.match(/(?<key>[\w]+) '(?<value>[\S\s]+)'/)

            if(m) {

                body = body.replace(m[0], '')
                obj[m.groups.key] = m.groups.value

            } if (n) {

                body = body.replace(n[0], '')
                obj[n.groups.key] = n.groups.value

            } else {

                const a = line.trim().split(' ')
                if (a[0] && a[1]) {
                    obj[a[0]] = a[1];
                }
            }
        })

    return obj;
}