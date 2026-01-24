---
endpoint: POST /business/messaging/v1/channels/typing
domain: communication
tags: []
status: pass
savedAt: 2026-01-23T22:01:56.163Z
verifiedAt: 2026-01-23T22:01:56.163Z
timesReused: 0
---
# Create Typing

## Summary
Successfully resolved the typing indicator endpoint. The issue was that an active contact channel was required before typing indicators can be sent. Created and activated the contact channel, then the typing endpoint worked correctly.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| contact_channel | POST /business/messaging/v1/channels/contacts | PUT /business/messaging/v1/channels/contacts/{channel_uid} to activate | No |

```json
{
  "contact_channel": {
    "source_endpoint": "POST /business/messaging/v1/channels/contacts",
    "resolved_value": "b3a68b9d-101a-49cc-af4c-407f0532b2d6",
    "used_fallback": false,
    "fallback_endpoint": "PUT /business/messaging/v1/channels/contacts/{channel_uid} to activate"
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
  "path": "/business/messaging/v1/channels/typing",
  "body": {
    "contact": {
      "channel_uid": "b3a68b9d-101a-49cc-af4c-407f0532b2d6",
      "external_uid": "cf7ljj1o7i2mr8y2",
      "source": "web",
      "typing": true,
      "uid": "2l2ut3opxv7heqcq"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| contact_channel prerequisite | Documentation does not mention that an active contact channel must exist before typing indicators can be sent. The endpoint fails with 'No Active Contact Channel Found' if no active contact channel exists. | Add prerequisite documentation explaining that a contact channel must be created via POST /business/messaging/v1/channels/contacts and activated via PUT /business/messaging/v1/channels/contacts/{channel_uid} before typing indicators can be used. | major |
| endpoint confusion | There are two different typing indicator endpoints with different structures: /business/messaging/v1/channels/typing (nested contact object) and /business/communication/sessions/typing (flat structure). This is confusing and not clearly documented. | Clearly document the difference between channels typing (requires active contact channel) and sessions typing (requires active session), and when to use each endpoint. | minor |
| contact channel activation | The contact channel update endpoint path is not intuitive. Uses PUT /business/messaging/v1/channels/contacts/{channel_uid} instead of expected PUT /business/messaging/v1/channels/contacts/{contact_uid}. | Document the correct path structure for updating contact channels, explaining that {channel_uid} is used as the path parameter. | minor |