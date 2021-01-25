/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
'use strict';

import assert from 'assert';
import * as path from 'path';
// import fetch from 'fetch'

import { Parser } from '../tmosParse2';
import { unPacker } from '../unPacker';

let unPacked;
describe('New parse function tests', async () => {
    
    /**
     * These tests were just to provide a platform for adding events to the parser function
     * 
     * The function was isolated in the cooresponding file, refactored to work, then refactored for events.
     * 
     * This just demonstrates that workflow
     * 
     * In short, events need to be emitted at the top level class so they can be listened to by whatever is calling the funtion.
     * 
     * This updated function will get factored back into the main ltm class so events can be emitted for other actions, like unpack and app extraction
     */
    console.log('NOT PART OF CORE FUNCTIONALITY, HERE FOR DEV')
    
    it(`unpack config from mini ucs`, async () => {
        
        unPacked = await unPacker(path.join(__dirname, 'artifacts', 'mini_ucs.tar.gz'));
        const converted = [ unPacked[0].fileName, unPacked[2].size, unPacked[4].fileName ];
        const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf' ];
        assert.deepStrictEqual(converted, expected)
    });

    it(`parse config files/objects to json tree`, async () => {
        
        
        const newPar = new Parser()

        const parsedEvents = []
        newPar.on('parseStart', x => parsedEvents.push(x) )
        newPar.on('parseFile', x => parsedEvents.push(x) )
        newPar.on('parseEnd', x => parsedEvents.push(x) )
        
        const result = newPar.loadParse(unPacked);
        assert.deepStrictEqual('x', 'x');
    });
    
    // it(`tmos config file to json tree - monster config`, function() {
        
    //     assert.deepStrictEqual('x', 'x');
    // });
});










// /**
//  * the following were tests for the first parsing function outside the main ltm class
//  * Took about 8 hours to explore this approach which resulted in worse performance than
//  *  the original method - kept running out of memory and erroring out - had to narrow scope
//  *  to just ltm configuration objects.  - really just keeping this around for history... for now
//  */
// import { parseTmosConfig } from '../tmosParser';
// const devCloud01 = fs.readFileSync(path.join(__dirname, "./artifacts/devCloud01_10.7.2020.conf"), "utf-8");
// const monster = fs.readFileSync(path.join(__dirname, "../../private/monster_bigip.conf"), "utf-8");
// describe('parseTmosConfig - tmos config parser tests', function() {
//     it(`tmos config file to json tree`, function() {
//         const resp = parseTmosConfig(devCloud01);

//         const expected = {
//             totalObjectCount: 154,
//             ltmObjectCount: 0,
//             lineCount: 1125,
//         }

//         assert.deepStrictEqual(resp.totalObjectCount, expected.totalObjectCount);
//         assert.deepStrictEqual(resp.lineCount, expected.lineCount);
//     });

//     it(`tmos config file to json tree - monster config`, function() {
//         const resp = parseTmosConfig(monster);
//         const expected = {
//             totalObjectCount: 0,
//             ltmObjectCount: 12804,
//             lineCount: 222681,
//         }
//         assert.deepStrictEqual(resp.ltmObjectCount, expected.ltmObjectCount);
//         assert.deepStrictEqual(resp.lineCount, expected.lineCount);
//     });
// });