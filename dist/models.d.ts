/**
 * object type that represends bigip.conf as multi-level json tree
 */
export declare type BigipConfObj = {
    ltm?: {
        virtual?: {
            [key: string]: string;
        };
        pool?: {
            [key: string]: string;
        };
        node?: {
            [key: string]: string;
        };
        monitor?: {
            [key: string]: string;
        };
        profile?: {
            [key: string]: string;
        };
        policy?: {
            [key: string]: string;
        };
        rule?: {
            [key: string]: string;
        };
        persistence?: {
            [key: string]: string;
        };
        snatpool?: {
            [key: string]: string;
        };
        "data-group"?: {
            internal?: {
                [key: string]: string;
            };
        };
        ifile?: {
            [key: string]: string;
        };
        "virtual-address"?: {
            [key: string]: string;
        };
        "default-node-monitor"?: string;
    };
    apm?: unknown;
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
    sys?: {
        "global-settings"?: string;
        application?: {
            service?: {
                [key: string]: string;
            };
        };
        "compatibility-level"?: string;
        dns?: string;
        file?: {
            ifile?: {
                [key: string]: string;
            };
            "ssl-cert"?: {
                [key: string]: string;
            };
            "ssl-key"?: {
                [key: string]: string;
            };
        };
        folder?: {
            [key: string]: string;
        };
        httpd?: string;
        icall?: {
            handler?: {
                periodic?: {
                    [key: string]: string;
                };
            };
        };
        "management-dhcp"?: {
            [key: string]: string;
        };
        "management-route"?: {
            [key: string]: string;
        };
        ntp?: string;
        provision?: {
            [key: string]: string;
        };
        snmp?: string;
        software?: {
            [key: string]: string;
        };
    };
};
/**
 * main explosion output
 *
 */
export declare type Explosion = {
    id: string;
    dateTime: Date;
    hostname?: string;
    inputFileType: string;
    config: {
        sources: ConfigFiles[];
        apps: TmosApp[];
        base: string[];
    };
    stats: Stats;
    logs: string[];
};
/**
 * array item of returned "apps"
 */
export declare type TmosApp = {
    name: string;
    configs: string[];
    map?: AppMap;
};
/**
 * object type for each app map
 * - child of explosion
 */
export declare type AppMap = {
    vsDest?: string;
    pool?: string[];
    irule?: {
        pools?: string[] | string[][];
        virtuals?: string[];
        nodes?: string[];
    };
    policy?: {
        pools?: string[];
        virtuals?: string[];
        nodes?: string[];
    };
};
/**
 * stats object type for object counts
 * - child of explosion
 */
export declare type Stats = {
    configBytes?: number;
    loadTime?: number;
    parseTime?: number;
    appTime?: number;
    packTime?: number;
    sourceTmosVersion?: string;
    objectCount?: number;
    objects?: ObjStats;
};
/**
 * ltm object stats
 *  - child of stats - child of explosion
 */
export declare type ObjStats = {
    virtuals?: number;
    profiles?: number;
    policies?: number;
    pools?: number;
    irules?: number;
    monitors?: number;
    nodes?: number;
    snatPools?: number;
    apmProfiles?: number;
    apmPolicies?: number;
    asmPolicies?: number;
};
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
export declare type ParseResp = {
    totalObjectCount: number;
    ltmObjectCount: number;
    lineCount: number;
    parseTime: number;
    fullObj: unknown;
};
/**
 * defines the structure of the archive file extraction or single bigip.conf
 */
export declare type ConfigFiles = {
    fileName: string;
    size: number;
    content?: string;
};
