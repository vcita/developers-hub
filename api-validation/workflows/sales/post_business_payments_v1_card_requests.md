---
endpoint: POST /business/payments/v1/card_requests
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T09:24:24.672Z
verifiedAt: 2026-01-23T09:24:24.672Z
timesReused: 0
---
# Create Card requests

## Summary
Successfully created card request after configuring Stripe as primary payment gateway. The business needed a primary payment gateway that supports client card on file functionality.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| client_uid | Already resolved from parameters | - | No |

```json
{
  "client_uid": {
    "resolved_value": "2l2ut3opxv7heqcq",
    "source_endpoint": "Already resolved from parameters",
    "used_fallback": false
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/payments/v1/card_requests",
  "body": {
    "card_request": {
      "client_uid": "2l2ut3opxv7heqcq",
      "channel": "email",
      "channel_value": "client@example.com",
      "alpha2": "US"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| payment_gateway_configuration | The endpoint requires a primary payment gateway that supports client card on file, but this prerequisite is not documented | Add documentation that explains the business must have a primary payment gateway configured that supports client card on file functionality (like Stripe with client_save_card_standalone: true) | major |
| error_message | The error message could be more helpful by suggesting how to resolve the payment gateway issue | Improve error message to include guidance on configuring a compatible payment gateway | minor |