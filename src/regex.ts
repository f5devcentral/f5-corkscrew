

// import logger grom './logger'

import logger from "./logger";

/**
 * This file servers as the central place for all regex's, we'll call it a regex tree
 * 
 * The idea here is to create a base regex object tree, based on v14/v15 code
 *  if/when any changes in config structure that require tweaks to the regex tree
 *  only those changes will need to be configured in a tree for each respective 
 *  configuration deviatione (ex v16), then merged with the default/base regex tree
 *  
 * Need to find a better way to do regex's across the package.  The regular "match",
 *  on string function works, but also returns the entire full match in [0], then
 *  capture groups as nested array on [1].  
 *  - I know there is plenty of improvements to be made by only returning the match capture group [1]
 *  - and defining better capture groups (probably include lookarounds)
 * 
 * Need to also look into if .matchAll will help.  Seems to be available in NodeJS, 
 *  only in ECMA2020 TypeScript
 */

export class RegExTree {

    /**
     * extracts tmos version at beginning of bigip.conf
     */
    public tmosVersionReg = /#TMSH-VERSION: (\d.+)/;

    /**
     * if match, returns object name in [1] object value in [2]
     */
    private parentNameValueRegex = /([ \w\-\/.]+) {([\s\S]+?\n| )}/;

    /**
     * Parent tmos object regex
     * Extracts each parent tmos object starting with 
     *  (apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom), 
     *  then "{" and ending "}" just before next partent object
     */
    private parentObjectsRegex = this.multilineRegExp([
        // parent level object beginnings with trailing space
        /(apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom) /,  
        // include any child object definitions and object name
        /[ \w\-\/.]+/,
        // capture single line data or everything till "\n}\n"
        /({.*}\n|{[\s\S]+?\n}\n)/,
        // look forward to capture the last "}" before the next parent item name
        /(?=(apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom))/   
    ], 'g');

    /**
     * vs detail regexs
     */
    //following regex will get pool, but not snat pool from vs config
    private poolRegex = /(?<!source-address-translation {\n\s+)pool (.+?)\n/;
    private profilesRegex = /profiles {([\s\S]+?)\n    }\n/;
    private rulesRegex = /rules {([\s\S]+?)\n    }\n/;
    private snatRegex = /source-address-translation {([\s\S]+?)\n    }\n/;
    private ltPoliciesRegex = /policies {([\s\S]+?)\n    }\n/;
    private persistRegex = /persist {([\s\S]+?)\n    }\n/;
    private fallBackPersistRegex = /fallback-persistence (\/\w+.+?)\n/;
    private destination = /destination (\/\w+\/[\w+\.\-]+:\d+)/;

    /**
     * pool detail regexs
     */
    private poolMembersRegex = /members {([\s\S]+?)\n    }\n/;
    private poolNodesFromMembersRegex = /(\/\w+\/.+?)(?=:)/g;
    private poolMonitorsRegex = /monitor (\/\w+.+?)\n/;

    /**
     * profiles
     */
    private profileNamesRegex = /(\/[\w\-\/.]+)/g;
    private snatNameRegex = /pool (\/[\w\-\/.]+)/;
    private ruleNamesRegex = /(\/[\w\-\/.]+)/g;
    private ltpNamesRegex = /(\/[\w\-\/.]+)/g;
    private persistNameRegex = /(\/[\w\-\/.]+)/;

    /**
     * base regex tree for extracting tmos config items
     */
    private regexTree: TmosRegExTree = {
        parentObjects: this.parentObjectsRegex,
        parentNameValue: this.parentNameValueRegex,
        vs: {
            pool: {
                obj: this.poolRegex,
                members: this.poolMembersRegex,
                nodesFromMembers: this.poolNodesFromMembersRegex,
                monitors: this.poolMonitorsRegex
            },
            profiles: {
                obj: this.profilesRegex,
                names: this.profileNamesRegex
            },
            rules: {
                obj: this.rulesRegex,
                names: this.ruleNamesRegex
            },
            snat: {
                obj: this.snatRegex,
                name: this.snatNameRegex
            },
            ltPolicies: {
                obj: this.ltPoliciesRegex,
                names: this.ltpNamesRegex
            },
            persist: {
                obj: this.persistRegex,
                name: this.persistNameRegex
            },
            fbPersist: this.fallBackPersistRegex,
            destination: this.destination
        }
    }

    constructor() {
        // commend to keep TS error away...
    }

    /**
     * Return updated base regex tree depending on version config differences
     * 
     * @param tmosVersion
     */
    get(tmosVersion?: string): TmosRegExTree {
        const x = removeVersionDecimals(tmosVersion);

        /**
         * the following is just examples of how to expand the regex tree for different versions :)
         *  this should change a little as this matures and the regex madness gets cleaned up
         */

        // full tmos version without decimals
        if(x > 19000) {
            logger.error('>v19.0.0.0 tmos detected - this should never happen!!!')
            this.regexTree.vs.fbPersist = /new-fallBackPersist-regex/;
            this.regexTree.vs.pool.obj = /new-pool-regex/;
        }
        if(x < 12000){
            logger.error('<v12.0.0.0 tmos detected - have not tested this yet!!!')
            // other regex tree changes specific to v12.0.0.0
        }
        return this.regexTree;
    }


    /**
     * used to produce final regex from multiline/commented regex
     * @param regs regex pieces in array
     * @param opts regex options (g/m/s/i/y/u/s)
     */
    private multilineRegExp(regs, opts: string) {
        return new RegExp(regs.map(reg => reg.source).join(''), opts);
    }
}



export type TmosRegExTree = {
    parentObjects: RegExp,
    parentNameValue: RegExp,
    vs: {
        pool: {
            obj: RegExp,
            members: RegExp,
            nodesFromMembers: RegExp,
            monitors: RegExp
        },
        profiles: {
            obj: RegExp,
            names: RegExp
        },
        rules: {
            obj: RegExp,
            names: RegExp
        },
        snat: {
            obj: RegExp,
            name: RegExp
        },
        ltPolicies: {
            obj: RegExp,
            names: RegExp
        },
        persist: {
            obj: RegExp,
            name: RegExp
        },
        fbPersist: RegExp,
        destination: RegExp
    }
}

/**
 * returns full number without decimals so it can be compared
 * @param ver tmos version in full x.x.x.x format
 */
function removeVersionDecimals(ver: string): number {
    return parseInt(ver.replace(/\./g, ''));
}

// const regexTree = new RegExTree();
// export default regexTree;