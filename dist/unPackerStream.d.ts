/// <reference types="node" />
import { EventEmitter } from "events";
import { ConfigFile } from "./models";
/**
 * async method for extracting config files from archives
 * - .conf files are emited as "conf" events
 * - all other config files are return at promise resolution
 *
 */
export declare class UnPacker extends EventEmitter {
    constructor();
    /**
     * extracts needed config files from archive
     *  - .conf files are emited as events during extraction so they can be parsed asyncronously
     *  - all other files returned at end in promise completion to be added to the conf tree
     * @param input path/file to .conf|.ucs|.qkview|.gz
     */
    stream(input: string): Promise<{
        files: ConfigFile[];
        size: number;
    }>;
}
/**
 * filters files we want
 * @param file name as string
 * @param boolean if file match -> return (pass filter)
 */
export declare function fileFilter(name: string): boolean;
