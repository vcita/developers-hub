# API Validation

Automated validation tool for testing API documentation accuracy against live endpoints.

## Overview

This tool parses OpenAPI specs from `mcp_swagger/`, executes live API calls against your staging/devspace environment, and validates that actual responses match the documented schemas.

### Key Features

- **Live API Testing** - Actually calls endpoints and validates responses
- **Token Validation** - Fails if token availability is not documented
- **Smart Test Ordering** - Runs Create before Get to ensure valid data
- **Rate Limiting** - Configurable request rate with 429 auto-retry
- **Detailed Reports** - JSON reports with friendly failure messages
- **Web Dashboard** - Interactive UI for endpoint selection and testing

## Quick Start

### 1. Install Dependencies

From the repository root:

```bash
npm install
```

### 2. Configure Tokens

Copy the token template and add your tokens:

```bash
cp api-validation/config/tokens.example.json api-validation/config/tokens.json
```

Edit `api-validation/config/tokens.json`:

```json
{
  "tokens": {
    "staff": "eyJ...",
    "client": "eyJ...",
    "directory": "eyJ..."
  }
}
```

### 3. Configure Base URL

Edit `api-validation/config/default.json`:

```json
{
  "baseUrl": "https://your-devspace.vcita.biz"
}
```

### 4. Run Validation

**CLI:**
```bash
npm run validate
```

**Web Dashboard:**
```bash
npm run validate:ui
# Open http://localhost:3500
```

## CLI Usage

```bash
# Full validation (all domains)
npm run validate

# Single domain
npm run validate -- --domain=ai

# Dry-run (validate docs without API calls)
npm run validate:dry-run

# Strict mode (stop on first documentation issue)
npm run validate:strict

# Save report to file
npm run validate -- --output=api-validation/reports/run.json

# Rate limiting
npm run validate -- --rate-limit=conservative  # 2 req/s, careful
npm run validate -- --rate-limit=aggressive    # 20 req/s, fast
npm run validate -- --concurrent=5 --delay=100 # Custom settings

# Include DELETE operations (destructive!)
npm run validate -- --include-delete
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-d, --domain <name>` | Filter by domain (ai, apps, clients, etc.) |
| `-m, --method <method>` | Filter by HTTP method |
| `--dry-run` | Parse and validate docs without API calls |
| `--strict` | Stop on first documentation issue |
| `-q, --quiet` | Minimal output |
| `-o, --output <path>` | Save report to JSON file |
| `--rate-limit <preset>` | Rate limit preset (conservative/normal/aggressive/sequential) |
| `--concurrent <n>` | Max concurrent requests |
| `--delay <ms>` | Delay between requests in ms |
| `--include-delete` | Include DELETE operations |
| `--show-passing` | Show passing tests in output |
| `--base-url <url>` | Override base URL |

## Web Dashboard

Start the dashboard server:

```bash
npm run validate:ui
```

Open http://localhost:3500 in your browser.

### Features

- **Endpoint Browser** - View all endpoints grouped by domain
- **Filters** - Filter by domain, method, token type, or search
- **Multi-select** - Select specific endpoints to test
- **Rate Limiting Controls** - Adjust request rate in real-time
- **Live Progress** - Real-time test progress with SSE
- **Detailed Results** - Expandable failure details with suggestions

## Configuration

### config/default.json

```json
{
  "swaggerPath": "../mcp_swagger",
  "baseUrl": "https://your-devspace.vcita.biz",
  "tokens": {
    "staff": "",
    "client": "",
    "directory": ""
  },
  "options": {
    "timeout": 30000,
    "runDelete": false,
    "stopOnDocIssue": true,
    "retryOnTimeout": 2
  },
  "rateLimit": {
    "requestsPerSecond": 5,
    "maxConcurrent": 3,
    "delayBetweenRequests": 200,
    "retryOn429": true,
    "maxRetries": 3,
    "backoffMultiplier": 2
  }
}
```

### Rate Limit Presets

