---
endpoint: "POST /business/communication/sessions/typing"
domain: communication
tags: [Communication Messages (SMS)]
swagger: swagger/communication/communication.json
status: skip
skipReason: "Nexmo communication-gw endpoint. Requires webhook listener for async channel/session activation -- cannot be tested in validation environment."
savedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Send Typing Indicator for Communication Session

## Summary
Send typing indicator for a communication session. **Token Type**: Requires a **staff token**.

> **Skipped -- Nexmo Communication Gateway (SMS)**
> This endpoint is part of the Nexmo-based communication-gw integration (SMS/messaging channels).
> It requires an active webhook listener to receive channel/session activation callbacks from the
> communication-gw. Channels start as "pending" and are activated asynchronously via webhooks,
> which cannot be simulated in the API validation environment.

## Prerequisites
```yaml
steps:
  - id: create_channel
    description: "Create a communication channel"
    method: POST
    path: "/business/communication/channels"
    body:
      business_uid: "{{business_id}}"
      type: "transactional"
      display_name: "Test Channel {{now_timestamp}}"
    extract:
      channel_uid: "$.data.channel.uid"
    expect:
      status: [200, 201]
    onFail: abort

  - id: activate_channel
    description: "Activate the channel and make it open"
    method: PUT
    path: "/business/communication/channels/{{channel_uid}}"
    body:
      status: "active"
      display_name: "Active Test Channel"
      open_channel: true
    expect:
      status: 200
    onFail: abort

  - id: get_client
    description: "Get a client for contact_uid"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      contact_uid: "$.data.clients[0].id"
    expect:
      status: 200
    onFail: abort

  - id: create_session
    description: "Create a communication session"
    method: POST
    path: "/business/communication/sessions"
    body:
      business_uid: "{{business_id}}"
      channel_uid: "{{channel_uid}}"
      contact_uid: "{{contact_uid}}"
      external_uid: "test-external-uid-{{now_timestamp}}"
    extract:
      session_uid: "$.data.session.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: POST
    path: "/business/communication/sessions/typing"
    body:
      session_uid: "{{session_uid}}"
      contact_uid: "{{contact_uid}}"
    expect:
      status: [200, 201]
```