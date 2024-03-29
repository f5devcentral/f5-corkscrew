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
import { ConfigFile } from '../src/models';

import { archiveMake } from './archive_generator/archiveBuilder'
import { UnPacker } from '../src/unPackerStream'

const confFiles: any[] = []    // all the main .conf files
const statFiles: any[] = []    // statistics .xml files
let testFile: string;

describe('instantiation unPacker', async function () {

    before(async () => {
        testFile = await archiveMake() as string;
        // const testFileDetails = path.parse(testFile);
        // outFile = path.join(testFileDetails.dir, `${testFileDetails.base}.log`)
        // console.log('outFile', outFile);
        console.log('test file: ', __filename);
    })


    beforeEach(() => {
        confFiles.length = 0;
        statFiles.length = 0;
    })

    it(`stream unPack ucs`, async () => {


        const unPacker = new UnPacker();

        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(testFile)
            .then(respFiles => {

                // These response files should be all the other files except the conf/stat files, mainly filestore files
                assert.ok(
                    confFiles.length > 3,
                    'should have at least 3 files (bigip.conf/bigip.license/bigip_base.conf)'
                )
                assert.ok(typeof confFiles[0].fileName === 'string')
                assert.ok(typeof confFiles[0].size === 'number')
                assert.ok(typeof confFiles[0].content === 'string')
    
                // respFiles should also have the same structure
                assert.ok(typeof respFiles.files[0].fileName === 'string')
                assert.ok(typeof respFiles.files[0].size === 'number')
                assert.ok(typeof respFiles.files[0].content === 'string')
            })
            .catch( err => {
                debugger;
            })
    });


    it(`stream unPack qkview`, async () => {

        let respFilesG: { files: ConfigFile[]; size: number; };
        const unPacker = new UnPacker();

        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(testFile)
            .then(respFiles => {
                respFilesG = respFiles // reassign respFiles to a higher variable so we can see them if/when we hit the catch
                assert.ok(
                    confFiles.length > 3,
                    'should have at least 3 files (bigip.conf/bigip.license/bigip_base.conf)'
                )
                assert.ok(typeof confFiles[0].fileName === 'string')
                assert.ok(typeof confFiles[0].content === 'string')
                assert.ok(typeof confFiles[0].size === 'number')

                // respFiles should also have the same structure
                assert.ok(typeof respFiles.files[0].fileName === 'string')
                assert.ok(typeof respFiles.files[0].content === 'string')
                assert.ok(typeof respFiles.files[0].size === 'number')
            })
            .catch( err => {
                debugger;
            })

    });


    it(`path to actual .conf file`, async function () {
        
        const unPackerLocal = new UnPacker();
        unPackerLocal.on('conf', conf => confFiles.push(conf))
        unPackerLocal.on('stat', stat => statFiles.push(stat))

        await unPackerLocal.stream(path.join(__dirname, 'artifacts', 'unPacker_test.conf'))
            .then(file => {
                const expected = fs.readFileSync(path.join(__dirname, 'artifacts', 'unPacker_test.conf'), "utf-8");
                assert.ok(typeof confFiles[0].fileName === 'string')
                assert.ok(typeof confFiles[0].size === 'number')
                assert.ok(typeof confFiles[0].content === 'string')
                assert.deepStrictEqual(confFiles[0].content, expected);
            })
            .catch( err => {
                debugger;
            })
    });



    it(`not a valid path to file`, async function () {

        const unPacker = new UnPacker();
        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(path.join(__dirname, "broken-file_path.io"))
            .then(file => {
                debugger;
                assert.ifError(file);  // should not have a response here
            })
            .catch(err => {
                assert.ok(err);     // should be an error here
            })

    });

    it(`unpack mini_ucs.tar.gz - success`, async function () {

        const unPacker = new UnPacker();
        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(testFile)
            .then(file => {

                // just grabing some details to confirm
                // const converted = [file[0].fileName, file[2].size, file[4].fileName];
                // const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf'];
                // assert.deepStrictEqual(converted, expected)
                assert.ok(typeof confFiles[0].fileName === 'string')
                assert.ok(typeof confFiles[0].size === 'number')
                assert.ok(typeof confFiles[0].content === 'string')
                assert.ok(confFiles.length > 1);
            })
            .catch(err => {
                debugger;  // catch a debug if we got an error
            })

    });

    it(`unPack ucs - success`, async function () {

        const unPacker = new UnPacker();
        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(testFile)
            .then(file => {

                // capture some key information pieces so we don't have to verify the whole thing
                // const converted = [file[0].fileName, file[2].size, file[4].fileName];
                // const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf'];
                // assert.deepStrictEqual(converted, expected);
                assert.ok(typeof confFiles[0].fileName === 'string')
                assert.ok(typeof confFiles[0].size === 'number')
                assert.ok(typeof confFiles[0].content === 'string')

            })

    });

    it(`unPack ucs - fail`, async function () {

        const unPacker = new UnPacker();
        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(path.join(__dirname, 'artifacts', 'bad.ucs'))
            .then(file => {
                debugger;
                assert.ifError(file);
            })
            .catch(err => {
                assert.ok(err);
            })
    });

    it(`unPack qkview - success`, async function () {

        const unPacker = new UnPacker();
        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(testFile)
            .then(file => {

                // const converted = [file[0].fileName, file[2].size, file[4].fileName];
                // const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf'];
                // assert.deepStrictEqual(converted, expected);
                assert.ok(typeof confFiles[0].fileName === 'string')
                assert.ok(typeof confFiles[0].size === 'number')
                assert.ok(typeof confFiles[0].content === 'string')

            })
            .catch(err => {
                debugger;  // catch a debug if we got an error
            })
    });

    it(`unPack qkview - fail`, async function () {

        // read ucs should fail, log error to logger, return undefined
        const unPacker = new UnPacker();
        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(path.join(__dirname, 'artifacts', 'bad.qkview'))
            .then(file => {
                debugger;
                assert.ifError(file);
            })
            .catch(err => {
                assert.ok(err);
            })
    });


    it(`unPack badArchive1.tar.gz -> fail`, async function () {

        // this archive has two conf files with different tmos versions
        //      not supported

        const unPacker = new UnPacker();
        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(path.join(__dirname, 'artifacts', 'badArchive1.tar.gz'))
            .then(file => {
                assert.ok(!file);
            })
            .catch(err => {
                assert.ok(err);
            })
    });





});