| Preset | Req/sec | Concurrent | Delay | Use Case |
|--------|---------|------------|-------|----------|
| **conservative** | 2 | 1 | 500ms | Shared staging |
| **normal** | 5 | 3 | 200ms | Default for devspace |
| **aggressive** | 20 | 10 | 50ms | Dedicated test env |
| **sequential** | 1 | 1 | 1000ms | Debugging |

## Token Documentation

The validator checks that every endpoint has token availability documented. Accepted patterns:

- `Available for **Staff Tokens**`
- `**Available for Staff tokens only**`
- `**Only available for Directory Tokens**`
- `Available for **Directory, Business, and Client Tokens**`

If an endpoint is missing token documentation, validation will fail with:

```
MISSING_TOKEN_DOCUMENTATION: No token availability found in description.
Add 'Available for **{Token} Tokens**' to the description.
```

## Test Ordering

Tests are ordered by resource to ensure valid data:

1. **POST (Create)** - Creates resource, captures UID
2. **GET (List)** - Validates created item appears
3. **GET (Single)** - Uses captured UID
4. **PUT/PATCH (Update)** - Uses captured UID
5. **DELETE** - Only if `--include-delete` (uses captured UID)

## Report Format

```json
{
  "summary": {
    "timestamp": "2026-01-19T14:30:00Z",
    "environment": "staging",
    "baseUrl": "https://devspace.vcita.biz",
    "total": 250,
    "passed": 235,
    "failed": 10,
    "skipped": 5,
    "passRate": "94%",
    "duration": "4m 32s"
  },
  "documentationIssues": [...],
  "results": [...],
  "byDomain": {...}
}
```

### Failure Reasons

| Code | Description |
|------|-------------|
| `MISSING_TOKEN_DOCUMENTATION` | No token info in description |
| `SCHEMA_MISMATCH` | Response doesn't match schema |
| `MISSING_REQUIRED_FIELD` | Required field not present |
| `TYPE_MISMATCH` | Field type differs from schema |
| `UNEXPECTED_STATUS_CODE` | Wrong HTTP status code |
| `AUTH_FAILED` | 401/403 response |
| `ENDPOINT_NOT_FOUND` | 404 response |
| `TIMEOUT` | Request timed out |
| `RATE_LIMITED` | 429 response |

## Project Structure

```
api-validation/
├── src/
│   ├── core/               # Shared validation logic
│   │   ├── config/         # Configuration loading
│   │   ├── parser/         # Swagger & token parsing
│   │   ├── validator/      # Schema & doc validation
│   │   ├── orchestrator/   # Test sequencing
│   │   ├── runner/         # API client & rate limiting
│   │   ├── reporter/       # Report generation
│   │   └── utils/          # Utilities
│   ├── cli/                # CLI entry point
│   ├── server/             # Express server for UI
│   │   └── routes/         # API routes
│   └── ui/                 # Web dashboard
│       ├── css/
│       └── js/
├── config/
│   ├── default.json        # Default configuration
│   └── tokens.example.json # Token template
├── reports/                # Generated reports (gitignored)
└── README.md
```

## Development

### Running Tests

```bash
# From repo root
npm run validate -- --dry-run  # Test without API calls
```

### Adding New Token Patterns

Edit `src/core/parser/token-parser.js` to add new regex patterns or token types.

### Extending Reports

Edit `src/core/reporter/report-generator.js` to add new fields or report formats.

## Troubleshooting

### "Configuration errors: At least one token must have a value"

You need to configure tokens. Copy `tokens.example.json` to `tokens.json` and add your JWT tokens.

### "swaggerPath does not exist"

The swagger path is relative to the config directory. Default `../mcp_swagger` should point to `developers-hub/mcp_swagger/`.

### "MISSING_TOKEN_DOCUMENTATION" errors

The endpoint description needs to include token availability. Update the swagger spec to include one of the documented patterns.

### Rate Limited (429)

The tool auto-retries 429 responses. If you're hitting rate limits frequently, use:
```bash
npm run validate -- --rate-limit=conservative
```

## Contributing

1. Keep validation logic in `src/core/` for reuse between CLI and UI
2. Follow existing patterns for new validators
3. Add friendly messages for new failure reasons
4. Test with `--dry-run` before running against staging
