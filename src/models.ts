

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
        policy?: unknown;
        rule?: unknown;
        persistence?: unknown;
        snatpool?: unknown;
    },
    apm?: unknown;
    auth?: {
        partition?: unknown;
    }
    net?: {
        route?: unknown;
        "port-list"?: unknown;
        "route-domain": string;
        self?: string;
        "self-allow"?: string;
        trunk?: string;
        vlan?: string;
    },
    sys?: {
        "global-settings"?: string;
    }
}




/**
 * main explosion output
 * 
 */
export type Explosion = {
    id: string,
    dateTime: Date,
    inputFileType: string,
    config: {
        sources: ConfigFiles[],
        apps: TmosApp[],
        base: string[]
    },
    stats: Stats,
    logs: string[]
}

/**
 * array item of returned "apps"
 */
export type TmosApp = {
    name: string,
    configs: string[],
    map?: AppMap
}

/**
 * object type for each app map
 * - child of explosion
 */
export type AppMap = {
    // the virtual server clients connect to
    vsDest?: string,
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
    configBytes?: number,
    loadTime?: number,
    parseTime?: number,
    appTime?: number,
    packTime?: number,
    sourceTmosVersion?: string,
    objectCount?: number,
    // lineCount?: number,
    objects?: ObjStats
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
    asmPolicies?: number
}







export type TmosRegExTree = {
    tmosVersion: RegExp,
    parentObjects: RegExp,
    parentNameValue: RegExp,
    vs: {
        pool: {
            obj: RegExp,
            members: RegExp,
            nodesFromMembers: RegExp,
            monitors: RegExp
        },
        profiles: {
            obj: RegExp,
            names: RegExp
        },
        rules: {
            obj: RegExp,
            names: RegExp
        },
        snat: {
            obj: RegExp,
            name: RegExp
        },
        ltPolicies: {
            obj: RegExp,
            names: RegExp
        },
        persist: {
            obj: RegExp,
            name: RegExp
        },
        fbPersist: RegExp,
        destination: RegExp
    }
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
export type ConfigFiles = {
    fileName: string,
    size: number,
    content?: string
}

