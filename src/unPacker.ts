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
import decompress from 'decompress';


/**
 * defines the structure of the archive file extraction or single bigip.conf
 */
export type ConfigFiles = {
    fileName: string,
    size: number,
    content: string
}[]

 /**
  * extracts needed config files from archive
  * @param input path/file to .conf|.ucs|.qkview|.gz
  */
export async function unPacker (input: string):Promise<ConfigFiles> {

    /**
     * look at streaming specific files from the archive without having to load the entire thing into memory
     * 
     * https://github.com/mafintosh/tar-fs
     * https://github.com/mafintosh/gunzip-maybe
     * https://github.com/mafintosh/tar-stream
     * https://github.com/npm/node-tar#readme
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

            return [{ fileName: filePath.base, size, content }];

        } catch (e) {
            logger.error('not able to read file', e.message);
            throw new Error(`not able to read file => ${e.message}`);
        }


    } else if (filePath.ext === '.gz' || filePath.ext === '.ucs' || filePath.ext === '.qkview') {

        const size = fs.statSync(path.join(filePath.dir, filePath.base)).size;
        logger.debug(`detected file: [${input}], size: [${size}]`)

        return await decompress(input, {
            filter: file => archiveFileFilter(file)
        })
        .then( extracted => {
            return extracted.map( x => { 
                return { fileName: x.path, size: x.data.byteLength, content: x.data.toString()} 
            })
        })


    } else {
        
        const msg = `file type of "${filePath.ext}", not supported, try (.conf|.ucs|.kqview|.gz)`
        logger.error(msg);
        throw new Error(`not able to read file => ${msg}`);
    }

}

/**
 * filter for decompress function that filters files we want
 * @param file decompress file output
 * @param boolean if file match -> return (pass filter)
 */
function archiveFileFilter(file: decompress.File) {

    /**
     * I'm sure this could be done waaay cleaner, but I figured this was a nice way
     *  to spell it out for others
     * 
     * When these return true for the item passed in, it means the filter will return it
     *  
     */

    if (/^config\/bigip.conf$/.test(file.path) && file.type === 'file') {
        return true
    }
    if (/^config\/bigip_base.conf$/.test(file.path) && file.type === 'file') {
        return true
    }
    if (/^config\/partitions\/.+?/.test(file.path) && file.type === 'file') {
        return true
    }
}