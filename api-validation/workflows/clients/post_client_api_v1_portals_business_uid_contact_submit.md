---
endpoint: POST /client_api/v1/portals/{business_uid}/contact/submit
domain: clients
tags: []
status: pass
savedAt: 2026-01-23T22:20:02.052Z
verifiedAt: 2026-01-23T22:20:02.052Z
timesReused: 0
---
# Create Submit

## Summary
Successfully submitted Leave Details Form after fixing the request format. The endpoint was documented incorrectly - form_data should be an object with fields property, not an array.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| business_uid | Already resolved | - | No |

```json
{
  "business_uid": {
    "source_endpoint": "Already resolved",
    "resolved_value": "pihawe0kf7fu7xo1",
    "used_fallback": false
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
  "path": "/client_api/v1/portals/pihawe0kf7fu7xo1/contact/submit",
  "body": {
    "form_data": {
      "fields": {
        "75khm8wd5ldf9wjn": "test@example.com",
        "xrj4lk1koe9h1j1t": "Test User",
        "subject": "Leave Request",
        "message": "Request for annual leave"
      }
    },
    "source_data": {
      "isWidget": false,
      "o": "d2ViYXBw",
      "s": "https://example.com/contact",
      "topUrl": "aHR0cHM6Ly9leGFtcGxlLmNvbQ=="
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| form_data | Documentation shows form_data as an array with title/amount/quantity properties and nested fields object with key/value structure. Source code shows form_data should be an object containing a fields property where keys are field IDs and values are field values. | Update swagger schema to show form_data as: {type: object, properties: {fields: {type: object, additionalProperties: {type: string}}}, required: ['fields']} | critical |
| form_data.fields | Documentation shows fields as object with key/value properties. Source code shows fields should be a flat object where keys are actual form field IDs and values are the field values. | Remove the nested key/value structure and show fields as additionalProperties object | critical |
| title, amount, quantity | Documentation lists title, amount, and quantity as required properties in form_data array items, but these fields are not used in the actual implementation | Remove title, amount, and quantity from the schema as they are not part of the leave_details form implementation | major |