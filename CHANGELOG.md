

# Change Log

[BACK TO MAIN README](README.md)

All notable changes to the corkscrew rpm will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

---

## [0.1.1] - (9-24-2020)

### Modified
- adjusted "getVsConfig" function to include "ltm virtual" at the beginning of each virtual server name
    - this completes the object and show allow for apps to be import to other f5s

### Pending/In-Progress...
- finish regular pool member mapping
- implement pool discovery/mapping functions for irules
    - add support for other virtual servers?
- implement pool discovery/mapping functions for LTPs
    - add support for virtual servers and nodes

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


