/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';


export async function digDataGroupsiniRule(rule: string, dgNames: string[]): Promise<string[]> {
    //

    return dgNames.filter( dg => {
        // turn data-group name into an rx
        const dgRx = new RegExp(dg);

        // does the irule contain the full dg name?
        if (dgRx.test(rule)) {
            
            // true => return the dg name
            return true;

        } else {

            // string the object name from the partition
            const shortDgName = dg.split('/').pop();
            // turn the short name into a rx
            const shortDgNameRx = new RegExp(shortDgName);
            // does the irule have the short name rx?
            if (shortDgNameRx.test(rule)) {
                // true => return the dg name
                return true;
            }

        }
    })
}