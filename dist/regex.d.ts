/**
 * Regex Tree used for searching configs
 */
export declare class RegExTree {
    tmosVersion: string;
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
    parentNameValue: RegExp;
    /**
     * Parent tmos object regex
     * Extracts each parent tmos object starting with
     *  (apm|ltm|security|net|pem|sys|wom|ilx|auth|analytics|wom),
     *  then "{" and ending "}" just before next partent object
     */
    parentObjects: RegExp;
    /**
     * used for abstracting partition from name
     */
    name: RegExp;
    ltm: {
        virtual: {
            name: RegExp;
            destination: RegExp;
            description: RegExp;
            pool: RegExp;
            profiles: RegExp;
            rules: RegExp;
            snat: RegExp;
            policies: RegExp;
            persist: RegExp;
            fbPersist: RegExp;
        };
        pool: {
            name: RegExp;
            membersGroup: RegExp;
            members: RegExp;
            member: RegExp;
            fqdn: RegExp;
            memberDef: RegExp;
            memberFqdnDef: RegExp;
            nodesFromMembers: RegExp;
            monitors: RegExp;
        };
        profiles: {
            asmProf: RegExp;
            names: RegExp;
        };
        rules: {
            names: RegExp;
        };
        snat: {
            details: RegExp;
            name: RegExp;
        };
        ltPolicies: {
            asmRef: RegExp;
            names: RegExp;
        };
        persist: {
            name: RegExp;
        };
    };
    gtm: {
        wideip: {
            name: RegExp;
            description: RegExp;
            persistence: RegExp;
            'pool-lb-mode': RegExp;
            aliases: RegExp;
            rules: RegExp;
            lastResortPool: RegExp;
            poolsParent: RegExp;
            pools: RegExp;
            poolDetails: RegExp;
        };
        pool: {
            membersGroup: RegExp;
            membersDetails: RegExp;
            membersDetailsG: RegExp;
            'load-balancing-mode': RegExp;
            'alternate-mode': RegExp;
            'fallback-mode': RegExp;
            'fallback-ip': RegExp;
            'verify-member-availability': RegExp;
        };
        server: {
            devices: RegExp;
            devicesG: RegExp;
            dAddressT: RegExp;
            'virtual-servers': RegExp;
            vs: {
                'depends-on': RegExp;
            };
        };
    };
    asm: {
        status: RegExp;
        'blocking-mode': RegExp;
        description: RegExp;
        encoding: RegExp;
        'policy-builder': RegExp;
        'policy-template': RegExp;
        'policy-type': RegExp;
        'parent-policy': RegExp;
    };
    apm: {
        name: RegExp;
        'accept-languages': RegExp;
        'access-policy': RegExp;
        'log-settings': RegExp;
    };
    /**
     * first tmos config file
     *
     * **must have '#TMSH-VERSION: 15.1.0.4' version at top**
     *
     * this tmos version will update rx tree as needed and return itself
     *
     * @param config tmos config file
     */
    constructor(config: string);
    /**
     * Update rx tree depending on tmos version
     *
     * @param tmosVersion
     */
    private update;
    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    getTMOSversion(config: string): string;
}
/**
 * combines multi-line commented regex final regex
 * @param regs regex pieces in array
 * @param opts regex options (g/m/s/i/y/u/s)
 */
export declare function multilineRegExp(regs: RegExp[], opts: string): RegExp;
