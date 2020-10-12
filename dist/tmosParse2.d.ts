/// <reference types="node" />
import { EventEmitter } from 'events';
import { ConfigFiles } from './unPacker';
export declare class Parser extends EventEmitter {
    objectCount: number;
    tmosVersion: string;
    rx: any;
    configObject: unknown;
    parseTime: number;
    constructor();
    loadParse(files: ConfigFiles): {
        parseTime: number;
        objectCount: number;
        objects: import("./models").ObjStats;
        configObject: unknown;
    };
    /**
     * new parsing function to extract from main ltm class and add events for progress
     *
     * This is the latest work as of 10.11.2020
     */
    private parse;
}
