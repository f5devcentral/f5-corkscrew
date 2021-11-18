/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

/**
 * test package use to test outside ucs/qkviews
 *  - need to change this to read all filenames from folder, then loop through all the qkview/ucs files and process them
 */

const privateFolder = path.join(__dirname, '..', '..', 'private');
let device: BigipConfig;
const log = [];
const events = []
let mainErr;
let expld;
// let load;
// let parseTime;

// get file names of only ucs/qkviews
let testFiles: string[] = fs.readdirSync(privateFolder)
    .filter(el => /\.(ucs|qkview)/.test(path.parse(el).ext))
// testFiles = testFiles.filter(el => /1-/.test(el))

describe('corkscrew explode tests on multiple archives', async function () {

    beforeEach(() => {
        device = new BigipConfig();
        events.length = 0
        log.length = 0
    })

    testFiles.forEach((file) => {

        it(`processing ${file}`, async function () {

            device.on('parseFile', x => events.push(x))
            device.on('parseObject', x => events.push(x))
            device.on('extractApp', x => events.push(x))

            expld = await device.load(path.join(privateFolder, file))
                .then(async loadTime => {
                    return await device.parse()
                        .then(async parseTime => {
                            return await device.explode();
                        })
                })
                .catch(async err => {
                    mainErr = err;
                    log.push(...await device.logs());
                    debugger;
                })


            try {
                fs.writeFileSync(
                    path.join(privateFolder, `${file}.json`),
                    JSON.stringify([expld, device.configObject], undefined, 4)
                );
            } catch (e) {
                debugger;
            }

        });
    });
});