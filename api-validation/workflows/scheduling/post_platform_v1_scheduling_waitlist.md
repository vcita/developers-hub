---
endpoint: POST /platform/v1/scheduling/waitlist
domain: scheduling
tags: []
status: skip
savedAt: 2026-01-23T22:58:00.260Z
verifiedAt: 2026-01-23T22:58:00.260Z
timesReused: 0
skipReason: This endpoint requires an existing EventInstance (not just EventService) to create a waitlist for. The error occurs because: 1) The event_instance_id provided doesn't exist, 2) Even without event_instance_id, form validation fails with internal field UUIDs suggesting missing required form fields, 3) Waitlist functionality is specific to events (not appointments) and requires business to have waitlist features enabled. Cannot test without a valid event instance.
---
# Create Waitlist

## Summary
Cannot create event waitlist - no valid event instances exist and business may not have waitlist features enabled

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

This endpoint requires an existing EventInstance (not just EventService) to create a waitlist for. The error occurs because: 1) The event_instance_id provided doesn't exist, 2) Even without event_instance_id, form validation fails with internal field UUIDs suggesting missing required form fields, 3) Waitlist functionality is specific to events (not appointments) and requires business to have waitlist features enabled. Cannot test without a valid event instance.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

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
| event_instance_id | Documentation says this field is optional ('Required for event'), but the endpoint cannot function without a valid EventInstance. The error messages show internal form field UUIDs instead of meaningful field names. | Clarify that event_instance_id is required when creating event waitlists, and explain that this endpoint only works for events, not appointments. Also fix error messages to show actual field names instead of internal UUIDs. | critical |
| form_data | The endpoint expects form_data fields but this is not documented in swagger. The validation errors show UUID-based field IDs which are internal form field identifiers. | Document the form_data structure required for waitlist creation, or provide clearer error messages that identify which actual fields are missing. | major |
| business_features | The endpoint requires the business to have event waitlist features enabled, but this prerequisite is not documented. | Add to documentation that this endpoint requires the business to have event_waitlist feature enabled and auto_fill_event_waitlist_spots setting configured. | major |