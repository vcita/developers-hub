---
endpoint: "PUT /v3/business_administration/online_profiles/{uid}"
domain: platform_administration
tags: [online_profiles]
swagger: "swagger/platform_administration/online_profiles.json"
status: verified
savedAt: "2026-01-28T08:04:45.294Z"
verifiedAt: "2026-01-28T08:04:45.294Z"
timesReused: 0
tokens: [staff]
---

# Update Online Profile

## Summary
Updates an existing online profile for a business. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: create_online_profile
    description: "Ensure an online profile exists by attempting to create one"
    method: POST
    path: "/v3/business_administration/online_profiles"
    body:
      supported_languages:
        - en
      privacy_policy_url: "https://example.com/privacy"
    expect:
      status: [200, 201]
    onFail: continue

  - id: get_online_profile
    description: "Fetch existing online profile UID"
    method: GET
    path: "/v3/business_administration/online_profiles"
    extract:
      online_profile_uid: "$.data.online_profiles[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_online_profile
    method: PUT
    path: "/v3/business_administration/online_profiles/{{online_profile_uid}}"
    body:
      supported_languages:
        - en
        - es
      privacy_policy_url: "https://example.com"
    expect:
      status: [200, 201]
```