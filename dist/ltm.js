/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
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
const events_1 = require("events");
const regex_1 = require("./regex");
const logger_1 = __importDefault(require("./logger"));
const objects_1 = require("./utils/objects");
const objects_2 = require("./utils/objects");
const uuid_1 = require("uuid");
const objCounter_1 = require("./objCounter");
const unPacker_1 = require("./unPacker");
const digConfigs_1 = require("./digConfigs");
const path_1 = __importDefault(require("path"));
const unPackerStream_1 = require("./unPackerStream");
const xml2js_1 = require("xml2js");
/**
 * Class to consume bigip configs -> parse apps
 *
 */
class BigipConfig extends events_1.EventEmitter {
    constructor() {
        super();
        /**
         * incoming config files array
         * ex. [{filename:'config/bigip.conf',size:12345,content:'...'},{...}]
         */
        this.configFiles = [];
        /**
         * tmos config as nested json objects
         * - consolidated parant object keys like ltm/apm/sys/...
         */
        this.configObject = {};
        /**
         * placeholder for future fully jsonified tmos config
         */
        this.configFullObject = {};
        this.stats = {
            objectCount: 0,
        };
        this.deviceXmlStats = {};
        this.fileStore = [];
    }
    /**
     *
     * @param file bigip .conf/ucs/qkview/mini_ucs.tar.gz
     */
    loadParseAsync(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = process.hrtime.bigint();
            // capture incoming file type
            this.inputFileType = path_1.default.parse(file).ext;
            const parseConfPromises = [];
            const parseStatPromises = [];
            const unPacker = new unPackerStream_1.UnPacker();
            unPacker.on('conf', conf => {
                // parse .conf files, capture promises
                parseConfPromises.push(this.parseConf(conf));
            });
            unPacker.on('stat', conf => {
                // parse stats files async since they are going to thier own tree
                parseStatPromises.push(this.parseXmlStats(conf));
            });
            yield unPacker.stream(file)
                .then(({ files, size }) => __awaiter(this, void 0, void 0, function* () {
                this.stats.sourceSize = size;
                // wait for all the parse config promises to finish
                yield Promise.all(parseConfPromises);
                // then parse all the other non-conf files
                this.parseExtras(files);
            }));
            // wait for all the stats files processing promises to finish
            yield Promise.all(parseStatPromises);
            // get ltm object counts
            this.stats.objects = objCounter_1.countObjects(this.configObject);
            // assign souceTmosVersion to stats object also
            this.stats.sourceTmosVersion = this.tmosVersion;
            // get hostname to show in vscode extension view
            this.hostname = digConfigs_1.getHostname(this.configObject);
            // end processing time, convert microseconds to miliseconds
            this.stats.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
            return;
        });
    }
    /**
     * async parsing of config files
     */
    parseConf(conf) {
        return __awaiter(this, void 0, void 0, function* () {
            // add config file to tree
            if (conf.fileName === 'config/profile_base.conf') {
                // if default profile base, pass on parsing
                logger_1.default.info(`${conf.fileName}: default profile base file, stashing for later`);
                this.defaultProfileBase = conf;
                return;
            }
            this.emit('parseFile', conf.fileName);
            conf.content = conf.content.replace(/\r\n/g, '\n');
            this.configFiles.push(conf);
            if (this.rx) {
                // have an RX tree already so asyncronously test the file version matches
                this.setTmosVersion(conf);
            }
            else {
                // no RX tree set yet, so wait for this to finish
                yield this.setTmosVersion(conf);
            }
            yield this.parentTmosObjects(conf)
                .then(configArry => {
                // add object count to stats
                this.stats.objectCount = this.stats.objectCount + configArry.length;
                configArry.forEach((el, index) => {
                    // create parsing details obj for emitter
                    const parsingObj = {
                        parsing: conf.fileName,
                        num: index + 1,
                        of: configArry.length // total # of objs
                    };
                    this.emit('parseObject', parsingObj);
                    // extract object name from body
                    const name = el.match(this.rx.parentNameValue);
                    if (name && name[2]) {
                        // split extracted name element by spaces
                        const names = name[1].split(' ');
                        // create new nested objects with each of the names, assigning value on inner-most
                        const newObj = objects_1.nestedObjValue(names, name[2]);
                        this.configObject = objects_2.deepMergeObj(this.configObject, newObj);
                    }
                    else {
                        logger_1.default.error('Detected parent object, but does not have all necessary regex elements to get processed ->', el);
                    }
                });
            });
        });
    }
    parseXmlStats(file) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit('parseFile', file.fileName);
            // was parsing all files for ALL stats, but it ends up being 100sMb of data
            // so, just getting some interesting stuff for now
            if (file.fileName === 'mcp_module.xml') {
                yield xml2js_1.parseStringPromise(file.content)
                    .then(out => {
                    this.deviceXmlStats[file.fileName] = out;
                });
            }
        });
    }
    parseExtras(files) {
        return __awaiter(this, void 0, void 0, function* () {
            // take in list of files (non-conf)
            files.map(file => {
                this.emit('parseFile', file.fileName);
                if (file.fileName.includes('license')) {
                    this.license = file;
                }
                if (file.fileName.includes('/filestore/')) {
                    this.fileStore.push(file);
                    // todo: figure out what kind of file this is and put the contents into the main config tree
                }
            });
            return;
        });
    }
    parentTmosObjects(conf) {
        return __awaiter(this, void 0, void 0, function* () {
            const x = [];
            try {
                // try to parse the config into an array
                x.push(...conf.content.match(this.rx.parentObjects));
            }
            catch (e) {
                logger_1.default.error(`failed to extract any parent tmos matches from ${conf.fileName} - might be a scripts file...`);
                return [];
            }
            return x;
        });
    }
    /**
     * parses config file for tmos version, sets tmos version specific regex tree used to parse applications
     * @param x config-file object
     */
    setTmosVersion(x) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.rx) {
                // rex tree already assigned, lets confirm subsequent file tmos version match
                if (this.tmosVersion === this.getTMOSversion(x.content, this.rx.tmosVersion)) {
                    // do nothing, current file version matches existing files tmos verion
                }
                else {
                    const err = `Parsing [${x.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`;
                    logger_1.default.error(err);
                    // throw new Error(err);
                }
            }
            else {
                // first time through - build everything
                const rex = new regex_1.RegExTree(); // instantiate regex tree
                this.tmosVersion = this.getTMOSversion(x.content, rex.tmosVersionReg); // get tmos version
                logger_1.default.info(`Recieved .conf file of version: ${this.tmosVersion}`);
                // assign regex tree for particular version
                this.rx = rex.get(this.tmosVersion);
            }
        });
    }
    /**
     * load .conf file or files from ucs/qkview
     *
     * @param config array of configs as strings
     */
    load(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = process.hrtime.bigint();
            // capture incoming file type
            this.inputFileType = path_1.default.parse(file).ext;
            return yield unPacker_1.unPacker(file)
                .then(files => {
                this.configFiles = files;
                // run through files and add up file size
                this.stats.configBytes = this.configFiles.map(item => item.size).reduce((total, each) => {
                    return total += each;
                });
                this.stats.loadTime = Number(process.hrtime.bigint() - startTime) / 1000000;
                // unPacker returned something so respond with processing time
                return this.stats.loadTime;
            });
        });
    }
    /**
     * new parsing fuction to work on list of files from unPacker
     * - original syncrounous version that takes the list of config files
     */
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = process.hrtime.bigint();
            logger_1.default.debug('Begining to parse configs');
            this.configFiles.forEach((el, index) => {
                /**
                 * for each file
                 * 1. get tmos version
                 * 2. extract parent objects to array
                 * 3. convert array to main obj
                 */
                // create parsing details obj for emitter
                const parsingFile = {
                    parsing: el.fileName,
                    num: index + 1,
                    of: this.configFiles.length // total # of files
                };
                this.emit('parseFile', parsingFile);
                if (/\r\n/.test(el.content)) {
                    el.content = el.content.replace(/\r\n/g, '\n');
                }
                if (this.rx) {
                    // rex tree already assigned, lets confirm subsequent file tmos version match
                    if (this.tmosVersion === this.getTMOSversion(el.content, this.rx.tmosVersion)) {
                        // do nothing, current file version matches existing files tmos verion
                    }
                    else {
                        const err = `Parsing [${el.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`;
                        logger_1.default.error(err);
                        // throw new Error(err);
                    }
                }
                else {
                    // first time through - build everything
                    const rex = new regex_1.RegExTree(); // instantiate regex tree
                    this.tmosVersion = this.getTMOSversion(el.content, rex.tmosVersionReg); // get tmos version
                    logger_1.default.info(`Recieved .conf file of version: ${this.tmosVersion}`);
                    // assign regex tree for particular version
                    this.rx = rex.get(this.tmosVersion);
                }
                let configArray = [];
                try {
                    // try to parse the config into an array
                    //  this is probably the heaviest processing line in the entire app
                    //     - aside from unpacking/searching the ucs/qkviews, which can be done in other ways
                    // I have ideas on how we can create a better parser that would stream in the config, line by line, detect object chunks, pull them off and push them to an array
                    configArray = [...el.content.match(this.rx.parentObjects)];
                }
                catch (e) {
                    logger_1.default.error('failed to extract any parent matches from file - might be a scripts file...');
                }
                if (configArray) {
                    // get number of lines in config
                    // this seems to be fairly accurate when compareing config lines from other tools
                    // const objectCount = configArray.length;
                    // logger.debug(`detected ${this.stats.objectCount} parent objects in this file`)
                    // add object count to main stats
                    this.stats.objectCount += configArray.length;
                    logger_1.default.debug(`creating more detailed arrays/objects for deeper inspection`);
                    configArray.forEach((el, index) => {
                        // extract object name from body
                        const name = el.match(this.rx.parentNameValue);
                        if (name && name[2]) {
                            // create parsing details obj for emitter
                            const parsingObj = {
                                parsing: name[1],
                                num: index + 1,
                                of: configArray.length // total # of objs
                            };
                            this.emit('parseObject', parsingObj);
                            // split extracted name element by spaces
                            const names = name[1].split(' ');
                            // create new nested objects with each of the names, assigning value on inner-most
                            const newObj = objects_1.nestedObjValue(names, name[2]);
                            this.configObject = objects_2.deepMergeObj(this.configObject, newObj);
                        }
                        else {
                            logger_1.default.error('Detected parent object, but does not have all necessary regex elements to get processed ->', el);
                        }
                    });
                }
            });
            // get ltm object counts
            this.stats.objects = objCounter_1.countObjects(this.configObject);
            // assign souceTmosVersion to stats object also
            this.stats.sourceTmosVersion = this.tmosVersion;
            // get hostname to show in vscode extension view
            this.hostname = digConfigs_1.getHostname(this.configObject);
            // end processing time, convert microseconds to miliseconds
            this.stats.parseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
            return this.stats.parseTime;
        });
    }
    /**
     * return list of applications
     *
     * @return array of app names
     * @example ['/Common/app1_80t_vs', '/tenant1/app4_t443_vs']
     */
    appList() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            return Object.keys((_a = this.configObject.ltm) === null || _a === void 0 ? void 0 : _a.virtual);
        });
    }
    /**
     * returns all details from processing
     *
     * -
     */
    // todo: type the return object for explode and remove the followin disable line
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    explode() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // if config has not been parsed yet...
            if (!((_a = this.configObject.ltm) === null || _a === void 0 ? void 0 : _a.virtual)) {
                yield this.parse(); // parse config files
            }
            const apps = yield this.apps(); // extract apps before parse timer...
            const startTime = process.hrtime.bigint(); // start pack timer
            // collect base information like vlans/IPs
            const base = yield digConfigs_1.digBaseConfig(this.configObject);
            // build return object
            const retObj = {
                id: uuid_1.v4(),
                dateTime: new Date(),
                hostname: this.hostname,
                inputFileType: this.inputFileType,
                config: {
                    sources: this.configFiles,
                    apps,
                    base
                },
                stats: this.stats,
                logs: yield this.logs() // get all the processing logs
            };
            if (this.fileStore.length > 0) {
                retObj['fileStore'] = this.fileStore;
            }
            // capture pack time
            this.stats.packTime = Number(process.hrtime.bigint() - startTime) / 1000000;
            return retObj;
        });
    }
    /**
     * Get processing logs
     */
    logs() {
        return __awaiter(this, void 0, void 0, function* () {
            return logger_1.default.getLogs();
        });
    }
    /**
     * extracts app(s)
     * @param app single app string
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    apps(app) {
        return __awaiter(this, void 0, void 0, function* () {
            /**
             * todo:  add support for app array to return multiple specific apps at same time.
             */
            const startTime = process.hrtime.bigint();
            if (app) {
                // extract single app config
                const value = this.configObject.ltm.virtual[app];
                this.emit('extractApp', {
                    app,
                    time: Number(process.hrtime.bigint() - startTime) / 1000000
                });
                if (value) {
                    // dig config, then stop timmer, then return config...
                    const x = [yield digConfigs_1.digVsConfig(app, value, this.configObject, this.rx)];
                    this.stats.appTime = Number(process.hrtime.bigint() - startTime) / 1000000;
                    return x;
                }
            }
            else {
                // means we didn't get an app name, so try to dig all apps...
                const apps = [];
                const i = this.configObject.ltm.virtual;
                for (const [key, value] of Object.entries(i)) {
                    // event about extracted app
                    this.emit('extractApp', {
                        app: key,
                        time: Number(process.hrtime.bigint() - startTime) / 1000000
                    });
                    // dig config, but catch errors
                    yield digConfigs_1.digVsConfig(key, value, this.configObject, this.rx)
                        .then(vsConfig => {
                        apps.push({ name: key, configs: vsConfig.config, map: vsConfig.map });
                    })
                        .catch(err => {
                        apps.push({ name: key, configs: err, map: '' });
                    });
                }
                this.stats.appTime = Number(process.hrtime.bigint() - startTime) / 1000000;
                return apps;
            }
        });
    }
    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    getTMOSversion(config, regex) {
        const version = config.match(regex);
        if (version) {
            //found tmos version
            return version[1];
        }
        else {
            const msg = 'tmos version not detected -> meaning this probably is not a bigip.conf';
            logger_1.default.error(msg);
            // throw new Error(msg)
        }
    }
}
exports.default = BigipConfig;
//# sourceMappingURL=ltm.js.map