---
endpoint: "POST /v3/communication/voice_calls"
domain: communication
tags: [voice_calls]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-02-08T20:44:20.398Z
verifiedAt: 2026-02-08T20:44:20.398Z
timesReused: 0
---

# Create Voice Call

## Summary
Creates a new voice call record. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: get_client
    description: "Fetch a client"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: POST
    path: "/v3/communication/voice_calls"
    body:
      staff_uid: "{{staff_id}}"
      client_uid: "{{client_uid}}"
      from_number: "+1234567890"
      to_number: "+1987654321"
      direction: "OUTBOUND"
      status: "INCOMING_CALL"
      rate: "0.05"
      provider: "VONAGE"
      source_id: "test_source_{{now_timestamp}}"
      external_uuid: "ext_uuid_{{now_timestamp}}"
      business_uid: "{{business_id}}"
    expect:
      status: [200, 201]
```