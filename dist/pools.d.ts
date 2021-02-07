/**
 * todo:
 * - add support for virtual server destinations
 * - add support for variables in brackets ${var}
 */
/**
 * discovers ltm pools from irule
 * - when a list of pools is provided, will only return discovered pool verified by list
 *
 * All pool definitions in irule need to be on thier own line!!!
 *
 * based off of:  https://devcentral.f5.com/s/articles/irules-101-05-selecting-pools-pool-members-and-nodes
 *
 * @param rule irule
 * @param pools (optional) list of pools on box to verify any matches
 * @returns array of discovered pools in irule
 */
export declare function poolsInRule(rule: string, existingPools?: string[]): string[] | string[][];
/**
 * extracts destination pools from Local Traffic Policy
 *
 * No verification needed since LTPs won't reference a pool not already configured
 *
 * @param ltp tcl/tmos local traffic policy
 */
export declare function poolsInPolicy(ltp: string): string[];
