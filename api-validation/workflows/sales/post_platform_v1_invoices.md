---
endpoint: "POST /platform/v1/invoices"
domain: sales
tags: [invoices]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: skip
savedAt: 2026-01-26T22:22:22.590Z
verifiedAt: 2026-01-26T22:22:22.590Z
---

# Create Invoices

## Summary
User-approved skip: This endpoint requires OAuth tokens with application+user binding (per source code: oauth_token with application and resource_owner_id). The authentication model expects 'Token {oauth_token}' format rather than 'Bearer' tokens, and requires specific OAuth application setup that's not accessible through current token acquisition methods.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_invoices
    method: POST
    path: "/platform/v1/invoices"
    expect:
      status: [200, 201]
```
