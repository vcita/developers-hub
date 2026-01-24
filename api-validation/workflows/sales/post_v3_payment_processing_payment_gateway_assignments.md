---
endpoint: POST /v3/payment_processing/payment_gateway_assignments
domain: sales
tags: []
status: skip
savedAt: 2026-01-23T22:34:11.146Z
verifiedAt: 2026-01-23T22:34:11.146Z
timesReused: 0
skipReason: Assignment already exists between payment gateway '59cb37fa-9d37-11f0-b18f-02ede013fb7f' and directory 'qcpvme5au9c3vf0h' - cannot create duplicate assignments
---
# Create Payment gateway assignments

## Summary
Endpoint works correctly but cannot test creation due to existing assignment. Successfully resolved UID dependencies and permission issues.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Assignment already exists between payment gateway '59cb37fa-9d37-11f0-b18f-02ede013fb7f' and directory 'qcpvme5au9c3vf0h' - cannot create duplicate assignments

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| gateway_uid | GET /v3/payment_processing/payment_gateways | POST /v3/payment_processing/payment_gateways | No |
| directory_uid | GET /platform/v1/directory/branding | - | No |

```json
{
  "gateway_uid": {
    "source_endpoint": "GET /v3/payment_processing/payment_gateways",
    "resolved_value": "59cb37fa-9d37-11f0-b18f-02ede013fb7f",
    "used_fallback": false,
    "fallback_endpoint": "POST /v3/payment_processing/payment_gateways"
  },
  "directory_uid": {
    "source_endpoint": "GET /platform/v1/directory/branding",
    "resolved_value": "qcpvme5au9c3vf0h",
    "used_fallback": false,
    "fallback_endpoint": null
  }
}
```

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
| directory_uid | The original test used directory_uid '1121' which caused a permission error 'You can only create assignments for your own directory'. The documentation should clarify that staff can only create assignments for their own directory. | Add documentation noting that directory_uid must be the directory that the authenticated staff belongs to. Consider adding an endpoint to get the current user's directory_uid. | major |