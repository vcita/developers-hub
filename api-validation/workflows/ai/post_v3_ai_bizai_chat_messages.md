---
endpoint: POST /v3/ai/bizai_chat_messages
domain: ai
tags: []
status: pass
savedAt: 2026-01-23T21:48:23.103Z
verifiedAt: 2026-01-23T21:48:23.103Z
timesReused: 0
---
# Create Bizai chat messages

## Summary
Successfully created a BizAI chat message after fixing the request format. The API requires the content field to be an object (not a string) and needs the bizai_chat_uid query parameter.

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
  "path": "/v3/ai/bizai_chat_messages?bizai_chat_uid=63adad5a-2918-4faa-a370-9bfe2862da69",
  "body": {
    "type": "text",
    "content": {
      "text": "Hello, I need help with my legal matter."
    },
    "streaming": true
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| content | Documentation shows content as a simple string field, but the API expects an object structure. For type 'text', content should be {"text": "message"}, not just the message string directly. | Update swagger documentation to clearly show content as an object with different schemas for 'text' and 'prompt' types. The current documentation is misleading about the structure. | critical |
| bizai_chat_uid | The required query parameter bizai_chat_uid is not mentioned in the failing request example or error message, making it unclear what's needed. | Ensure the swagger documentation clearly indicates bizai_chat_uid as a required query parameter, and improve error messages to mention missing required parameters. | major |
| type and content relationship | Documentation doesn't clearly explain the relationship between the 'type' field value and the expected content object structure. | Add clear examples showing that type: 'text' requires content: {text: 'message'} and type: 'prompt' requires content: {uid: 'prompt-id', variables: {}} | major |