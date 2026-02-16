---
endpoint: "POST /platform/v1/clients/payment/client_packages/update_usage"
domain: clients
tags: [clients, client-packages]
status: skip
savedAt: 2026-02-04T16:32:17.671Z
verifiedAt: 2026-02-04T16:32:17.671Z
timesReused: 0
skipReason: "Blocked by server-side 500 error and missing prerequisite test data (no client payment_requests available to obtain a valid pending payment_status_id)."
---
# Create Update usage

## Summary

User-approved skip: Blocked by server-side 500 error and missing prerequisite test data (no client payment_requests available to obtain a valid pending payment_status_id).

## Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Blocked by server-side 500 error and missing prerequisite test data (no client payment_requests available to obtain a valid pending payment_status_id).

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create update_usage"
    method: POST
    path: "/platform/v1/clients/payment/client_packages/update_usage"
    expect:
      status: [200, 201]
```