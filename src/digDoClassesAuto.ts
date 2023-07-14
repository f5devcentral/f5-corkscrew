'use-strict'


import { BigipConfObj } from './models'
import doClasses from './do_classes.json'
import logger from './logger';
import objectPath from 'object-path'


/**
 * dig DO config information like vlans/SelfIPs/system-settings/...
 * @param configTree bigip config as json tree
 * @returns raw config objects
 */
export async function digDoConfig (configTree: BigipConfObj): Promise<string[]> {

    const confs: string[] = [];

    logger.info('digging DO classes for base config info')

    doClasses.forEach( async (el) => {

        // split the path and drop the initial '/tm'
        const path = el.path.split('/').slice(2);

        // search tree for config
        const val = objectPath.get(configTree, path)

        if (val) {
            
            if (typeof val == 'object') {
                
                // const objectProperties = []
                // if config is object, loop through object and expand it
                for (const [key, value] of Object.entries(val)) {

                    const v = value as any;

                    if(v.line) {
                        // this is to support the exdended parsing scheme started Apr2023
                        confs.push(`${path.join(' ')} ${key} { ${v.line} }`)
                    } else {

                        confs.push(`${path.join(' ')} ${key} { ${v} }`)
                    }
                }
                

            } else if(typeof val == 'string') {
                
                // if config is string, return it
                confs.push(`${path.join(' ')} { ${val} }`);
            } else {
                logger.info(`dig DO class path found, but not a string or object; path=${path.join(' ')} value=${val} }`)
            }
        } else {
            // no config found for this path
            logger.debug(`no path "${path.join(' ')}" in object`);
        }

    })

    return confs;
}



// ted@r2d2:~/projects/f5-corkscrew$ cat src/do_classes.json | jq .[].path
// "/tm/sys/global-settings"
// "/tm/cli/global-settings"
// "/tm/sys/software/update"
// "/tm/sys/db"
// "/tm/sys/management-ip"
// "/tm/sys/provision"
// "/tm/sys/ntp"
// "/tm/sys/dns"
// "/tm/net/dns-resolver"
// "/tm/net/trunk"
// "/tm/net/vlan"
// "/tm/net/self"
// "/tm/net/route"
// "/tm/net/routing/access-list"
// "/tm/net/routing/as-path"
// "/tm/net/routing/prefix-list"
// "/tm/net/routing/route-map"
// "/tm/net/routing/bgp"
// "/tm/cm/device/~Common~{{deviceName}}"
// "/tm/cm/device/~Common~{{deviceName}}"
// "/tm/cm/device/~Common~{{deviceName}}"
// "/tm/cm/device/~Common~{{deviceName}}"
// "/tm/cm/device-group"
// "/tm/cm/traffic-group"
// "/tm/cm/traffic-group"
// "/tm/analytics/global-settings"
// "/tm/sys/management-route"
// "/tm/sys/syslog"
// "/tm/auth/source"
// "/tm/auth/remote-user"
// "/tm/auth/radius"
// "/tm/auth/radius-server"
// "/tm/auth/tacacs"
// "/tm/net/route-domain"
// "/tm/auth/remote-role/role-info"
// "/tm/auth/ldap"
// "/tm/sys/snmp"
// "/tm/sys/snmp/traps"
// "/tm/sys/snmp"
// "/tm/sys/snmp/users"
// "/tm/sys/snmp/communities"
// "/tm/net/dag-globals"
// "/tm/sys/httpd"
// "/tm/ltm/global-settings/traffic-control"
// "/tm/sys/sshd"
// "/tm/net/tunnels/tunnel"
// "/tm/net/tunnels/vxlan"
// "/tm/sys/disk/directory"
// "/tm/gtm/global-settings/general"
// "/tm/gtm/datacenter"
// "/tm/gtm/server"
// "/tm/gtm/monitor/http"
// "/tm/gtm/monitor/https"
// "/tm/gtm/monitor/gateway-icmp"
// "/tm/gtm/monitor/tcp"
// "/tm/gtm/monitor/udp"
// "/tm/gtm/prober-pool"
// "/tm/security/firewall/policy"
// "/tm/security/firewall/address-list"
// "/tm/security/firewall/port-list"
// "/tm/security/firewall/management-ip-rules"
// ted@r2d2:~/projects/f5-corkscrew$ 