import { connect } from "http2";


export function parseVS( cmdout: string ): Map<string, unknown> {
    
    // will add a function to read from file
    const res = cmdout.split("Ltm::").slice(1);
    const result = new Map();
    for (const i in res) {
        const line = res[i].split("\n");
        const vs_name = line[0].split(" ")[2];
        console.log(line[0].split(" ")[2]);
        const result1 = new Map();
        result1.set('status',mapListDic(line.slice(3,10)));
        result.set(vs_name,result1);
    } 
    console.log(result.get('/Common/VS-146.20.176.0-80').get('status').get('Availability'));
    return result;
}

function mapListDic(myArray: Array<string>) {
    console.log(myArray);
    const myMap = new Map();
    for (const value of myArray) {
        myMap.set(value.split(':')[0].trim(), value.split(':')[1].trim())
        console.log(myMap)
    }
    return myMap
    }
