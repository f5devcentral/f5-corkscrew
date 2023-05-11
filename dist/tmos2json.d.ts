/**
 * Capture tmos backeted object ex. ltm pool <name> { <body>}
 *
 * created 4.30.2023 to more accurately capture tmos bracketd objects
 *
 * @param preRx parent object string to start counting with
 * @param x tmos config string to find body of ending brack }
 * @returns
 */
export declare function balancedRx1(preRx: string, x: string): {
    prefaceKey: string;
    body: string;
    rest: string;
};
/**
 * Capture tmos backeted object ex. ltm pool <name> { <body>}
 *
 * created 4.30.2023 to more accurately capture tmos bracketd objects
 *
 * this one returns an array of matches and requires a RegExp input
 *
 * @param preRx parent object string to start counting with
 * @param x tmos config string to find body of ending brack }
 * @returns
 */
export declare function balancedRxAll(x: string, objB?: boolean): {
    matches: {
        prefaceKey: string;
        body: string;
        rest: string;
    }[];
    rest: string;
};
