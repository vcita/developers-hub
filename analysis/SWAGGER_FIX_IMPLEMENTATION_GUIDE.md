# Legacy Swagger Documentation - Implementation Guide

**Date:** January 19, 2025  
**Status:** Ready for Implementation  
**Total Work Estimated:** 40 hours  
**Priority:** HIGH

---

## Executive Summary

This guide provides a phased approach to fixing the 75+ issues identified across 220+ endpoints in the legacy Swagger documentation. The work is organized by priority and impact to ensure critical issues are addressed first.

---

## Phase 1: Critical Fixes (Week 1) - 8 hours

### 🔴 Priority 1A: OAuth Authentication (2 hours)

**File:** `/swagger/platform_administration/legacy/oauth.json`

**Issues:**
1. `POST /oauth/token` missing JWT authentication parameters
2. `GET /oauth/userinfo` missing Authorization header
3. Missing comprehensive error responses

**Actions:**
```json
// Add to POST /oauth/token parameters:
{
  "name": "client_assertion",
  "in": "body",
  "description": "JWT token for private_key_jwt authentication (RFC 7523)",
  "required": false,
  "type": "string"
},
{
  "name": "client_assertion_type",
  "in": "body",
  "description": "Must be 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'",
  "required": false,
  "type": "string"
},
{
  "name": "scope",
  "in": "body",
  "description": "OAuth scope (optional)",
  "required": false,
  "type": "string"
}

// Add error responses:
"400": {
  "description": "Bad Request",
  "schema": {
    "type": "object",
    "properties": {
      "error": {
        "type": "string",
        "enum": ["invalid_client", "invalid_grant", "invalid_request", "invalid_token", "unsupported_grant_type"]
      },
      "error_description": {
        "type": "string"
      }
    }
  }
}
```

**Verification:**
- Test with actual JWT authentication
- Verify error responses match implementation

---

### 🔴 Priority 1B: Service Token Response (1 hour)

**File:** `/swagger/apps/legacy/legacy_token.json`

**Issue:** Wrong response structure for `POST /oauth/service/token`

**Actions:**
```json
// Current (WRONG):
{
  "access_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer"
}

// Should be:
{
  "success": true,
  "data": {
    "token": "...",
    "expires_in": 3600
  }
}

// Also remove created_at field from example
```

**Reference:** `core/lib/components/platform/tokens_api.rb:create_or_get_service_token`

---

### 🔴 Priority 1C: Rate Limiting Documentation (3 hours)

**Files:**
- `/swagger/clients/legacy/legacy_v1_clients.json`
- `/swagger/platform_administration/legacy/legacy_v1_platform.json`

**Endpoints Missing 429 Response:**
1. `GET /platform/v1/clients`
2. `GET /platform/v1/clients/{client_id}`
3. `GET /platform/v1/businesses/{business_id}/staffs`

**Actions:**
Add to all affected endpoints:
```json
"429": {
  "description": "Too Many Requests - Rate limit exceeded",
  "schema": {
    "type": "object",
    "properties": {
      "error": {
        "type": "string",
        "example": "Too many requests"
      }
    }
  },
  "headers": {
    "Retry-After": {
      "type": "integer",
      "description": "Seconds to wait before retrying"
    }
  }
}
```

**Rate Limits:**
- `GET /clients`: 100 requests per minute per business
- `GET /clients/{id}`: 200 requests per minute per business
- `GET /businesses/{id}/staffs`: 100 requests per minute

---

### 🔴 Priority 1D: Translation Keys (2 hours)

**File:** `/swagger/communication/legacy/legacy_v1_communication.json`

**Issue:** `POST /numbers/twilio` has translation keys instead of actual text

**Actions:**
```json
// Replace:
"description": "translation missing: en.messaging-api.twilio.index.post.descriptionn"
"summary": "translation missing: en.messaging-api.twilio.index.post.titlee"

// With:
"description": "Configure Twilio messaging number for business account"
"summary": "Configure Twilio Number"
```

---

## Phase 2: Missing Parameters (Week 2) - 12 hours

### 🟡 Priority 2A: Client Endpoints (3 hours)

**File:** `/swagger/clients/legacy/legacy_v1_clients.json`

**Missing Parameters:**

#### `GET /platform/v1/clients`
```json
{
  "name": "phone_exists",
  "in": "query",
  "description": "Filter clients by phone number existence (true/false)",
  "required": false,
  "type": "boolean"
}
```

**Verification:** Check `Platform::V1::ClientsController#index` line 17

---

### 🟡 Priority 2B: Business Settings (2 hours)

**File:** `/swagger/platform_administration/legacy/legacy_v1_platform.json`

**Missing Required Parameter:**

#### `GET /platform/v1/businesses/{id}/settings`
```json
{
  "name": "scope",
  "in": "query",
  "description": "Settings scope to retrieve",
  "required": true,
  "type": "string",
  "enum": ["app", "business", "staff"]
}
```

**Verification:** Check controller to confirm it's required

---

### 🟡 Priority 2C: Apps Endpoints (4 hours)

**File:** `/swagger/apps/legacy/legacy_v1_apps.json`

**Missing Parameters:**

#### `POST /platform/v1/apps`
```json
{
  "name": "client_auth_jwks_uri",
  "in": "body",
  "description": "JWKS URI for JWT client authentication",
  "required": false,
  "type": "string"
},
{
  "name": "access_token_format",
  "in": "body",
  "description": "Format of access token (jwt or opaque)",
  "required": false,
  "type": "string",
  "enum": ["jwt", "opaque"]
}
```

#### `PUT /platform/v1/apps/{id}`
Same parameters as POST

---

