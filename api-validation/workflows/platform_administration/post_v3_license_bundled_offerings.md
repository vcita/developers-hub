---
endpoint: POST /v3/license/bundled_offerings
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T10:53:51.279Z
verifiedAt: 2026-01-28T10:53:51.279Z
timesReused: 0
---
# Create Bundled offerings

## Summary
Endpoint works correctly. Original error was due to test data conflict (409 - existing bundled offering) and undocumented authentication requirement. Test passes with admin token and fresh offering UID of correct type.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| offering_uid | GET /v3/license/offerings | data.offerings[].uid where type is package or app | ✓ POST /v3/license/offerings | DELETE /v3/license/offerings/{uid} |
| bundled_offering_uid | GET /v3/license/offerings | data.offerings[].uid where type is addon | - | - |

### Resolution Steps

**offering_uid**:
1. **Create fresh test entity**: `POST /v3/license/offerings`
   - Body template: `{"type":"app","SKU":"testapp{{timestamp}}","display_name":"Test Offering {{timestamp}}","quantity":1,"payment_type":"monthly","prices":[{"price":"10.00","currency":"USD"}],"vendor":"inTandem","is_active":true,"trial_period":0}`
2. Extract UID from creation response: `data.offerings[].uid where type is package or app`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /v3/license/offerings/{uid}`

**bundled_offering_uid**:
1. Call `GET /v3/license/offerings`
2. Extract from response: `data.offerings[].uid where type is addon`
3. If empty, create via `POST /v3/license/offerings`

```json
{
  "offering_uid": {
    "source_endpoint": "GET /v3/license/offerings",
    "extract_from": "data.offerings[].uid where type is package or app",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /v3/license/offerings",
    "create_body": {
      "type": "app",
      "SKU": "testapp{{timestamp}}",
      "display_name": "Test Offering {{timestamp}}",
      "quantity": 1,
      "payment_type": "monthly",
      "prices": [
        {
          "price": "10.00",
          "currency": "USD"
        }
      ],
      "vendor": "inTandem",
      "is_active": true,
      "trial_period": 0
    },
    "cleanup_endpoint": "DELETE /v3/license/offerings/{uid}",
    "cleanup_note": "After test completion, clean up created bundled offering and offering"
  },
  "bundled_offering_uid": {
    "source_endpoint": "GET /v3/license/offerings",
    "extract_from": "data.offerings[].uid where type is addon",
    "fallback_endpoint": "POST /v3/license/offerings",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "type": "addon",
      "SKU": "module{{timestamp}}",
      "display_name": "Bundled Module {{timestamp}}",
      "quantity": 1,
      "payment_type": "monthly",
      "prices": [
        {
          "price": "5.00",
          "currency": "USD"
        }
      ],
      "vendor": "inTandem",
      "is_active": true,
      "trial_period": 0
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
  "method": "POST",
  "path": "/v3/license/bundled_offerings",
  "body": {
    "offering_uid": "{{resolved.offering_uid}}",
    "bundled_offering_uid": "{{resolved.bundled_offering_uid}}"
  }
}
```