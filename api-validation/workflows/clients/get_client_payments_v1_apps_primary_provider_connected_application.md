---
endpoint: "GET /client/payments/v1/apps/primary_provider_connected_application"
domain: clients
tags: [apps]
status: skip
savedAt: 2026-02-04T16:32:00.981Z
verifiedAt: 2026-02-04T16:32:00.981Z
timesReused: 0
skipReason: "Requires an installed + fully connected payments app for the business (configured payments_gateway_type + external_<provider>_connected flag + additional connection checks). This prerequisite cannot be satisfied in the test environment via available APIs, so the endpoint will always 422 for most fresh businesses."
---
# Get Primary provider connected application

## Summary

User-approved skip: Requires an installed + fully connected payments app for the business (configured payments_gateway_type + external_<provider>_connected flag + additional connection checks). This prerequisite cannot be satisfied in the test environment via available APIs, so the endpoint will always 422 for most fresh businesses.

## Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Requires an installed + fully connected payments app for the business (configured payments_gateway_type + external_<provider>_connected flag + additional connection checks). This prerequisite cannot be satisfied in the test environment via available APIs, so the endpoint will always 422 for most fresh businesses.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get primary_provider_connected_application"
    method: GET
    path: "/client/payments/v1/apps/primary_provider_connected_application"
    expect:
      status: [200, 201]
```