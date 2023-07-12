/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use strict';

import fs from 'fs'
import path from 'path';

import XmlStats from '../src/xmlStats';

import { XMLParser } from 'fast-xml-parser';
import { log } from 'console';
import logger from '../src/logger';


// const xmlSlimFilePath = path.join(__dirname, 'archive_generator', 'archive1', 'stat_slim.xml');
const xmlFilePath = path.join(__dirname, 'archive_generator', 'archive1', 'stat_module.xml');
// const xmlFilePath = path.join(__dirname, '..', 'chddc1slb004_vpr_15.1.8.2_07052023_stat_module.xml');
// tests/archive_generator/archive1/mcp_module.xml
const xmlData = fs.readFileSync(xmlFilePath, 'utf-8');

const filePath = path.parse(xmlFilePath);
// get file size
const size = fs.statSync(path.join(filePath.dir, filePath.base)).size;
// try to read file contents
const content = fs.readFileSync(path.join(filePath.dir, filePath.base), 'utf-8');


const statsToGet = [
    'virtual_server_stat',      // general vs stats
    'virtual_server_cpu_stat',  // vs cpu stats
    'gtm_wideip_stat',          // gtm wideip stats
    'profile_clientssl_stat',
    'plane_cpu_stat',
    'rule_stat',
    'asm_cpu_util_stats',
    'asm_learning_suggestions_stats',
    'asm_enforced_entities_stats',
];

const stats: any = {};

describe('XML stats parsing/abstraction', async function () {

    before(async () => {

        console.log('test file: ', __filename);

    });

    it(`diggn stat_module.xml class`, async function () {
        // something

        const xs = new XmlStats();
        await xs.crunch({ fileName: filePath.base, size, content })
        .catch((err) => {
            logger.error(err);
        });

        xs;
    })

    it(`diggn stat_module.xml`, async function () {

        const xmlD = xmlData.toString();

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

        fs.writeFileSync('xmlStats_new1.xml', newXml)
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

    it(`diggn stat_module.xml`, async function () {




        const options = {
            ignoreAttributes: false,
            attributeNamePrefix: "",
            updateTag: (tagName: string, jPath: string, attrs) => {

                // jPath === "Qkproc.cluster.virtual_server_stat"

                if (tagName === 'object' && attrs['name']) {
                    return tagName = attrs['name'];
                }

                // if(jPath.includes('virtual_server_stat') || jPath.includes('virtual_server_cpu_stat')) {

                //     if(tagName === 'object' && attrs['name']) {
                //         return tagName = attrs['name'];
                //     } else {
                //         return;
                //     }
                // } else {
                //     return false;
                // }

                // if(tagName === 'virtual_server_stat') {
                //     tagName;
                // }
            },
        };
        const xmlParser = new XMLParser(options);
        const xJson = xmlParser.parse(xmlData)
        if (xJson) {

            // capture all the cluster data
            for await (const [k, v] of Object.entries(xJson?.Qkproc?.cluster)) {
                // only retrieve the non-empty values
                if (v !== '') {
                    stats[k] = v;
                }
            }
            for await (const [k, v] of Object.entries(xJson?.Qkproc?.blade)) {
                if (v !== '') {
                    stats[k] = v;
                }
            }
        }

        fs.writeFileSync('sbux_xmlStats_1.json', JSON.stringify(stats, undefined, 4))
        stats;

    });


    it(`slim stats`, async function () {

        const vsStats: any[] = [];
        const vsCpuStats: any[] = [];

        Object.values(stats.virtual_server_stat).map(v => vsStats.push(v));


        Object.values(stats.virtual_server_cpu_stat).map(v => vsCpuStats.push(v));


        // const grid = new Grid({
        //     columns: [
        //         {id: 'name', name: 'Name'},
        //         {id: 'avg_5sec', name: 'Average - 5 sec'},
        //         {id: 'avg_1min', name: 'Average - 1 min'},
        //         {id: 'avg_5min', name: 'Average - 5 min'}
        //     ],
        //     data: vsCpuStats
        // });


        vsCpuStats;
    });




    it(`jsdom option`, async function () {


        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const jsdom = require("jsdom");
        const dom = new jsdom.JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
        const x = dom.window.document.querySelector("p").textContent; // 'Hello world'
        x;

        const dom2 = new jsdom.JSDOM('')
        const DOMParser = dom2.window.DOMParser;
        const parser = new DOMParser;
        const doc = parser.parseFromString(xmlData, 'text/xml')
        doc;

    });
});

