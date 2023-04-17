
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
let asmObj: any;
describe('WAF/ASM parsing/abstraction', async function() {
    
    before(async () => {
        
        testFile = await archiveMake('qkview') as string;
        const testFileDetails = path.parse(testFile);
        
        device = new BigipConfig();
    
        device.on('parseFile', (x: any) => parsedFileEvents.push(x) )
        device.on('parseObject', (x: any) => parsedObjEvents.push(x) )
    
        await device.loadParseAsync(testFile);
        expld = await device.explode();

    })

    it(`start diggn waf details!`, async function() {
        
        if(device.configObject.asm) {
            asmObj = device.configObject.asm
        }

        assert.ok(1)

    });

    // it(`expected number of do classes abstracted`, async function() {
        
    //     assert.ok(gslb.length === 5);

    // });


});

