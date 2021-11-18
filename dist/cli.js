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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const ltm_1 = __importDefault(require("./ltm"));
const yargs_1 = __importDefault(require("yargs"));
const logger_1 = __importDefault(require("f5-conx-core/dist/logger"));
exports.logger = new logger_1.default('F5_CORKSCREW_LOG_LEVEL');
function explode(args) {
    return __awaiter(this, void 0, void 0, function* () {
        exports.logger.console = false;
        const log = [];
        let err;
        let output;
        exports.logger.debug(args);
        const device = new ltm_1.default();
        device.on('parseFile', x => exports.logger.info('parseFile', x));
        device.on('parseObject', x => exports.logger.info('parseObject', x));
        // load and parse the archive
        yield device.loadParseAsync(args.file)
            .then(() => __awaiter(this, void 0, void 0, function* () {
            // extract configs/apps
            yield device.explode()
                .then(expld => {
                // return good output
                output = expld;
            })
                .catch(thisErr => {
                // return error and extraction logs
                err = thisErr;
                log.push(device.logs());
            });
        }))
            .catch(catchError => {
            // return error and extraction logs
            err = catchError;
            log.push(device.logs());
        });
        // build response object
        const respObj = {};
        if (!args.no_command_logs) {
            // add logs from command execution
            respObj['command_logs'] = exports.logger.journal;
        }
        if (output) {
            if (args.no_sources)
                delete output.config.sources;
            if (args.no_file_store)
                delete output.fileStore;
            if (args.no_conversion_logs)
                delete output.logs;
            // add successful output if there
            respObj['output'] = output;
        }
        if (err) {
            // if any errors, add error and extraction logs
            respObj['err'] = err;
            respObj['log'] = log;
        }
        console.log(JSON.stringify(respObj));
    });
}
yargs_1.default
    .command('explode <file>', 'explode bigip config', (yargs) => {
    yargs
        .positional('file', {
        describe: '.conf|ucs|kqview to explode',
        demandOption: true
    })
        .option('no_sources', {
        describe: 'supress config file sources bigip.conf, bigip_base.conf output',
        boolean: true
    })
        .option('no_file_store', {
        describe: 'supress filestore files output',
        boolean: true
    })
        .option('no_command_logs', {
        describe: 'no cli output',
        boolean: true
    })
        .option('no_conversion_logs', {
        describe: 'no extraction parsing logs',
        boolean: true
    });
}, (argv) => {
    explode(argv);
})
    .demandCommand(1, 'A command is required')
    .wrap(120)
    .strict()
    .argv;
//# sourceMappingURL=cli.js.map