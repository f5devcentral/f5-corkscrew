import { BigipConfObj, BigipObj } from './models';
/**
 * Class to consume bigip.conf
 *
 */
export declare class BigipConfig {
    bigipConf: string;
    /**
     * simple array of each bigip.conf parent object
     * (ex. "[ltm node /Common/192.168.1.20 { address 192.168.1.20 }, ...]")
     */
    configAsSingleLevelArray: string[];
    /**
     * object form of bigip.conf
     *  key = full object name, value = body
     * *** this one doesn't seem to be useful at all...
     */
    configSingleLevelObjects: BigipObj;
    /**
     *  tmos configuration as a single level object
     * ex. [{name: 'parent object  name', config: 'parent config obj body'}]
     */
    configArrayOfSingleLevelObjects: any[];
    /**
     * tmos config as nested json objects
     * - consolidated parant object keys like ltm/apm/sys/...
     */
    configMultiLevelObjects: BigipConfObj;
    configFullObject: BigipConfObj;
    tmosVersion: string;
    private rx;
    /**
     *
     * @param config full bigip.conf as string
     */
    constructor(config: string);
    /**
     * Get processing logs
     */
    logs(): string;
    /**
     * parse bigip.conf into parent objects
     * @param config bigip.conf as string
     */
    private parse;
    private parse2;
    /**
     * extracts individual apps
     * @return [{ name: <appName>, config: <appConfig>, map: <appMap> }]
     */
    apps(): any[];
    /**
     * extract tmos config version from first line
     * ex.  #TMSH-VERSION: 15.1.0.4
     * @param config bigip.conf config file as string
     */
    private getTMOSversion;
    /**
     * scans vs config, and discovers child configs
     * @param vsName virtual server name
     * @param vsConfig virtual server tmos config body
     */
    private getVsConfig;
    /**
     * analyzes vs snat config, returns full snat configuration if pool reference
     * @param snat vs snat reference as string
     */
    private digSnatConfig;
    /**
     * get fall back persistence config
     * @param fbPersist vs fallback-persistence
     */
    private digFbPersistConfig;
    /**
     * get persistence config
     * @param persistence vs persistence referecne
     */
    private digPersistConfig;
    /**
     * get full pool config and supporting node/monitor configs
     * @param poolName
     */
    private digPoolConfig;
    private digProfileConfigs;
    /**
     *
     * @param rulesList raw irules regex from vs dig
     */
    private digRuleConfigs;
    /**
     * loops through vs ltp list and returns full ltp configs
     * @param ltPolicys vs ltp config
     */
    private digLtPolicyConfig;
}
/**
 * Reverse string
 * @param str string to reverse
 */
