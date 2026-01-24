---
endpoint: POST /business/communication/messages
domain: communication
tags: []
status: pass
savedAt: 2026-01-23T21:52:31.800Z
verifiedAt: 2026-01-23T21:52:31.800Z
timesReused: 0
---
# Create Messages

## Summary
Successfully created a business communication message after resolving prerequisite entities. The workflow required creating an active channel and session before messages could be sent.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| channel_uid | POST /business/communication/channels | PUT /business/communication/channels/{uid} | No |
| session_uid | POST /business/communication/sessions | PUT /business/communication/sessions/{uid} | No |
| contact_uid | pre-resolved | - | No |

```json
{
  "channel_uid": {
    "source_endpoint": "POST /business/communication/channels",
    "resolved_value": "b3a68b9d-101a-49cc-af4c-407f0532b2d6",
    "used_fallback": false,
    "fallback_endpoint": "PUT /business/communication/channels/{uid}"
  },
  "session_uid": {
    "source_endpoint": "POST /business/communication/sessions",
    "resolved_value": "99d58948-13a6-4fe7-a016-a2ad79ee4c11",
    "used_fallback": false,
    "fallback_endpoint": "PUT /business/communication/sessions/{uid}"
  },
  "contact_uid": {
    "source_endpoint": "pre-resolved",
    "resolved_value": "2l2ut3opxv7heqcq",
    "used_fallback": false
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
  "path": "/business/communication/messages",
  "body": {
    "external_uid": "ext_12345",
    "message": "Hello, this is a test message from the business.",
    "message_uid": "msg_67890_unique",
    "channel_uid": "b3a68b9d-101a-49cc-af4c-407f0532b2d6",
    "contact_uid": "2l2ut3opxv7heqcq",
    "direction": "business_to_client",
    "attachments": []
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| channel creation | Documentation doesn't mention that channels are created in 'pending' or 'error' status and must be manually activated to 'active' status before use | Add documentation explaining channel status lifecycle and requirement to activate channels | major |
| session prerequisite | Documentation for POST /business/communication/messages doesn't mention that an active session must exist between the channel and contact before messages can be sent | Add documentation explaining that sessions must be created and activated before sending messages | critical |
| channel creation parameters | Swagger documentation for channel creation was missing required 'business_uid' parameter and available 'type' enum values | Update swagger to show business_uid as required and list valid type values (transactional, promotional, internal) | major |
| session creation parameters | Documentation shows unclear parameter requirements for session creation | Clarify that all four parameters (business_uid, channel_uid, contact_uid, external_uid) are required for session creation | major |