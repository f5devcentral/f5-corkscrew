# project-corkscrew


## Overview
The intention for this project/rpm is to provide a common tool to extract tmos applications.


### TMOS application feature exclusions

*** need to rething the following since a big part of the tool could help with support and just regular migrations ***
For migration purposes, especially to another platform, like mBIP the following features are being ignored:
(? = will consider if needed)
- Virtual Server Properties
    - HTTP Proxy Connect Profile
    - FTP Profile
    - RTSP Profile
    - SOCKS Profile
    - Stream Profile?
    - XML Profile?
    - MQTT
    - SMPTS Profile
    - POP3 Profile
    - Client LDAP Profile
    - Server LDAP Profile
    - Service Profile
    - SMTP Profile?
    - WebSocket Profile
    - IMAP Profile
    - SplitSession Client Profile
    - ...


### output

theoretical full output of initiation of class should produce the following in an api form

> check the test output files for other example outputs [\tests\devCloud01_conversionOutput.txt](.\tests\devCloud01_conversionOutput.txt)

```json
{
    "id": "<task-id-uuid>",
    "date": "<date-time>",
    "config": {
        "rawConfig": "<original-bigip.conf-as-string>",
        "apps": [{
            "name": "<app-name=>VSname>",
            "config": "<full-tmos-app-config>",
            "map": "<map-of-vs-to-destinations-for-dashboards>"
        }]
    },
    "stats": {
        "processTime": "<total-processing-duration-in-ms>",
        "sourceTmosVersion": "<ex. 15.1.0.1>",
        "totalTmosObjects": "<total number of tmos objects extracted from config",
        "ltm": {
            "virtuals": "<number of virtuals detected>",
            "pools": "<number of pools detected",
            "profiles": "<number of profiles detected (client/server/ssl, tcp, udp, http, ...)>",
            "irules": "<number of irules detected>",
            "snatPools": "<number of snat pools detected>",
            "localTrafficPolicies": "<number of local traffic policies>"
        },
        "apm": {
            "accessProfiles": "<number of access profiles>",
            "accessPolicies": "<number of access policies>"
        }
    },
    "logs": "<logs about config processing>"
}
```

```log
tmos version detected: 15.1.0.1
parse function
number of tmos objects detected: 62
number of 
```



## Getting Started
Provide a quick example of how to use your code.  This should provide the user with a launch point to quickly see what the project can offer them. 

## Installation
Outline the requirements and steps to install this project. 

## Usage
Outline how the user can use your project and the various features the project offers. 

## Development
Outline any requirements to setup a development environment if someone would like to contribute.  You may also link to another file for this information. 

## Support
For support, please open a GitHub issue.  Note, the code in this repository is community supported and is not supported by F5 Networks.  For a complete list of supported projects please reference [SUPPORT.md](support.md).

## Community Code of Conduct
Please refer to the [F5 DevCentral Community Code of Conduct](code_of_conduct.md).


## License
[Apache License 2.0](LICENSE)

## Copyright
Copyright 2014-2020 F5 Networks Inc.


### F5 Networks Contributor License Agreement

Before you start contributing to any project sponsored by F5 Networks, Inc. (F5) on GitHub, you will need to sign a Contributor License Agreement (CLA).

If you are signing as an individual, we recommend that you talk to your employer (if applicable) before signing the CLA since some employment agreements may have restrictions on your contributions to other projects.
Otherwise by submitting a CLA you represent that you are legally entitled to grant the licenses recited therein.

If your employer has rights to intellectual property that you create, such as your contributions, you represent that you have received permission to make contributions on behalf of that employer, that your employer has waived such rights for your contributions, or that your employer has executed a separate CLA with F5.

If you are signing on behalf of a company, you represent that you are legally entitled to grant the license recited therein.
You represent further that each employee of the entity that submits contributions is authorized to submit such contributions on behalf of the entity pursuant to the CLA.