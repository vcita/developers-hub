# POST /v3/scheduling/resources

## Overview
Create a new resource instance belonging to a resource type.

## Authentication
- **Token Type:** Staff Token
- **Required Permission:** `account.settings.manage`
- **Feature Flags Required:** `pkg.sch.resources` and `resources` must be enabled

## Prerequisites

### 1. Get Resource Type UID
The resource must belong to a resource type. Either:
- Use an existing resource type from GET /v3/scheduling/resource_types
- Create a new one via POST /v3/scheduling/resource_types

```bash
curl -X GET "https://app.meet2know.com/apigw/v3/scheduling/resource_types" \
  -H "Authorization: Bearer ${STAFF_TOKEN}" \
  -H "Content-Type: application/json"
```

**Extract:** `resource_type_uid` from response `data.resource_types[].uid`

## Request

```bash
curl -X POST "https://app.meet2know.com/apigw/v3/scheduling/resources" \
  -H "Authorization: Bearer ${STAFF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Resource Name",
    "resource_type_uid": "${resource_type_uid}"
  }'
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Resource name (max 30 characters) |
| resource_type_uid | string | Yes | The resource type this instance belongs to |

## Response

### Success (201)
```json
{
  "data": {
    "uid": "20a30bae-ee20-4708-8db8-f824f919e9c1",
    "name": "Test Resource",
    "resource_type_uid": "f9ed230e-2606-4819-9688-041e0e3618e7",
    "created_at": "2026-02-03T11:13:32.322Z",
    "updated_at": "2026-02-03T11:13:32.322Z",
    "deleted_at": null
  },
  "success": true
}
```

### Common Errors

| Code | Cause | Resolution |
|------|-------|------------|
| 400 | Maximum resources (10) exceeded for resource type | Use a different resource type or delete existing resources |
| 401 | Invalid or expired token | Refresh staff token |
| 403 | Missing permission or feature flag not enabled | Ensure staff has `account.settings.manage` permission and resources feature is enabled |
| 422 | Validation error (e.g., name too long) | Check field constraints |

## Verified
- **Date:** 2026-02-03
- **Status:** Working
- **HTTP Code:** 201
