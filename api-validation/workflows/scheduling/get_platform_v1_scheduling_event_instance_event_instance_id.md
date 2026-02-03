---
endpoint: GET /platform/v1/scheduling/event_instance/{event_instance_id}
domain: scheduling
tags: []
status: success
savedAt: 2026-02-02T09:22:46.764Z
verifiedAt: 2026-02-02T15:30:00.000Z
timesReused: 0
---
# Get Event Instance

## Summary
Retrieves details of a specific event instance (group event). Returns event metadata including title, times, pricing, location, and associated service/staff.

## Prerequisites
- An event instance must exist. Create one via `POST /v2/event_instances` if needed.
- Requires **Staff token** authentication (App tokens do NOT work - backend bug).

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| event_instance_id | GET /v2/event_instances | `[0].uid` | POST /v2/event_instances | Event instances can be cancelled but not deleted |

### Resolution Steps

**event_instance_id**:
1. Call `GET /v2/event_instances` (requires Staff token)
2. Extract from response: `[0].uid`
3. If empty, create via `POST /v2/event_instances`

```json
{
  "event_instance_id": {
    "source_endpoint": "GET /v2/event_instances",
    "extract_from": "[0].uid",
    "fallback_endpoint": "POST /v2/event_instances",
    "create_fresh": true,
    "create_endpoint": "POST /v2/event_instances",
    "create_body": {
      "title": "Test Event",
      "start_time": "2026-02-10T10:00:00.000Z",
      "end_time": "2026-02-10T11:00:00.000Z",
      "duration": 60,
      "padding": 0,
      "interaction_type": "default_business_location",
      "max_attendance": 10
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Event instances cannot be deleted, only cancelled"
  }
}
```

## How to Resolve Parameters
1. Get list of event instances: `GET /v2/event_instances`
2. Use the `uid` field from any returned event instance

## Critical Learnings

- The `/v2/event_instances` endpoints require a **Staff token** (App tokens cause 500 error - backend bug)
- Event instances are individual occurrences of group events/event series
- If no event instances exist, create one first using `POST /v2/event_instances`

## Request Template

Use this template with dynamically resolved UIDs:

```
GET /platform/v1/scheduling/event_instance/{event_instance_id}
Authorization: Bearer {app_token}
```

## Expected Response

```json
{
  "data": {
    "event_instance": {
      "uid": "gmy6c6keyo2mmnaa",
      "title": "Group Yoga Class",
      "start_time": "2020-06-08T21:00:00.000Z",
      "end_time": "2020-06-08T22:00:00.000Z",
      "duration": 60,
      "state": "scheduled",
      "price": "10.0",
      "currency": "USD",
      "charge_type": "paid",
      "interaction_type": "business_location",
      "interaction_details": "Tel Aviv, Israel",
      "staff_id": "36ri3mtnk53zpfkc",
      "service_id": "d37paicvkb4u8taf"
    }
  },
  "status": "OK"
}
```