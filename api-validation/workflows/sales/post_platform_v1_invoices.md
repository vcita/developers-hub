---
endpoint: POST /platform/v1/invoices
domain: sales
tags: []
status: skip
savedAt: 2026-01-23T22:48:32.588Z
verifiedAt: 2026-01-23T22:48:32.588Z
timesReused: 0
skipReason: Invoice number 12345 already exists in the system - each invoice must have a unique number within the business
---
# Create Invoices

## Summary
Skipped based on cached workflow - Invoice number 12345 already exists in the system - each invoice must have a unique number within the business

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Invoice number 12345 already exists in the system - each invoice must have a unique number within the business

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

No documentation issues found.