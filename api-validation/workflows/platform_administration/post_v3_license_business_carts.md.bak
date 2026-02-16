---
endpoint: POST /v3/license/business_carts
domain: platform_administration
tags: [license, business-cart]
status: verified
savedAt: 2026-01-29T12:00:00.000Z
verifiedAt: 2026-01-29T12:00:00.000Z
timesReused: 0
---
# Create Business Cart

## Summary
Creates a new BusinessCart for a business. Requires an offering_uid obtained from the Offerings endpoint.

## Prerequisites
1. A valid offering must exist in the system
2. Obtain the offering_uid by calling `GET /v3/license/offerings`

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| offering_uid | GET /v3/license/offerings | data.offerings[0].uid | - | - |

### Resolution Steps

**offering_uid**:
1. Call `GET /v3/license/offerings` with **Directory token**
2. Extract `uid` from any offering in the response

```json
{
  "offering_uid": {
    "source_endpoint": "GET /v3/license/offerings",
    "token_type": "directory",
    "extract_from": "data.offerings[0].uid",
    "create_fresh": false
  }
}
```

## How to Resolve Parameters
1. **Get offerings list**: Call `GET /v3/license/offerings` using a Directory token
2. **Select any offering**: Pick any offering from the response
3. **Create cart**: Call POST endpoint with Staff, App, or Directory token

## Critical Learnings

- **Multiple token types supported** - Endpoint accepts Staff, App, and Directory tokens
- **Offering types** - Valid offering types are: package, app, addon

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/v3/license/business_carts",
  "body": {
    "business_cart": {
      "offering_uid": "{{resolved.offering_uid}}"
    }
  }
}
```
