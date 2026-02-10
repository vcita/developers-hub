---
endpoint: POST /platform/v1/webhook/unsubscribe
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:59:05.939Z
verifiedAt: 2026-01-29T08:59:05.939Z
timesReused: 0
---
# Create Unsubscribe

## Summary
Webhook unsubscribe endpoint works successfully. Returns HTTP 200 with 'Unsubscribed' response, indicating successful webhook unsubscription. Found documentation discrepancy regarding expected response code.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/platform/v1/webhook/unsubscribe",
  "body": {
    "event": "client.created",
    "target_url": "https://api.example.com/webhooks/lawfirm-notifications"
  }
}
```