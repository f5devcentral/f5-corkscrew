
# Conversion Performance Stats

This page is a collection of stats outputs from conversions of varios sizes.

Times are in mili-seconds

- `objectCount` is total parent object count extracted from configs (ex. "ltm node { ... }")
- `configBytes` is total number of bytes from all config files that were selected for config extraction
- `loadTime` is the time it took for the .conf/ucs/qkview to be located, unpacked and config files extracted
    - This is the heaviest operation by far since some archives can reach hundreds of Mbs
- `parseTime` is the time it took to convert the config files to a structure we can search for config objects
- `appTime` is the time it took to extract all applications from the config objects in the parse time
- `packTime` is the time it took to gather all the details from a "full" output

```json
[
{
    "objectCount": 251,
    "configBytes": 74664,
    "loadTime": 3455.2001,
    "objects": {
        "virtuals": 8,
        "profiles": 6,
        "policies": 2,
        "pools": 8,
        "irules": 5,
        "monitors": 6,
        "nodes": 11,
        "snatPools": 1
    },
    "parseTime": 19.6916,
    "appTime": 5.7523,
    "packTime": 0.5622
},
{
    "objectCount": 145,
    "objects": {
        "virtuals": 12,
        "profiles": 4,
        "pools": 6,
        "monitors": 2,
        "nodes": 13,
        "snatPools": 1
    },
    "parseTime": 14.4642,
    "appTime": 6.776899,
    "packTime": 0.6119
},
{
    "objectCount": 438,
    "objects": {
        "virtuals": 14,
        "profiles": 5,
        "pools": 4,
        "irules": 8,
        "monitors": 2,
        "nodes": 7
    },
    "parseTime": 39.2408,
    "appTime": 9.939699,
    "packTime": 1.0628
},
{
    "objectCount": 3592,
    "objects": {
        "virtuals": 629,
        "profiles": 11,
        "policies": 6,
        "pools": 537,
        "irules": 162,
        "monitors": 7,
        "nodes": 599,
        "snatPools": 2
    },
    "parseTime": 610.116499,
    "appTime": 302.685199,
    "packTime": 3.246599
},
{
    "objectCount": 9285,
    "objects": {
        "virtuals": 1451,
        "profiles": 14,
        "pools": 1146,
        "irules": 196,
        "monitors": 12,
        "nodes": 2582,
        "snatPools": 4
    },
    "parseTime": 4585.2308,
    "appTime": 5758.630399,
    "packTime": 7.1531
},
{
    "objectCount": 772,
    "objects": {
        "virtuals": 18,
        "profiles": 6,
        "pools": 7,
        "irules": 16,
        "monitors": 3,
        "nodes": 12
    },
    "parseTime": 51.483299,
    "appTime": 6.932,
    "packTime": 7.9256
},
{
    "objectCount": 204,
    "objects": {
        "virtuals": 6,
        "profiles": 1,
        "pools": 6,
        "monitors": 4,
        "nodes": 17
    },
    "parseTime": 23.245,
    "appTime": 6.8443,
    "packTime": 7.8236
},
{
    "objectCount": 154,
    "objects": {
        "virtuals": 10,
        "profiles": 1,
        "pools": 2,
        "irules": 11,
        "nodes": 3,
        "snatPools": 2
    },
    "parseTime": 10.9593,
    "appTime": 7.3337,
    "packTime": 10.6349
},
{
    "objectCount": 13554,
    "objects": {
        "virtuals": 274,
        "profiles": 7,
        "policies": 60,
        "pools": 6099,
        "irules": 40,
        "monitors": 3,
        "nodes": 6100
    },
    "parseTime": 7829.0145,
    "appTime": 5374.7946,
    "packTime": 2.0869
}
]
```