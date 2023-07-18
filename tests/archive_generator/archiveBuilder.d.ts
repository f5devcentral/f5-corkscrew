/// <reference types="node" />
import fs from 'fs';
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
export declare function archiveMake(type?: 'ucs' | 'qkview' | 'conf' | 'mini'): Promise<fs.PathLike | string>;
