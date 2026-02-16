---
endpoint: GET /client/payments/v1/apps/primary_provider_connected_application
domain: clients
tags: [apps]
status: skip
savedAt: 2026-01-25T21:12:26.168Z
verifiedAt: 2026-01-25T21:12:26.168Z
timesReused: 0
skipReason: This endpoint requires complex payment app configuration including business settings (external_[app_name]_connected=true, payments_gateway_type matching, not in pending mode, and for vcitaPayments: accepted terms). These are business configuration requirements that cannot be easily automated in a test environment without administrative access to business payment settings.
---
# Get Primary provider connected application

## Summary
User-approved skip: This endpoint requires complex payment app configuration including business settings (external_[app_name]_connected=true, payments_gateway_type matching, not in pending mode, and for vcitaPayments: accepted terms). These are business configuration requirements that cannot be easily automated in a test environment without administrative access to business payment settings.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

This endpoint requires complex payment app configuration including business settings (external_[app_name]_connected=true, payments_gateway_type matching, not in pending mode, and for vcitaPayments: accepted terms). These are business configuration requirements that cannot be easily automated in a test environment without administrative access to business payment settings.

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
  "method": "GET",
  "path": "/client/payments/v1/apps/primary_provider_connected_application"
}
```