---
endpoint: "POST /v3/communication/activity_messages"
domain: communication
tags: [activity_messages]
swagger: "swagger/communication/communication.json"
status: pending
savedAt: "2026-02-08T21:28:12.398Z"
verifiedAt: "2026-02-08T21:28:12.398Z"
timesReused: 0
tokens: [staff]
expectedOutcome: 401
expectedOutcomeReason: "Endpoint requires valid staff_uid but staff lookup validation fails with current test data. The endpoint has fallback logic to use business default staff when staff_uid is omitted, but validation requires staff_uid to be explicitly provided and the staff must be associated with the business and client."
---

# Create Activity Message

## Summary
Create a new activity message for client communication. **Token Type**: Requires a **staff token**.

> ⚠️ **Known Issue**: This endpoint requires a valid staff_uid that is associated with both the business and the specific client. The built-in staff_id variable may not work if the staff is not properly associated with the client being messaged.

## Prerequisites

```yaml
steps:
  - id: get_client_with_conversation
    description: "Fetch a client that has conversations"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "50"
    extract:
      client_uid: "$.data.clients[?(@.conversations_count > 0)][0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_activity_message
    method: POST
    path: "/v3/communication/activity_messages"
    body:
      staff_uid: "{{staff_id}}"
      client_uid: "{{client_uid}}"
      activity_type: "invite"
      activity_action: "schedule"
      message_text:
        body: "You are invited to schedule with us online."
        subject: "You can now schedule with us online!"
      channels: ["sms"]
      cta_button_text: "Schedule now"
    expect:
      status: 401
```