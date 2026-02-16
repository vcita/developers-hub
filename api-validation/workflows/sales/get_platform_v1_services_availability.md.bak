---
endpoint: GET /platform/v1/services/availability
domain: sales
tags: []
status: success
savedAt: 2026-01-26T20:15:02.242Z
verifiedAt: 2026-01-26T20:15:02.242Z
timesReused: 0
---
# Get Availability

## Summary
Test passes after adding required parameters. The endpoint requires either service_ids OR id parameter, plus start_date and end_date. Successfully resolved service IDs from GET /platform/v1/services and verified both parameter formats work.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| service_ids | GET /platform/v1/services?business_id={{business_uid}} | data.services[].id | - | - |

### Resolution Steps

**service_ids**:
1. Call `GET /platform/v1/services?business_id={{business_uid}}`
2. Extract from response: `data.services[].id`
3. If empty, create via `POST /platform/v1/services`

```json
{
  "service_ids": {
    "source_endpoint": "GET /platform/v1/services?business_id={{business_uid}}",
    "extract_from": "data.services[].id",
    "fallback_endpoint": "POST /platform/v1/services",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "name": "Test Service {{timestamp}}",
      "service_type": "appointment",
      "duration": 60,
      "charge_type": "no_price"
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
  "method": "GET",
  "path": "/platform/v1/services/availability?id=erfdz36nlraflwdq&start_date=2024-01-20&end_date=2024-01-21"
}
```