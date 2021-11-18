import { BigipConfObj } from './models';
/**
 * dig DO config information like vlans/SelfIPs/system-settings/...
 * @param configTree bigip config as json tree
 * @returns raw config objects
 */
export declare function digDoConfig(configTree: BigipConfObj): string[];
