#!/usr/bin/env node
/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import BigipConfig from './ltm'
import yargs from 'yargs';
import Logger from 'f5-conx-core/dist/logger';

export const logger = new Logger('F5_CORKSCREW_LOG_LEVEL');

async function explode(args: argsObj) {

    logger.console = false

    const log = [];
    let err;
    let output;

    logger.debug(args)

    const device = new BigipConfig();

    device.on('parseFile', x => logger.info('parseFile', x))
    device.on('parseObject', x => logger.info('parseObject', x))

    // load and parse the archive
    await device.loadParseAsync(args.file)
        .then(async () => {
            // extract configs/apps
            await device.explode()
                .then(expld => {
                    // return good output
                    output = expld;
                })
                .catch(thisErr => {
                    // return error and extraction logs
                    err = thisErr;
                    log.push(device.logs())
                });
        })
        .catch(catchError => {
            // return error and extraction logs
            err = catchError;
            log.push(device.logs())
        })

    // build response object
    const respObj = {}

    if (!args.no_command_logs) {
        // add logs from command execution
        respObj['command_logs'] = logger.journal;
    }

    if (output) {
        if(args.no_sources) delete output.config.sources
        if(args.no_file_store) delete output.fileStore
        if(args.no_conversion_logs) delete output.logs

        // add successful output if there
        respObj['output'] = output;
    }

    if (err) {
        // if any errors, add error and extraction logs
        respObj['err'] = err;
        respObj['log'] = log;
    }

    console.log(JSON.stringify(respObj))

}

// yargs
//     .command('explode <file>', 'explode bigip config', (yargs) => {
//         yargs
//             .positional('file', {
//                 describe: '.conf|ucs|kqview to explode',
//                 demandOption: true
//             })
//         .option('no_sources', {
//             describe: 'supress config file sources bigip.conf, bigip_base.conf output',
//             boolean: true
//         })
//         .option('no_file_store', {
//             describe: 'supress filestore files output',
//             boolean: true
//         })
//         .option('no_command_logs', {
//             describe: 'no cli output',
//             boolean: true
//         })
//         .option('no_conversion_logs', {
//             describe: 'no extraction parsing logs',
//             boolean: true
//         })
//     }, (argv: argsObj) => {
//         explode(argv)
//     })
//     .demandCommand(1, 'A command is required')
//     .wrap(120)
//     .strict()
//     .argv;


export type argsObj = {
    no_sources: boolean,
    no_file_store: boolean,
    no_command_logs: boolean,
    no_conversion_logs: boolean,
    file: string
}