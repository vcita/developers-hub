---
endpoint: POST /business/payments/v1/scheduled_payments_rules
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:12:16.747Z
verifiedAt: 2026-01-23T22:12:16.747Z
timesReused: 0
---
# Create Scheduled payments rules

## Summary
Test passed after resolving payment_method.uid with valid card UID. Original request used data entity UID instead of card UID.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| matter_uid | /business/clients/v1/contacts/2l2ut3opxv7heqcq/matters | Not needed - matter already exists | No |
| card_uid | /platform/v1/clients/2l2ut3opxv7heqcq/payment/cards | Not needed - found existing card | No |

```json
{
  "matter_uid": {
    "source_endpoint": "/business/clients/v1/contacts/2l2ut3opxv7heqcq/matters",
    "resolved_value": "b265c1w0zqokgkz8",
    "used_fallback": false,
    "fallback_endpoint": "Not needed - matter already exists"
  },
  "card_uid": {
    "source_endpoint": "/platform/v1/clients/2l2ut3opxv7heqcq/payment/cards",
    "resolved_value": "9s9axwdjg9svlvig",
    "used_fallback": false,
    "fallback_endpoint": "Not needed - found existing card"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/payments/v1/scheduled_payments_rules",
  "body": {
    "scheduled_payments_rule": {
      "name": "Monthly Retainer Payment",
      "amount": "500.00",
      "currency": "USD",
      "start_date": "2026-02-01",
      "frequency_type": "Monthly",
      "cycles": "12",
      "send_receipt": "true",
      "matter_uid": "b265c1w0zqokgkz8",
      "description": "Monthly retainer payment for legal services",
      "payment_method": {
        "type": "card",
        "uid": "9s9axwdjg9svlvig"
      }
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| payment_method.uid | Documentation or example request may suggest using any UID, but API specifically requires a valid card UID from the client's payment cards | Clarify in documentation that payment_method.uid must be a valid card UID obtained from GET /platform/v1/clients/{client_id}/payment/cards | major |