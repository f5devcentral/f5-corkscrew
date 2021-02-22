/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// /* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { EventEmitter } from 'events';
import { RegExTree, TmosRegExTree } from './regex'
import logger from './logger';
import { nestedObjValue } from './utils/objects'
import { BigipConfObj, Explosion, Stats } from './models'
import { deepMergeObj } from './utils/objects'
import { v4 as uuidv4 } from 'uuid';
import { countObjects } from './objCounter';
import { ConfigFiles, unPacker } from './unPacker'
import { digBaseConfig, digVsConfig, getHostname } from './digConfigs';
import path from 'path';


/**
 * Class to consume bigip configs -> parse apps
 * 
 */
export default class BigipConfig extends EventEmitter {
    /**
     * incoming config files array
     * ex. [{filename:'config/bigip.conf',size:12345,content:'...'},{...}]
     */
    public configFiles: ConfigFiles = [];
    /**
     * tmos config as nested json objects 
     * - consolidated parant object keys like ltm/apm/sys/...
     */
    public configObject: BigipConfObj = {};
    /**
     * placeholder for future fully jsonified tmos config
     */
    public configFullObject: BigipConfObj = {};
    public tmosVersion: string | undefined; // move to stats tree...
    public hostname: string | undefined;
    public inputFileType: string;
    private rx: TmosRegExTree | undefined;
    private stats: Stats = {
        objectCount: 0,
    };

    constructor() {
        super();
    }

    /**
     * load .conf file or files from ucs/qkview
     *  
     * @param config array of configs as strings
     */
    async load(file: string): Promise<number> {

        const startTime = process.hrtime.bigint();

        // capture incoming file type
        this.inputFileType = path.parse(file).ext;

        return await unPacker(file)
            .then(files => {

                this.configFiles = files;

                // run through files and add up file size
                this.stats.configBytes = this.configFiles.map(item => item.size).reduce((total, each) => {
                    return total += each;
                })
                this.stats.loadTime = Number(process.hrtime.bigint() - startTime) / 1000000;

                // unPacker returned something so respond with processing time
                return this.stats.loadTime;
            })
    }

    /**
     * new parsing fuction to work on list of files from unPacker
     */
    async parse(): Promise<number> {
        const startTime = process.hrtime.bigint();
        logger.debug('Begining to parse configs')

        this.configFiles.forEach((el, index) => {
            /**
             * for each file
             * 1. get tmos version
             * 2. extract parent objects to array
             * 3. convert array to main obj
             */

            // create parsing details obj for emitter
            const parsingFile = {
                parsing: el.fileName,   // current file name
                num: index + 1,         // file #
                of: this.configFiles.length        // total # of files
            }

            this.emit('parseFile', parsingFile)

            if (/\r\n/.test(el.content)) {
                el.content = el.content.replace(/\r\n/g, '\n')
            }

            if (this.rx) {
                // rex tree already assigned, lets confirm subsequent file tmos version match
                if (this.tmosVersion === this.getTMOSversion(el.content, this.rx.tmosVersion)) {
                    // do nothing, current file version matches existing files tmos verion
                } else {
                    const err = `Parsing [${el.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`;
                    logger.error(err)
                    // throw new Error(err);
                }
            } else {

                // first time through - build everything
                const rex = new RegExTree();  // instantiate regex tree
                this.tmosVersion = this.getTMOSversion(el.content, rex.tmosVersionReg);  // get tmos version
                logger.info(`Recieved .conf file of version: ${this.tmosVersion}`)

                // assign regex tree for particular version
                this.rx = rex.get(this.tmosVersion)
            }

            let configArray = [];
            try {
                // try to parse the config into an array
                //  this is probably the heaviest processing line in the entire app
                //     - aside from unpacking/searching the ucs/qkviews, which can be done in other ways
                // I have ideas on how we can create a better parser that would stream in the config, line by line, detect object chunks, pull them off and push them to an array
                configArray = [...el.content.match(this.rx.parentObjects)];
            } catch (e) {
                logger.error('failed to extract any parent matches from file - might be a scripts file...');
            }


            if (configArray) {

                // get number of lines in config
                // this seems to be fairly accurate when compareing config lines from other tools
                // const objectCount = configArray.length;
                // logger.debug(`detected ${this.stats.objectCount} parent objects in this file`)

                // add object count to main stats
                this.stats.objectCount += configArray.length;

                logger.debug(`creating more detailed arrays/objects for deeper inspection`)
                configArray.forEach((el, index) => {

                    // extract object name from body
                    const name = el.match(this.rx.parentNameValue);

                    if (name && name[2]) {

                        // create parsing details obj for emitter
                        const parsingObj = {
                            parsing: name[1],              // current obj name
                            num: index + 1,             // obj #
                            of: configArray.length      // total # of objs
                        }

                        this.emit('parseObject', parsingObj)

                        // split extracted name element by spaces
                        const names = name[1].split(' ');
                        // create new nested objects with each of the names, assigning value on inner-most
                        const newObj = nestedObjValue(names, name[2]);

                        this.configObject = deepMergeObj(this.configObject, newObj);
                    } else {
                        logger.error('Detected parent object, but does not have all necessary regex elements to get processed ->', el)
                    }
                });

            }
        });

        // get ltm object counts
        this.stats.objects = countObjects(this.configObject);

        // assign souceTmosVersion to stats object also
        this.stats.sourceTmosVersion = this.tmosVersion

        // get hostname to show in vscode extension view
        this.hostname = getHostname(this.configObject);

        // end processing time, convert microseconds to miliseconds
        this.stats.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        return this.stats.parseTime;
    }

