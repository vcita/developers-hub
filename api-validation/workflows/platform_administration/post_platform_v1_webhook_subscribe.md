---
endpoint: POST /platform/v1/webhook/subscribe
domain: platform_administration
tags: [webhooks, subscriptions, platform]
status: verified
savedAt: 2026-01-23T06:51:52.295Z
verifiedAt: 2026-01-23T06:51:52.295Z
timesReused: 0
---
# Create Subscribe

## Summary
Subscribe to webhook with correct parameter format

## Prerequisites
Valid staff token with appropriate permissions for webhook management

## How to Resolve Parameters
1. Use 'event' parameter instead of separate 'entity' and 'event_type' parameters
2. Format the event as '{entity}/{event_type}' (e.g., 'account/approved')
3. Use 'target_url' parameter instead of 'url'
4. Expect HTTP 201 success response with {"response": "Subscribed"}

## Critical Learnings

- **Parameter format mismatch** - API documentation shows entity/event_type/url but actual API expects event/target_url with combined event format
- **Event format** - Event parameter should combine entity and event type as 'entity/event_type' (e.g., 'account/approved', 'meeting/created')
- **Success response** - Returns HTTP 201 with {"response": "Subscribed"} on success

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/platform/v1/webhook/subscribe",
  "body": {
    "event": "account/approved",
    "target_url": "https://my.domain.com/path/of/webhook/call"
  }
}
```

## Documentation Fix Suggestions

No documentation issues found.