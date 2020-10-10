"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.unPacker = void 0;
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const logger_1 = __importDefault(require("./logger"));
const decompress_1 = __importDefault(require("decompress"));
/**
 * extracts needed config files from archive
 * @param input path/file to .conf|.ucs|.qkview|.gz
 */
function unPacker(input) {
    return __awaiter(this, void 0, void 0, function* () {
        // part input to usable pieces
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
                // const fileName  = path.join(filePath.base, filePath.ext);
                logger_1.default.debug(`got .conf file [${input}], size [${size}]`);
                return [{ fileName: filePath.base, size, content }];
            }
            catch (e) {
                logger_1.default.error('not able to read file', e.message);
                return;
                // Promise.reject(`not able to read file => ${e.message}`);
            }
        }
        else if (filePath.ext === '.gz' || filePath.ext === '.ucs' || filePath.ext === '.qkview') {
            try {
                const size = fs.statSync(path_1.default.join(filePath.dir, filePath.base)).size;
                logger_1.default.debug(`detected file: [${input}], size: [${size}]`);
            }
            catch (e) {
                logger_1.default.error(`file ${input}, is not readable: ${e.messge}`);
                return;
            }
            return yield decompress_1.default(input, {
                filter: file => archiveFileFilter(file)
            })
                .then(extracted => {
                return extracted.map(x => {
                    return { fileName: x.path, size: x.data.byteLength, content: x.data.toString() };
                });
            });
        }
        else {
            const msg = `file type of "${filePath.ext}", not supported, try (.conf|.ucs|.kqview|.gz)`;
            logger_1.default.error(msg);
            // Promise.reject(new Error(msg));
            return;
        }
    });
}
exports.unPacker = unPacker;
/**
 * filter for decompress function that filters files we want
 * @param file decompress file output
 * @param boolean if file match -> return (pass filter)
 */
function archiveFileFilter(file) {
    /**
     * I'm sure this could be done waaay cleaner, but I figured this was a nice way
     *  to spell it out for others
     *
     * When these return true for the item passed in, it means the filter will return it
     *
     */
    if (/^config\/bigip.conf$/.test(file.path) && file.type === 'file') {
        return true;
    }
    if (/^config\/bigip_base.conf$/.test(file.path) && file.type === 'file') {
        return true;
    }
    if (/^config\/partitions\/.+?/.test(file.path) && file.type === 'file') {
        return true;
    }
}
//# sourceMappingURL=unPacker.js.map