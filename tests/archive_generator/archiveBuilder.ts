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
import tar from 'tar';

import { globSync } from 'glob';
import { execSync } from 'child_process';

/**
 * generate f5 archive for testing this project
 * the file returned is .tar.gz but it should look like a .ucs file
 * --- this structure should be sufficient for .qkview file structures also, but we can have this function modify to be qkview as needed
 * 
 * Add and necessary files/apps/configs to the archive directory to be included in the testing
 * 
 * Will probably just call this function at the beginning of each test for now
 * @returns 
 */
export async function archiveMake(): Promise<string> {

    // for testing we are just going to use tar.gz like a mini_ucs, but this process should also work for UCS and QKVIEWs
    // https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
    // https://github.com/isaacs/node-glob
    // https://github.com/isaacs/node-tar
    // https://gist.github.com/isaacs/0a05e95b930cc3962fa727e3c02d7161

    // look at using node-tar axtract to simplify the main parseAsync function currently filtering and streaming out the files we want from the archive

    const filesInArchive: any[] = [];
    const archiveName = 'f5_corkscrew_test.tar.gz'
    const archiveDir = path.join(__dirname, 'archive1');
    const testArchiveOut = path.join(__dirname, '..', 'artifacts', archiveName);

    // glob all the files from the archive dir
    const files = globSync('**/*', { cwd: archiveDir })

    const cwd = process.cwd();  // just to confirm our current working director
    const d1 = fs.readdirSync(archiveDir);

    //this method has the potential to be quicker and easier method for managing tar files...
    await tar.create({
        cwd: archiveDir,
        file: testArchiveOut,
        gzip: true
    },
        files
    )

    // this is how it was working with native tar command
    // const cmd = [
    //     'tar',
    //     '-czf',
    //     testArchiveOut,
    //     '-C',
    //     archiveDir,
    //     '../README.md',
    //     'config/',
    //     'monitors/',
    //     'ssl/'
    // ].join(' ')
    // execSync(cmd)

    // how to list the archive contents from the command line, to match with example above
    const l1 = execSync(`tar -ztvf ${testArchiveOut}`).toString();

    // this is here to be able to look at the array and confirm the necessary files are in there.
    await tar.t({
        file: testArchiveOut,
        onentry: entry => {
            filesInArchive.push(entry.path)
        }
    })

    return testArchiveOut;
}