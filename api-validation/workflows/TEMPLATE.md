# API Validation Workflow Template

> **Purpose**: This template defines the canonical format for all API validation workflow files.
> All workflows must follow this structure to ensure consistency, searchability, and reusability by the AI healer.

---

## File Naming Convention

```
{method}_{path_with_underscores}.md
```

**Examples:**
- `post_platform_v1_payments.md`
- `get_business_payments_v1_invoices_invoice_uid.md`
- `put_v3_communication_notification_templates_uid.md`

**Rules:**
- Use lowercase
- Replace `/` with `_`
- Replace `{param}` path parameters with the param name (no braces)
- Use the HTTP method prefix: `get_`, `post_`, `put_`, `delete_`, `patch_`

---

## YAML Frontmatter (Required)

```yaml
---
# ══════════════════════════════════════════════════════════════════════════════
# REQUIRED FIELDS
# ══════════════════════════════════════════════════════════════════════════════

endpoint: "POST /platform/v1/payments"           # HTTP method and path (with {param} placeholders)
domain: sales                                     # One of: sales, clients, scheduling, communication, 
                                                  #         platform_administration, apps, reviews
tags: [payments, invoices]                        # Searchable tags (use empty array [] if none)
swagger: swagger/sales/legacy/payments.json      # Path to swagger file (relative to repo root)
status: verified                                  # One of: verified, pending, failed, skipped

# ══════════════════════════════════════════════════════════════════════════════
# TIMESTAMPS (Auto-generated, do not edit manually)
# ══════════════════════════════════════════════════════════════════════════════

savedAt: 2026-01-26T21:28:12.398Z                 # When workflow was first saved
verifiedAt: 2026-01-26T21:28:12.398Z              # When workflow was last verified successfully
timesReused: 0                                    # Number of times this workflow helped heal other tests

# ══════════════════════════════════════════════════════════════════════════════
# OPTIONAL FIELDS (Include only when applicable)
# ══════════════════════════════════════════════════════════════════════════════

# Use when the "success" response is not 200/201
expectedOutcome: 422                              # Expected HTTP status code for success
expectedOutcomeReason: "No package available"    # Why this non-2xx response is expected

# Use when test data must be provisioned
requiresTestData: true                            # Whether specific test data setup is needed
testDataDescription: "Client must have active packages"  # What test data is required

# Use when main API gateway doesn't work
useFallbackApi: true                              # Whether to use fallback API URL

# Use for specifying token type(s) supported
tokens: [staff, client]                           # Supported token types (array format)
---
```

### Status Values

| Status | Meaning |
|--------|---------|
| `verified` | Test passed with expected response, workflow is reliable |
| `pending` | Workflow created but not yet verified |
| `failed` | Test consistently fails (document why) |
| `skipped` | Test skipped due to environment limitations |

### Domain Values

| Domain | Description |
|--------|-------------|
| `sales` | Payments, invoices, products, estimates, carts |
| `clients` | Client management, contacts, matters, CRM views |
| `scheduling` | Bookings, appointments, availability, time slots |
| `communication` | Messages, notifications, phone numbers |
| `platform_administration` | Businesses, staffs, users, licenses, settings |
| `apps` | OAuth apps, widgets, app assignments |
| `reviews` | Business reviews and settings |

---

## Markdown Body Structure

### 1. Title (Required)

```markdown
# {Action} {Resource}
```

**Examples:**
- `# Create Payment`
- `# Get Client Bookings`
- `# Update Invoice`

**Rules:**
- Use sentence case
- Start with action verb: Create, Get, List, Update, Delete
- Singular resource name for single-item operations
- Plural for list operations

---

### 2. Summary (Required)

```markdown
## Summary

Brief description of what this endpoint does and any key insights discovered during testing.

**Token Type**: This endpoint requires a **{token_type} token**.
```

**Guidelines:**
- 1-3 sentences describing the endpoint purpose
- Include the key discovery or fix that made the test pass
- Always specify token type requirement if non-obvious
- Use bold for important terms

---

### 3. Response Codes (Required for complex endpoints)

```markdown
## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Resource retrieved/updated |
| 201 | Success - Resource created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Token lacks permission |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error |
```

**Include only statuses that are relevant to this specific endpoint.**

---

