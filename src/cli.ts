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

const logger = new Logger('F5_CORKSCREW_LOG_LEVEL');


export const cli = yargs(process.argv.slice(2)).options({
    file: { 
        type: 'string',
        demandOption: true,
        describe: '.conf|ucs|kqview to explode'
    },
    no_sources: { type: 'boolean', default: true },
    no_file_store: { type: 'boolean', default: true },
    no_command_logs: { type: 'boolean', default: true },
    no_process_logs: { type: 'boolean', default: true },
    includeXmlStats: { type: 'boolean', default: false}
  }).argv

  explode(cli)



async function explode(args: any) {

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
        if(args.no_process_logs) delete output.logs

        // add successful output if there
        respObj['output'] = output;
    }

    if (args.includeXmlStats) {
        respObj['xmlStats'] = device.xmlStats.stats;
    }

    if (err) {
        // if any errors, add error and extraction logs
        respObj['err'] = err;
        respObj['log'] = log;
    }

    console.log(JSON.stringify(respObj))
    return respObj;
}

type argsObj = {
    no_sources: boolean,
    no_file_store: boolean,
    no_command_logs: boolean,
    no_process_logs: boolean,
    file: string
}