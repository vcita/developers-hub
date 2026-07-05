---
endpoint: "PUT /business/communication/channels/{uid}"
domain: communication
tags: [Communication Messages (SMS)]
swagger: swagger/communication/communication.json
status: skip
skipReason: "Nexmo communication-gw endpoint. Requires webhook listener for async channel/session activation -- cannot be tested in validation environment."
savedAt: 2026-01-27T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Update Communication Channel

## Summary
Updates an existing communication channel. **Token Type**: Requires a **staff token**.

> **Skipped -- Nexmo Communication Gateway (SMS)**
> This endpoint is part of the Nexmo-based communication-gw integration (SMS/messaging channels).
> It requires an active webhook listener to receive channel/session activation callbacks from the
> communication-gw. Channels start as "pending" and are activated asynchronously via webhooks,
> which cannot be simulated in the API validation environment.

## Prerequisites
```yaml
steps:
  - id: create_channel
    description: "Create a communication channel to update"
    method: POST
    path: "/business/communication/channels"
    body:
      business_uid: "{{business_id}}"
      type: "transactional"
      display_name: "Test Channel {{now_timestamp}}"
    extract:
      channel_uid: "$.data.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: PUT
    path: "/business/communication/channels/{{channel_uid}}"
    body:
      status: "active"
      display_name: "Updated Test Channel"
      open_channel: true
    expect:
      status: 200
```