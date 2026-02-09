---
endpoint: GET /v3/communication/staff_notifications/{uid}
domain: communication
tags: []
status: success
savedAt: 2026-01-27T05:46:41.277Z
verifiedAt: 2026-01-27T05:46:41.277Z
timesReused: 0
---
# Get Staff notifications

## Summary
Test passes after resolving authentication and UID issues. Used directory token and created a valid staff notification to test retrieval.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| staff_notification_uid | POST /v3/communication/staff_notifications | data.uid | ✓ POST /v3/communication/staff_notifications | - |

### Resolution Steps

**staff_notification_uid**:
1. **Create fresh test entity**: `POST /v3/communication/staff_notifications`
   - Body template: `{"staff_uid":"{{staff_uid}}","business_uid":"{{business_uid}}","conversation_uid":"{{conversation_uid}}","messaging_id":"test_messaging_id","sub_account_id":"test_sub_account_id","notification_template_code_name":"test_notification_template_1734530803"}`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID

```json
{
  "staff_notification_uid": {
    "source_endpoint": "POST /v3/communication/staff_notifications",
    "extract_from": "data.uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /v3/communication/staff_notifications",
    "create_body": {
      "staff_uid": "{{staff_uid}}",
      "business_uid": "{{business_uid}}",
      "conversation_uid": "{{conversation_uid}}",
      "messaging_id": "test_messaging_id",
      "sub_account_id": "test_sub_account_id",
      "notification_template_code_name": "test_notification_template_1734530803"
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
  "path": "/v3/communication/staff_notifications/{{resolved.uid}}"
}
```