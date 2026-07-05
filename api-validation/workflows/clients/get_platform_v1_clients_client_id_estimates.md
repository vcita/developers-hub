---
endpoint: "GET /platform/v1/clients/{client_id}/estimates"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: verified
savedAt: "2026-02-02T21:15:00.194Z"
verifiedAt: "2026-02-02T21:15:00.194Z"
timesReused: 0
tokens: [directory]
---
# Get Estimates

## Summary
**Requires Directory token with X-On-Behalf-Of header.** Staff OAuth tokens fail with 422 "Unauthorized" even when they have `payments.manage` permission, due to authorization type mismatch in `EstimatesAPI.authorize_action` which requires `authorize_params[:type] == 'user'`.

## Prerequisites
None required for this endpoint.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_id | Already resolved in config | config parameters | - | No cleanup needed - using existing client |

### Resolution Steps

**client_id**:
1. Call `Already resolved in config`
2. Extract from response: `config parameters`



## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

1. **Staff tokens fail despite having `payments.manage` permission** - The authorization logic in `EstimatesAPI.authorize_action` requires `authorize_params[:type] == 'user'`, which Staff OAuth tokens don't satisfy.
2. **Directory tokens with X-On-Behalf-Of work** - When a Directory token with `X-On-Behalf-Of` header is used, the authentication flow converts it to `type: 'user'` with the staff user, satisfying the authorization check.
3. **Use Directory token pattern for payment-related endpoints** - This is the reliable authentication pattern for endpoints using `EstimatesAPI` authorization.

## Test Request

Use this template with dynamically resolved UIDs:

```yaml
steps:
  - id: get_estimates
    description: "Get estimates for client using directory token"
    method: GET
    path: "/platform/v1/clients/{{client_id}}/estimates"
    token: directory
    headers:
      X-On-Behalf-Of: "{{business_id}}"
    expect:
      status: [200, 201]
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
