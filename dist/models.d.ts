export declare type BigipObj = {
    [key: string]: unknown;
};
/**
 * object type that represends bigip.conf as multi-level json tree
 */
export declare type BigipConfObj = {
    ltm?: {
        virtual?: string;
        pool?: string;
        node?: unknown;
        monitor?: unknown;
        profile?: unknown;
        rule?: unknown;
        persistence?: unknown;
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
    ltPolicy?: {
        pools?: string[];
        virtuals?: string[];
        nodes?: string[];
    };
};
