---
endpoint: POST /v3/access_control/business_roles
domain: platform_administration
tags: []
status: pass
savedAt: 2026-01-23T21:40:21.358Z
verifiedAt: 2026-01-23T21:40:21.358Z
timesReused: 0
---
# Create Business roles

## Summary
Successfully created a BusinessRole after correcting invalid permissions. The endpoint works correctly but the original request failed due to unregistered permissions keys.

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
  "path": "/v3/access_control/business_roles",
  "body": {
    "code": "test_role_unique",
    "name": "Test Role",
    "description": "Test role for API testing",
    "is_editable": true,
    "permissions": [
      {
        "key": "reports.manage",
        "allow": true
      }
    ]
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| permissions[].key | The example request used permission keys (payments.invoices.import, payments.invoices.view, payments.invoices.delete, payments.invoices.create) that are not registered in the system. Only certain permission keys are valid. | Update documentation to show only valid registered permission keys. Valid examples include: reports.manage, campaigns.manage, payments.invoices.export, payments.manage, etc. The API validates that permission keys must exist in the registered permissions list. | critical |