import path from "path";
import * as fs from 'fs';
import logger from "./logger";
import decompress from 'decompress';

/**
 * input filePath
 *  - if bigip.conf -> return file?
 *  - if ucs -> extract files, combine them, return single item for parsing
 *      may need to write file to disk to stream into parse function
 *  - if qkview => extract files, combine them, return single item for parsing
 *      ' same as above '
 * 
 *  - if mini_ucs => same as above
 * 
 */

export type ArchiveFiles = {
    fileName: string,
    content: string
}[]

 /**
  * 
  * @param input 
  */
export async function parseLoad (input: string):Promise<ArchiveFiles> {


    /**
     * todo:  setup test to see what happens when we try to path.parse
     *      something that is not a filePath
     */
    // part input to usable pieces
    const filePath = path.parse(input);
    // console.log(filePath);

    /**
     * what kind of file we workin with?
     */
    if (filePath.ext === '.conf') {

        logger.debug(`got .conf file: [${input}]`)

        try {
            // try to read file contents
            const content = fs.readFileSync(path.join(filePath.dir, filePath.base), 'utf-8');
            // const fileName  = path.join(filePath.base, filePath.ext);
            return [{ fileName: filePath.base, content }];

        } catch (e) {
            logger.error('not able to read file', e.message);
            Promise.reject(`not able to read file => ${e.message}`);
        }

    } else if (filePath.ext === '.gz') {

        // const file2 = [];

        /**
         * tried unzipper, hit following
         * https://github.com/ZJONSSON/node-unzipper/issues/108
         */

        logger.debug(`detected .gz zip file: [${input}], attempting to read`)
        // const file = fs.readFileSync(path.join(filePath.dir, filePath.base), 'utf-8')
        // const file = fs.createReadStream(input);

        /**
         * https://www.npmjs.com/package/decompress
         * 
         * todo:  make regexs better - reference rex tree
         */

        return await decompress(input, {
            filter: file => {
                if (/config\/bigip.conf/.test(file.path) && file.type === 'file') {
                    return true
                }
                if (/config\/bigip_base.conf/.test(file.path) && file.type === 'file') {
                    return true
                }
                if (/config\/partitions\/*\//.test(file.path) && file.type === 'file') {
                    return true
                }
            }
        })
        .then( extracted => {
            return extracted.map( x => { 
                return { fileName: x.path, content: x.data.toString()} 
            })
            // console.log( x );
            // file2.push( files )
        })

        // let y = x;
        // const x = zlib.createGunzip();
        // const u = file.pipe(x).pipe(unzipper.Parse())
        // .on('entry', function (entry) {
        //     const fileName = entry.path;
        //     const type = entry.type; // 'Directory' or 'File'
        //     const size = entry.vars.uncompressedSize; // There is also compressedSize;
        //     if (fileName === "this IS the file I'm looking for") {
        //     entry.pipe(fs.createWriteStream('output/path'));
        //     } else {
        //     entry.autodrain();
        //     }
        // });


        // const file = new Buffer('eJzT0yMAAGTvBe8=', 'base64');
        // const file = fs.createReadStream(input);
        // zlib.gunzip(file, function (err, yyy) {
        //     if (!err) {
        //         console.log(file.toString());
        //     }
        //     console.log(yyy);
        // });
        // x.write(y);

        // fs.createReadStream(input)
        // .pipe(unzipper.Parse())
        // .on('entry', function (entry) {
        //     const fileName = entry.path;
        //     const type = entry.type; // 'Directory' or 'File'
        //     const size = entry.vars.uncompressedSize; // There is also compressedSize;
        //     if (fileName === "this IS the file I'm looking for") {
        //     entry.pipe(fs.createWriteStream('output/path'));
        //     } else {
        //     entry.autodrain();
        //     }
        // });
        
        // const zip = fs.createReadStream(input).pipe(unzipper.Parse({forceStream: true}));
        // for await (const entry of zip) {
        //   const fileName = entry.path;
        //   const type = entry.type; // 'Directory' or 'File'
        //   const size = entry.vars.uncompressedSize; // There is also compressedSize;
        //   if (fileName === "this IS the file I'm looking for") {
        //     entry.pipe(fs.createWriteStream('output/path'));
        //   } else {
        //     entry.autodrain();
        //   }
        // }


    } else if (filePath.ext === '.ucs') {
        
        const msg = 'got a ucs archive - not supported yet'
        logger.error(msg);
        // Promise.reject(msg);
        return;

    } else if (filePath.ext === '.qkview') {
        
        const msg = 'got a qkview - not supported yet'
        logger.error(msg);
        return;
        // Promise.reject(msg);

    } else {
        
        const msg = `file type of "${filePath.ext}", not supported (only .conf at this time)`
        logger.error(msg);
        return;
        // Promise.reject(msg);

    }

    // const config = 'config string...'
    // return config
}