---
endpoint: "GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout"
domain: clients
tags: [payments, checkout, client]
swagger: "swagger/clients/legacy/clients_payments.json"
status: pending
savedAt: "2026-02-02T20:28:51.979Z"
verifiedAt: "2026-02-02T20:28:51.979Z"
timesReused: 0
tokens: [staff, client]
---

# Get Payment Request Checkout

## Summary

Retrieves the checkout session for a payment request. The `payment_request_uid` is the same as `payment_status_uid` from an invoice. Create an invoice via staff token first, then call this endpoint with the client token.

**Token Type**: Prerequisite uses **Staff token**; main request uses **Client token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Checkout session retrieved |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Payment request not found |

## Prerequisites

```yaml
steps:
  - id: create_invoice
    description: "Create an invoice to obtain payment_request_uid (payment_status_uid)"
    method: POST
    path: "/business/payments/v1/invoices"
    token: staff
    body:
      invoice:
        status: "issued"
        client_id: "{{client_uid}}"
        matter_uid: "{{matter_uid}}"
        currency: "USD"
        billing_address: "123 Test St, Test City"
        items:
          - name: "Test Service"
            quantity: 1
            unit_amount: 100
        due_date: "{{future_datetime}}"
        issue_date: "{{current_date}}"
    extract:
      payment_request_uid: "$.data.invoice.payment_status_uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_checkout
    description: "Get checkout session for the payment request"
    method: GET
    path: "/client/payments/v1/payment_requests/{{payment_request_uid}}/checkout"
    token: client
    expect:
      status: [200]
```

## UID Resolution Procedure

| UID Field | Source | Extract Path | Notes |
|-----------|--------|--------------|-------|
| payment_request_uid | POST /business/payments/v1/invoices (staff) | $.data.invoice.payment_status_uid | Same as payment_status_uid on the created invoice |
| client_id / matter_uid | config.params | client_uid, matter_uid | From tokens.json |

## Notes

- Requires test data: use client_uid and matter_uid from config. Create a fresh invoice to avoid "already exists" errors when re-running.
- Main request must use client token; prerequisite uses staff token.
