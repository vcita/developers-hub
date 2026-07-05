---
endpoint: "GET /v3/communication/voice_calls/{uid}"
domain: communication
tags: [voice_calls]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# Get Voice Call

## Summary
Retrieves a specific voice call by its unique identifier. **Token Type**: Requires a **staff token**.

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

  - id: create_voice_call
    description: "Create a voice call to test with"
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
    extract:
      voice_call_uid: "$.data.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/communication/voice_calls/{{voice_call_uid}}"
    expect:
      status: 200
```