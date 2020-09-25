

# project-corkscrew

<p>&nbsp;</p>

## Overview

The intention for this project/rpm is to provide a common tool to extract tmos applications.  Taking a bigip.conf and extracting all it's configuration items to a form that can easily be searched and different functions performed, all with the intent of migrating the application to something like AS3.

The intent is to change the project name to "f5-corkscrew" as it matures and potentially gets released to NPM.

check out the: [CHANGE LOG](CHANGELOG.md) for details of the different releases

### Configuration objects supported in the parsing

- virtual servers and following associated/references profiles/objects:
    - persistence profile (including fall-back persistence)
    - pool
    - irules (not recursive at this time)
    - snat pool
    - local traffic policies (LTPs)
    - pool monitors
    - main stream profiles including http, tcp, clien/server-ssl profiles

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Tasks/Ideas

- Deeper app parsing
    - looking into digging/crawling the partitions for all configs
    - expand the discovery of pools referenced in irules, local traffic policies
        - this also includes references to other virtual servers and nodes
        - return this information in the app maps
    - what other things need to be added to the parsing?
        - oneConnect profiles?

- Command line interface
    - this should provide a good way to just download the rpm, issue a command and get parsed apps
    - could be big with support and/or hard core command liners

- Exploring the idea of fully jsonifying the entire config
    - I belive this would provide the most flexible and scalable way to consume and search the config in totallity
    - all parititions and even the bigip_base.conf could all be added to the same tree to provide a single place to search for eveything config related (at least for migrations)
    - the struggle is needing to create a function that will search the tree for an object key and return an array of matches including path and value
    - this will allow us to further filter results as needed
        - This approach seems to accomodate different profile types with the same name
    - I also think this method will accomodate possible configuration nameing changes with different versions
        - we should be able to just search for path paramters after the key is found to find the right object type
    - this should also remove the need for the regex tree, or at least reduce it to a minimal size
    - 9.25.2020 - did find out that tmos will not allow conflicting names across the different profile/monitor types
        - this should make searching for an object eaiser

- thinking about how to expand the current input method of the main ltm class
    - it currently takes a bigip.conf at initiation, but should probably take an array of tmso files (ex. ['bigip.conf', 'bigip_base.conf', 'partitionConf', ...])
    - all files will be parsed into the json tree for a more complete search
    - So, it's nice to be able to feed it a single file and explode that in the vscode extension or just for simple work, but probably also need to include some logic to consume a UCS/qkvew, and maybe even an scf
        - in that case we are gonna need functions to unpack each method

- a "sanitize" function to remove sensitive information and change IPs/names so configs can be shared as part of the process


<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Exclusions

The following items are excluded from application extraction since the main goal of this is for transitioning to AS3
- certificates
    - not only are these sensitive, but also probably need to be create and associated with the AS3 declaration as part of the automation process
- system settings?
- APM/ASM policies - for now...  maybe whatever APM config is in the config files

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Architecture

<p>&nbsp;</p>

### TypeScript and JSDOC

The whole thing is written in TypeScript and heavigly documented with JSDoc.  If you use vscode with this setup, you will see all the jsdoc information as you hover over different variables and functions.  

<p>&nbsp;</p>

### BigipConfig class

Right now, the main piece is the BigipConfig class in the ltm.ts file.  This class is what takes in the bigip.conf at initiation.  From there different functions can be called to get different information

<p>&nbsp;</p>

### Logger class

the logger class is a simple logger implementation that collect all the logs througout processing and provides a way to return them as part of the response back.  This is mainly to provide some feedback into what is happening without having to straight to debugging node directly.

<p>&nbsp;</p>

### Regex class

The regex class provides a way to structure the different regexs needed to parse the different pieces of information.  I feel that the json tree is not only a good way to hold and access all the regex's, but also an easy way to update pieces of the tree depending on tmos configuration variances of different code versions.  In short, if pools are reference differently in v17, a flag that updates that single regex can easily be configured with mininmal impact to everything else.

<p>&nbsp;</p>

### a fully jsonified config

I have the idea that the TMOS config loosely represents a json structure.  The parent tmos objects look like names json objects and everything else can end up being a regular object attribute as a "key": "value" pair.

