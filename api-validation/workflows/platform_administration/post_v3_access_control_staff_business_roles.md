---
endpoint: POST /v3/access_control/staff_business_roles
domain: platform_administration
tags: [access-control]
status: skip
savedAt: 2026-01-27T21:33:09.414Z
verifiedAt: 2026-01-27T21:33:09.414Z
timesReused: 0
skipReason: The POST endpoint enforces business rule: each staff member can have only ONE business role. In real environments, staff members automatically get default roles when created, making POST fail with 'already exists' error. This is correct behavior - the endpoint is primarily for edge cases or clean environments. PUT endpoint should be used to update existing role assignments.
---
# Create Staff business roles

## Summary
User-approved skip: The POST endpoint enforces business rule: each staff member can have only ONE business role. In real environments, staff members automatically get default roles when created, making POST fail with 'already exists' error. This is correct behavior - the endpoint is primarily for edge cases or clean environments. PUT endpoint should be used to update existing role assignments.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The POST endpoint enforces business rule: each staff member can have only ONE business role. In real environments, staff members automatically get default roles when created, making POST fail with 'already exists' error. This is correct behavior - the endpoint is primarily for edge cases or clean environments. PUT endpoint should be used to update existing role assignments.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/v3/access_control/staff_business_roles"
}
```