### 🟡 Priority 2D: Staffs Parameters (3 hours)

**File:** `/swagger/platform_administration/legacy/legacy_v1_platform.json`

**Missing Parameter:**

#### `GET /platform/v1/businesses/{business_id}/staffs`
```json
{
  "name": "status",
  "in": "query",
  "description": "Filter by staff status",
  "required": false,
  "type": "string",
  "enum": ["active", "inactive", "all"]
}
```

---

## Phase 3: Status Code Fixes (Week 3) - 8 hours

### 🟡 Priority 3A: GET Endpoints Returning 201

**Files:**
- `/swagger/clients/legacy/legacy_v1_clients.json`
- `/swagger/platform_administration/legacy/legacy_v1_platform.json`

**Endpoints to Fix:**
1. `GET /platform/v1/clients/{client_id}/invoices`
2. `GET /platform/v1/clients/{client_id}/payments`
3. `GET /platform/v1/businesses`

**Action:** Change response status from 201 to 200

**Verification:**
- Test each endpoint to confirm actual status code
- Some may be intentionally 201 - verify before changing

---

### 🟡 Priority 3B: Integration Mapping Fixes

**Issue:** Some endpoints have response defined as 201 but integration mapping expects 200

**Action:** Align integration mappings with actual API behavior

Example:
```json
"responses": {
  "200": {  // Changed from 201
    "description": "Success",
    ...
  }
},
"x-amazon-apigateway-integration": {
  "responses": {
    "default": {
      "statusCode": "200"  // Now matches
    }
  }
}
```

---

## Phase 4: Error Documentation (Month 2) - 12 hours

### 🟢 Priority 4A: Standard Error Responses

**Create reusable error schemas:**

```json
// Add to components/schemas or definitions:
"Error422": {
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "example": "Error"
    },
    "error": {
      "type": "string",
      "description": "Error message"
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "message": {"type": "string"},
          "code": {"type": "string"},
          "field": {"type": "string"}
        }
      }
    }
  }
},
"Error500": {
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "example": "Error"
    },
    "error": {
      "type": "string",
      "description": "Internal server error message"
    }
  }
}
```

---

### 🟢 Priority 4B: Apply to All Endpoints

**Add to all POST/PUT/DELETE endpoints:**
```json
"422": {
  "description": "Unprocessable Entity - Validation errors",
  "$ref": "#/definitions/Error422"
},
"500": {
  "description": "Internal Server Error",
  "$ref": "#/definitions/Error500"
}
```

---

## Testing & Verification

### Automated Testing Script

Create `test_swagger_accuracy.rb`:

```ruby
# Test that swagger matches actual API responses

require 'json'
require 'net/http'

swagger_file = ARGV[0]
swagger = JSON.parse(File.read(swagger_file))

errors = []

swagger['paths'].each do |path, methods|
  methods.each do |method, spec|
    next unless ['get', 'post', 'put', 'delete'].include?(method)
    
    # TODO: Make actual API call
    # TODO: Compare response structure with swagger
    # TODO: Verify status codes
    # TODO: Check parameters are accepted
  end
end

if errors.any?
  puts "Found #{errors.count} discrepancies:"
  errors.each { |e| puts "  - #{e}" }
  exit 1
else
  puts "All checks passed!"
end
```

---

## Monitoring & Prevention

### 1. Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for translation keys in swagger files
if git diff --cached --name-only | grep 'swagger.*\.json$' | xargs grep -l 'translation missing'; then
  echo "Error: Found translation keys in swagger files"
  exit 1
fi

# Validate JSON
for file in $(git diff --cached --name-only | grep 'swagger.*\.json$'); do
  if ! jq empty "$file" 2>/dev/null; then
    echo "Error: Invalid JSON in $file"
    exit 1
  fi
done
```

### 2. CI/CD Integration

Add to `.github/workflows/swagger-validation.yml`:

```yaml
name: Validate Swagger

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Swagger files
        run: |
          npm install -g @apidevtools/swagger-cli
          find swagger -name '*.json' -exec swagger-cli validate {} \;
```

---

## Documentation Updates

After completing fixes:

1. **Update README.md** in `/swagger` directory
2. **Create CHANGELOG.md** documenting all changes
3. **Update developer portal** with corrected examples
4. **Notify integration partners** of any breaking changes

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All OAuth endpoints fully documented
- ✅ Zero translation keys in documentation
- ✅ All rate-limited endpoints show 429 responses
- ✅ Service token response structure correct

### Phase 2 Complete When:
- ✅ All required parameters documented
- ✅ All optional parameters documented
- ✅ Controller permit() calls match swagger

### Phase 3 Complete When:
- ✅ All status codes accurate
- ✅ Integration mappings aligned
- ✅ Tested against actual API

### Phase 4 Complete When:
- ✅ All endpoints have error documentation
- ✅ Standard error schemas created
- ✅ Error examples comprehensive

---

## Support & Questions

**Technical Lead:** TBD  
**Documentation Owner:** TBD  
**Review Required:** Yes, before merging each phase

**Related Documents:**
- [COMPLETE_LEGACY_SWAGGER_ANALYSIS.md](./COMPLETE_LEGACY_SWAGGER_ANALYSIS.md) - Full analysis
- [LEGACY_SWAGGER_ANALYSIS_SUMMARY.md](./LEGACY_SWAGGER_ANALYSIS_SUMMARY.md) - Executive summary
- [LEGACY_SWAGGER_QUICK_REFERENCE.md](./LEGACY_SWAGGER_QUICK_REFERENCE.md) - Quick fixes

---

**Last Updated:** January 19, 2025  
**Next Review:** After Phase 1 completion

