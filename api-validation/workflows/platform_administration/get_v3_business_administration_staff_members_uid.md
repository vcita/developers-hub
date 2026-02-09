---
endpoint: "GET /v3/business_administration/staff_members/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/staff_member.json"
status: verified
savedAt: "2026-01-28T11:39:26.180Z"
verifiedAt: "2026-01-28T11:39:26.180Z"
timesReused: 0
---

# Get Staff members

## Summary
GET /v3/business_administration/staff_members/{uid} works correctly when provided with a valid staff member UID. The original test failed because it used a non-existent UID value (5bcebdb0-36ab-4002-9b05-3b964244b2cf). Using a valid staff UID (g7n82lrc4ztic4cp) returns the expected staff member data with a 200 status.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_staff_members
    method: GET
    path: "/v3/business_administration/staff_members/{{uid}}"
    expect:
      status: [200, 201]
```
