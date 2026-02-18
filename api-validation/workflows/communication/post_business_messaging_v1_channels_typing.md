---
endpoint: "POST /business/messaging/v1/channels/typing"
domain: communication
tags: [Communication Messages (SMS)]
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/communication.json
status: skip
skipReason: "Nexmo communication-gw endpoint. Requires webhook listener for async channel/session activation -- cannot be tested in validation environment."
savedAt: 2026-02-08T21:30:00.000Z
timesReused: 0
---

# Update Typing Status

## Summary
Update typing indicator status for a communication session. **Token Type**: Requires a **staff token**.

> **Skipped -- Nexmo Communication Gateway (SMS)**
> This endpoint is part of the Nexmo-based communication-gw integration (SMS/messaging channels).
> It requires an active webhook listener to receive channel/session activation callbacks from the
> communication-gw. Channels start as "pending" and are activated asynchronously via webhooks,
> which cannot be simulated in the API validation environment.

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client to get contact UID"
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
  - id: update_typing_status
    method: POST
    path: "/business/messaging/v1/channels/typing"
    body:
      contact:
        uid: "{{contact_uid}}"
        channel_uid: "test_channel_uid"
        external_uid: "external_test123"
        typing: true
        source: "business"
    expect:
      status: [200, 201]
```