### 4. Authentication (Required when token requirements are non-obvious)

```markdown
## Authentication

Available for **{Token Types}** tokens.

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Requires same business as resource |
| Client | ✅ | Can only access own resources |
| Directory | ⚠️ | Business must be in directory |
| Application | ❌ | Not supported |
| Internal | ✅ | Full access |
```

---

### 5. Prerequisites (Required)

```markdown
## Prerequisites

{Either "None" or YAML steps to fetch required data}
```

**When no prerequisites:**
```markdown
## Prerequisites

None required for this endpoint.
```

**When prerequisites exist:**
```markdown
## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client to use in the request"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].uid"
    expect:
      status: 200
    onFail: abort

  - id: get_service
    description: "Get available services"
    method: GET
    path: "/platform/v1/services"
    params:
      business_id: "{{business_id}}"
    extract:
      service_id: "$.data.services[0].id"
    expect:
      status: 200
    onFail: abort
```
```

#### Prerequisite Step Schema

```yaml
- id: step_identifier              # Required: unique snake_case identifier
  description: "Human readable"    # Required: what this step does
  method: GET                      # Required: HTTP method
  path: "/api/path"                # Required: API path (use {{var}} for variables)
  params:                          # Optional: query parameters
    key: "value"
  body:                            # Optional: request body (for POST/PUT)
    field: "value"
  token: staff                     # Optional: token type if different from default
  extract:                         # Optional: variables to extract from response
    var_name: "$.json.path"
  expect:
    status: 200                    # Required: expected status (number or array)
  onFail: abort                    # Required: 'abort' or 'skip'
  skipReason: "Optional reason"    # Required if onFail: skip
```

---

### 6. UID Resolution Procedure (Required for endpoints with path/query parameters)

```markdown
## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| client_uid | GET /platform/v1/clients | $.data.clients[0].uid | Use first available client |
| invoice_uid | GET /business/payments/v1/invoices | $.data.invoices[0].uid | Must be unpaid status |

### Resolution Steps

**client_uid:**
1. Call `GET /platform/v1/clients?business_id={{business_id}}&per_page=1`
2. Extract `$.data.clients[0].uid` from response
3. If empty, endpoint cannot be tested (skip with reason)

**invoice_uid:**
1. Call `GET /business/payments/v1/invoices?per_page=1`
2. Filter for `status != 'paid'` if testing update operations
3. Extract `$.data.invoices[0].uid` from response
```

---

### 7. Test Request (Required)

```markdown
## Test Request

```yaml
steps:
  - id: main_request
    description: "Description of what this request does"
    method: POST
    path: "/platform/v1/payments"
    token: staff                   # Only if non-default
    body:
      amount: 100
      client_id: "{{client_uid}}"
      currency: "USD"
      payment_method: "Cash"
      title: "Test Payment"
    expect:
      status: [200, 201]           # Always use array format for consistency
```
```

#### Test Request Guidelines

1. **Always use array format for status**: `status: [200, 201]` not `status: 200`
2. **Use template variables**: `{{variable_name}}` for dynamic values
3. **Path parameters**: Use `{{var}}` in path: `/api/resource/{{uid}}`
4. **Include description**: Explain what the test validates

---

### 8. Parameters Reference (Required for complex endpoints)

```markdown
## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uid | string | Yes | Resource unique identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| per_page | integer | No | Number of results per page (default: 25) |
| page | integer | No | Page number (default: 1) |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | number | Yes | Payment amount in cents |
| currency | string | Yes | ISO 4217 currency code |
| client_id | string | Yes | Client UID |
```

---

### 9. Known Issues (Optional)

```markdown
## Known Issues

### Issue: 500 Error with Virtual Bookings

**Description**: Server throws 500 when payment_status_id references a virtual booking.

**Root Cause**: Undefined variable in exception handling (line 1228 in `client_packages_api.rb`).

**Workaround**: Use regular payment status IDs from `/client/payments/v1/payment_requests`.

### Issue: Directory Token Authorization

**Description**: Directory tokens return 422 for non-member businesses.

**Root Cause**: Business must have `directory_member` record.

**Workaround**: Use Staff token instead, or ensure business is in directory.
```

---

### 10. Critical Learnings (Optional but recommended)

```markdown
## Critical Learnings

