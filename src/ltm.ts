/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { EventEmitter } from 'events';
import { RegExTree } from './regex'
import logger from './logger';
import { nestedObjValue } from './objects'
import { BigipConfObj, ConfigFile, Explosion, Stats, xmlStats } from './models'
import { v4 as uuidv4 } from 'uuid';
import { countObjects } from './objCounter';
import { digVsConfig, getHostname } from './digConfigs';
import path from 'path';
import { UnPacker } from './unPackerStream';
import { digDoConfig } from './digDoClassesAuto';
import { DigGslb } from './digGslb';
import { parseDeep } from './deepParse';
// import { XMLParser } from 'fast-xml-parser';
import { deepmergeInto } from 'deepmerge-ts';



/**
 * Class to consume bigip configs -> parse apps
 * 
 */
export default class BigipConfig extends EventEmitter {
    /**
     * incoming config files array
     * ex. [{filename:'config/bigip.conf',size:12345,content:'...'},{...}]
     */
    configFiles: ConfigFile[] = [];
    /**
     * tmos config as nested json objects 
     * - consolidated parant object keys like ltm/apm/sys/...
     */
    configObject: BigipConfObj = {};
    /**
     * tmos version of the config file
     */
    tmosVersion: string | undefined;
    /**
     * hostname of the source device
     */
    hostname: string | undefined;
    /**
     * input file type (.conf/.ucs/.qkview/.tar.gz)
     */
    inputFileType: string;
    /**
     * tmos version specific regex tree for abstracting applications
     */
    rx: RegExTree | undefined;
    /**
     * corkscrew processing stats object
     */
    stats: Stats = {
        objectCount: 0,
    };
    /**
     * stats information extracted from qkview xml files
     */
    deviceXmlStats: xmlStats = {};
    /**
     * default profile settings
     */
    defaultProfileBase: ConfigFile;
    /**
     * default low (system) profile settings
     */
    defaultLowProfileBase: ConfigFile;
    /**
     * bigip license file
     */
    license: ConfigFile;
    /**
     * tmos file store files, which include certs/keys/external_monitors/...
     */
    fileStore: ConfigFile[] = [];

    constructor() {
        super();
    }

    /**
     * 
     * @param file bigip .conf/ucs/qkview/mini_ucs.tar.gz
     */
    async loadParseAsync(file: string): Promise<number> {
        const startTime = process.hrtime.bigint();
        // capture incoming file type
        this.inputFileType = path.parse(file).ext;

        const parseConfPromises = [];
        const parseStatPromises = [];
        const unPacker = new UnPacker();

        unPacker.on('conf', conf => {
            // parse .conf files, capture promises
            parseConfPromises.push(this.parseConf(conf))
        })
        unPacker.on('stat', conf => {
            // parse stats files async since they are going to thier own tree
            parseStatPromises.push(this.parseXmlStats(conf))
        })

        await unPacker.stream(file)
            .then(async x => {

                // we don't get x, if we only process a single conf file
                if (x) {

                    this.stats.sourceSize = x.size;

                    // wait for all the parse config promises to finish
                    await Promise.all(parseConfPromises)

                    // then parse all the other non-conf files
                    this.parseExtras(x.files)
                }
            })

        // wait for all the stats files processing promises to finish
        await Promise.all(parseStatPromises)

        // get ltm/gtm/apm/asm object counts
        this.stats.objects = await countObjects(this.configObject)

        // assign souceTmosVersion to stats object also
        this.stats.sourceTmosVersion = this.tmosVersion

        // get hostname to show in vscode extension view
        this.hostname = getHostname(this.configObject);

        // end processing time, convert microseconds to miliseconds
        this.stats.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        return this.stats.parseTime;
    }


    /**
     * async parsing of config files
     */
    async parseConf(conf: ConfigFile): Promise<void> {

        // add config file to tree

        if (
            conf.fileName === 'config/profile_base.conf' ||
            conf.fileName === 'config/low_profile_base.conf'
        ) {
            // if default profile base, pass on parsing
            logger.info(`${conf.fileName}: default profile base file, stashing for later`)
            this.defaultProfileBase = conf;
            this.defaultLowProfileBase = conf;
            return
        }

        this.emit('parseFile', conf.fileName)

        conf.content = conf.content.replace(/\r\n/g, '\n')

        this.configFiles.push(conf)

        if (this.rx) {
            // have an RX tree already so asyncronously test the file version matches
            this.setTmosVersion(conf)
        } else {
            // no RX tree set yet, so wait for this to finish
            await this.setTmosVersion(conf)
        }



        await this.parentTmosObjects(conf)
            .then(configArry => {

                // add object count to stats
                this.stats.objectCount = this.stats.objectCount + configArry.length

                configArry.forEach((el, index) => {

                    // create parsing details obj for emitter
                    const parsingObj = {
                        parsing: conf.fileName,              // current obj name
                        num: index + 1,             // obj #
                        of: configArry.length     // total # of objs
                    }

                    this.emit('parseObject', parsingObj)

                    // extract object name from body
                    const name = el.match(this.rx.parentNameValue);

                    if (name && name[2]) {

                        // split extracted name element by spaces
                        const names = name[1].split(' ');

                        // create new nested objects with each of the names, assigning value on inner-most
                        const newObj = nestedObjValue(names, name[2]);

                        // fully parse key items before adding to the tree
                        parseDeep(newObj, this.rx)

                        deepmergeInto(this.configObject, newObj);
                    } else {
                        logger.error('Detected parent object, but does not have all necessary regex elements to get processed ->', el)
                    }
                });
            })
    }


