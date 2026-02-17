---
endpoint: "PUT /business/scheduling/v1/external_calendar_items/start_export"
domain: scheduling
tags: [calendar, sync, external, scheduling]
swagger: "swagger/scheduling/legacy/scheduling.json"
status: verified
savedAt: "2026-02-03T21:00:00.000Z"
verifiedAt: "2026-02-03T21:00:00.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Start External Calendar Export

## Summary
Start exporting calendar items to an external calendar provider. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_staff
    description: "Get staff information"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    extract:
      staff_uid: "$.data.staffs[0].id"
    expect:
      status: 200
    onFail: abort
    
  - id: create_calendar_sync
    description: "Create calendar sync record for staff"
    method: POST
    path: "/platform/v1/scheduling/calendar_syncs"
    body:
      staff_uid: "{{staff_uid}}"
      app_code_name: "googlewaysync"
      provider: "google_v3"
      should_import: true
      is_private_import: false
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: start_export
    method: PUT
    path: "/business/scheduling/v1/external_calendar_items/start_export"
    token: staff
    body:
      staff_uid: "{{staff_uid}}"
      calendar_sync:
        provider: "google_v3"
        account: "testuser@gmail.com"
    expect:
      status: 200
```

## Request Body Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `staff_uid` | Yes | string | The staff member's UID |
| `calendar_sync` | Yes | object | Calendar sync configuration |
| `calendar_sync.provider` | Yes | string | Provider name: "google_v3", "outlook_v1.0" |
| `calendar_sync.account` | Yes | string | The email account (e.g., "user@gmail.com") |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "uid": "9t1dcewjh54k3t91",
    "staff_uid": "f67acee343b4a38b",
    "provider": "google_v3",
    "account": "testuser@gmail.com",
    "enabled": true,
    "should_export": true
  }
}
```

## Error Responses

### 422 - Staff Not Exists
```json
{
  "success": false,
  "errors": [
    {
      "code": "missing",
      "message": "staff is not exists"
    }
  ]
}
```

### 422 - Staff Not Registered
```json
{
  "success": false,
  "errors": [
    {
      "code": "missing",
      "message": "staff is not registered to any calendar sync"
    }
  ]
}
```