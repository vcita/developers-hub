---
endpoint: GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout
domain: clients
tags: []
status: success
savedAt: 2026-02-02T20:28:51.979Z
verifiedAt: 2026-02-02T20:28:51.979Z
timesReused: 0
---
# Get Checkout

## Summary
Endpoint works correctly. Successfully retrieved checkout session for payment request after creating an invoice to get a valid payment_request_uid (which is the payment_status_uid from invoices).

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_request_uid | POST /business/payments/v1/invoices | data.invoice.payment_status_uid | - | - |

### Resolution Steps

**payment_request_uid**:
1. **Create fresh test entity**: `POST /business/payments/v1/invoices`
   - Body template: `{"invoice":{"status":"issued","client_id":"vtm43r97mr79into","matter_uid":"6auccrhy52lyyb0q","currency":"USD","billing_address":"123 Test St, Test City","items":[{"name":"Test Service","quantity":1,"unit_amount":100}],"due_date":"{{next_week_date}}","issue_date":"{{today_date}}"}}`
2. Extract UID from creation response: `data.invoice.payment_status_uid`
3. Run the test with this fresh UID

```json
{
  "payment_request_uid": {
    "source_endpoint": "POST /business/payments/v1/invoices",
    "extract_from": "data.invoice.payment_status_uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/payments/v1/invoices",
    "create_body": {
      "invoice": {
        "status": "issued",
        "client_id": "vtm43r97mr79into",
        "matter_uid": "6auccrhy52lyyb0q",
        "currency": "USD",
        "billing_address": "123 Test St, Test City",
        "items": [
          {
            "name": "Test Service",
            "quantity": 1,
            "unit_amount": 100
          }
        ],
        "due_date": "{{next_week_date}}",
        "issue_date": "{{today_date}}"
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": null
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "GET",
  "path": "/client/payments/v1/payment_requests/{{resolved.uid}}/checkout"
}
```