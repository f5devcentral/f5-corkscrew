import logger from './logger';
import { countObjects } from './objCounter';
import { RegExTree } from './regex';
import { ConfigFiles } from './unPacker'
import { nestedObjValue, deepMergeObj } from './utils/objects';


/**
 * new parsing function to extract from main ltm class and add events for progress
 */
export function parse(files: ConfigFiles) {
    const startTime = process.hrtime.bigint();
    logger.debug('Begining to parse configs')

    files.forEach(el => {
        /**
         * for each file
         * 1. get tmos version
         * 2. extract parent objects to array
         * 3. convert array to main obj
         */

        if (this.rx) {
            // rex tree already assigned, lets confirm subsequent file tmos version match
            if (this.tmosVersion === this.getTMOSversion(el.content, this.rx.tmosVersion)) {
                // do nothing, current file version matches existing files tmos verion
            } else {
                logger.error(`Parsing [${el.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`)
                return
            }
        } else {
            
            // first time through - build everything
            const rex = new RegExTree();  // instantiate regex tree
            this.tmosVersion = getTMOSversion(el.content, rex.tmosVersionReg);  // get tmos version
            logger.info(`Recieved .conf file of version: ${this.tmosVersion}`)
            
            // assign regex tree for particular version
            this.rx = rex.get(this.tmosVersion)
        }

        let configAsSingleLevelArray = [];
        try {
            // try to parse the config into an array
            configAsSingleLevelArray = [...el.content.match(this.rx.parentObjects)];
        } catch (e) {
            logger.error('failed to extract any parent matches from file - might be a scripts/iapps file...');
        }

        // if we parsed a config file that produced parent objects
        if (configAsSingleLevelArray) {

            // get number of config objects
            const lines = configAsSingleLevelArray.length;
            logger.debug(`detected ${this.stats.objectCount} parent objects in this file`)
            
            // add to main stats
            this.stats.objectCount += lines;
            
            logger.debug(`creating more detailed arrays/objects for deeper inspection`)
            configAsSingleLevelArray.forEach(el => {

                // extract object name from body
                const name = el.match(this.rx.parentNameValue);

                if (name && name.length === 3) {
    
                    // split extracted name element by spaces
                    const names = name[1].split(' ');
                    // create new nested objects with each of the names, assigning value on inner-most
                    const newObj = nestedObjValue(names, name[2]);

                    this.configMultiLevelObjects = deepMergeObj(this.configMultiLevelObjects, newObj);
                }
            });

        }
    });

    // get ltm object counts
    this.stats.objects = countObjects(this.configMultiLevelObjects);

    // end processing time, convert microseconds to miliseconds
    this.stats.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000; 

    return this.stats.parseTime;
}

/**
 * extract tmos config version from first line
 * ex.  #TMSH-VERSION: 15.1.0.4
 * @param config bigip.conf config file as string
 */
function getTMOSversion(config: string, regex: RegExp): string {
    const version = config.match(regex);
    if(version) {
        //found tmos version
        return version[1];
    } else {
        const msg = 'tmos version not detected -> meaning this probably is not a bigip.conf'
        logger.error(msg)
        throw new Error(msg)
    }
}