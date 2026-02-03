---
endpoint: GET /client/payments/v1/packages/{package_id}
domain: clients
tags: []
status: success
savedAt: 2026-02-02T21:05:24.642Z
verifiedAt: 2026-02-02T21:05:24.642Z
timesReused: 0
---
# Get Packages

## Summary
Endpoint works correctly but has parameter naming discrepancy. The route expects 'uid' but swagger documents it as 'package_id'. The endpoint properly returns structured error for non-existent packages.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| package_id | GET /client/payments/v1/packages | data.packages[0].uid | - | No DELETE endpoint available for packages |

### Resolution Steps

**package_id**:
1. Call `GET /client/payments/v1/packages`
2. Extract from response: `data.packages[0].uid`
3. If empty, create via `POST /platform/v1/payment/packages`

```json
{
  "package_id": {
    "source_endpoint": "GET /client/payments/v1/packages",
    "extract_from": "data.packages[0].uid",
    "fallback_endpoint": "POST /platform/v1/payment/packages",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "business_id": "{{business_id}}",
      "package": {
        "name": "Test Package {{timestamp}}",
        "price": "100.0",
        "currency": "USD",
        "description": "Test package for API testing",
        "active": true
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "No DELETE endpoint available for packages"
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
null
```

## Code Analysis

Source code exploration results from the healing process:

**Service**: core
**Controller**: modules/payments/app/controllers/client/payments/v1/packages_controller.rb (lines 8-14)
**DTO/Model**: modules/payments/app/config/routes/payments_routes.rb (lines 60)


## Discrepancies Found

Differences between swagger documentation and actual code:

| Aspect | Field | Swagger Says | Code Says | Evidence |
|--------|-------|--------------|-----------|----------|
| missing_field | package_id | Path parameter named 'package_id' of type string | Route expects parameter named 'uid' (param: :uid) | - |
| extra_field | uid | No mention of uid parameter | Controller accesses params[:uid] and route defines param: :uid | - |


## Swagger Changes Required

Documentation changes needed based on code analysis:

### 1. package_id

- **File**: swagger/client/payments/packages.json
- **Change Type**: remove_field
- **Current**: Path parameter 'package_id' of type string
- **Should be**: Should be removed
- **Evidence**: modules/payments/app/config/routes/payments_routes.rb:60
  ```
  resources :packages, only: [:show], param: :uid
  ```

### 2. uid

- **File**: swagger/client/payments/packages.json
- **Change Type**: add_field
- **Current**: Not documented
- **Should be**: Path parameter 'uid' of type string
- **Evidence**: modules/payments/app/config/routes/payments_routes.rb:60
  ```
  resources :packages, only: [:show], param: :uid
  ```


## Workflow Changes Required

1. **prerequisites**: Update parameter name from 'package_id' to 'uid' in the extract step
   - Evidence: modules/payments/app/config/routes/payments_routes.rb:60 - Route defines param: :uid, not package_id
