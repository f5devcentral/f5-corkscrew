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

    // part input to usable pieces
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
            // const fileName  = path.join(filePath.base, filePath.ext);
            
            logger.debug(`got .conf file [${input}], size [${size}]`)

            return [{ fileName: filePath.base, size, content }];

        } catch (e) {
            logger.error('not able to read file', e.message);
            return
            // Promise.reject(`not able to read file => ${e.message}`);
        }


    } else if (filePath.ext === '.gz' || filePath.ext === '.ucs' || filePath.ext === '.qkview') {

        
        try {
            const size = fs.statSync(path.join(filePath.dir, filePath.base)).size;
            logger.debug(`detected file: [${input}], size: [${size}]`)
        } catch (e) {
            logger.error(`file ${input}, is not readable: ${e.messge}`);
            return;
        }

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
        // Promise.reject(new Error(msg));
        return;
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