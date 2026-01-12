# API Documentation Enhancement - Implementation Plan

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Review

---

## Executive Summary

This plan outlines a phased approach to enhance the API documentation in the `developers-hub` project. The goal is to ensure all existing endpoint documentation accurately reflects the actual API implementation, with comprehensive information for developers and AI agents.

### Guiding Principles

| # | Principle | Implication |
|---|-----------|-------------|
| 1 | **Documentation only** | We document existing behavior - NO changes to API inputs, outputs, or behavior |
| 2 | **developers-hub only** | All changes are confined to the `developers-hub` project |
| 3 | **Existing APIs only** | We only enhance documentation for endpoints already in the hub (250 endpoints) |
| 4 | **No reorganization** | Current folder structure remains unchanged (proposals go to separate file) |
| 5 | **Accuracy over completeness** | If uncertain about behavior, mark as "NEEDS_VERIFICATION" - do not guess |
| 6 | **Strict validation** | Every change must pass validation before merge |
| 7 | **🚨 NO CODE = NO EDIT** | If source code for an API cannot be found, DO NOT make any documentation edits. Instead, request access to additional codebases. |

### ⚠️ CRITICAL SAFETY RULE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   🛑  IF SOURCE CODE CANNOT BE FOUND FOR AN ENDPOINT:                       │
│                                                                              │
│       1. DO NOT edit the swagger file                                       │
│       2. DO NOT edit the entity schema                                      │
│       3. DO NOT guess or assume behavior                                    │
│       4. DO NOT use existing documentation as source of truth               │
│                                                                              │
│       ✅ INSTEAD: Stop and request access to the codebase containing        │
│          the implementation before proceeding.                              │
│                                                                              │
│   The cost of incorrect documentation is MUCH HIGHER than the cost of       │
│   missing documentation.                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Scope Definition

### In Scope (250 Endpoints)

| Domain | Endpoint Count | Swagger Files | Entity Schemas |
|--------|---------------|---------------|----------------|
| AI | 12 | 5 | 8 |
| Apps | 24 | 6 | 9 |
| Clients | 42 | 7 | 1 |
| Communication | 32 | 8 | 11 |
| Integrations | 10 | 2 | 4 |
| Operators | 11 | 2 | 4 |
| Platform Administration | 41 | 10 | 6 |
| Reviews | 3 | 1 | 1 |
| Sales | 46 | 7 | 2 |
| Scheduling | 30 | 5 | 5 |
| **TOTAL** | **250** | **53** | **51** |

### Out of Scope

- ❌ Adding new API endpoints
- ❌ Changing API behavior, inputs, or outputs
- ❌ Reorganizing folder structure
- ❌ Modifying any project other than `developers-hub`
- ❌ Creating new entity schemas (only enhancing existing)
- ❌ Documenting internal/undocumented APIs

---

## Available Codebases

### Projects in Workspace

| Project | Path | Purpose | Key Directories |
|---------|------|---------|-----------------|
| `core` | `C:\Programming\core` | Primary Rails API implementation | `app/controllers/`, `modules/` |
| `apigw` | `C:\Programming\apigw` | Go API Gateway (routing, proxy) | `src/server/`, `src/config/` |
| `client-portal` | `C:\Programming\client-portal` | Vue.js client portal frontend | `client/src/` (frontend only) |
| `aiplatform` | `C:\Programming\aiplatform` | NestJS AI/BizAI service | `src/chats/`, `src/recommendations/`, `src/ai-generation-feedback/` |

### Codebase-to-API Mapping

| API Domain | Primary Codebase | Controller Location |
|------------|------------------|---------------------|
| **AI (BizAI, Recommendations)** | `aiplatform` | `src/chats/`, `src/recommendations/` |
| **AI (Generation Feedback)** | `aiplatform` | `src/ai-generation-feedback/` |
| **Apps** | `core` | `app/controllers/platform/v1/`, `modules/apps/` |
| **Clients** | `core` | `app/controllers/platform/v1/clients_controller.rb`, `modules/clients/` |
| **Communication** | `core` | `modules/messaging/`, `app/controllers/` |
| **Integrations** | `core` | TBD - needs verification |
| **Operators** | `core` | TBD - needs verification |
| **Platform Administration** | `core` | `app/controllers/platform/v1/`, `modules/licenses/` |
| **Reviews** | `core` | `app/controllers/api/v3/reviews/` |
| **Sales** | `core` | `modules/payments/`, `app/controllers/` |
| **Scheduling** | `core` | `modules/scheduling/app/controllers/` |

### Missing Codebases

If during implementation we cannot find the source code for an endpoint, we will:
1. Document which endpoint is missing
2. Stop work on that endpoint
3. Request access to additional codebases

**Currently identified gaps:** None yet - will be discovered during implementation.

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION PHASES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 0: Foundation & Templates (Week 1)                                   │
│  ├── Create validation tooling                                              │
│  ├── Define documentation templates                                         │
│  └── Establish review process                                               │
│                                                                              │
│  Phase 1: Scheduling Domain (Weeks 2-3) - 30 endpoints                      │
│  ├── High business value, well-defined entities                             │
│  └── Serves as reference implementation                                     │
│                                                                              │
│  Phase 2: Clients Domain (Weeks 4-5) - 42 endpoints                         │
│  ├── Core CRM functionality                                                 │
│  └── Many related entities                                                  │
│                                                                              │
│  Phase 3: Communication Domain (Weeks 6-7) - 32 endpoints                   │
│  ├── Voice, messaging, notifications                                        │
│  └── Multiple sub-domains                                                   │
│                                                                              │
│  Phase 4: Sales Domain (Weeks 8-9) - 46 endpoints                           │
│  ├── Payments, invoices, estimates                                          │
│  └── Complex business logic                                                 │
│                                                                              │
│  Phase 5: Platform Administration (Weeks 10-11) - 41 endpoints              │
│  ├── Business management, licensing                                         │
│  └── Admin-focused APIs                                                     │
│                                                                              │
│  Phase 6: Apps & Integrations (Week 12) - 34 endpoints                      │
│  ├── App management, JWKS, imports                                          │
│  └── Integration-focused                                                    │
│                                                                              │
│  Phase 7: AI, Operators, Reviews (Week 13) - 26 endpoints                   │
│  ├── Smaller domains                                                        │
│  └── Final cleanup                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Foundation & Templates

**Duration:** 1 week  
**Deliverables:** Validation tools, templates, review process

### 0.1 Validation Checklist Template

Create `docs/validation/ENDPOINT_VALIDATION_CHECKLIST.md`:

