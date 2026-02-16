---
endpoint: POST /platform/v1/leadgen
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:42:53.839Z
verifiedAt: 2026-01-26T21:42:53.839Z
timesReused: 0
---
# Create Leadgen

## Summary
Test passes with staff or directory token and realistic field values. The original 500 error was caused by using a token where current_user is nil, leading to business.user being nil in the staff assignment logic.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| unique_id | Optional field - not resolved | Not applicable - optional field | - | - |

### Resolution Steps

**unique_id**:
1. Call `Optional field - not resolved`
2. Extract from response: `Not applicable - optional field`

```json
{
  "unique_id": {
    "source_endpoint": "Optional field - not resolved",
    "extract_from": "Not applicable - optional field",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/platform/v1/leadgen",
  "body": {
    "address": "123 Test Street, Test City, TC 12345",
    "business_id": "{{config.params.business_id}}",
    "email": "leadtest2@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "identifier_type": "email",
    "message_data": {
      "source": "website",
      "priority": "normal"
    },
    "notifications": "email,sms",
    "opt_in": "yes",
    "opt_in_transactional_sms": true,
    "phone": "+1234567891",
    "request_data": {
      "company": "Test Company 2",
      "budget": "10000"
    },
    "request_title": "Another Lead Inquiry",
    "source": "directory",
    "source_url": "https://example.com/contact",
    "status": "lead",
    "system_message": "New lead has been created from directory integration",
    "tags": "directory,lead,medium-priority"
  }
}
```