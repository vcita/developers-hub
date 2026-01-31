---
endpoint: GET /platform/v1/businesses
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T07:48:58.231Z
verifiedAt: 2026-01-28T07:48:58.231Z
timesReused: 0
---
# Get Businesses

## Summary
Test passes after providing required query parameters. The endpoint requires email, external_id, or external_reference_id filter parameters. Original request failed because no filters were provided, but adding ?email=updated-admin-123456@example.com returns HTTP 200 with business data.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| filter_parameters | GET /platform/v1/businesses/{business_id} | data.business.admin_account.email (for email filter) or data.business.id (for external_id filter) | - | - |

### Resolution Steps

**filter_parameters**:
1. Call `GET /platform/v1/businesses/{business_id}`
2. Extract from response: `data.business.admin_account.email (for email filter) or data.business.id (for external_id filter)`
3. If empty, create via `Use any valid email, external_id, or external_reference_id as query parameter`

```json
{
  "filter_parameters": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}",
    "extract_from": "data.business.admin_account.email (for email filter) or data.business.id (for external_id filter)",
    "fallback_endpoint": "Use any valid email, external_id, or external_reference_id as query parameter",
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
  "method": "GET",
  "path": "/platform/v1/businesses?email=updated-admin-123456@example.com"
}
```