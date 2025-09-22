# README.io Swagger Update Scripts

This repository contains scripts to automatically update README.io with OpenAPI/Swagger specifications from the `mcp_swagger` directory.

## Overview

The update process ensures that:
- All swagger files in `mcp_swagger/` are synced to README.io version `v3.1`
- Only changed files are updated (based on modification time tracking)
- Missing categories are automatically created
- All operations are logged and can be run in dry-run mode for testing

## Scripts

### 1. `scripts/update-readme-swaggers.js` (CLI Version)

Uses the README CLI tool (`rdme`) directly for updates.

**Features:**
- Direct CLI integration with `rdme`
- File modification tracking
- Automatic category creation
- Comprehensive logging

**Usage:**
```bash
# Install dependencies first
npm install

# Basic update
npm run update-readme

# With verbose logging
npm run update-readme:verbose

# Dry run (see what would be updated)
npm run update-readme:dry-run

# Force update all files
npm run update-readme:force
```

### 2. `update-readme-mcp.js` (MCP Version)

Uses Model Context Protocol (MCP) tools for better integration when available.

**Features:**
- MCP tool integration (when available)
- Better error handling and reporting  
- Enhanced category validation
- Improved change detection

**Usage:**
```bash
# Basic MCP update
npm run update-readme-mcp

# With verbose logging
npm run update-readme-mcp:verbose

# Dry run
npm run update-readme-mcp:dry-run

# Force update all files
npm run update-readme-mcp:force
```

## Configuration

### API Token Setup

Create or update `mcp_swagger/.dev` with your README API token:

```bash
README_API_TOKEN = "your_readme_api_token_here"
```

### State Tracking

The scripts maintain state in `mcp_swagger/.update-state.json` to track:
- Last update timestamps for each file
- File modification times
- Category information
- Update history

**Example state file:**
```json
{
  "lastUpdate": "2024-01-15T10:30:00.000Z",
  "files": {
    "ai.json": {
      "lastUpdate": 1705315800000,
      "category": "ai",
      "title": "Ai",
      "lastModTime": 1705315600000
    }
  },
  "categories": {
    "ai": {
      "created": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Command Line Options

Both scripts support the same command line options:

- `--dry-run`: Run all operations except creating categories and updating swaggers (reads existing data from README API)
- `--force`: Force update all files regardless of modification time  
- `--verbose`: Enable detailed logging
- `--help`: Show help message

## README.io Integration

### Version Targeting

Both scripts target README.io version `v3.1`. This can be modified in the script configuration.

### Category Management

The scripts will:
1. **Detect missing categories**: Compare swagger files against existing README categories
2. **Create missing categories**: Automatically create categories for new swagger files
3. **Log discrepancies**: Report swagger files without categories and categories without files

### File Validation

Before uploading, each swagger file is validated to ensure:
- Valid OpenAPI/Swagger format (`openapi` or `swagger` field present)
- Required fields exist (`info`, `paths`)
- File can be parsed as valid JSON

## Workflow Integration

### Typical Usage Pattern

1. **Generate unified swaggers**: Run `npm run unify` to create unified swagger files
2. **Review changes**: Use `npm run update-readme:dry-run` to see what would be updated
3. **Update README**: Run `npm run update-readme` to sync changes
4. **Verify**: Check README.io to confirm updates

### CI/CD Integration

```bash
# Example CI/CD workflow
npm run unify:verbose              # Generate unified swaggers
npm run update-readme:dry-run      # Preview changes  
npm run update-readme:verbose      # Update README.io
```

## Troubleshooting

### Common Issues

1. **API Token not found**: Ensure `mcp_swagger/.dev` exists with valid `README_API_TOKEN`

2. **Category creation fails**: Check README.io permissions and API token validity

3. **File upload fails**: Verify swagger file is valid JSON and contains required OpenAPI fields

4. **State file corruption**: Delete `mcp_swagger/.update-state.json` to reset tracking

### Debugging

Use the `--verbose` flag to see detailed execution logs:

```bash
npm run update-readme:verbose
```

This will show:
- File processing details
- API calls being made
- Validation results  
- State changes
- Error details

### Manual Recovery

If automatic updates fail, you can:

1. **Reset state**: Delete `.update-state.json` and run with `--force`
2. **Manual upload**: Use `rdme` CLI directly for specific files
3. **Validate files**: Check swagger files with online validators

## File Structure

```
mcp_swagger/
├── .dev                    # API token configuration
├── .update-state.json      # Update state tracking
├── ai.json                 # Domain swagger files
├── apps.json
├── clients.json
└── ...

scripts/
├── update-readme-swaggers.js   # CLI-based update script
├── unify-openapi.js            # Unify swagger files by domain
└── generate-entity-md.js       # Generate entity markdown docs
```

## Dependencies

- `fs-extra`: Enhanced file system operations
- `rdme`: README.io CLI tool (for CLI version)
- MCP README tools (for MCP version, when available)
