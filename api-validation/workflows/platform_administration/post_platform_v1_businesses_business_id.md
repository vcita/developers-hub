---
endpoint: POST /platform/v1/businesses/{business_uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T14:18:26.249Z
verifiedAt: 2026-01-28T14:18:26.249Z
timesReused: 0
---
# Create Businesses

## Summary
Endpoint works correctly with proper business_uid, admin token, and validated request structure. Initial issues were due to using incorrect business_id parameter and insufficient authorization.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_id | Use available business_uid parameter | Available as business_uid='88pzdbz1hmkdoel4' | - | No cleanup needed - using existing business |

### Resolution Steps

**business_id**:
1. Call `Use available business_uid parameter`
2. Extract from response: `Available as business_uid='88pzdbz1hmkdoel4'`

```json
{
  "business_id": {
    "source_endpoint": "Use available business_uid parameter",
    "extract_from": "Available as business_uid='88pzdbz1hmkdoel4'",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing business"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/platform/v1/businesses/{{resolved.uid}}",
  "body": {
    "business": {
      "admin_account": {
        "country_name": "United States",
        "display_name": "Sarah Johnson",
        "email": "sarah.johnson.test1738072550@example.com",
        "first_name": "Sarah",
        "language": "en",
        "last_name": "Johnson",
        "phone": "+1-555-0123"
      },
      "address": "123 Main Street, Suite 100, New York, NY 10001",
      "business_category": "Legal Services",
      "business_maturity_in_years": "2+",
      "country_name": "United States",
      "hide_address": false,
      "name": "Johnson Legal Associates",
      "phone": "+1-555-0123",
      "scheduling_disabled": false,
      "short_description": "Full-service law firm providing comprehensive legal solutions for businesses and individuals",
      "time_zone": "Eastern Time (US & Canada)",
      "website_url": "https://www.johnsonlegal.com"
    }
  }
}
```