

import logger from "./logger";

// /**
//  * This file servers as the central place for all regex's, we'll call it a regex tree
//  * 
//  * The idea here is to create a base regex object tree, based on v14/v15 code
//  *  if/when any changes in config structure that require tweaks to the regex tree
//  *  only those changes will need to be configured in a tree for each respective 
//  *  configuration deviatione (ex v16), then merged with the default/base regex tree
//  *  
//  * Need to find a better way to do regex's across the package.  The regular "match",
//  *  on string function works, but also returns the entire full match in [0], then
//  *  capture groups as nested array on [1].  
//  *  - I know there is plenty of improvements to be made by only returning the match capture group [1]
//  *  - and defining better capture groups (probably include lookarounds)
//  * 
//  * Need to also look into if .matchAll will help.  Seems to be available in NodeJS, 
//  *  only in ECMA2020 TypeScript
//  */

/**
 * Regex Tree used for searching configs
 */
export class RegExTree {

    tmosVersion: string;

    /**
     * extracts tmos version at beginning of bigip.conf
     */
    tmosVersionReg = /#TMSH-VERSION: (\d.+)/;

    /**
     * captures name and body from single tmos object
     * if match, returns object name in [1] object value in [2]
     * 1/23/2021 - now includes capture groups
     *  - name = tmos object name
     *  - body = tmos object body
     */
    parentNameValue = /^(?<name>[ \w\-\/.]+) {(?<body>([\s\S]+| ))}(\n)$/;

    /**
     * Parent tmos object regex
     * Extracts each parent tmos object starting with 
     *  (apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom), 
     *  then "{" and ending "}" just before next partent object
     */
    parentObjects = multilineRegExp([
        // parent level object beginnings with trailing space
        /(apm|ltm|gtm|asm|security|net|pem|sys|wom|ilx|auth|analytics|wom) /,
        // include any child object definitions and object name
        /[ \w\-\/.]+/,
        // capture single line data or everything till "\n}\n"
        /({.*}\n|{[\s\S]+?\n}\n)/,
        // look forward to capture the last "}" before the next parent item name
        /(?=(apm|ltm|gtm|asm|security|net|pem|sys|wom|ilx|auth|analytics|wom|---end---))/
    ], 'g');

    /**
     * used for abstracting partition from name
     */
    name = /(?<partition>(\/[\w\d_\-.]+\/[\w\d_\-.]+\/|\/[\w\d_\-.]+\/))(?<name>[\w\d_\-.]+)/;

