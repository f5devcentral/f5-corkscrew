
import { X2jOptions, XMLParser } from 'fast-xml-parser';

import logger from "./logger";
import { ConfigFile } from "./models";


export default class XmlStats {
    xmlParser: XMLParser;
    xmlParserOptions: Partial<X2jOptions> = {
        ignoreAttributes: false,
        attributeNamePrefix: "",
        updateTag: (tagName: string, jPath: string, attrs) => {
            if (tagName === 'object' && attrs['name']) {
                return tagName = attrs['name'];
            }
        },
    };
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
     *   - currenly only stat_module.xml
     */
    rx = {
        statsToGet: [
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
        gslbStats: []
    }
    /**
     * top N virtual servers to get stats for
     */
    topN = 10;
    /**
     * main stats object
     */
    xmlStats: any = {};
    /**
     * stats object for virtual servers
     */
    stats: any = {};


    constructor() {
        // create xml parser 
        this.xmlParser = new XMLParser(this.xmlParserOptions);
    }

    /**
     * Crunch the xml stats file pulling the stats defined in this.statsToGet
     *  Then parse the stats into json for further processing
     * 
     * @param file { fileName: string, size: number, content: string }
     *
     */
    async crunch(file: ConfigFile) {
        logger.info("crunching xml stats");

        // loop through each tat and rx out the data we want
        this.rx.statsToGet.forEach((stat) => {
            const rx = new RegExp(` *?<${stat}>\n[\\S\\s]+?\n +</${stat}>\n`, 'g');

            // for each match, parse the xml and merge with main stats object
            file.content.match(rx)?.forEach((match) => {
                const parsed = this.xmlParser.parse(match);
                if (parsed) {
                    // merge with main stats object in class
                    this.xmlStats = Object.assign(this.xmlStats, parsed);
                }

            });
        });

        this.topVirtualServers();
        this.topGtmWideips();

        logger.info("xml stats crunched");
    }

    async topGtmWideips() {

        // get topN gtm wideip names by requests
        this.stats.topGtmWideipsByRequests = Object.values(this.xmlStats.gtm_wideip_stat)
            .sort((a: any, b: any) => {
                return b.requests - a.requests;
            })
            .filter((x: { requests: number }) => x.requests > 0)
            .slice(0, this.topN)
            .map((x: { name: string, requests: number }) => {
                const name = x.name.split('/').pop();
                return { name, requests: x.requests };
            });
    }

    async topVirtualServers() {

        // loop through each of the virtual servers stats and collect only the stats we want
        const xmlVsStatsSlim = Object.values(this.xmlStats.virtual_server_stat).map((vs: any) => {
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

        this.stats.topClientPktsIn = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.pkts_in"] - a["clientside.pkts_in"];
        }).filter(x => x["clientside.pkts_in"] > 0).slice(0, this.topN);

        this.stats.topClientBytsIn = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.bytes_in"] - a["clientside.bytes_in"];
        }).filter(x => x["clientside.bytes_in"] > 0).slice(0, this.topN);

        this.stats.topClientPktsOut = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.pkts_out"] - a["clientside.pkts_out"];
        }).filter(x => x["clientside.pkts_out"] > 0).slice(0, this.topN);

        this.stats.topClientBytsOut = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.bytes_out"] - a["clientside.bytes_out"];
        }).filter(x => x["clientside.bytes_out"] > 0).slice(0, this.topN);

        this.stats.topMaxConns = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.max_conns"] - a["clientside.max_conns"];
        }).filter(x => x["clientside.max_conns"] > 0).slice(0, this.topN);

        this.stats.topTotConns = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.tot_conns"] - a["clientside.tot_conns"];
        }).filter(x => x["clientside.tot_conns"] > 0).slice(0, this.topN);

        this.stats.topCurConns = Object.values(xmlVsStatsSlim).sort((a, b) => {
            return b["clientside.cur_conns"] - a["clientside.cur_conns"];
        }).filter(x => x["clientside.cur_conns"] > 0).slice(0, this.topN);


        // create a preRank array for each of the stats we want to rank
        const preRank = [];

        // loop through each of the stat collections and rank the virtual servers

        this.stats.topClientPktsIn.forEach((vs, i) => {
            const score = this.stats.topClientPktsIn.length - i;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.pkts_in", score]
            });
        });

        this.stats.topClientBytsIn.forEach((vs, i) => {
            const score = this.stats.topClientBytsIn.length - i;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.bytes_in", score]
            });
        });

        this.stats.topClientPktsOut.forEach((vs, i) => {
            const score = this.stats.topClientPktsOut.length - i;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.pkts_out", score]
            });
        });

        this.stats.topClientBytsOut.forEach((vs, i) => {
            const score = this.stats.topClientBytsOut.length - i;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.bytes_out", score]
            });
        });

        this.stats.topMaxConns.forEach((vs, i) => {
            const score = this.stats.topMaxConns.length - i;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.max_conns", score]
            });
        });

        this.stats.topTotConns.forEach((vs, i) => {
            const score = this.stats.topTotConns.length - i;
            preRank.push({
                score,
                name: vs.name,
                why: ["clientside.tot_conns", score]
            });
        });

        // combine the rank array into a single object by virtual server name
        this.stats.vsRank = preRank.reduce((acc, cur) => {
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

    chunk() {
        // something
    }

    parse() {
        // something
    }
}