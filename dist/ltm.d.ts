/// <reference types="node" />
import { EventEmitter } from 'events';
import { BigipConfObj, Explosion } from './models';
import { ConfigFiles } from './unPacker';
/**
 * Class to consume bigip configs -> parse apps
 *
 */
export default class BigipConfig extends EventEmitter {
    /**
     * incoming config files array
     * ex. [{filename:'config/bigip.conf',size:12345,content:'...'},{...}]
     */
    configFiles: ConfigFiles;
    /**
     * tmos config as nested json objects
     * - consolidated parant object keys like ltm/apm/sys/...
     */
    configObject: BigipConfObj;
    /**
     * placeholder for future fully jsonified tmos config
     */
    configFullObject: BigipConfObj;
    tmosVersion: string | undefined;
    private rx;
    private stats;
    constructor();
    /**
     * load .conf file or files from ucs/qkview
     *
     * @param config array of configs as strings
     */
    load(file: string): Promise<number>;
    /**
     * new parsing fuction to work on list of files from unPacker
     */
    parse(): number;
    /**
     * return list of applications
     *
     * @return array of app names
     * @example ['/Common/app1_80t_vs', '/tenant1/app4_t443_vs']
     */
    appList(): string[];
    /**
     * returns all details from processing
     *
     * -
     */
    explode(): Explosion;
    /**
     * Get processing logs
     */
    logs(): string;
    /**
     * extracts app(s)
     * @param app single app string
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    apps(app?: string): any[];
    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    private getTMOSversion;
}
