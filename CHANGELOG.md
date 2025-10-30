
# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the corkscrew rpm will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

---

## [Unreleased]

### Added

- [RFE] dig ssl profiles and cipher groups #43 (pending/researching)

### Changed

- main README.md/documentation updates (pending)

### Fixed

---

## [1.5.0] - (10.30.2025)

### Changed

- Updated all dependencies to latest versions
- Major updates: f5-conx-core (1.2.0), deepmerge-ts (7.1.5), fast-xml-parser (5.3.0), uuid (13.0.0), glob (11.0.3), yargs (18.0.0), mocha (11.7.4), nyc (17.1.0), eslint (9.38.0), @typescript-eslint (8.46.2)
- Moved tar package from dependencies to devDependencies (only used in tests)
- Updated TypeScript target from ES6 to ES2022
- Updated @types packages to match parent package versions
- Removed @types/glob and @types/uuid (now have built-in types)

---

## [1.4.2] - (02.27.2024)

### Fixed

- bug in tenants/partitions with special chars: .-_

---

## [1.4.1] - (11.03.2023)

### Fixed

- bug in objCounter when missing properties/objects

---

## [1.4.0] - (07.11.2023)

### Fixed

- fixed initial why nesting of vs rank
- fixed UCS parsing bug related to non qkview files

---

## [1.3.0] - (07.11.2023)

### Added

- generate and add test qkview to releases for consumption in vscode-f5 extension
- [RFE] include xml stats in extraction #15
  - initial xml stats rank system to show top 10 VS and GSLB
  - includes other stats for irule, asm and some lists of objects that have no stats
- initial report builder (html report) testing/dev
- full license parsing

### Fixed

- added more catch statements to prevent errors (and log them) from total failures

---

## [1.2.0] - (06.19.2023)

### Fixed

- [BUG] custom http monitor missing from abstration #40
- [BUG] udf lab as3/acc/fast ucs bug on exploer #41

---

## [1.1.3] - (05.25.2023)

### Fixed

- [BUG] more snatpool abstraction bug/tweaks
- log error when app abstraction encounters error

## [1.1.2] - (05.25.2023)

### Fixed

- [BUG] snatpool abstraction broken #36

---

## [1.1.1] - (05.25.2023)

### Added

- [RFE] dns/gslb - provide all possible destinations as array #29
- [RFE] better apm parsing #31
- [RFE] deeper parsing of key ltm objects #30
  - full parsing of vs/pool/monitor/pool/node/snatpool
  - vs with no destination
  - pool with no members
  - vs with missing prolicy
- [RFE] add bot/dos profiles to abstraction/visibility #33
- github issue templates for BUGs and RFEs

### Changed

- updated deps

### Fixed

- [BUG] gslb no pool error #32
- [BUG] no cli parse output in my environment #27

---

## [1.0.0] - (04.20.2023)

### Changed

- **formerly v0.14.0**
- updated all deps
- removed legacy syncronous unpack function
  - all the new async unpacking functionality seems to be working well
- removed xml2js functionality
  - used for parsing xml stats in qkview - weren't really using the output
- [RFE] Add gslb/dns abstraction #25 (complete)
  - Get parent objects into main tree (complete)
    - deep parsing of gtm objects for easy abstraction and integration with conversion tools (complete)
  - Abstract WIP and supporting configurations (complete)
- created archive generator to creat archive(ucs/qkview/tar.gz) via local files for tests
  - regular archives were too big for github file sizes
  - this also allows easy updating and expansion of project functionality and testing
- updated tests
  - general updates to support new features and refactoring
  - doClasses abstraction tests
  - gtm/gslb parsing/abstraction tests
  - waf parsing/abstraction tests
- major code hygene and clean up
- [RFE] add asm/waf details #24 (complete)
- [RFE] move tests to folder outside srcs #16 (complete)
- [RFE] refactor initial parent object extraction #6 (complete)
- [RFE] Add gslb/dns abstraction #25 (complete)
- [BUG] missing parent objects at end of file #26 (complete)

