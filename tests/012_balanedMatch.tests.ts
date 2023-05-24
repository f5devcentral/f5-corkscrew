
'use strict';

import assert from 'assert';

import { balancedRx1, balancedRxAll } from '../src/tmos2json'
import { isArray, isObject } from 'f5-conx-core';


describe('Balance Matched work as of 4.30.2023', async function () {

    it(`balanced match function 1`, async function () {

        const t = `
    members {
    /Common/app3_Node1:8443 {
        address 192.168.1.52
    }
    /Common/app3_Node2:8443 {
        address 192.168.1.53
    }
}
`

    // this was reall just my first example of where I wanted to go.  
    // the other functions are more representative of what is needed
        function balanced1(x: string) {

            x = x.trim();
            const b = x.replace(/\n +/g, ' ')
            const sp = x.split('')

            const preface: string[] = [];
            const body: string[] = [];
            let beginCount = 0;
            let endCount = 0;

            for (const a of sp) {
                if (a === '{') beginCount++
                if (a === '}') endCount++

                if (beginCount === 0) preface.push(a)
                if (beginCount > 0) body.push(a);


                if (beginCount === endCount && body.length > 0) break;

            }

            const pre = preface.join('').trim();
            body.shift(); // removes the parent starting {
            body.pop(); // removed the parent ending }
            const bdy = body.join('').trim();  // combine the rest the body

            return { k: pre, v: bdy }
        }

        const d = balanced1(t);

    });


    // was working on deep parsing ltm pools, so this is the body of a complicted ltm pool object
    const t = `
    allow-nat no
    allow-snat no
    description "yabba dappa doo!"
    ignore-persisted-weight enabled
    ip-tos-to-client mimic
    ip-tos-to-server mimic
    link-qos-to-client 5
    link-qos-to-server 6
    load-balancing-mode observed-member
    members {
        /Common/10.3.110.10:80 {
            address 10.3.110.10
        }
        /Common/10.3.110.10:443 {
            address 10.3.110.10
        }
        /Common/10.3.110.10:8443 {
            address 10.3.110.10
        }
        /Common/dw1.lab.io:8443 {
            fqdn {
                autopopulate enabled
                name dude1.where.io
            }
        }
        /Common/dw2.lab.io:443 {
            description asfd
            monitor /Common/http
            fqdn {
                name dude2.where.io
            }
        }
    }
    monitor min 2 of { /Common/gateway_icmp /Common/http /Common/http2 }
    profiles {
        /Common/nvgre
    }
    queue-depth-limit 66
    queue-time-limit 88
    reselect-tries 7
    service-down-action reset
    slow-ramp-time 300
    `
    it(`balanced match function 2`, async function () {



        const d = balancedRx1('members {', t);

        // the following are just to make sure the basic structure of the object is there
        //      and those strings include details we expect
        assert.ok(d?.prefaceKey.includes('members'))
        assert.ok(d?.body.includes('fqdn {'))
        assert.ok(d?.rest.includes('yabba'))


    });



    it(`balancedRxAll - array`, async function () {

        const d = balancedRxAll(t);

        // the following are just to make sure the basic structure of the object is there
        //      and those strings include details we expect
        assert.ok(isArray(d.matches))
        assert.ok(typeof d.rest === 'string')
        assert.ok(typeof d.matches[0].prefaceKey === 'string')
        assert.ok(typeof d.matches[0].body === 'string')

    });


    // it(`balancedRxAll - Object`, async function () {

    //     const d = balancedRxAll(t, true);

    //     // the following are just to make sure the basic structure of the object is there
    //     //      and those strings include details we expect
    //     assert.ok(isObject(d.matches))
    //     assert.ok(typeof d.rest === 'string')

    // });


});
