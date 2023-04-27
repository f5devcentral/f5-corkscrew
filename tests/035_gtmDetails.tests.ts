
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
const doc: any[] = [];

describe('ACC DO Classes parsing/abstraction', async function() {
    
    before(async () => {
        
        testFile = await archiveMake('qkview') as string;
        const testFileDetails = path.parse(testFile);
        
        device = new BigipConfig();
    
        device.on('parseFile', (x: any) => parsedFileEvents.push(x) )
        device.on('parseObject', (x: any) => parsedObjEvents.push(x) )
    
        await device.loadParseAsync(testFile);
        expld = await device.explode();

    })

    it(`found do classes object in explosion!`, async function() {
        
        if(expld.config.doClasses) {
            doc.push(...expld.config.doClasses);
        }

        console.log(device.configObject.gtm)

        assert.ok(doc.length === 31)

    });

    it(`should have no object literal in output "[object, object]"`, async function() {
        
        // this means we didn't parse the object correctly (started when deep parsing began)
        
        const text = '[object, object]';
        const resp = doc.findIndex(x => x.test(text))
        assert.ok(!resp);

    });



    // it(`basic gtm - high level fqdn details`, async function() {

    //     assert.ok(typeof gslb![0] == 'object');
    //     assert.ok(typeof gslb![0].fqdn == 'string');
    //     assert.ok(typeof gslb![0].type == 'string');
    //     assert.ok(typeof gslb![1].aliases![0] == 'string');

    // });
});