1. **Client ID vs Client UID**: The `client_id` field expects the UID, not the hash ID
2. **Form Data Structure**: `form_data.fields` must be an array, not an object
3. **Token Requirements**: Client tokens bypass form validation when `client_id` is provided
```

---

### 11. Swagger Discrepancies (Optional - when documentation differs from behavior)

```markdown
## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| Required field | `entity_uid` optional | Required when `entity_type` provided | 422 response |
| Status values | `draft`, `issued`, `paid` | Also accepts `cancelled` | Successful test |
```

---

### 12. Notes (Optional)

```markdown
## Notes

- **Always provide `client_id`** - Without it, API attempts client creation
- **Use Staff tokens** - Most reliable for testing
- `start_time` must be in the future
- The `client_id` must belong to the same business
```

---

## Complete Example Workflow

```markdown
---
endpoint: "POST /platform/v1/payments"
domain: sales
tags: [payments, cash, manual]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-01-26T21:58:21.948Z
verifiedAt: 2026-01-26T21:58:21.948Z
timesReused: 0
---

# Create Payment

## Summary

Creates a manual payment record for a client. The API expects `client_id` field to contain the client UID, not the legacy client ID.

**Token Type**: This endpoint requires a **Staff or Directory token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Payment created |
| 201 | Success - Payment created (alternate) |
| 400 | Bad Request - Missing required parameters |
| 422 | Unprocessable Entity - Validation failed |

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client to create payment for"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_payment
    description: "Create a manual cash payment"
    method: POST
    path: "/platform/v1/payments"
    body:
      amount: 100
      client_id: "{{client_uid}}"
      currency: "USD"
      payment_method: "Cash"
      title: "Test Payment"
      send_receipt: false
    expect:
      status: [200, 201]
```

## Parameters Reference

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | number | Yes | Payment amount |
| client_id | string | Yes | Client UID (not legacy ID) |
| currency | string | Yes | ISO 4217 currency code |
| payment_method | string | Yes | Cash, Check, Credit Card, etc. |
| title | string | Yes | Payment description |
| send_receipt | boolean | No | Whether to email receipt (default: true) |

## Critical Learnings

1. **Use client UID**: The `client_id` field expects the UID format, not the hash ID
2. **Receipt default**: `send_receipt` defaults to true - set to false for testing

## Notes

- Amount is in the currency's standard unit (dollars, not cents)
- Currency must be a valid ISO 4217 code supported by the business
```

---

## Section Checklist

Use this checklist when creating or reviewing workflows:

### Required Sections
- [ ] YAML Frontmatter (all required fields)
- [ ] Title (`# Action Resource`)
- [ ] Summary (with token type if applicable)
- [ ] Prerequisites (or "None required")
- [ ] Test Request (with YAML steps)

### Recommended Sections (include when applicable)
- [ ] Response Codes (for non-trivial endpoints)
- [ ] Authentication (when token requirements complex)
- [ ] UID Resolution Procedure (when path/query params needed)
- [ ] Parameters Reference (for endpoints with many params)
- [ ] Critical Learnings (key insights)

### Optional Sections (include when relevant)
- [ ] Known Issues (bugs or limitations)
- [ ] Swagger Discrepancies (documentation vs behavior)
- [ ] Notes (additional context)

---

## Variable Reference

### Built-in Variables (from test configuration)

| Variable | Source | Description |
|----------|--------|-------------|
| `{{business_id}}` | Config | Test business UID |
| `{{staff_id}}` | Config | Test staff UID |
| `{{client_id}}` | Config | Test client UID |
| `{{matter_uid}}` | Config | Test matter UID |
| `{{conversation_uid}}` | Config | Test conversation UID |

### Dynamic Date Variables

| Variable | Description |
|----------|-------------|
| `{{tomorrow_date}}` | Tomorrow's date (YYYY-MM-DD) |
| `{{tomorrow_datetime}}` | Tomorrow at 10:00 AM (ISO 8601) |
| `{{next_week_date}}` | Date 7 days from now |
| `{{future_datetime}}` | 24 hours from now (ISO 8601) |

### Extracted Variables

Variables extracted from prerequisite steps are referenced by their `extract` key:
```yaml
extract:
  invoice_uid: "$.data.invoices[0].uid"
```
Then used as: `{{invoice_uid}}`
