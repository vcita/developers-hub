# Documentation Enhancement Template

**Instructions:** Use this template as a reference for how to enhance endpoint documentation. All enhancements must be verified against source code.

---

## 1. Summary Enhancement

### Format
```
[Action Verb] [Object] [Optional Context]
```

### Rules
- Maximum 80 characters
- Start with action verb (Get, Create, Update, Delete, Retrieve, List)
- Be specific about what the endpoint does
- Do NOT start with "This endpoint..."

### Examples

**Good:**
- `Retrieve availability slots for scheduling`
- `Create a new booking for a service`
- `Update AI settings for a staff member`
- `Delete a resource type by UID`

**Bad:**
- `Get slots` (too vague)
- `This endpoint retrieves...` (wrong format)
- `Booking creation endpoint` (not action-oriented)

---

## 2. Description Enhancement

### Structure

```markdown
## Overview
[2-3 sentences explaining what this endpoint does and its primary purpose]

## When to Use
- [Use case 1]
- [Use case 2]
- [Use case 3]

## Prerequisites
- [Required setup, tokens, or prior API calls]

## Important Notes
- [Key business rules or constraints]
- [Rate limits if applicable]
- [Any gotchas or common mistakes]
```

### Example

```markdown
## Overview
Retrieves available time slots for booking appointments or events. Returns slots where at least one of the specified staff members or resources is available within the requested time range.

## When to Use
- Building a booking calendar UI for clients
- Checking staff availability before creating appointments
- Finding alternative times when a preferred slot is unavailable

## Prerequisites
- Valid Staff token with scheduling permissions
- At least one of: `resource_type_uids`, `resource_uids`, or `staff_uids` must be provided

## Important Notes
- Slots are returned in the business's configured timezone
- Past times are never returned, even if requested
- Rate limited to 100 requests per minute per business
```

---

## 3. Parameter Enhancement

### Required Fields

```json
{
  "name": "parameter_name",
  "in": "query|path|header",
  "required": true|false,
  "description": "Clear description. Include validation rules if any. Mention default value if applicable.",
  "schema": {
    "type": "string|integer|boolean|array|object",
    "format": "date-time|uuid|email|uri (if applicable)",
    "enum": ["value1", "value2"] ,
    "minimum": 1,
    "maximum": 100,
    "minLength": 1,
    "maxLength": 255,
    "pattern": "regex pattern",
    "default": "default value"
  },
  "example": "realistic_example_value"
}
```

### Description Guidelines

1. **Start with what it is:** "The unique identifier of..."
2. **Add constraints:** "Must be a valid UUID"
3. **Add behavior notes:** "If not provided, defaults to..."
4. **Add validation:** "Must be between 1 and 100"

### Examples

**Path Parameter:**
```json
{
  "name": "uid",
  "in": "path",
  "required": true,
  "description": "The unique identifier (UID) of the resource to retrieve. Must be a valid UID format.",
  "schema": {
    "type": "string"
  },
  "example": "res_abc123xyz"
}
```

**Query Parameter with Constraints:**
```json
{
  "name": "per_page",
  "in": "query",
  "required": false,
  "description": "Number of results to return per page. If not provided, defaults to 20.",
  "schema": {
    "type": "integer",
    "minimum": 1,
    "maximum": 100,
    "default": 20
  },
  "example": 50
}
```

**Query Parameter with Enum:**
```json
{
  "name": "status",
  "in": "query",
  "required": false,
  "description": "Filter results by status. If not provided, returns all statuses.",
  "schema": {
    "type": "string",
    "enum": ["active", "pending", "completed", "cancelled"]
  },
  "example": "active"
}
```

---

## 4. Request Body Enhancement

### Structure

```json
{
  "requestBody": {
    "required": true,
    "description": "Brief description of what this request body represents and any important notes.",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/SchemaName"
        },
        "examples": {
          "basic": {
            "summary": "Basic request with required fields only",
            "description": "Minimal request to create/update the resource",
            "value": {
              "field1": "value1",
              "field2": "value2"
            }
          },
          "complete": {
            "summary": "Complete request with all fields",
            "description": "Full request showing all available options",
            "value": {
              "field1": "value1",
              "field2": "value2",
              "optional_field": "value3"
            }
          }
        }
      }
    }
  }
}
```

### Example Guidelines

1. **Provide at least 2 examples:** Basic (required fields only) and Complete (all fields)
2. **Use realistic values:** Not "string" or "example"
3. **Match the schema:** Examples must validate against the schema
4. **Add summaries:** Brief description of what each example demonstrates

---

## 5. Response Enhancement

### Success Response

