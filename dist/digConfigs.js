'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostname = exports.uniqueList = exports.digVsConfig = void 0;
const logger_1 = __importDefault(require("./logger"));
const objects_1 = require("./objects");
const pools_1 = require("./pools");
/**
 * scans vs config, and discovers child configs
 * @param vsName virtual server name
 * @param vsConfig virtual server tmos config body
 */
function digVsConfig(vsName, vsConfig, configTree, rx) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         *
         * What do we need to map on next on the virtual servers?:
         *  - oneConnect?
         *  - expand the discovery of all profiles (apm and supporting)
         *
         * Or do we expand the irule references like pools/policies?
         *
         */
        logger_1.default.info(`digging vs config for ${vsName}`);
        // clone the app config
        const tmpObj = JSON.parse(JSON.stringify(vsConfig));
        // move and recrate the original config line
        delete tmpObj.line;
        const originalCfg = `ltm virtual ${vsName} {${vsConfig.line}}`;
        tmpObj.lines = [originalCfg];
        const appObj = tmpObj;
        if (appObj.pool) {
            // dig pool details
            // just reassign the parsed pool details into the vs
            const body = configTree.ltm.pool[vsConfig.pool];
            appObj.lines.push(`ltm pool ${appObj.pool} {${body.line}}`);
            appObj.pool = configTree.ltm.pool[vsConfig.pool];
            Object.keys(appObj.pool.members).forEach(n => {
                // loop through all the pool members and get the node details
                const name = n.split(':')[0];
                const body = configTree.ltm.node[name];
                if (body) {
                    appObj.lines.push(`ltm node ${name} {${body.line}}`);
                }
            });
        }
        if (appObj.profiles) {
            // dig profiles details
            // todo: dig profiles deeper => deep parse profiles/settings
            appObj.profiles.forEach(name => {
                var _a;
                // check the ltm profiles
                const x = (0, objects_1.pathValueFromKey)(configTree.ltm.profile, name);
                if (x) {
                    appObj.lines.push(`ltm profile ${x.path} ${x.key} {${x.value}}`);
                }
                // check apm profiles
                const y = (0, objects_1.pathValueFromKey)(configTree.apm.profile.access, name);
                if (y) {
                    appObj.lines.push(`apm profile access ${y.path} ${y.key} {${y.value}}`);
                }
                // check asm profile
                const z = (0, objects_1.pathValueFromKey)((_a = configTree.asm) === null || _a === void 0 ? void 0 : _a.policy, name);
                if (z) {
                    appObj.lines.push(`asm policy ${z.path} ${z.key} {${z.value}}`);
                }
            });
        }
        if (appObj.rules) {
            // dig iRule details
            // todo: dig deeper like digRuleConfigs() in digConfigs.ts.331
            appObj.rules.forEach(name => {
                const x = (0, objects_1.pathValueFromKey)(configTree.ltm.rule, name);
                if (x) {
                    appObj.lines.push(`ltm rule ${x.key} {${x.value}}`);
                }
            });
        }
        if (appObj.snat) {
            // dig snat details
            // if this snat string is the name of a snat pool, then replace with snatpool details
            //  if not, then its 'automap' or 'none' => nothing to add here
            if (configTree.ltm.snatpool[appObj.snat]) {
                appObj.snat = configTree.ltm.snatpool[appObj.snat];
            }
        }
        if (appObj.policies) {
            // dig profiles details
            appObj.policies.forEach(name => {
                const x = (0, objects_1.pathValueFromKey)(configTree.ltm.policy, name);
                if (x) {
                    appObj.lines.push(`ltm policy ${x.key} {${x.value}}`);
                    // got through each policy and dig references (like pools)
                    const pools = (0, pools_1.poolsInPolicy)(x.value);
                    if (pools) {
                        pools.forEach(pool => {
                            const cfg = configTree.ltm.pool[pool];
                            // if we got here there should be a pool for the reference, 
                            // but just in case, we confirm with (if) statement
                            if (cfg) {
                                // push pool config to list
                                logger_1.default.debug(`policy [${x.key}], pool found [${cfg.name}]`);
                                appObj.lines.push(`ltm pool ${cfg.name} {${cfg.line}}`);
                            }
                        });
                    }
                }
            });
        }
        if (appObj.persist) {
            // dig profiles details
            const x = (0, objects_1.pathValueFromKey)(configTree.ltm.persistence, appObj.persist);
            if (x) {
                appObj.lines.push(`ltm persistence ${x.path} ${x.key} {${x.value}}`);
            }
        }
        if (appObj['fallback-persistence']) {
            // dig profiles details
            const x = (0, objects_1.pathValueFromKey)(configTree.ltm.persistence, appObj['fallback-persistence']);
            if (x) {
                appObj.lines.push(`ltm persistence ${x.path} ${x.key} {${x.value}}`);
            }
        }
        return appObj;
    });
}
exports.digVsConfig = digVsConfig;
/**
 * removes duplicates
 * @param x list of strings
 * @return list of unique strings
 */
function uniqueList(x) {
    return Array.from(new Set(x));
}
exports.uniqueList = uniqueList;
/**
 * get hostname from json config tree (if present)
 * @param configObject to search for hostname
 */
function getHostname(configObject) {
    var _a;
    if ((_a = configObject === null || configObject === void 0 ? void 0 : configObject.sys) === null || _a === void 0 ? void 0 : _a['global-settings']) {
        const hostname = configObject.sys["global-settings"].match(/hostname ([\w-.]+)\s/);
        if (hostname && hostname[1]) {
            // return just capture group
            return hostname[1];
        }
    }
}
exports.getHostname = getHostname;
//# sourceMappingURL=digConfigs.js.map