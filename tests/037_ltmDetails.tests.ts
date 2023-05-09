
'use strict';

import assert from 'assert';
import path from 'path';

import BigipConfig from '../src/ltm';
import { archiveMake } from './archive_generator/archiveBuilder';
import { Explosion, GslbApp } from '../src/models';


let device: BigipConfig;
let expld: Explosion;
const parsedFileEvents: any[] = [];
const parsedObjEvents: any[] = [];
let testFile = '';


describe('LTM parsing/abstraction', async function () {

    before(async () => {

        console.log('test file: ', __filename);

        testFile = await archiveMake('qkview') as string;
        const testFileDetails = path.parse(testFile);

        device = new BigipConfig();

        device.on('parseFile', (x: any) => parsedFileEvents.push(x))
        device.on('parseObject', (x: any) => parsedObjEvents.push(x))

        await device.loadParseAsync(testFile);
        expld = await device.explode();

    })

    it(`number of expected ltm virtual servers`, async function () {

        const keys = Object.keys(device.configObject.ltm?.virtual!);

        assert.ok(keys.length === 13, 'should find 13 virtual servers');

    });


    it(`number of expected ltm pools`, async function () {

        const keys = Object.keys(device.configObject.ltm?.pool!);

        assert.ok(keys.length === 11, 'should find 11 pools');

    });

    it(`number of expected ltm monitors`, async function () {

        const keys = Object.keys(device.configObject.ltm?.monitor!);

        assert.ok(keys.length === 6, 'should find 6 monitors');

    });

    it(`number of expected ltm snat pools`, async function () {

        const keys = Object.keys(device.configObject.ltm?.snatpool!);

        assert.ok(keys.length === 2, 'should find 2 snat pools');

    });


});

