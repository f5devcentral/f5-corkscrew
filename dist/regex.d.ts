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
export declare class RegExTree {
    /**
     * extracts tmos version at beginning of bigip.conf
     */
    tmosVersionReg: RegExp;
    /**
     * if match, returns object name in [1] object value in [2]
     */
    private parentNameValueRegex;
    /**
     * Parent tmos object regex
     * Extracts each parent tmos object starting with
     *  (apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom),
     *  then "{" and ending "}" just before next partent object
     */
    private parentObjectsRegex;
    /**
     * vs detail regexs
     */
    private poolRegex;
    private profilesRegex;
    private rulesRegex;
    private snatRegex;
    private ltPoliciesRegex;
    private persistRegex;
    private fallBackPersistRegex;
    private destination;
    /**
     * pool detail regexs
     */
    private poolMembersRegex;
    private poolNodesFromMembersRegex;
    private poolMonitorsRegex;
    /**
     * profiles
     */
    private profileNamesRegex;
    private snatNameRegex;
    private ruleNamesRegex;
    private ltpNamesRegex;
    private persistNameRegex;
    /**
     * base regex tree for extracting tmos config items
     */
    private regexTree;
    constructor();
    /**
     * Return updated base regex tree depending on version config differences
     *
     * @param tmosVersion
     */
    get(tmosVersion?: string): TmosRegExTree;
    /**
     * used to produce final regex from multiline/commented regex
     * @param regs regex pieces in array
     * @param opts regex options (g/m/s/i/y/u/s)
     */
    private multilineRegExp;
}
export declare type TmosRegExTree = {
    parentObjects: RegExp;
    parentNameValue: RegExp;
    vs: {
        pool: {
            obj: RegExp;
            members: RegExp;
            nodesFromMembers: RegExp;
            monitors: RegExp;
        };
        profiles: {
            obj: RegExp;
            names: RegExp;
        };
        rules: {
            obj: RegExp;
            names: RegExp;
        };
        snat: {
            obj: RegExp;
            name: RegExp;
        };
        ltPolicies: {
            obj: RegExp;
            names: RegExp;
        };
        persist: {
            obj: RegExp;
            name: RegExp;
        };
        fbPersist: RegExp;
        destination: RegExp;
    };
};
