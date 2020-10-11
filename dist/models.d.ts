export declare type BigipObj = {
    [key: string]: unknown;
};
/**
 * stats object type for object counts
 */
export declare type Stats = {
    configBytes?: number;
    parseTime?: number;
    appTime?: number;
    packTime?: number;
    sourceTmosVersion?: string;
    objectCount?: number;
    lineCount?: number;
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
    net?: unknown;
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