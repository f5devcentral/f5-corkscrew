


'use strict';

import balanced from 'balanced-match';
import XRegExp from 'xregexp';
import { GslbApp, GtmConfObj, GtmPool, GtmRecordTypes, TmosRegExTree } from "./models";
import { gtmRecordTypes } from "./objCounter";
import { GtmRegexTree } from "./regex";
import { tmosChildToObj } from "./tmos2json";



export class DigGslb {
    gtm: GtmConfObj;
    /**
     * this probably needs to be paired down to just the gtm rx we need like the input object
     */
    rx: GtmRegexTree;

    gtmRecordTypes = gtmRecordTypes;

    apps: GslbApp[] = [];

    // bring in the whole bigip config object since we don't have typing for just the gtm portion
    constructor(gtm: GtmConfObj, rx: GtmRegexTree) {
        this.gtm = gtm;
        this.rx = rx;
    }

    async fqdns(app?: string) {

        // if (Object.keys(this.gtm?.wideip).length > 0) {
        //     return [];
        // }

        if (app) {

            // dig out single fqdn

        } else {

            gtmRecordTypes.forEach(t => {

                // make sure we have this object
                if (this.gtm.wideip[t]) {

                    // loop through the object
                    for (const [key, value] of Object.entries(this.gtm.wideip[t])) {

                        let v = value as string;
                        let k = key as string;
                        const originalCfg = `gtm wideip ${t} ${k} {${v}}`
                        const nameRx = v.match(this.rx.wideip.name)

                        const appObj: GslbApp = {
                            fqdn: nameRx.groups.name,
                            type: t as GtmRecordTypes,
                            partition: nameRx.groups.partition,
                            configs: [
                                originalCfg
                            ]
                        }

                        // last-resort-pool config line work
                        const lrpRx = v.match(this.rx.wideip.lastResortPool)
                        if (lrpRx) {
                            // remove the last-resort-pool value if we got it
                            v = v.replace(lrpRx[0], '');
                            // add it to the app config object
                            appObj['last-resort-pool'] = lrpRx.groups;
                        }

                        // flatten the rest of the config so we can parse out the bracketed chucks
                        const vFlat = v.replace(/\n +/g, ' ').replace(/\n/, '')


                        const aa = XRegExp.matchRecursive(vFlat, '{', '}', 'g', {
                            valueNames: ['kkk', null, 'vvv', null],
                        }).filter(x => x.value != '\n')

                        const bb = [];
                        aa.forEach((v, i) => {
                            if (v.name === 'kkk') {
                                const nv = aa[i + 1].value;
                                bb.push({ name: v.value.trim(), value: nv.trim() });
                            }
                        });

                        bb.forEach(b => {
                            if (b.name === 'aliases') {
                                appObj['aliases'] = b.value.split(' ');
                            } else if (b.name === 'pools') {
                                // appObj.pools = []
                                // dig each pool function
                                appObj.pools = this.digPools(b.value, appObj);

                            } else if (b.name === 'rules') {

                            }
                        })



                        const some1 = tmosChildToObj(value as string)


                    }

                }

            })



        }
        // }
    }

    /**
     * 
     * @param k key 
     * @param v 
     */
    bo(k: string, v: string): any {

    }

    /**
     * 
     * @param v pool string from wideip parse
     * @param t pool type, has to match wideip type
     * @returns 
     */
    digPools(v: string, app: GslbApp) {
        const example = "/Common/bigiq.benlab.io_pool { order 0 } /Common/esxi01.benlab.io { order 1 } /Common/esxi02.benlab.io { order 2 }"

        const pools:GtmPool[] = [];

        const pb1 = XRegExp.matchRecursive(v, '{', '}', 'g', {
            valueNames: ['kkk', null, 'vvv', null],
        })

        const pb2:{ name: string, value: string}[] = [];
        pb1.forEach((v, i) => {
            if (v.name === 'kkk') {
                const nv = pb1[i + 1].value;
                pb2.push({ name: v.value.trim(), value: nv.trim() });
            }
        })

        // now loop through pb2 and dig the full pool details from this.gtm.pool.<name>
        pb2.forEach(p => {
            const f1 = this.gtm.pool[app.type][p.name];
            const originalCfg = `gtm pool ${app.type} ${p.name} {${f1}}`;
            const order = +p.value.split(' ')[1];

            const pool: GtmPool = {
                name: p.name,
                type: app.type,
                order
            }
            
            const lbMode = f1.match(this.rx.pool['load-balancing-mode']);
            if(lbMode) {
                pool['load-balancing-mode'] = lbMode[1];
            }

            const aM = f1.match(this.rx.pool['alternate-mode']);
            if(aM) {
                pool['alternate-mode'] = aM[1];
            }
            
            const fbMode = f1.match(this.rx.pool['fallback-mode']);
            if(fbMode) {
                pool['fallback-mode'] = fbMode[1];
            }
            
            const fbIp = f1.match(this.rx.pool['fallback-ip']);
            if(fbIp) {
                pool['fallback-ip'] = fbIp[1];
            }
            
            app.configs.push(originalCfg);

            pools.push(pool);
        })

        return pools;
    }

}