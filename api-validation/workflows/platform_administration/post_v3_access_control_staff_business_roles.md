---
endpoint: "POST /v3/access_control/staff_business_roles"
domain: platform_administration
tags: [access-control]
swagger: "swagger/platform_administration/access_control.json"
status: skipped
savedAt: "2026-01-27T21:33:09.414Z"
verifiedAt: "2026-01-27T21:33:09.414Z"
timesReused: 0
---

# Create Staff business roles

## Summary
User-approved skip: The POST endpoint enforces business rule: each staff member can have only ONE business role. In real environments, staff members automatically get default roles when created, making POST fail with 'already exists' error. This is correct behavior - the endpoint is primarily for edge cases or clean environments. PUT endpoint should be used to update existing role assignments.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_staff_business_roles
    method: POST
    path: "/v3/access_control/staff_business_roles"
    expect:
      status: [200, 201]
```
