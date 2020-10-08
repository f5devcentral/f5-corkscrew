/* eslint-disable @typescript-eslint/no-empty-function */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import BigipConfig from '../ltm';


// const devCloud01 = fs.readFileSync(path.join(__dirname, "../../private/monster_bigip.conf"), "utf-8");
const devCloud01 = fs.readFileSync(path.join(__dirname, "./artifacts/devCloud01_10.7.2020.conf"), "utf-8");
// const devCloud01 = fs.readFileSync(path.join(__dirname, "./artifacts/devCloud01_9.23.2020.conf"), "utf-8");
// const tParty = fs.readFileSync(path.join(__dirname, "./artifacts/ben_tParty_9.14.2020.conf"), "utf-8");
// const devLTM = fs.readFileSync(path.join(__dirname, "./artifacts/ben_devLTM_9.14.2020.conf"), "utf-8");
// const raqa = fs.readFileSync(path.join(__dirname, "./artifacts/sldcvcmpltmraqaexth01_9.15.2020_bigip.conf"), "utf-8");

describe('explode devCloud tests', function() {

    let device;

    it(`instantiate class, get config`, function() {
        device = new BigipConfig(devCloud01);
        assert.deepStrictEqual(device.bigipConf, devCloud01);
    });

    it(`parse configs, get parseTime`, function() {
        const parseTime = device.parse();
        assert.ok(parseTime, 'should be a number');
    });

    it(`list apps, get parseTime`, function() {
        // const devCloud = new BigipConfig(devCloud01);
        // const y = devCloud.bigipConf;

        // const explode = devCloud.explode();
        // const parseTime = device.parse();
        const apps = device.appList();

        // // const app = devCloud.apps('/Common/app4_t80_vs');
        // const app = devCloud.apps();
        const expected = [
            "/Common/app1_t80_vs",
            "/Common/app1_t443_vs",
            "/Common/app2_t80_vs",
            "/Common/app2_t443_vs",
            "/Common/app3_t8443_vs",
            "/Common/app4_t80_vs",
            "/Common/forwarder_net_0.0.0.0",
          ];
        
        assert.deepStrictEqual(apps, expected, 'Should get list of virtual servers / apps');
    });

    it(`list apps, get parseTime`, function() {
        // const devCloud = new BigipConfig(devCloud01);
        // const y = devCloud.bigipConf;

        // const explode = devCloud.explode();
        // const parseTime = device.parse();
        // const apps = device.appList();

        const app = device.apps('/Common/app4_t80_vs');
        // const app = devCloud.apps();
        const expected = [
            "ltm virtual /Common/app4_t80_vs {\n    description \"test pool references in irule extration and ltp\"\n    destination /Common/192.168.2.25:80\n    ip-protocol tcp\n    last-modified-time 2020-10-07:07:28:35\n    mask 255.255.255.255\n    policies {\n        /Common/app4_ltPolicy { }\n    }\n    pool /Common/app4_pool\n    profiles {\n        /Common/http { }\n        /Common/tcp { }\n    }\n    rules {\n        /Common/_sys_https_redirect\n        /Common/app4_pool_rule\n    }\n    serverssl-use-sni disabled\n    source 0.0.0.0/0\n    translate-address enabled\n    translate-port enabled\n}\nltm pool /Common/app4_pool {\n    members {\n        /Common/api.chucknorris.io:443 {\n            fqdn {\n                autopopulate enabled\n                name api.chucknorris.io\n            }\n        }\n    }\n}ltm node /Common/api.chucknorris.io {\n    fqdn {\n        address-family all\n        autopopulate enabled\n        name api.chucknorris.io\n    }\n}ltm rule /Common/app4_pool_rule {\n### test rule for corkscrew\n\n  # \n\nwhen HTTP_REQUEST {\n\n  # pool reference by variable declaration\n  set html-pool web1Pool\n\n  if { [HTTP::path] ends_with \"*.css\" }{\n\n    # regular pool refernce\n    pool css_pool\n\n  } elseif { [HTTP::path] ends_with \"*.jpg\" }{\n\n    # pool member refernce\n    pool jpg.pool member 10.10.10.1 80\n\n  } elseif { [HTTP::path] ends_with \"*.js\" }{\n\n    # another pool reference with special characters\n    pool js.io_t80_pool \n\n  } elseif { [HTTP::path] ends_with \"*.xx\" }{\n\n    # pool reference not in tmos config\n    ### *** seems the gui won't let you attach an irule to a vs with a pool that doesn't exist\n    #pool missing_pool\n\n  } elseif { [HTTP::path] ends_with \"*.txt\" }{\n\n    # node reference\n    node 10.10.10.1 80\n\n  } else {\n\n    # pool referenced by variable\n    pool $html-pool\n\n  }\n}ltm policy /Common/app4_ltPolicy {\n    controls { forwarding }\n    description \"testing for pool extraction function\"\n    requires { http }\n    rules {\n        css_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/css_pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .css }\n                }\n            }\n        }\n        jpg_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/jpg.pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    query-string\n                    ends-with\n                    values { .jpg }\n                }\n            }\n            ordinal 1\n        }\n        js_pool_rule {\n            actions {\n                0 {\n                    forward\n                    select\n                    pool /Common/js.io_t80_pool\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .js }\n                }\n            }\n            ordinal 2\n        }\n        txt_node {\n            actions {\n                0 {\n                    forward\n                    select\n                    node 10.10.10.1\n                }\n            }\n            conditions {\n                0 {\n                    http-uri\n                    scheme\n                    ends-with\n                    values { .txt }\n                }\n            }\n            ordinal 3\n        }\n    }\n    strategy /Common/first-match\n}",
        ];
        
        assert.deepStrictEqual(app, expected, 'Should get list of virtual servers / apps');
    });

    it(`create config object and return raw config`, async function() {
        // const devCloud = new BigipConfig(devCloud01);
        // const y = devCloud.bigipConf;

        const explode = device.explode();

        let output = '';
        output += '################################################\n';
        output += `###  *** project - corkscrew *** ###\n`;
        output += `###  tmos extractor output\n`;
        output += `###  Section 1: stats\n`;
        output += `###  Section 2: apps\n`;
        output += `###  Section 3: conversion logs (error/info/debug)\n`;
        output += `###  Section 4: configMultiLevelObjects (not object values yet)\n`;
        // output += `###  Section 5: configSingleLevelObjects (another way to search config)\n`;
        output += `###  ${new Date().toISOString()}\n`;
        output += '################################################\n';

        output += `\n################################################\n`;
        output += `### explosion stats ##########\n`;
        output += `### uuid: ${explode.id}\n`;
        output += `### dateTime: ${explode.dateTime}\n`;
        // output += `### dateTime: ${explode.}\n`;
        output += JSON.stringify(explode.stats, undefined, 2);
        output += `\n################################################\n`;
        
        explode.config.apps.forEach( el => {
            output += '\n################################################\n';
            output += el.config;
            output += '\n################################################\n';
        })
        
        output += '\n\n';
        output += '#######################################\n';
        output += '### conversion log ####################\n';
        output += explode.logs;
        
        output += '\n\n';
        output += '#######################################\n';
        output += '### configMultiLevelObjects ###########\n';
        output += JSON.stringify(device.configMultiLevelObjects, undefined, 2);
        
        fs.writeFileSync(path.join(__dirname, "./devCloud01_conversionOutput.txt"), output);

        assert.deepStrictEqual(device.bigipConf, devCloud01);
    });
});

