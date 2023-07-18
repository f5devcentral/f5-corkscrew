
'use strict';

/**
 * object type that represends bigip.conf as multi-level json tree
 */
export type BigipConfObj = {
    ltm?: {
        virtual?: {
            [key: string]: {
                name: string;
                partition: string;
                folder?: string;
                destination?: string;
                line: string;
                description?: string;
                pool?: string;
                profiles?: string[];
                rules?: string[];
                snat?: string;
                policies?: string[];
                persist?: string;
                'fallback-persistence'?: string;
            }
        };
        pool?: {
            [key: string]: {
                line: string;
                name: string;
                partition: string;
                members: { [key: string]: unknown };
                monitor: string[];
            };
        };
        node?: {
            [key: string]: {
                line: string;
                name: string;
                partition: string;
                address: string;
            };
        };
        monitor?: {
            [key: string]: {
                name: string;
                partition: string;
                line: string;
                folder?: string;
            }
        };
        profile?: {
            [key: string]: {
                line: string;
            }
        };
        policy?: {
            [key: string]: {
                line: string;
            }
        };
        rule?: { [key: string]: string };
        persistence?: {
            [key: string]: {
                line: string;
            }
        };
        snatpool?: {
            [key: string]: {
                line: string;
                name: string;
                partition: string;
                folder?: string;
                members?: string[];
            }
        };
        "data-group"?: {
            internal?: { [key: string]: string }
        },
        ifile?: { [key: string]: string },
        "virtual-address"?: { [key: string]: string },
        "default-node-monitor"?: string;
    };
    gtm?: GtmConfObj;
    apm?: {
        policy?: {
            "access-policy"?: { [k: string]: string };
        };
        profile?: {
            access?: {
                [key: string]: {
                    line: string;
                    name: string;
                    partition: string;
                    "accept-languages": string[];
                    "access-policy": string;
                    "log-settings": string[];
                    "app-service": string;
                    "customization-group": string;
                    "customization-key": string;
                    "default-language": string;
                    "domain-cookie": string;
                    "eps-group": string;
                    "errormap-group": string;
                    "exchange-profile": string;
                    "framework-installation-group": string;
                    "general-ui-group": string;
                    generation: string;
                    "generation-action": string;
                    "httponly-cookie"?: string;
                    "logout-uri-timeout"?: string;
                    "modified-since-last-policy-sync": string;
                    "named-scope"?: string;
                    "oauth-profile"?: string;
                    "persistent-cookie"?: string;
                    scope?: string;
                    "secure-cookie"?: string;
                    "sso-name"?: string;
                    type: string;
                    "user-identity-method"?: string;
                }

            }
        }
    };
    asm?: {
        policy?: { [k: string]: string };
    };
    auth?: {
        partition?: unknown;
    };
    net?: {
        route?: unknown;
        "port-list"?: unknown;
        "route-domain": string;
        self?: string;
        "self-allow"?: string;
        trunk?: string;
        vlan?: string;
    };
    security?: {
        dos?: {
            profile?: unknown;
        };
        ['bot-defense']?: {
            profile?: unknown;
        };
    };
    sys?: {
        "global-settings"?: string;
        application?: {
            service?: { [key: string]: string }
        },
        "compatibility-level"?: string;
        dns?: string;
        file?: {
            ifile?: { [key: string]: string }
            "ssl-cert"?: { [key: string]: string }
            "ssl-key"?: { [key: string]: string }
        },
        folder?: { [key: string]: string }
        httpd?: string;
        icall?: {
            handler?: {
                periodic?: { [key: string]: string }
            }
        },
        "management-dhcp"?: { [key: string]: string }
        "management-route"?: { [key: string]: string }
        ntp?: string;
        provision?: { [key: string]: string }
        snmp?: string;
        software?: { [key: string]: string }
    }
}

/**
 * main explosion output
 * 
 */
export type Explosion = {
    id: string,
    dateTime: Date,
    hostname?: string,
    baseRegKey?: string,
    inputFileType: string,
    config: {
        sources: ConfigFile[],
        apps?: TmosApp[],
        gslb?: GslbApp[],
        base?: string[],
        doClasses?: string[]
    },
    stats: Stats,
    fileStore?: ConfigFile[]
    logs: string[]
}

















/**
 * parent gtm config objects in nested form for BigipConfObj
 * 
 */
