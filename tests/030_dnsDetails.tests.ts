
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
const gslb: GslbApp[] = [];

describe('GTM/DNS parsing/abstraction', async function () {

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

    it(`found gslb object in explosion!`, async function () {

        if (expld.config.gslb) {
            gslb.push(...expld.config.gslb);
        }

        assert.ok(gslb.length != 0)

    });

    it(`expected number of do classes abstracted`, async function () {

        assert.ok(gslb.length > 5);

    });

    it(`basic gtm - high level fqdn details`, async function () {

        assert.ok(typeof gslb![0] == 'object');
        assert.ok(typeof gslb![0].fqdn == 'string');
        assert.ok(typeof gslb![0].type == 'string');
        assert.ok(typeof gslb![1].aliases![0] == 'string');
        
    });
    
    it(`wideip with no pool + description`, async function () {
        
        const piTime = gslb.find(e => e.fqdn === 'piTime314a.int.sci.com')
        assert.ok(piTime?.allPossibleDestinations.length === 0);
        assert.ok(typeof piTime.description == 'string');

    });



});

