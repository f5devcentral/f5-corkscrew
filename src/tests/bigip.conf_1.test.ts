/* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import BigipConfig from '../ltm';


const devCloud01 = fs.readFileSync(path.join(__dirname, "./artifacts/devCloud01_9.23.2020.conf"), "utf-8");
// const tParty = fs.readFileSync(path.join(__dirname, "./artifacts/ben_tParty_9.14.2020.conf"), "utf-8");
// const devLTM = fs.readFileSync(path.join(__dirname, "./artifacts/ben_devLTM_9.14.2020.conf"), "utf-8");
// const raqa = fs.readFileSync(path.join(__dirname, "./artifacts/sldcvcmpltmraqaexth01_9.15.2020_bigip.conf"), "utf-8");

describe('explode bigip.conf tests', function() {

    it(`new explode method`, async function() {
        const devCloud = new BigipConfig(devCloud01);
        const y = devCloud.bigipConf;

        const explode = devCloud.explode();

        assert.deepStrictEqual(y, devCloud01);
    });

    it(`create config object and return raw config`, async function() {
        const devCloud = new BigipConfig(devCloud01);
        const y = devCloud.bigipConf;

        const explode = devCloud.explode();

        let output = '';
        output += '################################################\n';
        output += `###  *** project - corkscrew *** ###\n`;
        output += `###  tmos extractor output\n`;
        output += `###  Section 1: stats\n`;
        output += `###  Section 2: apps\n`;
        output += `###  Section 3: conversion logs (error/info/debug)\n`;
        output += `###  Section 4: configMultiLevelObjects (not object values yet)\n`;
        // output += `###  Section 5: configSingleLevelObjects (another way to search config)\n`;
        output += `###  ${new Date().toISOString()}\n`;
        output += '################################################\n';

        output += `\n################################################\n`;
        output += `### explosion stats ##########\n`;
        output += `### uuid: ${explode.id}\n`;
        output += `### dateTime: ${explode.dateTime}\n`;
        // output += `### dateTime: ${explode.}\n`;
        output += JSON.stringify(explode.stats, undefined, 2);
        output += `\n################################################\n`;
        
        explode.config.apps.forEach( el => {
            output += '\n################################################\n';
            output += el.config;
            output += '\n################################################\n';
        })
        
        output += '\n\n';
        output += '#######################################\n';
        output += '### conversion log ####################\n';
        output += explode.logs;
        
        output += '\n\n';
        output += '#######################################\n';
        output += '### configMultiLevelObjects ###########\n';
        output += JSON.stringify(devCloud.configMultiLevelObjects, undefined, 2);
        
        // output += '\n\n';
        // output += '#######################################\n';
        // output += '### configSingleLevelObjects ##########\n';
        // output += JSON.stringify(devCloud.configSingleLevelObjects, undefined, 2);
        
        fs.writeFileSync(path.join(__dirname, "./devCloud01_conversionOutput.txt"), output);

        assert.deepStrictEqual(y, devCloud01);
    });

    // it(`get virtuals from iRule - no virtuals`, async function() {
    //     //todo:
    // });

    // it(`get nodes from iRule`, async function() {
    //     //todo:
    // });

    // it(`get nodes from iRule - no nodes`, async function() {
    //     //todo:
    // });

    
    // it(`get pools from Local Traffic Policy (LTP)`, async function() {

    //     const LTPwithPools = fs.readFileSync(path.join(__dirname, "../artifacts/pools_LTP.tcl"), "utf-8");
        
    //     const pools = poolsInLTP(LTPwithPools);

    //     const expected = ["css_pool","jpg.pool","js.io_t80_pool"];

    //     assert.deepStrictEqual(pools, expected);
    // });


});
        