export type GtmConfObj = {
    datacenter?: { [key: string]: string },
    "global-settings"?: { [key: string]: string },
    pool?: {
        a?: GtmPool;
        aaaa?: GtmPool;
        ns?: GtmPool;
        srv?: GtmPool;
        cname?: GtmPool;
        mx?: GtmPool;
        naptr?: GtmPool;
    };
    region?: { [key: string]: string };
    server?: {
        [k: string]: {
            line: string;
            datacenter: string;
            monitor?: string;
            product?: string;
            'virtual-server-discovery'?: string;
            'virtual-servers': {
                [k: string]: {
                    destination: string;
                    'depends-on'?: string[];
                    monitor?: string;
                    'translation-address'?: string;
                    'translation-port'?: string;
                }
            }
            devices?: {
                [k: string]: {
                    addresses: {
                        [k: string]: {
                            translation?: string;
                        }
                    }[]
                }
            }[]
        }
    };
    wideip?: {
        a?: GslbApp;
        aaaa?: GslbApp;
        ns?: GslbApp;
        srv?: GslbApp;
        cname?: GslbApp;
        mx?: GslbApp;
        naptr?: GslbApp;
    };
}



/**
 * this is only used for Typescript Typing, notice everything is "OR"
 *  Also, these types are not included after compile (running app)
 */
export type GtmRecordTypes = 'a' | 'aaaa' | 'ns' | 'srv' | 'cname' | 'mx' | 'naptr'

export type GslbApp = {
    fqdn: string;
    partition: string;
    type: GtmRecordTypes;
    description?: string;
    lines: string[];
    allPossibleDestinations: string[];
    aliases?: string[];
    iRules?: string[];
    pools?: GtmPool[] | GtmPoolRef[];
}

/**
 * gtm pool reference in a wideip
 */
export type GtmPoolRef = {
    name: string;
    order?: number;
    ratio?: number;
}

/**
 * full gtm pool details
 */
export type GtmPool = {
    name: string;
    order: number;
    type: GtmRecordTypes;
    'load-balancing-mode'?: string;
    'alternate-mode'?: string;
    'fallback-mode'?: string;
    'fallback-ip'?: string;
    members?: []
};
















/**
 * array item of returned "apps"
 */
export type TmosApp = {
    name: string;
    partition: string;
    folder?: string;
    destination: string;
    lines: string[],
    description?: string;
    pool?: BigipConfObj["ltm"]["pool"]['key'];
    profiles?: string[];
    rules?: string[];
    snat?: BigipConfObj["ltm"]["snatpool"]['key'];
    policies?: string[];
    persist?: string;
    diagnostics?: any[];
    'fallback-persistence'?: string;
    map?: AppMap
}

/**
 * object type for each app map
 * - child of explosion
 */
export type AppMap = {
    // the virtual server clients connect to
    destination?: string,
    // default pool members (ip:port)
    pool?: string[],
    irule?: {
        // pools referenced (extracted members) in irule
        pools?: string[] | string[][],
        //  do we care about virtuals referencing other virtuals?  advanced-out-of-scope?
        virtuals?: string[],
        // probably bad practice, but doable...
        nodes?: string[]
    },
    policy?: {
        pools?: string[],
        virtuals?: string[],
        nodes?: string[]
    }
}

/**
 * stats object type for object counts
 * - child of explosion
 */
export type Stats = {
    configBytes?: number;
    loadTime?: number;
    parseTime?: number;
    appTime?: number;
    fqdnTime?: number;
    packTime?: number,
    sourceTmosVersion?: string,
    objectCount?: number,
    // lineCount?: number,
    objects?: ObjStats
    sourceSize?: number;
}

/**
 * ltm object stats
 *  - child of stats - child of explosion
 */
export type ObjStats = {
    virtuals?: number,
    profiles?: number,
    policies?: number,
    pools?: number,
    irules?: number,
    monitors?: number,
    nodes?: number,
    snatPools?: number,
    apmProfiles?: number,
    apmPolicies?: number,
    asmPolicies?: number,
    botProfiles?: number;
    dosProfiles?: number;
    gtm?: GslbStats;
}


export type GslbStats = {
    datacenters?: number;
    pools?: number;
    regions?: number;
    server?: number;
    wideips?: number;
}


export type ParseResp = {
    totalObjectCount: number,
    ltmObjectCount: number,
    lineCount: number,
    parseTime: number,
    fullObj: unknown
}

/**
 * defines the structure of the archive file extraction or single bigip.conf
 */
export type ConfigFile = {
    fileName: string,
    size: number,
    content: string
}


export type License = { 
    ['Registration Key']?: string;
    fileName: string,
    size: number,
    content: string
};