#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */

'use strict';

import bigipConfig from './ltm'
import yargs, { Argv } from 'yargs';
import * as fs from 'fs';
import path from 'path';

// yargs
// .command('explode', 'explode bigip.conf to apps', {
//     title: {
//         describe: 'source file',
//         description: 'bigip.conf',
//         demand: true,
//         alias: 's'
//     }
// })

function explode(filePath: string | any) {
    // console.log('incoming param (file):', filePath);

    // part input to usable pieces
    filePath = path.parse(filePath);
    // console.log(filePath);

    /**
     * logic check for future inputs
     */
    if (filePath.ext === '.conf') {

        // console.log('got .conf file - proceeding')

    } else if (filePath.ext === '.ucs') {
        
        return console.log('got a ucs archive - not supported yet')

    } else if (filePath.ext === '.qkview') {
        
        return console.log('got a qkview - not supported yet')

    } else {
        
        return console.error(`file type of ${filePath.ext}, not supported (only .conf at this time)`)

    }
    

    try {
        // try to read file contents
        const x = fs.readFileSync(path.join(filePath.dir, filePath.base), 'utf-8');
        // try to parse file as bigip.conf
        const bConfig = new bigipConfig(x);
        // return extracted apps
        const v = JSON.stringify(bConfig.explode());
        return console.log(v);
    } catch (e) {
        return console.log(e.message);
    }
}

yargs
.command('explode <file>', 'explode bigip.conf to apps', (yargs) => {
    yargs
    .positional('file', {
        describe: 'bigip.conf to explode'
    });
}, (argv: any) => {
    // console.log(argv.file);
    explode(argv.file)
})
// .command()
.demandCommand(1, 'A command is required')
.wrap(120)
.strict()
.argv;

// console.log(' yyeeeeeee!!!!');