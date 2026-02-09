---
endpoint: "PUT /v3/business_administration/online_profiles/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/online_profiles.json"
status: verified
savedAt: "2026-01-28T08:04:45.294Z"
verifiedAt: "2026-01-28T08:04:45.294Z"
timesReused: 0
---

# Update Online profiles

## Summary
Test passes after using valid online profile UID and ISO language codes. The original error was due to using placeholder 'test_string' instead of valid language codes like 'en', 'es'.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_online_profiles
    method: PUT
    path: "/v3/business_administration/online_profiles/{{uid}}"
    body:
      supported_languages:
        "0": en
        "1": es
      privacy_policy_url: https://example.com
    expect:
      status: [200, 201]
```
