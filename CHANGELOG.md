
# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the corkscrew rpm will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

---

## [0.8.0] - (02-07-2021)

### Modified

- Disabled errors for files that do not have the same tmos version as the first
  - this opened the opportunity to try to parse parent tmos objects from the file anyway, at least attempting to extract config
- Line returns are converted from \r\n to \n
- Added datagroup extraction from irules

---

## [0.7.0] - (01-25-2021)

### Modified

- More work to make functions async and throw appropriate errors
  - Mainly around the unPacker function responsible for detecting and unpacking ucs/qkviews

---

## [0.6.0] - (01-24-2021)

### Added

- Configured events for each application extraction

### Modified

- fixed a bug where ending brackets were missing on iRules
- changed and removed some logic that was consuming large amount of resources causing some "explosions" to fail
  - this was mainly affecting usage through the vscode extension since it has less memory allocated
  - removed unecessary json.stringify/parse calls
- removed logic that was searching irules for pools referenced via variable
  - this was also causing application extraction failures
- converted most of the core functions to async
  - this will allow internal errors to surface and caugth

---

## [0.5.0] - (01-18-2021)

### Modified

- Updated explosion output to include source config file contents.  

---

## [0.4.0] - (10-21-2020)

### Added

- Added support for extracting pools referenced by local traffic policies and irules
  - Including application maps for those destinations
- Added stats for config load time (extracting files from archives) and total config files size (extracted files)
- Added hostname, source file type and source tmos version to collected details and ouput in explosion
  - These are just informatory details what will be utilized for visibility while working in the vscode extension

### Modified

- Cleaned up app array to not have so much nested information
- Changed config storage in object to array of individual objects instead of one big string
  - This will provide better flexibility in the future, along with being able to provide:
        - config objects as a singe-line
        - application specific object counts
        - **object deduplication**
- Also changed logs from single string to array for easier access and better stats
  - Now have quick easy view of how many logs are generated after an extraction
- Adjuststed log message to bracket log level [DEBUG]
  - This seems to work better with vscode log highlighting

---

## [0.3.0] - (10-12-2020)

### Added

- Added support for ucs/qkview input
  - This resulted in all inputs being a single file reference and letting it figure out what to do from there
    - if single .conf, then just load and pass to parse function
    - but if an archive is detected, it will search the archive for the needed files and return them as a list to be parsed
- Added events to the parse function to emit during processing
  - These can be used to feed progress information to a status bar
- Added base configuration information to explode function
  - This includes vlans and SelfIPs

### Modified

- Parsing now includes bigip.conf, bigip_base.conf and any supporting /partitions/ folders+config files
- cli now handles errors better and responses with log files if any problems occur

## [0.2.0] - (10-8-2020)

### Added

- Processing stats
  - config parsing time (how long it took to break down the config files)
  - app extraction time (how long it took to gather all app configurations)
  - explode function package time (how long it took to package everything up)
  - config file line count
  - config file byte count
  - total parent object count
  - ltm object counts for (vs, pool, profile, policy, persistence, node, monitor, irule, and snatPools)
- support for fqdn pool members and nodes
- Option to only parse configs, get list of applications and choose which apps to get configuration for

### Modified

- vsConfig app parsing logic to not fail if object is not found (reduces chances of catastrophic processing failure)
- reworked ininital config parsing logic and removed unnecessary processing and objects
- reworked app extrction process to utilize more efficient methods
  - now uses json tree
  - drastically reduced app extraction time
- removed full application extraction from initial parsing so they can be called independantly
  - This is for big configs where it can take a while to extract all applications
  - The user can pick which apps to get extracted applications for

> NOTE:  currently able to fully process a 6MB config file with almost 300vs, 223k lines, and over 13k tmos objects in about 20 seconds

### Pending/In-Progress

- finish regular pool member mapping
- implement pool discovery/mapping functions for irules
  - add support for other virtual servers?
- implement pool discovery/mapping functions for LTPs
  - add support for virtual servers and nodes

---

## [0.1.1] - (9-24-2020)

### Modified

- adjusted "getVsConfig" function to include "ltm virtual" at the beginning of each virtual server name
  - this completes the object and show allow for apps to be import to other f5s

---

## [0.1.0] - (9-22-2020)

### initial release

- intakes bigip.conf
  - extracts tmos applications including major configuration objects
    - pools
    - profiles
    - irules
    - snap pools
    - local traffic policies
    - persistence profiles
    - monitors
- performes some version checking and includes a REGEX tree
  - the regex tree is a json structure for the different regexs that are used to parse the different pieces of the config
    - the version checking and regex tree are designed to allow for easy tweaking of different regexes depending on code version
- includes a logging system that will provide insight into the differnt apps and what support app objects it detects are reference in the virtual server and what object are found in the configuration (if not found, should be a default profile)
- initial stab at trying to package this up as an RPM that can be included in other projects
