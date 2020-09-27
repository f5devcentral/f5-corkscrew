



export type BigipObj = {
    [key: string]: unknown
}

/**
 * object type that represends bigip.conf as multi-level json tree
 */
export type BigipConfObj = {
    ltm?: {
        virtual?: unknown;
        pool?: unknown;
        node?: unknown;
        monitor?: unknown;
        profile?: unknown;
        rule?: unknown;
        persistence?: unknown;
    },
    apm?: unknown;
    net?: unknown;
}

/**
 * object type for each app map
 */
export type AppMap = {
    vsName: string,
    vsDest?: string,
    pools?: string[],
    irule?: {
        pools?: string[],
        virtuals?: string[],
        nodes?: string[]
    },
    ltPolicy?: {
        pools?: string[],
        virtuals?: string[],
        nodes?: string[]
    }
}


// type TmosApp = {
//     name: string,
//     config: string,
//     map?: string
// }

