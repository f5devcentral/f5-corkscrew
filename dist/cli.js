#!/usr/bin/env node
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { argv } from 'process';
const yargs_1 = __importDefault(require("yargs"));
// yargs
// .command('explode', 'explode bigip.conf to apps', {
//     title: {
//         describe: 'source file',
//         description: 'bigip.conf',
//         demand: true,
//         alias: 's'
//     }
// })
function explode(text) {
    console.log(text);
}
yargs_1.default
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
//# sourceMappingURL=cli.js.map