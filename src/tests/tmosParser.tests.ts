/* eslint-disable @typescript-eslint/no-empty-function */
'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { parseTmosConfig } from '../tmosParser';


// const iRuleWithPools = fs.readFileSync(path.join(__dirname, "./artifacts/pools.irule"), "utf-8");
// const iRuleNoRef = fs.readFileSync(path.join(__dirname, "./artifacts/pools_noRef.irule"), "utf-8");

const devCloud01 = fs.readFileSync(path.join(__dirname, "./artifacts/devCloud01_10.7.2020.conf"), "utf-8");
const monster = fs.readFileSync(path.join(__dirname, "../../private/monster_bigip.conf"), "utf-8");


describe('tmos config parser tests', function() {

    it(`tmos config file to json tree`, function() {
        const resp = parseTmosConfig(devCloud01);

        const expected = {
            totalObjectCount: 154,
            ltmObjectCount: 0,
            lineCount: 1125,
        }

        assert.deepStrictEqual(resp.totalObjectCount, expected.totalObjectCount);
        assert.deepStrictEqual(resp.lineCount, expected.lineCount);
    });

    it(`tmos config file to json tree - monster config`, function() {
        const resp = parseTmosConfig(monster);

        const expected = {
            totalObjectCount: 0,
            ltmObjectCount: 12804,
            lineCount: 222681,
        }

        assert.deepStrictEqual(resp.ltmObjectCount, expected.ltmObjectCount);
        assert.deepStrictEqual(resp.lineCount, expected.lineCount);
    });

    it(`get nodes from iRule`, async function() {
        //todo:
    });

    it(`get nodes from iRule - no nodes`, async function() {
        //todo:
    });

});