```markdown
# Endpoint Validation Checklist

## Endpoint: [METHOD] [PATH]
## Swagger File: [filename.json]
## Validated By: [name]
## Validation Date: [date]

### Source Code Verification
- [ ] Controller file identified: ________________
- [ ] Controller action identified: ________________
- [ ] All parameters verified against code
- [ ] All response codes verified against code
- [ ] All error codes verified against code

### Documentation Completeness
- [ ] Summary is accurate and action-oriented
- [ ] Description explains purpose clearly
- [ ] All path parameters documented
- [ ] All query parameters documented
- [ ] All request body fields documented
- [ ] All response fields documented
- [ ] Examples are realistic and valid

### Accuracy Verification
- [ ] Parameter types match implementation
- [ ] Required/optional status is correct
- [ ] Default values are correct
- [ ] Enum values match implementation
- [ ] Validation rules are accurate

### Uncertainty Markers
List any items marked as NEEDS_VERIFICATION:
1. ________________
2. ________________

### Sign-off
- [ ] Self-review completed
- [ ] Peer review completed
- [ ] Ready for merge
```

### 0.2 Documentation Enhancement Template

For each endpoint, enhancements follow this structure:

```json
{
  "summary": "[Verb] [Object] - max 80 chars",
  "description": "## Overview\n[What this endpoint does]\n\n## When to Use\n- [Use case 1]\n- [Use case 2]\n\n## Prerequisites\n- [Required setup]\n\n## Notes\n- [Important behavior notes]",
  "parameters": [
    {
      "name": "param_name",
      "description": "[Clear description]. [Validation rules if any].",
      "schema": {
        "type": "string",
        "format": "[if applicable]",
        "enum": ["[if applicable]"],
        "minimum": "[if applicable]",
        "maximum": "[if applicable]"
      },
      "example": "[realistic example]"
    }
  ],
  "responses": {
    "200": {
      "description": "[When this response occurs]",
      "content": {
        "application/json": {
          "examples": {
            "success": {
              "summary": "[Scenario name]",
              "value": {}
            }
          }
        }
      }
    },
    "400": {
      "description": "[When this error occurs]",
      "content": {
        "application/json": {
          "examples": {
            "missingParam": {
              "summary": "Missing required parameter",
              "value": {
                "status": "Error",
                "error": "[actual error message from code]",
                "error_code": "[actual error code from code]"
              }
            }
          }
        }
      }
    }
  }
}
```

### 0.3 NEEDS_VERIFICATION Convention

When source code is not available or behavior is unclear:

```json
{
  "description": "NEEDS_VERIFICATION: [specific question]. [Current documented behavior].",
  "x-needs-verification": {
    "reason": "[why verification is needed]",
    "question": "[specific question to answer]",
    "source_needed": "[what code/info would resolve this]"
  }
}
```

### 0.4 Review Process

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Research   │────▶│    Draft     │────▶│  Validation  │────▶│    Merge     │
│              │     │              │     │              │     │              │
│ - Find code  │     │ - Update     │     │ - Checklist  │     │ - PR review  │
│ - Verify     │     │   swagger    │     │ - Peer check │     │ - Final OK   │
│   behavior   │     │ - Add        │     │ - Mark       │     │              │
│              │     │   examples   │     │   uncertain  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Phase 1: Scheduling Domain

**Duration:** 2 weeks  
**Endpoints:** 30  
**Priority:** HIGH (Most commonly used APIs)

### Endpoints to Document

#### Week 2: v3 Scheduling APIs (14 endpoints)

| # | Endpoint | Path | Current Status |
|---|----------|------|----------------|
| 1 | Get all AvailabilitySlots | GET /v3/scheduling/availability_slots | Has basic docs |
| 2 | Get BusinessAvailability | GET /v3/scheduling/business_availabilities/{business_uid} | Has basic docs |
| 3 | Get all BusinessAvailabilities | GET /v3/scheduling/business_availabilities | Has basic docs |
| 4 | Get all ResourceTypes | GET /v3/scheduling/resource_types | Has basic docs |
| 5 | Create ResourceType | POST /v3/scheduling/resource_types | Has basic docs |
| 6 | Retrieve ResourceType | GET /v3/scheduling/resource_types/{uid} | Has basic docs |
| 7 | Update ResourceType | PUT /v3/scheduling/resource_types/{uid} | Has basic docs |
| 8 | Delete ResourceType | DELETE /v3/scheduling/resource_types/{uid} | Has basic docs |
| 9 | Get all Resources | GET /v3/scheduling/resources | Has basic docs |
| 10 | Create Resource | POST /v3/scheduling/resources | Has basic docs |
| 11 | Retrieve Resource | GET /v3/scheduling/resources/{uid} | Has basic docs |
| 12 | Update Resource | PUT /v3/scheduling/resources/{uid} | Has basic docs |
| 13 | Delete Resource | DELETE /v3/scheduling/resources/{uid} | Has basic docs |
| 14 | Bulk Create Resources | POST /v3/scheduling/resources/bulk | Has basic docs |

#### Week 3: v1 Scheduling APIs (16 endpoints)

| # | Endpoint | Path | Current Status |
|---|----------|------|----------------|
| 15 | Get Appointments List | GET /platform/v1/scheduling/appointments | Has basic docs |
| 16 | Get Appointment | GET /platform/v1/scheduling/appointments/{appointment_id} | Has basic docs |
| 17 | Get Bookings | GET /platform/v1/scheduling/bookings | Has basic docs |
| 18 | Create New Booking | POST /platform/v1/scheduling/bookings | Has basic docs |
| 19 | Cancel Booking | PUT /platform/v1/scheduling/bookings/cancel | Has basic docs |
| 20 | Update RSVP state | PUT /platform/v1/scheduling/bookings/{booking_uid}/update_rsvp_state | Has basic docs |
| 21 | Get Event Attendance | GET /platform/v1/scheduling/event_attendances/{event_attendance_uid} | Has basic docs |
| 22 | Get Event Instance | GET /platform/v1/scheduling/event_instance/{event_instance_id} | Has basic docs |
| 23 | Get Staff List | GET /platform/v1/scheduling/staff | Has basic docs |
| 24 | Get Staff By ID | GET /platform/v1/scheduling/staff/{staff_id} | Has basic docs |
| 25 | Create event Waitlist | POST /platform/v1/scheduling/waitlist | Has basic docs |
| 26 | Cancel Waitlist | PUT /platform/v1/scheduling/waitlist/cancel | Has basic docs |
| 27 | Get Services List | GET /platform/v1/services | Has basic docs |
| 28 | Get Services Availability | GET /platform/v1/services/availability | Has basic docs |
| 29 | Get Service Details | GET /platform/v1/services/{service_id} | Has basic docs |
| 30 | Get Service Availability | GET /platform/v1/services/{service_id}/availability | Has basic docs |

### Files to Modify

```
swagger/scheduling/
├── availability_slots.json      # Enhance
├── availability.json            # Enhance
├── resource_management.json     # Enhance
└── legacy/
    ├── legacy_v1_scheduling.json # Enhance
    └── scheduling.json           # Enhance

entities/scheduling/
├── availabilitySlot.json        # Enhance
├── resource.json                # Enhance
├── resourceType.json            # Enhance
└── md/*.md                      # Enhance
```

