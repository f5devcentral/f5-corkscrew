/// <reference types="node" />
import { EventEmitter } from 'events';
import { RegExTree } from './regex';
import { BigipConfObj, ConfigFile, Explosion, Stats, xmlStats } from './models';
/**
 * Class to consume bigip configs -> parse apps
 *
 */
export default class BigipConfig extends EventEmitter {
    /**
     * incoming config files array
     * ex. [{filename:'config/bigip.conf',size:12345,content:'...'},{...}]
     */
    configFiles: ConfigFile[];
    /**
     * tmos config as nested json objects
     * - consolidated parant object keys like ltm/apm/sys/...
     */
    configObject: BigipConfObj;
    /**
     * tmos version of the config file
     */
    tmosVersion: string | undefined;
    /**
     * hostname of the source device
     */
    hostname: string | undefined;
    /**
     * input file type (.conf/.ucs/.qkview/.tar.gz)
     */
    inputFileType: string;
    /**
     * tmos version specific regex tree for abstracting applications
     */
    rx: RegExTree | undefined;
    /**
     * corkscrew processing stats object
     */
    stats: Stats;
    /**
     * stats information extracted from qkview xml files
     */
    deviceXmlStats: xmlStats;
    /**
     * default profile settings
     */
    defaultProfileBase: ConfigFile;
    /**
     * default low (system) profile settings
     */
    defaultLowProfileBase: ConfigFile;
    /**
     * bigip license file
     */
    license: ConfigFile;
    /**
     * tmos file store files, which include certs/keys/external_monitors/...
     */
    fileStore: ConfigFile[];
    constructor();
    /**
     *
     * @param file bigip .conf/ucs/qkview/mini_ucs.tar.gz
     */
    loadParseAsync(file: string): Promise<number>;
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
    digGslb(fqdn?: string): Promise<any[]>;
    /**
     * extracts ltm app(s)
     * @param app single app string
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    apps(app?: string): Promise<any[]>;
}
