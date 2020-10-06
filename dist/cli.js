#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ltm_1 = __importDefault(require("./ltm"));
const yargs_1 = __importDefault(require("yargs"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
// yargs
// .command('explode', 'explode bigip.conf to apps', {
//     title: {
//         describe: 'source file',
//         description: 'bigip.conf',
//         demand: true,
//         alias: 's'
//     }
// })
function explode(filePath) {
    // console.log('incoming param (file):', filePath);
    // part input to usable pieces
    filePath = path_1.default.parse(filePath);
    // console.log(filePath);
    /**
     * logic check for future inputs
     */
    if (filePath.ext === '.conf') {
        // console.log('got .conf file - proceeding')
    }
    else if (filePath.ext === '.ucs') {
        return console.log('got a ucs archive - not supported yet');
    }
    else if (filePath.ext === '.qkview') {
        return console.log('got a qkview - not supported yet');
    }
    else {
        return console.error(`file type of ${filePath.ext}, not supported (only .conf at this time)`);
    }
    try {
        // try to read file contents
        const x = fs.readFileSync(path_1.default.join(filePath.dir, filePath.base), 'utf-8');
        // try to parse file as bigip.conf
        const bConfig = new ltm_1.default(x);
        // return extracted apps
        const v = JSON.stringify(bConfig.explode());
        return console.log(v);
    }
    catch (e) {
        return console.log(e.message);
    }
}
yargs_1.default
    .command('explode <file>', 'explode bigip.conf to apps', (yargs) => {
    yargs
        .positional('file', {
        describe: 'bigip.conf to explode'
    });
}, (argv) => {
    // console.log(argv.file);
    explode(argv.file);
})
    // .command()
    .demandCommand(1, 'A command is required')
    .wrap(120)
    .strict()
    .argv;
//# sourceMappingURL=cli.js.map