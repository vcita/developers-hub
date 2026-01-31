---
endpoint: PUT /v3/license/subscriptions/{uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:09:16.538Z
verifiedAt: 2026-01-29T08:09:16.538Z
timesReused: 0
---
# Update Subscriptions

## Summary
Test passes after creating fresh subscription. The endpoint works correctly but requires the subscription to be in a modifiable state (not already canceled).

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/license/subscriptions | data.uid of created subscription | ✓ POST /v3/license/subscriptions | Subscriptions cannot be deleted, only canceled (which happens during the test) |

### Resolution Steps

**uid**:
1. **Create fresh test entity**: `POST /v3/license/subscriptions`
   - Body template: `{"buyer_uid":"{{config.params.buyer_uid}}","business_uid":"{{config.params.business_uid}}","offering_uid":"{{any_valid_offering_uid}}","purchase_price":"7.00","purchase_currency":"USD"}`
2. Extract UID from creation response: `data.uid of created subscription`
3. Run the test with this fresh UID
4. **Cleanup note**: Subscriptions cannot be deleted, only canceled (which happens during the test)

```json
{
  "uid": {
    "source_endpoint": "GET /v3/license/subscriptions",
    "extract_from": "data.uid of created subscription",
    "fallback_endpoint": "POST /v3/license/subscriptions",
    "create_fresh": true,
    "create_endpoint": "POST /v3/license/subscriptions",
    "create_body": {
      "buyer_uid": "{{config.params.buyer_uid}}",
      "business_uid": "{{config.params.business_uid}}",
      "offering_uid": "{{any_valid_offering_uid}}",
      "purchase_price": "7.00",
      "purchase_currency": "USD"
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Subscriptions cannot be deleted, only canceled (which happens during the test)"
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
  "path": "/v3/license/subscriptions/{{resolved.uid}}",
  "body": {
    "purchase_state": "canceled",
    "expiration_date": "2026-02-15T00:00:00Z"
  }
}
```