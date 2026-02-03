---
endpoint: "POST /platform/v1/businesses/{business_uid}"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-29T08:54:45.682Z
verifiedAt: 2026-01-29T08:54:45.682Z
---

# Create Businesses

## Summary
Endpoint works correctly with directory token. The original failure was due to using staff token which lacks sufficient permissions. Found validation issues with email reuse and business category values.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_businesses
    method: POST
    path: "/platform/v1/businesses/{business_uid}"
    body:
      business:
        business:
          name: Smith Legal Associates Updated
    expect:
      status: [200, 201]
```
