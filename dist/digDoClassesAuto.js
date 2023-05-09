'use-strict';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.digDoConfig = void 0;
const do_classes_json_1 = __importDefault(require("./do_classes.json"));
const logger_1 = __importDefault(require("./logger"));
const object_path_1 = __importDefault(require("object-path"));
/**
 * dig DO config information like vlans/SelfIPs/system-settings/...
 * @param configTree bigip config as json tree
 * @returns raw config objects
 */
function digDoConfig(configTree) {
    const confs = [];
    logger_1.default.info('digging DO classes for base config info');
    do_classes_json_1.default.forEach((el) => __awaiter(this, void 0, void 0, function* () {
        // split the path and drop the initial '/tm'
        const path = el.path.split('/').slice(2);
        // search tree for config
        const val = object_path_1.default.get(configTree, path);
        if (val) {
            if (typeof val == 'object') {
                // const objectProperties = []
                // if config is object, loop through object and expand it
                for (const [key, value] of Object.entries(val)) {
                    const v = value;
                    if (v.line) {
                        // this is to support the exdended parsing scheme started Apr2023
                        confs.push(`${path.join(' ')} ${key} { ${v.line} }`);
                    }
                    else {
                        confs.push(`${path.join(' ')} ${key} { ${v} }`);
                    }
                }
            }
            else if (typeof val == 'string') {
                // if config is string, return it
                confs.push(`${path.join(' ')} { ${val} }`);
            }
            else {
                logger_1.default.info(`dig DO class path found, but not a string or object; path=${path.join(' ')} value=${val} }`);
            }
        }
        else {
            // no config found for this path
            logger_1.default.debug(`no path "${path.join(' ')}" in object`);
        }
    }));
    return confs;
}
exports.digDoConfig = digDoConfig;
//# sourceMappingURL=digDoClassesAuto.js.map