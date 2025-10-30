/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import fs from 'fs';
import path from 'path';
import * as tar from 'tar';

import { globSync } from 'glob';
import { execSync } from 'child_process';


// todo:     loop through all the files and update the tmos version at the top
//      this is mainly necessary if someone copy and pastes and entire config file with new features
//      --  maybe this is a good test case?


/**
 * generate f5 archive for testing this project
 * the file returned is .tar.gz but it should look like a .ucs file
 * --- this structure should be sufficient for .qkview file structures also, but we can have this function modify to be qkview as needed
 * 
 * Add and necessary files/apps/configs to the archive directory to be included in the testing
 * 
 * Will probably just call this function at the beginning of each test for now
 * 
 * mini = .tar.gz
 * 
 * @type (optional) ucs|qkview|conf|mini -> returns path to the requested conf/archive type (mini->default)
 * @returns 
 */
export async function archiveMake(type: 'ucs' | 'qkview' | 'conf' | 'mini' = 'mini'): Promise<fs.PathLike | string> {

    // for testing we are just going to use tar.gz like a mini_ucs, but this process should also work for UCS and QKVIEWs
    // https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
    // https://github.com/isaacs/node-glob
    // https://github.com/isaacs/node-tar
    // https://gist.github.com/isaacs/0a05e95b930cc3962fa727e3c02d7161

    // look at using node-tar axtract to simplify the main parseAsync function currently filtering and streaming out the files we want from the archive

    const filesInArchive: any[] = [];
    const baseArchiveName = 'f5_corkscrew_test';
    let fileExt = 'tar.gz'; // default file extension/type
    const cwd = process.cwd();  // just to confirm our current working director
    let gzip = true;
    // let filter = (path, stat) => true;  // allow everything -> no filter

    const baseArchiveDir = path.join(__dirname, 'archive1');
    const qkviewDir = path.join(__dirname, 'qkview')


    // start building the list of filePaths to include in the archive
    // config dir should always be in the archive
    let filesPaths: string[] = globSync('config/*', { cwd: baseArchiveDir })

    if (type === 'conf') {

        // single conf file, copy the conf file to artifacts and return the path
        const srcConf = path.join(baseArchiveDir, 'config', 'bigip.conf')
        const destFolder = path.join(__dirname, '..', 'artifacts', `${baseArchiveName}.conf`);
        fs.copyFileSync(srcConf, destFolder)
        return destFolder;

    }


    /**
     * files unique to qkviews
     */
    const qkviewFiles = [
        'config/low_profile_base.conf',
        'config/profile_base.conf',
        'config/mcp_module.xml'
    ]

    if (type === 'ucs') {

        fileExt = 'ucs'
        // filter out qkview specific files
        // normalize paths to use forward slashes for cross-platform compatibility
        filesPaths = filesPaths.filter(x => !qkviewFiles.includes(x.replace(/\\/g, '/')))

    } else if (type === 'qkview') {

        fileExt = 'qkview'
        filesPaths.push(...globSync('*.xml', { cwd: baseArchiveDir }));

    }

    // build the file output path/name
    const archiveName = `${baseArchiveName}.${fileExt}`
    const testArchiveOut: fs.PathLike = path.join(__dirname, '..', 'artifacts', archiveName);


    const d1 = fs.readdirSync(baseArchiveDir);

    //this method has the potential to be quicker and easier method for managing tar files...
    await tar.create({
        cwd: baseArchiveDir,
        file: testArchiveOut,
        gzip
    },
        filesPaths
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