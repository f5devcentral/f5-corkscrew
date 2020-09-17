/* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { LTMconfig } from '../src/ltm';


const tParty = fs.readFileSync(path.join(__dirname, "../artifacts/ben_tParty_9.14.2020.conf"), "utf-8");
const devLTM = fs.readFileSync(path.join(__dirname, "../artifacts/ben_devLTM_9.14.2020.conf"), "utf-8");
const raqa = fs.readFileSync(path.join(__dirname, "../artifacts/sldcvcmpltmraqaexth01_9.15.2020_bigip.conf"), "utf-8");

describe('bigip.conf tests', function() {

    it(`create config object and return raw config`, async function() {
        const x = new LTMconfig(devLTM);
        const y = x.bigipConf;
        // const z = x.rev();

        const tPartyC = new LTMconfig(tParty);
        const raqaC = new LTMconfig(raqa);

        const raqaCapps = raqaC.apps();
        let write = '';
        raqaCapps.forEach(el => {
            // write.concat(el.config);
            fs.appendFileSync(path.join(__dirname, "./out.txt"), el.config);
        });
        console.log(write);

        assert.deepStrictEqual(y, devLTM);
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
        