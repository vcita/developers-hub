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

**Option A: Manual Configuration**

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

**Option B: Automatic Setup (Recommended)**

If you have a directory token, you can automatically create a new business with all required test data:

```bash
# Step 1: Create business, staff token, and test client
npm run setup:business

# Step 2 (Optional): Create offering and subscription (requires admin token)
npm run setup:offering -- --sku "platinum20"
```

**setup:business** creates:
- A new business with admin user
- Staff and client tokens
- A test client with a matter

**setup:offering** creates:
- An offering with the specified SKU
- A directory offering linking it to your directory
- A subscription for the business

See [Setup Business CLI](#setup-business-cli) and [Setup Offering CLI](#setup-offering-cli) sections for more details.

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
├── scripts/
│   ├── setup-business.js   # Business setup CLI
│   └── setup-offering.js   # Offering/subscription setup CLI
├── config/
│   ├── default.json        # Default configuration
│   └── tokens.example.json # Token template
├── workflows/              # Learned API workflows
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

## Setup Business CLI

The setup-business script automates the creation of a test business with all required data for API validation.

### Prerequisites

You need a **directory token** in your `tokens.json` file. This token is used to create new businesses in the platform.

### Usage

```bash
# Create a new business with default settings
npm run setup:business

# Preview what would be done (no changes)
npm run setup:business:dry-run

# Custom business name
npm run setup:business -- --name "My Test Business"

# Custom admin email
npm run setup:business -- --email "custom@example.com"

# Show help
node api-validation/scripts/setup-business.js --help
```

### Options

| Option | Description |
|--------|-------------|
| `--name <name>` | Custom business name (default: "API Test Business <timestamp>") |
| `--email <email>` | Custom admin email (default: "apitest+<timestamp>@vcita.com") |
| `--dry-run` | Show what would be done without making changes |
| `-h, --help` | Show help message |

### What It Does

1. **Creates a New Business** - Fresh business account with admin user
2. **Generates Staff Token** - API token for the business owner
3. **Creates Test Client** - Client contact for testing
4. **Retrieves Matter UID** - Gets the automatically created client matter

### What It Updates

The script updates `tokens.json` with:

```json
{
  "tokens": {
    "staff": "<new staff token>",
    "business": "<same as staff token>",
    "client": "<JWT client token>"
  },
  "params": {
    "business_uid": "<new business uid>",
    "business_id": "<new business uid>",
    "staff_uid": "<staff member uid>",
    "staff_id": "<staff member uid>",
    "client_uid": "<test client uid>",
    "client_id": "<test client uid>",
    "matter_uid": "<client's matter uid>",
    "directory_id": "<directory uid>"
  }
}
```

### Important Notes

- **Feature Flags**: Newly created businesses may not have all features enabled. If you encounter 403 errors with "feature is disabled" messages, contact your administrator to enable the required features.
- **Cleanup**: The script does not delete old businesses. If you need to clean up test data, do so manually.

### Example Output

```
╔════════════════════════════════════════╗
║       Setup Business CLI               ║
╚════════════════════════════════════════╝

Using directory token: 1eb05f4ba6682061e84e...

[1/4] Creating new business...
  Name: API Test Business 1769781482
  Admin Email: apitest+1769781482@vcita.com
  ✓ Business created
    Business UID: 00wutb5f1a08a8kn
    Staff UID: 4m52ud4x9q7eyw0n

[2/4] Creating staff token...
  ✓ Staff token created

[3/4] Creating test client...
  ✓ Client created
    Client UID: 88lmybw31ceh10hd

[4/4] Getting matter UID...
  ✓ Matter found
    Matter UID: qsaaxaf1cxlrb25b

════════════════════════════════════════
Setup completed successfully!
════════════════════════════════════════
```

## Setup Offering CLI

The setup-offering script automates the creation of offerings, directory offerings, and business subscriptions for license/subscription testing.

### Prerequisites

You need the following in your `tokens.json` file:
- **Admin token** (`tokens.admin`) - For creating offerings and directory offerings
- **Staff token** (`tokens.staff`) - For subscribing the business
- **Directory ID** (`params.directory_id`) - Run `setup-business` first

### Usage

```bash
# Create an offering with default settings
npm run setup:offering

# Preview what would be done (no changes)
npm run setup:offering:dry-run

# Custom SKU
npm run setup:offering -- --sku "platinum20"

# Custom display name
npm run setup:offering -- --sku "platinum20" --name "Platinum 20 Plan"

# Show help
node api-validation/scripts/setup-offering.js --help
```

### Options

| Option | Description |
|--------|-------------|
| `--sku <sku>` | SKU for the offering (default: "test_offering_<timestamp>") |
| `--name <name>` | Display name (default: derived from SKU) |
| `--payment-type <type>` | Payment type: "external" or "vcita" (default: "external") |
| `--dry-run` | Show what would be done without making changes |
| `-h, --help` | Show help message |

### What It Does

1. **Creates an Offering** - New offering with specified SKU and payment type
2. **Creates Directory Offering** - Links the offering to your directory
3. **Subscribes Business** - Creates a subscription for the business to the offering

### What It Updates

The script updates `tokens.json` with:

```json
{
  "offerings": {
    "platinum20": {
      "offering_uid": "<offering uid>",
      "directory_offering_uid": "<directory offering uid>",
      "subscription_uid": "<subscription uid>",
      "display_name": "Platinum 20",
      "created_at": "2026-01-30T14:36:25.392Z"
    },
    "_latest": "platinum20"
  }
}
```

### Important Notes

- **Admin Token Format**: The admin token uses `Authorization: Admin <token>` format, not Bearer
- **External Payment Type**: When using `payment_type: external`, the prices array must be empty (`[]`) - the system will auto-populate default `-1.00` prices
- **Staff Token Required**: Subscription creation requires a **Staff token** (not Directory token). For `external` payment type offerings, the Staff token must be created by a Directory token (via `POST /platform/v1/tokens`), which gives it an "on-behalf-of" relationship. The `setup-business` script creates this type of token automatically.

### Example Output

```
╔════════════════════════════════════════╗
║       Setup Offering CLI               ║
╚════════════════════════════════════════╝

Using admin token: kjh7tdewt...
Using staff token: 99673434a8b26c61...
Using directory: qcpvme5au9c3vf0h

[1/3] Creating offering...
  SKU: platinum20
  Name: Platinum 20
  Payment Type: external
  ✓ Offering created
    Offering UID: 618f2ff2-a17a-46f6-b5d9-368591fe7087

[2/3] Creating directory offering...
  Directory: qcpvme5au9c3vf0h
  Offering: 618f2ff2-a17a-46f6-b5d9-368591fe7087
  ✓ Directory offering created
    Directory Offering UID: 9f49c4f3-f075-4dfb-8bb0-7dbc5bf5cd9b

[3/3] Subscribing business to offering...
  Offering: 618f2ff2-a17a-46f6-b5d9-368591fe7087
  ✓ Subscription created
    Subscription UID: ac4ce20d-d6fa-4b38-b06b-d3c7fb109fdb
    Buyer UID: 4m52ud4x9q7eyw0n
    Business UID: 00wutb5f1a08a8kn

════════════════════════════════════════
Setup completed successfully!
════════════════════════════════════════

Summary:
  SKU:                    platinum20
  Offering UID:           618f2ff2-a17a-46f6-b5d9-368591fe7087
  Directory Offering UID: 9f49c4f3-f075-4dfb-8bb0-7dbc5bf5cd9b
  Subscription UID:       ac4ce20d-d6fa-4b38-b06b-d3c7fb109fdb
  Business UID:           00wutb5f1a08a8kn
```

## Contributing

1. Keep validation logic in `src/core/` for reuse between CLI and UI
2. Follow existing patterns for new validators
3. Add friendly messages for new failure reasons
4. Test with `--dry-run` before running against staging
