# Legacy Swagger Issues - Quick Reference

This is a quick reference guide for the most common documentation issues found in legacy swagger files.  

**📄 For Complete Analysis:** See [COMPLETE_LEGACY_SWAGGER_ANALYSIS.md](./COMPLETE_LEGACY_SWAGGER_ANALYSIS.md) - All 220+ endpoints analyzed  
**📊 For Summary:** See [LEGACY_SWAGGER_ANALYSIS_SUMMARY.md](./LEGACY_SWAGGER_ANALYSIS_SUMMARY.md)

## Quick Fix Checklist

Use this checklist when updating any legacy v1 endpoint documentation:

### ✅ Response Structure
- [ ] Does the response show the correct wrapper? (`success`, `data`, `status` fields)
- [ ] Is the HTTP status code correct? (200 vs 201)
- [ ] Are all response fields documented?

### ✅ Parameters
- [ ] Are all query parameters documented? (check controller for `params[:*]`)
- [ ] Are all body parameters documented? (check `params.permit()`)
- [ ] Are filter parameters documented? (e.g., `filter[app_type]`)

### ✅ Error Responses  
- [ ] 422 (Unprocessable Entity) - validation errors
- [ ] 429 (Too Many Requests) - rate limiting
- [ ] 409 (Conflict) - duplicate resources
- [ ] 400 (Bad Request) - malformed input

### ✅ Rate Limiting
- [ ] Does the endpoint have rate limiting? (search for `within_rate_limit?`)
- [ ] Is 429 response documented with error format?

---

## Common Issues by Endpoint

### Apps Domain

| Endpoint | Issue | Fix Needed |
|----------|-------|------------|
| `POST /oauth/service/token` | Response structure wrong | Add `success` and `data` wrapper, remove `created_at` |
| `GET /platform/v1/apps` | Missing parameters | Add filter parameters, fix status code 201→200 |
| `POST /platform/v1/apps` | Missing parameters | Add `client_auth_jwks_uri`, `access_token_format` |
| `PUT /platform/v1/apps/{id}` | Missing parameters | Add `client_auth_jwks_uri`, `access_token_format`, document `trusted` restrictions |
| `POST /platform/v1/apps/{id}/assign` | Missing parameter | Add `hide_from_market` |
| `POST /platform/v1/apps/{id}/uninstall_app` | Missing parameter | Add `subscription_uid` |

### Clients Domain

| Endpoint | Issue | Fix Needed |
|----------|-------|------------|
| `GET /platform/v1/clients` | Missing rate limit & parameter | Add 429 response, add `phone_exists` parameter |
| `POST /platform/v1/clients` | Missing parameters & errors | Add source tracking params, add 409 and 422 responses |
| `GET /platform/v1/clients/{id}` | Missing rate limit | Add 429 response |

---

## Response Format Examples

### Standard Success Response (v1)
```json
{
  "status": "OK",
  "data": {
    ...
  }
}
```

### Standard Error Response (v1)
```json
{
  "status": "Error",
  "error": "Error message here"
}
```

or with structured errors:

```json
{
  "success": false,
  "errors": [
    {
      "code": "error_code",
      "message": "Error message",
      "field": "field_name"
    }
  ]
}
```

### Rate Limit Response (429)
```json
{
  "error": "Too many requests"
}
```

### OAuth Error Response (400/401)
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

Common error codes:
- `invalid_client` - Client authentication failed
- `invalid_grant` - Invalid authorization code
- `invalid_request` - Missing required parameters
- `invalid_token` - Token expired or invalid
- `unsupported_grant_type` - Invalid grant_type value

---

## How to Find Missing Parameters

1. **Find the controller**: Look in `/core/**/controllers/` for the endpoint
2. **Check params.permit()**: All parameters in `permit()` should be documented
3. **Check params[:*]**: Direct param access also indicates accepted parameters
4. **Check rate limiting**: Search for `within_rate_limit?` in controller

