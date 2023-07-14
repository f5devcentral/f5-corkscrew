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
exports.archiveMake = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tar_1 = __importDefault(require("tar"));
const glob_1 = require("glob");
const child_process_1 = require("child_process");
// todo:     loop through all the files and update the tmos version at the top
//      this is mainly necessary if someone copy and pastes and entire config file with new features
//      --  maybe this is a good test case?
/**
 * generate f5 archive for testing this project
 * the file returned is .tar.gz but it should look like a .ucs file
 * --- this structure should be sufficient for .qkview file structures also, but we can have this function modify to be qkview as needed
 *
 * Add and necessary files/apps/configs to the archive directory to be included in the testing
 *
 * Will probably just call this function at the beginning of each test for now
 *
 * mini = .tar.gz
 *
 * @type (optional) ucs|qkview|conf|mini -> returns path to the requested conf/archive type (mini->default)
 * @returns
 */
function archiveMake(type = 'mini') {
    return __awaiter(this, void 0, void 0, function* () {
        // for testing we are just going to use tar.gz like a mini_ucs, but this process should also work for UCS and QKVIEWs
        // https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
        // https://github.com/isaacs/node-glob
        // https://github.com/isaacs/node-tar
        // https://gist.github.com/isaacs/0a05e95b930cc3962fa727e3c02d7161
        // look at using node-tar axtract to simplify the main parseAsync function currently filtering and streaming out the files we want from the archive
        const filesInArchive = [];
        const baseArchiveName = 'f5_corkscrew_test';
        let fileExt = 'tar.gz'; // default file extension/type
        const cwd = process.cwd(); // just to confirm our current working director
        let gzip = true;
        // let filter = (path, stat) => true;  // allow everything -> no filter
        const baseArchiveDir = path_1.default.join(__dirname, 'archive1');
        const qkviewDir = path_1.default.join(__dirname, 'qkview');
        // start building the list of filePaths to include in the archive
        // config dir should always be in the archive
        let filesPaths = (0, glob_1.globSync)('config/*', { cwd: baseArchiveDir });
        if (type === 'conf') {
            // single conf file, copy the conf file to artifacts and return the path
            const srcConf = path_1.default.join(baseArchiveDir, 'config', 'bigip.conf');
            const destFolder = path_1.default.join(__dirname, '..', 'artifacts', `${baseArchiveName}.conf`);
            fs_1.default.copyFileSync(srcConf, destFolder);
            return destFolder;
        }
        /**
         * files unique to qkviews
         */
        const qkviewFiles = [
            'config/low_profile_base.conf',
            'config/profile_base.conf',
            'config/mcp_module.xml'
        ];
        if (type === 'ucs') {
            fileExt = 'ucs';
            // filter out qkview specific files
            filesPaths = filesPaths.filter(x => !qkviewFiles.includes(x));
        }
        else if (type === 'qkview') {
            fileExt = 'qkview';
            filesPaths.push(...(0, glob_1.globSync)('*.xml', { cwd: baseArchiveDir }));
        }
        // build the file output path/name
        const archiveName = `${baseArchiveName}.${fileExt}`;
        const testArchiveOut = path_1.default.join(__dirname, '..', 'artifacts', archiveName);
        const d1 = fs_1.default.readdirSync(baseArchiveDir);
        //this method has the potential to be quicker and easier method for managing tar files...
        yield tar_1.default.create({
            cwd: baseArchiveDir,
            file: testArchiveOut,
            gzip
        }, filesPaths);
        // this is how it was working with native tar command
        // const cmd = [
        //     'tar',
        //     '-czf',
        //     testArchiveOut,
        //     '-C',
        //     archiveDir,
        //     '../README.md',
        //     'config/',
        //     'monitors/',
        //     'ssl/'
        // ].join(' ')
        // execSync(cmd)
        // how to list the archive contents from the command line, to match with example above
        const l1 = (0, child_process_1.execSync)(`tar -ztvf ${testArchiveOut}`).toString();
        // this is here to be able to look at the array and confirm the necessary files are in there.
        yield tar_1.default.t({
            file: testArchiveOut,
            onentry: entry => {
                filesInArchive.push(entry.path);
            }
        });
        return testArchiveOut;
    });
}
exports.archiveMake = archiveMake;
//# sourceMappingURL=archiveBuilder.js.map