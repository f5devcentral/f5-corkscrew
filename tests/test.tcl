################################################
###  2020-09-18T17:22:32.646Z
###  9/18/2020, 12:22:32 PM
###  Fri, 18 Sep 2020 17:22:32 GMT
################################################

################################################
/Common/app1_t80_vs {
    creation-time 2020-09-17:08:50:22
    destination /Common/192.168.1.21:80
    ip-protocol tcp
    last-modified-time 2020-09-17:08:51:07
    mask 255.255.255.255
    profiles {
        /Common/http { }
        /Common/tcp { }
    }
    rules {
        /Common/_sys_https_redirect
    }
    serverssl-use-sni disabled
    source 0.0.0.0/0
    translate-address enabled
    translate-port enabled
}
################################################

################################################
/Common/app1_t443_vs {
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
}
ltm pool /Common/app1_t80_pool {
    members {
        /Common/app1_Node1:80 {
            address 192.168.1.22
        }
        /Common/app1_Node2:80 {
            address 192.168.1.23
        }
    }
    monitor /Common/http and /Common/tcp
}
ltm node /Common/app1_Node1 {
    address 192.168.1.22
}
ltm node /Common/app1_Node2 {
    address 192.168.1.23
}


################################################

################################################
/Common/app2_t80_vs {
    creation-time 2020-09-17:08:50:22
    destination /Common/192.168.2.21:80
    ip-protocol tcp
    last-modified-time 2020-09-17:08:51:07
    mask 255.255.255.255
    profiles {
        /Common/http { }
        /Common/tcp { }
    }
    rules {
        /Common/_sys_https_redirect
    }
    serverssl-use-sni disabled
    source 0.0.0.0/0
    translate-address enabled
    translate-port enabled
}
################################################

################################################
/Common/app2_t443_vs {
    destination /Common/192.168.2.21:443
    ip-protocol tcp
    last-modified-time 2020-09-18:10:05:47
    mask 255.255.255.255
    pool /Common/app2_t80_pool
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
}
ltm pool /Common/app2_t80_pool {
    load-balancing-mode least-connections-member
    members {
        /Common/app2_Node1:80 {
            address 192.168.2.22
        }
        /Common/app2_Node2:80 {
            address 192.168.2.23
        }
    }
    monitor /Common/global_http_monitor and /Common/global_https_monitor
}
ltm node /Common/app2_Node1 {
    address 192.168.2.22
    description app2_Node1
}
ltm node /Common/app2_Node2 {
    address 192.168.2.23
    description app2_Node2
}


################################################

################################################
/Common/app3_t8443_vs {
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
    }
    serverssl-use-sni disabled
    source 0.0.0.0/0
    source-address-translation {
        pool /Common/app3_snat_pool
        type snat
    }
    translate-address enabled
    translate-port enabled
}
ltm pool /Common/app3_t8443_pool {
    load-balancing-mode least-connections-member
    members {
        /Common/app3_Node1:8443 {
            address 192.168.1.52
        }
        /Common/app3_Node2:8443 {
            address 192.168.1.53
        }
    }
    monitor /Common/app1_tcp_half_open_quick_monitor and /Common/http_head_f5 and /Common/http2_head_f5 and /Common/http and /Common/tcp_half_open
}
ltm node /Common/app3_Node1 {
    address 192.168.1.52
}
ltm node /Common/app3_Node2 {
    address 192.168.1.53
}


################################################

