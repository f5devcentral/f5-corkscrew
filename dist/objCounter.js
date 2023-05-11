"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countGSLB = exports.gtmRecordTypes = exports.countAPM = exports.countObjects = void 0;
/**
 * counts up totals of the different LTM objects (vs, nodes, pools, ...)
 * @param obj ltm branch of config tree
 */
function countObjects(obj) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        const stats = {};
        if ((_a = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _a === void 0 ? void 0 : _a.virtual) {
            stats.virtuals = Object.keys(obj.ltm.virtual).length;
        }
        if ((_b = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _b === void 0 ? void 0 : _b.profile) {
            // todo: dig deeper to get a better count of actaul profile numbers
            // currently only returns number of parent objects which represents (tcp, ssl, http, ...), not all the keys within those objects
            stats.profiles = Object.keys(obj.ltm.profile).length;
        }
        if ((_c = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _c === void 0 ? void 0 : _c.policy) {
            stats.policies = Object.keys(obj.ltm.policy).length;
        }
        if ((_d = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _d === void 0 ? void 0 : _d.pool) {
            stats.pools = Object.keys(obj.ltm.pool).length;
        }
        if ((_e = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _e === void 0 ? void 0 : _e.rule) {
            stats.irules = Object.keys(obj.ltm.rule).length;
        }
        if ((_f = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _f === void 0 ? void 0 : _f.monitor) {
            // todo: same as profiles above, dig deeper into each parent object for all the keys of the children
            stats.monitors = Object.keys(obj.ltm.monitor).length;
        }
        if ((_g = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _g === void 0 ? void 0 : _g.node) {
            stats.nodes = Object.keys(obj.ltm.node).length;
        }
        if ((_h = obj === null || obj === void 0 ? void 0 : obj.ltm) === null || _h === void 0 ? void 0 : _h.snatpool) {
            stats.snatPools = Object.keys(obj.ltm.snatpool).length;
        }
        // GTM stats
        if (obj.gtm) {
            // here we return/assign the value
            stats.gtm = yield countGSLB(obj);
        }
        if (obj.apm) {
            // here we pass in the main stats object and add stats in the function
            yield countAPM(obj, stats);
        }
        // asm policies are refenced by local traffic policies on each vs
        if ((_j = obj.asm) === null || _j === void 0 ? void 0 : _j.policy) {
            stats.asmPolicies = Object.keys(obj.asm.policy).length;
        }
        if (obj.security['bot-defense']) {
            stats.botProfiles = Object.keys(obj.security['bot-defense']).length;
        }
        if (obj.security.dos) {
            stats.dosProfiles = Object.keys(obj.security.dos).length;
        }
        return stats;
    });
}
exports.countObjects = countObjects;
function countAPM(obj, stats) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // count access policies
        //  apm policy access-policy <name> <details>
        if ((_a = obj.apm.policy) === null || _a === void 0 ? void 0 : _a['access-policy']) {
            stats.apmPolicies = Object.keys(obj.apm.policy['access-policy']).length;
        }
        // count access profiles
        //  apm profile access <name> <details
        if ((_b = obj.apm.profile) === null || _b === void 0 ? void 0 : _b.access) {
            stats.apmProfiles = Object.keys(obj.apm.profile.access).length;
        }
        // we already added the stats to the main object, so just finish the function with a return
        return;
    });
}
exports.countAPM = countAPM;
/**
 * list of gtm record types, not for Typescript typing (see models export)
 * [ 'a', 'aaaa', 'ns', 'srv', 'cname', 'mx', 'naptr']
 */
exports.gtmRecordTypes = ['a', 'aaaa', 'ns', 'srv', 'cname', 'mx', 'naptr'];
function countGSLB(obj) {
    return __awaiter(this, void 0, void 0, function* () {
        const gtmStats = {};
        const parents = ['datacenter', 'region', 'server'];
        // loop through the list of parents
        parents.forEach(p => {
            // if parent found in obj.gtm object
            if (obj.gtm[p]) {
                // count the keys
                gtmStats[`${p}s`] = Object.keys(obj.gtm[p]).length;
            }
        });
        // pools and wideips have named children object for the different record types
        //  so we need to dig a bit deeper into each one 
        if (obj.gtm.pool) {
            // we have some gslb pools so, create the param and set the initial value
            gtmStats.pools = 0;
            // loop through each of the record types and add up counts
            exports.gtmRecordTypes.forEach(r => {
                // make sure we have this type of records
                if (obj.gtm.pool[r]) {
                    // grab the number of keys and add the count
                    const count = Object.keys(obj.gtm.pool[r]).length;
                    gtmStats.pools = gtmStats.pools + count;
                }
            });
        }
        if (obj.gtm.wideip) {
            gtmStats.wideips = 0;
            exports.gtmRecordTypes.forEach(r => {
                if (obj.gtm.wideip[r]) {
                    const count = Object.keys(obj.gtm.wideip[r]).length;
                    gtmStats.wideips = gtmStats.wideips + count;
                }
            });
        }
        return gtmStats;
    });
}
exports.countGSLB = countGSLB;
//# sourceMappingURL=objCounter.js.map