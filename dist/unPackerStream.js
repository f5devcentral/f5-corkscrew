/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.fileFilter = exports.UnPacker = void 0;
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const logger_1 = __importDefault(require("./logger"));
const zlib_1 = __importDefault(require("zlib"));
const tar_stream_1 = __importDefault(require("tar-stream"));
const events_1 = require("events");
const regex_1 = require("./regex");
/**
 * async method for extracting config files from archives
 * - .conf files are emited as "conf" events
 * - all other config files are return at promise resolution
 *
 */
class UnPacker extends events_1.EventEmitter {
    constructor() {
        super();
    }
    /**
     * extracts needed config files from archive
     *  - .conf files are emited as events during extraction so they can be parsed asyncronously
     *  - all other files returned at end in promise completion to be added to the conf tree
     * @param input path/file to .conf|.ucs|.qkview|.gz
     */
    stream(input) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const filePath = path_1.default.parse(input);
            /**
             * what kind of file we workin with?
             */
            if (filePath.ext === '.conf') {
                try {
                    // get file size
                    const size = fs.statSync(path_1.default.join(filePath.dir, filePath.base)).size;
                    // try to read file contents
                    const content = fs.readFileSync(path_1.default.join(filePath.dir, filePath.base), 'utf-8');
                    logger_1.default.debug(`got .conf file [${input}], size [${size}]`);
                    this.emit('conf', { fileName: filePath.base, size, content });
                    // don't return anything here, since the conf file got sent via event
                    return;
                }
                catch (e) {
                    logger_1.default.error('not able to read file', e.message);
                    throw new Error(`not able to read file => ${e.message}`);
                }
            }
            else if (filePath.ext === '.gz' || filePath.ext === '.ucs' || filePath.ext === '.qkview') {
                const size = fs.statSync(path_1.default.join(filePath.dir, filePath.base)).size;
                logger_1.default.debug(`detected file: [${input}], size: [${size}]`);
                const extract = tar_stream_1.default.extract();
                const files = [];
                return new Promise((resolve, reject) => {
                    extract.on('entry', (header, stream, next) => {
                        let captureFile = false;
                        const contentBuffer = [];
                        // detect the files we want and set capture flag
                        if (fileFilter(header.name) && header.type === 'file') {
                            captureFile = true;
                        }
                        else {
                            // not the file we want, so call the next entry
                            next();
                        }
                        stream.on('data', (chunk) => {
                            // if this is a file we want, buffer it's content
                            if (captureFile) {
                                contentBuffer.push(chunk);
                            }
                        });
                        stream.on('end', () => {
                            if (captureFile) {
                                if (header.name.endsWith('.conf')) {
                                    // emit conf files
                                    this.emit('conf', {
                                        fileName: header.name,
                                        size: header.size,
                                        content: contentBuffer.join('')
                                    });
                                }
                                else if (header.name.endsWith('.xml')) {
                                    // emit .xml stats files
                                    this.emit('stat', {
                                        fileName: header.name,
                                        size: header.size,
                                        content: contentBuffer.join('')
                                    });
                                }
                                else {
                                    // buffer all other files to be returned when complete
                                    files.push({
                                        fileName: header.name,
                                        size: header.size,
                                        content: contentBuffer.join('')
                                    });
                                }
                            }
                            next();
                        });
                        stream.resume();
                    });
                    extract.on('finish', () => {
                        // we finished processing, .conf file should have been emited as events, so now resolve the promise with all the other config files
                        return resolve({
                            files,
                            size
                        });
                    });
                    extract.on('error', err => {
                        return reject(err);
                    });
                    fs.createReadStream(input)
                        .pipe(zlib_1.default.createGunzip())
                        .pipe(extract);
                });
            }
            else {
                const msg = `file type of "${filePath.ext}", not supported, try (.conf|.ucs|.kqview|.gz)`;
                logger_1.default.error(msg);
                throw new Error(`not able to read file => ${msg}`);
            }
        });
    }
}
exports.UnPacker = UnPacker;
/**
 * filters files we want
 * @param file name as string
 * @param boolean if file match -> return (pass filter)
 */
function fileFilter(name) {
    /**
     * breakind down this bigger regex for explaination
     * added to list of regex's below
     */
    const allConfs = (0, regex_1.multilineRegExp)([
        // base /config directory
        /^config/,
        // optional /partitions directory including /partition name directory
        /(?:\/partitions\/[\w-]+?)?/,
        // any bigip*.conf file
        /\/bigip(?:[\w-]*).conf$/
    ], undefined);
    /**
     * qkviews do NOT includes private keys
     */
    const fileStoreFilesQkview = (0, regex_1.multilineRegExp)([
        // base directory
        /^config\/filestore\/files_d/,
        // /partition folder
        /\/[\w]+?/,
        // all directories excluding "epsec_pacakage_d" or "datasync_update_file_d"
        /\/(?!epsec_package_d|datasync_update_file_d)[\w]+?/,
        // any file/suffix
        /\/.+?$/
    ], undefined);
    /**
     * UCS private keys unless excluded at generation
     */
    const fileStoreFilesUcs = (0, regex_1.multilineRegExp)([
        // base directory
        /^var\/tmp\/filestore_temp\/files_d/,
        // /partition folder
        /\/[\w]+?/,
        // all directories excluding "epsec_pacakage_d" or "datasync_update_file_d"
        /\/(?!epsec_package_d|datasync_update_file_d)[\w]+?/,
        // any file/suffix
        /\/.+?$/
    ], undefined);
    /**
     * list of RegEx's to find the files we need
     *
     * only one has to pass to return true
     */
    const fileRegexs = [
        allConfs,
        /^config\/bigip.license$/,
        /^config\/profile_base.conf$/,
        /^config\/low_profile_base.conf$/,
        fileStoreFilesUcs,
        fileStoreFilesQkview,
        /^\w+.xml$/ // qkview stats files
    ];
    return fileRegexs.some(rx => rx.test(name));
}
exports.fileFilter = fileFilter;
//# sourceMappingURL=unPackerStream.js.map