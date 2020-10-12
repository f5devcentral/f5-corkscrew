/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';

import { EventEmitter } from 'events';
import logger from './logger';
import { countObjects } from './objCounter';
import { RegExTree } from './regex';
import { ConfigFiles } from './unPacker'
import { nestedObjValue, deepMergeObj } from './utils/objects';


export class Parser extends EventEmitter {
    objectCount: number;
    tmosVersion: string;
    rx: any;
    configObject: unknown;
    parseTime: number;

    constructor() {
        super();
    }
    
    loadParse (files: ConfigFiles) {
        return this.parse(files);
    }

    /**
     * new parsing function to extract from main ltm class and add events for progress
     * 
     * This is the latest work as of 10.11.2020
     */
    private parse(files: ConfigFiles) {
        const startTime = process.hrtime.bigint();
        logger.debug('Begining to parse configs')
        let objectCount = 0;

        this.emit('parseStart', 'starting to parse stuff')

        files.forEach((el, index) => {

            //  for each file
            //  1. get tmos version
            //  2. extract parent objects to array
            //  3. convert array to main obj

            // create parsing details obj for emitter
            const parsing = {
                parsing: el.fileName,   // current file name
                num: index + 1,         // file #
                of: files.length        // total # of files
            }
            
            this.emit('parseFile', parsing )

            if (this.rx) {
                // rex tree already assigned, lets confirm subsequent file tmos version match
                if (this.tmosVersion === getTMOSversion(el.content, this.rx.tmosVersion)) {
                    // do nothing, current file version matches existing files tmos verion
                } else {
                    logger.error(`Parsing [${el.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`)
                    return
                }
            } else {
                
                // first time through - get initial rex tree
                const rex = new RegExTree();  // instantiate regex tree
                this.tmosVersion = getTMOSversion(el.content, rex.tmosVersionReg);  // get tmos version
                logger.info(`Recieved .conf file of version: ${this.tmosVersion}`)
                
                // assign regex tree for particular version
                this.rx = rex.get(this.tmosVersion)
            }

            let configArray = [];
            try {
                // try to parse the config into an array
                configArray = [...el.content.match(this.rx.parentObjects)];
            } catch (e) {
                logger.error('failed to extract any parent matches from file - might be a scripts/iapps file...');
            }

            // if we parsed a config file that produced parent objects
            if (configArray) {

                // get number of config objects
                const lines = configArray.length;
                logger.debug(`detected ${lines} parent objects in this file`)
                
                // add to main stats
                objectCount += lines;
                
                logger.debug(`creating more detailed arrays/objects for deeper inspection`)
                configArray.forEach(el => {

                    // emit events about each object being parsed

                    // extract object name from body
                    const name = el.match(this.rx.parentNameValue);

                    if (name && name.length === 3) {
        
                        // split extracted name element by spaces
                        const names = name[1].split(' ');
                        // create new nested objects with each of the names, assigning value on inner-most
                        const newObj = nestedObjValue(names, name[2]);

                        this.configObject = deepMergeObj(this.configObject, newObj);
                        
                    }
                });

            }
        });

        // get ltm object counts
        const objects = countObjects(this.configObject);

        // end processing time, convert microseconds to miliseconds
        const parseTime = Number(process.hrtime.bigint() - startTime) / 1000000; 

        this.emit('parseEnd', `we done finished, took ${this.parseTime}ms`)

        return {
            parseTime,
            objectCount,
            objects,
            configObject: this.configObject
        };
    }
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
