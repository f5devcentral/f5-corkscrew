


'use strict';


import { GslbApp, GtmConfObj } from "./models";
import { gtmRecordTypes } from "./objCounter";
import { RegExTree } from "./regex";
import { deepmergeInto } from "deepmerge-ts";




export class DigGslb {
    gtm: GtmConfObj;
    /**
     * this probably needs to be paired down to just the gtm rx we need like the input object
     */
    rx: RegExTree["gtm"];

    gtmRecordTypes = gtmRecordTypes;

    apps: GslbApp[] = [];

    // bring in the whole bigip config object since we don't have typing for just the gtm portion
    constructor(gtm: GtmConfObj, rx: RegExTree["gtm"]) {
        this.gtm = gtm;
        this.rx = rx;
    }

    async fqdns(app?: string): Promise<GslbApp[]> {

        // if (Object.keys(this.gtm?.wideip).length > 0) {
        //     return [];
        // }

        if (app) {

            // dig out single fqdn

        } else {

            gtmRecordTypes.forEach(type => {

                // make sure we have this object
                if (this.gtm?.wideip[type]) {

                    // loop through the object
                    for (const [key, value] of Object.entries(this.gtm.wideip[type])) {

                        let v = value as any;   // dangerious to cast any, but only way to get it working
                        let k = key as string;
                        const originalCfg = `gtm wideip ${type} ${k} {${v.line}}`

                        // clone the app config
                        const tmpObj = JSON.parse(JSON.stringify(v));
                        
                        // move and recrate the original config line
                        delete tmpObj.line;
                        tmpObj.lines = [ originalCfg ];
                        const appObj = tmpObj as GslbApp;
                        appObj.allPossibleDestinations = [];

                        // if we have iRules, try to parse them for responses/pool/destinations
                        if(appObj.iRules) {
                            // loop through each irule associated and dig out details
                            // add possible destinations or resposnes to the allPossibleDestinations array
                        }

                        if(appObj.pools) {

                            // dig each pool reference, replacing as we go
                            for (let poolRef of appObj.pools) {
    
                                // copy full pool details
                                const poolDetails = JSON.parse(
                                    JSON.stringify(this.gtm.pool[appObj.type][poolRef.name]));
                                const originalLine = `gtm pool ${poolDetails.type} ${poolRef.name} { ${poolDetails.line} }`;
                                appObj.lines.push(originalLine)
                                delete poolDetails.line;

                                if(poolDetails['fallback-ip']) {
                                    appObj.allPossibleDestinations.push(poolDetails['fallback-ip'])
                                }
    
                                if(poolDetails.members) {
    
                                    poolDetails.members.forEach( e => {
                                        const serverDetails = this.gtm.server[e.server];
                                        const originalLine = `gtm server ${e.server} { ${serverDetails.line} }`;
                                        const vServer = serverDetails['virtual-servers'][e.vs];

                                        const tPort = vServer["translation-port"] ? vServer["translation-port"] : '';
                                        const tAddress = vServer["translation-address"] ? vServer["translation-address"] : '';
                                        const tAddressPort = tPort ? `${tAddress}:${tPort}` : tAddress;
                                        const dest = tAddress ? `${vServer.destination}->NAT->${tAddressPort}` : vServer.destination

                                        appObj.allPossibleDestinations.push(dest)
                                        appObj.lines.push(originalLine);
                                        deepmergeInto(e, vServer);
                                    })
                                }
    
                                deepmergeInto(poolRef, poolDetails)
    
                            }
                        }

                        this.apps.push(appObj)
                    }
                }
            })

        }
        return this.apps;
    }

}

