---
endpoint: PUT /platform/v1/payment_statuses/{id}/apply_coupon
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-26T07:23:56.372Z
verifiedAt: 2026-01-26T07:23:56.372Z
timesReused: 0
---
# Update Apply coupon

## Summary
Test passes. The apply coupon endpoint correctly requires coupon_code parameter and processes requests properly. Returns 422 'Invalid Coupon' for non-existent coupon codes, which is expected behavior.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
null
```