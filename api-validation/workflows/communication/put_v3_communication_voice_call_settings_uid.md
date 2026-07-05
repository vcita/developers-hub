---
endpoint: "PUT /v3/communication/voice_call_settings/{uid}"
domain: communication
tags: [voice_call_settings]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# Update Voice Call Settings

## Summary
Updates voice call settings for a specific setting record. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: get_voice_call_settings
    description: "Fetch available voice call settings"
    method: GET
    path: "/v3/communication/voice_call_settings"
    extract:
      voice_call_setting_uid: "$.data.voice_call_settings[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: PUT
    path: "/v3/communication/voice_call_settings/{{voice_call_setting_uid}}"
    body:
      staff_uid: "{{staff_id}}"
      forward_number: "+1234567890"
      staff_weekly_availability_uid: ""
      forwarding_enabled: true
      dedicated_number: null
      call_forwarding_policy: "ALWAYS"
      call_timeout_sec: 30
      voice_scripts: null
      external_app_name: null
      app_status: "INSTALLED"
    expect:
      status: 200
```