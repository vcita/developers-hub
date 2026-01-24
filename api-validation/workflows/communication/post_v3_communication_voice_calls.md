---
endpoint: POST /v3/communication/voice_calls
domain: communication
tags: []
status: pass
savedAt: 2026-01-23T22:26:42.503Z
verifiedAt: 2026-01-23T22:26:42.503Z
timesReused: 0
---
# Create Voice calls

## Summary
POST /v3/communication/voice_calls endpoint works correctly and returns HTTP 201. All required and optional fields are processed correctly, except for a critical bug where external_uuid is ignored in the service implementation.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| source_id | N/A - field is optional per DTO validation | N/A | No |

```json
{
  "source_id": {
    "resolved_value": "not_required",
    "source_endpoint": "N/A - field is optional per DTO validation",
    "used_fallback": false,
    "fallback_endpoint": "N/A"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/v3/communication/voice_calls",
  "body": {
    "staff_uid": "guwtwt70kxgic65r",
    "client_uid": "2l2ut3opxv7heqcq",
    "from_number": "+14155551234",
    "to_number": "+14155555678",
    "direction": "INBOUND",
    "status": "INCOMING_CALL",
    "rate": "0.015",
    "provider": "VONAGE",
    "source_id": "call_12345_test",
    "external_uuid": "4887af14-22b7-456a-a150-0198da784a28",
    "business_uid": "pihawe0kf7fu7xo1"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| external_uuid | Documentation shows external_uuid as an optional field that should be saved, but the service implementation ignores it completely. The field is accepted in the CreateVoiceCall DTO but never passed to the repository create method. | Add external_uuid: voiceCallData.external_uuid to line 60 in voice-calls.service.ts insert method | critical |