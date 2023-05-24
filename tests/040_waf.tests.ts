
'use strict';

import assert from 'assert';
import path from 'path';

import BigipConfig from '../src/ltm';
import { archiveMake } from './archive_generator/archiveBuilder';
import { Explosion} from '../src/models';


let device: BigipConfig;
let expld: Explosion;
const parsedFileEvents: any[] = [];
const parsedObjEvents: any[] = [];
let testFile = '';
let asmObj: any;
describe('WAF/ASM parsing/abstraction', async function () {

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

    it(`start diggn waf details!`, async function () {

        if (device.configObject.asm) {
            asmObj = device.configObject.asm
        }

        // do we have any asm objects?
        assert.ok(typeof asmObj === 'object')

    });

    it(`Inspect asm policy object for params`, async function () {

        const basicPolicy1 = asmObj.policy['/Common/basic_policy_1']
        assert.ok(typeof basicPolicy1.line === 'string');
        assert.ok(typeof basicPolicy1.description === 'string');
        assert.ok(typeof basicPolicy1.status === 'string');
        assert.ok(typeof basicPolicy1['blocking-mode'] === 'string');
        assert.ok(typeof basicPolicy1['policy-builder'] === 'string');
        assert.ok(typeof basicPolicy1['policy-template'] === 'string');
        assert.ok(typeof basicPolicy1['parent-policy'] === 'string');
        assert.ok(typeof basicPolicy1['policy-type'] === 'string');

    });


    it(`dig some asm config stats`, async function () {

        // get list of local traffic policies referencing an asm policy

        const ltps = device.configObject.ltm?.policy!;

        const asmPolicies = Object.keys(asmObj.policy);

        const asmLtProfiles: { [k: string]: string }[] = []
        const asmLtKeys: string[] = [];

        for await (const [k, v] of Object.entries(ltps)) {

            const body = v.replace(/\n +/g, ' ')

            const iAsm = body.match(device.rx!.ltm.ltPolicies.asmRef)
            if (iAsm) {
                asmLtKeys.push(k)
                asmLtProfiles.push({ [k]: iAsm[0] })
            }
        }

        const asmVirtuals: { [k: string]: string[] } = {}
        for (const [k, v] of Object.entries(device.configObject.ltm?.virtual!)) {

            // so this gets the profiles object,
            //      which all local traffic policies auto generated for asm
            //      begin with 'asm_auto_l7_policy__'
            //      example:  /Common/asm_auto_l7_policy__bigiq.benlab.io_t443_vs { }
            
            // but recently found out that TMOS now also adds the asm profile directly,
            //      but appends "ASM_" to it
            //      example:  /Common/ASM_basic_policy_1 { }
            //      where 'basic_policy_1' is the name of the asm object
            //          example:  "/Common/basic_policy_1"
            
            // so, now we will dig the profiles object for what we need instead...
            
            // const 
            // const profilesObj = v.match(device.rx!.ltm.profiles.names);
            
            // if (profilesObj) {
            //     const asmProf = profilesObj[1].match(device.rx!.ltm.profiles.asmProf)
            //     if(asmProf) {
            //         if(asmVirtuals[asmProf[1]]) {
            //             asmVirtuals[asmProf[1]].push(k);
            //         } else {
            //             asmVirtuals[asmProf[1]] = [k]
            //         }
            //     }
            // }
        }


        const b = 'asdf';
    });


});

