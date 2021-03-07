// /*
//  * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
//  * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
//  * may copy and modify this software product for its internal business purposes.
//  * Further, Licensee may upload, publish and distribute the modified version of
//  * the software product on devcentral.f5.com.
//  */
// 'use strict';
// // https://stackoverflow.com/questions/52281389/convert-xml-to-json-with-nodejs/57724779
// import { parseStringPromise } from 'xml2js'
// import { ConfigFile } from './unPackerStream';
// export async function xmlTojsTest(): Promise<void> {
//     const xml = '<foo></foo><bar></bar>';
//     // With parser
//     // const parser = new xml2js.Parser(/* options */);
//     // parser.parseStringPromise(xml).then(function (result) {
//     //     console.dir(result);
//     //     console.log('Done1');
//     // })
//     //     .catch(function (err) {
//     //         // Failed
//     //         const x = err;
//     //         debugger;
//     //     });
//     // Without parser
//     parseStringPromise(xml)
//     .then(function (result) {
//         console.dir(result);
//         console.log('Done2');
//     })
//         .catch(function (err) {
//             // Failed
//             const x = err;
//             debugger;
//         });
// }
// export async function xmlTojs(files: ConfigFile[]): Promise<unknown> {
//     // loop through each file and convert it from xml to json
//     // const retObj = {}
//     // const promises = [];
//     // files.map(xml => {
//     //     promises.push(xml2js.parseConfPromises(xml.content)
//     //         .then(function (out) {
//     //             retObj[xml.fileName] = out;
//     //         }))
//     // })
//     // await Promise.all(promises)
//     // // add each file converstion to an object, return object
//     return;
// }
//# sourceMappingURL=xml2Json.js.map