################################################
/Common/forwarder_net_0.0.0.0 {
    destination /Common/0.0.0.0:0
    ip-forward
    mask any
    profiles {
        /Common/fastl4_loose { }
    }
    serverssl-use-sni disabled
    source 0.0.0.0/0
    translate-address disabled
    translate-port disabled
}
################################################
[2020-09-18T17:22:31.275Z] DeBuG: 'regular date log message'
[9/18/2020, 12:22:31 PM] DeBuG: 'toLocalString date log message'
[Fri, 18 Sep 2020 17:22:31 GMT] DeBuG: 'to UTC date log message'
[2020-09-18T17:22:31.383Z] INFO: Recieved bigip.conf, version: 15.1
[2020-09-18T17:22:31.390Z] INFO: digging vs config for /Common/app1_t80_vs
[2020-09-18T17:22:32.594Z] DEBUG: [/Common/app1_t80_vs] found the following profiles [
  'profiles {\n        /Common/http { }\n        /Common/tcp { }\n    }\n',
  '\n        /Common/http { }\n        /Common/tcp { }',
  index: 171,
  input: '\n' +
    '    creation-time 2020-09-17:08:50:22\n' +
    '    destination /Common/192.168.1.21:80\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:08:51:07\n' +
    '    mask 255.255.255.255\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/_sys_https_redirect\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.594Z] DEBUG: [/Common/app1_t80_vs] found the following rules [
  'rules {\n        /Common/_sys_https_redirect\n    }\n',
  '\n        /Common/_sys_https_redirect',
  index: 241,
  input: '\n' +
    '    creation-time 2020-09-17:08:50:22\n' +
    '    destination /Common/192.168.1.21:80\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:08:51:07\n' +
    '    mask 255.255.255.255\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/_sys_https_redirect\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.594Z] INFO: digging vs config for /Common/app1_t443_vs
[2020-09-18T17:22:32.594Z] DEBUG: digging pool config for /Common/app1_t80_pool
[2020-09-18T17:22:32.595Z] DEBUG: Pool /Common/app1_t80_pool members found: [ '/Common/app1_Node1', '/Common/app1_Node2' ]
[2020-09-18T17:22:32.595Z] DEBUG: pool monitor references found: [ '/Common/http', '/Common/tcp' ]
[2020-09-18T17:22:32.605Z] DEBUG: pool monitor configs found: []
[2020-09-18T17:22:32.605Z] DEBUG: /Common/app1_t80_pool references 2 system default monitors, compare previous arrays for details
[2020-09-18T17:22:32.606Z] DEBUG: [/Common/app1_t443_vs] found the following profiles [
  'profiles {\n        /Common/http { }\n        /Common/tcp { }\n    }\n',
  '\n        /Common/http { }\n        /Common/tcp { }',
  index: 165,
  input: '\n' +
    '    destination /Common/192.168.1.21:443\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-18:10:05:54\n' +
    '    mask 255.255.255.255\n' +
    '    pool /Common/app1_t80_pool\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        type automap\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.606Z] DEBUG: [/Common/app1_t443_vs] found the following rules [
  'source-address-translation {\n        type automap\n    }\n',
  '\n        type automap',
  index: 287,
  input: '\n' +
    '    destination /Common/192.168.1.21:443\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-18:10:05:54\n' +
    '    mask 255.255.255.255\n' +
    '    pool /Common/app1_t80_pool\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        type automap\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.606Z] INFO: digging vs config for /Common/app2_t80_vs
[2020-09-18T17:22:32.606Z] DEBUG: [/Common/app2_t80_vs] found the following profiles [
  'profiles {\n        /Common/http { }\n        /Common/tcp { }\n    }\n',
  '\n        /Common/http { }\n        /Common/tcp { }',
  index: 171,
  input: '\n' +
    '    creation-time 2020-09-17:08:50:22\n' +
    '    destination /Common/192.168.2.21:80\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:08:51:07\n' +
    '    mask 255.255.255.255\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/_sys_https_redirect\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.606Z] DEBUG: [/Common/app2_t80_vs] found the following rules [
  'rules {\n        /Common/_sys_https_redirect\n    }\n',
  '\n        /Common/_sys_https_redirect',
  index: 241,
  input: '\n' +
    '    creation-time 2020-09-17:08:50:22\n' +
    '    destination /Common/192.168.2.21:80\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:08:51:07\n' +
    '    mask 255.255.255.255\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/_sys_https_redirect\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.606Z] INFO: digging vs config for /Common/app2_t443_vs
[2020-09-18T17:22:32.607Z] DEBUG: digging pool config for /Common/app2_t80_pool
[2020-09-18T17:22:32.607Z] DEBUG: Pool /Common/app2_t80_pool members found: [ '/Common/app2_Node1', '/Common/app2_Node2' ]
[2020-09-18T17:22:32.607Z] DEBUG: pool monitor references found: [ '/Common/global_http_monitor', '/Common/global_https_monitor' ]
[2020-09-18T17:22:32.618Z] DEBUG: pool monitor configs found: [
  'ltm monitor http /Common/global_http_monitor {\n' +
    '    adaptive disabled\n' +
    '    defaults-from /Common/http\n' +
    '    interval 5\n' +
    '    ip-dscp 0\n' +
    '    recv "ok 200"\n' +
    '    recv-disable none\n' +
    '    send "GET /anywebsite.com\\r\\n"\n' +
    '    time-until-up 0\n' +
    '    timeout 16\n' +
    '}\n',
  'ltm monitor https /Common/global_https_monitor {\n' +
    '    adaptive disabled\n' +
    '    defaults-from /Common/https\n' +
    '    interval 5\n' +
    '    ip-dscp 0\n' +
    '    recv "201 continue"\n' +
    '    recv-disable none\n' +
    '    send "GET /any-secure-website.com\\r\\n"\n' +
    '    time-until-up 0\n' +
    '    timeout 16\n' +
    '}\n'
]
[2020-09-18T17:22:32.618Z] DEBUG: [/Common/app2_t443_vs] found the following profiles [
  'profiles {\n        /Common/http { }\n        /Common/tcp { }\n    }\n',
  '\n        /Common/http { }\n        /Common/tcp { }',
  index: 165,
  input: '\n' +
    '    destination /Common/192.168.2.21:443\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-18:10:05:47\n' +
    '    mask 255.255.255.255\n' +
    '    pool /Common/app2_t80_pool\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        type automap\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.618Z] DEBUG: [/Common/app2_t443_vs] found the following rules [
  'source-address-translation {\n        type automap\n    }\n',
  '\n        type automap',
  index: 287,
  input: '\n' +
    '    destination /Common/192.168.2.21:443\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-18:10:05:47\n' +
    '    mask 255.255.255.255\n' +
    '    pool /Common/app2_t80_pool\n' +
    '    profiles {\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        type automap\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.618Z] INFO: digging vs config for /Common/app3_t8443_vs
[2020-09-18T17:22:32.619Z] DEBUG: digging pool config for /Common/app3_t8443_pool
[2020-09-18T17:22:32.619Z] DEBUG: Pool /Common/app3_t8443_pool members found: [ '/Common/app3_Node1', '/Common/app3_Node2' ]
[2020-09-18T17:22:32.619Z] DEBUG: pool monitor references found: [
  '/Common/app1_tcp_half_open_quick_monitor',
  '/Common/http_head_f5',
  '/Common/http2_head_f5',
  '/Common/http',
  '/Common/tcp_half_open'
]
[2020-09-18T17:22:32.645Z] DEBUG: pool monitor configs found: [
  'ltm monitor tcp-half-open /Common/app1_tcp_half_open_quick_monitor {\n' +
    '    defaults-from /Common/tcp_half_open\n' +
    '    destination *:*\n' +
    '    interval 1\n' +
    '    time-until-up 0\n' +
    '    timeout 4\n' +
    '}\n'
]
[2020-09-18T17:22:32.645Z] DEBUG: /Common/app3_t8443_pool references 4 system default monitors, compare previous arrays for details
[2020-09-18T17:22:32.645Z] DEBUG: [/Common/app3_t8443_vs] found the following profiles [
  'profiles {\n' +
    '        /Common/app3_clientssl {\n' +
    '            context clientside\n' +
    '        }\n' +
    '        /Common/app3_serverssl {\n' +
    '            context serverside\n' +
    '        }\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n',
  '\n' +
    '        /Common/app3_clientssl {\n' +
    '            context clientside\n' +
    '        }\n' +
    '        /Common/app3_serverssl {\n' +
    '            context serverside\n' +
    '        }\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }',
  index: 363,
  input: '\n' +
    '    destination /Common/192.168.1.51:8443\n' +
    '    fallback-persistence /Common/app3_srcAddr_persist\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:12:45:40\n' +
    '    mask 255.255.255.255\n' +
    '    persist {\n' +
    '        /Common/app3_cookie {\n' +
    '            default yes\n' +
    '        }\n' +
    '    }\n' +
    '    policies {\n' +
    '        /Common/app3_ltm_policy { }\n' +
    '    }\n' +
    '    pool /Common/app3_t8443_pool\n' +
    '    profiles {\n' +
    '        /Common/app3_clientssl {\n' +
    '            context clientside\n' +
    '        }\n' +
    '        /Common/app3_serverssl {\n' +
    '            context serverside\n' +
    '        }\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/app3_rule\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        pool /Common/app3_snat_pool\n' +
    '        type snat\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.645Z] DEBUG: [/Common/app3_t8443_vs] found the following rules [
  'rules {\n        /Common/app3_rule\n    }\n',
  '\n        /Common/app3_rule',
  index: 581,
  input: '\n' +
    '    destination /Common/192.168.1.51:8443\n' +
    '    fallback-persistence /Common/app3_srcAddr_persist\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:12:45:40\n' +
    '    mask 255.255.255.255\n' +
    '    persist {\n' +
    '        /Common/app3_cookie {\n' +
    '            default yes\n' +
    '        }\n' +
    '    }\n' +
    '    policies {\n' +
    '        /Common/app3_ltm_policy { }\n' +
    '    }\n' +
    '    pool /Common/app3_t8443_pool\n' +
    '    profiles {\n' +
    '        /Common/app3_clientssl {\n' +
    '            context clientside\n' +
    '        }\n' +
    '        /Common/app3_serverssl {\n' +
    '            context serverside\n' +
    '        }\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/app3_rule\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        pool /Common/app3_snat_pool\n' +
    '        type snat\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.646Z] DEBUG: [/Common/app3_t8443_vs] found the following rules [
  'source-address-translation {\n' +
    '        pool /Common/app3_snat_pool\n' +
    '        type snat\n' +
    '    }\n',
  '\n        pool /Common/app3_snat_pool\n        type snat',
  index: 677,
  input: '\n' +
    '    destination /Common/192.168.1.51:8443\n' +
    '    fallback-persistence /Common/app3_srcAddr_persist\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:12:45:40\n' +
    '    mask 255.255.255.255\n' +
    '    persist {\n' +
    '        /Common/app3_cookie {\n' +
    '            default yes\n' +
    '        }\n' +
    '    }\n' +
    '    policies {\n' +
    '        /Common/app3_ltm_policy { }\n' +
    '    }\n' +
    '    pool /Common/app3_t8443_pool\n' +
    '    profiles {\n' +
    '        /Common/app3_clientssl {\n' +
    '            context clientside\n' +
    '        }\n' +
    '        /Common/app3_serverssl {\n' +
    '            context serverside\n' +
    '        }\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/app3_rule\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        pool /Common/app3_snat_pool\n' +
    '        type snat\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.646Z] DEBUG: [/Common/app3_t8443_vs] found the following ltPolices [
  'policies {\n        /Common/app3_ltm_policy { }\n    }\n',
  '\n        /Common/app3_ltm_policy { }',
  index: 273,
  input: '\n' +
    '    destination /Common/192.168.1.51:8443\n' +
    '    fallback-persistence /Common/app3_srcAddr_persist\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:12:45:40\n' +
    '    mask 255.255.255.255\n' +
    '    persist {\n' +
    '        /Common/app3_cookie {\n' +
    '            default yes\n' +
    '        }\n' +
    '    }\n' +
    '    policies {\n' +
    '        /Common/app3_ltm_policy { }\n' +
    '    }\n' +
    '    pool /Common/app3_t8443_pool\n' +
    '    profiles {\n' +
    '        /Common/app3_clientssl {\n' +
    '            context clientside\n' +
    '        }\n' +
    '        /Common/app3_serverssl {\n' +
    '            context serverside\n' +
    '        }\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/app3_rule\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        pool /Common/app3_snat_pool\n' +
    '        type snat\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.646Z] DEBUG: [/Common/app3_t8443_vs] found the following persistence [
  'persist {\n' +
    '        /Common/app3_cookie {\n' +
    '            default yes\n' +
    '        }\n' +
    '    }\n',
  '\n        /Common/app3_cookie {\n            default yes\n        }',
  index: 189,
  input: '\n' +
    '    destination /Common/192.168.1.51:8443\n' +
    '    fallback-persistence /Common/app3_srcAddr_persist\n' +
    '    ip-protocol tcp\n' +
    '    last-modified-time 2020-09-17:12:45:40\n' +
    '    mask 255.255.255.255\n' +
    '    persist {\n' +
    '        /Common/app3_cookie {\n' +
    '            default yes\n' +
    '        }\n' +
    '    }\n' +
    '    policies {\n' +
    '        /Common/app3_ltm_policy { }\n' +
    '    }\n' +
    '    pool /Common/app3_t8443_pool\n' +
    '    profiles {\n' +
    '        /Common/app3_clientssl {\n' +
    '            context clientside\n' +
    '        }\n' +
    '        /Common/app3_serverssl {\n' +
    '            context serverside\n' +
    '        }\n' +
    '        /Common/http { }\n' +
    '        /Common/tcp { }\n' +
    '    }\n' +
    '    rules {\n' +
    '        /Common/app3_rule\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    source-address-translation {\n' +
    '        pool /Common/app3_snat_pool\n' +
    '        type snat\n' +
    '    }\n' +
    '    translate-address enabled\n' +
    '    translate-port enabled\n',
  groups: undefined
]
[2020-09-18T17:22:32.646Z] INFO: digging vs config for /Common/forwarder_net_0.0.0.0
[2020-09-18T17:22:32.646Z] DEBUG: [/Common/forwarder_net_0.0.0.0] found the following profiles [
  'profiles {\n        /Common/fastl4_loose { }\n    }\n',
  '\n        /Common/fastl4_loose { }',
  index: 67,
  input: '\n' +
    '    destination /Common/0.0.0.0:0\n' +
    '    ip-forward\n' +
    '    mask any\n' +
    '    profiles {\n' +
    '        /Common/fastl4_loose { }\n' +
    '    }\n' +
    '    serverssl-use-sni disabled\n' +
    '    source 0.0.0.0/0\n' +
    '    translate-address disabled\n' +
    '    translate-port disabled\n',
  groups: undefined
]