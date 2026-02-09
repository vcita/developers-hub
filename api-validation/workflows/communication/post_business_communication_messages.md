---
endpoint: "POST /business/communication/messages"
domain: communication
tags: [Communication Messages (SMS)]
swagger: swagger/communication/legacy/communication.json
status: skip
skipReason: "Nexmo communication-gw endpoint. Requires webhook listener for async channel/session activation -- cannot be tested in validation environment."
savedAt: 2026-02-09T10:00:00.000Z
timesReused: 0
tokens: [staff]
---

# Create Communication Message

## Summary

Send a message through the communication gateway. **Token Type**: Requires a **staff token**.

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
    extract:
      channel_uid: "$.data.channel.uid"
    expect:
      status: [200, 201]
    onFail: abort
    sleep: 5000

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
```

## Test Request
```yaml
steps:
  - id: main_request
    method: POST
    path: "/business/communication/messages"
    body:
      channel_uid: "{{channel_uid}}"
      external_uid: "test-external-{{now_timestamp}}"
      contact_uid: "{{contact_uid}}"
      message: "Test message from API validation {{now_timestamp}}"
      message_uid: "test-msg-{{now_timestamp}}"
    expect:
      status: [200, 201]
```
