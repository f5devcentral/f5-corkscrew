



// export class jsonObjTestsData {

    /**
     * DO NOT TOUCH FORMATTING!!!
     *  indention of the different data structures is important to how they are parsed
     * 
     *  Changing any of the tabs or spacing will cause problems
     */


    /**
     * test parsing snat config reference pool of VS server
     */


// vsSnatcfg = `
//     source-address-translation {
//         pool /Common/app3_snat_pool
//         type snat
//     }
//     `



/**
 * body of a simple virtual in tmos form
 */
export const simpleVStmosBody = `
    destination /Common/192.168.1.21:443
    ip-protocol tcp
    last-modified-time 2020-09-18:10:05:54
    mask 255.255.255.255
    pool /Common/app1_t80_pool
    profiles {
        /Common/http { }
        /Common/tcp { }
    }
    serverssl-use-sni disabled
    source 0.0.0.0/0
    source-address-translation {
        type automap
    }
    translate-address enabled
    translate-port enabled
`

export const simpleVSbody_asJson = {
    destination: "/Common/192.168.1.21:443",
    "ip-protocol": "tcp",
    "last-modified-time": "2020-09-18:10:05:54",
    mask: "255.255.255.255",
    pool: "/Common/app1_t80_pool",
    profiles: {
        '/Common/http': ' ',
        '/Common/tcp': ' ',
    },
    "serverssl-use-sni": "disabled",
    source: "0.0.0.0/0",
    "source-address-translation": {
      type: "automap",
    },
    "translate-address": "enabled",
    "translate-port": "enabled",
  }


export const vsApp3 = `
    destination /Common/192.168.1.51:8443
    fallback-persistence /Common/app3_srcAddr_persist
    ip-protocol tcp
    last-modified-time 2020-09-17:12:45:40
    mask 255.255.255.255
    persist {
        /Common/app3_cookie {
            default yes
        }
    }
    policies {
        /Common/app3_ltm_policy { }
    }
    pool /Common/app3_t8443_pool
    profiles {
        /Common/app3_clientssl {
            context clientside
        }
        /Common/app3_serverssl {
            context serverside
        }
        /Common/http { }
        /Common/tcp { }
    }
    rules {
        /Common/app3_rule
        /Common/app3_rule2
        /Common/app3_rule3
    }
    serverssl-use-sni disabled
    source 0.0.0.0/0
    source-address-translation {
        pool /Common/app3_snat_pool
        type snat
    }
    translate-address enabled
    translate-port enabled
`



// }


