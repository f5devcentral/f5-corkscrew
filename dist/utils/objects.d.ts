import { BigipConfObj } from "../models";
declare type RetObj = {
    path?: string;
    key?: string;
    value?: string;
};
/**
 * builds multi-level nested objects with data
 * https://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
 * @param fields array of nested object params
 * @param value value of the inner most object param value
 */
export declare const nestedObjValue: (fields: any, value: any) => any;
/**
 * provides deep merge of multi-level objects
 *  subsequent items in list overwrite conflicting entries
 * @param objs list of objects to merge
 */
export declare function deepMergeObj(target: unknown, source: unknown): unknown;
/**
 *
 * @param cfg child config to parse
 * @param obj used to iterate
 */
export declare function tmosChildToObj(cfg: string, obj?: any): any;
/**
 * Deep merge two objects.
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 * @param target
 * @param ...sources
 */
export declare function simpleMergeDeep(target: any, ...sources: any[]): any;
/**
 * this will overwrite existing data
 * @param obj
 * @param path
 * @param value
 */
export declare function setNestedKey(obj: any, path: string[], value: any): any;
/**
 * deep search object for value using regex
 * @param vtf value to find (regex capable)
 * @param obj to search
 * @param return array of path steps
 */
export declare function getPathOfValue(vtf: string | RegExp, obj: any): any;
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
 * *** todo: update path to be array, not dot(.) notation
 *
 * @param obj to search
 * @param key to find
 * @param return [{ path: string, key: string, value: string }]
 */
export declare function pathValueFromKey(obj: BigipConfObj, key: string): RetObj;
export {};
