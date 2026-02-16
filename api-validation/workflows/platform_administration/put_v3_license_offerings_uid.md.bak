---
endpoint: PUT /v3/license/offerings/{uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T14:34:52.149Z
verifiedAt: 2026-01-28T14:34:52.149Z
timesReused: 0
---
# Update Offerings

## Summary
PUT /v3/license/offerings/{uid} endpoint tested successfully. Found documentation issues with authentication requirements and reporting_tags enum values.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/license/offerings | data.offerings[0].uid | - | - |

### Resolution Steps

**uid**:
1. **Create fresh test entity**: `POST /v3/license/offerings`
   - Body template: `{"display_name":"Test Offering {{timestamp}}","type":"package","SKU":"test{{timestamp}}","prices":[{"price":10,"currency":"USD"}],"vendor":"inTandem","is_active":true,"reporting_tags":["business_management"]}`
2. Extract UID from creation response: `data.offerings[0].uid`
3. Run the test with this fresh UID

```json
{
  "uid": {
    "source_endpoint": "GET /v3/license/offerings",
    "extract_from": "data.offerings[0].uid",
    "fallback_endpoint": "POST /v3/license/offerings",
    "create_fresh": false,
    "create_endpoint": "POST /v3/license/offerings",
    "create_body": {
      "display_name": "Test Offering {{timestamp}}",
      "type": "package",
      "SKU": "test{{timestamp}}",
      "prices": [
        {
          "price": 10,
          "currency": "USD"
        }
      ],
      "vendor": "inTandem",
      "is_active": true,
      "reporting_tags": [
        "business_management"
      ]
    },
    "cleanup_endpoint": null,
    "cleanup_note": null
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "PUT",
  "path": "/v3/license/offerings/{{resolved.uid}}",
  "body": {
    "display_name": "Professional License Package",
    "prices": [
      {
        "price": 99.99,
        "currency": "USD"
      }
    ],
    "trial": 14,
    "is_active": true,
    "reporting_tags": [
      "business_management",
      "free"
    ],
    "purchase_state": "active"
  }
}
```