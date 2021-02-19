/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import path from "path";
import * as fs from 'fs';
import logger from "./logger";
// import decompress from 'decompress';
import zlib from 'zlib';
import tar from 'tar-stream'
import { EventEmitter } from "events";


/**
 * defines the structure of the archive file extraction or single bigip.conf
 */
export type ConfigFile = {
    fileName: string,
    size: number,
    content: string
}

export type fsStreamHeader = {
    name: string,
    size: number,
    type: 'file' | 'directory'
}

/**
 * async method for extracting config files from archives
 * - .conf files are emited as "conf" events
 * - all other config files are return at promise resolution
 * 
 */
export class UnPacker extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * extracts needed config files from archive
     *  - .conf files are emited as events during extraction so they can be parsed asyncronously
     *  - all other files returned at end in promise completion to be added to the conf tree
     * @param input path/file to .conf|.ucs|.qkview|.gz
     */
    async stream(input: string): Promise<ConfigFile[]> {

        /**
         * look at streaming specific files from the archive without having to load the entire thing into memory
         * 
         * https://github.com/mafintosh/tar-fs
         * https://github.com/mafintosh/gunzip-maybe
         * https://github.com/mafintosh/tar-stream
         * https://github.com/npm/node-tar#readme
         * 
         * https://stackoverflow.com/questions/19978452/how-to-extract-single-file-from-tar-gz-archive-using-node-js
         * 
         */

        // parse input to usable pieces
        const filePath = path.parse(input);

        /**
         * what kind of file we workin with?
         */
        if (filePath.ext === '.conf') {

            try {

                // get file size
                const size = fs.statSync(path.join(filePath.dir, filePath.base)).size;
                // try to read file contents
                const content = fs.readFileSync(path.join(filePath.dir, filePath.base), 'utf-8');

                logger.debug(`got .conf file [${input}], size [${size}]`)

                this.emit('conf', { fileName: filePath.base, size, content })

                // return [{ fileName: filePath.base, size, content }];
                return

            } catch (e) {
                logger.error('not able to read file', e.message);
                throw new Error(`not able to read file => ${e.message}`);
            }


        } else if (filePath.ext === '.gz' || filePath.ext === '.ucs' || filePath.ext === '.qkview') {

            const size = fs.statSync(path.join(filePath.dir, filePath.base)).size;
            logger.debug(`detected file: [${input}], size: [${size}]`)

            const extract = tar.extract();
            const files: ConfigFile[] = []

            return new Promise((resolve, reject) => {
                extract.on('entry', (header, stream, next) => {
                    let captureFile = false;
                    const contentBuffer = []
                    // detect the files we want and set capture flag
                    if (fileFilter(header.name) && header.type === 'file') {
                        captureFile = true;
                    } else {
                        // not the file we want, so call the next entry
                        next()
                    }
                    stream.on('data', (chunk) => {
                        // if this is a file we want, buffer it's content
                        if (captureFile) {
                            contentBuffer.push(chunk);
                        }
                    });
                    stream.on('end', () => {
                        if (captureFile) {
                            if((header.name as string).endsWith('.conf')) {
                                // only emit conf files for events
                                this.emit('conf', {
                                    fileName: header.name,
                                    size: header.size,
                                    content: contentBuffer.join('')
                                })
                            } else {
                                // buffer all other files to be returned when complete
                                files.push({
                                    fileName: header.name,
                                    size: header.size,
                                    content: contentBuffer.join('')
                                })
                            }
                        }
                        next();
                    });
                    stream.resume();
                });

                extract.on('finish', () => {
                    // we finished processing, .conf file should have been emited as events, so now resolve the promise with all the other config files
                    return resolve(files);
                });
                extract.on('error', err => {
                    return reject(err);
                });

                fs.createReadStream(input)
                    .pipe(zlib.createGunzip())
                    .pipe(extract);
            })

        } else {
            const msg = `file type of "${filePath.ext}", not supported, try (.conf|.ucs|.kqview|.gz)`
            logger.error(msg);
            throw new Error(`not able to read file => ${msg}`);
        }

    }
}

/**
 * filters files we want
 * @param file name as string
 * @param boolean if file match -> return (pass filter)
 */
export function fileFilter(name: string): boolean {

    /**
     * list of RegEx's to find the files we need
     * 
     * only one has to pass to return true
     */
    const fileRegexs: RegExp[] = [
        /^config\/bigip.conf$/, //
        /^config\/bigip_base.conf$/,
        /^config\/partitions\/.+?$/,
        /^config\/bigip_gtm.conf$/,
        /^config\/bigip.license$/,
        /^config\/profile_base.conf$/,
        /^var\/tmp\/filestore_temp\/files_d\/.+?$/
    ]
    
    return fileRegexs.some( rx => rx.test(name));

}