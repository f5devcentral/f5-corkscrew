/**
 * Regex Tree used for searching configs
 */
export declare class RegExTree {
    /**
     * extracts tmos version at beginning of bigip.conf
     */
    tmosVersionReg: RegExp;
    /**
     * captures name and body from single tmos object
     * if match, returns object name in [1] object value in [2]
     * 1/23/2021 - now includes capture groups
     *  - name = tmos object name
     *  - body = tmos object body
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
    tmosVersion: RegExp;
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
