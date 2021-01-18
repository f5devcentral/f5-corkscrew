import { BigipConfObj } from "../models";
/**
 * recursively removes empty value/objects/arrays
 * @param obj
 */
export declare function cleanObject(obj: any): void;
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
export declare function nestedObjValue(fields: string[], value: string): unknown;
/**
* provides deep merge of multi-level objects
*  subsequent items in list overwrite conflicting entries
* @param objs list of objects to merge
 */
export declare function deepMergeObj(target: unknown, source: unknown): unknown;
/**
 * Deep merge two objects.
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 * @param target
 * @param ...sources
 */
export declare function simpleMergeDeep(target: unknown, ...sources: any): unknown;
/**
 * this will overwrite existing data
 * @param obj
 * @param path
 * @param value
 */
export declare function setNestedKey(obj: unknown, path: string[], value: unknown): unknown;
/**
 * deep search object for value using regex
 * @param vtf value to find (regex capable)
 * @param obj to search
 * @param return array of path steps
 */
export declare function getPathOfValue(vtf: string | RegExp, obj: unknown): unknown;
/**
 * gets value by deep path in array form
 *  (ex. ['ltm','monitor','http'])
 *
 * *** paths have to be in array form since names can have '.' in them ***
 *
 * @param path to fetch value
 * @param obj containing path/value to get
 */
export declare function deepGet(path: string[], obj: unknown): unknown;
/**
 * searches object for key
 *
 * *** todo: update path to be array, not dot(.) notation
 *  - pretty sure this is complete...
 *
 * @param obj to search
 * @param key to find
 * @param return [{ path: string, key: string, value: string }]
 */
export declare function pathValueFromKey(obj: BigipConfObj, key: string): RetObj;
export {};
