---
endpoint: GET /v3/license/offerings
domain: platform_administration
tags: [license, offerings, billing]
status: verified
savedAt: 2026-01-22T21:38:45.939Z
verifiedAt: 2026-01-22T21:38:45.939Z
timesReused: 0
---
# Get Offerings

## Summary
Successfully retrieve all license offerings - no parameters required

## Prerequisites
Requires staff token authentication

## How to Resolve Parameters
Simple GET request to /v3/license/offerings without any parameters. The error about 'payment_type' parameter being invalid suggests that if filters are needed, they should be applied client-side after receiving the full list.

## Critical Learnings

- **No query parameters needed** - The endpoint works with a simple GET request without any query parameters. Any 'payment_type' or other filters cause 400 errors.
- **Rich offering data** - Returns comprehensive offering details including type, SKU, display_name, quantity, payment_type, prices in multiple currencies, vendor info, and status.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/v3/license/offerings"
}
```

## Documentation Fix Suggestions

No documentation issues found.