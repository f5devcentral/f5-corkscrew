


import { BigipConfObj } from './models'

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

export function countObjects (obj: BigipConfObj): ObjStats {

    const stats: ObjStats = {};

    if(obj?.ltm?.virtual) {
        stats.virtuals = Object.keys(obj.ltm.virtual).length
    }

    if(obj?.ltm?.profile) {
        stats.profiles = Object.keys(obj.ltm.profile).length
    }

    if(obj?.ltm?.policy) {
        stats.policies = Object.keys(obj.ltm.policy).length
    }

    if(obj?.ltm?.pool) {
        stats.pools = Object.keys(obj.ltm.pool).length
    }

    if(obj?.ltm?.rule) {
        stats.irules = Object.keys(obj.ltm.rule).length
    }

    if(obj?.ltm?.monitor) {
        stats.monitors = Object.keys(obj.ltm.monitor).length
    }

    if(obj?.ltm?.node) {
        stats.nodes = Object.keys(obj.ltm.node).length
    }

    if(obj?.ltm?.snatpool) {
        stats.snatPools = Object.keys(obj.ltm.snatpool).length
    }

    return stats;
}