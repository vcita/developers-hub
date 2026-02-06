---
endpoint: "POST /client_api/v1/portals/{business_uid}/contact/submit"
domain: clients
tags: [forms, contact, leave-details]
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/clients.json
status: verified
savedAt: 2026-02-06T14:25:10.202Z
verifiedAt: 2026-02-06T14:25:10.202Z
timesReused: 0
tokens: [client]
---
# Submit Leave Details Form

## Summary

Submits a leave details (contact) form to the business. The `form_data.fields` object is a dynamic map of field IDs to values. For the default leave_details form, `subject` and `message` are typically required fields. Any additional custom fields configured by the business can be discovered via `GET /client_api/v1/portals/{business_uid}/contact/get_form`.

**Token Type**: This endpoint requires a **Client token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Form submitted, conversation created |
| 422 | Validation Error - Empty or missing required fields |

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Submit leave details form with subject and message"
    method: POST
    path: "/client_api/v1/portals/{{business_id}}/contact/submit"
    token: client
    body:
      form_data:
        fields:
          subject: "API test leave details"
          message: "Submitting leave details form via API test."
      source_data:
        isWidget: false
        o: "ZGlyZWN0"
        s: "http://localhost/leave-details"
        topUrl: "aHR0cDovL2xvY2FsaG9zdC9sZWF2ZS1kZXRhaWxz"
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| business_uid | string | Yes | The business UID for the portal |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| form_data | object | Yes | Form data containing field values |
| form_data.fields | object | Yes | Dynamic map of field IDs to values. Keys are field IDs (e.g., `subject`, `message`, or custom field UIDs), values are strings. |
| source_data | object | No | Source/origin tracking data |
| source_data.isWidget | boolean | No | Whether the form was submitted from a widget |
| source_data.o | string | No | The origin type in Base64 |
| source_data.s | string | No | The source URL |
| source_data.topUrl | string | No | The top URL in Base64 |

## Critical Learnings

1. **form_data is an object, NOT an array**: The `form_data` field must be a JSON object with a `fields` sub-object. It is NOT an array despite what the original core spec erroneously declared.
2. **fields is a dynamic map**: `form_data.fields` maps field IDs to their values. Fixed keys like `subject` and `message` are standard; custom field IDs come from the GET form response.
3. **Required fields cause 422**: Submitting with empty values for required fields (e.g., empty `subject` or `message`) results in a 422 validation error. Use GET form to discover which fields are required.

## Notes

- Call `GET /client_api/v1/portals/{business_uid}/contact/get_form` first to discover the form's structure and required fields
- The response includes a JWT `token` that can be used to authenticate the client for subsequent requests
- The `source_data` fields are used for analytics tracking and are not validated server-side
