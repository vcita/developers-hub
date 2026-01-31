---
endpoint: POST /platform/v1/businesses
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T10:03:04.127Z
verifiedAt: 2026-01-28T10:03:04.127Z
timesReused: 0
---
# Create Businesses

## Summary
Test passes when using unique `admin_account.email` values. The API enforces email uniqueness - attempting to create a business with an email already in use returns a `400 Bad Request` with `"admin_account.email already in use"`. Use dynamic email generation (e.g., with timestamps) for repeated test runs.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

### Email Uniqueness Constraint
The `admin_account.email` field must be unique across the platform. Attempting to create a business with an email that already exists will return a `400` error with the message `"admin_account.email already in use"`.

**Resolution Strategy**: Generate a unique email for each test run using a timestamp or random suffix:
- Example: `testuser+{timestamp}@example.com` or `testuser+{random}@example.com`
- The `+` notation is commonly accepted by email systems and allows using unique addresses without creating new accounts.

## Request Template

Use this template with dynamically resolved UIDs. **Important**: Generate a unique email for each test run.

```json
{
  "method": "POST",
  "path": "/platform/v1/businesses",
  "body": {
    "admin_account": {
      "country_name": "United States",
      "display_name": "Test Admin",
      "email": "testuser+{DYNAMIC_TIMESTAMP}@example.com",
      "first_name": "Test",
      "language": "en",
      "last_name": "Admin",
      "password": "password123",
      "phone": "555-0123"
    },
    "business": {
      "address": "123 Main Street",
      "business_category": "other",
      "business_maturity_in_years": "0",
      "country_name": "United States",
      "hide_address": true,
      "landing_page": "test-landing-page",
      "name": "Test Business 54321",
      "phone": "555-0123",
      "short_description": "A test business description",
      "time_zone": "Mountain Time (US & Canada)",
      "website_url": "https://example.com"
    },
    "meta": {
      "analytics": {},
      "audit": [],
      "identities": [],
      "in_setup": false,
      "intents": [
        "accept_payments_tile",
        "manage_client_records"
      ],
      "invite": "test-invite",
      "is_template": false,
      "synchronized": true,
      "note": "Test business note",
      "suggested_identities": [],
      "tags": [
        "test",
        "automation"
      ]
    }
  }
}
```