---
endpoint: "POST /client/payments/v1/cards"
domain: clients
tags: [cards]
status: skip
savedAt: 2026-02-04T08:30:32.383Z
verifiedAt: 2026-02-04T08:30:32.383Z
timesReused: 0
skipReason: "Requires external prerequisite: connect a credit card processor / enable vaulting for the business (business.vaulting_enabled? must be true). Not possible to satisfy via API-only test in this environment."
---
# Create Cards

## Summary

User-approved skip: Requires external prerequisite: connect a credit card processor / enable vaulting for the business (business.vaulting_enabled? must be true). Not possible to satisfy via API-only test in this environment.

## Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Requires external prerequisite: connect a credit card processor / enable vaulting for the business (business.vaulting_enabled? must be true). Not possible to satisfy via API-only test in this environment.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create cards"
    method: POST
    path: "/client/payments/v1/cards"
    expect:
      status: [200, 201]
```