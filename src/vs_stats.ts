export function parseVS( cmdout: string ): Map<string, unknown> {
    
    
    const obj = {}

    const res = cmdout.split("Ltm::").slice(1);

    for (const i in res) {
        const line = res[i].split("\n");
        const vs_name = line[0].split(" ")[2];
        const result={}
        result['status']=mapListDic(line.slice(3,10));
        result['cpu_usage_ratio']= mapListDic1(line.slice(37,40), ' ');
        obj[vs_name]=result;
    }
    console.log("sergio")
    console.log(obj)    
 return
}

function mapListDic(myArray: Array<string>) {
    const obj={}
    for (const value of myArray) {
        obj[value.split(':')[0].trim()]=value.split(':')[1].trim();
        //console.log(myMap)
    }
    console.log(obj)
    return obj
    }
function mapListDic1(myArray: Array<string>, separator) {
    const myMap = {};
    for (let value of myArray) {
        value = value.trim().replace(/\s\s+/g, ' ');
        const ls = value.split(separator);
        console.log(ls[ls.length-1])
        console.log(ls.slice(0,ls.length-1).join(" "));
        myMap[ls.slice(0,ls.length-1).join(" ")]=ls[ls.length-1];
    }
    return myMap
    }    