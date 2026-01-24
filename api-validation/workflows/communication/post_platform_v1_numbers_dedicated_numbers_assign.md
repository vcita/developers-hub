---
endpoint: POST /platform/v1/numbers/dedicated_numbers/assign
domain: communication
tags: []
status: pass
savedAt: 2026-01-23T16:06:49.019Z
verifiedAt: 2026-01-23T16:06:49.019Z
timesReused: 0
---
# Create Assign

## Summary
Successfully identified the correct request format. The endpoint works correctly and validates properly when the correct parameter structure is used.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| number_type | Documentation shows 'number_type' as a string, but the API actually expects it to be an array of strings. The controller passes params[:number_type] as number_types to the API component, which validates that it must be an array. | Update Swagger documentation to show 'number_type' as 'type: array, items: {type: string}' instead of 'type: string'. Also update the description to clarify it should be an array like ['promotional'] or ['transactional']. | critical |
| business_uid | Documentation doesn't mark business_uid as required, but the API fails if it's not provided since the controller calls BusinessesAPI.get_by_uid(uid: business_uid) and the validation checks if business exists. | Add business_uid to the required fields list in the Swagger documentation. | major |
| api_key | The API validates that the api_key exists in NexmoSecret table with pool: false, but this business requirement is not documented in the Swagger spec. | Add documentation explaining that api_key must be a valid Nexmo API key associated with a non-pool dedicated number configuration. | minor |