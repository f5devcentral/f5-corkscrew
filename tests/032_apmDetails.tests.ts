
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

describe('APM parsing/abstraction', async function () {

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

    it(`number of expected apm access profiles`, async function () {

        const keys = Object.keys(device.configObject.apm!.profile!.access!);

        assert.ok(keys.length === 3, 'should find three apm access profiles');
        
    });

    it(`confirm 'apm profile access' structur`, async function () {

        const profile = device.configObject.apm!.profile!.access!['/Common/sslvpn_network_access'];

        assert.ok(profile['accept-languages'].length === 3);
        assert.ok(profile['log-settings'].length === 2);
        assert.ok(typeof profile['access-policy'] === 'string');
        assert.ok(typeof profile.type === 'string');
        
    });



});

