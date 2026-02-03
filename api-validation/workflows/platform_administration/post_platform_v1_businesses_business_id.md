---
endpoint: "POST /platform/v1/businesses/{business_uid}"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-28T14:18:26.249Z
verifiedAt: 2026-01-28T14:18:26.249Z
---

# Create Businesses

## Summary
Endpoint works correctly with proper business_uid, admin token, and validated request structure. Initial issues were due to using incorrect business_id parameter and insufficient authorization.

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
        admin_account:
          country_name: United States
          display_name: Sarah Johnson
          email: sarah.johnson.test1738072550@example.com
          first_name: Sarah
          language: en
          last_name: Johnson
          phone: +1-555-0123
        address: 123 Main Street, Suite 100, New York, NY 10001
        business_category: Legal Services
        business_maturity_in_years: 2+
        country_name: United States
        hide_address: false
        name: Johnson Legal Associates
        phone: +1-555-0123
        scheduling_disabled: false
        short_description: Full-service law firm providing comprehensive legal solutions
          for businesses and individuals
        time_zone: Eastern Time (US & Canada)
        website_url: https://www.johnsonlegal.com
    expect:
      status: [200, 201]
```