### Source Code to Review (in core)

```
modules/scheduling/app/controllers/
├── platform/v1/
│   ├── availability_controller.rb
│   ├── services_controller.rb
│   └── scheduling/
│       ├── appointments_controller.rb
│       ├── bookings_controller.rb
│       ├── staff_controller.rb
│       └── waitlist_controller.rb
└── v3/scheduling/
    └── resource_bookings_controller.rb
```

### Validation Requirements

For each endpoint:
1. **Parameter Verification**
   - [ ] Compare swagger params with controller `params` usage
   - [ ] Verify required vs optional matches `check_required_params`
   - [ ] Confirm types match validation logic

2. **Response Verification** ⚠️ MANDATORY
   - [ ] Match response structure with `render json:` statements
   - [ ] **Verify ALL possible status codes** (see Response Code Checklist below)
   - [ ] Document all error codes from `rescue` blocks
   - [ ] Check base controller for inherited error handlers

3. **Field Structure Verification** ⚠️ MANDATORY - NEW
   - [ ] **Request fields match code exactly** (see Field Structure Checklist below)
   - [ ] **Response fields match code exactly**
   - [ ] Field types are correct (string, integer, boolean, array, object)
   - [ ] Nested object structures are accurate
   - [ ] Enum values are complete and match code constants
   - [ ] Field names match exactly (watch for snake_case vs camelCase)

4. **Business Logic**
   - [ ] Document rate limits from `within_rate_limit?` calls
   - [ ] Document validation rules from model/component layer
   - [ ] Note any conditional behavior

5. **Entity Documentation** ⚠️ MANDATORY
   - [ ] Update entity JSON schemas with constraints found in code (maxLength, min/max, enums)
   - [ ] Update entity markdown files with:
     - Business rules and limits discovered from code
     - Feature flag requirements
     - Access/permission requirements
     - Related entities and cross-references
     - Usage guidance and common scenarios
   - [ ] Ensure consistency between swagger and entity documentation

### ⚠️ MANDATORY: Response Code Verification Checklist

**For EVERY endpoint, verify and document these response codes:**

| Code | Check For | Source Location |
|------|-----------|-----------------|
| **200** | Successful GET/PUT/PATCH | `render json: ..., status: 200` or `render json:` (default) |
| **201** | Successful POST (created) | `render json: ..., status: 201` |
| **204** | Successful DELETE | `head :no_content` or `render status: 204` |
| **400** | Missing/invalid params | `check_required_params`, `ActionController::ParameterMissing` |
| **401** | Auth failures | `JWT::DecodeError`, `EmptyToken`, base controller `rescue_from` |
| **403** | Permission denied | `CanCan::AccessDenied`, feature flag checks |
| **404** | Not found | `ActiveRecord::RecordNotFound`, base controller `rescue_from` |
| **412** | Precondition failed | Business rule violations (e.g., `BOOKING_VIOLATION`) |
| **422** | Validation/business error | `ActiveRecord::RecordInvalid`, `Api::ValidationErrors`, business logic |
| **429** | Rate limit | `within_rate_limit?` checks |
| **500** | Server error | Generic `Exception` handler in base controller |

**Base Controller Error Handlers to Check:**

```ruby
# Rails base controllers typically have:
rescue_from ActiveRecord::RecordNotFound    # → 404
rescue_from ActiveRecord::RecordInvalid     # → 422
rescue_from JWT::DecodeError                # → 401
rescue_from ActionController::ParameterMissing # → 400
rescue_from Exception                       # → 500
```

**NestJS base controllers typically have:**
```typescript
// Check for decorators and exception filters:
@UseFilters(AllExceptionsFilter)
// Check for guards:
@UseGuards(AuthGuard)  // → 401/403
// Check for validation pipes:
@UsePipes(ValidationPipe)  // → 400
```

**CRITICAL:** If the swagger only shows `200` response, this is almost certainly incomplete. Every endpoint should document at minimum: success code + 401 + 404 + 422 + 500.

### ⚠️ MANDATORY: Field Structure Verification Checklist

**For EVERY endpoint, verify request and response field structures against source code:**

#### Request Structure Verification

| What to Check | Where to Find It | Common Issues |
|---------------|------------------|---------------|
| **Query/Path Params** | Controller action signature, `params[]` usage | Missing optional params |
| **Request Body Fields** | `strong_params`, DTOs, `params.require().permit()` | Missing fields, wrong nesting |
| **Required vs Optional** | `check_required_params`, DTO decorators | Wrong required status |
| **Field Types** | Model validations, DTO type annotations | string vs integer |
| **Constraints** | Model validations, DTO validators | Missing maxLength, min/max |
| **Enum Values** | Model constants, enum definitions | Incomplete enum lists |

**Ruby/Rails - Where to Look:**
```ruby
# Strong params:
def client_params
  params.require(:client).permit(:first_name, :last_name, :email, :phone, :address, :tags)
end

# Required params check:
check_required_params(params, [:first_name, :email])

# Model validations:
validates :email, presence: true, format: { with: EMAIL_REGEX }
validates :first_name, length: { maximum: 100 }
```

**NestJS - Where to Look:**
```typescript
// DTO class:
export class CreateClientDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  first_name: string;
  
  @IsEmail()
  email: string;
  
  @IsOptional() @IsString()
  phone?: string;
}
```

**⚠️ CRITICAL: Custom Validators**

When you see `@Validate(CustomValidatorClass)`, you MUST:
1. **Find the validator file** (usually in `validators/` directory)
2. **Read the validation logic** (regex patterns, conditions)
3. **Document ALL validation rules** in the field description
4. **Include the error messages** the validator throws
5. **Verify examples comply** with the validation rules

Example - `@Validate(DeepLinkValidation)` requires:
- Path must start with `/`
- Only letters, numbers, underscores, hyphens, slashes, `${placeholder}` allowed
- No HTML tags, scripts, URL encoding, or full URLs
- Query parameters must be `name=value` format

This level of detail MUST be in the documentation.

#### Response Structure Verification

| What to Check | Where to Find It | Common Issues |
|---------------|------------------|---------------|
| **Response Fields** | Decorators, serializers, `render json:` | Missing/extra fields |
| **Field Nesting** | Decorator `as_json`, response DTOs | Wrong structure |
| **Field Types** | Model attributes, serializer methods | Wrong types |
| **Conditional Fields** | Decorator logic, `if` conditions | Fields not always present |
| **Included Relations** | `includes:`, nested decorators | Missing nested objects |

