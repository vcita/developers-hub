---
endpoint: "POST /business/payments/v1/invoices"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:28:12.398Z"
verifiedAt: "2026-01-26T21:28:12.398Z"
timesReused: 0
---

# Create Invoices

## Summary
Test passes after resolving multiple validation issues. The main issue was the 'both_fields' validation rule requiring that if entity_type is provided, entity_uid must also be provided (and vice versa). Other issues included email format validation, status-notification compatibility, discount exclusivity, and index validation.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_invoices
    method: POST
    path: "/business/payments/v1/invoices"
    body:
      invoice:
        additional_recipients:
          "0": test@example.com
        allow_online_payment: true
        allow_partial_payment: true
        billing_address: test_string
        business_name: test_string
        currency: USD
        display_items_total: true
        display_sections_total: true
        due_date: 2024-12-31
        invoice_label: test_string
        invoice_number: 999999
        issue_date: 2024-01-01
        items:
          "0":
            description: test_string
            discount:
              percent: 10
            item_index: 0
            name: test_string
            quantity: 1
            tax_uids:
              "0": "{{uid}}"
            unit_amount: 1
        matter_uid: "{{matter_uid}}"
        note: test_string
        notify_recipient: true
        purchase_order: test_string
        sections:
          "0":
            items:
              "0":
                description: test_string
                discount:
                  percent: 10
                item_index: 0
                name: test_string
                quantity: 1
                tax_uids:
                  "0": "{{uid}}"
                unit_amount: 1
            name: test_string
            section_index: 0
        source_campaign: test_string
        source_channel: test_string
        source_name: test_string
        source_url: test_string
        status: issued
        terms_and_conditions: test_string
    expect:
      status: [200, 201]
```
