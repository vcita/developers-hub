---
endpoint: "GET /business/communication/sessions"
domain: communication
tags: [Communication Messages (SMS)]
swagger: swagger/communication/communication.json
status: skip
skipReason: "Nexmo communication-gw endpoint. Requires webhook listener for async channel/session activation -- cannot be tested in validation environment."
savedAt: 2026-01-27T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# List Communication Sessions

## Summary
Retrieves communication sessions filtered by business and channel. **Token Type**: Requires a **staff token**.

> **Skipped -- Nexmo Communication Gateway (SMS)**
> This endpoint is part of the Nexmo-based communication-gw integration (SMS/messaging channels).
> It requires an active webhook listener to receive channel/session activation callbacks from the
> communication-gw. Channels start as "pending" and are activated asynchronously via webhooks,
> which cannot be simulated in the API validation environment.

The endpoint requires two mandatory filter parameters:
- `filter[business_uid]` - Business identifier
- `filter[channel_uid]` - Channel identifier

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/business/communication/sessions"
    params:
      "filter[business_uid]": "{{business_id}}"
      "filter[channel_uid]": "test-channel-uid"
    expect:
      status: 200
```