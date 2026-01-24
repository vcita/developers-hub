---
endpoint: POST /platform/v1/apps
domain: apps
tags: []
status: skip
savedAt: 2026-01-23T22:40:58.493Z
verifiedAt: 2026-01-23T22:40:58.493Z
timesReused: 0
skipReason: POST /platform/v1/apps requires OAuth authentication with elevated privileges (app creation capabilities) that are not available in the standard testing environment. This is a legitimate security restriction for a highly privileged operation.
---
# Create Apps

## Summary
App creation endpoint requires elevated privileges not available in test environment. Fixed documentation issues around validation rules and required fields.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

POST /platform/v1/apps requires OAuth authentication with elevated privileges (app creation capabilities) that are not available in the standard testing environment. This is a legitimate security restriction for a highly privileged operation.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| app_code_name | Documentation doesn't specify that app_code_name cannot contain underscores or special characters. Only alphanumeric characters are allowed (regex: ^[a-zA-Z0-9]*$) | Update documentation to specify app_code_name validation rule: 'Only alphanumeric characters (a-z, A-Z, 0-9) allowed. No spaces, underscores, or special characters. Maximum 50 characters.' | critical |
| api_uri | Documentation doesn't mention that api_uri is required when app_type includes 'communication' | Add validation rule: 'api_uri field is required when app_type includes communication' | major |
| payment_data.prices | Documentation shows prices as object but validation expects it to be an array of price objects | Update swagger schema to show prices as array type, not object | major |
| app_screenshot_uris | Documentation shows this as string but validation expects array | Ensure swagger shows this field as array type consistently | major |
| app_mobile_screenshot_uris | Documentation shows this as string but validation expects array | Ensure swagger shows this field as array type consistently | major |