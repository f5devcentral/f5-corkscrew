/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const events_1 = require("events");
const logger_1 = __importDefault(require("./logger"));
const objCounter_1 = require("./objCounter");
const regex_1 = require("./regex");
const objects_1 = require("./utils/objects");
class Parser extends events_1.EventEmitter {
    constructor() {
        super();
    }
    loadParse(files) {
        return this.parse(files);
    }
    /**
     * new parsing function to extract from main ltm class and add events for progress
     *
     * This is the latest work as of 10.11.2020
     */
    parse(files) {
        const startTime = process.hrtime.bigint();
        logger_1.default.debug('Begining to parse configs');
        let objectCount = 0;
        this.emit('parseStart', 'starting to parse stuff');
        files.forEach((el, index) => {
            //  for each file
            //  1. get tmos version
            //  2. extract parent objects to array
            //  3. convert array to main obj
            // create parsing details obj for emitter
            const parsing = {
                parsing: el.fileName,
                num: index + 1,
                of: files.length // total # of files
            };
            this.emit('parseFile', parsing);
            if (this.rx) {
                // rex tree already assigned, lets confirm subsequent file tmos version match
                if (this.tmosVersion === getTMOSversion(el.content, this.rx.tmosVersion)) {
                    // do nothing, current file version matches existing files tmos verion
                }
                else {
                    logger_1.default.error(`Parsing [${el.fileName}], tmos version of this file does not match previous file [${this.tmosVersion}]`);
                    return;
                }
            }
            else {
                // first time through - get initial rex tree
                const rex = new regex_1.RegExTree(); // instantiate regex tree
                this.tmosVersion = getTMOSversion(el.content, rex.tmosVersionReg); // get tmos version
                logger_1.default.info(`Recieved .conf file of version: ${this.tmosVersion}`);
                // assign regex tree for particular version
                this.rx = rex.get(this.tmosVersion);
            }
            let configArray = [];
            try {
                // try to parse the config into an array
                configArray = [...el.content.match(this.rx.parentObjects)];
            }
            catch (e) {
                logger_1.default.error('failed to extract any parent matches from file - might be a scripts/iapps file...');
            }
            // if we parsed a config file that produced parent objects
            if (configArray) {
                // get number of config objects
                const lines = configArray.length;
                logger_1.default.debug(`detected ${lines} parent objects in this file`);
                // add to main stats
                objectCount += lines;
                logger_1.default.debug(`creating more detailed arrays/objects for deeper inspection`);
                configArray.forEach(el => {
                    // emit events about each object being parsed
                    // extract object name from body
                    const name = el.match(this.rx.parentNameValue);
                    if (name && name.length === 3) {
                        // split extracted name element by spaces
                        const names = name[1].split(' ');
                        // create new nested objects with each of the names, assigning value on inner-most
                        const newObj = (0, objects_1.nestedObjValue)(names, name[2]);
                        this.configObject = (0, objects_1.deepMergeObj)(this.configObject, newObj);
                    }
                });
            }
        });
        // get ltm object counts
        const objects = (0, objCounter_1.countObjects)(this.configObject);
        // end processing time, convert microseconds to miliseconds
        const parseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        this.emit('parseEnd', `we done finished, took ${this.parseTime}ms`);
        return {
            parseTime,
            objectCount,
            objects,
            configObject: this.configObject
        };
    }
}
exports.Parser = Parser;
/**
 * extract tmos config version from first line
 * ex.  #TMSH-VERSION: 15.1.0.4
 * @param config bigip.conf config file as string
 */
function getTMOSversion(config, regex) {
    const version = config.match(regex);
    if (version) {
        //found tmos version
        return version[1];
    }
    else {
        const msg = 'tmos version not detected -> meaning this probably is not a bigip.conf';
        logger_1.default.error(msg);
        throw new Error(msg);
    }
}
//# sourceMappingURL=tmosParse2.js.map