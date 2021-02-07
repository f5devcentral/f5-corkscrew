import { BigipConfObj, ObjStats } from './models';
/**
 * counts up totals of the different LTM objects (vs, nodes, pools, ...)
 * @param obj ltm branch of config tree
 */
export declare function countObjects(obj: BigipConfObj): ObjStats;
