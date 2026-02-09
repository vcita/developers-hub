---
endpoint: "PUT /business/payments/v1/invoices/{invoice_uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-27T05:08:36.251Z
verifiedAt: 2026-01-27T05:08:36.251Z
---

# Update Invoices

## Summary
Test passes after removing the entity_type field without corresponding entity_uid. The validation requires both entity_type and entity_uid to be provided together, or both omitted.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_invoices
    method: PUT
    path: "/business/payments/v1/invoices/{invoice_uid}"
    body:
      invoice:
        additional_recipients:
          "0": test@example.com
        allow_online_payment: true
        allow_partial_payment: true
        billing_address: 456 Updated Street
        business_name: Updated Business Name
        currency: USD
        display_items_total: true
        display_sections_total: true
        due_date: 2024-03-15
        invoice_label: UPDATED INVOICE
        invoice_number: 174021451
        issue_date: 2024-01-20
        items:
          "0":
            description: Updated service description
            item_index: 0
            name: Updated Service Name
            quantity: 2
            unit_amount: 150
        note: Updated invoice note
        notify_recipient: true
        purchase_order: PO-12345
        sections:
          "0":
            items:
              "0":
                description: Section item description
                item_index: 0
                name: Section Service
                quantity: 1
                unit_amount: 200
            name: Section 1
            section_index: 0
        status: issued
        terms_and_conditions: Updated terms and conditions
    expect:
      status: [200, 201]
```
