---
endpoint: "POST /platform/v1/numbers/dedicated_numbers/assign"
domain: communication
tags: [numbers, dedicated]
swagger: swagger/communication/legacy/legacy_v1_communication.json
status: skip
savedAt: 2026-01-27T21:28:12.398Z
verifiedAt: 2026-01-27T21:28:12.398Z
timesReused: 0
useFallbackApi: true
expectedOutcome: 422
expectedOutcomeReason: "Requires valid external API key for third-party SMS service (Nexmo/Vonage) which cannot be provided in test environment"
---

# Assign Dedicated Number

## Summary
Assigns a dedicated SMS number to an account. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

> ⚠️ **Untestable Endpoint**: This endpoint requires a valid external API key for a third-party SMS service provider (Nexmo/Vonage). The API responds with "API KEY is not valid" error when using test keys, making it untestable in our validation environment.

## Prerequisites
None required for this endpoint.

## Test Request
```yaml
steps:
  - id: assign_dedicated_number
    method: POST
    path: "/platform/v1/numbers/dedicated_numbers/assign"
    body:
      number: "+15551234567"
      number_type: ["promotional"]
      api_key: "test_api_key"
      business_uid: "{{business_id}}"
    expect:
      status: 422
```