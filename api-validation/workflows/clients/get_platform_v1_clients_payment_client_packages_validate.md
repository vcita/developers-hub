---
endpoint: "GET /platform/v1/clients/payment/client_packages/validate"
domain: clients
tags: [packages, validation]
swagger: "swagger/clients/legacy/legacy_v1_clients.json"
status: verified
savedAt: "2026-01-25T09:10:11.000Z"
verifiedAt: "2026-02-05T00:00:00.000Z"
timesReused: 0
---

# Validate Client Package Redemption

## Summary

Validates whether a client package can be redeemed for a given payment status. The endpoint requires a `payment_status_id` query parameter referencing a **pending** payment request.

**Token Type**: This endpoint requires a **Client token**.

**Status**: [Alpha] - This endpoint is experimental and has known limitations.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Package validation result returned (has_package: true/false) |
| 422 | Payment status is already paid, or validation error |
| 500 | Server Error - payment_status_id is missing or invalid (see Known Issues) |

## Known Issues

This endpoint has a known server-side bug that causes a 500 error when:
1. The `payment_status_id` parameter is missing or empty
2. The `payment_status_id` references a virtual booking that cannot be retrieved

The error message is: `"undefined local variable or method 'exception' for Components::Payments::ClientPackagesAPI:Module"`

**Workaround**: Always provide a valid `payment_status_id` that references a pending payment status from the client's payment history.

## Prerequisites

Create an invoice if no pending payment requests exist, then extract the payment_status_id from a pending payment request.

```yaml
steps:
  - id: create_invoice
    description: "Create an invoice to ensure a pending payment request exists"
    method: POST
    path: "/business/payments/v1/invoices"
    token: staff
    body:
      invoice:
        status: issued
        client_id: "{{client_uid}}"
        matter_uid: "{{matter_uid}}"
        staff_id: "{{staff_uid}}"
        currency: USD
        billing_address: "123 Test Street"
        items: [{"name":"Test Service","quantity":1,"unit_amount":50}]
        issue_date: "{{today_date}}"
        due_date: "{{next_week_date}}"
    extract:
      payment_status_id: "$.data.invoice.payment_status_uid"
    expect:
      status: [201, 200]
```

## Test Request

```yaml
steps:
  - id: get_validate
    description: "Validate client package redemption - expects 200 with pending payment"
    method: GET
    path: "/platform/v1/clients/payment/client_packages/validate"
    token: client
    params:
      payment_status_id: "{{payment_status_id}}"
    expect:
      status: [200]
```

## Critical Learnings

1. **Pending payment requests return 200** - With `has_package: true/false` indicating if a package credit can be applied
2. **Paid payment requests return 422** - "Payment status is already paid" error - to test 200, use a fresh business or create new invoice
3. **Missing parameter causes 500** - Due to a known bug, missing payment_status_id causes a 500 error instead of a validation error
4. **Create invoice for fresh data** - Use `/v3/payments/invoices` with staff token to create a pending payment request

## Notes

- The endpoint validates whether the client has an active package with available credits for the service in the payment request
- For testing, always use a **pending** payment request (create a new invoice if needed)
- If getting 422, create a new business or invoice to get fresh test data
- This is an [Alpha] endpoint and may have additional undocumented behaviors
