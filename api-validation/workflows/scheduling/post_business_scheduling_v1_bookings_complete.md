---
endpoint: POST /business/scheduling/v1/bookings/complete
domain: scheduling
tags: []
status: success
savedAt: 2026-02-02T08:03:20.509Z
verifiedAt: 2026-02-02T08:03:20.509Z
timesReused: 0
---
# Create Complete

## Summary
Endpoint works correctly with app token. Documentation incorrectly states staff token is supported.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| booking_id | No direct GET endpoint found for bookings with current tokens | Response booking ID field | - | No DELETE endpoint available for bookings, completion serves as state change |

### Resolution Steps

**booking_id**:
1. **Create fresh test entity**: `POST /business/scheduling/v1/bookings`
   - Body template: `{"business_id":"{{business_uid}}","service_id":"service_{{timestamp}}","staff_id":"{{staff_id}}","client_email":"test{{timestamp}}@example.com","start_time":"2024-12-15T10:00:00Z","duration":60}`
2. Extract UID from creation response: `Response booking ID field`
3. Run the test with this fresh UID
4. **Cleanup note**: No DELETE endpoint available for bookings, completion serves as state change

```json
{
  "booking_id": {
    "source_endpoint": "No direct GET endpoint found for bookings with current tokens",
    "extract_from": "Response booking ID field",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/scheduling/v1/bookings",
    "create_body": {
      "business_id": "{{business_uid}}",
      "service_id": "service_{{timestamp}}",
      "staff_id": "{{staff_id}}",
      "client_email": "test{{timestamp}}@example.com",
      "start_time": "2024-12-15T10:00:00Z",
      "duration": 60
    },
    "cleanup_endpoint": null,
    "cleanup_note": "No DELETE endpoint available for bookings, completion serves as state change"
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
  "path": "/business/scheduling/v1/bookings/complete",
  "body": {
    "booking_id": [
      "bk_test123"
    ],
    "business_id": "{{config.params.business_id}}"
  }
}
```