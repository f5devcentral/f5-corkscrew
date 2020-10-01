#!/usr/bin/env node

'use strict';

// import { argv } from 'process';
import yargs from 'yargs';

// yargs
// .command('explode', 'explode bigip.conf to apps', {
//     title: {
//         describe: 'source file',
//         description: 'bigip.conf',
//         demand: true,
//         alias: 's'
//     }
// })

function explode(text: unknown) {
    console.log(text);
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