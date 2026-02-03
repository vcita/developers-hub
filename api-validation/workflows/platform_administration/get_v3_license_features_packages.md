---
endpoint: "GET /v3/license/features_packages"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-27T09:02:46.499Z
verifiedAt: 2026-01-27T09:02:46.499Z
---

# Get Features packages

## Summary
Test passes. The endpoint GET /v3/license/features_packages requires directory token for authentication and returns a comprehensive list of features packages with detailed information including quotas, settings, and associated features.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_features_packages
    method: GET
    path: "/v3/license/features_packages"
    expect:
      status: [200, 201]
```