Example from code:
```ruby
def params_for_create
  params.permit(:name, :redirect_uri, :client_auth_jwks_uri, :access_token_format)
end
```

All four parameters should be in swagger!

---

## How to Find Missing Error Responses

Look for these patterns in controller code:

```ruby
render json: response, status: 422   # Document 422 response
render json: response, status: 409   # Document 409 response  
render json: {error: '...'}, status: 429   # Document 429 response
rescue ArgumentError => e   # Document 400/422 response
raise Components::Exceptions::AuthorizationException   # Document 401/403
```

---

## Priority by Endpoint Usage

### High Traffic Endpoints (Fix First):
1. `POST /oauth/service/token` - Used by all service-to-service auth
2. `GET /platform/v1/apps` - App discovery
3. `GET /platform/v1/clients` - Client listing
4. `POST /platform/v1/clients` - Client creation

### Medium Traffic (Fix Next):
1. `POST /platform/v1/apps` - App creation (less frequent)
2. `PUT /platform/v1/apps/{id}` - App updates
3. App install/uninstall endpoints

### Lower Traffic (Fix When Possible):
1. App assign/unassign endpoints
2. Other administrative endpoints

---

## Testing After Documentation Updates

After updating swagger, verify:

1. **Response structure matches**: Make test API call and compare
2. **All parameters work**: Test with documented parameters
3. **Error responses match**: Trigger errors and verify format
4. **Rate limits work**: Make rapid requests to test 429

---

## Tools to Help

### Find controller for an endpoint:
```bash
cd /Users/ramalmog/Documents/GitHub/core
grep -r "def index" app/controllers/platform/v1/
```

### Find rate limiting:
```bash
grep -r "within_rate_limit?" app/controllers/
```

### Find parameter permits:
```bash
grep -r "params.permit" app/controllers/platform/v1/
```

---

---

## Additional Findings by Domain

### Communication Domain

| Endpoint | Issue | Fix Needed |
|----------|-------|------------|
| `GET /platform/v1/conversations` | Missing parameter | Add `client_id` filter parameter |
| `POST /platform/v1/messages` | Missing errors | Add 422 and 400 responses |

### Platform Administration Domain

| Endpoint | Issue | Fix Needed |
|----------|-------|------------|
| `POST /platform/v1/businesses` | Minor | More detailed error examples |
| `GET /platform/v1/businesses/{id}/settings` | Missing parameter | Add required `scope` parameter |
| `GET /platform/v1/businesses/{id}/staffs` | Rate limiting & missing param | Add 429 response, add `status` parameter |
| `GET /platform/v1/tokens` | Integration mapping inconsistency | Fix integration mapping 200→201 (docs correctly show 201) |
| `POST /platform/v1/tokens` | Complex params | Document all parameter options and priority rules |
| `POST /oauth/token` | Missing parameters & errors | Add `client_assertion`, `client_assertion_type`, `scope`; Add all 400 error responses |
| `GET /oauth/userinfo` | Missing parameter & errors | Add required `Authorization` header; Add 401 error responses |

### Sales Domain

| Endpoint | Issue | Fix Needed |
|----------|-------|------------|
| `POST /platform/v1/leadgen` | Missing errors | Add 422, 400 responses |

### Scheduling Domain

| Endpoint | Issue | Fix Needed |
|----------|-------|------------|
| `GET /platform/v1/scheduling/appointments` | Missing errors | Add 422, 404 responses |

---

## Domain Quality Summary

**Best Documented:**
- Platform Administration (legacy_v1_platform.json)
- Sales (legacy_v1_sales.json)
- Scheduling (legacy_v1_scheduling.json)

**Needs Most Work:**
- Apps (multiple critical issues)
- Clients (rate limiting not documented)

**Modern & Well Structured:**
- Communication (communication.json - OpenAPI 3.0)

---

*Last updated: January 19, 2025*  
*Analysis complete: All 6 domains reviewed*

