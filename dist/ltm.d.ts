/// <reference types="node" />
import { EventEmitter } from 'events';
import { BigipConfObj, ConfigFile, Explosion, xmlStats } from './models';
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
    hostname: string | undefined;
    inputFileType: string;
    private rx;
    private stats;
    deviceXmlStats: xmlStats;
    defaultProfileBase: ConfigFile;
    license: ConfigFile;
    fileStore: ConfigFile[];
    constructor();
    /**
     *
     * @param file bigip .conf/ucs/qkview/mini_ucs.tar.gz
     */
    loadParseAsync(file: string): Promise<void>;
    /**
     * async parsing of config files
     */
    parseConf(conf: ConfigFile): Promise<void>;
    parseXmlStats(file: ConfigFile): Promise<void>;
    parseExtras(files: ConfigFile[]): Promise<void>;
    parentTmosObjects(conf: ConfigFile): Promise<string[]>;
    /**
     * parses config file for tmos version, sets tmos version specific regex tree used to parse applications
     * @param x config-file object
     */
    setTmosVersion(x: ConfigFile): Promise<void>;
    /**
     * load .conf file or files from ucs/qkview
     *
     * @param config array of configs as strings
     */
    load(file: string): Promise<number>;
    /**
     * new parsing fuction to work on list of files from unPacker
     * - original syncrounous version that takes the list of config files
     */
    parse(): Promise<number>;
    /**
     * return list of applications
     *
     * @return array of app names
     * @example ['/Common/app1_80t_vs', '/tenant1/app4_t443_vs']
     */
    appList(): Promise<string[]>;
    /**
     * returns all details from processing
     *
     * -
     */
    explode(): Promise<Explosion>;
    /**
     * Get processing logs
     */
    logs(): Promise<string[]>;
    /**
     * extracts app(s)
     * @param app single app string
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    apps(app?: string): Promise<any[]>;
    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    private getTMOSversion;
}
