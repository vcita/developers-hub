---
endpoint: "POST /business/communication/channels"
domain: communication
tags: [Communication Messages (SMS)]
swagger: mcp_swagger/communication.json
status: skip
skipReason: "Nexmo communication-gw endpoint. Channels start as pending and are activated asynchronously via webhook callback from the communication-gw. Cannot fully test the lifecycle in the API validation environment."
savedAt: 2026-02-09T12:00:00.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Create Business Communication Channel

## Summary

Create a new business communication channel. **Token Type**: Requires a **staff token**.

Available for **Staff, App, and Directory tokens**.

> **Skipped -- Nexmo Communication Gateway (SMS)**
> This endpoint is part of the Nexmo-based communication-gw integration (SMS/messaging channels).
> It requires an active webhook listener to receive channel/session activation callbacks from the
> communication-gw. Channels start as "pending" and are activated asynchronously via webhooks,
> which cannot be simulated in the API validation environment.

> ⚠️ Fallback API Required

## Test Request
```yaml
steps:
  - id: main_request
    method: POST
    path: "/business/communication/channels"
    body:
      business_uid: "{{business_id}}"
      type: "transactional"
      display_name: "Test Channel {{now_timestamp}}"
    expect:
      status: [200, 201]
```
