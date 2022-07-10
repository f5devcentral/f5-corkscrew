/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

/**
 * object type that represends bigip.conf as multi-level json tree
 */
export type BigipConfObj = {
    ltm?: {
        virtual?: { [key: string]: string };
        pool?: { [key: string]: string };
        node?: { [key: string]: string };
        monitor?: { [key: string]: string };
        profile?: { [key: string]: string };
        policy?: { [key: string]: string };
        rule?: { [key: string]: string };
        persistence?: { [key: string]: string };
        snatpool?: { [key: string]: string };
        "data-group"?: {
            internal?: { [key: string]: string }
        },
        ifile?: { [key: string]: string },
        "virtual-address"?: { [key: string]: string },
        "default-node-monitor"?: string;
    },
    apm?: {
        profile?: { 
            access?: { [key: string]: string }
        }
    };
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


export type xmlStats = {
    'mcp_module.xml'?: {
        "Qkproc": {
            "admin_ip": unknown
            "system_information": unknown
            "cert_status_object": unknown
            "system_module": unknown
            "tmm_stat": unknown
            "traffic_group": unknown
            "virtual_address": unknown
            "virtual_address_stat": unknown
            "virtual_server": unknown
            "virtual_server_stat": unknown,
            "interface": unknown,
            "interface_stat": unknown,
            "pool": unknown,
            "pool_member": unknown,
            "pool_member_metadata": unknown,
            "pool_member_stat": unknown,
            "pool_stat": unknown,
            "profile_dns_stat": unknown,
            "profile_http_stat": unknown,
            "profile_tcp_stat": unknown,
            "rule_stat": unknown,
        }
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
    inputFileType: string,
    config: {
        sources: ConfigFile[],
        apps?: TmosApp[],
        base?: string[],
        doClasses?: string[]
    },
    stats: Stats,
    fileStore?: ConfigFile[]
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
export type ConfigFile = {
    fileName: string,
    size: number,
    content: string
}