---

## [0.10.0] - (07.10.2022)

### Changed

- Added parent APM profile digging (apm profile acces \<name\>)
  - Not digging the entire apm profile yet, just the main profile that gets attached to the virtual so we can at least see that this VS has APM
- Removed old base config digging
  - All details and more are in DO search

---

## [0.9.3] - (02.02.2022)

### fixed

- TypeError: Cannot read properties of undefined (reading 'internal') #23
  - https://github.com/f5devcentral/f5-corkscrew/issues/23

---

## [0.9.0] - (10.31.2021)

### changed

- updated base config extraction to pull all DO classes supported in ACC
- fixed parsing error when no virtual servers
- fixed cli (was not working with new async parser)
- added cli options
  - All output is in json format now
  - includes command processing logs
  - added switches to exclude output for:
    - no_sources
    - no_file_store
    - no_command_logs
    - no_conversion_logs
- started creating tests archive generator
- started looking into adding an option for exploring archives with passphrase

---

## [0.8.0] - (02-25-2021)

### Added

- certificate/key extraction

### Changed

- Core parsing/extraction process is now asyncronous
  - emits config and stats files during processing
  - Once config files are done processing, all other files are processed into the config tree

---

## [0.7.0] - (01-25-2021)

### changed

- Disabled errors for files that do not have the same tmos version as the first
  - this opened the opportunity to try to parse parent tmos objects from the file anyway, at least attempting to extract config
- Line returns are converted from \r\n to \n
- Added datagroup extraction from irules
- More work to make functions async and throw appropriate errors
  - Mainly around the unPacker function responsible for detecting and unpacking ucs/qkviews

---

## [0.6.0] - (01-24-2021)

### added

- Configured events for each application extraction

### changed

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

### changed

- Updated explosion output to include source config file contents.  

---

## [0.4.0] - (10-21-2020)

### added

- Added support for extracting pools referenced by local traffic policies and irules
  - Including application maps for those destinations
- Added stats for config load time (extracting files from archives) and total config files size (extracted files)
- Added hostname, source file type and source tmos version to collected details and ouput in explosion
  - These are just informatory details what will be utilized for visibility while working in the vscode extension

### changed

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

### added

- Added support for ucs/qkview input
  - This resulted in all inputs being a single file reference and letting it figure out what to do from there
    - if single .conf, then just load and pass to parse function
    - but if an archive is detected, it will search the archive for the needed files and return them as a list to be parsed
- Added events to the parse function to emit during processing
  - These can be used to feed progress information to a status bar
- Added base configuration information to explode function
  - This includes vlans and SelfIPs

### changed

- Parsing now includes bigip.conf, bigip_base.conf and any supporting /partitions/ folders+config files
- cli now handles errors better and responses with log files if any problems occur

## [0.2.0] - (10-8-2020)

### added

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

### changed

- vsConfig app parsing logic to not fail if object is not found (reduces chances of catastrophic processing failure)
- reworked ininital config parsing logic and removed unnecessary processing and objects
- reworked app extrction process to utilize more efficient methods
  - now uses json tree
  - drastically reduced app extraction time
- removed full application extraction from initial parsing so they can be called independantly
  - This is for big configs where it can take a while to extract all applications
  - The user can pick which apps to get extracted applications for
- NOTE:  currently able to fully process a 6MB config file with almost 300vs, 223k lines, and over 13k tmos objects in about 20 seconds
- finish regular pool member mapping
- implement pool discovery/mapping functions for irules
  - add support for other virtual servers?
- implement pool discovery/mapping functions for LTPs
  - add support for virtual servers and nodes

---

## [0.1.1] - (9-24-2020)

### changed

- adjusted "getVsConfig" function to include "ltm virtual" at the beginning of each virtual server name
  - this completes the object and show allow for apps to be import to other f5s

---

## [0.1.0] - (9-22-2020)

### added

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