    /**
     * return list of applications
     * 
     * @return array of app names
     * @example ['/Common/app1_80t_vs', '/tenant1/app4_t443_vs']
     */
    async appList(): Promise<string[]> {
        return Object.keys(this.configObject.ltm?.virtual);
    }

    /**
     * returns all details from processing
     * 
     * - 
     */
    // todo: type the return object for explode and remove the followin disable line
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async explode(): Promise<Explosion> {

        // if config has not been parsed yet...
        if (!this.configObject.ltm?.virtual) {
            await this.parse(); // parse config files
        }

        const apps = await this.apps();   // extract apps before parse timer...

        const startTime = process.hrtime.bigint();  // start pack timer

        // collect base information like vlans/IPs
        const base = await digBaseConfig(this.configObject)

        // build return object
        const retObj = {
            id: uuidv4(),                           // generat uuid,
            dateTime: new Date(),                   // generate date/time
            hostname: this.hostname,
            inputFileType: this.inputFileType,      // add input file type
            config: {
                sources: this.configFiles,
                apps,
                base
            },
            stats: this.stats,                      // add stats object
            logs: await this.logs()                 // get all the processing logs
        }

        // capture pack time
        this.stats.packTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        return retObj
    }

    /**
     * Get processing logs
     */
    async logs(): Promise<string[]> {
        return logger.getLogs();
    }


    /**
     * extracts app(s)
     * @param app single app string
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    async apps(app?: string) {

        /**
         * todo:  add support for app array to return multiple specific apps at same time.
         */

        const startTime = process.hrtime.bigint();

        if (app) {
            // extract single app config
            const value = this.configObject.ltm.virtual[app]

            this.emit('extractApp', {
                app,
                time: Number(process.hrtime.bigint() - startTime) / 1000000
            })

            if (value) {
                // dig config, then stop timmer, then return config...
                const x = [await digVsConfig(app, value, this.configObject, this.rx)];
                this.stats.appTime = Number(process.hrtime.bigint() - startTime) / 1000000
                return x;
            }

        } else {

            // means we didn't get an app name, so try to dig all apps...
            const apps = [];

            const i = this.configObject.ltm.virtual;
            for (const [key, value] of Object.entries(i)) {
                // event about extracted app
                this.emit('extractApp', {
                    app: key,
                    time: Number(process.hrtime.bigint() - startTime) / 1000000
                })

                // dig config, but catch errors
                await digVsConfig(key, value, this.configObject, this.rx)
                    .then(vsConfig => {
                        apps.push({ name: key, configs: vsConfig.config, map: vsConfig.map });
                    })
                    .catch(err => {
                        apps.push({ name: key, configs: err, map: '' });
                    })
            }

            this.stats.appTime = Number(process.hrtime.bigint() - startTime) / 1000000;
            return apps;
        }
    }



    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    private getTMOSversion(config: string, regex: RegExp): string {
        const version = config.match(regex);
        if (version) {
            //found tmos version
            return version[1];
        } else {
            const msg = 'tmos version not detected -> meaning this probably is not a bigip.conf'
            logger.error(msg)
            // throw new Error(msg)
        }
    }

}



// /**
//  * standardize line endings to linux
//  * "\r\n" and "\r" to "\n"
//  * @param config config as string
//  * @returns config
//  */
// function standardizeLineReturns (config: string){
//     const regex = /(\r\n|\r)/g;
//     return config.replace(regex, "\n");
// }

// /**
//  * Reverse string
//  * @param str string to reverse
//  */
// function reverse(str: string){
//     return [...str].reverse().join('');
//   }



