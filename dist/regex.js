"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegExTree = void 0;
const logger_1 = __importDefault(require("./logger"));
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
class RegExTree {
    constructor() {
        /**
         * extracts tmos version at beginning of bigip.conf
         */
        this.tmosVersionReg = /#TMSH-VERSION: (\d.+)/;
        /**
         * captures name and body from single tmos object
         * if match, returns object name in [1] object value in [2]
         * 1/23/2021 - now includes capture groups
         *  - name = tmos object name
         *  - body = tmos object body
         */
        this.parentNameValueRegex = /^(?<name>[ \w\-\/.]+) {(?<body>([\s\S]+| ))}(\n)$/;
        /**
         * Parent tmos object regex
         * Extracts each parent tmos object starting with
         *  (apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom),
         *  then "{" and ending "}" just before next partent object
         */
        this.parentObjectsRegex = this.multilineRegExp([
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
        this.poolRegex = /(?<!source-address-translation {\n\s+)    pool (.+?)\n/;
        this.profilesRegex = /profiles {([\s\S]+?)\n    }\n/;
        this.rulesRegex = /rules {([\s\S]+?)\n    }\n/;
        this.snatRegex = /source-address-translation {([\s\S]+?)\n    }\n/;
        this.ltPoliciesRegex = /policies {([\s\S]+?)\n    }\n/;
        this.persistRegex = /persist {([\s\S]+?)\n    }\n/;
        this.fallBackPersistRegex = /fallback-persistence (\/\w+.+?)\n/;
        this.destination = /destination (\/\w+\/[\w+\.\-]+:\d+)/;
        /**
         * pool detail regexs
         */
        this.poolMembersRegex = /members {([\s\S]+?)\n    }\n/;
        this.poolNodesFromMembersRegex = /(\/\w+\/.+?)(?=:)/g;
        this.poolMonitorsRegex = /monitor (\/\w+.+?)\n/;
        /**
         * profiles
         */
        this.profileNamesRegex = /(\/[\w\-\/.]+)/g;
        this.snatNameRegex = /pool (\/[\w\-\/.]+)/;
        this.ruleNamesRegex = /(\/[\w\-\/.]+)/g;
        this.ltpNamesRegex = /(\/[\w\-\/.]+)/g;
        this.persistNameRegex = /(\/[\w\-\/.]+)/;
        /**
         * base regex tree for extracting tmos config items
         */
        this.regexTree = {
            tmosVersion: this.tmosVersionReg,
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
        };
        // commend to keep TS error away...
    }
    /**
     * Return updated base regex tree depending on version config differences
     *
     * @param tmosVersion
     */
    get(tmosVersion) {
        const x = removeVersionDecimals(tmosVersion);
        /**
         * the following is just examples of how to expand the regex tree for different versions :)
         *  this should change a little as this matures and the regex madness gets cleaned up
         */
        // full tmos version without decimals
        if (x > 19000) {
            logger_1.default.error('>v19.0.0.0 tmos detected - this should never happen!!!');
            this.regexTree.vs.fbPersist = /new-fallBackPersist-regex/;
            this.regexTree.vs.pool.obj = /new-pool-regex/;
        }
        if (x < 12000) {
            logger_1.default.error('<v12.0.0.0 tmos detected - have not tested this yet!!!');
            // other regex tree changes specific to v12.0.0.0
        }
        return this.regexTree;
    }
    /**
     * used to produce final regex from multiline/commented regex
     * @param regs regex pieces in array
     * @param opts regex options (g/m/s/i/y/u/s)
     */
    multilineRegExp(regs, opts) {
        return new RegExp(regs.map(reg => reg.source).join(''), opts);
    }
}
exports.RegExTree = RegExTree;
/**
 * returns full number without decimals so it can be compared
 * @param ver tmos version in full x.x.x.x format
 */
function removeVersionDecimals(ver) {
    return parseInt(ver.replace(/\./g, ''));
}
// const regexTree = new RegExTree();
// export default regexTree;
//# sourceMappingURL=regex.js.map