---
endpoint: GET /v3/communication/available_phone_numbers
domain: communication
tags: [communication, phone_numbers, voice, sms]
status: verified
savedAt: 2026-01-22T21:36:36.259Z
verifiedAt: 2026-01-22T21:36:36.259Z
timesReused: 0
---
# Get Available phone numbers

## Summary
Retrieve available phone numbers for communication services

## Prerequisites
None - endpoint available to authenticated users

## How to Resolve Parameters
1. **country_code** (required string): ISO country code like "US"
2. **features** (required array): JSON-encoded array of PhoneNumberFeature values like ["VOICE"] or ["SMS"] 
3. **area_code** (required when country_code=US): 3-digit area code like "212"

Example working request: GET /v3/communication/available_phone_numbers?country_code=US&area_code=212&features=["VOICE"]

## Critical Learnings

- **Features parameter format** - features parameter must be a JSON-encoded array like ["VOICE"] or ["SMS"], not a plain string
- **US area code requirement** - When country_code=US, area_code parameter becomes required and must be a 3-digit code
- **Empty results are valid** - A 200 response with empty available_phone_numbers array is normal - it means no numbers are available for that area/features combination

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/v3/communication/available_phone_numbers?country_code=US&area_code=212&features=[\"VOICE\"]"
}
```

## Documentation Fix Suggestions

No documentation issues found.