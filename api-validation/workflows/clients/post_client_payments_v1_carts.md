---
endpoint: POST /client/payments/v1/carts
domain: clients
tags: []
status: pass
savedAt: 2026-01-23T22:23:02.078Z
verifiedAt: 2026-01-23T22:23:02.078Z
timesReused: 0
---
# Create Carts

## Summary
Test passed after resolving token type (client) and entity_type capitalization (Invoice vs invoice)

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| matter_uid | pre-resolved | - | No |

```json
{
  "matter_uid": {
    "resolved_value": "b265c1w0zqokgkz8",
    "source_endpoint": "pre-resolved",
    "fallback_endpoint": null,
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
  "path": "/client/payments/v1/carts",
  "body": {
    "cart": {
      "currency": "USD",
      "items": [
        {
          "entity_type": "Invoice",
          "entity_uid": "4kjhnof5kds4tqy9"
        }
      ],
      "matter_uid": "b265c1w0zqokgkz8"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| token_type | Documentation does not specify that this client-facing endpoint requires a 'client' token type instead of 'staff' token | Add authentication section specifying that client token is required for /client/* endpoints | critical |
| entity_type | Documentation does not specify the exact case sensitivity for entity_type values. API expects capitalized values like 'Invoice', 'Meeting', 'EventAttendance' etc. | Update swagger enum values to show exact case: ['Invoice', 'ProductOrder', 'ClientBookingPackage', 'Meeting', 'EventAttendance', 'Cart', 'PendingBooking'] | major |