---
endpoint: POST /v3/ai/ai_generation_feedbacks
domain: ai
tags: []
status: pass
savedAt: 2026-01-24T12:54:00.741Z
verifiedAt: 2026-01-24T12:54:00.741Z
timesReused: 0
---
# Create Ai generation feedbacks

## Summary
Successfully created AI generation feedback after resolving the required entity_uid. The original error was due to using a non-existent entity_uid. Created a new AISmartReply entity and used its UID to successfully create the feedback.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| entity_uid | GET /v3/ai/ai_smart_replies | POST /v3/ai/ai_smart_replies | Yes |

```json
{
  "entity_uid": {
    "source_endpoint": "GET /v3/ai/ai_smart_replies",
    "fallback_endpoint": "POST /v3/ai/ai_smart_replies",
    "used_fallback": true,
    "resolved_value": "ab16e72d-27f3-42fd-bc87-fcbf998e8234"
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
    "type": "text",
    "value": "too_formal",
    "entity_type": "AISmartReply",
    "entity_uid": "ab16e72d-27f3-42fd-bc87-fcbf998e8234",
    "name": "[AISmartReply] Business Dismiss Reason"
  }
}
```