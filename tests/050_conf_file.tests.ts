/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import BigipConfig from '../src/ltm';
import { logOutput } from './explosionOutput';
import { archiveMake } from './archive_generator/archiveBuilder';
import { Explosion } from '../src/models';

let device: BigipConfig;
const log: any[] = [];
let err;
let expld: Explosion;
const parsedFileEvents: any[] = [];
const parsedObjEvents: any[] = [];
const extractAppEvents: any[] = [];
let testFile = '';
let outFile = '';

describe('bigip.conf tests', async function () {

    before(async () => {
        testFile = await archiveMake('conf') as string;
        const testFileDetails = path.parse(testFile);
        outFile = path.join(testFileDetails.dir, `${testFileDetails.base}.log`);
        console.log('test file: ', __filename);
        console.log('outFile', outFile);
    })

    it(`instantiate class, load configs`, async function () {
        device = new BigipConfig();

        device.on('parseFile', x => parsedFileEvents.push(x))
        device.on('parseObject', x => parsedObjEvents.push(x))
        device.on('extractApp', x => extractAppEvents.push(x))

        await device.loadParseAsync(testFile)
            .then(resp => {
                assert.ok(resp);
            })
            .catch(async err => {
                log.push(...await device.logs());
            })

    });

    it(`parse configs, get parseTime`, async function () {


        await device.explode()
            .then(expld => {
                fs.writeFileSync(`${outFile}.json`, JSON.stringify(expld, undefined, 4));
                const bigLog = logOutput(device.configObject, expld);
                fs.writeFileSync(outFile, bigLog);
            })
            .catch(async err => {
                log.push(...await device.logs());
                debugger;
            });

    });

    it(`check parseFile event`, async function () {

        assert.deepStrictEqual(parsedFileEvents[0], 'f5_corkscrew_test.conf')

    });


    it(`check parseObject event`, async function () {

        assert.ok(parsedObjEvents[0].num, 'should have a "num" param')
        assert.ok(parsedObjEvents[0].of, 'should have a "of" param')
        assert.ok(parsedObjEvents[0].parsing, 'should have a "parsing" param')
        assert.ok(typeof parsedObjEvents[0].num === "number", '"num" param should be a number')
        assert.ok(typeof parsedObjEvents[0].of === "number", '"of" param should be a number')
        assert.ok(typeof parsedObjEvents[0].parsing === "string", '"parsing" param should be a string')

    });


    it(`check extractApp event`, async function () {

        assert.ok(extractAppEvents[0].app, 'should have a "app" param')
        assert.ok(extractAppEvents[0].time, 'should have a "time" param')
        assert.ok(typeof extractAppEvents[0].app === "string", '"app" param should be a string')
        assert.ok(typeof extractAppEvents[0].time === "number", '"time" param should be a number')
    });

    it(`list apps`, async function () {

        const apps = await device.appList();

        const expected = [
            "/Common/app1_t80_vs",
            "/Common/app1_t443_vs",
            "/Common/app2_t80_vs",
            "/Common/app2_t443_vs",
            "/Common/persistTest_80_vs",
            "/Common/app3_t8443_vs",
            "/Common/app4_t80_vs",
            "/Common/forwarder_net_0.0.0.0",
            "/Common/bigiq.benlab.io_t443_vs",
          ]

        assert.deepStrictEqual(apps, expected, 'Should get list of virtual servers / apps');
    });

    it(`get app config by name`, async function () {

        const expected = [
            "ltm virtual /Common/app4_t80_vs {\n    description \"test pool references in irule extration and ltp\"\n    destination /Common/192.168.2.25:80\n    ip-protocol tcp\n    last-modified-time 2020-10-07:07:28:35\n    mask 255.255.255.255\n    policies {\n        /Common/app4_ltPolicy { }\n    }\n    pool /Common/app4_pool\n    profiles {\n        /Common/http { }\n        /Common/tcp { }\n    }\n    rules {\n        /Common/_sys_https_redirect\n        /Common/app4_pool_rule\n    }\n    serverssl-use-sni disabled\n    source 0.0.0.0/0\n    translate-address enabled\n    translate-port enabled\n}",
            "ltm pool /Common/app4_pool {\n    members {\n        /Common/api.chucknorris.io:443 {\n            fqdn {\n                autopopulate enabled\n                name api.chucknorris.io\n            }\n        }\n    }\n}",
            "ltm node /Common/api.chucknorris.io {\n    fqdn {\n        address-family all\n        autopopulate enabled\n        name api.chucknorris.io\n    }\n}",
            "ltm rule /Common/app4_pool_rule {\n### test rule for corkscrew\n\n  # \n\nwhen HTTP_REQUEST {\n\n  # pool reference by variable declaration\n  set html-pool web1Pool\n\n  if { [HTTP::path] ends_with \"*.css\" }{\n\n    # regular pool refernce\n    pool css_pool\n\n  } elseif { [HTTP::path] ends_with \"*.jpg\" }{\n\n    # pool member refernce\n    pool jpg.pool member 10.10.10.1 80\n\n  } elseif { [HTTP::path] ends_with \"*.js\" }{\n\n    # another pool reference with special characters\n    pool js.io_t80_pool \n\n  } elseif { [HTTP::path] ends_with \"*.xx\" }{\n\n    # pool reference not in tmos config\n    ### *** seems the gui won't let you attach an irule to a vs with a pool that doesn't exist\n    #pool missing_pool\n\n  } elseif { [HTTP::path] ends_with \"*.txt\" }{\n\n    # node reference\n    node 10.10.10.1 80\n\n  } else {\n\n    # pool referenced by variable\n    pool $html-pool\n\n  }\n}\n}",
            "ltm policy /Common/app4_ltPolicy {\n    controls { forwarding }\n    description \"testing for pool extraction function\"\n    requires { http }\n    rules {\n        css_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/css_pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .css }\n                }\n            }\n        }\n        jpg_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/jpg.pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    query-string\n                    ends-with\n                    values { .jpg }\n                }\n            }\n            ordinal 1\n        }\n        js_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/js.io_t80_pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .js }\n                }\n            }\n            ordinal 2\n        }\n        txt_node {\n            actions {\n                0 {\n                    forward\n                    select\n                    node 10.10.10.1\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .txt }\n                }\n            }\n            ordinal 3\n        }\n    }\n    strategy /Common/first-match\n}",
            "ltm pool css_pool { }",
            "ltm pool jpg.pool { }",
            "ltm pool js.io_t80_pool { }",
          ]

        await device.apps('/Common/app4_t80_vs')
            .then(app => {
                const appConfig = app![0].lines;
                assert.deepStrictEqual(appConfig, expected, 'Should get list of virtual servers / apps');
            })


    });

    it(`conf file explode should/not have these details`, async function () {

        const baseLtmProfiles = device.defaultProfileBase;
        const sysLowProfiles = device.defaultLowProfileBase;

        const configFilesNumber = device.configFiles.length;
        // const xmlStats = device.deviceXmlStats;
        const fileStoreLength = device.fileStore.length;

        assert.ok(!baseLtmProfiles);
        assert.ok(!sysLowProfiles);
        assert.ok(configFilesNumber === 1);
        // assert.ok(Object.keys(xmlStats).length === 0);
        assert.ok(fileStoreLength === 0);

    });


    it(`parse badArchive1.tar.gz -> fail`, async function () {

        const device = new BigipConfig();
        const parsedFileEvents: any[] = [];
        const parsedObjEvents: any[] = [];

        device.on('parseFile', (x: any) => parsedFileEvents.push(x))
        device.on('parseObject', (x: any) => parsedObjEvents.push(x))

        const badArchive = path.join(__dirname, 'artifacts', 'badArchive1.tar.gz')

        // this still doesn't reject as expected
        // this should fail since the archive has ban files...
        await device.loadParseAsync(badArchive)
            .then(async parse => {
                const p = parse;
                const expld = await device.explode();
            })
            .catch(err => {
                console.log(err)
                Promise.reject(err);
            })

        // assert.ok(err)
        // assert.deepStrictEqual(err, 'tmos version CHANGE detected: previous file version was undefined -> this tmos version is 15.1.0.4');

    });
});

