
'use strict';

import assert from 'assert';
import path from 'path';

import BigipConfig from '../src/ltm';
import { archiveMake } from './archive_generator/archiveBuilder';
import { Explosion, GslbApp, TmosApp } from '../src/models';
import exp from 'constants';


let device: BigipConfig;
let expld: Explosion;
const parsedFileEvents: any[] = [];
const parsedObjEvents: any[] = [];
let testFile = '';
let app: TmosApp | undefined;


describe('LTM parsing/abstraction', async function () {

    before(async () => {

        console.log('test file: ', __filename);

        testFile = await archiveMake('qkview') as string;
        const testFileDetails = path.parse(testFile);

        device = new BigipConfig();

        device.on('parseFile', (x: any) => parsedFileEvents.push(x))
        device.on('parseObject', (x: any) => parsedObjEvents.push(x))

        await device.loadParseAsync(testFile)
            .then(async x => {
                expld = await device.explode();
            });

    })

    it(`did we find the bigiq app?`, async function () {

        app = expld.config.apps?.find(x => x.name === 'bigiq.benlab.io_t443_vs');
        assert.ok(app);

        const vsLine = app.lines.find(x => x.startsWith('ltm virtual '))
        assert.ok(vsLine);

    });

    it(`bigiq app 1st level details`, async function () {

        assert.deepStrictEqual(app?.destination, '10.200.244.15:443');
        assert.deepStrictEqual(typeof app?.description, 'string');
        assert.deepStrictEqual(app?.partition, 'Common');
        assert.deepStrictEqual(app?.snat, 'automap');

    });


    it(`bigiq app general pool details`, async function () {

        const exected = {
            name: "bigiq.benlab.io_t443_pool",
            partition: "Common",
            members: {
              "/Common/10.200.244.15:443": {
                address: "10.200.244.15",
              },
            },
            monitor: [
              {
                name: "bigiq_https_monitor",
                type: "https",
                partition: "Common",
                adaptive: "disabled",
                "defaults-from": "/Common/https",
                description: "bigiq ui monitor",
                interval: "5",
                "ip-dscp": "0",
                recv: "none",
                "recv-disable": "none",
                send: "GET /something \\r\\n",
                "time-until-up": "0",
                timeout: "16",
              },
            ],
          }

        //  are the general pool details there
        assert.deepStrictEqual(app?.pool, exected);

        // pool config line
        const poolLine = app.lines.find(x => x.startsWith('ltm pool '))
        // pool monitor line
        const poolMonitorLine = app.lines.find(x => x.startsWith('ltm monitor '))

        assert.ok(poolLine);
        assert.ok(poolMonitorLine);

    });

    it(`bigiq app profiles`, async function () {

        // confirm number of profiles
        assert.deepStrictEqual(app?.profiles?.length, 4);

        // confirm profile names
        assert.deepStrictEqual(app?.profiles, [
            "/Common/ASM_basic_policy_1",
            "/Common/f5-tcp-progressive",
            "/Common/http",
            "/Common/websecurity",
        ]);

        // todo: add asm profile to lines
        // const asmProfLine = app.lines.find(x => x.startsWith('ltm monitor '))
        // assert.ok(asmProfLine);

    });

    it(`bigiq app policy`, async function () {

        // confirm profile names
        assert.deepStrictEqual(app?.policies, [
            "/Common/asm_auto_l7_policy__bigiq.benlab.io_t443_vs",
          ]);

        // confirm profile line
        const asmProfLine = app.lines.find(x => x.startsWith('ltm policy /Common/asm_auto_l7_policy__bigiq.benlab.io_t443_vs'))
        assert.ok(asmProfLine);

    });


    it(`pool monitor tests`, async function () {

        // app with custom monitor?
        'pool with build in monitor'
        'pool with custome monitor'
        'pool with multiple monitors - all required - one custom - app3-t8443'
        'pool with multiple monitors - some required - one custom'

        assert.ok(true);
    });


});

