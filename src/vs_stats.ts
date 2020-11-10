
export function parseVS( cmdout: string ): Map<string, unknown> {
    
    // will add a function to read from file
    const res = cmdout.split("Ltm::").slice(1);
    const result = new Map();
    for (const i in res) {
        const line = res[i].split("\n");
        const vs_name = line[0].split(" ")[2];
        // console.log(line[0].split(" ")[2]);
        const result1 = new Map();
        result1.set('status',mapListDic(line.slice(3,10)));
        result1.set('cpu_usage_ratio',mapListDic1(line.slice(38,40), ' '));
        result.set(vs_name,result1);
    } 
    console.log(result.get('/Common/VS-146.20.176.0-80').get('status').get('Availability'));
    console.log(result.get('/Common/VS-146.20.176.0-80').get('cpu_usage_ratio').get('Last 1 Minute'));
    return result;
}

function mapListDic(myArray: Array<string>) {
    const myMap = new Map();
    for (const value of myArray) {
        myMap.set(value.split(':')[0].trim(), value.split(':')[1].trim())
        //console.log(myMap)
    }
    return myMap
    }

function mapListDic1(myArray: Array<string>, separator) {
    const myMap = new Map();
    for (let value of myArray) {
        value = value.trim().replace(/\s\s+/g, ' ');
        const ls = value.split(separator);
        console.log(ls[ls.length-1])
        console.log(ls.slice(0,ls.length-1).join(" "));
        myMap.set(ls.slice(0,ls.length-1).join(" "),ls[ls.length-1]);
    }
    return myMap
    }