/* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { parseLoad } from '../unPacker'




// const iRuleWithPools = fs.readFileSync(path.join(__dirname, "./artifacts/pools.irule"), "utf-8");
// const iRuleNoRef = fs.readFileSync(path.join(__dirname, "./artifacts/pools_noRef.irule"), "utf-8");

describe('instantiation unPacker', function() {

    it(`path to actual .conf file`, async function() {

        const x = await parseLoad(path.join(__dirname, "./unPacker_test.conf"));
        const expected = fs.readFileSync(path.join(__dirname, "./unPacker_test.conf"), "utf-8");

        // assert.strictEqual(x[0].fileName, expected, 'should return file name')
        assert.strictEqual(x[0].content, expected, 'should return .conf contents')
    });

    it(`not a valid path to file`, async function() {
        const x = await parseLoad(path.join(__dirname, "broken-file-path"));
        assert.ifError(x);
    });
    
    it(`parse mini_ucs.tar.gz input`, async function() {
        const x = await parseLoad(path.join(__dirname, "./mini_ucs.tar.gz"));
        assert.strictEqual(x[0].fileName, 'config/bigip.conf', 'should return first file name')
    });

    it(`get nodes from iRule - no nodes`, async function() {
        //todo:
    });
    




});
        