    async parseXmlStats(file: ConfigFile): Promise<void> {

        this.emit('parseFile', file.fileName)

        // look at replacing with 'fast-xml-parser'

        // todo: refactor xml parsing to just get the things we want
        //  - virtual server stats (to get top apps)
        //  - wideip stats (top talkers)
        //      - any other dns sizing stats like listeners qps
        //  - any other high level asm/apm stats that would help indicate importance

        // was parsing all files for ALL stats, but it ends up being 100sMb of data
        // so, just getting some interesting stuff for now
        // if (file.fileName === 'stat_module.xml'){

        //     const options = {
        //         ignoreAttributes: false,
        //         attributeValueProcessor: (name, val, jPath) => {
        //             const a = name;
        //         },
        //         updateTag: (tagName, jPath, attrs) => {
        //             attrs["At"] = "Home";
        //             return true;
        //         }
        //     };
        //     const xmlParser = new XMLParser(options);
        //     const xJson = xmlParser.parse(file.content)
            
        //     if(xJson) {
                
        //     }
        // }

    }

    async parseExtras(files: ConfigFile[]): Promise<void> {
        // take in list of files (non-conf)

        files.map(file => {

            this.emit('parseFile', file.fileName)

            if (file.fileName.includes('license')) {
                this.license = file;
            }

            if (file.fileName.includes('/filestore')) {
                this.fileStore.push(file);
                // todo: figure out what kind of file this is and put the contents into the main config tree
            }
        })
        return;

    }

    async parentTmosObjects(conf: ConfigFile): Promise<string[]> {

        // this is needed to mark the end of the file, and get the regex to complete
        //      the parentObjects rx relies on the start of the next known parent object (ltm|apm|gtm|asm|sys|...)
        const confContent = conf.content.concat('---end---');
        
        const x = []
        try {
            // try to parse the config into an array
            x.push(...confContent.match(this.rx.parentObjects));
        } catch (e) {
            logger.error(`failed to extract any parent tmos matches from ${conf.fileName} - might be a scripts file...`);
            return []
        }

        return x;
    }

    /**
     * parses config file for tmos version, sets tmos version specific regex tree used to parse applications
     * @param x config-file object
     */
    async setTmosVersion(x: ConfigFile): Promise<void> {
        if (this.rx) {
            // rex tree already assigned, lets confirm subsequent file tmos version match
            if (this.tmosVersion === this.rx.getTMOSversion(x.content)) {
                // do nothing, current file version matches existing files tmos verion
            } else {
                const err = `Parsing [${x.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`;
                logger.error(err)
                // throw new Error(err);
            }
        } else {

            // first time through - build everything
            this.rx = new RegExTree(x.content);  // instantiate regex tree
            this.tmosVersion = this.rx.tmosVersion; // feed tmos version back into this class
            logger.info(`Recieved .conf file of version: ${this.tmosVersion}`)

            // assign regex tree for particular version
            // this.rx = rex.get(this.tmosVersion)
        }
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


        const apps = await this.apps();   // extract apps before pack timer...

        // extract all the dns apps/fqdns
        const fqdns = await this.digGslb();

        const startTime = process.hrtime.bigint();  // start pack timer

        // extract DO classes (base information expanded)
        const doClasses = await digDoConfig(this.configObject);

        // build return object
        const retObj = {
            id: uuidv4(),                           // generat uuid,
            dateTime: new Date(),                   // generate date/time
            hostname: this.hostname,
            inputFileType: this.inputFileType,      // add input file type
            config: {
                sources: this.configFiles,
                doClasses
            },
            stats: this.stats,                      // add stats object
            logs: await this.logs()                 // get all the processing logs
        }

        if (apps.length > 0) {
            // add virtual servers (apps), if found
            retObj.config['apps'] = apps;
        }
        
        if (fqdns) {
            // add dns/fqdn details, if available
            retObj.config['gslb'] = fqdns;
        }
        
        if (this.fileStore.length > 0) {
            // add files from file store
            retObj['fileStore'] = this.fileStore;
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

    async digGslb(fqdn?: string) {

        const startTime = process.hrtime.bigint();

        const apps = [];

        const dg = new DigGslb(this.configObject.gtm, this.rx.gtm);

        await dg.fqdns(fqdn).then(fs => {
            apps.push(...fs);
        })

        this.stats.fqdnTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        return apps;
    }


    /**
     * extracts ltm app(s)
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

        } else if (this.configObject.ltm.virtual && Object.keys(this.configObject.ltm.virtual).length > 0) {

            // means we didn't get an app name, so try to dig all apps...
            const apps = [];

            for (const [key, value] of Object.entries(this.configObject.ltm.virtual)) {
                // event about extracted app
                this.emit('extractApp', {
                    app: key,
                    time: Number(process.hrtime.bigint() - startTime) / 1000000
                })

                // dig config, but catch errors
                await digVsConfig(key, value, this.configObject, this.rx)
                    .then(vsApp => {
                        apps.push(vsApp);
                    })
                    .catch(err => {
                        // apps.push({ name: key, lines: err, });
                        logger.error(`corkscrew: problem abstracting app/vs ${key}`, err);
                    })
            }

            this.stats.appTime = Number(process.hrtime.bigint() - startTime) / 1000000;
            return apps;
        } else {
            logger.info('no ltm virtual servers found - excluding apps information')
            return [];
        }
    }



}


