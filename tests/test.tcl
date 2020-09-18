
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
    mask 255.255.255.255
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
    mask 255.255.255.255
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
}

ltm node /Common/app3_Node1 {
    address 192.168.1.52
}

ltm node /Common/app3_Node2 {
    address 192.168.1.53
}
*** pool member nodes here ***

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
