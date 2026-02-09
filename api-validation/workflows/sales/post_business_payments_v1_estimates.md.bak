---
endpoint: POST /business/payments/v1/estimates
domain: sales
tags: []
status: success
savedAt: 2026-01-26T18:42:14.710Z
verifiedAt: 2026-01-26T18:42:14.710Z
timesReused: 0
---
# Create Estimates

## Summary
Test passes after fixing multiple validation issues. The original request had several problems: entity_uid/entity_type validation, item_index requirements, and notify_recipient constraints.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | - | data[0].uid or data[0].id | - | - |

### Resolution Steps

**matter_uid**:

```json
{
  "matter_uid": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
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
  "method": "POST",
  "path": "/business/payments/v1/estimates",
  "body": {
    "estimate": {
      "billing_address": "123 Test Street, Test City, TS 12345",
      "business_name": "Test Business",
      "currency": "USD",
      "display_items_total": true,
      "display_sections_total": true,
      "due_date": "2024-02-01",
      "estimate_label": "Test Estimate",
      "estimate_number": 1003,
      "is_signature_required": true,
      "issue_date": "2024-01-01",
      "items": [
        {
          "description": "Professional consulting services",
          "discount": {
            "amount": 10
          },
          "name": "Consulting Service",
          "quantity": 2,
          "unit_amount": 100,
          "item_index": 0
        }
      ],
      "matter_uid": "{{config.params.matter_uid}}",
      "note": "Test estimate note",
      "notify_recipient": false,
      "purchase_order": "PO-12345",
      "sections": [
        {
          "items": [
            {
              "description": "Professional consulting services - section item",
              "name": "Section Consulting Service",
              "quantity": 1,
              "unit_amount": 150,
              "item_index": 0
            }
          ],
          "name": "Professional Services",
          "section_index": 0
        }
      ],
      "source_campaign": "test_campaign",
      "source_channel": "web",
      "source_name": "website",
      "source_url": "https://example.com",
      "status": "draft",
      "terms_and_conditions": "Standard terms and conditions apply"
    }
  }
}
```