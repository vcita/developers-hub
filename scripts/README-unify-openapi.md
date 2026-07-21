# OpenAPI Unification Script

A Node.js script that unifies multiple OpenAPI/Swagger JSON files within domain folders into single, consolidated specifications with intelligent path normalization and conflict resolution.

## 🎯 Purpose

This script solves the problem of managing multiple OpenAPI specification files across different domains by:
- **Consolidating** multiple API specs into single domain files
- **Normalizing paths** by resolving different base paths and server URLs
- **Resolving conflicts** intelligently when duplicate paths or schemas exist
- **Maintaining traceability** with detailed generation metadata

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm

### Installation
```bash
# Install dependencies
npm install
```

### Basic Usage
```bash
# Run the unification script
node scripts/unify-openapi.js

# With verbose logging
node scripts/unify-openapi.js --verbose

# Preview what will be processed (dry run)
node scripts/unify-openapi.js --dry-run --verbose
```

## 📁 Directory Structure

### Input Structure
```
swagger/
├── ai/
│   ├── bizai.json
│   ├── recommendations.json
│   └── ...
├── clients/
│   ├── client_settings.json
│   ├── legacy/
│   │   ├── legacy_v1_clients.json
│   │   └── ...
│   └── ...
└── ...
```

### Output Structure
```
mcp_swagger/
├── ai.json                    # Unified AI domain API
├── clients.json               # Unified Clients domain API
├── communication.json         # Unified Communication domain API
├── platform_administration.json
└── ...
```

## ⚙️ Features

### 🔄 Smart Path Normalization

The script handles different base path formats seamlessly:

### 📚 Automatic Swagger 2.0 to OpenAPI 3.1 Conversion

When processing Swagger 2.0 files, the script automatically converts them to modern OpenAPI 3.1 format:

**Converted Properties:**
- `consumes` → `requestBody.content`
- `produces` → `responses[status].content`
- `definitions` → `components.schemas`
- Parameter `type: "string"` → `schema: {type: "string"}`
- Body parameters (`in: "body"`) → `requestBody`
- `collectionFormat: "multi"` → `style: "form", explode: true`
- `examples` → `example` (in responses)

**Preserved Valid Properties:**
- `contains` - Valid JSON Schema Draft 7 keyword for array validation
- All other valid OpenAPI 3.1/JSON Schema properties

**Security Enhancement:**
- **Bearer Authentication** automatically added to all endpoints
- JWT token support with proper `securitySchemes` definition
- Consistent authentication across all unified APIs

This ensures all generated files are valid OpenAPI 3.1 specifications.

**Swagger 2.0 Files:**
```json
{
  "basePath": "/platform/v1",
  "paths": {
    "/clients": { ... }
  }
}
```
→ Results in: `/platform/v1/clients`

**OpenAPI 3.1 Files:**
```json
{
  "servers": [{"url": "https://api.vcita.biz/v3"}],
  "paths": {
    "/auth/token": { ... }
  }
}
```
→ Results in: `/v3/auth/token`

### 🛡️ Intelligent Conflict Resolution

When conflicts occur, the script:
- **Path Conflicts**: Uses the file with the most recent modification date
- **Schema Conflicts**: Renames conflicting schemas with file suffixes
- **Logs all resolutions** for transparency and debugging

### 📊 Comprehensive Metadata

Each generated file includes:
```json
{
  "info": {
    "x-generated": {
      "timestamp": "2024-01-20T10:30:00Z",
      "sourceFiles": ["apps.json", "legacy_v1_apps.json"],
      "pathNormalizations": [...],
      "pathConflicts": [...],
      "componentConflicts": [...],
      "totalPaths": 16,
      "totalComponents": 8
    }
  }
}
```

## 🖥️ Command Line Options

```bash
node scripts/unify-openapi.js [options]

Options:
  --input-dir <dir>     Input directory (default: ./swagger)
  --output-dir <dir>    Output directory (default: ./mcp_swagger)
  --verbose             Enable detailed logging
  --dry-run            Preview processing without writing files
  --flatten-refs        Inline external $ref URLs that live in this repo
                        (alias: --inline-refs)
  --refs-base-url <url> External ref URL prefix to flatten
                        (default: https://vcita.github.io/developers-hub/)
  --refs-base-dir <dir> Local dir the ref URL prefix maps to (default: .)
  --help               Show help message
```

### Examples

```bash
# Custom directories
node scripts/unify-openapi.js --input-dir ./api-specs --output-dir ./unified-apis

# Verbose dry run to see what would happen
node scripts/unify-openapi.js --dry-run --verbose

# Custom output directory with verbose logging
node scripts/unify-openapi.js --output-dir ./dist/apis --verbose

# Flatten external entity references into inline JSON
node scripts/unify-openapi.js --flatten-refs
```

### 🔗 Flattening External References

By default the unified specs keep external `$ref` URLs such as
`https://vcita.github.io/developers-hub/entities/response.json`. Those entities
actually live in this repo (the URL prefix maps to the repo root, so the ref
above resolves to `entities/response.json` on disk), but ReadMe and some other
tooling cannot dereference the external URLs.

