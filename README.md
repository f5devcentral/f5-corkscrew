# f5-corkscrew

A TypeScript-based tool for extracting and parsing F5 BIG-IP TMOS configurations from various sources (.conf, .ucs, .qkview) into structured JSON format for analysis, migration, and automation workflows.

[![GitHub Release](https://img.shields.io/github/v/release/f5devcentral/f5-corkscrew)](https://github.com/f5devcentral/f5-corkscrew/releases)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## Features

- **Multi-format Support**: Parse .conf files, UCS archives, and qkview files
- **Comprehensive Parsing**: Extracts LTM, GTM/DNS, APM, and ASM/WAF configurations
- **Structured Output**: JSON format for easy consumption by automation tools
- **CLI Tool**: Simple command-line interface for quick analysis
- **Library Usage**: Import as npm package for programmatic use
- **High Performance**: Processes large configs (6MB, 13K objects) in ~20 seconds
- **Excellent Test Coverage**: 95.5% code coverage with comprehensive test suite

---

## Quick Start

### Installation

**Global CLI Installation:**
```bash
npm install -g f5-corkscrew
```

**As Project Dependency:**
```bash
npm install f5-corkscrew
```

### Requirements

- **Node.js**: v22 or higher
- **npm**: v10 or higher

Check your versions:
```bash
node --version && npm --version
```

---

## Usage

### Command Line Interface

**Basic Usage:**
```bash
corkscrew --file /path/to/bigip.conf
```

**Process UCS Archive:**
```bash
corkscrew --file /path/to/backup.ucs > output.json
```

**Process qkview with XML stats:**
```bash
corkscrew --file /path/to/diagnostics.qkview --includeXmlStats > output.json
```

**CLI Options:**
- `--file` - Path to config file (.conf, .ucs, .qkview, .tar.gz)
- `--no_sources` - Exclude source config files from output (default: true)
- `--no_file_store` - Exclude filestore files (certs/keys) from output (default: true)
- `--no_command_logs` - Suppress command execution logs (default: true)
- `--no_process_logs` - Suppress parsing logs (default: true)
- `--includeXmlStats` - Include qkview XML statistics (default: false)

### Programmatic Usage

```typescript
import BigipConfig from 'f5-corkscrew';

async function parseConfig() {
  const bigip = new BigipConfig();

  // Load and parse config
  await bigip.loadParseAsync('/path/to/config.ucs');

  // Extract all applications
  const explosion = await bigip.explode();

  console.log(`Found ${explosion.config.apps.length} applications`);
  console.log(`Parsed in ${explosion.stats.parseTime}ms`);
}
```

### Working with Output

**Using jq for JSON Processing:**
```bash
# List all virtual servers
corkscrew --file config.ucs | jq '.output.config.apps[].name'

# Get specific application details
corkscrew --file config.ucs | jq '.output.config.apps[] | select(.name == "/Common/app1_vs")'

# Extract statistics
corkscrew --file config.ucs | jq '.output.stats'
```

**Example Output Structure:**
```json
{
  "output": {
    "config": {
      "apps": [
        {
          "name": "/Common/app1_vs",
          "config": "ltm virtual /Common/app1_vs { ... }",
          "map": {
            "name": "/Common/app1_vs",
            "destination": "192.168.1.10:443",
            "pool": "/Common/app1_pool"
          }
        }
      ]
    },
    "stats": {
      "objectCount": 153,
      "objects": {
        "virtuals": 7,
        "pools": 7,
        "nodes": 10,
        "monitors": 6
      },
      "parseTime": 5478.3
    }
  }
}
```

---

## Supported TMOS Objects

### LTM (Local Traffic Manager)
- Virtual Servers
- Pools & Pool Members
- Nodes
- Monitors (HTTP, HTTPS, TCP, etc.)
- Profiles (HTTP, TCP, Client-SSL, Server-SSL)
- iRules
- Local Traffic Policies (LTPs)
- Persistence Profiles
- SNAT Pools
- Data Groups
- Virtual Addresses

### GTM/DNS (Global Traffic Manager)
- Wide IPs (A, AAAA, CNAME, MX, etc.)
- Pools (all DNS record types)
- Servers
- Data Centers
- Regions

### APM (Access Policy Manager)
- Access Profiles
- Access Policies

### ASM/WAF (Application Security Manager)
- Security Policies

### Security
- Bot Defense Profiles
- DoS Profiles

---

## Architecture

### Core Components

- **BigipConfig Class** ([src/ltm.ts](src/ltm.ts)) - Main parsing orchestrator
- **UnPacker** ([src/unPackerStream.ts](src/unPackerStream.ts)) - Streams archives without full memory load
- **DeepParse** ([src/deepParse.ts](src/deepParse.ts)) - Detailed object-level parsing
- **RegExTree** ([src/regex.ts](src/regex.ts)) - Version-specific regex patterns
- **XmlStats** ([src/xmlStats.ts](src/xmlStats.ts)) - qkview statistics processing

### Data Flow

1. **Input Processing**: Archives streamed, .conf files read directly
2. **Parent Object Extraction**: Regex extracts top-level TMOS objects
3. **Deep Parsing**: Detailed parsing of nested configurations
4. **Tree Merging**: All objects merged into single JSON structure
5. **Application Extraction**: Virtual servers + dependencies extracted

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

---

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/f5devcentral/f5-corkscrew.git
cd f5-corkscrew

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Lint code
npm run lint
```

### Project Scripts

- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm test` - Run test suite with coverage
- `npm run lint` - Run TypeScript compiler check and ESLint
- `npm run build-package` - Build and create npm package
- `npm run build-code-docs` - Generate TypeDoc documentation

### Testing

Comprehensive test suite with 95.5% coverage:

```bash
# Run all tests
npm test

# Tests are organized by feature
tests/
├── 010_json_objects.test.ts      # Core object parsing
├── 020_unPacker.tests.ts         # Archive extraction
├── 030_dnsDetails.tests.ts       # GTM/DNS parsing
├── 037_ltmDetails.tests.ts       # LTM parsing
├── 040_waf.tests.ts              # ASM/WAF parsing
└── 050_conf_file.tests.ts        # Config file processing
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Follow JSDoc documentation standards
5. Ensure tests pass (`npm test`)
6. Submit a pull request

See [ENHANCEMENTS.md](ENHANCEMENTS.md) for improvement opportunities.

---

## Performance

**Typical Performance:**
- 6MB config file
- ~300 virtual servers
- 223K lines
- 13K TMOS objects
- **Processing Time: ~20 seconds**

**Memory Efficient:**
- Streaming architecture for archives
- Minimal memory footprint
- Handles configs up to 50MB

**Statistics Tracking:**
- File sizes and object counts
- Parse time breakdown
- Performance metrics included in output

---

## Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[CLAUDE.md](CLAUDE.md)** - Architecture and development guide for AI assistants
- **[ENHANCEMENTS.md](ENHANCEMENTS.md)** - Improvement opportunities and technical debt
- **[testingStats.md](testingStats.md)** - Performance benchmarks

---

## Version History

### v1.5.0 (2025-10-30)
- Updated all dependencies to latest versions
- Upgraded to Node 22 and ES2022 target
- Major dependency updates: TypeScript 5.9.3, Mocha 11.7.4, ESLint 9.38.0
- Improved TypeScript type safety
- See [CHANGELOG.md](CHANGELOG.md) for complete details

### Previous Versions
- v1.4.2 - Bug fixes for partition special characters
- v1.4.1 - Object counter bug fixes
- v1.4.0 - VS rank nesting and UCS parsing improvements

---

## Support

**Community Support:**
- 📝 [GitHub Issues](https://github.com/f5devcentral/f5-corkscrew/issues) - Report bugs or request features
- 💬 [F5 DevCentral](https://community.f5.com/) - Community discussions

**Note:** This is a community-supported project and is not officially supported by F5 Networks.

---

## License

This project is licensed under the Apache License 2.0 - see [LICENSE](LICENSE) file for details.

---

## Copyright

Copyright 2014-2025 F5 Networks Inc.

### F5 Networks Contributor License Agreement

Before contributing to any project sponsored by F5 Networks, Inc. (F5) on GitHub, you will need to sign a Contributor License Agreement (CLA).

If you are signing as an individual, we recommend that you talk to your employer (if applicable) before signing the CLA since some employment agreements may have restrictions on your contributions to other projects.

If you are signing on behalf of a company, you represent that you are legally entitled to grant the license recited therein.

---

## Community Code of Conduct

Please refer to the [F5 DevCentral Community Code of Conduct](code_of_conduct.md).
