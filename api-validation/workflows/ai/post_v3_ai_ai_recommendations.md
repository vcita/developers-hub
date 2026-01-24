---
endpoint: POST /v3/ai/ai_recommendations
domain: ai
tags: []
status: pass
savedAt: 2026-01-23T21:42:36.208Z
verifiedAt: 2026-01-23T21:42:36.208Z
timesReused: 0
---
# Create Ai recommendations

## Summary
Successfully created AI recommendation after correcting the context_uid to use matter_uid instead of client_uid. The endpoint returned HTTP 201 with valid recommendation data.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/v3/ai/ai_recommendations",
  "body": {
    "user_description": "Client inquiry about case status and next steps",
    "staff_uid": "guwtwt70kxgic65r",
    "sources": [
      "client_communication",
      "case_documents"
    ],
    "actions": [
      {
        "action": "reply",
        "display": {
          "btn_text": "Send Response"
        },
        "reason": "Client has requested an update on their case status",
        "payload": {},
        "evidence": [
          "Client sent follow-up message 3 days ago",
          "Case has recent developments that need communication"
        ]
      }
    ],
    "display": {
      "title": "Client Communication Required"
    },
    "context": {
      "context_uid": "7mxnm58ypxss5f4j",
      "context_type": "client"
    },
    "target": {
      "target_actor_uid": "guwtwt70kxgic65r",
      "target_actor_type": "staff"
    },
    "status": {
      "dismissed": false,
      "dismissed_source_type": "user"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| context.context_uid | Documentation does not specify that when context_type is 'client', the context_uid must be a matter_uid, not a client_uid. The validation logic calls getClientMessageHistory() with the context_uid as matter_uid. | Update swagger documentation to clarify: 'When context_type is "client", the context_uid should be the matter_uid associated with the client, not the client_uid itself.' | critical |
| context_type | The context_type field shows 'client' but the actual context being validated is a matter (conversation messages). This is misleading. | Either change context_type to 'matter' when using matter_uid, or update documentation to explain that 'client' context requires a matter_uid for authorization validation. | major |
| authorization logic | The authorization validation comment on line 84 says 'Currently, we only support matter as context' but the API accepts context_type 'client'. This creates confusion. | Update documentation to clarify supported context types and their corresponding UID requirements, or restrict context_type enum to only supported values. | major |