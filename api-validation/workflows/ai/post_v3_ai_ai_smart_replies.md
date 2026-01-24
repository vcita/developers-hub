---
endpoint: POST /v3/ai/ai_smart_replies
domain: ai
tags: []
status: pass
savedAt: 2026-01-23T21:47:16.543Z
verifiedAt: 2026-01-23T21:47:16.543Z
timesReused: 0
---
# Create Ai smart replies

## Summary
Successfully created AISmartReply. The 500 error was caused by an invalid user_input_reference_id format. The endpoint works correctly when using proper reference IDs like 'prmpt-smart-reply-00001' or just numbers like '00001'.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| matter_uid | already resolved | - | No |
| client_uid | already resolved | - | No |

```json
{
  "matter_uid": {
    "source_endpoint": "already resolved",
    "resolved_value": "7mxnm58ypxss5f4j",
    "used_fallback": false
  },
  "client_uid": {
    "source_endpoint": "already resolved",
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
  "path": "/v3/ai/ai_smart_replies",
  "body": {
    "matter_uid": "7mxnm58ypxss5f4j",
    "user_input_reference_id": "prmpt-smart-reply-00001",
    "client_uid": "2l2ut3opxv7heqcq",
    "custom_instructions": "Please provide a professional and concise response"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| user_input_reference_id | Documentation doesn't specify the required format for user_input_reference_id. Invalid formats cause 500 errors instead of validation errors. | Update swagger documentation to specify that user_input_reference_id must either be: 1) A full prompt name like 'prmpt-smart-reply-00001', 2) Just a number like '00001', or 3) Empty/undefined for default. Add validation to return 400 for invalid formats instead of 500. | major |
| controller response | When smart reply generation fails, the controller returns null which causes the framework to return 500 error instead of a proper error response. | Controller should handle failed generation gracefully and return appropriate error response instead of null. | major |
| client_uid | There's inconsistency between service interface (requires clientUid as string) and DTO (marks client_uid as optional). The service actually handles undefined clientUid correctly. | Update service interface to make clientUid optional with '?' or update DTO to make client_uid required - maintain consistency. | minor |