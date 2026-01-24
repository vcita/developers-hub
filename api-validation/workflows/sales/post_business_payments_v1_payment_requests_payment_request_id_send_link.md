---
endpoint: POST /business/payments/v1/payment_requests/{payment_request_id}/send_link
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T09:27:18.076Z
verifiedAt: 2026-01-23T09:27:18.076Z
timesReused: 0
---
# Create Send link

## Summary
Successfully resolved the failing test. The original payment_request_id (539i6m75rjzgzodi) was in 'paid' status, but the endpoint requires 'pending' status to send links. Used a different payment request (th8be4uk5pzqmo4v) with pending status, and the request succeeded with 201 Created.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| payment_request_id | /business/payments/v1/payment_requests | - | No |

```json
{
  "payment_request_id": {
    "source_endpoint": "/business/payments/v1/payment_requests",
    "resolved_value": "th8be4uk5pzqmo4v",
    "used_fallback": false,
    "fallback_endpoint": null
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
  "path": "/business/payments/v1/payment_requests/th8be4uk5pzqmo4v/send_link",
  "body": {
    "channel": "email"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| payment_request_id | The error message 'Payment Status Not Pending' indicates that only payment requests with pending status can have links sent, but this business rule is not documented in the API specification | Add documentation stating that the payment request must have status 'pending' to send links, and specify which statuses are valid for this operation | major |