---
endpoint: POST /business/payments/v1/carts
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:03:49.385Z
verifiedAt: 2026-01-23T22:03:49.385Z
timesReused: 0
---
# Create Carts

## Summary
Cart creation endpoint works correctly when valid service UIDs are provided. The original error was caused by using a non-existent service UID (nf8klfqblyigk2z0). When using a valid service UID (nd7zqtlqlq0wda4s) from the business's services, the endpoint successfully creates a cart with status 201.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/payments/v1/carts",
  "body": {
    "cart": {
      "currency": "USD",
      "items": [
        {
          "entity_uid": "nd7zqtlqlq0wda4s",
          "entity_type": "Service",
          "entity_name": "Legal Consultation",
          "description": "Initial legal consultation service",
          "amount": 250,
          "taxes": [
            {
              "name": "GST",
              "rate": 10
            }
          ]
        }
      ],
      "matter_uid": "b265c1w0zqokgkz8"
    },
    "is_sale": true
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| cart.items[].entity_uid | Documentation doesn't explain that entity_uid must be a valid UID from existing business services/products/packages. The error message 'Service not found' with 500 status could be more descriptive. | Add validation documentation that entity_uid must reference existing business catalog items (services, products, packages). Improve error response to return 400 with clearer message like 'Service with UID not found in business catalog'. | major |