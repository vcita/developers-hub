---
endpoint: "POST /v3/license/bundled_offerings/bulk"
domain: platform_administration
tags: [license, bulk]
swagger: swagger/platform_administration/license.json
status: skip
savedAt: 2026-01-28T09:34:16.332Z
verifiedAt: 2026-01-28T09:34:16.332Z
---

# Create Bulk

## Summary
User-approved skip: The endpoint does not exist in the codebase and cannot be tested until it's implemented. This is a fundamental implementation gap, not a test configuration issue."

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_bulk
    method: POST
    path: "/v3/license/bundled_offerings/bulk"
    expect:
      status: [200, 201]
```
