---
endpoint: "PUT /business/communication/sessions/{uid}"
domain: communication
tags: [Communication Messages (SMS)]
swagger: swagger/communication/communication.json
status: skip
skipReason: "Nexmo communication-gw endpoint. Requires webhook listener for async channel/session activation -- cannot be tested in validation environment."
savedAt: 2026-01-27T17:30:00.000Z
useFallbackApi: true
---

# Update Communication Session

## Summary
Updates the status of a communication session. **Token Type**: Requires a **staff token**.

> **Skipped -- Nexmo Communication Gateway (SMS)**
> This endpoint is part of the Nexmo-based communication-gw integration (SMS/messaging channels).
> It requires an active webhook listener to receive channel/session activation callbacks from the
> communication-gw. Channels start as "pending" and are activated asynchronously via webhooks,
> which cannot be simulated in the API validation environment.

> ⚠️ Fallback API Required

## Prerequisites
```yaml
steps:
  - id: create_session
    description: "Create a new communication session"
    method: POST
    path: "/business/communication/sessions"
    body:
      channel_uid: "ch_{{business_id}}"
      external_uid: "ext_{{now_timestamp}}"
      contact_uid: "{{client_id}}"
      status: "pending"
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
    method: PUT
    path: "/business/communication/sessions/{{session_uid}}"
    body:
      status: "active"
    expect:
      status: 200
```