**Ruby/Rails - Where to Look:**
```ruby
# Decorator/Serializer:
class ClientDecorator
  FIELDS = [:uid, :first_name, :last_name, :email, :phone, :address, :tags, :created_at, :updated_at]
  
  def as_json
    {
      uid: client.uid,
      first_name: client.first_name,
      # ... check ALL fields returned
    }
  end
end

# Render statement:
render json: { status: 'OK', data: { client: ClientDecorator.new(client).as_json } }
```

**NestJS - Where to Look:**
```typescript
// Response DTO:
export class ClientResponseDto {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  // ... check ALL fields
}
```

#### Field Verification Process

For each endpoint:
1. **Find the controller action** - identify what params are used
2. **Find strong params or DTO** - identify all permitted/validated fields
3. **Trace ALL validators** - for every `@Validate()`, `@Matches()`, or custom validator, READ the validator code
4. **Find the serializer/decorator** - identify all response fields
5. **Compare with swagger** - document any discrepancies
6. **Verify examples** - ensure all examples comply with validation rules
7. **Fix swagger** - update to match code exactly

**CRITICAL:** If documentation shows fields that don't exist in code, or is missing fields that DO exist in code, the documentation MUST be corrected to match the actual implementation.

**CRITICAL:** Custom validators contain business rules that MUST be documented. A field description like "Optional deep link URL" is INCOMPLETE if the code requires it to start with `/` and prohibits full URLs. The documentation must include:
- Format requirements (patterns, prefixes, suffixes)
- Allowed/disallowed characters
- Security restrictions
- Error messages users will see if validation fails

### Deliverables

- [ ] 30 endpoints with enhanced documentation
- [ ] 5 entity schemas enhanced
- [ ] 30 validation checklists completed
- [ ] Phase 1 review completed

---

## Phase 2: Clients Domain

**Duration:** 2 weeks  
**Endpoints:** 42  
**Priority:** HIGH (Core CRM functionality)

### Endpoints to Document

#### Week 4: Client Management (21 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 1 | Get clients list | GET /platform/v1/clients |
| 2 | Delete client | DELETE /platform/v1/clients/{client_id} |
| 3 | Merge clients | PUT /platform/v1/clients/merges/merge_clients |
| 4 | Get possible merge master | GET /platform/v1/clients/merges/possible_merge_master |
| 5 | Get client conversations | GET /platform/v1/clients/{client_id}/conversations |
| 6 | Get client documents | GET /platform/v1/clients/{client_id}/documents |
| 7 | Get client estimates | GET /platform/v1/clients/{client_id}/estimates |
| 8 | Get client invoices | GET /platform/v1/clients/{client_id}/invoices |
| 9 | Get client payments | GET /platform/v1/clients/{client_id}/payments |
| 10 | Get all views | GET /business/search/v1/views |
| 11 | Get a specific view | GET /business/search/v1/views/{uid} |
| 12 | Bulk update views | PUT /business/search/v1/views/bulk |
| 13 | Get available columns | GET /business/search/v1/views_columns |
| 14 | Get available filters | GET /business/search/v1/view_filters |
| 15 | Get contact matters | GET /v1/contacts/{uid}/matters |
| 16 | Get Matters | GET /v1/matters |
| 17 | Get matter collaborators | GET /v1/matters/{matter_uid}/collaborators |
| 18 | Remove matter collaborator | DELETE /v1/matters/{matter_uid}/collaborators/{staff_uid} |
| 19 | Nest matter | PUT /v1/matters/{matter_uid}/nest |
| 20 | Get matter notes | GET /v1/matters/{matter_uid}/notes |
| 21 | Delete matter note | DELETE /v1/matters/{matter_uid}/notes/{note_uid} |

#### Week 5: Client Payments & Packages (21 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 22 | Reassign matter staff | PUT /v1/matters/{matter_uid}/reassign |
| 23 | Update client package usage | PUT /platform/v1/clients/payment/client_packages/update_usage |
| 24 | Validate client package | GET /platform/v1/clients/payment/client_packages/validate |
| 25 | Get client packages | GET /platform/v1/clients/{client_id}/payment/client_packages |
| 26 | Get External Connected Payment App | GET /v1/apps/primary_provider_connected_application |
| 27 | Create Card | POST /v1/cards |
| 28 | Get new card | GET /v1/cards/get_new_card |
| 29 | Save card session | POST /v1/cards/save_card_session |
| 30 | Create Cart | POST /v1/carts |
| 31 | Get Cart | GET /v1/carts/{uid} |
| 32 | Get Client Packages | GET /v1/client_packages |
| 33 | Get Deposits | GET /v1/deposits |
| 34 | Get Deposit | GET /v1/deposits/{uid} |
| 35 | Get Invoices | GET /v1/invoices |
| 36 | Get Packages | GET /v1/packages |
| 37 | Get Package | GET /v1/packages/{package_id} |
| 38 | Get Payment Requests | GET /v1/payment_requests |
| 39 | Get Payment Request Checkout | GET /v1/payment_requests/{payment_request_uid}/checkout |
| 40 | Get Payments | GET /v1/payments |
| 41 | Get Product Orders | GET /v1/product_orders |
| 42 | Import clients from external app | POST /v1/apps/{app_code_name}/import |

### Files to Modify

```
swagger/clients/
├── client_settings.json
└── legacy/
    ├── client_communication.json
    ├── clients_payments.json
    ├── crm_views.json
    ├── legacy_v1_clients.json
    ├── legacy_v1_platform_clients
    └── manage_clients.json

entities/clients/
├── clientSettings.json
└── md/*.md
```

### Validation Requirements

Same as Phase 1, plus:
- [ ] Verify pagination behavior
- [ ] Document search/filter parameters
- [ ] Verify client merge business rules

### Deliverables

- [ ] 42 endpoints with enhanced documentation
- [ ] 1 entity schema enhanced
- [ ] 42 validation checklists completed
- [ ] Phase 2 review completed

---

## Phase 3: Communication Domain

**Duration:** 2 weeks  
**Endpoints:** 32  
**Priority:** MEDIUM-HIGH

### Endpoints to Document

#### Week 6: Voice & Phone (15 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 1 | Create VoiceCallSetting | POST /v3/communication/voice_call_settings |
| 2 | Update VoiceCallSetting | PUT /v3/communication/voice_call_settings/{uid} |
| 3 | Get all VoiceCalls | GET /v3/communication/voice_calls |
| 4 | Retrieve VoiceCall | GET /v3/communication/voice_calls/{uid} |
| 5 | Delete VoiceCallRecording | DELETE /v3/communication/voice_call_recordings/{uid} |
| 6 | Retrieve VoiceCallQuota | GET /v3/communication/voice_call_quotas |
| 7 | Get voice call stats | GET /v3/communication/voice_calls/reports/voice_call_stats |
| 8 | Get Available Phone Numbers | GET /v3/communication/available_phone_numbers |
| 9 | Create BusinessPhoneNumber | POST /v3/communication/business_phone_numbers |
| 10 | Retrieve BusinessPhoneNumber | GET /v3/communication/business_phone_numbers/{uid} |
| 11 | Assign Dedicated Number | POST /platform/v1/numbers/dedicated_numbers/assign |
| 12 | Set Two Way Texting Status | PUT /platform/v1/numbers/dedicated_numbers/set_two_way_texting_status |
| 13 | Add Twilio Number | POST /platform/v1/numbers/twilio |
| 14 | Remove Twilio Number | DELETE /platform/v1/numbers/twilio/{sub_account_id} |
| 15 | Get conversations list | GET /platform/v1/conversations |

