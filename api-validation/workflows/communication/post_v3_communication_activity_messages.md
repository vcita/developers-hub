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

  - id: create_activity_message_pay
    method: POST
    path: "/v3/communication/activity_messages"
    body:
      staff_uid: "{{staff_id}}"
      client_uid: "{{client_uid}}"
      activity_type: "invite"
      activity_action: "pay"
      message_text:
        body: "You have a pending payment. Tap to pay online."
        subject: "Pay online"
      channels: ["sms"]
      cta_button_text: "Pay now"
    expect:
      status: 401

  - id: create_activity_message_share_document
    method: POST
    path: "/v3/communication/activity_messages"
    body:
      staff_uid: "{{staff_id}}"
      client_uid: "{{client_uid}}"
      activity_type: "invite"
      activity_action: "share_document"
      message_text:
        body: "Please share the requested document with us."
        subject: "Document requested"
      channels: ["email"]
      cta_button_text: "Upload document"
    expect:
      status: 401

  - id: create_activity_message_client_portal
    method: POST
    path: "/v3/communication/activity_messages"
    body:
      staff_uid: "{{staff_id}}"
      client_uid: "{{client_uid}}"
      activity_type: "invite"
      activity_action: "client_portal"
      message_text:
        body: "Log in to your client portal to manage your account."
        subject: "Visit your client portal"
      channels: ["email", "sms"]
      cta_button_text: "Log in"
    expect:
      status: 401

  - id: create_activity_message_invalid_action
    method: POST
    path: "/v3/communication/activity_messages"
    body:
      staff_uid: "{{staff_id}}"
      client_uid: "{{client_uid}}"
      activity_type: "invite"
      activity_action: "not_a_real_action"
      message_text:
        body: "This should be rejected."
        subject: "Invalid"
      channels: ["sms"]
      cta_button_text: "Go"
    expect:
      status: 400
```