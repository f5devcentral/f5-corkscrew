"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countObjects = void 0;
/**
 * counts up totals of the different LTM objects (vs, nodes, pools, ...)
 * @param obj ltm branch of config tree
 */
function countObjects(obj) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
    return stats;
}
exports.countObjects = countObjects;
//# sourceMappingURL=objCounter.js.map