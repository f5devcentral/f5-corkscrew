/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import BigipConfig from '../src/ltm';
import { logOutput } from './explosionOutput';

/**
 * this test suite can run the ucs or qkview, either should produce the same results
 */

const testFile = path.join(__dirname, 'artifacts', 'devCloud_10.10.2020.qkview');
const testFileDetails = path.parse(testFile);
const outFile = path.join(testFileDetails.dir, `${testFileDetails.base}.log`)
console.log('outFile', outFile);

describe('explode devCloud qkview tests', async function() {
    
    let device: BigipConfig;
    let log;
    let err;
    const parsedFileEvents: string[] = []
    const parsedObjEvents: string[] = []

    it(`instantiate class, load/parse configs - async`, async function() {
        this.timeout(300000) // 5 minute timeout
        
        device = new BigipConfig();


        device.on('parseFile', x => {
            parsedFileEvents.push(x)
        })
        device.on('parseObject', x => {
            parsedObjEvents.push(x)
        })

        await device.loadParseAsync(testFile)
        .then( x => {
            // just here for a spot to put a breaking point
            assert.deepStrictEqual(x, undefined)
            fs.writeFileSync(`${outFile}.xml.json`, JSON.stringify(device.deviceXmlStats, undefined, 4));
        })
        .catch( y => {
            err = y;
            log = device.logs()
            debugger;
        })
        
        await device.explode()
        .then( expld => {
            // debugger;
        })
        .catch( thisErr => {
            err = thisErr;
            log = device.logs()
            debugger
        });


        // this.done();        
    });

    it(`parse configs, get parseTime`, function() {
        
        device.on('parseFile', x => parsedFileEvents.push(x) )
        device.on('parseObject', x => parsedObjEvents.push(x) )

        const parseTime = device.parse();
        const expld = device.explode();

        fs.writeFileSync(`${outFile}.json`, JSON.stringify(expld, undefined, 4));
        assert.ok(parseTime, 'should be a number');
    });

    it(`list apps`, async function() {

        const apps = await device.appList();

        const expected = [
            "/Common/app1_t80_vs",
            "/Common/app1_t443_vs",
            "/Common/app2_t80_vs",
            "/Common/app2_t443_vs",
            "/Common/app3_t8443_vs",
            "/Common/app4_t80_vs",
            "/Common/forwarder_net_0.0.0.0",
            "/foo/defaultsUDP_5555/serviceMain"
          ];
        
        assert.deepStrictEqual(apps, expected, 'Should get list of virtual servers / apps');
    });

    it(`get app config by name`, async function() {

        const app = await device.apps('/Common/app4_t80_vs');
        const expected = [
            "ltm virtual /Common/app4_t80_vs {\n    description \"test pool references in irule extration and ltp\"\n    destination /Common/192.168.2.25:80\n    ip-protocol tcp\n    last-modified-time 2020-10-07:07:28:35\n    mask 255.255.255.255\n    policies {\n        /Common/app4_ltPolicy { }\n    }\n    pool /Common/app4_pool\n    profiles {\n        /Common/http { }\n        /Common/tcp { }\n    }\n    rules {\n        /Common/_sys_https_redirect\n        /Common/app4_pool_rule\n    }\n    serverssl-use-sni disabled\n    source 0.0.0.0/0\n    translate-address enabled\n    translate-port enabled\n}",
            "ltm pool /Common/app4_pool {\n    members {\n        /Common/api.chucknorris.io:443 {\n            fqdn {\n                autopopulate enabled\n                name api.chucknorris.io\n            }\n        }\n    }\n}",
            "ltm node /Common/api.chucknorris.io {\n    fqdn {\n        address-family all\n        autopopulate enabled\n        name api.chucknorris.io\n    }\n}",
            "ltm rule /Common/app4_pool_rule {\n### test rule for corkscrew\n\n  # \n\nwhen HTTP_REQUEST {\n\n  # pool reference by variable declaration\n  set html-pool web1Pool\n\n  if { [HTTP::path] ends_with \"*.css\" }{\n\n    # regular pool refernce\n    pool css_pool\n\n  } elseif { [HTTP::path] ends_with \"*.jpg\" }{\n\n    # pool member refernce\n    pool jpg.pool member 10.10.10.1 80\n\n  } elseif { [HTTP::path] ends_with \"*.js\" }{\n\n    # another pool reference with special characters\n    pool js.io_t80_pool \n\n  } elseif { [HTTP::path] ends_with \"*.xx\" }{\n\n    # pool reference not in tmos config\n    ### *** seems the gui won't let you attach an irule to a vs with a pool that doesn't exist\n    #pool missing_pool\n\n  } elseif { [HTTP::path] ends_with \"*.txt\" }{\n\n    # node reference\n    node 10.10.10.1 80\n\n  } else {\n\n    # pool referenced by variable\n    pool $html-pool\n\n  }\n}\n}",
            "ltm pool /Common/css_pool { }",
            "ltm pool /Common/jpg.pool { }",
            "ltm pool /Common/js.io_t80_pool { }",
            "ltm policy /Common/app4_ltPolicy {\n    controls { forwarding }\n    description \"testing for pool extraction function\"\n    requires { http }\n    rules {\n        css_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/css_pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .css }\n                }\n            }\n        }\n        jpg_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/jpg.pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    query-string\n                    ends-with\n                    values { .jpg }\n                }\n            }\n            ordinal 1\n        }\n        js_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/js.io_t80_pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .js }\n                }\n            }\n            ordinal 2\n        }\n        txt_node {\n            actions {\n                0 {\n                    forward\n                    select\n                    node 10.10.10.1\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .txt }\n                }\n            }\n            ordinal 3\n        }\n    }\n    strategy /Common/first-match\n}",
          ];

        const appConfig = app![0].config;
        
        assert.deepStrictEqual(appConfig, expected, 'Should get list of virtual servers / apps');
    });

    // it(`explode config output`, async function() {

    //     const explode = await device.explode()
    //     .then( exp => {
    //         return exp
    //     })
    //     .catch( err => {
    //         debugger;
    //     });

    //     // const bigLog = logOutput(device.configObject, explode);

    //     // fs.writeFileSync(outFile, bigLog);

    //     assert.ok(explode);
    // });
});

