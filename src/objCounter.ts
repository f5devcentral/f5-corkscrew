


import { BigipConfObj, GslbStats, ObjStats } from './models'


/**
 * counts up totals of the different LTM objects (vs, nodes, pools, ...)
 * @param obj ltm branch of config tree
 */
export async function countObjects (obj: BigipConfObj): Promise<ObjStats> {

    const stats: ObjStats = {};

    if(obj?.ltm?.virtual) {
        stats.virtuals = Object.keys(obj.ltm.virtual).length
    }

    if(obj?.ltm?.profile) {
        // todo: dig deeper to get a better count of actaul profile numbers
        // currently only returns number of parent objects which represents (tcp, ssl, http, ...), not all the keys within those objects
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
        // todo: same as profiles above, dig deeper into each parent object for all the keys of the children
        stats.monitors = Object.keys(obj.ltm.monitor).length
    }

    if(obj?.ltm?.node) {
        stats.nodes = Object.keys(obj.ltm.node).length
    }

    if(obj?.ltm?.snatpool) {
        stats.snatPools = Object.keys(obj.ltm.snatpool).length
    }


    // GTM stats
    if(obj.gtm) {
        // here we return/assign the value
        stats.gtm = await countGSLB(obj);
    }

    if(obj.apm) {
        // here we pass in the main stats object and add stats in the function
        await countAPM(obj, stats)
    }

    // asm policies are refenced by local traffic policies on each vs
    if(obj.asm?.policy) {
        stats.asmPolicies = Object.keys(obj.asm.policy).length;
    }


    return stats;
}



export async function countAPM(obj: BigipConfObj, stats: ObjStats): Promise<void> {

    // count access policies
    //  apm policy access-policy <name> <details>
    if(obj.apm.policy?.['access-policy']) {
        stats.apmPolicies = Object.keys(obj.apm.policy['access-policy']).length;
    }

    // count access profiles
    //  apm profile access <name> <details
    if(obj.apm.profile?.access) {
        stats.apmProfiles = Object.keys(obj.apm.profile.access).length;
    }

    // we already added the stats to the main object, so just finish the function with a return
    return;
}

/**
 * list of gtm record types, not for Typescript typing (see models export)
 * [ 'a', 'aaaa', 'ns', 'srv', 'cname', 'mx', 'naptr']
 */
export const gtmRecordTypes = [ 'a', 'aaaa', 'ns', 'srv', 'cname', 'mx', 'naptr'];

export async function countGSLB(obj: BigipConfObj): Promise<GslbStats> {

    const gtmStats: GslbStats = {};

    const parents = ['datacenter', 'region', 'server'];

    // loop through the list of parents
    parents.forEach( p => {

        // if parent found in obj.gtm object
        if(obj.gtm[p]) {
            // count the keys
            gtmStats[`${p}s`] = Object.keys(obj.gtm[p]).length;
        }

    })

    // pools and wideips have named children object for the different record types
    //  so we need to dig a bit deeper into each one 

    if(obj.gtm.pool) {

        // we have some gslb pools so, create the param and set the initial value
        gtmStats.pools = 0

        // loop through each of the record types and add up counts
        gtmRecordTypes.forEach( r => {

            // make sure we have this type of records
            if(obj.gtm.pool[r]) {
                
                // grab the number of keys and add the count
                const count = Object.keys(obj.gtm.pool[r]).length;
                gtmStats.pools = gtmStats.pools + count;

            }

        })
    }

    if(obj.gtm.wideip) {

        gtmStats.wideips = 0;

        gtmRecordTypes.forEach( r => {

            if(obj.gtm.wideip[r]) {

                const count = Object.keys(obj.gtm.wideip[r]).length;
                gtmStats.wideips = gtmStats.wideips + count;

            }

        })
    }

    return gtmStats;
}