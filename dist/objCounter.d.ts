import { BigipConfObj, GslbStats, ObjStats } from './models';
/**
 * counts up totals of the different LTM objects (vs, nodes, pools, ...)
 * @param obj ltm branch of config tree
 */
export declare function countObjects(obj: BigipConfObj): Promise<ObjStats>;
export declare function countAPM(obj: BigipConfObj, stats: ObjStats): Promise<void>;
/**
 * list of gtm record types, not for Typescript typing (see models export)
 * [ 'a', 'aaaa', 'ns', 'srv', 'cname', 'mx', 'naptr']
 */
export declare const gtmRecordTypes: string[];
export declare function countGSLB(obj: BigipConfObj): Promise<GslbStats>;
