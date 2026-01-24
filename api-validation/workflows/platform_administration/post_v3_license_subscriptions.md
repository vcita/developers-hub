---
endpoint: POST /v3/license/subscriptions
domain: platform_administration
tags: []
status: pass
savedAt: 2026-01-23T22:30:34.436Z
verifiedAt: 2026-01-23T22:30:34.436Z
timesReused: 0
---
# Create Subscriptions

## Summary
Successfully created a subscription using the correct request format. The endpoint works but the original request had invalid fields and used the wrong token type.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| offering_uid | GET /v3/license/offerings | POST /v3/license/offerings | No |

```json
{
  "offering_uid": {
    "source_endpoint": "GET /v3/license/offerings",
    "resolved_value": "1041207f-f572-42bd-a430-5198c27f87f4",
    "used_fallback": false,
    "fallback_endpoint": "POST /v3/license/offerings"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/v3/license/subscriptions",
  "body": {
    "offering_uid": "1041207f-f572-42bd-a430-5198c27f87f4",
    "purchase_currency": "USD"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| request_body | The original request contained fields not defined in the DTO: charged_by, payment_type, discount_code_name. These fields are not valid for this endpoint. | Update documentation to only show the fields defined in CreateSubscriptionByOfferingRequest DTO: offering_uid (required), purchase_currency (required), business_cart (optional), coupon_code (optional), price (optional) | critical |
| price | Setting custom price requires directory or admin actor, not staff. When price is provided with staff token, returns 400 'Only directory or admin actors are allowed to set a custom price' | Document that the price field can only be set by directory or admin actors, not staff | major |
| coupon_code | When coupon_code is provided with directory token, it causes internal server error 500. Works fine with staff token. | Document token type restrictions for coupon usage or fix the server-side handling | major |
| offering_uid | Original offering_uid 'bc33f12d-98ee-428f-9f65-18bba589cb95' was not found. Error message 'Not found by params: [uid] and [currency]' suggests the offering must exist and support the specified currency | Document that offering_uid must be a valid offering that supports the specified purchase_currency | minor |