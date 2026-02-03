---
endpoint: "POST /v3/business_administration/online_profiles"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/online_profiles.json
status: success
savedAt: 2026-01-29T08:50:12.951Z
verifiedAt: 2026-01-29T08:50:12.951Z
---

# Create Online profiles

## Summary
Online profiles are unique per business. To test POST (creation), you must first create a new business (with a business admin) that doesn't have an online profile yet, then create the online profile for that business.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_online_profiles
    method: POST
    path: "/v3/business_administration/online_profiles"
    expect:
      status: [200, 201]
```
