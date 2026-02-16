---
endpoint: GET /platform/v1/invoices/{invoice_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:04:57.737Z
verifiedAt: 2026-01-26T22:04:57.737Z
timesReused: 0
---
# Get Invoices

## Summary
Test passes successfully. Retrieved invoice details with ID s655udsrcytvq1lr returning complete invoice data including status, client details, items, and payment information.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| invoice_id | Pre-configured parameter | Available in test configuration as s655udsrcytvq1lr | - | Uses existing invoice from test configuration |

### Resolution Steps

**invoice_id**:
1. Call `Pre-configured parameter`
2. Extract from response: `Available in test configuration as s655udsrcytvq1lr`

```json
{
  "invoice_id": {
    "source_endpoint": "Pre-configured parameter",
    "extract_from": "Available in test configuration as s655udsrcytvq1lr",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Uses existing invoice from test configuration"
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
  "path": "/platform/v1/invoices/{{resolved.uid}}"
}
```