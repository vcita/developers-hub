---
endpoint: POST /v3/ai/ai_generation_feedbacks
domain: ai
tags: []
status: pass
savedAt: 2026-01-23T21:45:44.265Z
verifiedAt: 2026-01-23T21:45:44.265Z
timesReused: 0
---
# Create Ai generation feedbacks

## Summary
Successfully created AI generation feedback after resolving the entity_uid by creating a new AISmartReply entity. The original error was due to using an invalid entity_uid that didn't correspond to an existing AISmartReply.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| entity_uid | /v3/ai/ai_smart_replies | /v3/ai/ai_smart_replies | Yes |

```json
{
  "entity_uid": {
    "source_endpoint": "/v3/ai/ai_smart_replies",
    "fallback_endpoint": "/v3/ai/ai_smart_replies",
    "used_fallback": true,
    "resolved_value": "3a741e1d-b2d1-49fb-86e2-33a9732c7117"
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
  "path": "/v3/ai/ai_generation_feedbacks",
  "body": {
    "type": "int",
    "value": "5",
    "entity_type": "AISmartReply",
    "entity_uid": "3a741e1d-b2d1-49fb-86e2-33a9732c7117",
    "name": "[AISmartReply] Business Sent Message UID"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| entity_uid | Documentation doesn't clarify that entity_uid must reference an existing entity of the specified entity_type. When using entity_type 'AISmartReply', the entity_uid must be a valid UID from the AISmartReply entities. | Add clarification to swagger documentation that entity_uid must reference an existing entity of the specified type, and include examples of how to obtain valid UIDs for each supported entity_type | major |