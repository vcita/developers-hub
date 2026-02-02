---
endpoint: "PUT /business/payments/v1/estimates/{estimate_uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:24:06.349Z
verifiedAt: 2026-01-26T22:24:06.349Z
---

# Update Estimates

## Summary
Test passes after fixing several validation issues found through source code exploration. The endpoint successfully updates estimates when valid data is provided.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_estimates
    method: PUT
    path: "/business/payments/v1/estimates/{estimate_uid}"
    body:
      estimate:
        billing_address: 123 Updated Test St
        business_name: Updated Business Name
        currency: USD
        display_items_total: true
        display_sections_total: true
        due_date: 2024-12-31
        estimate_label: Updated Estimate
        estimate_number: 10123457
        is_signature_required: false
        issue_date: 2024-01-15
        items:
          "0":
            description: Updated item description
            discount:
              percent: 5
            item_index: 0
            name: Updated Item
            quantity: 2
            unit_amount: 150
        note: Updated estimate note
        notify_recipient: false
        purchase_order: PO-UPDATED
        sections:
          "0":
            items:
              "0":
                description: Updated section item
                discount:
                  amount: 10
                item_index: 0
                name: Updated Section Item
                quantity: 1
                unit_amount: 200
            name: Updated Section
            section_index: 0
        status: DRAFT
        terms_and_conditions: Updated terms and conditions
    expect:
      status: [200, 201]
```
