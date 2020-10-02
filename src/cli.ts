#!/usr/bin/env node

'use strict';

// import { fstat } from 'fs';
// import { argv } from 'process';
import yargs from 'yargs';
import * as fs from 'fs';

// yargs
// .command('explode', 'explode bigip.conf to apps', {
//     title: {
//         describe: 'source file',
//         description: 'bigip.conf',
//         demand: true,
//         alias: 's'
//     }
// })

function explode(filePath: string) {
    console.log('incoming param (file):', filePath);
    try {
        const x = fs.readFileSync(filePath, 'utf-8');
        const y = x;
        console.log(y);
    } catch (e) {
        console.log(e);
    }
    // fs.readFileSync(filePath, 'utf8', function (err, data) {
    //     if (err) {
    //       return console.log(err);
    //     }
    //     console.log(data);
    //   });
}

yargs
.command('explode <file>', 'explode bigip.conf to apps', (yargs) => {
    yargs
    .positional('file', {
        describe: 'bigip.conf to explode'
    });
}, argv => explode(argv.file))
// .command()
.demandCommand(1, 'A command is required')
.wrap(120)
.strict()
.argv;

// console.log(' yyeeeeeee!!!!');