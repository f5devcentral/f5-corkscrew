
'use strict';

import assert from 'assert';
import path from 'path';

import { archiveMake } from './archive_generator/archiveBuilder';

import { execSync } from 'child_process';



let testFile = '';
let outFile = '';

describe('cli (yargs) tests', async function () {

    before(async () => {
        testFile = await archiveMake('qkview') as string;
        const testFileDetails = path.parse(testFile);
        outFile = path.join(testFileDetails.dir, `${testFileDetails.base}.log`);
        console.log('test file: ', __filename);
        console.log('outFile', outFile);

    })


    it(`run cli with defaults`, async function () {

        // node dist/cli.js --file ./tests/artifacts/f5_corkscrew_test.qkview

        const resp = execSync(`node dist/cli.js --file ${testFile}`)

        const output = JSON.parse(resp.toString())

        // todo: save the output to a file like the other tests

        assert.ok(resp)
        assert.ok(typeof output.output === 'object')

        assert.ok(typeof output.output.dateTime === 'string')
        assert.ok(typeof output.output.hostname === 'string')
        assert.ok(typeof output.output.id === 'string')
        assert.ok(typeof output.output.inputFileType === 'string')
        
        assert.ok(typeof output.output.stats === 'object')
        assert.ok(typeof output.output.config === 'object')
        
        assert.ok(Array.isArray(output.output.config.apps))
        assert.ok(typeof output.output.config.apps[0] === 'object')

        assert.ok(Array.isArray(output.output.config.doClasses))
        assert.ok(typeof output.output.config.doClasses[0] === 'string')

        assert.ok(Array.isArray(output.output.config.gslb))
        assert.ok(typeof output.output.config.gslb[0] === 'object')

    });

    it(`run cli with all details returned`, async function () {

        const cmd = [
            'node', 'dist/cli.js',
            '--file', testFile,
            '--no_sources', 'false',
            '--no_file_store', 'false',
            '--no_command_logs', 'false',
            '--no_process_logs', 'false',
        ].join(' ');

        const resp = execSync(cmd)

        const output = JSON.parse(resp.toString())

        // todo: save the output to a file like the other tests
        
        assert.ok(resp)
        
        assert.ok(typeof output.output === 'object')
        
        assert.ok(Array.isArray(output.command_logs))
        assert.ok(typeof output.command_logs[0] === 'string')
        
        assert.ok(Array.isArray(output.output.logs))
        assert.ok(typeof output.output.logs[0] === 'string')
        
        assert.ok(Array.isArray(output.output.config.sources))
        assert.ok(typeof output.output.config.sources[0] === 'object')

    });

});