    ltm = {
        virtual: {
            name: /(?<partition>(\/[\w\d_\-.]+\/[\w\d_\-.]+\/|\/[\w\d_\-.]+\/))(?<name>[\w\d_\-.]+)/,
            destination: /destination [\w.\-\/]+\/([\d.]+:\d+)/,
            description: /\n +description "(?<desc>[\w' .-/]+)"\n/,
            pool: /(?<!source-address-translation {\n\s+)    pool (.+?)\n/,
            profiles: /profiles {([\s\S]+?)\n    }\n/,
            rules: /rules {([\s\S]+?)\n    }\n/,
            snat: /source-address-translation {([\s\S]+?)\n    }\n/,
            policies: /policies {([\s\S]+?)\n    }\n/,
            persist: /persist {([\s\S]+?)\n    }\n/,
            fbPersist: /fallback-persistence (\/\w+.+?)\n/,
            vlans: /vlans {([\s\S]+?)\n    }\n/,
        },
        pool: {
            name: /(?<partition>(\/[\w\d_\-.]+\/[\w\d_\-.]+\/|\/[\w\d_\-.]+\/))(?<name>[\w\d_\-.]+)/,
            membersGroup: /members {([\s\S]+?)\n    }\n/,
            members: /(?<name>[\w\-\/:.]+) {\n +(?<body>[\s\S]+?)\n +}/g,
            member: /(?<name>[\w\-\/:.]+) {\n +(?<body>[\s\S]+?)\n +}/,
            fqdn: /fqdn {\n +(?<body>[\s\S]+?)\n +}/,
            memberDef: /(\/[\w\-\/.]+:\d+) {\s+address(.+?)\s+}/g,
            memberFqdnDef: /(\/[\w\-\/.]+:\d+) {\s+fqdn {\s+([\s\S]+?)\s+}\s+}/g,
            nodesFromMembers: /(\/\w+\/.+?)(?=:)/g,
            monitors: /monitor (?:min \d of )?([{}\/\w. ]+)/
        },
        profiles: {
            asmProf: /ASM_([\w-.]+)/,
            names: /(\/[\w\-\/.]+)/g
        },
        rules: {
            names: /(\/[\w\-\/.]+)/g
        },
        snat: {
            details: /(pool (?<pool>[\w.\/]+)?)|(type (?<type>(none|automap|snat)?))/,
            name: /pool (\/[\w\-\/.]+)/
        },
        ltPolicies: {
            asmRef: /asm (?<status>enable|disable) policy (?<policy>[\w\/._]+)/,
            names: /(\/[\w\-\/.]+)/g
        },
        persist: {
            name: /(\/[\w\-\/.]+)/
        },

    }


    gtm = {
        wideip: {
            name: /(?<partition>(\/[\w\d_\-.]+\/[\w\d_\-.]+\/|\/[\w\d_\-.]+\/))(?<name>[\w\d_\-.]+)/,
            description: /description "(?<desc>[\w' .-/]+)"\n/,
            persistence: /persistence (?<bool>\w+)/,
            'pool-lb-mode': /pool-lb-mode (?<mode>\w+)/,
            aliases: /aliases {([\s\S]+?)\n    }\n/,
            rules: /rules {([\s\S]+?)\n    }\n/,
            lastResortPool: /last-resort-pool (?<type>\w+) (?<value>[\/\w.]+)/,
            poolsParent: /pools {([\s\S]+?)\n    }\n/,
            pools: /(?<name>[\w\-\/.]+) {\n +(?<body>[\s\S]+?)\n +}/g,
            poolDetails: /(?<name>[\w\-\/.]+) {\n +(?<body>[\s\S]+?)\n +}/
        },
        pool: {
            membersGroup: /members {([\s\S]+?)\n    }\n/,
            membersDetails: /(?<server>[\/\w\-.]+):(?<vs>[\/\w\-.]+) {\n +(?<body>[\s\S]+?)\n +}/,
            membersDetailsG: /(?<server>[\/\w\-.]+):(?<vs>[\/\w\-.]+) {\n +(?<body>[\s\S]+?)\n +}/g,
            'load-balancing-mode': /\n +load-balancing-mode (?<mode>[\S]+)/,
            'alternate-mode': /\n +alternate-mode (?<mode>[\S]+)/,
            'fallback-mode': /\n +fallback-mode (?<mode>[\S]+)/,
            'fallback-ip': /\n +fallback-ip (?<ip>\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3})/,
            'verify-member-availability': /\n +verify-member-availability (?<flag>[\S]+)/,
        },
        server: {
            devices: /devices {([\s\S]+?)\n    }\n/,
            devicesG: /(?<server>[\/\w\-.]+) {([\s\S]+?)\n    }\n/g,
            dAddressT: /(?<ip>\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}) { (translation (?<nat>[\d.]+) )?}/,
            'virtual-servers': /virtual-servers {([\s\S]+?)\n    }\n/,
            vs: {
                'depends-on': / /,
            }
        }
    }

    asm = {
        status: /\n +(?<bool>active|inactive)\n/,
        'blocking-mode': /\n +blocking-mode (?<bm>enabled|disabled)\n/,
        description: /\n +description "(?<desc>[\w' .-/]+)"\n/,
        encoding: /\n +encoding (?<enc>[\w]+)\n/,
        'policy-builder': /\n +policy-builder (?<status>enabled|disabled)\n/,
        'policy-template': /\n +policy-template (?<name>[\w-.]+)\n/,
        'policy-type': /\n +policy-type (?<type>security|parent)\n/,
        'parent-policy': /\n +parent-policy (?<name>[\w-.]+)\n/
    }

    apm = {
        name: /(?<partition>(\/[\w\d_\-.]+\/[\w\d_\-.]+\/|\/[\w\d_\-.]+\/))(?<name>[\w\d_\-.]+)/,
        'accept-languages': /\n +accept-languages { (?<langs>[\w ]+)? }\n/,
        'access-policy': /\n +access-policy (?<name>[\w/.]+)\n/,
        'log-settings': /\n +log-settings {\n +(?<profiles>[\S\s]+?)\n +}\n/,
    }

    /**
     * first tmos config file
     * 
     * **must have '#TMSH-VERSION: 15.1.0.4' version at top**
     * 
     * this tmos version will update rx tree as needed and return itself
     * 
     * @param config tmos config file
     */
    constructor(config: string) {
        // commend to keep TS error away...
        this.tmosVersion = this.getTMOSversion(config);

        this.update()
        return;
    }

    /**
     * Update rx tree depending on tmos version
     * 
     * @param tmosVersion
     */
    private update() {
        const x = removeVersionDecimals(this.tmosVersion);

        /**
         * the following is just examples of how to expand the regex tree for different versions :)
         *  this should change a little as this matures and the regex madness gets cleaned up
         */

        // full tmos version without decimals
        if (x > 19000) {
            logger.error('>v19.0.0.0 tmos detected - this should never happen!!!')
            this.ltm.virtual.fbPersist = /new-fallBackPersist-regex/;
            this.ltm.virtual.pool = /new-pool-regex/;
        }
        if (x < 10000) {
            logger.error('<v10.0.0.0 tmos detected - have not tested this yet!!!')
            // other regex tree changes specific to v12.0.0.0
            // todo: this process needs to be refined a little more; things change when a lower semver version number becomes double digit ex: 12.1.3.16 and 14.1.11.32
        }
        return;
    }

    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    getTMOSversion(config: string): string {
        const version = config.match(this.tmosVersionReg);

        // learning that making sure the tmos version is in every file can be problematic
        //      gonna lean into the idea that if we detect a version at some point we will use it,
        //       else default to the current regex tree
        
        if (version) {
            //found tmos version
            // if(version[1] === this.tmosVersion) {
            return version[1];
            // } else {
            //     const msg = `tmos version CHANGE detected: previous file version was ${this.tmosVersion} -> this tmos version is ${version[1]}`
            //     logger.error(msg)
            //     throw new Error(msg)
            // }
        } else {
            const msg = 'tmos version not detected -> meaning this probably is not a bigip.conf'
            logger.error(msg)
            // Promise.reject(msg);
            // throw new Error(msg);
        }
        
    }

}



/**
 * combines multi-line commented regex final regex
 * @param regs regex pieces in array
 * @param opts regex options (g/m/s/i/y/u/s)
 */
export function multilineRegExp(regs: RegExp[], opts: string): RegExp {
    return new RegExp(regs.map(reg => reg.source).join(''), opts);
}



/**
 * returns full number without decimals so it can be compared
 * 
 * *** note!:  this just flattens what is there and does not take into account double digit version placement! -> needs to be refined!
 * 
 * @param ver tmos version in full x.x.x.x format
 */
function removeVersionDecimals(ver: string): number {
    return parseInt(ver.replace(/\./g, ''));
}