Passing `--flatten-refs` (alias `--inline-refs`) walks each unified spec and
replaces every external `$ref` with the inline JSON it points to, producing a
self-contained specification:

- Only refs beginning with `--refs-base-url` are touched; internal refs
  (`#/components/schemas/...`, `#/definitions/...`) are left untouched.
- Both whole-file refs and refs with a JSON Pointer fragment
  (`.../invoice.json#/properties/status`) are supported.
- Nested external refs inside inlined entities are resolved recursively, with a
  cycle guard that leaves circular refs in place and logs a warning.
- Ref targets missing on disk are left in place and reported in the summary.

## 📈 Script Output

### Successful Execution Example
```
[INFO] Starting OpenAPI unification process...
[INFO] Found domains: ai, apps, clients, communication, ...
[INFO] Processing domain: clients
[INFO] Domain clients: Unified 5 files into 46 paths
[INFO] Created unified file: mcp_swagger/clients.json

=== UNIFICATION SUMMARY ===
Domains processed: 10/10
Total files processed: 49
Total paths generated: 254
Total conflicts resolved: 8

Domain breakdown:
  ai: 5 files → 9 paths
  clients: 5 files → 46 paths
  sales: 5 files → 50 paths
  ...
```

### Conflict Resolution Logging
```
[WARN] Path conflict: /v3/license/business_carts - using license_internal.json over existing
[WARN] Schema conflict: Response renamed to Response_widgets_and_boards (from widgets_and_boards.json)
```

## 🔧 Configuration

### Supported File Types
- **OpenAPI 3.0+** (`openapi` field) - Upgraded to OpenAPI 3.1
- **Swagger 2.0** (`swagger` field) - **Auto-converted to OpenAPI 3.1**
- **JSON format only** (`.json` extensions)

### Automatic File Detection
The script automatically:
- Recursively scans all subdirectories
- Validates OpenAPI/Swagger specifications
- Skips invalid or backup files (`.bak`, `~`, etc.)
- Sorts files by modification time for conflict resolution

## 🎯 Path Normalization Examples

| Source File | Base Path/Server | Original Path | Final Unified Path |
|-------------|------------------|---------------|-------------------|
| `legacy_v1_clients.json` | `/platform/v1` | `/clients` | `/platform/v1/clients` |
| `clients_payments.json` | `/client/payments` | `/v1/cards` | `/client/payments/v1/cards` |
| `authbridge.json` | `https://api.vcita.biz/v3/` | `/auth/token` | `/v3/auth/token` |
| `bizai.json` | `https://api.vcita.biz` | `/ai/chat` | `/ai/chat` |

## 📋 Generated File Structure

Each unified file follows this structure:
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Unified Domain API",
    "description": "Unified OpenAPI specification for domain",
    "version": "3.0",
    "x-generated": { ... }
  },
  "servers": [
    {
      "url": "https://api.vcita.biz",
      "description": "Unified API Gateway server"
    }
  ],
  "paths": { ... },
  "components": { ... },
  "tags": [ ... ]
}
```

## 🐛 Troubleshooting

### Common Issues

**No files processed in a domain:**
- Ensure JSON files contain valid OpenAPI/Swagger specifications
- Check that files have `openapi`/`swagger`, `info`, and `paths` fields

**Schema conflicts:**
- Review the `x-generated.componentConflicts` metadata in output files
- Conflicting schemas are automatically renamed with file suffixes

**Path normalization issues:**
- Check the `x-generated.pathNormalizations` metadata
- Verify server URLs and basePath values in source files

**Swagger 2.0 conversion issues:**
- The script automatically converts Swagger 2.0 to OpenAPI 3.1
- Check for `requestBody` instead of `consumes` in generated files
- Parameters now use `schema: {type: "string"}` format
- Use `--verbose` to see conversion debug messages

### Verbose Logging
Use `--verbose` flag to see detailed processing information:
```bash
node scripts/unify-openapi.js --verbose
```

## 📝 NPM Scripts

Available package scripts:
```bash
# Standard run
npm run unify

# With verbose logging
npm run unify:verbose

# Dry run with verbose output
npm run unify:dry-run

# Flatten external entity references into inline JSON
npm run unify:flatten
```

## 🔄 Re-running the Script

The script can be run multiple times safely:
- **Overwrites existing files** in the output directory
- **Uses latest file modification times** for conflict resolution
- **Updates generation timestamps** automatically

## 📊 Performance

Typical performance metrics:
- **49 files processed** in ~2-3 seconds
- **254 paths generated** with full validation
- **Memory usage**: ~50MB peak for large API collections

## 🤝 Contributing

### Adding New Features
The script is modular with separate functions for:
- `extractBasePath()` - Base path extraction logic
- `normalizeEndpoints()` - Path normalization
- `mergeComponents()` - Component merging with conflict resolution
- `processDomain()` - Domain-level processing

### Testing
```bash
# Test with dry run
node unify-openapi.js --dry-run --verbose

# Test specific directory
node unify-openapi.js --input-dir ./test-swagger --dry-run
```

## 📄 License

ISC License - See package.json for details.

---

**Generated unified APIs are ready for use with tools like:**
- Swagger UI
- Postman
- API documentation generators
- Code generation tools
- API testing frameworks
