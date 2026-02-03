---
endpoint: GET /platform/v1/clients/{client_id}/estimates
domain: clients
tags: []
status: success
savedAt: 2026-02-02T21:15:00.194Z
verifiedAt: 2026-02-02T21:15:00.194Z
timesReused: 0
---
# Get Estimates

## Summary
Endpoint works with directory token, but fails with staff token due to missing permissions. Documentation incorrectly suggests all staff tokens work.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_id | Already resolved in config | config parameters | - | No cleanup needed - using existing client |

### Resolution Steps

**client_id**:
1. Call `Already resolved in config`
2. Extract from response: `config parameters`

```json
{
  "client_id": {
    "source_endpoint": "Already resolved in config",
    "extract_from": "config parameters",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing client"
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
  "path": "/platform/v1/clients/{{resolved.uid}}/estimates"
}
```

## Code Analysis

Source code exploration results from the healing process:

**Service**: core
**Controller**: app/controllers/platform/v1/estimates_controller.rb (lines 30-37)
**DTO/Model**: modules/payments/app/components/payments/estimates_api.rb (lines 39-61)


## Discrepancies Found

Differences between swagger documentation and actual code:

| Aspect | Field | Swagger Says | Code Says | Evidence |
|--------|-------|--------------|-----------|----------|
| missing_field | authentication_requirements | Available for Staff, App, and Directory Tokens | Staff must have can_view_payments? permission | - |
| validation_rule | client_id | Required path parameter | Optional parameter - can be blank, must exist if provided | - |


## Swagger Changes Required

Documentation changes needed based on code analysis:

### 1. authentication

- **File**: swagger/clients/estimates.json
- **Change Type**: add_validation
- **Current**: Available for Staff, App, and Directory Tokens
- **Should be**: Available for Staff tokens (with can_view_payments? permission), App, and Directory Tokens (with X-On-Behalf-Of header)
- **Evidence**: modules/payments/app/components/payments/estimates_api.rb:940-946
  ```
  if authorize_params[:type] == 'user'
  @user = User.find_by_id(authorize_params[:id])
  return false unless @user.present?
  business = @user.staff.business
  authorized = business.uid == action_params[:business_uid] &&
  @user.staff.can_view_payments?
  ```


## Workflow Changes Required

1. **prerequisites**: Add note that staff tokens require can_view_payments? permission
   - Evidence: modules/payments/app/components/payments/estimates_api.rb:945 - Staff authorization check requires can_view_payments? permission
2. **test_request**: Use directory token with X-On-Behalf-Of header as primary approach
   - Evidence: Working API response with directory token - Directory token bypasses individual staff permission checks
