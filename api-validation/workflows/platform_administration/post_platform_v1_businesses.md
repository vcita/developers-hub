---
endpoint: POST /platform/v1/businesses
domain: platform_administration
tags: []
status: pass
savedAt: 2026-01-23T22:43:03.087Z
verifiedAt: 2026-01-23T22:43:03.087Z
timesReused: 0
---
# Create Businesses

## Summary
Business creation endpoint works successfully with directory token and proper validation values. Fixed validation errors for business_category, google_client_id format, and logo_url accessibility.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/platform/v1/businesses",
  "body": {
    "admin_account": {
      "email": "testowner@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "display_name": "John Doe",
      "password": "password123",
      "phone": "+1-555-0123",
      "country_name": "United States",
      "language": "en"
    },
    "business": {
      "name": "Test Law Firm LLC",
      "address": "123 Main Street, Suite 100, Denver, CO 80202",
      "phone": "+1-555-0199",
      "business_category": "aeroclub",
      "business_maturity_in_years": "2+",
      "country_name": "United States",
      "time_zone": "Mountain Time (US & Canada)",
      "short_description": "Full-service law firm providing comprehensive legal solutions",
      "website_url": "https://www.testlawfirm.com",
      "hide_address": true
    },
    "meta": {
      "synchronized": true,
      "in_setup": false,
      "is_template": false,
      "external_reference_id": "ext_ref_12345",
      "note": "Test business created via API",
      "intents": [
        "accept_payments_tile",
        "documents_and_forms",
        "secure_portal_for_clients"
      ],
      "tags": [
        "test",
        "api-created"
      ],
      "analytics": {
        "google_client_id": "GA123.456.789.012",
        "mixpanel_id": "test_mixpanel_id_123"
      }
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| auth | Documentation doesn't specify that this endpoint requires directory token instead of staff token. Initial request failed with 'Unauthorized' error when using staff token. | Add authentication requirements section specifying that directory token is required for business creation | critical |
| business.business_category | Documentation shows 'Legal Services' as example but validation requires profession codes from Profession table (like 'aeroclub'). The field accepts profession_code values, not free-form category names. | Update documentation to show valid profession codes or provide an endpoint to list available business categories/profession codes | critical |
| meta.analytics.google_client_id | Documentation example 'GA-12345678-1' doesn't match validation regex. The actual pattern requires format like 'GA123.456.789.012' (GA + non-zero digit + dots + numbers). | Update example to show valid Google Analytics ID format: GA123.456.789.012 | major |
| business.logo_url | The API validates that logo_url is accessible (returns 404 error if URL doesn't exist). Documentation should mention this validation. | Document that logo_url must be a valid, accessible image URL or the request will fail | major |