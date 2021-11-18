/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import * as fs from 'fs';
import path from 'path';

const tmpDir = path.join(__dirname, 'tmp')
const archiveDir = path.join(__dirname, 'tests', 'archive_generator', 'archive')

export async function archiveMake(): Promise<string> {

    // for testing we are just going to use tar.gz like a mini_ucs, but this process should also work for UCS and QKVIEWs

    // make sure we have a temp folder to put the test archive
    if (!fs.existsSync(tmpDir)) {
        // console.log('creating temp directory for file upload/download tests')
        fs.mkdirSync(tmpDir);
    }

    // create archive
    //  tar -zcvf ../../test3.ucs config/


    return "/some/path/to/archive.tar.gz"
}

export function archiveGet(): string {
    // 
    return "/some/path/to/archive.tar.gz"
}
