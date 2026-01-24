---
endpoint: POST /platform/v1/businesses/{business_id}/staffs
domain: platform_administration
tags: []
status: pass
savedAt: 2026-01-23T22:47:01.187Z
verifiedAt: 2026-01-23T22:47:01.187Z
timesReused: 0
---
# Create Staffs

## Summary
Staff creation successful after resolving authentication and validation issues. The endpoint works correctly but requires directory token and valid role.

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
  "path": "/platform/v1/businesses/z17uw5xqe4idicj5/staffs",
  "body": {
    "meta": {
      "invite": "true"
    },
    "staff": {
      "display_name": "Jane Doe",
      "email": "jane.doe.unique@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "role": "user"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| Authentication | Documentation doesn't specify that this endpoint requires a directory token instead of a staff token. The swagger shows 'x-auth-type': 'Application & Application User' but doesn't clarify the token scope needed. | Update documentation to specify that this endpoint requires a directory-scoped token, not a staff token | critical |
| staff.role | Documentation shows role as optional but doesn't specify valid values. The error indicates 'staff' is not a valid role, but valid roles like 'user', 'admin' are not documented. | Add enum values for valid staff roles in the swagger schema (user, admin, etc.) and mark as required or provide default | major |
| meta | Test code shows inconsistency with 'mate:' instead of 'meta:' on line 148, though the API accepts 'meta' correctly | Fix the typo in test code from 'mate:' to 'meta:' for consistency | minor |
| error_handling | When wrong token type is used, API returns generic 'Unauthorized' instead of specific guidance about required token scope | Provide more specific error message indicating that directory token is required | major |