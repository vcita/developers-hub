---
endpoint: POST /platform/v1/businesses/{business_id}/staffs
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T07:56:36.053Z
verifiedAt: 2026-01-29T07:56:36.053Z
timesReused: 0
---
# Create Staffs

## Summary
Successfully created staff member after resolving authentication and validation issues

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

**IMPORTANT**: The email field must be unique across the platform. Use a timestamp or UUID suffix to ensure uniqueness.

```json
{
  "method": "POST",
  "path": "/platform/v1/businesses/{{resolved.uid}}/staffs",
  "body": {
    "meta": {
      "invite": true
    },
    "staff": {
      "email": "test.staff.{{timestamp}}@example.com",
      "display_name": "Test Staff {{timestamp}}",
      "first_name": "Test",
      "last_name": "Staff",
      "role": "user"
    }
  }
}
```

**Note**: Replace `{{timestamp}}` with `Date.now()` or a UUID to generate unique emails for each test run. Example: `test.staff.1738135123456@example.com`