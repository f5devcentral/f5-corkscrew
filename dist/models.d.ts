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
    };
};
export declare type xmlStats = {
    'mcp_module.xml'?: {
        "Qkproc": {
            "admin_ip": unknown;
            "system_information": unknown;
            "cert_status_object": unknown;
            "system_module": unknown;
            "tmm_stat": unknown;
            "traffic_group": unknown;
            "virtual_address": unknown;
            "virtual_address_stat": unknown;
            "virtual_server": unknown;
            "virtual_server_stat": unknown;
            "interface": unknown;
            "interface_stat": unknown;
            "pool": unknown;
            "pool_member": unknown;
            "pool_member_metadata": unknown;
            "pool_member_stat": unknown;
            "pool_stat": unknown;
            "profile_dns_stat": unknown;
            "profile_http_stat": unknown;
            "profile_tcp_stat": unknown;
            "rule_stat": unknown;
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
        sources: ConfigFile[];
        apps: TmosApp[];
        base: string[];
    };
    stats: Stats;
    fileStore?: ConfigFile[];
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
    sourceSize?: number;
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
export declare type ConfigFile = {
    fileName: string;
    size: number;
    content: string;
};
