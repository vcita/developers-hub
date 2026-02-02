---
endpoint: "POST /v3/license/subscriptions/bulk"
domain: platform_administration
tags: [license, bulk]
swagger: swagger/platform_administration/license.json
status: skip
savedAt: 2026-01-28T11:01:39.356Z
verifiedAt: 2026-01-28T11:01:39.356Z
---

# Create Bulk

## Summary
User-approved skip: The endpoint is documented but not implemented in the backend. This requires backend development to add the missing bulk create functionality.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_bulk
    method: POST
    path: "/v3/license/subscriptions/bulk"
    expect:
      status: [200, 201]
```
