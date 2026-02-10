---
endpoint: "POST /v3/business_administration/online_profiles"
domain: platform_administration
tags: [online_profiles]
swagger: "swagger/platform_administration/online_profiles.json"
status: pending
savedAt: 2026-02-10T05:15:00.000Z
verifiedAt: 2026-02-10T05:15:00.000Z
timesReused: 0
useFallbackApi: false
tokens: [directory]
---

# Create Online Profile

## Summary
Creates a new online profile for a business. **Token Type**: Requires a **staff token** with `can_access_admin_account` permission.

**Important**: Online profiles are singleton resources - each business can only have one online profile. This endpoint is intended for initial setup of businesses that don't yet have an online profile.

The workflow creates a fresh business using the **directory token**, then obtains a staff token for that business, and finally creates the online profile using the directory token acting on behalf of the new business.

## Prerequisites

```yaml
steps:
  - id: create_business
    description: "Create a new business using directory token so it has no online profile yet"
    method: POST
    path: "/platform/v1/businesses"
    token: directory
    body:
      admin_account:
        country_name: United States
        display_name: Test Admin
        email: testuser+{{now_timestamp}}@example.com
        first_name: Test
        language: en
        last_name: Admin
        password: password123
        phone: 555-0123
      business:
        address: 123 Main Street
        business_category: other
        business_maturity_in_years: "0"
        country_name: United States
        hide_address: true
        landing_page: test-landing-page-{{now_timestamp}}
        name: Test Business {{now_timestamp}}
        phone: 555-0123
        short_description: A test business description
        time_zone: Mountain Time (US & Canada)
        website_url: https://example.com
    extract:
      business_uid: "$.data.business.business.id"
      admin_staff_uid: "$.data.business.admin_account.staff_uid"
    expect:
      status: [200, 201]
    onFail: abort

  - id: create_staff_token
    description: "Create a fresh staff token for the newly created business"
    method: POST
    path: "/platform/v1/tokens"
    token: directory
    x_on_behalf_of: true
    body:
      business_id: "{{business_uid}}"
    extract:
      new_staff_token: "$.data.token"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_online_profile
    method: POST
    path: "/v3/business_administration/online_profiles"
    token: directory
    x_on_behalf_of: true
    body:
      supported_languages:
        - en
        - es
      privacy_policy_url: "https://example.com/privacy"
    expect:
      status: [200, 201]
```