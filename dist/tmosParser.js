// // import { } from './utils/objects'
// import balanced from 'balanced-match';
// import { ParseResp } from './models';
// import { deepMergeObj, nestedObjValue } from './objects'
// /**
//  * turns tmos config file parent objects to json tree
//  * *** the original parse function in the main ltm config
//  *  is still better than this***
//  *      Not only is it about 20% faster, but it is also able
//  *      to convert all parent objects
//  * 
//  * I presume this is becuase the objects get staged in an array
//  *  before conversion and merging into the tree
//  * 
//  * @param config tmos config as a string
//  */
// export function parseTmosConfig (config: string): ParseResp {
//     const startTime = process.hrtime.bigint();
//     let totalObjectCount = 0;
//     let ltmObjectCount = 0;
//     const lineCount = countLines(config);
//     let parsingCfg = config;
//     let fullObj = {};
//     // remove first line for tmos config version
//     parsingCfg = parsingCfg.replace(/#TMSH-VERSION: (\d.+)/, '');
//     // just picked a number, should be adjusted as we go
//     if (lineCount > 10000) { 
//         /**
//          * find the index of the first '\nltm ' object, then rip out
//          *  everything up to that so we don't have to keep searching
//          *  through it
//          */
//         const firstLtm = parsingCfg.match(/\nltm /);
//         parsingCfg = parsingCfg.slice(firstLtm.index)
//         while ( /\nltm .+?{/.test(parsingCfg) ) {
//             const blncd = balanced('{', '}', parsingCfg);
//             if(blncd) {
//                 // extract object name from bracket match pre-text
//                 const parentObjName = blncd.pre.trim().split(' ');
//                 // create new nested object with name/paths and body
//                 const newObj = nestedObjValue(parentObjName, blncd.body);
//                 // merge new object back into main objects tree
//                 fullObj = deepMergeObj(fullObj, newObj);
//                 // rebuild object we are extracting from config file
//                 const rebuiltObj = `${parentObjName.join(' ')} {${blncd.body}}`
//                 // remove object from config file
//                 parsingCfg = parsingCfg.replace(rebuiltObj, '');
//                 // trim leading and trailing white space
//                 parsingCfg = parsingCfg.trim();
//                 ltmObjectCount ++;
//             }
//         }
//     } else {
//         while ( /{/.test(parsingCfg) ) {
//             const blncd = balanced('{', '}', parsingCfg);
//             if(blncd) {
//                 // extract object name from bracket match pre-text
//                 const parentObjName = blncd.pre.trim().split(' ');
//                 // create new nested object with name/paths and body
//                 const newObj = nestedObjValue(parentObjName, blncd.body);
//                 // merge new object back into main objects tree
//                 fullObj = deepMergeObj(fullObj, newObj);
//                 // rebuild object we are extracting from config file
//                 const rebuiltObj = `${parentObjName.join(' ')} {${blncd.body}}`
//                 // remove object from config file
//                 parsingCfg = parsingCfg.replace(rebuiltObj, '');
//                 // trim leading and trailing white space
//                 parsingCfg = parsingCfg.trim();
//                 // increment object counter
//                 totalObjectCount ++;
//             }
//         }
//     }
//     const parseTime = Number(process.hrtime.bigint() - startTime) / 1000000
//     return {
//         totalObjectCount,
//         ltmObjectCount,
//         lineCount,
//         parseTime,
//         fullObj
//     }
// }
// /**
//  * approximate number of lines in config
//  *  - not sure how it handles line returns in health monitors and irules
//  * @param config tmos config file
//  */
// export function countLines (config: string): number {
//     return config.split(/\r\n|\n/).length;
// }
//# sourceMappingURL=tmosParser.js.map