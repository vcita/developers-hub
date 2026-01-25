---
endpoint: GET /client/payments/v1/deposits/{uid}?matter_uid={matter_uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T21:01:56.373Z
verifiedAt: 2026-01-25T21:01:56.373Z
timesReused: 0
---
# Get Deposits

## Summary
Test passes after creating fresh test data. The endpoint correctly shows deposit details when provided with valid deposit_uid and matter_uid that belong to the authenticated client. Error handling works as documented for invalid UIDs and matter ownership validation.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| deposit_uid | GET /client/payments/v1/deposits | data.deposits[0].uid | ✓ Yes | DELETE /business/payments/v1/deposits/{uid} |
| invoice_uid | POST /business/payments/v1/invoices | data.invoice.uid | - | Prerequisites for deposit creation |

### Resolution Steps

**deposit_uid**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"deposit":{"client_id":"{{client_uid}}","matter_uid":"{{matter_uid}}","amount":{"type":"fixed","value":"100.00","total":"100.00"},"currency":"USD","title":"Test Deposit for API Test {{timestamp}}","entity_uid":"{{invoice_uid}}","entity_type":"Invoice"}}`
2. Extract UID from creation response: `data.deposits[0].uid`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /business/payments/v1/deposits/{uid}`

**invoice_uid**:
1. Call `POST /business/payments/v1/invoices`
2. Extract from response: `data.invoice.uid`

```json
{
  "deposit_uid": {
    "source_endpoint": "GET /client/payments/v1/deposits",
    "extract_from": "data.deposits[0].uid",
    "fallback_endpoint": "POST /business/payments/v1/deposits",
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "deposit": {
        "client_id": "{{client_uid}}",
        "matter_uid": "{{matter_uid}}",
        "amount": {
          "type": "fixed",
          "value": "100.00",
          "total": "100.00"
        },
        "currency": "USD",
        "title": "Test Deposit for API Test {{timestamp}}",
        "entity_uid": "{{invoice_uid}}",
        "entity_type": "Invoice"
      }
    },
    "cleanup_endpoint": "DELETE /business/payments/v1/deposits/{uid}",
    "cleanup_note": "Deposits can be deleted via business endpoint"
  },
  "invoice_uid": {
    "source_endpoint": "POST /business/payments/v1/invoices",
    "extract_from": "data.invoice.uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "invoice": {
        "client_id": "{{client_uid}}",
        "matter_uid": "{{matter_uid}}",
        "currency": "USD",
        "title": "Test Invoice for Deposit API Test {{timestamp}}",
        "issue_date": "2026-01-25",
        "due_date": "2026-02-25",
        "billing_address": {
          "address1": "123 Test St",
          "city": "Test City",
          "state": "TX",
          "zip": "12345",
          "country": "US"
        },
        "items": [
          {
            "name": "Test Service",
            "quantity": 1,
            "unit_amount": 150
          }
        ]
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Prerequisites for deposit creation"
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
  "path": "/client/payments/v1/deposits/npi8kudoa3c7dkt7?matter_uid=dqbqxo258gmaqctk"
}
```