---
endpoint: "GET /platform/v1/businesses"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-02-09T23:21:08.000Z"
verifiedAt: "2026-02-09T23:21:08.000Z"
timesReused: 0
---

# Get Businesses

## Summary
Searches for businesses using filter parameters. **Token Type**: Requires a **staff token**. This endpoint requires at least one filter query parameter: `email`, `external_id`, or `external_reference_id`.

## Prerequisites

```yaml
steps:
  - id: create_business
    description: "Create a business to search for"
    method: POST
    path: "/platform/v1/businesses"
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
        landing_page: test-landing-page
        name: Test Business {{now_timestamp}}
        phone: 555-0123
        short_description: A test business description
        time_zone: Mountain Time (US & Canada)
        website_url: https://example.com
    extract:
      admin_email: "$.data.business.admin_account.email"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_businesses
    method: GET
    path: "/platform/v1/businesses"
    params:
      email: "{{admin_email}}"
    expect:
      status: [200, 201]
```