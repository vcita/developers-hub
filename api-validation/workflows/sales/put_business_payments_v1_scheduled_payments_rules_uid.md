---
endpoint: "PUT /business/payments/v1/scheduled_payments_rules/{uid}"
domain: sales
tags: [payments, scheduled_payments, recurring]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: 2026-01-27T05:47:09.538Z
verifiedAt: 2026-02-07T07:48:55.000Z
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "No active scheduled payment rules exist in the test environment. The API validates that only 'active' scheduled payment rules can be updated."
tokens: [staff]
---

# Update Scheduled Payment Rule

## Summary

Updates an existing scheduled payment rule. The API validates that only 'active' scheduled payment rules can be updated. Since no active rules exist in the test environment, this endpoint consistently returns 422 with a validation error.

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Scheduled payment rule updated |
| 404 | Not Found - Scheduled payment rule UID doesn't exist |
| 422 | Unprocessable Entity - Rule is not active or validation failed |

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: update_scheduled_payments_rule
    description: "Attempt to update a non-existent scheduled payment rule"
    method: PUT
    path: "/business/payments/v1/scheduled_payments_rules/spr_test_missing"
    body:
      scheduled_payments_rule:
        payment_method:
          type: card
          uid: "card_test_missing"
    expect:
      status: [422]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uid | string | Yes | Scheduled payment rule UID |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| scheduled_payments_rule | object | Yes | Container for rule updates |
| scheduled_payments_rule.payment_method | object | No | Payment method to update |
| scheduled_payments_rule.payment_method.type | string | No | Must be "card" |
| scheduled_payments_rule.payment_method.uid | string | No | Card payment method UID |

## Critical Learnings

1. **Active Status Required**: Only scheduled payment rules with status 'active' can be updated
2. **Staff Token Works**: Unlike some other `/business/payments/v1/*` endpoints, this works with staff token through main API gateway
3. **Expected 422**: This is the correct behavior when no active rules exist or UID doesn't exist
4. **Payment Method Updates**: Primary use case is updating card payment methods on existing rules

## Notes

- Scheduled payments are not fully supported in test environments
- The 422 response with "Not Found" error is expected behavior
- Payment method updates are the primary use case for this endpoint
- Only card payment methods are currently supported for scheduled payments
- Returns same error whether UID doesn't exist or rule isn't active