import { BigipConfObj } from "../models";
declare type RetObj = {
    path?: string;
    key?: string;
    value?: string;
};
/**
 * provides deep merge of multi-level objects
 *  subsequent items in list overwrite conflicting entries
 * @param objs list of objects to merge
 */
export declare function deepMergeObj(objs: unknown[]): unknown;
/**
 *
 * @param cfg child config to parse
 * @param obj used to iterate
 */
export declare function tmosChildToObj(cfg: string, obj?: any): any;
export declare function setNestedKey(obj: any, path: string[], value: any): any;
/**
 * deep search object for value using regex
 * @param vtf value to find (regex capable)
 * @param obj to search
 * @param return array of path steps
 */
export declare function getPathOfValue(vtf: string, obj: any): any;
/**
 * gets value by deep path in array form
 *  (ex. ['ltm','monitor','http'])
 *
 * *** paths have to be in array form since names can have '.' in them ***
 *
 * @param path to fetch value
 * @param obj containing path/value to get
 */
export declare function deepGet(path: string[], obj: any): any;
/**
 * searches object for key
 *
 * @param obj to search
 * @param key to find
 * @param return [{ path: string, key: string, value: string }]
 */
export declare function pathValueFromKey(obj: BigipConfObj, key: string): RetObj;
export {};