#### Week 7: Messaging & Notifications (17 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 16 | Create Message | POST /platform/v1/messages |
| 17 | Connect messaging channel | POST /v1/channels |
| 18 | Notify typing indicator | POST /v1/channels/typing |
| 19 | Create ActivityMessage | POST /v3/communication/activity_messages |
| 20 | Send activity message | POST /v3/messaging/activity_message |
| 21 | Create communication channel | POST /business/communication/channels |
| 22 | Delete communication channel | DELETE /business/communication/channels/{uid} |
| 23 | Send message to business | POST /business/communication/messages |
| 24 | Update message status | PUT /business/communication/messages/{messageUid} |
| 25 | Generate OAuth token | GET /business/communication/oauth |
| 26 | Get communication sessions | GET /business/communication/sessions |
| 27 | Populate typing indicator | POST /business/communication/sessions/typing |
| 28 | Delete communication session | DELETE /business/communication/sessions/{uid} |
| 29 | Get all NotificationTemplates | GET /v3/communication/notification_templates |
| 30 | Retrieve NotificationTemplate | GET /v3/communication/notification_templates/{uid} |
| 31 | Create StaffNotification | POST /v3/communication/staff_notifications |
| 32 | Retrieve StaffNotification | GET /v3/communication/staff_notifications/{uid} |

### Files to Modify

```
swagger/communication/
├── activity_message.json
├── business_phone_numbers.json
├── communication.json
├── notification_template.json
├── staff_notification.json
└── legacy/
    ├── communication.json
    ├── legacy_v1_communication.json
    └── messages.json

entities/communication/
├── activityMessage.json
├── availablePhoneNumber.json
├── businessPhoneNumber.json
├── notificationTemplate.json
├── staff_notification.json
├── voiceCall.json
├── voiceCallQuota.json
├── voiceCallRecording.json
├── voiceCallSetting.json
└── md/*.md
```

### Deliverables

- [ ] 32 endpoints with enhanced documentation
- [ ] 11 entity schemas enhanced
- [ ] 32 validation checklists completed
- [ ] Phase 3 review completed

---

## Phase 4: Sales Domain

**Duration:** 2 weeks  
**Endpoints:** 46  
**Priority:** MEDIUM-HIGH

### Endpoints to Document

#### Week 8: Payments & Cards (23 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 1 | Get Client Payment Cards | GET /platform/v1/clients/payment/cards |
| 2 | Get payments list | GET /platform/v1/payments |
| 3 | Get payment details | GET /platform/v1/payments/{payment_id} |
| 4 | Match payment | POST /platform/v1/payments/{payment_uid}/match |
| 5 | Sync card | POST /platform/v1/payment/cards/sync_card |
| 6 | Delete saved card | DELETE /platform/v1/payment/cards/{card_id} |
| 7 | Update checkout process | PUT /platform/v1/payment/checkout/ |
| 8 | Get checkout | GET /platform/v1/payment/checkout/{url_key} |
| 9 | Get payment settings | GET /platform/v1/payment/settings |
| 10 | Update default currency | PUT /platform/v1/payment/settings/update_default_currency |
| 11 | Create Card Request | POST /v1/card_requests |
| 12 | Get Card Request | GET /v1/card_requests/{client_uid} |
| 13 | Update Card | PUT /v1/cards/{uid} |
| 14 | Get Payments | GET /v1/payments |
| 15 | Get Payment | GET /v1/payments/{payment_uid} |
| 16 | Create Payout | POST /v1/payouts |
| 17 | Get Payout | GET /v1/payouts/{provider_payout_id} |
| 18 | Get Deposits | GET /v1/deposits |
| 19 | Delete Deposit | DELETE /v1/deposits/{uid} |
| 20 | Get Payment Requests | GET /v1/payment_requests |
| 21 | Send Payment Request Link | POST /v1/payment_requests/{payment_request_id}/send_link |
| 22 | Get Payment Request | GET /v1/payment_requests/{payment_request_uid} |
| 23 | Create Product Order | POST /v1/product_orders |

#### Week 9: Invoices, Estimates & Packages (23 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 24 | Get invoices list | GET /platform/v1/invoices |
| 25 | Get invoice details | GET /platform/v1/invoices/{invoice_id} |
| 26 | Create Invoice | POST /v1/invoices |
| 27 | Get Invoice | GET /v1/invoices/{invoice_uid} |
| 28 | Cancel Invoice | PUT /v1/invoices/{invoice_uid}/cancel |
| 29 | Get estimates list | GET /platform/v1/estimates |
| 30 | Create Estimate | POST /v1/estimates |
| 31 | Get Estimate | GET /v1/estimates/{estimate_uid} |
| 32 | Create Lead | POST /platform/v1/leadgen |
| 33 | Add package to client | POST /platform/v1/payment/client_packages |
| 34 | Cancel package redemption | PUT /platform/v1/payment/client_packages/cancel_redemption |
| 35 | Update package usage | PUT /platform/v1/payment/client_packages/update_usage |
| 36 | Get payment packages | GET /platform/v1/payment/packages |
| 37 | Get payment package details | GET /platform/v1/payment/packages/{package_id} |
| 38 | Get Client Package | GET /v1/client_packages/{client_package_id} |
| 39 | Reorder Packages | PUT /v1/packages/reorder |
| 40 | Apply coupon | PUT /platform/v1/payment_statuses/{id}/apply_coupon |
| 41 | Validate coupon | GET /platform/v1/payment_statuses/{id}/validate_coupon |
| 42 | Create Sale | POST /v1/carts |
| 43 | Get Sale | GET /v1/carts/{uid} |
| 44 | Cancel Sale | PUT /v1/carts/{uid}/cancel |
| 45 | Complete Sale | PUT /v1/carts/{uid}/cart_completed |
| 46 | Create booking | POST /v1/bookings |

### Files to Modify

```
swagger/sales/
├── coupon.json
├── payment_gateway.json
├── sales_reports.json
└── legacy/
    └── *.json

entities/sales/
├── *.json
└── md/*.md
```

### Deliverables

- [ ] 46 endpoints with enhanced documentation
- [ ] 2 entity schemas enhanced
- [ ] 46 validation checklists completed
- [ ] Phase 4 review completed

---

## Phase 5: Platform Administration

**Duration:** 2 weeks  
**Endpoints:** 41  
**Priority:** MEDIUM

