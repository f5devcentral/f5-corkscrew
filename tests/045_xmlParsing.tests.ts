/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use strict';

import fs from 'fs'
import path from 'path';

import XmlStats from '../src/xmlStats';

import { XMLParser } from 'fast-xml-parser';
import logger from '../src/logger';
import BigipConfig from '../src/ltm';
import { Explosion } from '../src/models';
import { archiveMake } from './archive_generator/archiveBuilder';
import assert from 'assert';


// const xmlSlimFilePath = path.join(__dirname, 'archive_generator', 'archive1', 'stat_slim.xml');
const statFilePath = path.join(__dirname, 'archive_generator', 'archive1', 'stat_module.xml');
const statXmlData = fs.readFileSync(statFilePath, 'utf-8');
const statFilePathParsed = path.parse(statFilePath);
const statSize = fs.statSync(path.join(statFilePathParsed.dir, statFilePathParsed.base)).size;


const mcpFilePath = path.join(__dirname, 'archive_generator', 'archive1', 'mcp_module.xml');
const mcpXmlData = fs.readFileSync(mcpFilePath, 'utf-8');
const mcpFilePathParsed = path.parse(mcpFilePath);
const mcpSize = fs.statSync(path.join(mcpFilePathParsed.dir, mcpFilePathParsed.base)).size;

// tests/archive_generator/archive1/mcp_module.xml


let device: BigipConfig;
let expld: Explosion;
const parsedFileEvents: any[] = [];
const parsedObjEvents: any[] = [];
let testFile = '';

const stats: any = {};

