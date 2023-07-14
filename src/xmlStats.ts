
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
            'asm_policy_virtual_server'
        ]
    }
    /**
     * top N virtual servers to get stats for
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
        stat: {
            vs: {},
            gtm: {},
        },
        mcp: {
            vs: {},
            gtm: {},
        }
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

                this.xmlStats.mcp[stat] = [];

                // for each match, parse the xml and merge with main stats object
                const matches = file.content.match(rx)

                // capture the gtm_wideip_stat stats
                if (stat === 'gtm_wideip_stat') {
                    this.mcp_gtm_wideip_stat = matches;
                }

                matches?.forEach((match) => {
                    const parsed = this.xmlParser.parse(match);
                    if (parsed) {

                        if (stat === 'global_host_info_stat') {
                            deepmergeInto(this.xmlStats.mcp, parsed)
                        } else {
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

        promises.push(this.topStatVs()
            .catch((err) => {
                // catching errors here to keep the rest of the process from failing
                //  move catch logic higher up as things get more stable
                logger.error('f5-corkscrew/xmlStats/topVirtualServers', err);
            }));

        promises.push(this.topMcpVs()
            .catch((err) => {
                // catching errors here to keep the rest of the process from failing
                //  move catch logic higher up as things get more stable
                logger.error('f5-corkscrew/xmlStats/topVirtualServers', err);
            }));

        promises.push(this.topGtmWips()
            .catch((err) => {
                // catching errors here to keep the rest of the process from failing
                //  move catch logic higher up as things get more stable
                logger.error('f5-corkscrew/xmlStats/topGtmWips', err);
            }));

        // wait for all promises to resolve
        await Promise.all(promises);

        logger.info("xml stats crunched");
        return this.stats;
    }

    /**
     * Get the topN gtm wideips by requests
     * source: stat_module.xml for now
     */
    async topGtmWips() {

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
        // (stat_module.xml)
        this.stats.stat.gtm.topWideipsByRequests = Object.values(this.xmlStats.stat.gtm_wideip_stat)
            .sort((a: any, b: any) => {
                return b.requests - a.requests;
            })      // sort by requests
            .filter((x: { requests: number }) => x.requests > 0)    // filter out wideips with 0 requests
            .slice(0, this.topN)    // get topN
            .map((x: any) => {
                const name = x.name.split('/').pop();
                return {
                    name,
                    requests: x.requests,
                    type: enumGtmWipTypeA[x.wip_type - 1],
                    resolutions: x.resolutions,
                    dropped: x.dropped,
                    fallbacks: x.fallbacks,
                    persisted: x.persisted,
                };
            });    // map to name and requests details out of object

        // get topN gtm wideip names by requests 
        // (mcp_module.xml)
        this.stats.mcp.gtm.topWideipsByRequests = this.xmlStats.mcp.gtm_wideip_stat
            .sort((a: any, b: any) => {
                return b.requests - a.requests;
            })      // sort by requests
            .filter((x: { requests: number }) => x.requests > 0)    // filter out wideips with 0 requests
            .slice(0, this.topN)    // get topN
            .map((x: any) => {
                const name = x.wip_name.split('/').pop();
                return {
                    name: x.wip_name,
                    requests: x.requests,
                    type: enumGtmWipTypeA[x.wip_type - 1],
                    resolutions: x.resolutions,
                    a_reuqests: x.a_requests,
                    aaaa_requests: x.aaaa_requests,
                    cname_resolutions: x.cname_resolutions,
                    dropped: x.dropped,
                    fallbacks: x.fallbacks,
                    persisted: x.persisted,
                };
            });    // map to name and requests details out of object
    }

    /**
     * collects vs stats and ranks them by the topN
     * 
     * source: mcp_module.xml for now
     */
    private async topMcpVs() {

        // loop through each of the virtual servers stats and collect only the stats we want
        const mcpVsStats = this.xmlStats.mcp.virtual_server_stat.map((vs: any) => {

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

        this.stats.mcp.vs.topClientPktsIn = mcpVsStats.sort((a: any, b: any) => {
            return b.pkts_in - a.pkts_in;
        }).filter((x: any) => x.pkts_in > 0).slice(0, this.topN);

        this.stats.mcp.vs.topClientBytsIn = mcpVsStats.sort((a: any, b: any) => {
            return b.bytes_in - a.bytes_in;
        }).filter((x: any) => x.bytes_in > 0).slice(0, this.topN);

        this.stats.mcp.vs.topClientPktsOut = mcpVsStats.sort((a: any, b: any) => {
            return b.pkts_out - a.pkts_out;
        }).filter((x: any) => x.pkts_out > 0).slice(0, this.topN);

        this.stats.mcp.vs.topClientBytsOut = mcpVsStats.sort((a: any, b: any) => {
            return b.bytes_out - a.bytes_out;
        }).filter((x: any) => x.bytes_out > 0).slice(0, this.topN);

        this.stats.mcp.vs.topClientMaxConns = mcpVsStats.sort((a: any, b: any) => {
            return b.max_conns - a.max_conns;
        }).filter((x: any) => x.max_conns > 0).slice(0, this.topN);

        this.stats.mcp.vs.topClientTotConns = mcpVsStats.sort((a: any, b: any) => {
            return b.tot_conns - a.tot_conns;
        }).filter((x: any) => x.tot_conns > 0).slice(0, this.topN);

        this.stats.mcp.vs.topClientCurConns = mcpVsStats.sort((a: any, b: any) => {
            return b.cur_conns - a.cur_conns;
        }).filter((x: any) => x.cur_conns > 0).slice(0, this.topN);


        // create a preRank array for each of the stats we want to rank
        const preRank = [];


        // loop through each of the stat collections and rank the virtual servers

        this.stats.mcp.vs.topClientPktsIn.forEach((vs, i) => {
            const score = (this.stats.mcp.vs.topClientPktsIn.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["pkts_in", score]
            });
        });

        this.stats.mcp.vs.topClientBytsIn.forEach((vs, i) => {
            const score = (this.stats.mcp.vs.topClientBytsIn.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["bytes_in", score]
            });
        });

        this.stats.mcp.vs.topClientPktsOut.forEach((vs, i) => {
            const score = (this.stats.mcp.vs.topClientPktsOut.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["pkts_out", score]
            });
        });

        this.stats.mcp.vs.topClientBytsOut.forEach((vs, i) => {
            const score = (this.stats.mcp.vs.topClientBytsOut.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["bytes_out", score]
            });
        });

        this.stats.mcp.vs.topClientMaxConns.forEach((vs, i) => {
            const score = (this.stats.mcp.vs.topClientMaxConns.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["max_conns", score]
            });
        });

        this.stats.mcp.vs.topClientTotConns.forEach((vs, i) => {
            const score = (this.stats.mcp.vs.topClientTotConns.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["tot_conns", score]
            });
        });

        this.stats.mcp.vs.topClientCurConns.forEach((vs, i) => {
            const score = (this.stats.mcp.vs.topClientCurConns.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["cur_conns", score]
            });
        });


        // combine the rank array into a single object by virtual server name
        this.stats.mcp.vs.rank = preRank.reduce((acc, cur) => {
            if (acc[cur.name]) {
                acc[cur.name].score += cur.score;
                acc[cur.name].why.push(cur.why);
            } else {
                acc[cur.name] = {
                    score: cur.score,
                    why: [cur.why]
                }
            }
            return acc;
        }, {});

        return;
    }




    /**
     * collects vs stats and ranks them by the topN
     * 
     * source: stat_module.xml for now
     * @returns void
     */
    private async topStatVs() {

        // loop through each of the virtual servers stats and collect only the stats we want
        const xmlVsStatsSlim = Object.values(this.xmlStats.stat.virtual_server_stat).map((vs: any) => {
            return {
                name: vs.name,
                "clientside.pkts_in": vs["clientside.pkts_in"],
                "clientside.bytes_in": vs["clientside.bytes_in"],
                "clientside.pkts_out": vs["clientside.pkts_out"],
                "clientside.bytes_out": vs["clientside.bytes_out"],
                "clientside.max_conns": vs["clientside.max_conns"],
                "clientside.tot_conns": vs["clientside.tot_conns"],
                "clientside.cur_conns": vs["clientside.cur_conns"]
            }
        });



        // get the top 10 virtual servers for each of the stats we want

        this.stats.stat.vs.topClientPktsIn = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.pkts_in"] - a["clientside.pkts_in"];
        }).filter(x => x["clientside.pkts_in"] > 0).slice(0, this.topN);

        this.stats.stat.vs.topClientBytsIn = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.bytes_in"] - a["clientside.bytes_in"];
        }).filter(x => x["clientside.bytes_in"] > 0).slice(0, this.topN);

        this.stats.stat.vs.topClientPktsOut = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.pkts_out"] - a["clientside.pkts_out"];
        }).filter(x => x["clientside.pkts_out"] > 0).slice(0, this.topN);

        this.stats.stat.vs.topClientBytsOut = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.bytes_out"] - a["clientside.bytes_out"];
        }).filter(x => x["clientside.bytes_out"] > 0).slice(0, this.topN);

        this.stats.stat.vs.topMaxConns = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.max_conns"] - a["clientside.max_conns"];
        }).filter(x => x["clientside.max_conns"] > 0).slice(0, this.topN);

        this.stats.stat.vs.topTotConns = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.tot_conns"] - a["clientside.tot_conns"];
        }).filter(x => x["clientside.tot_conns"] > 0).slice(0, this.topN);

        this.stats.stat.vs.topCurConns = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.cur_conns"] - a["clientside.cur_conns"];
        }).filter(x => x["clientside.cur_conns"] > 0).slice(0, this.topN);


        // create a preRank array for each of the stats we want to rank
        const preRank = [];

        // loop through each of the stat collections and rank the virtual servers

        this.stats.stat.vs.topClientPktsIn.forEach((vs, i) => {
            const score = (this.stats.stat.vs.topClientPktsIn.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.pkts_in", score]
            });
        });

        this.stats.stat.vs.topClientBytsIn.forEach((vs, i) => {
            const score = (this.stats.stat.vs.topClientBytsIn.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.bytes_in", score]
            });
        });

        this.stats.stat.vs.topClientPktsOut.forEach((vs, i) => {
            const score = (this.stats.stat.vs.topClientPktsOut.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.pkts_out", score]
            });
        });

        this.stats.stat.vs.topClientBytsOut.forEach((vs, i) => {
            const score = (this.stats.stat.vs.topClientBytsOut.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.bytes_out", score]
            });
        });

        this.stats.stat.vs.topMaxConns.forEach((vs, i) => {
            const score = (this.stats.stat.vs.topMaxConns.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.max_conns", score]
            });
        });

        this.stats.stat.vs.topTotConns.forEach((vs, i) => {
            const score = (this.stats.stat.vs.topTotConns.length - i) * this.weights.vs.pktsIn;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.tot_conns", score]
            });
        });

        // combine the rank array into a single object by virtual server name
        this.stats.stat.vs.rank = preRank.reduce((acc, cur) => {
            if (acc[cur.name]) {
                acc[cur.name].score += cur.score;
                acc[cur.name].why.push(cur.why);
            } else {
                acc[cur.name] = {
                    score: cur.score,
                    why: [cur.why]
                }
            }
            return acc;
        }, {});

        return;
    }

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

const tmctl_commands = [
    'profile_dns_stat',
    'gtm_wideip_stat',
    'dns_cache_resolver_stat',
    'tmmdns_zone_stat',
    'rule_stat',
    'virtual_server_stat',
    'pool_member_stat',
    'tmm_stat',
    'interface_stat',
    'cpu_info_stat',
    'disk_info_stat',
    'host_info_stat'
]