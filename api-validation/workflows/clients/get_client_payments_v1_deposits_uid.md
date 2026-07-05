---
endpoint: "GET /client/payments/v1/deposits/{deposit_uid}?matter_uid={matter_uid}"
domain: clients
tags: [deposits, payments]
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: "2026-01-26T05:30:19.344Z"
verifiedAt: "2026-02-06T14:00:00.000Z"
timesReused: 0
tokens: [client]
---

# Get Deposit

## Summary
Retrieves details of a specific deposit by its unique identifier. Deposits are associated with invoices or estimates and represent partial payment requirements. The prerequisites create an invoice on the client token's matter and then create a deposit against that invoice, ensuring the client token can access the deposit.

**Token Type**: This endpoint requires a **Client token**.

## Prerequisites

```yaml
steps:
  - id: create_invoice
    description: "Create an invoice on the client token's matter to serve as the deposit entity"
    method: POST
    path: "/business/payments/v1/invoices"
    token: staff
    body:
      invoice: {"matter_uid": "{{matter_uid}}", "issue_date": "{{today_date}}", "due_date": "{{next_month_date}}", "currency": "USD", "billing_address": "123 Test St", "items": [{"name": "Deposit test item", "description": "Item for deposit testing", "quantity": 1, "unit_amount": 10000}], "notify_recipient": false}
    extract:
      invoice_uid: "$.data.invoice.uid"
      invoice_matter_uid: "$.data.invoice.matter_uid"
    expect:
      status: [200, 201]
    onFail: abort

  - id: create_deposit
    description: "Create a deposit against the invoice"
    method: POST
    path: "/business/payments/v1/deposits"
    token: staff
    body:
      deposit: {"matter_uid": "{{invoice_matter_uid}}", "entity_uid": "{{invoice_uid}}", "entity_type": "Invoice", "amount": {"type": "precentage", "value": 50, "total": 5000}, "currency": "USD"}
    extract:
      deposit_uid: "$.data.deposit.uid"
      deposit_matter_uid: "$.data.deposit.matter_uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_deposit
    method: GET
    path: "/client/payments/v1/deposits/{{deposit_uid}}?matter_uid={{deposit_matter_uid}}"
    token: client
    expect:
      status: [200]
```

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| matter_uid | Config params | config.params.matter_uid | The matter belonging to the client token's user |
| invoice_uid | POST /business/payments/v1/invoices | $.data.invoice.uid | Created invoice UID |
| invoice_matter_uid | POST /business/payments/v1/invoices | $.data.invoice.matter_uid | Matter associated with the invoice |
| deposit_uid | POST /business/payments/v1/deposits | $.data.deposit.uid | Created deposit UID |
| deposit_matter_uid | POST /business/payments/v1/deposits | $.data.deposit.matter_uid | Matter associated with the deposit |

## Notes

- The invoice body must be wrapped in an `invoice` key and requires: `matter_uid`, `issue_date`, `due_date`, `currency`, `billing_address`, `items`
- Invoice items require `name`, `quantity`, and `unit_amount` (not `unit_price`)
- The deposit body must be wrapped in a `deposit` key
- The deposit `amount.type` must be `precentage` (note: intentional typo in the backend code)
- `notify_recipient: false` prevents sending emails during test
- The `matter_uid` must belong to the client associated with the client token, otherwise the GET will fail with "Matter doesn't belong to client"
- Both invoice and deposit creation endpoints require the fallback API (handled automatically via recursive workflow lookup)
