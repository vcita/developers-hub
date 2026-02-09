---
endpoint: "GET /platform/v1/invoices/{invoice_id}"
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-26T22:04:57.737Z
verifiedAt: 2026-01-26T22:04:57.737Z
---

# Get Invoices

## Summary
Test passes successfully. Retrieved invoice details with ID s655udsrcytvq1lr returning complete invoice data including status, client details, items, and payment information.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_invoices
    method: GET
    path: "/platform/v1/invoices/{invoice_id}"
    expect:
      status: [200, 201]
```
