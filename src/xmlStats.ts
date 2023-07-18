/* eslint-disable @typescript-eslint/no-explicit-any */

import { XMLParser } from 'fast-xml-parser';

import logger from "./logger";
import { ConfigFile } from "./models";
import { deepmergeInto } from 'deepmerge-ts';



/**
 * breakdown qkview xml stats, convert to json and analyze key stats
 */
export default class XmlStats {
    xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        updateTag: (tagName: string, jPath: string, attrs) => {
            if (tagName === 'object' && attrs['name']) {
                return tagName = attrs['name'];
            }
        },
    });
    /**
     * line 1. xml header 
     * typically:  <?xml version="1.0" encoding="UTF-8"?>
     * this does not change
     */
    xmlHeaderRx = /^.+?$/m;
    /**
     * line 2. qkproc version
     * example: <Qkproc version="1.6">
     * key off this version if/when qkproc structure changes
     */
    qkProcVersionRx = /<Qkproc version="(?<version>[\d\.]+)">/;
    /**
     * list of stats to get from xml files
     *   - currenly only stat_module.xml + mcp_module.xml
     * 
     *  --- update the rx tree to mimic the file->stats structure, use this tree to get the stats we want
     *        so we can just update this tree to add files/stats in the future
     */
    rx = {
        'stat_module.xml': [
            'virtual_server_stat',      // general vs stats
            'virtual_server_cpu_stat',  // vs cpu stats
            'gtm_wideip_stat',          // gtm wideip stats
            'profile_clientssl_stat',
            'plane_cpu_stat',
            'rule_stat',
            'asm_cpu_util_stats',
            'asm_learning_suggestions_stats',
            'asm_enforced_entities_stats',
            'asm_memory_util_stats',
            'asm_policy_changes_stats',     // seems to only be related to policy builder
            'certificate_summary',
            'certificate_summary',
        ],
        'mcp_module.xml': [
            'profile_dns_stat',
            'gtm_wideip_stat',
            'rule_stat',
            'virtual_server_stat',
            'pool_stat',
            'pool_member_stat',
            'tmm_stat',
            'interface_stat',
            'global_host_info_stat',
            'asm_policy',
            'sys_device',
            'active_modules',
            'asm_policy_virtual_server',
            'asm_memory_util_stats',
            'asm_policy_changes_stats',
            'certificate_summary',
            'db_variable',
            'chassis'
        ]
    }
    /**
     * top N virtual servers to get stats for
     * 
     * set to 10000 to get all virtual servers with stats
     */
    topN = 20;
    weights = {
        vs: {
            pktsIn: 1,
            bytsIn: 1,
            pktsOut: 1,
            bytsOut: 1,
            maxConns: 1,
            totConns: 1,
            curConns: 1
        }
    }
    /**
     * main stats object
     */
    xmlStats: any = {
        stat: {},
        mcp: {}
    };
    /**
     * stats object for virtual servers
     */
    stats: any = {
        vs: {},
        gtm: {},
    };
    stat_gtm_wideip_stat: RegExpMatchArray;
    mcp_gtm_wideip_stat: RegExpMatchArray;

    // todo: add a weight system so different stats can be weighted differently
    // todo: add asm stats to understand which asm policies are the busiest
    // todo: find and add uptime and failover state/duration so we can explain how valid the stats might be

    constructor() {
        // welcome ;)
    }

    /**
     * Crunch the xml stats file pulling the stats defined in this.statsToGet
     *  Then parse the stats into json for further processing
     * 
     * @param file { fileName: string, size: number, content: string }
     *
     */
    async load(file: ConfigFile) {
        logger.info("crunching xml stats");
        // logger.info(`xml file name: ${file.fileName}`);
        // get the qkproc version
        const qkProcVersion = file.content.match(this.qkProcVersionRx)?.groups?.version;
        logger.info(`xml file name: ${file.fileName}; qkproc version: ${qkProcVersion}`);

        if (!qkProcVersion) {
            logger.error(`unable to determine qkproc version from file: ${file.fileName}; skipping xml parsing`);
            return;
        }

        if (file.fileName === 'stat_module.xml') {

            // loop through each stat and rx out the data we want
            this.rx['stat_module.xml'].forEach((stat) => {
                const rx = new RegExp(` *?<${stat}>\n[\\S\\s]+?\n +</${stat}>\n`, 'g');

                // for each match, parse the xml and merge with main stats object
                const matches = file.content.match(rx)

                // capture the gtm_wideip_stat stats
                if (stat === 'gtm_wideip_stat') {
                    this.stat_gtm_wideip_stat = matches;
                }

                matches?.forEach((match) => {
                    const parsed = this.xmlParser.parse(match);
                    if (parsed) {
                        // merge with main stats object in class
                        deepmergeInto(this.xmlStats.stat, parsed);
                    }

                });
            });
        }

        if (file.fileName === 'mcp_module.xml') {

            // loop through each stat and rx out the data we want
            this.rx['mcp_module.xml'].forEach((stat) => {
                const rx = new RegExp(` *?<${stat}>\n[\\S\\s]+?\n +</${stat}>\n`, 'g');


                // for each match, parse the xml and merge with main stats object
                const matches = file.content.match(rx)

                matches?.forEach((match) => {
                    const parsed = this.xmlParser.parse(match);
                    if (parsed) {

                        if (stat === 'global_host_info_stat' || stat === 'chassis') {

                            deepmergeInto(this.xmlStats.mcp, parsed)

                        } else if (stat === 'db_variable') {
                            const key = parsed[stat].name;
                            const value = parsed[stat].value;

                            // if we have a value
                            if (value !== '') {

                                // if the key is one we want to keep
                                if (
                                    key === 'hostname' ||
                                    key.startsWith('license') ||
                                    key.startsWith('failover') ||
                                    key.startsWith('dns') ||
                                    key.startsWith('ntp') ||
                                    key.startsWith('ui')
                                ) {

                                    // merge as regular object keys/values
                                    deepmergeInto(this.xmlStats.mcp, { [stat]: { [key]: value } })
                                }
                            }
                        } else {

                            // the rest of the stats are nested arrays of objects
                            if (!this.xmlStats.mcp[stat]) this.xmlStats.mcp[stat] = [];
                            this.xmlStats.mcp[stat].push(parsed[stat]);
                        }

                    }

                });
            });

        }

        return;
    }

    /**
     * processes the json stats from the converted xml files
     */
    async crunch() {
        // create promises array
        const promises = [];


        promises.push(this.topMcpVs()
            .catch((err) => {
                // catching errors here to keep the rest of the process from failing
                //  move catch logic higher up as things get more stable
                logger.error('f5-corkscrew/xmlStats/vsRank', err);
            }));

        promises.push(this.gslbStats()
            .catch((err) => {
                // catching errors here to keep the rest of the process from failing
                //  move catch logic higher up as things get more stable
                logger.error('f5-corkscrew/xmlStats/topGtmWips', err);
            }));

        promises.push(this.asmStats()
            .catch((err) => {
                // catching errors here to keep the rest of the process from failing
                //  move catch logic higher up as things get more stable
                logger.error('f5-corkscrew/xmlStats/asmStats', err);
            }));

        promises.push(this.ruleStats()
            .catch((err) => {
                // catching errors here to keep the rest of the process from failing
                //  move catch logic higher up as things get more stable
                logger.error('f5-corkscrew/xmlStats/ruleStats', err);
            }));

        // wait for all promises to resolve
        await Promise.all(promises);

        // count up all the stats
        this.stats.summary = {};
        if (this.stats.vs.rank.length) {
            this.stats.summary.vsRankTotal = this.stats.vs.rank.length;
        }
        if (this.stats.vs.zeroVs.length) {
            this.stats.summary.vsWithNoStats = this.stats.vs.zeroVs.length;
        }
        if (this.stats.gtm.wips.length) {
            this.stats.summary.wipsRankTotal = this.stats.gtm.wips.length;
        }

        if (this.stats.gtm.wips_no_stats.length) {
            this.stats.summary.wipsNoStats = this.stats.gtm.wips_no_stats.length;
        }
        if (this.stats.rule_stat.length) {
            this.stats.summary.rulesRankTotal = this.stats.rule_stat.length;
        }
        if (this.stats.rule_stat_none.length) {
            this.stats.summary.rulesWithNoStats = this.stats.rule_stat_none.length;
        }

        logger.info("all xml stats crunched");
        return this.stats;
    }

    async asmStats() {
        // todo: find a good way to idenify busy/top asm policies
    }

    async ruleStats() {
        // sort topN rules by total executions
        //  this will give us the topN rules that are being hit the most
        this.stats.rule_stat = this.xmlStats.mcp.rule_stat
            // filter out system rules
            .filter((rule: any) => !rule.name.startsWith('/Common/_sys'))
            // sort by total_executions
            .sort((a: any, b: any) => b.total_executions - a.total_executions)
            // filter out rules with no executions
            .filter((rule: any) => rule.total_executions > 0)
            // return only the topN
            .slice(0, this.topN);

        // collect rules with no executions
        this.stats.rule_stat_none = this.xmlStats.mcp.rule_stat
            // filter out system rules
            .filter((rule: any) => !rule.name.startsWith('/Common/_sys'))
            // filter out rules with executions
            .filter((rule: any) => rule.total_executions === 0)

    }

    /**
     * Get the topN gtm wideips by requests
     * source: stat_module.xml for now
     */
    async gslbStats() {

        // map gtm wideip type to string
        // order matters here, the order of the array is the order of the enum
        const enumGtmWipTypeA = [
            "A",
            "AAAA",
            "CNAME",
            "MX",
            "NAPTR",
            "NS",
            "PTR",
            "SOA",
            "SRV",
            "TXT",
            "ANY"
        ];

        // get topN gtm wideip names by requests 
        // (mcp_module.xml)
        this.stats.gtm.wips = this.xmlStats.mcp.gtm_wideip_stat
            .sort((a: any, b: any) => b.requests - a.requests)      // sort by requests
            .filter((x: { requests: number }) => x.requests > 0)    // filter out wideips with 0 requests
            .slice(0, this.topN)    // get topN
            .map((x: any) => {
                const name = x.wip_name.split('/').pop();
                return {
                    name,
                    requests: x.requests,
                    type: enumGtmWipTypeA[x.wip_type - 1],
                    resolutions: x.resolutions,
                    a_requests: x.a_requests,
                    aaaa_requests: x.aaaa_requests,
                    cname_resolutions: x.cname_resolutions,
                    dropped: x.dropped,
                    fallbacks: x.fallbacks,
                    persisted: x.persisted,
                };
            });    // map to name and requests details out of object

        // collect rules with no executions
        this.stats.gtm.wips_no_stats = this.xmlStats.mcp.gtm_wideip_stat
            // filter out gslbs with no requests
            .filter((x: any) => x.requests === 0)
    }

    /**
     * collects vs stats and ranks them by the topN
     * 
     * source: mcp_module.xml for now
     */
    private async topMcpVs() {

        // loop through each of the virtual servers stats and collect only the stats we want
        const mcpVsStats: VsStatsSlim[] = this.xmlStats.mcp.virtual_server_stat.map((vs: any) => {

            const clientsideStats = vs.traffic_stat
                .filter((x: any) => x.display === 'Clientside Traffic')[0];

            return {
                name: vs.name,
                pkts_in: clientsideStats.pkts_in,
                bytes_in: clientsideStats.bytes_in,
                pkts_out: clientsideStats.pkts_out,
                bytes_out: clientsideStats.bytes_out,
                max_conns: clientsideStats.max_conns,
                tot_conns: clientsideStats.tot_conns,
                cur_conns: clientsideStats.cur_conns
            }
        });

        // get the top 10 virtual servers for each of the stats we want

        this.stats.vs.topClientPktsIn = mcpVsStats
            .sort((a, b) => b.pkts_in - a.pkts_in)
            .filter((x) => x.pkts_in > 0)
            .slice(0, this.topN);

        this.stats.vs.topClientBytsIn = mcpVsStats
            .sort((a, b) => b.bytes_in - a.bytes_in)
            .filter((x) => x.bytes_in > 0)
            .slice(0, this.topN);

        this.stats.vs.topClientPktsOut = mcpVsStats
            .sort((a, b) => b.pkts_out - a.pkts_out)
            .filter((x) => x.pkts_out > 0)
            .slice(0, this.topN);

        this.stats.vs.topClientBytsOut = mcpVsStats
            .sort((a, b) => b.bytes_out - a.bytes_out)
            .filter((x) => x.bytes_out > 0)
            .slice(0, this.topN);

        this.stats.vs.topClientMaxConns = mcpVsStats
            .sort((a, b) => b.max_conns - a.max_conns)
            .filter((x) => x.max_conns > 0)
            .slice(0, this.topN);

        this.stats.vs.topClientTotConns = mcpVsStats
            .sort((a, b) => b.tot_conns - a.tot_conns)
            .filter((x) => x.tot_conns > 0)
            .slice(0, this.topN);

        this.stats.vs.topClientCurConns = mcpVsStats
            .sort((a, b) => b.cur_conns - a.cur_conns)
            .filter((x) => x.cur_conns > 0)
            .slice(0, this.topN);


        // list all the vs with zero stats
        this.stats.vs.zeroVs = mcpVsStats.filter((x) => {
            if (
                x.pkts_in === 0 &&
                x.bytes_in === 0 &&
                x.pkts_out === 0 &&
                x.bytes_out === 0 &&
                x.max_conns === 0 &&
                x.tot_conns === 0 &&
                x.cur_conns === 0
            ) {
                return true;
            }
        });


        // create a preRank array for each of the stats we want to rank
        const preRank = [];


        // loop through each of the stat collections and rank the virtual servers

        this.stats.vs.topClientPktsIn.forEach((vs, i) => {
            const score = (this.stats.vs.topClientPktsIn.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["pkts_in", score]
            });
        });

        this.stats.vs.topClientBytsIn.forEach((vs, i) => {
            const score = (this.stats.vs.topClientBytsIn.length - i) * this.weights.vs.bytsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["bytes_in", score]
            });
        });

        this.stats.vs.topClientPktsOut.forEach((vs, i) => {
            const score = (this.stats.vs.topClientPktsOut.length - i) * this.weights.vs.pktsOut;
            preRank.push({
                score,
                name: vs.name,
                why: ["pkts_out", score]
            });
        });

        this.stats.vs.topClientBytsOut.forEach((vs, i) => {
            const score = (this.stats.vs.topClientBytsOut.length - i) * this.weights.vs.bytsOut;
            preRank.push({
                score,
                name: vs.name,
                why: ["bytes_out", score]
            });
        });

        this.stats.vs.topClientMaxConns.forEach((vs, i) => {
            const score = (this.stats.vs.topClientMaxConns.length - i) * this.weights.vs.maxConns;
            preRank.push({
                score,
                name: vs.name,
                why: ["max_conns", score]
            });
        });

        this.stats.vs.topClientTotConns.forEach((vs, i) => {
            const score = (this.stats.vs.topClientTotConns.length - i) * this.weights.vs.totConns;
            preRank.push({
                score,
                name: vs.name,
                why: ["tot_conns", score]
            });
        });

        this.stats.vs.topClientCurConns.forEach((vs, i) => {
            const score = (this.stats.vs.topClientCurConns.length - i) * this.weights.vs.curConns;
            preRank.push({
                score,
                name: vs.name,
                why: ["cur_conns", score]
            });
        });



        // combine the rank array into a single object by virtual server name
        this.stats.vs.rank = preRank.reduce((acc, cur) => {

            // if current is in accumulator
            const idx = acc.findIndex((x) => x.name === cur.name);

            if (idx > -1) {
                acc[idx].score += cur.score;
                acc[idx].why.push(cur.why);
            } else {
                acc.push(cur)
            }

            return acc;
        }, [])

        return;
    }



    // private async topAsmCpu() {
    //     // get asm cpu stats
    //     this.stats;
    // }


    /**
     * convert wip_type to string that means something
     * @param type 
     * @returns 
     * @deprecated test function/idea for initial development
     */
    private enumGtmWipType(type: number) {
        switch (type) {
            case 1: return "A";
            case 2: return "AAAA";
            case 3: return "CNAME";
            case 4: return "MX";
            case 5: return "NAPTR";
            case 6: return "NS";
            case 7: return "PTR";
            case 8: return "SOA";
            case 9: return "SRV";
            case 10: return "TXT";
            case 11: return "ANY";
        }
    }
}




export type xmlStats = {
    'mcp_module.xml'?: {
        "Qkproc": {
            "admin_ip": unknown
            "system_information": unknown
            "cert_status_object": unknown
            "system_module": unknown
            "tmm_stat": unknown
            "traffic_group": unknown
            "virtual_address": unknown
            "virtual_address_stat": unknown
            "virtual_server": unknown
            "virtual_server_stat": unknown,
            "interface": unknown,
            "interface_stat": unknown,
            "pool": unknown,
            "pool_member": unknown,
            "pool_member_metadata": unknown,
            "pool_member_stat": unknown,
            "pool_stat": unknown,
            "profile_dns_stat": unknown,
            "profile_http_stat": unknown,
            "profile_tcp_stat": unknown,
            "rule_stat": unknown,
        }
    }
}

export type VsStatsSlim = {
    name: string,
    pkts_in: number,
    bytes_in: number,
    pkts_out: number,
    bytes_out: number,
    max_conns: number,
    tot_conns: number,
    cur_conns: number
}
