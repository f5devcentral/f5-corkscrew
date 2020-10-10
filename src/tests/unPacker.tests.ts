/* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { unPacker } from '../unPacker'


describe('instantiation unPacker', function() {

    it(`path to actual .conf file`, async function() {

        const x = await unPacker(path.join(__dirname, "./unPacker_test.conf"));
        const expected = fs.readFileSync(path.join(__dirname, "./unPacker_test.conf"), "utf-8");

        assert.deepStrictEqual(x[0].content, expected);
    });

    it(`not a valid path to file`, async function() {
        // should fail to load, log error to logger, return undefined
        const x = await unPacker(path.join(__dirname, "broken-file_path.io"));
        assert.ifError(x);
    });
    
    it(`unpack mini_ucs.tar.gz - success`, async function() {
        const x = await unPacker(path.join(__dirname, "./mini_ucs.tar.gz"));

        const converted = [ x[0].fileName, x[2].size, x[4].fileName ];
        const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf' ];
        assert.deepStrictEqual(converted, expected)
    });

    it(`unPack ucs - success`, async function() {

        const x = await unPacker(path.join(__dirname, "./artifacts/devCloud_10.9.2020.ucs"));

        // capture some key information pieces so we don't have to verify the whole thing
        const converted = [ x[0].fileName, x[2].size, x[4].fileName ];
        const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf' ];
        assert.deepStrictEqual(converted, expected);
    });

    it(`unPack ucs - fail`, async function() {
        // read ucs should fail, log error to logger, return undefined
        const x = await unPacker(path.join(__dirname, "./artifacts/bad.ucs"));
        assert.ifError(x);
    });

    it(`unPack qkview - success`, async function() {
        // //todo:
        const x = await unPacker(path.join(__dirname, "./artifacts/devCloud_10.10.2020.qkview"));
        const converted = [ x[0].fileName, x[2].size, x[4].fileName ];
        const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf' ];
        assert.deepStrictEqual(converted, expected);
    });

    it(`unPack qkview - fail`, async function() {
        // read ucs should fail, log error to logger, return undefined
        const x = await unPacker(path.join(__dirname, "./artifacts/bad.qkview"));
        assert.ifError(x);
    });
    




});
        