```json
{
  "200": {
    "description": "Clear description of when this response is returned",
    "content": {
      "application/json": {
        "schema": {
          "allOf": [
            { "$ref": "https://vcita.github.io/developers-hub/entities/response.json" },
            {
              "properties": {
                "data": {
                  "$ref": "#/components/schemas/ResponseDataSchema"
                }
              }
            }
          ]
        },
        "examples": {
          "success": {
            "summary": "Successful response",
            "value": {
              "success": true,
              "data": {
                "uid": "abc123",
                "field": "value"
              }
            }
          },
          "emptyResult": {
            "summary": "No results found",
            "description": "When the query returns no matching items",
            "value": {
              "success": true,
              "data": {
                "items": []
              }
            }
          }
        }
      }
    }
  }
}
```

### Error Response

```json
{
  "400": {
    "description": "Bad Request - Invalid parameters or malformed request",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/ErrorResponse"
        },
        "examples": {
          "missingParameter": {
            "summary": "Missing required parameter",
            "value": {
              "status": "Error",
              "error": "Mandatory parameter start_time is missing",
              "error_code": "PARAMETER_MISSING"
            }
          },
          "invalidFormat": {
            "summary": "Invalid parameter format",
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
```

---

## 6. Error Code Documentation

### Standard Error Response Schema

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
          "items": { "type": "string" }
        }
      }
    },
    "required": ["status", "error"]
  }
}
```

### Common Error Codes (verify against source code)

| Code | HTTP Status | Typical Usage |
|------|-------------|---------------|
| `PARAMETER_MISSING` | 400 | Required parameter not provided |
| `INVALID_FORMAT` | 400 | Parameter format is incorrect |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

**⚠️ IMPORTANT:** Only document error codes that are verified in the source code!

---

## 7. NEEDS_VERIFICATION Marker

When information cannot be verified against source code, use this marker:

### In Description

```json
{
  "description": "NEEDS_VERIFICATION: [specific question]. [Current documented behavior]."
}
```

### As Extension

```json
{
  "x-needs-verification": {
    "reason": "Source code not found for this validation rule",
    "question": "What is the maximum length for this field?",
    "source_needed": "Model validation in core project"
  }
}
```

### Example

```json
{
  "name": "custom_field",
  "description": "NEEDS_VERIFICATION: What are the validation rules for this field? Currently documented as accepting any string value.",
  "schema": {
    "type": "string"
  },
  "x-needs-verification": {
    "reason": "Validation logic not found in controller",
    "question": "Are there length limits or format requirements?",
    "source_needed": "Model validations in core/app/models/"
  }
}
```

---

## 8. Complete Endpoint Example

```json
{
  "/v3/scheduling/availability_slots": {
    "get": {
      "tags": ["Availability Slots"],
      "summary": "Retrieve availability slots for scheduling",
      "description": "## Overview\nRetrieves available time slots for booking appointments or events.\n\n## When to Use\n- Building a booking calendar UI\n- Checking availability before creating a booking\n\n## Prerequisites\n- Valid Staff token\n- At least one of: resource_type_uids, resource_uids, or staff_uids\n\n## Important Notes\n- Rate limited to 100 requests per minute",
      "operationId": "getAvailabilitySlots",
      "security": [{ "Bearer": [] }],
      "parameters": [
        {
          "name": "start_time",
          "in": "query",
          "required": true,
          "description": "Start of the time range to search. Must be in ISO 8601 format.",
          "schema": {
            "type": "string",
            "format": "date-time"
          },
          "example": "2026-01-15T09:00:00Z"
        },
        {
          "name": "end_time",
          "in": "query",
          "required": true,
          "description": "End of the time range to search. Must be in ISO 8601 format.",
          "schema": {
            "type": "string",
            "format": "date-time"
          },
          "example": "2026-01-15T18:00:00Z"
        }
      ],
      "responses": {
        "200": {
          "description": "Availability slots retrieved successfully",
          "content": {
            "application/json": {
              "examples": {
                "withSlots": {
                  "summary": "Slots found",
                  "value": {
                    "success": true,
                    "data": {
                      "availability_slots": [
                        {
                          "start": "2026-01-15T09:00:00Z",
                          "end": "2026-01-15T10:00:00Z",
                          "available_entities": [
                            { "entity_uid": "stf_123", "entity_type": "staff" }
                          ]
                        }
                      ]
                    }
                  }
                },
                "noSlots": {
                  "summary": "No availability",
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
              "examples": {
                "missingParam": {
                  "summary": "Missing required parameter",
                  "value": {
                    "status": "Error",
                    "error": "Mandatory parameter start_time is missing",
                    "error_code": "PARAMETER_MISSING"
                  }
                }
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

## Checklist Before Submitting

- [ ] Summary follows format guidelines
- [ ] Description includes Overview, When to Use, Prerequisites
- [ ] All parameters have descriptions and examples
- [ ] All responses have examples
- [ ] Error codes are verified against source code
- [ ] NEEDS_VERIFICATION markers added for uncertain items
- [ ] JSON syntax is valid
- [ ] Validation checklist is completed
