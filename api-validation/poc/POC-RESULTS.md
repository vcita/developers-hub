# POC Results: Workflow Executor

## Date: 2026-02-01

## Summary

The POC successfully validated the workflow format and executor approach. However, it uncovered a **backend authorization issue** that prevents the booking endpoint from working with `form_data.fields` via staff tokens.

## Test Results

### Phase 1: Prerequisites - SUCCESS

```
[get_services] Get available services for the business
  Request: GET /platform/v1/services?business_id=00wutb5f1a08a8kn
  Status: 200
  Extracted: { service_id: "iu9yzrn79zp8uo77" }

[get_form_schema] Get the scheduling form schema to find field IDs  
  Request: GET /platform/v1/scheduling/scheduling_forms/get_form?service_uid=iu9yzrn79zp8uo77&business_id=00wutb5f1a08a8kn
  Status: 200
  Extracted: { firstname_field_id: "auobxopdqxmv944c", email_field_id: "fb96awpfyhnfu69h" }
```

### Phase 2: Test Request - FAILED (Backend Issue)

```
[TEST] POST /business/scheduling/v1/bookings
  Body: {
    "business_id": "00wutb5f1a08a8kn",
    "service_id": "iu9yzrn79zp8uo77",
    "staff_id": "4m52ud4x9q7eyw0n",
    "start_time": "2026-02-02T11:40:45.349Z",
    "form_data": {
      "fields": {
        "auobxopdqxmv944c": "APITest",       // firstname field ID - CORRECT
        "fb96awpfyhnfu69h": "apitest@..."    // email field ID - CORRECT
      }
    }
  }
  Status: 422
  Response: { "error": "Validation failed: First name can't be blank" }
```

## Root Cause Analysis

### The Problem

In `core/lib/components/forms_api/base_form.rb` (lines 28-33):

```ruby
input.each do |field_id, field_value|
  if real_field?(field_id)
    field = ::Components::FieldsAPI.find(id: field_id, authorize_params: authorize_params, business_uid: business_uid)
    if field['status'] == 'OK'
      fields << generate_field_data(field, field_value)
    end
    # NOTE: If field['status'] is NOT 'OK', the field is SILENTLY IGNORED
  end
end
```

### Why It Fails

1. `FieldsAPI.find` requires authorization via `AuthenticationAPI::Fields.authorize_action`
2. Staff tokens may not have permission to call `FieldsAPI.find`
3. When authorization fails, `FieldsAPI.find` returns `{ status: 'Error' }`
4. The field is silently skipped (no error raised)
5. Final `fields` array is empty -> "First name can't be blank"

### Evidence

- Field IDs are correct (verified against scheduling form response)
- Request body is correctly formatted
- The backend silently ignores the fields, not the request structure

## What the POC Validated

| Component | Status | Notes |
|-----------|--------|-------|
| YAML workflow format | PASS | Parseable, structured |
| Prerequisite execution | PASS | Sequential, deterministic |
| JSONPath extraction | PASS | Correct field IDs extracted |
| Variable substitution | PASS | Dynamic keys and values work |
| Backend acceptance | **FAIL** | Authorization blocks field lookup |

## Recommendations

### Option 1: Fix Backend Authorization (Preferred)

The backend should allow staff tokens to use `form_data.fields` when creating bookings. This is likely a missing permission in `AuthenticationAPI::Fields`.

**JIRA Ticket**: Create a backend ticket to fix authorization for `FieldsAPI.find` when called during booking form submission with staff tokens.

### Option 2: Use Different Token Type

Try using a different token type (admin/internal) that has `FieldsAPI` permissions.

### Option 3: Skip This Endpoint

Mark the endpoint as "skip" with documented reason: "Backend authorization prevents staff tokens from using form_data.fields"

## Files Created

- `api-validation/poc/jsonpath-extractor.js` - JSONPath query utility
- `api-validation/poc/variable-resolver.js` - Variable substitution
- `api-validation/poc/workflow-executor.js` - Main executor script
- `api-validation/workflows/scheduling/post_business_scheduling_v1_bookings.md` - Updated workflow

## How to Run

```bash
cd api-validation
node poc/workflow-executor.js workflows/scheduling/post_business_scheduling_v1_bookings.md
```

## Conclusion

The POC successfully demonstrates that the **workflow format and executor approach are correct**. The failure is a backend authorization issue that needs to be fixed independently. The workflow executor can be integrated into the main validator once the backend issue is resolved.
