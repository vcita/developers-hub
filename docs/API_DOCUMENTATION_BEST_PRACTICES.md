# API Documentation Best Practices Guidelines
## inTandem Developers Hub - Documentation Excellence Framework

**Version:** 2.0  
**Date:** January 2026  
**Purpose:** Establish standards for creating comprehensive, accurate, and developer-friendly API documentation that aligns with actual code implementations.

> **Note:** This document incorporates lessons learned from the comprehensive documentation enhancement project completed in January 2026, covering Phases 1-5 (Scheduling, Clients, Communication, Sales, Platform Administration).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Documentation Structure Standards](#3-documentation-structure-standards)
4. [Endpoint Documentation Requirements](#4-endpoint-documentation-requirements)
5. [Schema and Entity Documentation](#5-schema-and-entity-documentation)
6. [Error Documentation Standards](#6-error-documentation-standards)
7. [Code-Documentation Alignment Process](#7-code-documentation-alignment-process)
8. [AI Agent Optimization](#8-ai-agent-optimization)
9. [Quality Checklist](#9-quality-checklist)
10. [Examples from Industry Leaders](#10-examples-from-industry-leaders)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Lessons Learned](#12-lessons-learned)
13. [Microservices Architecture Considerations](#13-microservices-architecture-considerations)
14. [Custom OpenAPI Extensions (x-vcita)](#14-custom-openapi-extensions-x-vcita)

---

## 1. Executive Summary

### Goal
Transform the inTandem Developers Hub into a world-class API documentation resource that:
- **Accurately reflects** the actual code implementation in the core project
- **Empowers developers** and AI agents to integrate quickly and correctly
- **Reduces support burden** by anticipating and answering common questions
- **Maintains currency** through automated validation processes

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Accuracy First** | Documentation must match actual API behavior exactly |
| **Developer Empathy** | Write for the developer's journey, not internal architecture |
| **Completeness** | Document all inputs, outputs, errors, validations, and edge cases |
| **Actionability** | Every endpoint should have working examples |
| **Discoverability** | Information should be easy to find and navigate |
| **AI-Readiness** | Structure content for both human and machine consumption |

---

## 2. Current State Analysis

### What We Have (developers-hub)

**Strengths:**
- ✅ OpenAPI 3.x specification format
- ✅ Organized by domain (AI, Apps, Clients, Communication, etc.)
- ✅ Entity schemas defined in separate JSON files
- ✅ ReadMe.io integration for publishing
- ✅ ~250+ endpoints documented across domains

**Gaps Identified:**

| Gap Area | Current State | Target State |
|----------|---------------|--------------|
| **Error Documentation** | Generic 400/401/404/500 codes | Specific error codes, messages, and resolution steps |
| **Validation Rules** | Minimal or missing | Complete field-level validation documentation |
| **Use Cases** | Brief descriptions only | "When to use" scenarios with decision trees |
| **Request Examples** | Present but limited | Multiple examples per endpoint covering edge cases |
| **Response Examples** | Basic examples | Full examples with all possible response variations |
| **Rate Limits** | Not documented | Clear rate limit information per endpoint |
| **Authentication Context** | Token types mentioned | Detailed permission requirements and scopes |
| **Business Logic** | Not documented | Key business rules affecting API behavior |
| **Related Endpoints** | Not linked | Cross-references to related operations |

### Code Implementation Patterns

#### Ruby on Rails (core project)

```ruby
# Pattern 1: Error Response Structure
render json: {status: 'Error', error: errors.join(", "), error_code: "PARAMETER_MISSING"}, status: 400

# Pattern 2: Success Response Structure  
render json: {status: 'OK', data: { booking: booking_response}}, status: 201

# Pattern 3: Rate Limiting
unless Components::Common::Utils.within_rate_limit?("get_clients_for_business:#{context_business.try(:uid)}", 
  APP_CONFIG['rate_limit.get_clients.limit'], 
  APP_CONFIG['rate_limit.get_clients.interval'])

# Pattern 4: Decorator Fields (defines response structure)
DECORATE_FIELDS = [:uid, :service_uid, :start_time, :end_time, :status]
```

#### NestJS (microservices)

```typescript
// Pattern 1: DTO Validation (defines required fields)
export class CreateResourceDto {
  @IsNotEmpty()
  @MaxLength(30)
  name: string;
  
  @IsOptional()
  description?: string;
}

// Pattern 2: Response Code Override
@Post()
@HttpCode(HttpStatus.CREATED)  // Returns 201
async create() { ... }

// Pattern 3: Feature Flag Protection
@UseInterceptors(FeatureFlagsInterceptor)
@FeatureFlags(['pkg.sch.resources', 'resources'])

// Pattern 4: Actor Type Restriction
@AllowedActors([ActorType.STAFF, ActorType.DIRECTORY])

// Pattern 5: Permission Check
@RequirePermissions(['account.settings.manage'])
```

**Key Observations:**
- Error responses include `error_code` field (e.g., "PARAMETER_MISSING", "TIMESLOT_UNAVAILABLE")
- Rate limiting exists but is often not documented
- Validation happens at multiple levels (controller, component/service, model/DTO)
- Business logic is encapsulated in Components modules (Rails) or Services (NestJS)
- NestJS uses decorators extensively for validation, auth, and response codes
- **@IsOptional() decorator means field is NOT required** - critical for accurate documentation

---

## 3. Documentation Structure Standards

### 3.1 Endpoint Documentation Template

Every endpoint MUST include these sections:

```yaml
endpoint:
  summary: "Brief action description (verb + noun)"
  description: |
    ## Overview
    [2-3 sentences explaining what this endpoint does and why you'd use it]
    
    ## When to Use
    - Use case 1
    - Use case 2
    - NOT for: [anti-patterns]
    
    ## Prerequisites
    - Required setup or prior API calls
    - Required permissions/token types
    
    ## Important Notes
    - Key business rules
    - Rate limits
    - Caching behavior
  
  parameters: [...]  # See Section 4.2
  requestBody: [...]  # See Section 4.3
  responses: [...]    # See Section 4.4 and 6
```

### 3.2 Domain Organization

```
/domain_name/
├── Overview.md           # Domain introduction, key concepts, getting started
├── Authentication.md     # Domain-specific auth requirements
├── Guides/
│   ├── QuickStart.md    # 5-minute integration guide
│   ├── CommonWorkflows.md
│   └── Troubleshooting.md
├── Endpoints/
│   ├── entity_crud.json  # OpenAPI spec for entity operations
│   └── ...
└── Entities/
    ├── EntityName.json   # Schema definition
    └── EntityName.md     # Detailed entity documentation
```

### 3.3 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Endpoint Summary | Verb + Object | "Create a new booking" |
| Parameter Names | snake_case | `staff_uid`, `start_time` |
| Schema Names | PascalCase | `BookingResponse`, `ClientData` |
| Error Codes | SCREAMING_SNAKE | `PARAMETER_MISSING`, `RATE_LIMIT_EXCEEDED` |
| Tags | Title Case | "Availability Slots", "Voice Calls" |

---

## 4. Endpoint Documentation Requirements

### 4.1 Summary and Description

**Summary (Required):**
- Max 80 characters
- Format: `[Action verb] [Object] [Context if needed]`
- Examples:
  - ✅ "Retrieve availability slots for scheduling"
  - ✅ "Create a new booking for a service"
  - ❌ "Get slots" (too vague)
  - ❌ "This endpoint retrieves..." (don't start with "This endpoint")

**Description (Required):**

```markdown
## Overview
Retrieves available time slots for booking appointments or events. Returns slots 
where at least one of the specified staff members or resources is available.

## When to Use
- Building a booking calendar UI
- Checking availability before creating a booking
- Finding alternative times when preferred slot is unavailable

## Prerequisites
- Valid Staff token with scheduling permissions
- At least one of: `resource_type_uids`, `resource_uids`, or `staff_uids`

## Rate Limits
- 100 requests per minute per business
- Cached for 30 seconds

## Related Endpoints
- [Create Booking](/scheduling/bookings#create) - Book an available slot
- [Get Services](/scheduling/services) - Get service details including duration
```

### 4.2 Parameters Documentation

**Required Fields for Each Parameter:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Parameter name |
| `in` | ✅ | Location: path, query, header, cookie |
| `required` | ✅ | Boolean |
| `description` | ✅ | Clear explanation of purpose and usage |
| `schema.type` | ✅ | Data type |
| `schema.format` | When applicable | e.g., date-time, uuid, email |
| `schema.enum` | When applicable | List of allowed values |
| `schema.minimum/maximum` | When applicable | Numeric constraints |
| `schema.minLength/maxLength` | When applicable | String constraints |
| `schema.pattern` | When applicable | Regex pattern |
| `schema.default` | When applicable | Default value |
| `example` | ✅ | Realistic example value |

**Example - Well-Documented Parameter:**

```json
{
  "name": "start_time",
  "in": "query",
  "required": true,
  "description": "Start of the time range to search for availability. Must be in ISO 8601 format with timezone. Cannot be more than 90 days in the past or 365 days in the future.",
  "schema": {
    "type": "string",
    "format": "date-time",
    "example": "2026-01-15T09:00:00Z"
  }
}
```

**Example - Parameter with Validation Rules:**

```json
{
  "name": "per_page",
  "in": "query",
  "required": false,
  "description": "Number of results per page. Defaults to 20 if not specified.",
  "schema": {
    "type": "integer",
    "minimum": 1,
    "maximum": 100,
    "default": 20,
    "example": 50
  }
}
```

### 4.3 Request Body Documentation

**Required Elements:**

```json
{
  "requestBody": {
    "required": true,
    "description": "Booking creation details. All times should be in the business's configured timezone unless otherwise specified.",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/CreateBookingRequest"
        },
        "examples": {
          "appointment": {
            "summary": "Create a simple appointment",
            "description": "Basic appointment booking with required fields only",
            "value": {
              "service_uid": "srv_abc123",
              "staff_uid": "stf_xyz789",
              "client_uid": "cli_def456",
              "start_time": "2026-01-20T14:00:00Z"
            }
          },
          "appointmentWithOptions": {
            "summary": "Appointment with all options",
            "description": "Full appointment with notes, custom fields, and payment",
            "value": {
              "service_uid": "srv_abc123",
              "staff_uid": "stf_xyz789",
              "client_uid": "cli_def456",
              "start_time": "2026-01-20T14:00:00Z",
              "notes": "Client prefers virtual meeting",
              "custom_fields": {
                "preferred_contact": "email"
              },
              "payment_status": "pending"
            }
          }
        }
      }
    }
  }
}
```

### 4.4 Response Documentation

**Document ALL response codes:**

| Code | When to Document |
|------|------------------|
| 200 | Successful GET/PUT/PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Validation errors, malformed requests |
| 401 | Authentication required/failed |
| 403 | Authorization failed (valid auth, insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state conflict) |
| 422 | Unprocessable entity (business logic failure) |
| 429 | Rate limit exceeded |
| 500 | Server error |

**Response Documentation Template:**

```json
{
  "responses": {
    "200": {
      "description": "Availability slots retrieved successfully",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/AvailabilitySlotsResponse"
          },
          "examples": {
            "withResults": {
              "summary": "Slots found",
              "value": {
                "success": true,
                "data": {
                  "availability_slots": [
                    {
                      "start": "2026-01-15T09:00:00Z",
                      "end": "2026-01-15T10:00:00Z",
                      "available_entities": [
                        {"entity_uid": "stf_123", "entity_type": "staff"}
                      ]
                    }
                  ]
                }
              }
            },
            "noResults": {
              "summary": "No availability",
              "description": "When no slots match the criteria",
              "value": {
                "success": true,
                "data": {
                  "availability_slots": []
                }
              }
            }
          }
        }
      }
    },
    "400": {
      "description": "Invalid request parameters",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/ErrorResponse"
          },
          "examples": {
            "missingRequired": {
              "summary": "Missing required parameter",
              "value": {
                "status": "Error",
                "error": "Mandatory parameter start_time is missing",
                "error_code": "PARAMETER_MISSING"
              }
            },
            "invalidFormat": {
              "summary": "Invalid date format",
              "value": {
                "status": "Error",
                "error": "start_time must be a valid ISO 8601 datetime",
                "error_code": "INVALID_FORMAT"
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 5. Schema and Entity Documentation

### 5.1 Entity JSON Schema Requirements

Every entity schema MUST include:

```json
{
  "type": "object",
  "title": "AvailabilitySlot",
  "description": "Represents a time window during which one or more staff members or resources are available for booking. Used in scheduling flows to display bookable times to clients.",
  
  "properties": {
    "start": {
      "type": "string",
      "format": "date-time",
      "description": "Start date and time of the availability slot in ISO 8601 format. Always returned in UTC.",
      "example": "2026-01-15T09:00:00Z"
    }
  },
  
  "required": ["start", "end", "available_entities"],
  
  "example": {
    "start": "2026-01-15T09:00:00Z",
    "end": "2026-01-15T10:00:00Z",
    "available_entities": []
  },
  
  "x-business-rules": [
    "Slots are returned in 15-minute increments by default",
    "Past slots are never returned even if requested",
    "Slots respect staff working hours and blocked times"
  ]
}
```

### 5.2 Entity Markdown Documentation ⚠️ MANDATORY

**Every entity MUST have both a JSON schema AND a companion markdown file.** The markdown file provides human-readable documentation that complements the technical schema.

#### Required Sections for Entity Markdown Files

```markdown
# EntityName

## Overview
Brief description of what this entity represents and when it's used.

## Properties

| Property | Type | Required | Constraints | Description |
|----------|------|----------|-------------|-------------|
| `name` | string | Yes | maxLength: 30 | The display name |

## Business Rules & Limits

Document all constraints discovered from source code:
- Maximum items per parent (e.g., "Max 10 resources per resource type")
- Feature flag requirements (e.g., "Requires `pkg.sch.resources` feature")
- Permission requirements (e.g., "Requires `account.settings.manage` permission")
- Validation rules not captured in the schema

## Access Requirements

Document who can access this entity:
- Token types (Staff, Directory, App)
- Required permissions
- Rate limiting if applicable

## Related Entities

Link to related entities with context:
- [ParentEntity](/entities/parent) - Relationship description
- [ChildEntity](/entities/child) - Relationship description

## Example Use Cases

Show practical code examples for common scenarios.

## API Endpoints

Link to relevant API endpoints that use this entity:
- [GET /v3/entity](/reference/get-entity) - Retrieve entities
- [POST /v3/entity](/reference/create-entity) - Create entity
```

#### Example: Well-Documented Entity Markdown

```markdown
# Resource

## Overview
A schedulable resource instance (e.g., room, equipment) belonging to a resource type.
Resources are used in scheduling to ensure physical resources are available when booking appointments.

## Properties

| Property | Type | Required | Constraints | Description |
|----------|------|----------|-------------|-------------|
| `uid` | string | No | Auto-generated | Unique identifier |
| `name` | string | Yes | maxLength: 30 | Display name of the resource |
| `resource_type_uid` | string | Yes | Must exist | Parent resource type |
| `deleted_at` | datetime | No | Nullable | Soft delete timestamp |

## Business Rules & Limits

1. **Maximum Resources**: 10 resources per resource type
2. **Soft Delete**: Resources are soft-deleted (deleted_at timestamp set)
3. **Name Length**: Maximum 30 characters

## Access Requirements

- **Feature Flags**: Both `pkg.sch.resources` AND `resources` must be enabled
- **Permissions**: Create/Update/Delete requires `account.settings.manage`
- **Token Types**: Staff tokens only

## Related Entities

- [ResourceType](/entities/scheduling/resourceType) - Parent category
- [Service](/entities/scheduling/service) - Services that require this resource type

## API Endpoints

- [GET /v3/scheduling/resources](/reference/get-resources)
- [POST /v3/scheduling/resources](/reference/create-resource)
- [PUT /v3/scheduling/resources/{uid}](/reference/update-resource)
- [DELETE /v3/scheduling/resources/{uid}](/reference/delete-resource)
```

#### Keeping Entity Docs in Sync

When updating swagger files, **always check if entity documentation needs updates**:

| If you add to swagger... | Also update in entity markdown... |
|--------------------------|-----------------------------------|
| New validation constraint | Properties table (Constraints column) |
| Rate limiting | Access Requirements section |
| Feature flag check | Business Rules & Limits section |
| New error code | (Consider adding Troubleshooting section) |
| New parameter | Properties table |

---

## 6. Error Documentation Standards

### ⚠️ MANDATORY: Complete Response Code Documentation

**Every endpoint MUST document all possible HTTP response codes.** A swagger file showing only `200` response is incomplete and must be fixed.

#### Minimum Response Codes to Document

| Code | When It Occurs | Must Document |
|------|----------------|---------------|
| **Success (2xx)** | | |
| 200 | GET/PUT/PATCH success | ✅ Always |
| 201 | POST created resource | ✅ When applicable |
| 204 | DELETE success (no body) | ✅ When applicable |
| **Client Errors (4xx)** | | |
| 400 | Missing/invalid parameters | ✅ Always |
| 401 | Authentication failure | ✅ Always |
| 403 | Authorization/permission denied | ✅ When applicable |
| 404 | Resource not found | ✅ Always for endpoints with path params |
| 409 | Conflict (duplicate, etc.) | ✅ When applicable |
| 412 | Precondition failed | ✅ When business rules apply |
| 422 | Validation/business logic error | ✅ Always |
| 429 | Rate limit exceeded | ✅ When rate limiting exists |
| **Server Errors (5xx)** | | |
| 500 | Internal server error | ✅ Always |

#### How to Find Response Codes in Source Code

**Ruby/Rails Controllers:**
```ruby
# Direct status codes:
render json: response, status: 200
render json: response, status: :created  # 201
render json: error, status: :unprocessable_entity  # 422
render json: error, status: :not_found  # 404
render json: error, status: 429

# Base controller rescue_from blocks:
rescue_from ActiveRecord::RecordNotFound  # → 404
rescue_from ActiveRecord::RecordInvalid   # → 422
rescue_from JWT::DecodeError              # → 401
rescue_from Exception                     # → 500

# Explicit validation:
if errors.any?
  return render json: {status: 'Error', error_code: "PARAMETER_MISSING"}, status: 400
end
```

**NestJS Controllers:**
```typescript
// Decorators indicate responses:
@HttpCode(HttpStatus.CREATED)  // 201
@HttpCode(HttpStatus.NO_CONTENT)  // 204

// Exception filters and guards:
@UseGuards(AuthGuard)  // Can throw 401, 403
@UsePipes(ValidationPipe)  // Can throw 400

// Explicit throws:
throw new NotFoundException()  // 404
throw new BadRequestException()  // 400
throw new UnauthorizedException()  // 401
throw new ForbiddenException()  // 403
```

#### Verification Process

1. **Read the controller action** - find all `render`/`return` statements
2. **Check base controller** - find inherited `rescue_from` blocks
3. **Check middleware/guards** - authentication, rate limiting
4. **Check service/component layer** - what exceptions can bubble up
5. **Document ALL found response codes** in swagger

### 6.1 Error Response Schema

Define a consistent error schema:

```json
{
  "ErrorResponse": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["Error"],
        "description": "Always 'Error' for error responses"
      },
      "error": {
        "type": "string",
        "description": "Human-readable error message"
      },
      "error_code": {
        "type": "string",
        "description": "Machine-readable error code for programmatic handling"
      },
      "errors": {
        "type": "object",
        "description": "Field-level validation errors (when applicable)",
        "additionalProperties": {
          "type": "array",
          "items": {"type": "string"}
        }
      },
      "details": {
        "type": "object",
        "description": "Additional context about the error"
      }
    },
    "required": ["status", "error"]
  }
}
```

### 6.2 Error Code Catalog

Create a comprehensive error code reference:

```markdown
# Error Code Reference

## Authentication & Authorization

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token | Include valid Bearer token in Authorization header |
| `TOKEN_EXPIRED` | 401 | Authentication token has expired | Refresh your token or re-authenticate |
| `INSUFFICIENT_PERMISSIONS` | 403 | Token lacks required permissions | Use a token with appropriate scope |
| `RESOURCE_ACCESS_DENIED` | 403 | Cannot access this specific resource | Verify resource belongs to your business/directory |

## Validation Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `PARAMETER_MISSING` | 400 | Required parameter not provided | Include all required parameters |
| `INVALID_FORMAT` | 400 | Parameter format is incorrect | Check parameter format requirements |
| `VALUE_OUT_OF_RANGE` | 400 | Numeric value outside allowed range | Use value within min/max bounds |
| `INVALID_ENUM_VALUE` | 400 | Value not in allowed list | Use one of the documented enum values |

## Business Logic Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `TIMESLOT_UNAVAILABLE` | 422 | Requested time slot is not available | Check availability before booking |
| `CLIENT_ALREADY_EXISTS` | 409 | Client with this email already exists | Use existing client or different email |
| `BOOKING_NOT_CANCELLABLE` | 422 | Booking cannot be cancelled in current state | Check booking status before cancelling |

## Rate Limiting

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry with exponential backoff |
```

### 6.3 Endpoint-Specific Error Documentation

For each endpoint, document specific errors:

```json
{
  "422": {
    "description": "Business logic error - the request was valid but cannot be processed",
    "content": {
      "application/json": {
        "schema": {"$ref": "#/components/schemas/ErrorResponse"},
        "examples": {
          "timeslotUnavailable": {
            "summary": "Time slot no longer available",
            "description": "Another booking was made for this slot, or staff availability changed",
            "value": {
              "status": "Error",
              "error": "Timeslot Unavailable",
              "error_code": "TIMESLOT_UNAVAILABLE",
              "details": {
                "requested_time": "2026-01-15T09:00:00Z",
                "next_available": "2026-01-15T10:00:00Z"
              }
            }
          },
          "pastBooking": {
            "summary": "Cannot book in the past",
            "value": {
              "status": "Error",
              "error": "Cannot create booking for a time in the past",
              "error_code": "INVALID_BOOKING_TIME"
            }
          }
        }
      }
    }
  }
}
```

---

## 7. Code-Documentation Alignment Process

### 7.1 Documentation Sources from Code

Extract documentation from these code locations:

| Source | Information to Extract |
|--------|----------------------|
| Controller actions | Endpoint behavior, response codes |
| `check_required_params` methods | Required parameters |
| Model validations | Field constraints, formats |
| Components modules | Business logic, error conditions |
| `APP_CONFIG` references | Rate limits, feature flags |
| Rescue blocks | Error codes and messages |
| Decorators/Serializers | Response field transformations |
| DTOs (NestJS) | Request/response field definitions |
| Strong parameters | Permitted request fields |

### 7.2 ⚠️ MANDATORY: Field Structure Verification

**Every endpoint MUST have its request and response field structures verified against the actual source code.** Documentation showing incorrect fields, missing fields, or wrong types is worse than no documentation.

#### What to Verify

| Aspect | Check Against | Common Issues |
|--------|--------------|---------------|
| **Request Parameters** | Controller `params`, DTOs | Missing optional params, wrong types |
| **Request Body Fields** | Strong params, DTOs, validators | Missing fields, wrong required status |
| **Response Fields** | Serializers, decorators, render statements | Missing fields, extra fields, wrong nesting |
| **Field Types** | Model definitions, DTOs | string vs integer, date formats |
| **Field Names** | Actual code (snake_case vs camelCase) | Documentation uses wrong naming |
| **Enum Values** | Model constants, validators | Incomplete or wrong enum lists |
| **Nested Objects** | Serializers, includes | Wrong structure, missing nested fields |

#### How to Verify Request Structure

**Ruby/Rails:**
```ruby
# 1. Check strong params in controller:
def booking_params
  params.require(:booking).permit(:service_uid, :staff_uid, :client_uid, :start_time, :notes)
end

# 2. Check check_required_params:
check_required_params(params, [:service_uid, :staff_uid, :start_time])

# 3. Check model validations:
validates :service_uid, presence: true
validates :notes, length: { maximum: 500 }
```

**NestJS:**
```typescript
// 1. Check DTO class:
export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  service_uid: string;
  
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
```

#### How to Verify Response Structure

**Ruby/Rails:**
```ruby
# 1. Check render statement:
render json: { status: 'OK', data: { booking: booking_response } }

# 2. Check decorator/serializer:
class BookingDecorator
  def as_json
    {
      uid: booking.uid,
      service_uid: booking.service_uid,
      start_time: booking.start_time.iso8601,
      # ... all fields
    }
  end
end

# 3. Check DECORATE_FIELDS constant if present:
DECORATE_FIELDS = [:uid, :service_uid, :start_time, :end_time, :status]
```

**NestJS:**
```typescript
// 1. Check response DTO:
export class BookingResponseDto {
  uid: string;
  service_uid: string;
  start_time: string;
  status: BookingStatus;
}
```

#### Field Verification Checklist

For EACH endpoint, complete this checklist:

```markdown
## Field Structure Verification: [METHOD] [PATH]

### Request Parameters (Query/Path)
- [ ] All documented params exist in code
- [ ] No undocumented params in code
- [ ] Types match (string, integer, boolean, etc.)
- [ ] Required/optional status matches
- [ ] Default values are correct
- [ ] Enum values are complete and correct

### Request Body
- [ ] All documented fields exist in code
- [ ] No undocumented fields in code
- [ ] Nested structure matches exactly
- [ ] Field types match
- [ ] Required/optional status matches
- [ ] Validation constraints documented (maxLength, min, max, pattern)

### Response Body
- [ ] All documented fields exist in code
- [ ] No undocumented fields in code
- [ ] Nested structure matches exactly
- [ ] Field types match
- [ ] Nullable fields correctly marked
- [ ] Example values are realistic

### Discrepancies Found
List any differences between documentation and code:
1. [field]: documented as [X], code shows [Y]
```

### 7.3 Validation Checklist

For each endpoint, verify:

- [ ] All path parameters documented
- [ ] All query parameters documented (including optional)
- [ ] All request body fields documented
- [ ] All response fields documented
- [ ] **Request structure matches code exactly** ⚠️
- [ ] **Response structure matches code exactly** ⚠️
- [ ] All error codes from code are documented
- [ ] Rate limits documented (if applicable)
- [ ] Required permissions/token types documented
- [ ] Examples match actual API responses
- [ ] **POST endpoints return 201 (not 200)** when creating resources
- [ ] **@IsOptional() fields are NOT in required array**
- [ ] **@IsNotEmpty() fields ARE in required array**
- [ ] **Feature flag requirements documented** (x-vcita-feature-flags)
- [ ] **Actor type restrictions documented** (check @AllowedActors)
- [ ] **Timeouts documented** (check @Timeout decorators)
- [ ] **Missing endpoints added** (check for undocumented DELETE, etc.)

### 7.4 Automated Validation (Recommended)

Implement validation scripts:

```javascript
// Example: Validate swagger against controller
async function validateEndpoint(swaggerPath, controllerPath) {
  const swagger = await loadSwagger(swaggerPath);
  const controller = await parseController(controllerPath);
  
  const issues = [];
  
  // Check all controller params are documented
  for (const param of controller.requiredParams) {
    if (!swagger.parameters.find(p => p.name === param)) {
      issues.push(`Missing parameter: ${param}`);
    }
  }
  
  // Check all error codes are documented
  for (const errorCode of controller.errorCodes) {
    if (!swagger.responses.find(r => r.examples?.[errorCode])) {
      issues.push(`Missing error code: ${errorCode}`);
    }
  }
  
  return issues;
}
```

---

## 8. AI Agent Optimization

### 8.1 Structured Data for AI Consumption

Include machine-readable metadata:

```json
{
  "x-ai-hints": {
    "category": "scheduling",
    "action": "read",
    "entity": "availability_slot",
    "common_workflows": [
      "booking_flow",
      "rescheduling_flow"
    ],
    "prerequisites": [
      "GET /v3/scheduling/services",
      "GET /v3/scheduling/staff"
    ],
    "next_steps": [
      "POST /v3/scheduling/bookings"
    ]
  }
}
```

### 8.2 Clear Decision Trees

Help AI agents choose the right endpoint:

```markdown
## Endpoint Selection Guide

### "I want to book an appointment"

1. **Do you have the service UID?**
   - No → `GET /v3/scheduling/services` first
   - Yes → Continue

2. **Do you have the client UID?**
   - No → `POST /v3/clients` or `GET /v3/clients?email=...`
   - Yes → Continue

3. **Do you know the desired time?**
   - No → `GET /v3/scheduling/availability_slots`
   - Yes → Continue

4. **Create the booking:**
   → `POST /v3/scheduling/bookings`
```

### 8.3 Semantic Descriptions

Use clear, unambiguous language:

```json
{
  "description": "Creates a new appointment booking. This reserves a time slot for a client with a specific staff member for a particular service. The booking is immediately confirmed unless the business has approval workflows enabled.",
  
  "x-semantic-notes": {
    "creates": "booking",
    "requires": ["service", "staff", "client", "time_slot"],
    "side_effects": [
      "Sends confirmation email to client",
      "Adds to staff calendar",
      "Triggers webhook if configured"
    ]
  }
}
```

---

## 9. Quality Checklist

### 9.1 Per-Endpoint Checklist

```markdown
## Endpoint: POST /v3/scheduling/bookings

### Basic Information
- [ ] Summary is clear and action-oriented
- [ ] Description explains purpose and use cases
- [ ] Tags are appropriate
- [ ] Operation ID is unique and descriptive

### Parameters
- [ ] All path parameters documented
- [ ] All query parameters documented
- [ ] Required vs optional clearly marked
- [ ] Types and formats specified
- [ ] Constraints documented (min, max, pattern)
- [ ] Examples provided for each parameter

### Request Body
- [ ] Schema reference or inline definition
- [ ] All fields documented
- [ ] Required fields marked
- [ ] Multiple examples for different scenarios
- [ ] Validation rules documented

### Responses
- [ ] All possible status codes documented
- [ ] Success response schema defined
- [ ] Error response schemas defined
- [ ] Examples for each response type
- [ ] Error codes documented

### Additional
- [ ] Rate limits documented
- [ ] Authentication requirements clear
- [ ] Related endpoints linked
- [ ] Matches actual implementation
```

### 9.2 Domain-Level Checklist

```markdown
## Domain: Scheduling

- [ ] Overview documentation complete
- [ ] Quick start guide available
- [ ] All endpoints documented
- [ ] Entity schemas complete
- [ ] Error codes cataloged
- [ ] Common workflows documented
- [ ] Troubleshooting guide available
- [ ] Code examples in multiple languages
```

---

## 10. Examples from Industry Leaders

### 10.1 Stripe - What They Do Well

**Error Documentation:**
- Every error has a unique code
- Detailed explanation of why it occurs
- Specific steps to resolve
- Related documentation links

**Example:**
```json
{
  "error": {
    "code": "card_declined",
    "decline_code": "insufficient_funds",
    "message": "Your card has insufficient funds.",
    "param": "card_number",
    "type": "card_error",
    "doc_url": "https://stripe.com/docs/error-codes/card-declined"
  }
}
```

### 10.2 Twilio - What They Do Well

**Interactive Examples:**
- Code samples in 7+ languages
- Copy-paste ready
- "Try it" buttons in documentation
- Response previews

### 10.3 GitHub - What They Do Well

**Comprehensive Guides:**
- Conceptual overviews before API reference
- Step-by-step tutorials
- Best practices sections
- Migration guides

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Establish error code catalog from codebase
- [ ] Create documentation templates
- [ ] Set up validation tooling
- [ ] Document 5 critical endpoints as reference

### Phase 2: High-Priority Endpoints (Weeks 3-6)
- [ ] Scheduling domain (highest usage)
- [ ] Clients domain
- [ ] Communication domain
- [ ] Validate against code

### Phase 3: Complete Coverage (Weeks 7-10)
- [ ] Remaining domains
- [ ] Entity documentation
- [ ] Cross-reference all endpoints
- [ ] Create workflow guides

### Phase 4: Enhancement (Weeks 11-12)
- [ ] Multi-language code examples
- [ ] Interactive testing
- [ ] AI optimization metadata
- [ ] Feedback integration

### Phase 5: Maintenance (Ongoing)
- [ ] Automated validation in CI/CD
- [ ] Documentation review in PR process
- [ ] Quarterly audits
- [ ] User feedback integration

---

## Appendix A: OpenAPI Extension Conventions

Use these custom extensions consistently:

| Extension | Purpose | Example |
|-----------|---------|---------|
| `x-vcita-rate-limiting` | Rate limiting info | `{"requests_per_minute": 30, "scope": "per_business"}` |
| `x-vcita-feature-flags` | Required feature flags | `{"required": ["pkg.sch.resources", "resources"]}` |
| `x-vcita-limits` | Business limits | `{"max_per_business": 5, "max_per_type": 10}` |
| `x-vcita-timeout` | Request timeout | `"30 seconds"` |
| `x-vcita-performance-notes` | Performance warnings | `"May be slow due to v1 API dependency"` |
| `x-vcita-validation` | Custom validation | `{"date_range_max_days": 7}` |
| `x-vcita-access` | Access restrictions | `{"actor_types": ["Directory"], "permissions": ["account.settings.manage"]}` |
| `x-vcita-business-rules` | Business logic notes | Array of rule strings |
| `x-ai-hints` | AI agent metadata | See Section 8.1 |
| `x-deprecation` | Deprecation details | `{"date": "2026-06-01", "replacement": "/v4/..."}` |

> **Note:** We standardized on the `x-vcita-*` prefix for all custom extensions during the documentation enhancement project. See Section 14 for detailed usage guidelines.

---

## Appendix B: Response Format Standards

### Success Response (Single Entity)
```json
{
  "success": true,
  "data": {
    "uid": "...",
    "...": "..."
  }
}
```

### Success Response (Collection)
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### Error Response
```json
{
  "status": "Error",
  "error": "Human readable message",
  "error_code": "MACHINE_READABLE_CODE",
  "errors": {
    "field_name": ["Validation message"]
  },
  "details": {}
}
```

---

## Appendix C: Recommended Tools

| Tool | Purpose |
|------|---------|
| **Spectral** | OpenAPI linting and validation |
| **Redocly** | API documentation generation |
| **Postman** | API testing and examples |
| **ReadMe.io** | Documentation hosting (current) |
| **Prism** | Mock server from OpenAPI |

---

## 12. Lessons Learned

This section captures key insights from the comprehensive documentation enhancement project.

### 12.1 Critical Safety Rules

**Never Document Without Source Code Access**

> ⚠️ **CRITICAL**: If you cannot find the source code for an API, DO NOT make documentation changes. Instead, document the blocked API and request codebase access.

During our project, we discovered that many v3 APIs are implemented in separate microservices (not in the main `core` project). Attempting to document these without source code verification would have introduced inaccuracies.

**Cost of Mistakes vs. Missing Information**

> The cost of documenting incorrect information is MUCH higher than the cost of missing information.

- Incorrect documentation leads to integration failures and support burden
- Missing documentation is obvious; incorrect documentation is insidious
- When uncertain, mark as "needs verification" rather than guessing

### 12.2 Multi-Codebase API Architecture

Our platform uses a distributed architecture where APIs are routed through an API Gateway to different microservices:

| API Path Prefix | Service | Technology |
|-----------------|---------|------------|
| `/platform/v1/*` | core | Ruby on Rails |
| `/v3/scheduling/resource_types`, `/v3/scheduling/resources` | resources | NestJS |
| `/v3/scheduling/business_availabilities`, `/v3/scheduling/availability_slots` | availability | NestJS |
| `/v3/communication/voice_calls/*` | voicecalls | NestJS |
| `/v3/communication/business_phone_numbers/*` | phonenumbersmanager | NestJS |
| `/v3/communication/notification_templates/*` | notificationscenter | NestJS |
| `/business/communication/*` | communication-gw | NestJS |
| `/v3/payment_processing/*` | payments | NestJS |
| `/v3/license/*`, `/v3/subscriptions/*` | subscriptionsmng | NestJS |
| `/v3/access_control/*` | permissionsmanager | NestJS |

**Best Practice**: Always check `apigw/src/config/conf.yaml` to identify which microservice handles each API path before attempting to document it.

### 12.3 Framework-Specific Patterns

#### Ruby on Rails (core project)

**Finding Response Fields:**
```ruby
# 1. Check DECORATE_FIELDS constants in API components:
DECORATE_FIELDS = [:uid, :service_uid, :start_time, :end_time, :status]

# 2. Check decorator classes:
class AppointmentDecorator
  def api_json(options = {})
    # This defines the actual response structure
  end
end

# 3. Check INDEX_RETURN_FIELDS for list endpoints:
INDEX_RETURN_FIELDS = [:uid, :title, :start_time, :end_time]
```

**Finding Error Codes:**
```ruby
# 1. Check base controller rescue_from blocks:
rescue_from ActiveRecord::RecordNotFound, with: :render_not_found  # 404
rescue_from ActiveRecord::RecordInvalid, with: :render_invalid     # 422
rescue_from ::Components::Infra::RateLimitReached, with: :render_rate_limit  # 429

# 2. Check explicit error renders in controller actions:
render json: {status: 'Error', error_code: "PARAMETER_MISSING"}, status: 400
render json: {status: 'Error', error_code: "BOOKING_VIOLATION"}, status: 412
```

#### NestJS (microservices)

**Finding Required/Optional Fields:**
```typescript
// Check DTO decorators - @IsOptional() means NOT required:
export class CreateResourceDto {
  @IsNotEmpty()  // REQUIRED
  name: string;
  
  @IsOptional()  // NOT REQUIRED
  description?: string;
}
```

**Finding Response Codes:**
```typescript
// 1. Check @HttpCode decorators:
@Post()
@HttpCode(HttpStatus.CREATED)  // Returns 201, not 200

// 2. Check explicit exceptions:
throw new NotFoundException()      // 404
throw new BadRequestException()    // 400
throw new ForbiddenException()     // 403

// 3. Check guards and interceptors:
@UseGuards(FeatureFlagsGuard)  // Can throw 403 if feature disabled
@AllowedActors([ActorType.STAFF])  // Can throw 403 for wrong actor
```

### 12.4 Common Documentation Mistakes Found

| Mistake | Example | Fix |
|---------|---------|-----|
| Wrong response code for POST | POST returning 200 | Change to 201 Created |
| Missing optional parameters | `@IsOptional()` field marked required | Remove from `required` array |
| Wrong field names | `payment_uid` vs `payment_id` | Match actual code exactly |
| Incomplete enum values | Status missing values | Check model/constant definitions |
| Missing error responses | Only 200 documented | Add all error codes from code |
| Extra fields in examples | Fields not returned by decorator | Remove non-existent fields |
| Missing DELETE endpoints | Endpoint exists but not documented | Add the endpoint |
| Wrong allowed actors | Missing STAFF from allowed list | Verify @AllowedActors decorator |
| Missing 403 for feature flags | Feature flag check not documented | Add 403 with feature flag note |
| Missing 500 error | Server error not documented | Always add 500 Internal Server Error |

### 12.5 Specific Discrepancies Fixed During Project

These are real examples from our documentation enhancement project:

#### Phase 1 (Scheduling)
- **appointment.json**: Field names `payment_uid`, `series_uid`, `service_uid`, `staff_uid` should be `payment_id`, `series_id`, `service_id`, `staff_id`
- **appointment.json**: State enum was missing values - added `scheduled`, `cancelled`, `done`, `rejected`, `pending_reschedule`, `reschedule`
- **GET /services**: Response example missing 18 fields including `display_missing_error`, `business_enabled`, `meeting_interaction_details`, etc.
- **GET /scheduling/staff**: Response had `deleted` and `professional_title` but code uses `title` and no `deleted` field

#### Phase 2 (Clients)
- **DELETE /clients/{id}**: Response example had extra fields not returned by code (`channel`, `campaign`, `matter_term`, etc.)
- **GET /clients**: Missing `phone_exists` query parameter

#### Phase 3 (Communication)
- **voice_call_settings DTOs**: All fields marked required but code has `@IsOptional()` on all
- **CreateMessageDto**: `external_uid` marked required but code has `@IsOptional()`
- **business_phone_numbers**: `features` parameter marked optional but code has `@IsNotEmpty()`
- **voiceCall.md**: Status enum values were lowercase but JSON schema uses UPPERCASE

#### Phase 4 (Sales)
- **GET /payment_gateways**: Missing STAFF from allowed actors list

#### Phase 5 (Platform Administration)
- **POST /business_roles**: Response code was 200 but code returns 201
- **POST /staff_business_roles**: Response code was 200 but code returns 201
- **DELETE /staff_business_roles/{staff_uid}**: Endpoint completely missing from documentation
- **Multiple endpoints**: Missing 403 response for feature flag `staff_role_permissions` checks

### 12.5 Verification Process That Works

**Step-by-Step for Each Endpoint:**

1. **Identify Source Code Location**
   - Check API gateway config for routing
   - Navigate to correct microservice
   - Find controller file

2. **Verify Request Structure**
   - Check controller method signature
   - Check DTO class for field decorators
   - Check strong params (Rails) or validation pipes (NestJS)
   - Document ALL fields, marking required/optional correctly

3. **Verify Response Structure**
   - Find render/return statement
   - Trace to decorator/serializer/DTO
   - Document ALL fields returned
   - Verify example matches actual output

4. **Verify Error Responses**
   - Check base controller error handling
   - Check explicit error throws in controller
   - Check guards and interceptors
   - Check service layer exceptions
   - Document ALL possible error codes

5. **Verify Business Rules**
   - Check for feature flag guards
   - Check for permission requirements
   - Check for rate limiting
   - Check for validation constraints (maxLength, min, max)
   - Document in x-vcita extensions

---

## 13. Microservices Architecture Considerations

### 13.1 API Gateway as Source of Truth for Routing

The `apigw/src/config/conf.yaml` file is the authoritative source for understanding which microservice handles each API path. Always consult this file before starting documentation work.

**Example routing configuration:**
```yaml
- url: "${RESOURCES_HOST}"
  path: [ "/v3/scheduling/resource_types", "/v3/scheduling/resources" ]
- url: "${AVAILABILITY_HOST}"
  path: [ "/v3/scheduling/business_availabilities", "/v3/scheduling/availability_slots" ]
- url: "${CORE_HOST}"
  path:
  - "/platform/v1/"
  - "/v3/scheduling/resource_bookings"
```

### 13.2 Handling Multiple Codebases

When documenting APIs across multiple microservices:

1. **Create a codebase access tracking file** (e.g., `NEEDS_CODEBASE_ACCESS.md`)
2. **Group endpoints by required codebase** for efficient verification
3. **Request all needed codebases upfront** for a phase to avoid context switching
4. **Document service-specific patterns** (each NestJS service may have slightly different conventions)

### 13.3 Service-Specific Error Handling

Each microservice may have its own error handling patterns:

| Service | Common Error Patterns |
|---------|----------------------|
| **core (Rails)** | `rescue_from` in base controller, explicit `render json: {status: 'Error'}` |
| **NestJS services** | Exception filters, guards, validation pipes |
| **availability** | Redis lock for rate limiting (429), timeout handling (504) |
| **resources** | Feature flag checks (403), limit checks (422) |
| **permissionsmanager** | Feature flag + permission checks (403) |

---

## 14. Custom OpenAPI Extensions (x-vcita)

We use custom OpenAPI extensions to document information not covered by the standard specification.

### 14.1 Extension Reference

| Extension | Purpose | Example Value |
|-----------|---------|---------------|
| `x-vcita-rate-limiting` | Rate limit configuration | `{"requests_per_minute": 30}` |
| `x-vcita-feature-flags` | Required feature flags | `["pkg.sch.resources", "resources"]` |
| `x-vcita-limits` | Business limits | `{"max_per_business": 5, "max_per_type": 10}` |
| `x-vcita-timeout` | Request timeout | `"30 seconds"` |
| `x-vcita-performance-notes` | Performance considerations | `"May be slow due to v1 API dependency"` |
| `x-vcita-validation` | Custom validation rules | `{"date_range_max_days": 7}` |
| `x-vcita-access` | Access restrictions | `{"actor_types": ["Directory"], "permissions": ["account.settings.manage"]}` |
| `x-vcita-business-rules` | Business logic rules | Array of rule descriptions |

### 14.2 When to Use Each Extension

**x-vcita-rate-limiting:**
```json
{
  "x-vcita-rate-limiting": {
    "requests_per_minute": 30,
    "scope": "per_business"
  }
}
```
Use when: Controller has rate limiting checks (e.g., `within_rate_limit?`, Redis locks)

**x-vcita-feature-flags:**
```json
{
  "x-vcita-feature-flags": {
    "required": ["pkg.sch.resources", "resources"],
    "note": "Both flags must be enabled"
  }
}
```
Use when: Controller has `@FeatureFlagsInterceptor` or feature flag checks

**x-vcita-limits:**
```json
{
  "x-vcita-limits": {
    "max_resource_types_per_business": 5,
    "max_resources_per_type": 10
  }
}
```
Use when: Code enforces maximum counts (check constants files)

**x-vcita-timeout:**
```json
{
  "x-vcita-timeout": "30 seconds"
}
```
Use when: Controller has `@Timeout()` decorator or explicit timeout handling

**x-vcita-access:**
```json
{
  "x-vcita-access": {
    "actor_types": ["STAFF", "DIRECTORY"],
    "permissions": ["account.settings.manage"],
    "note": "Directory actors have read-only access"
  }
}
```
Use when: Controller has `@AllowedActors`, `@RequirePermissions`, or `@AuthorizeFor` decorators

### 14.3 Placement of Extensions

- **Endpoint-level extensions**: Place in the operation object (same level as `summary`, `responses`)
- **Schema-level extensions**: Place in the schema object (same level as `properties`, `required`)
- **Entity-level extensions**: Place at the root of entity JSON schema files

---

## 15. Documentation Maintenance

### 15.1 When Code Changes

Whenever API code changes, documentation must be updated:

| Code Change | Documentation Update Required |
|-------------|-------------------------------|
| New endpoint added | Add to swagger file |
| Endpoint removed | Remove from swagger (or mark deprecated) |
| New parameter added | Add to parameters section |
| Parameter removed | Remove from parameters |
| Parameter becomes required | Update `required` array |
| Response field added | Update response schema and example |
| Response field removed | Update response schema and example |
| New error condition | Add error response |
| Rate limit changed | Update x-vcita-rate-limiting |
| Feature flag added | Add x-vcita-feature-flags |
| Permission changed | Update x-vcita-access |

### 15.2 Validation Before Publishing

Before publishing documentation updates:

1. **Run OpenAPI linter** (Spectral) to catch syntax errors
2. **Spot-check 3-5 endpoints** against source code
3. **Verify all error codes** are documented
4. **Check entity consistency** between swagger and entity files
5. **Review x-vcita extensions** for accuracy

### 15.3 Tracking Documentation Status

Maintain a phase tracking document (`PHASE_TRACKING.md`) with:

- Endpoint-by-endpoint status
- Entity documentation status
- Verification completion status
- Any blocked items requiring codebase access

---

*This document should be reviewed and updated quarterly to incorporate lessons learned and evolving best practices.*

---

## Appendix D: Quick Reference Card

### Minimum Response Codes (Always Document)

```
✅ 200/201 - Success
✅ 400 - Bad Request (validation)
✅ 401 - Unauthorized
✅ 404 - Not Found (for path params)
✅ 422 - Unprocessable Entity
✅ 500 - Internal Server Error
```

### Additional Response Codes (When Applicable)

```
⚡ 403 - Forbidden (feature flags, permissions)
⚡ 409 - Conflict (duplicates)
⚡ 412 - Precondition Failed (business rules)
⚡ 429 - Rate Limited
⚡ 504 - Gateway Timeout
```

### NestJS Decorator → Response Code Mapping

```
@HttpCode(HttpStatus.CREATED) → 201
@HttpCode(HttpStatus.NO_CONTENT) → 204
throw new NotFoundException() → 404
throw new BadRequestException() → 400
throw new ForbiddenException() → 403
throw new UnauthorizedException() → 401
@UseGuards(FeatureFlagsGuard) → 403 possible
@AllowedActors([...]) → 403 possible
ValidationPipe → 400 possible
```

### Rails Pattern → Response Code Mapping

```
render status: :created → 201
render status: :no_content → 204
rescue_from ActiveRecord::RecordNotFound → 404
rescue_from ActiveRecord::RecordInvalid → 422
rescue_from RateLimitReached → 429
render status: 400 → 400
render status: 403 → 403
render status: 412 → 412
```
