"use strict";
// import { } from './utils/objects'
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countLines = exports.parseTmosConfig = void 0;
const balanced_match_1 = __importDefault(require("balanced-match"));
const objects_1 = require("./utils/objects");
/**
 * turns tmos config file parent objects to json tree
 * *** the original parse function in the main ltm config
 *  is still better than this***
 *      Not only is it about 20% faster, but it is also able
 *      to convert all parent objects
 *
 * I presume this is becuase the objects get staged in an array
 *  before conversion and merging into the tree
 *
 * @param config tmos config as a string
 */
function parseTmosConfig(config) {
    const startTime = process.hrtime.bigint();
    let totalObjectCount = 0;
    let ltmObjectCount = 0;
    const lineCount = countLines(config);
    let parsingCfg = config;
    let fullObj = {};
    // remove first line for tmos config version
    parsingCfg = parsingCfg.replace(/#TMSH-VERSION: (\d.+)/, '');
    // just picked a number, should be adjusted as we go
    if (lineCount > 10000) {
        /**
         * find the index of the first '\nltm ' object, then rip out
         *  everything up to that so we don't have to keep searching
         *  through it
         */
        const firstLtm = parsingCfg.match(/\nltm /);
        parsingCfg = parsingCfg.slice(firstLtm.index);
        while (/\nltm .+?{/.test(parsingCfg)) {
            const blncd = balanced_match_1.default('{', '}', parsingCfg);
            if (blncd) {
                // extract object name from bracket match pre-text
                const parentObjName = blncd.pre.trim().split(' ');
                // create new nested object with name/paths and body
                const newObj = objects_1.nestedObjValue(parentObjName, blncd.body);
                // merge new object back into main objects tree
                fullObj = objects_1.deepMergeObj(fullObj, newObj);
                // fullObj = simpleMergeDeep(fullObj, newObj);
                // rebuild object we are extracting from config file
                const rebuiltObj = `${parentObjName.join(' ')} {${blncd.body}}`;
                // remove object from config file
                parsingCfg = parsingCfg.replace(rebuiltObj, '');
                // trim leading and trailing white space
                parsingCfg = parsingCfg.trim();
                ltmObjectCount++;
            }
        }
    }
    else {
        while (/{/.test(parsingCfg)) {
            const blncd = balanced_match_1.default('{', '}', parsingCfg);
            if (blncd) {
                // extract object name from bracket match pre-text
                const parentObjName = blncd.pre.trim().split(' ');
                // create new nested object with name/paths and body
                const newObj = objects_1.nestedObjValue(parentObjName, blncd.body);
                // merge new object back into main objects tree
                fullObj = objects_1.deepMergeObj(fullObj, newObj);
                // fullObj = simpleMergeDeep(fullObj, newObj);
                // rebuild object we are extracting from config file
                const rebuiltObj = `${parentObjName.join(' ')} {${blncd.body}}`;
                // remove object from config file
                parsingCfg = parsingCfg.replace(rebuiltObj, '');
                // trim leading and trailing white space
                parsingCfg = parsingCfg.trim();
                // increment object counter
                totalObjectCount++;
            }
        }
    }
    const parseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
    return {
        totalObjectCount,
        ltmObjectCount,
        lineCount,
        parseTime,
        fullObj
    };
}
exports.parseTmosConfig = parseTmosConfig;
/**
 * approximate number of lines in config
 *  - not sure how it handles line returns in health monitors and irules
 * @param config tmos config file
 */
function countLines(config) {
    return config.split(/\r\n|\n/).length;
}
exports.countLines = countLines;
//# sourceMappingURL=tmosParser.js.map