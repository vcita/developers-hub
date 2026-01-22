# Workflow Repository

A searchable, LLM-friendly repository of verified API workflows for the validation framework.

## Purpose

This repository stores successful API test workflows that can be:
- **Reused** by the AI healer to quickly fix similar failures
- **Referenced** by developers to understand API requirements
- **Searched** by future agentic frameworks

## Structure

```
workflows/
├── index.json           # Quick lookup index (auto-generated)
├── README.md            # This file
├── sales/               # Domain-specific folders
│   ├── payment_packages.md
│   └── invoices.md
├── clients/
│   └── client_packages.md
└── payments/
    └── transactions.md
```

## Workflow File Format

Each workflow is stored as a Markdown file with YAML frontmatter:

```markdown
---
endpoint: POST /platform/v1/payment/packages
domain: sales
tags: [packages, payments, services]
status: verified
savedAt: 2026-01-22T10:30:00Z
verifiedAt: 2026-01-22T10:30:00Z
timesReused: 0
---

# Create Payment Package

## Summary
Brief description of what this endpoint does.

## Prerequisites
What you need before calling this endpoint.

## How to Resolve Parameters
Step-by-step guide to get required parameters.

## Critical Learnings
Important gotchas discovered during testing.

## Verified Successful Request
The exact request that worked.

## Documentation Fix Suggestions
Issues found in the API documentation.
```

## Searching Workflows

### By Endpoint (exact)
```javascript
const workflow = repository.get('POST /platform/v1/payment/packages');
```

### By Domain
```javascript
const salesWorkflows = repository.list('sales');
```

### By Tag
```javascript
const results = repository.search({ tags: ['payments'] });
```

### Full-text Search
```bash
grep -r "products must be" workflows/
```

## How Workflows Are Created

1. A test fails during validation
2. The AI healer analyzes and fixes the issue
3. **Verification**: The fix must return a 2xx response
4. Only after verification, the workflow is saved
5. The index.json is automatically updated

## Using in Other Agents

```javascript
const repository = require('./src/core/workflows/repository');

// Search for relevant workflows
const workflow = repository.get('POST /platform/v1/payment/packages');

// Get all workflows for a domain
const salesWorkflows = repository.list('sales');

// Search by tags
const results = repository.search({ tags: ['payments'] });
```

## Index Structure

The `index.json` provides fast lookups:

```json
{
  "version": "1.0",
  "workflows": {
    "POST /platform/v1/payment/packages": {
      "file": "sales/payment_packages.md",
      "domain": "sales",
      "tags": ["packages", "payments"],
      "status": "verified"
    }
  },
  "byDomain": { "sales": [...] },
  "byTag": { "payments": [...] }
}
```

## Best Practices

1. **Always verify before saving** - Workflows must have a successful API call
2. **Document learnings** - Include gotchas and non-obvious requirements
3. **Use meaningful tags** - Help future searches find relevant workflows
4. **Keep prerequisites clear** - Explain what's needed before the call
