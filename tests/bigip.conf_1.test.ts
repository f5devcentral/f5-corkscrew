/* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { LTMconfig } from '../src/ltm';


const devCloud01 = fs.readFileSync(path.join(__dirname, "../artifacts/devCloud01_9.17.2020.conf"), "utf-8");
const tParty = fs.readFileSync(path.join(__dirname, "../artifacts/ben_tParty_9.14.2020.conf"), "utf-8");
const devLTM = fs.readFileSync(path.join(__dirname, "../artifacts/ben_devLTM_9.14.2020.conf"), "utf-8");
const raqa = fs.readFileSync(path.join(__dirname, "../artifacts/sldcvcmpltmraqaexth01_9.15.2020_bigip.conf"), "utf-8");

describe('explode bigip.conf tests', function() {

    it(`create config object and return raw config`, async function() {
        const devCloud = new LTMconfig(devCloud01);
        const y = devCloud.bigipConf;
        // const z = x.rev();
        
        // const devLTMc = new LTMconfig(devLTM);
        // const tPartyC = new LTMconfig(tParty);
        // const raqaC = new LTMconfig(raqa);

        const apps = devCloud.apps();

        const dateTime = new Date();
        const dateT1 = dateTime.toISOString();
        const dateT2 = dateTime.toLocaleString();
        const dateT3 = dateTime.toUTCString();

        let output = '';
        output += '################################################\n';
        output += `###  ${dateT1}\n`;
        output += `###  ${dateT2}\n`;
        output += `###  ${dateT3}\n`;
        output += '################################################\n';

        apps.forEach( el => {
            output += '\n################################################\n';
            output += el.config;
            output += '\n################################################\n';
        })

        output += devCloud.logs();
        fs.writeFileSync(path.join(__dirname, "./test.tcl"), output);

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
        