### Endpoints to Document

#### Week 10: License & Subscriptions (20 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 1 | List all Offerings | GET /v3/license/offerings |
| 2 | Get Offering | GET /v3/license/offerings/{uid} |
| 3 | List all DirectoryOfferings | GET /v3/license/directory_offerings |
| 4 | Get DirectoryOffering | GET /v3/license/directory_offerings/{uid} |
| 5 | Bulk create DirectoryOfferings | POST /v3/license/directory_offerings/bulk |
| 6 | List all BundledOfferings | GET /v3/license/bundled_offerings |
| 7 | Bulk create BundledOfferings | POST /v3/license/bundled_offerings/bulk |
| 8 | Get BundledOffering | GET /v3/license/bundled_offerings/{uid} |
| 9 | List all Subscriptions | GET /v3/license/subscriptions |
| 10 | Bulk create Subscriptions | POST /v3/license/subscriptions/bulk |
| 11 | Get Subscription | GET /v3/license/subscriptions/{uid} |
| 12 | Get all BusinessCarts | GET /v3/license/business_carts |
| 13 | Retrieve BusinessCart | GET /v3/license/business_carts/{uid} |
| 14 | List all SKUs | GET /v3/license/skus |
| 15 | Get all Features Packages | GET /v3/license/features_packages |
| 16 | Search businesses | GET /platform/v1/businesses |
| 17 | Validate login | GET /platform/v1/businesses/validate_login |
| 18 | Verify audience claim | POST /platform/v1/businesses/verify_audience_claim |
| 19 | Get business details | GET /platform/v1/businesses/{business_id} |
| 20 | Get business features | GET /platform/v1/businesses/{business_id}/features |

#### Week 11: Staff & Configuration (21 endpoints)

| # | Endpoint | Path |
|---|----------|------|
| 21 | Update purchased items | PUT /platform/v1/businesses/{business_id}/purchased_items |
| 22 | Get business recurly data | GET /platform/v1/businesses/{business_id}/recurly_data |
| 23 | Get staff list | GET /platform/v1/businesses/{business_id}/staffs |
| 24 | Delete staff member | DELETE /platform/v1/businesses/{business_id}/staffs/{staff_id} |
| 25 | End staff sessions | DELETE /platform/v1/businesses/{business_id}/staffs/{staff_id}/sessions |
| 26 | Get available wizards | GET /platform/v1/businesses/{business_id}/wizards |
| 27 | Get wizard by name | GET /platform/v1/businesses/{business_id}/wizards/{wizard_name} |
| 28 | Get daily staff sign-ins | GET /v1/daily_staff_sign_ins |
| 29 | Update staff properties | PUT /v1/staffs/{uid} |
| 30 | Get directory branding | GET /platform/v1/directory/branding |
| 31 | Get categories list | GET /platform/v1/categories |
| 32 | Get category services | GET /platform/v1/categories/{category_id}/services |
| 33 | Get custom fields list | GET /platform/v1/fields |
| 34 | Get field details | GET /platform/v1/fields/{field_id} |
| 35 | Get forms list | GET /platform/v1/forms |
| 36 | Get tokens list | GET /platform/v1/tokens |
| 37 | Revoke token | POST /platform/v1/tokens/revoke |
| 38 | Subscribe to webhook | POST /platform/v1/webhook/subscribe |
| 39 | Unsubscribe from webhook | POST /platform/v1/webhook/unsubscribe |
| 40 | Get webhooks list | GET /platform/v1/webhooks |
| 41 | Create booking | POST /v1/bookings |

### Files to Modify

```
swagger/platform_administration/
├── access_control.json
├── license.json
├── operatorCapabilities.json
├── operatorTokens.json
├── staff_member.json
├── staff.json
└── legacy/
    └── *.json

entities/license/
├── *.json
└── md/*.md

entities/business_administration/
├── *.json
└── md/*.md
```

### Deliverables

- [ ] 41 endpoints with enhanced documentation
- [ ] 14 entity schemas enhanced (license + business_admin)
- [ ] 41 validation checklists completed
- [ ] Phase 5 review completed

---

## Phase 6: Apps & Integrations

**Duration:** 1 week  
**Endpoints:** 34  
**Priority:** MEDIUM

### Endpoints to Document

| # | Domain | Endpoint | Path |
|---|--------|----------|------|
| 1 | Apps | Create Widget | POST /v3/apps/widgets |
| 2 | Apps | Get all Widgets | GET /v3/apps/widgets |
| 3 | Apps | Update Widget | PUT /v3/apps/widgets/{uid} |
| 4 | Apps | Create Staff Widgets Board | POST /v3/apps/staff_widgets_boards |
| 5 | Apps | Get all Widgets Boards | GET /v3/apps/staff_widgets_boards |
| 6 | Apps | Update Staff Widgets Board | PUT /v3/apps/staff_widgets_boards/{uid} |
| 7 | Apps | Create Staff Widgets Boards Template | POST /v3/apps/staff_widgets_boards_templates |
| 8 | Apps | Get all Staff Widgets Boards Templates | GET /v3/apps/staff_widgets_boards_templates |
| 9 | Apps | Update Staff Widgets Boards Template | PUT /v3/apps/staff_widgets_boards_templates/{uid} |
| 10 | Apps | Delete Staff Widgets Boards Template | DELETE /v3/apps/staff_widgets_boards_templates/{uid} |
| 11 | Apps | List Apps | GET /platform/v1/apps |
| 12 | Apps | Create App | POST /platform/v1/apps |
| 13 | Apps | Get App | GET /platform/v1/apps/{id} |
| 14 | Apps | Update App | PUT /platform/v1/apps/{id} |
| 15 | Apps | Assign App | POST /platform/v1/apps/{id}/assign |
| 16 | Apps | Install App | POST /platform/v1/apps/{id}/install_app |
| 17 | Apps | Unassign App | POST /platform/v1/apps/{id}/unassign |
| 18 | Apps | Uninstall App | POST /platform/v1/apps/{id}/uninstall_app |
| 19 | Apps | List App Assignments | GET /v3/apps/app_assignments |
| 20 | Apps | Create App Assignment | POST /v3/apps/app_assignments |
| 21 | Apps | Delete App Assignment | DELETE /v3/apps/app_assignments/{uid} |
| 22 | Apps | Create compact JWS token | POST /v3/apps/compact_jws_tokens |
| 23 | Apps | Bulk create compact JWS tokens | POST /v3/apps/compact_jws_tokens/bulk |
| 24 | Integrations | Create IDP User | POST /v3/authbridge/idp_users/{actor_type} |
| 25 | Integrations | Delete IDP User | DELETE /v3/authbridge/idp_users/{actor_type}/{idp_user_reference_id} |
| 26 | Integrations | Send Invitation | POST /v3/authbridge/idp_actor_mappings/{idp_actor_mappings_uid}/invite |
| 27 | Integrations | Create ImportJob | POST /v3/integrations/import_jobs |
| 28 | Integrations | Retrieve ImportJob | GET /v3/integrations/import_jobs/{uid} |
| 29 | Integrations | Get all ImportJobItems | GET /v3/integrations/import_job_items |
| 30 | Integrations | Retrieve ImportJobItem | GET /v3/integrations/import_job_items/{uid} |
| 31 | Integrations | List all IDP Actor Mappings | GET /v3/integrations/idp_actor_mappings |
| 32 | Integrations | Create IDP Actor Mapping | POST /v3/integrations/idp_actor_mappings |
| 33 | Integrations | Delete IDP Actor Mapping | DELETE /v3/integrations/idp_actor_mappings/{uid} |

