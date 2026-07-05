---
endpoint: "POST /client/payments/v1/cards/save_card_session"
domain: clients
tags: [cards]
status: skip
savedAt: 2026-02-04T08:30:59.139Z
verifiedAt: 2026-02-04T08:30:59.139Z
timesReused: 0
skipReason: "Test environment prerequisites not satisfiable: business does not have required feature flag (cp_add_new_cof) enabled, and client token cannot be acquired to execute endpoint as documented (client_jwt flow fails with 400)."
---
# Create Save card session

## Summary

User-approved skip: Test environment prerequisites not satisfiable: business does not have required feature flag (cp_add_new_cof) enabled, and client token cannot be acquired to execute endpoint as documented (client_jwt flow fails with 400).

## Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Test environment prerequisites not satisfiable: business does not have required feature flag (cp_add_new_cof) enabled, and client token cannot be acquired to execute endpoint as documented (client_jwt flow fails with 400).

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create save_card_session"
    method: POST
    path: "/client/payments/v1/cards/save_card_session"
    expect:
      status: [200, 201]
```