describe('XML stats parsing/abstraction', async function () {

    before(async () => {

        testFile = await archiveMake('qkview') as string;
        const testFileDetails = path.parse(testFile);

        console.log('test file: ', __filename);

    });

    it(`diggn stat_module.xml+mcp_module.xml class`, async function () {
        // something

        // instantiate the class
        const xs = new XmlStats();
        
        // load the xml files
        await xs.load({ fileName: statFilePathParsed.base, size: statSize, content: statXmlData })
        await xs.load({ fileName: mcpFilePathParsed.base, size: mcpSize, content: mcpXmlData })
        
        // crunch the data
        const resp = await xs.crunch()
        .catch((err) => {
            // catch any errors
            logger.error(err);
        });

        // write the output to a file for example/demo purposes
        if (resp) {
            fs.writeFileSync('exampleRankings1.json', JSON.stringify(resp, undefined, 4));
        }

        // add assertions to test outputs
        assert.ok(resp);
    })


    it(`XmlStats integration with parent LTM class`, async function () {
        
        
        device = new BigipConfig();

        device.on('parseFile', (x: any) => parsedFileEvents.push(x))
        device.on('parseObject', (x: any) => parsedObjEvents.push(x))

        const parseTime = await device.loadParseAsync(testFile)
            .then(async parseTime => {
                expld = await device.explode();
                return parseTime;
            });

        parseTime;

    })

    it(`diggn stat_module.xml original dev`, async function () {

        /**
         * this was the original dev code exploring the idea of just regexing the xml
         * and then building a new xml document from the matches, then parsing to json
         * 
         * this ended up being much faster and cleaner than trying to parse the full xml to json
         *    This method takes less than a second, 
         *      while the other method took almost a minute for <10MB xml
         */

        const xmlD = statXmlData.toString();

        // <?xml version="1.0" encoding="UTF-8"\?>
        const xmlHeaderRx = /^.+?$/m;   // line 1
        const qkProcVersionRx = /<Qkproc version="(?<version>[\d\.]+)">/;   // line 2
        const vsStatsRx = / *?<virtual_server_stat>\n[\S\s]+?\n +<\/virtual_server_stat>\n/g;
        const vsStatsCpuRx = / *?<virtual_server_cpu_stat>\n[\S\s]+?\n +<\/virtual_server_cpu_stat>\n/g;
        const gtmWipStatsRx = / *?<gtm_wideip_stat>\n[\S\s]+?\n +<\/gtm_wideip_stat>\n/g;
        const clientSslStatsRx = / *?<profile_clientssl_stat>\n[\S\s]+?\n +<\/profile_clientssl_stat>\n/g;
        const cpuStatsRx = / *?<plane_cpu_stat>\n[\S\s]+?\n +<\/plane_cpu_stat>\n/g;
        const ruleStatsRx = / *?<rule_stat>\n[\S\s]+?\n +<\/rule_stat>\n/g;
        const asmCpuStatsRx = / *?<asm_cpu_util_stats>\n[\S\s]+?\n +<\/asm_cpu_util_stats>\n/g;
        const asmLearningStatsRx = / *?<asm_learning_suggestions_stats>\n[\S\s]+?\n +<\/asm_learning_suggestions_stats>\n/g;
        const asmEnforcedEntsStatsRx = / *?<asm_enforced_entities_stats>\n[\S\s]+?\n +<\/asm_enforced_entities_stats>\n/g;

        const xmlHeader = xmlD.match(xmlHeaderRx);   // capture the xml header
        const procVersion = xmlD.match(qkProcVersionRx);  // capture the qkproc version
        // const vsStat1 = xmlData.match(rx1);


        // build an array of the xml data
        const mXml = [xmlHeader?.[0] as string]
        mXml.push(procVersion?.[0] as string);
        mXml.push(xmlD.match(vsStatsRx)?.[0] as string);
        mXml.push(xmlD.match(vsStatsCpuRx)?.[0] as string);
        mXml.push(xmlD.match(gtmWipStatsRx)?.[0] as string);
        mXml.push(xmlD.match(clientSslStatsRx)?.[0] as string);
        mXml.push(xmlD.match(cpuStatsRx)?.[0] as string);
        mXml.push(xmlD.match(ruleStatsRx)?.[0] as string);
        mXml.push(xmlD.match(asmCpuStatsRx)?.[0] as string);
        mXml.push(xmlD.match(asmLearningStatsRx)?.[0] as string);
        mXml.push(xmlD.match(asmEnforcedEntsStatsRx)?.[0] as string);
        mXml.push('</Qkproc>');



        // need to clean up system objects under the irules/clientssl profiles


        const options = {
            ignoreAttributes: false,
            attributeNamePrefix: "",
            updateTag: (tagName: string, jPath: string, attrs) => {
                if (tagName === 'object' && attrs['name']) {
                    return tagName = attrs['name'];
                }
            },
        };
        const xmlParser = new XMLParser(options);

        const newXml = mXml.join('\n');
        console.log(newXml.split('\n').length);

        // fs.writeFileSync('xmlStats_new1.xml', newXml)
        const xJson = xmlParser.parse(newXml);

        if (xJson) {

            // capture all the cluster data
            // for await (const [k, v] of Object.entries(xJson?.Qkproc?.cluster)) {
            //     // only retrieve the non-empty values
            //     if(v !== '') {
            //         stats[k] = v;
            //     }
            // }
            // for await (const [k, v] of Object.entries(xJson?.Qkproc?.blade)) {
            //     if(v !== '') {
            //         stats[k] = v;
            //     }
            // }
        }



    });

    // it(`diggn stat_module.xml`, async function () {


    //     /**
    //      * original parsing xml to json dev
    //      */

    //     const options = {
    //         ignoreAttributes: false,
    //         attributeNamePrefix: "",
    //         updateTag: (tagName: string, jPath: string, attrs) => {

    //             // jPath === "Qkproc.cluster.virtual_server_stat"

    //             if (tagName === 'object' && attrs['name']) {
    //                 return tagName = attrs['name'];
    //             }

    //             // if(jPath.includes('virtual_server_stat') || jPath.includes('virtual_server_cpu_stat')) {

    //             //     if(tagName === 'object' && attrs['name']) {
    //             //         return tagName = attrs['name'];
    //             //     } else {
    //             //         return;
    //             //     }
    //             // } else {
    //             //     return false;
    //             // }

    //             // if(tagName === 'virtual_server_stat') {
    //             //     tagName;
    //             // }
    //         },
    //     };
    //     const xmlParser = new XMLParser(options);
    //     const xJson = xmlParser.parse(statXmlData)
    //     if (xJson) {

    //         // capture all the cluster data
    //         for await (const [k, v] of Object.entries(xJson?.Qkproc?.cluster)) {
    //             // only retrieve the non-empty values
    //             if (v !== '') {
    //                 stats[k] = v;
    //             }
    //         }
    //         for await (const [k, v] of Object.entries(xJson?.Qkproc?.blade)) {
    //             if (v !== '') {
    //                 stats[k] = v;
    //             }
    //         }
    //     }

    //     fs.writeFileSync('s_xmlStats_1.json', JSON.stringify(stats, undefined, 4))
    //     stats;

    // });


    // it(`slim stats`, async function () {

    //     // sliming of stats to test gridjs output

    //     const vsStats: any[] = [];
    //     const vsCpuStats: any[] = [];

    //     Object.values(stats.virtual_server_stat).map(v => vsStats.push(v));


    //     Object.values(stats.virtual_server_cpu_stat).map(v => vsCpuStats.push(v));


    //     // const grid = new Grid({
    //     //     columns: [
    //     //         {id: 'name', name: 'Name'},
    //     //         {id: 'avg_5sec', name: 'Average - 5 sec'},
    //     //         {id: 'avg_1min', name: 'Average - 1 min'},
    //     //         {id: 'avg_5min', name: 'Average - 5 min'}
    //     //     ],
    //     //     data: vsCpuStats
    //     // });


    //     vsCpuStats;
    // });




    // it(`jsdom option`, async function () {

    //     // this option was an attempt to use jsdom to parse the xml data
    //     // the hope was to filter out the xml we wanted, then convert to json
    //     // this method proved to be complicated and slow
    //     //  since DOM parsing creates a ton of overhead

    //     // eslint-disable-next-line @typescript-eslint/no-var-requires
    //     const jsdom = require("jsdom");
    //     const dom = new jsdom.JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
    //     const x = dom.window.document.querySelector("p").textContent; // 'Hello world'
    //     x;

    //     const dom2 = new jsdom.JSDOM('')
    //     const DOMParser = dom2.window.DOMParser;
    //     const parser = new DOMParser;
    //     const doc = parser.parseFromString(statXmlData, 'text/xml')
    //     doc;

    // });
});

