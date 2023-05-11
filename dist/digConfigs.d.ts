import { BigipConfObj, TmosApp } from './models';
import { RegExTree } from './regex';
/**
 * scans vs config, and discovers child configs
 * @param vsName virtual server name
 * @param vsConfig virtual server tmos config body
 */
export declare function digVsConfig(vsName: string, vsConfig: BigipConfObj["ltm"]['virtual']['key'], configTree: BigipConfObj, rx: RegExTree): Promise<TmosApp>;
/**
 * removes duplicates
 * @param x list of strings
 * @return list of unique strings
 */
export declare function uniqueList(x: string[]): string[];
/**
 * get hostname from json config tree (if present)
 * @param configObject to search for hostname
 */
export declare function getHostname(configObject: BigipConfObj): string;
