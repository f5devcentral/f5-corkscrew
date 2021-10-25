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

import { unPacker } from '../src/unPacker'
import { UnPacker } from '../src/unPackerStream'

describe('instantiation unPacker', async function () {


    // it(`stream unPack ucs - PASSPHRASE`, async () => {

    //     // test to start developing decrypting archive with passphrase

    //     const confFiles = []    // all the main .conf files
    //     const statFiles = []    // statistics .xml files
    //     const unPacker = new UnPacker();

    //     unPacker.on('conf', conf => confFiles.push(conf))
    //     unPacker.on('stat', stat => statFiles.push(stat))

    //     await unPacker.stream(path.join(__dirname, 'artifacts', 'test_passphrase_1.ucs'))
    //         .then(respFiles => {

    //             // These response files should be all the other files except the conf/stat files, mainly filestore files
    //             assert.ok(
    //                 confFiles.length > 3,
    //                 'should have at least 3 files (bigip.conf/bigip.license/bigip_base.conf)'
    //             )
    //             assert.ok(typeof confFiles[0].fileName === 'string')
    //             assert.ok(typeof confFiles[0].size === 'number')
    //             assert.ok(typeof confFiles[0].content === 'string')
    
    //             // respFiles should also have the same structure
    //             assert.ok(typeof respFiles.files[0].fileName === 'string')
    //             assert.ok(typeof respFiles.files[0].size === 'number')
    //             assert.ok(typeof respFiles.files[0].content === 'string')
    //         })
    //         .catch( err => {
    //             debugger;
    //         })
    // });

    it(`stream unPack ucs`, async () => {

        const confFiles = []    // all the main .conf files
        const statFiles = []    // statistics .xml files
        const unPacker = new UnPacker();

        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(path.join(__dirname, 'artifacts', 'devCloud_10.9.2020.ucs'))
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

        const confFiles = []
        const statFiles = []
        let respFilesG: { files: ConfigFile[]; size: number; };
        const unPacker = new UnPacker();

        unPacker.on('conf', conf => confFiles.push(conf))
        unPacker.on('stat', stat => statFiles.push(stat))

        await unPacker.stream(path.join(__dirname, 'artifacts', 'devCloud_10.10.2020.qkview'))
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

        await unPacker(path.join(__dirname, 'artifacts', 'unPacker_test.conf'))
            .then(file => {
                const expected = fs.readFileSync(path.join(__dirname, 'artifacts', 'unPacker_test.conf'), "utf-8");
                assert.ok(typeof file[0].fileName === 'string')
                assert.ok(typeof file[0].size === 'number')
                assert.ok(typeof file[0].content === 'string')
                assert.deepStrictEqual(file[0].content, expected);
            })
            .catch( err => {
                debugger;
            })
    });



    it(`not a valid path to file`, async function () {

        await unPacker(path.join(__dirname, "broken-file_path.io"))
            .then(file => {
                debugger;
                assert.ifError(file);  // should not have a response here
            })
            .catch(err => {
                assert.ok(err);     // should be an error here
            })

    });

    it(`unpack mini_ucs.tar.gz - success`, async function () {

        await unPacker(path.join(__dirname, 'artifacts', 'mini_ucs.tar.gz'))
            .then(file => {

                // just grabing some details to confirm
                // const converted = [file[0].fileName, file[2].size, file[4].fileName];
                // const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf'];
                // assert.deepStrictEqual(converted, expected)
                assert.ok(typeof file[0].fileName === 'string')
                assert.ok(typeof file[0].size === 'number')
                assert.ok(typeof file[0].content === 'string')
            })
            .catch(err => {
                debugger;  // catch a debug if we got an error
            })

    });

    it(`unPack ucs - success`, async function () {

        // const startTime = process.hrtime.bigint();

        await unPacker(path.join(__dirname, 'artifacts', 'devCloud_10.9.2020.ucs'))
            .then(file => {

                // capture some key information pieces so we don't have to verify the whole thing
                // const converted = [file[0].fileName, file[2].size, file[4].fileName];
                // const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf'];
                // assert.deepStrictEqual(converted, expected);
                assert.ok(typeof file[0].fileName === 'string')
                assert.ok(typeof file[0].size === 'number')
                assert.ok(typeof file[0].content === 'string')

            })

        // console.log('processing time: ', Number(process.hrtime.bigint() - startTime) / 1000000)
    });

    it(`unPack ucs - fail`, async function () {

        await unPacker(path.join(__dirname, 'artifacts', 'bad.ucs'))
            .then(file => {
                debugger;
                assert.ifError(file);
            })
            .catch(err => {
                assert.ok(err);
            })
    });

    it(`unPack qkview - success`, async function () {

        await unPacker(path.join(__dirname, 'artifacts', 'devCloud_10.10.2020.qkview'))
            .then(file => {

                // const converted = [file[0].fileName, file[2].size, file[4].fileName];
                // const expected = ['config/bigip.conf', 341, 'config/partitions/foo/bigip.conf'];
                // assert.deepStrictEqual(converted, expected);
                assert.ok(typeof file[0].fileName === 'string')
                assert.ok(typeof file[0].size === 'number')
                assert.ok(typeof file[0].content === 'string')

            })
            .catch(err => {
                debugger;  // catch a debug if we got an error
            })
    });

    it(`unPack qkview - fail`, async function () {

        // read ucs should fail, log error to logger, return undefined
        await unPacker(path.join(__dirname, 'artifacts', 'bad.qkview'))
            .then(file => {
                debugger;
                assert.ifError(file);
            })
            .catch(err => {
                assert.ok(err);
            })
    });





});