### Files to Modify

```
swagger/apps/
├── apps.json
├── jwks.json
├── widgets_and_boards.json
└── legacy/
    └── *.json

swagger/integrations/
├── authbridge.json
└── import.json

entities/apps/
├── *.json
└── md/*.md

entities/integrations/
├── *.json
└── md/*.md
```

### Deliverables

- [ ] 34 endpoints with enhanced documentation
- [ ] 13 entity schemas enhanced (apps + integrations)
- [ ] 34 validation checklists completed
- [ ] Phase 6 review completed

---

## Phase 7: AI, Operators, Reviews

**Duration:** 1 week  
**Endpoints:** 26  
**Priority:** MEDIUM-LOW

### Endpoints to Document

| # | Domain | Endpoint | Path |
|---|--------|----------|------|
| 1 | AI | Retrieve StaffAiSettings | GET /v3/ai/staff_ai_settings/{staff_uid} |
| 2 | AI | Update StaffAiSettings | PUT /v3/ai/staff_ai_settings/{staff_uid} |
| 3 | AI | Get all AIRecommendations | GET /v3/ai/ai_recommendations |
| 4 | AI | Create AIRecommendation | POST /v3/ai/ai_recommendations |
| 5 | AI | Get AIRecommendation | GET /v3/ai/ai_recommendations/{uid} |
| 6 | AI | Update AIRecommendation | PUT /v3/ai/ai_recommendations/{uid} |
| 7 | AI | Retrieve AIRecommendedAction | GET /v3/ai/ai_recommended_actions/{uid} |
| 8 | AI | Get all BizAIChats | GET /v3/ai/bizai_chats |
| 9 | AI | Create BizAIChat | POST /v3/ai/bizai_chats |
| 10 | AI | Retrieve BizAIChat | GET /v3/ai/bizai_chats/{uid} |
| 11 | AI | Get all BizAIChatMessages | GET /v3/ai/bizai_chat_messages |
| 12 | AI | Create BizAIChatMessage | POST /v3/ai/bizai_chat_messages |
| 13 | Operators | Create OperatorBusinessToken | POST /v3/operators/operator_business_tokens |
| 14 | Operators | Get all OperatorCapabilities | GET /v3/operators/operator_capabilities |
| 15 | Operators | Create OperatorCapability | POST /v3/operators/operator_capabilities |
| 16 | Operators | Get all OPRoles | GET /v3/operators/op_roles |
| 17 | Operators | Create OPRole | POST /v3/operators/op_roles |
| 18 | Operators | Retrieve OPRole | GET /v3/operators/op_roles/{uid} |
| 19 | Operators | Update OPRole | PUT /v3/operators/op_roles/{uid} |
| 20 | Operators | Delete OPRole | DELETE /v3/operators/op_roles/{uid} |
| 21 | Operators | Create OperatorOPRole | POST /v3/operators/operator_op_roles |
| 22 | Operators | Retrieve OperatorOPRole | GET /v3/operators/operator_op_roles/{operator_uid} |
| 23 | Operators | Delete OperatorOPRole | DELETE /v3/operators/operator_op_roles/{operator_uid} |
| 24 | Reviews | Retrieve Business Reviews Settings | GET /v3/reviews/business_reviews_settings/{business_uid} |
| 25 | Reviews | Update Business Reviews Settings | PUT /v3/reviews/business_reviews_settings/{business_uid} |
| 26 | Reviews | Create Business Reviews Settings | POST /v3/reviews/business_reviews_settings |

### Files to Modify

```
swagger/ai/
├── ai_generation_feedback.json
├── ai_smart_reply.json
├── bizai.json
├── recommendations.json
└── staff_ai_settings.json

swagger/reviews/
└── business_reviews_settings.json

entities/ai/
├── *.json
└── md/*.md

entities/operators/
├── *.json
└── md/*.md

entities/reviews/
├── *.json
└── md/*.md
```

### Deliverables

- [ ] 26 endpoints with enhanced documentation
- [ ] 13 entity schemas enhanced (ai + operators + reviews)
- [ ] 26 validation checklists completed
- [ ] Phase 7 review completed

---

## Validation Process

### Per-Endpoint Validation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENDPOINT VALIDATION FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: SOURCE CODE REVIEW                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ Locate controller file                                     │   │
│  │ □ Identify action method                                     │   │
│  │ □ Document all params used                                   │   │
│  │ □ Document all render responses                              │   │
│  │ □ Document all rescue/error handlers                         │   │
│  │ □ Note any rate limits                                       │   │
│  │ □ Note any business rules                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  Step 2: SWAGGER COMPARISON                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ Compare documented params vs code params                   │   │
│  │ □ Compare documented responses vs code responses             │   │
│  │ □ Identify missing documentation                             │   │
│  │ □ Identify incorrect documentation                           │   │
│  │ □ Mark uncertain items as NEEDS_VERIFICATION                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  Step 3: ENHANCEMENT                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ Update summary (if needed)                                 │   │
│  │ □ Enhance description with use cases                         │   │
│  │ □ Add/fix parameter documentation                            │   │
│  │ □ Add/fix response documentation                             │   │
│  │ □ Add realistic examples                                     │   │
│  │ □ Add error code examples                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  Step 4: SELF-REVIEW                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ JSON syntax valid                                          │   │
│  │ □ All $refs resolve                                          │   │
│  │ □ Examples are valid JSON                                    │   │
│  │ □ No invented information                                    │   │
│  │ □ Uncertain items marked                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  Step 5: PEER REVIEW                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ □ Second person verifies against code                        │   │
│  │ □ Confirms examples are realistic                            │   │
│  │ □ Validates business logic notes                             │   │
│  │ □ Approves for merge                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Validation Rules

| Rule | Description | Action if Violated |
|------|-------------|-------------------|
| **🚨 V0** | **Source code MUST be found before any edit** | **STOP. Request codebase access. Do NOT proceed.** |
| **V1** | Parameter must exist in source code | Do not add parameter |
| **V2** | Response code must exist in source code | Do not add response |
| **V3** | Error code must exist in source code | Do not add error |
| **V4** | Type must match source code | Use source code type |
| **V5** | Required/optional must match source code | Use source code status |
| **V6** | If uncertain, mark as NEEDS_VERIFICATION | Do not guess |
| **V7** | Examples must be syntactically valid | Validate JSON |
| **V8** | No new endpoints can be added | Skip if not in hub |