If you check out the output of the `configMultiLevelObjects` class var, you will see a browsable json tree of the parent objects.  What this could mean, is that the entire config could be jsonified, then searched for the needed data without the need for breaking things down with the regex tree.  This could make data search and extraction very quick and efficient.  The main downside to that, is that it is going to reguire some good js/json foo to be able to search and extract the necessary information.  I feel like we are halfway there...

<p>&nbsp;</p>

### Mocha tests

the test file `bigip.conf_1.test.ts` abuses the mocha testing suite to run the code as I have been developing. It's my intent to move more in the direction of test driven development, but I need to think and discuss with others about different approches I have been looking at.

<p>&nbsp;</p>

### Example

We load a config from a file or get it through some other means, like api POST...
```js
const devCloud01 = fs.readFileSync(path.join(__dirname, "./artifacts/devCloud01_9.17.2020.conf"), "utf-8");
```
<p>&nbsp;</p>

Then we create and initialize the class as follows:
```js
const devCloud = new BigipConfig(devCloud01);
```

<p>&nbsp;</p>

The .apps() function returns an array of objects like:
```json
[{
    "name": "vs_name",
    "config": "extracted_app_config",
    "map": "src->dst IPs"
}]
```

<p>&nbsp;</p>

The .logs() function returns a log of the extraction process

<p>&nbsp;</p>

The top of the main class also describes some of the different ways I have the the initial breakdown of the parent objects.  These are public definitions on the class which can be access directly: `const x = devCloud.configMultiLevelObjects`

```js
    /**
     * simple array of each bigip.conf parent object
     * (ex. "[ltm node /Common/192.168.1.20 { address 192.168.1.20 }, ...]")
     */
    public configAsSingleLevelArray: string[];
    /**
     * object form of bigip.conf
     *  key = full object name, value = body
     * *** this one doesn't seem to be useful at all...
     */
    public configSingleLevelObjects: bigipObj = {};
    /**
     *  tmos configuration as a single level object
     * ex. [{name: 'parent object  name', config: 'parent config obj body'}]
     */
    public configArrayOfSingleLevelObjects = [];
    /**
     * tmos config as nested json objects 
     * - consolidated parant object keys like ltm/apm/sys/...
     */
    public configMultiLevelObjects: goodBigipObj = {};
```

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## test file output

This includes most of the different pieces all in a single text file for example.  This is way easier to read all the text output without being serialized for JSON structure.

> latest test output file [devCloud01_conversionOutput.txt](./devCloud01_conversionOutput.txt)

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## JSON output

theoretical full json output should produce the following in an api form

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

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Getting Started
Provide a quick example of how to use your code.  This should provide the user with a launch point to quickly see what the project can offer them. 

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Installation
Outline the requirements and steps to install this project. 

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Usage
Outline how the user can use your project and the various features the project offers. 

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Development
Outline any requirements to setup a development environment if someone would like to contribute.  You may also link to another file for this information. 

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Support
For support, please open a GitHub issue.  Note, the code in this repository is community supported and is not supported by F5 Networks.  For a complete list of supported projects please reference [SUPPORT.md](support.md).

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Community Code of Conduct
Please refer to the [F5 DevCentral Community Code of Conduct](code_of_conduct.md).

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## License
[Apache License 2.0](LICENSE)

<p>&nbsp;</p>

---

<p>&nbsp;</p>

## Copyright
Copyright 2014-2020 F5 Networks Inc.

<p>&nbsp;</p>

### F5 Networks Contributor License Agreement

Before you start contributing to any project sponsored by F5 Networks, Inc. (F5) on GitHub, you will need to sign a Contributor License Agreement (CLA).

If you are signing as an individual, we recommend that you talk to your employer (if applicable) before signing the CLA since some employment agreements may have restrictions on your contributions to other projects.
Otherwise by submitting a CLA you represent that you are legally entitled to grant the licenses recited therein.

If your employer has rights to intellectual property that you create, such as your contributions, you represent that you have received permission to make contributions on behalf of that employer, that your employer has waived such rights for your contributions, or that your employer has executed a separate CLA with F5.

If you are signing on behalf of a company, you represent that you are legally entitled to grant the license recited therein.
You represent further that each employee of the entity that submits contributions is authorized to submit such contributions on behalf of the entity pursuant to the CLA.