import { AppMap, BigipConfObj } from './models';
import { TmosRegExTree } from './regex';
/**
 * dig base config information like vlans/SelfIPs
 * @param configTree bigip config as json tree
 * @returns raw config objects
 */
export declare function digBaseConfig(configTree: BigipConfObj): string;
/**
 * scans vs config, and discovers child configs
 * @param vsName virtual server name
 * @param vsConfig virtual server tmos config body
 */
export declare function digVsConfig(vsName: string, vsConfig: string, configTree: BigipConfObj, rx: TmosRegExTree): {
    config: string;
    map: AppMap;
};
/**
 * removes duplicates
 * @param x list of strings
 * @return list of unique strings
 */
export declare function uniqueList(x: string[]): string[];
