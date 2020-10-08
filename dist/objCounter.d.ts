import { BigipConfObj } from './models';
export declare type ObjStats = {
    virtuals?: number;
    profiles?: number;
    policies?: number;
    pools?: number;
    irules?: number;
    monitors?: number;
    nodes?: number;
    snatPools?: number;
    apmProfiles?: number;
    apmPolicies?: number;
    asmPolicies?: number;
};
export declare function countObjects(obj: BigipConfObj): ObjStats;
