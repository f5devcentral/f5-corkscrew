# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

f5-corkscrew is a TypeScript-based tool for extracting and parsing F5 BIG-IP TMOS configurations from various archive formats (.conf, .ucs, .qkview, .tar.gz). The tool converts TMOS configuration into structured JSON for analysis, application extraction, and migration workflows (e.g., to AS3).

## Development Commands

### Build and Compile

```bash
npm run compile           # Compile TypeScript to dist/
npm run watch            # Watch mode compilation
npm run build-package    # Compile and create npm package
```

### Testing

```bash
npm test                 # Run all Mocha tests with coverage (nyc)
```

Individual test files can be run with:

```bash
npx mocha -r ts-node/register tests/<test-file>.tests.ts
```

Test timeout is configured to 120 seconds in package.json.

### Linting

```bash
npm run lint            # TypeScript check + ESLint
```

### CLI Usage

The compiled CLI tool can be tested locally:

```bash
node dist/cli.js --file <path-to-config>
```

After npm install:

```bash
corkscrew --file <path-to-conf|ucs|qkview>
```

CLI options include `--no_sources`, `--no_file_store`, `--no_command_logs`, `--no_process_logs`, `--includeXmlStats`.

## Architecture Overview

### Core Data Flow

1. **Input Processing** ([unPackerStream.ts](src/unPackerStream.ts))
   - Handles multiple input formats: .conf files, .ucs archives, .qkview archives, .tar.gz
   - Streams archives to avoid loading entire files into memory
   - Emits 'conf' events for config files and 'stat' events for qkview XML stats
   - Returns non-conf files (certs, keys, license) for tree attachment

2. **Config Parsing** ([ltm.ts](src/ltm.ts) - BigipConfig class)
   - Main class that orchestrates all parsing operations
   - `loadParseAsync()`: Entry point that loads and parses archives
   - `parseConf()`: Converts TMOS config into nested JSON structure (configObject)
   - Uses EventEmitter for progress tracking ('parseFile', 'parseObject' events)

3. **Object Structure** ([tmos2json.ts](src/tmos2json.ts), [deepParse.ts](src/deepParse.ts))
   - Converts TMOS parent objects (e.g., "ltm virtual /Common/vs_name { ... }") into JSON hierarchy
   - Parent objects extracted via regex, then merged into main configObject tree
   - Deep parsing applied to specific object types (GTM servers, LTM virtuals, pools, etc.)

4. **Application Extraction** ([digConfigs.ts](src/digConfigs.ts))
   - `digVsConfig()`: Extracts complete application configs by crawling virtual server dependencies
   - Follows references: pools → members → nodes → monitors, profiles, iRules, policies, persistence

5. **Object Counting** ([objCounter.ts](src/objCounter.ts))
   - Counts different object types (virtuals, pools, nodes, etc.) across ltm/gtm/apm/asm

### Key Classes and Modules

- **BigipConfig** ([ltm.ts](src/ltm.ts)): Main class exposing the public API
  - Properties: `configObject`, `configFiles`, `stats`, `hostname`, `tmosVersion`, `fileStore`
  - Key methods: `loadParseAsync()`, `parseConf()`, `explode()`, `apps()`, `logs()`

- **UnPacker** ([unPackerStream.ts](src/unPackerStream.ts)): Archive extraction using streaming
  - Emits events for incremental processing
  - Handles tar/gzip decompression without full memory load

- **RegExTree** ([regex.ts](src/regex.ts)): Version-specific regex patterns for parsing TMOS objects
  - Organized hierarchically: ltm/gtm/apm/asm
  - Supports TMOS version-specific parsing variations

- **Logger** ([logger.ts](src/logger.ts)): Collects logs during processing
  - All errors caught and logged rather than polluting output
  - Logs returned via `BigipConfig.logs()` method

- **XmlStats** ([xmlStats.ts](src/xmlStats.ts)): Parses qkview XML statistics files

### Data Structures

The main configObject follows this pattern:

```typescript
{
  ltm: {
    virtual: { [name: string]: { destination, pool, profiles, rules, ... } },
    pool: { [name: string]: { members, monitor, ... } },
    node: { [name: string]: { address, ... } },
    monitor: { ... },
    profile: { ... },
    rule: { ... },
    ...
  },
  gtm: { ... },
  apm: { ... },
  asm: { ... }
}
```

Each object contains:

- `name`, `partition`, `folder` (if applicable)
- `line`: the original TMOS config string
- Type-specific properties (destination, pool, members, etc.)

### TypeScript Types

Main types defined in [models.ts](src/models.ts):

- `BigipConfObj`: The main nested config structure
- `ConfigFile`: Represents a file with fileName, size, content
- `Explosion`: Return type of explode() method
- `Stats`: Processing statistics and object counts

## Important Implementation Notes

### Memory and Performance

- Nodejs heap limited to 2GB (512MB in VSCode extension context)
- Streaming approach used to avoid loading entire archives into memory
- Typical configs: 6MB file → 340KB compressed, rarely >100K objects
- Target: Handle configs with ~10K virtual servers

### Regex and Parsing

- Uses XRegExp for advanced regex features
- [balancedMatch](node_modules/balanced-match) used for bracket matching in nested TMOS objects
- Parent objects extracted first, then deep-parsed for specific types
- Original config strings preserved in `line` property for reference

### Testing Approach

- Tests in [tests/](tests/) use Mocha with artifacts in [tests/artifacts/](tests/artifacts/)
- Test files follow pattern: `NNN_description.tests.ts`
- Coverage tracked with nyc (istanbul), configured for 50% thresholds

### Versioning

- TMOS version detected from config files, stored in `tmosVersion`
- Regex tree can be modified based on version differences
- Currently handles v11-v17+ configurations

## Project Structure

- **src/**: TypeScript source
  - Core: ltm.ts, index.ts, models.ts, cli.ts
  - Parsing: regex.ts, tmos2json.ts, deepParse.ts, unPackerStream.ts
  - Extraction: digConfigs.ts, digGslb.ts, digCerts.ts, digDoClassesAuto.ts
  - Utils: logger.ts, objCounter.ts, objects.ts, pools.ts, xmlStats.ts
- **tests/**: Mocha test files and artifacts
- **dist/**: Compiled JavaScript output (generated)

## Configuration Files

- **package.json**: Scripts, dependencies, nyc coverage config, mocha timeout (120s)
- **tsconfig.json**: Target ES6, CommonJS modules, output to dist/
- **.eslintrc**: Embedded in package.json, uses @typescript-eslint

## Common Tasks

### Adding Support for New TMOS Objects

1. Update type definitions in [models.ts](src/models.ts) (BigipConfObj type)
2. Add regex patterns in [regex.ts](src/regex.ts)
3. Implement deep parsing logic in [deepParse.ts](src/deepParse.ts) if needed
4. Update [objCounter.ts](src/objCounter.ts) to count new object type
5. Add tests with sample configs in tests/artifacts/

### Debugging Parsing Issues

1. Check logs via `BigipConfig.logs()` method
2. Inspect `configObject` tree structure directly
3. Test regex patterns in [regex.ts](src/regex.ts)
4. Add event listeners: `device.on('parseFile', ...)` and `device.on('parseObject', ...)`

### Working with Archives

- .conf: Direct file read
- .ucs: Extracts config/ directory from tar.gz
- .qkview: Extracts config/ and processes XML stats
- All formats stream through UnPacker class
