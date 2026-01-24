---
endpoint: POST /platform/v1/estimates
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:48:03.642Z
verifiedAt: 2026-01-23T22:48:03.642Z
timesReused: 0
---
# Create Estimates

## Summary
POST /platform/v1/estimates endpoint works successfully when estimate_number is omitted, allowing the system to auto-generate a unique number. The error occurred because manually specified estimate numbers were conflicting with existing estimates.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| client_id | Already resolved | - | No |
| conversation_id | Already resolved | - | No |

```json
{
  "client_id": {
    "source_endpoint": "Already resolved",
    "resolved_value": "2l2ut3opxv7heqcq",
    "used_fallback": false
  },
  "conversation_id": {
    "source_endpoint": "Already resolved",
    "resolved_value": "x951z7v34zqy5m2o",
    "used_fallback": false
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
  "path": "/platform/v1/estimates",
  "body": {
    "client_id": "2l2ut3opxv7heqcq",
    "due_date": "2026-02-23T22:47:22.347Z",
    "estimate_date": "2026-01-23T22:47:22.347Z",
    "currency": "USD",
    "address": "123 Business Street, Suite 100, New York, NY 10001",
    "client_address": "456 Client Avenue, Los Angeles, CA 90210",
    "client_name": "John Smith",
    "conversation_id": "x951z7v34zqy5m2o",
    "title": "Legal Services Estimate",
    "items": [
      {
        "title": "Legal Consultation",
        "description": "Initial consultation and case review",
        "amount": 250,
        "quantity": 2,
        "discount": 0,
        "taxes": [
          {
            "name": "Sales Tax",
            "rate": 8.5
          }
        ]
      },
      {
        "title": "Document Preparation",
        "description": "Preparation of legal documents",
        "amount": 500,
        "quantity": 1,
        "discount": 50,
        "taxes": [
          {
            "name": "Sales Tax",
            "rate": 8.5
          }
        ]
      }
    ],
    "note": "Payment terms: Net 30 days. Please contact us if you have any questions about this estimate.",
    "send_email": true,
    "status": "issued",
    "source_campaign": "Q1 Marketing Campaign",
    "source_channel": "Website",
    "source_name": "Contact Form",
    "source_url": "https://example.com/contact"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| estimate_number | Documentation should clarify that estimate_number is optional and if provided must be unique. When omitted, the system auto-generates a unique number starting from 1000001. | Update swagger documentation to mark estimate_number as optional and add a note: 'If not provided, a unique estimate number will be auto-generated. If provided, must be unique within the business.' | major |