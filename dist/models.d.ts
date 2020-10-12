/**
 * stats object type for object counts
 */
export declare type Stats = {
    configBytes?: number;
    parseTime?: number;
    appTime?: number;
    packTime?: number;
    objectCount?: number;
    objects?: {
        virtuals?: number;
        profiles?: number;
        policies?: number;
        pools?: number;
        irules?: number;
        monitors?: number;
        nodes?: number;
        ltps?: number;
        snats?: number;
        apmProfiles?: number;
        apmPolicies?: number;
        asmPolicies?: number;
    };
};
/**
 * object type that represends bigip.conf as multi-level json tree
 */
export declare type BigipConfObj = {
    ltm?: {
        virtual?: unknown;
        pool?: unknown;
        node?: unknown;
        monitor?: unknown;
        profile?: unknown;
        policy?: unknown;
        rule?: unknown;
        persistence?: unknown;
        snatpool?: unknown;
    };
    apm?: unknown;
    net?: {
        route?: unknown;
        "port-list"?: unknown;
        "route-domain": string;
        self?: string;
        "self-allow"?: string;
        trunk?: string;
        vlan?: string;
    };
};
/**
 * object type for each app map
 */
export declare type AppMap = {
    vsName: string;
    vsDest?: string;
    pools?: string[];
    irule?: {
        pools?: string[];
        virtuals?: string[];
        nodes?: string[];
    };
    policy?: {
        pools?: string[];
        virtuals?: string[];
        nodes?: string[];
    };
};
export declare type TmosApp = {
    name: string;
    config: string;
    map?: string;
};
export declare type Explosion = {
    id: string;
    dateTime: Date;
    config: {
        sources: any;
        apps: any;
        base: any;
    };
    stats: Stats;
    logs: string;
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
    content: string;
}[];
