---
endpoint: "POST /v1/partners/accounts"
domain: platform_administration
tags: [partners]
swagger: swagger/platform_administration/legacy/partners-api.json
status: skip
savedAt: 2026-01-28T15:18:48.547Z
verifiedAt: 2026-01-28T15:18:48.547Z
---

# Create Accounts

## Summary
User-approved skip: Infrastructure issue - both primary and fallback API URLs return SSL certificate errors (HTTP 526). The SSL certificates are invalid or expired, preventing any API calls from succeeding. This is not a functional endpoint issue.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_accounts
    method: POST
    path: "/v1/partners/accounts"
    expect:
      status: [200, 201]
```
