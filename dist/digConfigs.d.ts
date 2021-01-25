import { AppMap, BigipConfObj } from './models';
import { TmosRegExTree } from './regex';
/**
 * dig base config information like vlans/SelfIPs
 * @param configTree bigip config as json tree
 * @returns raw config objects
 */
export declare function digBaseConfig(configTree: BigipConfObj): Promise<any[]>;
/**
 * scans vs config, and discovers child configs
 * @param vsName virtual server name
 * @param vsConfig virtual server tmos config body
 */
export declare function digVsConfig(vsName: string, vsConfig: string, configTree: BigipConfObj, rx: TmosRegExTree): Promise<{
    config: any[];
    map: AppMap;
}>;
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
