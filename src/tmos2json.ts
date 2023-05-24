





/**
 * Capture tmos backeted object ex. ltm pool <name> { <body>}
 * 
 * created 4.30.2023 to more accurately capture tmos bracketd objects
 * 
 * @param preRx parent object string to start counting with 
 * @param x tmos config string to find body of ending brack }
 * @returns 
 */
export function balancedRx1(preRx: string, x: string) {
    // looking to build a custom funtion similar to balance-matched
    //  https://github.com/juliangruber/balanced-match

    // find the matching rx
    const pRx = x.match(preRx)

    // if no match, return
    if (pRx) {

        const preface = pRx[0];
        const preIndexStart = pRx.index!;  // beginning of the rxMatch
        const preIndexEnd = preIndexStart + preRx.length;  // end of the rxMatch
        let idx = preIndexEnd + 1;  // start our index just after ther first match
        let beginCount = 1;  // since our firt match was in the rx
        let endCount = 0;

        do {

            // loop through the string counting brackets till even
            const a = x[idx]
            if (a === '{') beginCount++
            if (a === '}') endCount++
            idx++;

        }
        while (beginCount != endCount)

        const pre = preface?.slice(0, -1).trim();  // trim off parent start bracket {
        const bdy = x.slice(preIndexEnd, idx - 1)  // trim off parent ending bracket }
        // return the original string without everything we just found
        const rest = x.slice(0, preIndexStart) + x.slice(idx)

        // return parent name and body
        // example:  <k> {<v>}
        return { prefaceKey: pre, body: bdy, rest };
    }

}




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
export function balancedRxAll(x: string, objB: boolean = false): 
    { matches: { prefaceKey: string, body: string, rest: string }[], rest: string} {
    // looking to build a custom funtion similar to balance-matched
    //  https://github.com/juliangruber/balanced-match

    const preRx = /\n +[\w\-\/:. ]+ {/

    let pRx: RegExpMatchArray | null;
    const ret: any[] = []
    
    do {

        // run the rx to find the beginning of a backeted object
        pRx = x.match(preRx);

        if(pRx) {
            // catpure the bracketed object
            const r = balancedRx1(pRx[0], x);

            if(r) {
                // push key/value from bracketed object to the return array
                ret.push(r);
                // update the original string so we can dig out the next object
                x = r.rest;
            }
        }
    }
    while (pRx);
    
    // remove all the rest strings from the matches
    // https://stackoverflow.com/questions/12482961/change-values-in-array-when-doing-foreach
    // ret.forEach( (o, i, a) => a[i] = { prefaceKey: o.prefaceKey, body: o.body })

    if(objB) {

        // build an object of all the key/bodies
        // const obj = {}
        // ret.forEach(b => {
        //     obj[b.prefaceKey] = b.body
        // })
        // return { matches: obj, rest: x };

    } else {
        
        return { matches: ret, rest: x };

    }
}