### 🛑 Source Code Not Found Protocol

When source code for an endpoint cannot be located:

```
1. STOP all work on that endpoint immediately
2. Document the endpoint in a "BLOCKED_ENDPOINTS.md" file:
   - Endpoint path and method
   - Swagger file location
   - Search attempts made
   - Suspected codebase location
3. Request access to the missing codebase
4. Move to next endpoint (do not skip validation for others)
5. Return to blocked endpoint only after code access is granted
```

### Quality Gates

Before merging any phase:

1. **Syntax Validation**
   - All JSON files parse without errors
   - All $ref links resolve
   - OpenAPI spec validates

2. **Completeness Check**
   - All endpoints in phase have validation checklist
   - All NEEDS_VERIFICATION items are documented
   - All entity schemas referenced are enhanced

3. **Accuracy Review**
   - Peer review completed
   - No invented information
   - Source code references documented

---

## Risk Mitigation

### Risk: Source Code Not Available

**Severity:** CRITICAL  
**Mitigation:**
- 🛑 **STOP** - Do not make any edits to the endpoint documentation
- Document the endpoint in `BLOCKED_ENDPOINTS.md`
- Request access to the missing codebase
- Do NOT proceed with that endpoint until code is available
- Do NOT use existing documentation as source of truth
- Do NOT guess or assume behavior based on naming conventions

### Risk: Ambiguous Implementation

**Mitigation:**
- Document what IS clear
- Mark ambiguous parts
- Request clarification
- Do NOT assume behavior

### Risk: Breaking Existing Documentation

**Mitigation:**
- Keep original in git history
- Make incremental changes
- Review before merge
- Test documentation renders

### Risk: Inconsistent Documentation

**Mitigation:**
- Use templates strictly
- Follow naming conventions
- Peer review all changes
- Phase-end consistency check

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Endpoints documented | 250 | Count of completed checklists |
| Validation coverage | 100% | Checklists / Endpoints |
| NEEDS_VERIFICATION items | < 10% | Marked items / Total items |
| JSON syntax errors | 0 | Validation tool output |
| Peer review coverage | 100% | Reviewed / Total changes |

---

## Timeline Summary

| Phase | Duration | Endpoints | Cumulative |
|-------|----------|-----------|------------|
| 0: Foundation | Week 1 | 0 | 0 |
| 1: Scheduling | Weeks 2-3 | 30 | 30 |
| 2: Clients | Weeks 4-5 | 42 | 72 |
| 3: Communication | Weeks 6-7 | 32 | 104 |
| 4: Sales | Weeks 8-9 | 46 | 150 |
| 5: Platform Admin | Weeks 10-11 | 41 | 191 |
| 6: Apps & Integrations | Week 12 | 34 | 225 |
| 7: AI, Operators, Reviews | Week 13 | 26 | **251** |

**Total Duration:** 13 weeks  
**Total Endpoints:** 251 (250 + 1 duplicate booking endpoint)

---

## Appendix A: File Inventory

### Swagger Files (53 total)

```
mcp_swagger/
├── ai.json
├── apps.json
├── clients.json
├── communication.json
├── integrations.json
├── payments.json
├── platform_administration.json
├── reviews.json
├── sales.json
└── scheduling.json

swagger/
├── ai/ (5 files)
├── apps/ (6 files)
├── clients/ (7 files)
├── communication/ (8 files)
├── integrations/ (2 files)
├── payments/ (2 files)
├── platform_administration/ (10 files)
├── reviews/ (1 file)
├── sales/ (7 files)
└── scheduling/ (5 files)
```

### Entity Schema Files (51 total)

```
entities/
├── access_control/ (5 json + 5 md)
├── ai/ (8 json + 8 md)
├── apps/ (9 json + 8 md)
├── business_administration/ (6 json + 2 md)
├── clients/ (1 json + 1 md)
├── communication/ (11 json + 9 md)
├── integrations/ (4 json + 3 md)
├── license/ (8 json + 8 md)
├── operators/ (4 json + 4 md)
├── payment_processing/ (2 json + 2 md)
├── payments/ (2 json + 1 md)
├── reviews/ (1 json + 1 md)
├── sales/ (2 json + 2 md)
├── scheduling/ (5 json + 5 md)
├── staff/ (1 json + 1 md)
└── response.json
```

---

## Appendix B: Available Codebases

### Projects in Workspace

| Codebase | Path | Language | APIs Covered | Status |
|----------|------|----------|--------------|--------|
| `core` | `C:\Programming\core` | Ruby/Rails | Platform v1, Business APIs, Scheduling, Clients, Sales, Communication | ✅ Available |
| `apigw` | `C:\Programming\apigw` | Go | API Gateway routing/proxy (not API logic) | ✅ Available |
| `client-portal` | `C:\Programming\client-portal` | Vue.js | Frontend only (no API implementation) | ✅ Available |
| `aiplatform` | `C:\Programming\aiplatform` | TypeScript/NestJS | AI, BizAI, Recommendations, Generation Feedback | ✅ Available |

### Codebase-to-Domain Mapping

| Domain | Primary Codebase | Key Source Files |
|--------|------------------|------------------|
| **AI** | `aiplatform` | `src/chats/`, `src/recommendations/`, `src/ai-generation-feedback/` |
| **Apps** | `core` | `modules/apps/app/controllers/`, `app/controllers/platform/v1/` |
| **Clients** | `core` | `modules/clients/app/controllers/`, `app/controllers/platform/v1/clients_controller.rb` |
| **Communication** | `core` | `modules/messaging/app/controllers/` |
| **Integrations** | `core` | TBD - verify during implementation |
| **Operators** | `core` | TBD - verify during implementation |
| **Platform Admin** | `core` | `modules/licenses/app/controllers/`, `app/controllers/platform/v1/` |
| **Reviews** | `core` | `app/controllers/api/v3/reviews/` |
| **Sales** | `core` | `modules/payments/app/controllers/` |
| **Scheduling** | `core` | `modules/scheduling/app/controllers/` |

### Potentially Missing Codebases

If during implementation we encounter endpoints whose source code cannot be found in any available codebase, we will:

1. Document in `BLOCKED_ENDPOINTS.md`
2. Stop work on those endpoints
3. Request access to additional codebases

**Known gaps to verify during Phase 0:**
- v3 Integrations APIs (authbridge, import) - may be in separate service
- v3 Operators APIs - may be in separate service
- Some v3 Communication APIs - may be in separate service

---

*Document prepared for review. Please approve before proceeding with Phase 0.*
