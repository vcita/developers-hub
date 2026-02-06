# 401 return points in Core (API)

When API validation gets a 401, the **response body** identifies which layer returned it. Use this reference to tell a real authorization failure from a configuration/context issue.

## Response body → source

| Response body | Source | When it happens |
|---------------|--------|------------------|
| `{"success":false,"errors":[{"code":"unauthorized","message":"Unauthorized"}]}` | **APIController#authorize** (`render_response APIResponse.unauthorized`) | `authorize_action` returned false: token was accepted but business_uid / context check failed (e.g. context_business nil, or staff business ≠ request business). **Often not a “wrong token” issue** – e.g. wrong token type (Directory without X-On-Behalf-Of), or business context mismatch. |
| `{"success":false,"errors":[{"code":"unauthorized","message":"401 Unauthorized"}]}` | **APIController** Doorkeeper render (`doorkeeper_unauthorized_render_options`) | Doorkeeper rejected the request: no token, invalid token, or token not found. Request never passed `authorize_request!`. |
| `{"message":"401 Unauthorized","status":"Failure"}` | **JWT** (`lib/api/jwt_token_authentication.rb` rescue) or **Client auth** (`lib/api/client_authentication.rb`) | JWT decode/verify failed, or client token invalid. |
| `{"error":"Unauthorized"}` | **Api::Authentication** (`lib/api/authentication.rb` extract_doorkeeper_user) or **Platform authentication_controller** | Directory token with X-On-Behalf-Of: business’s directory ≠ token’s resource owner. |
| `{"status":"failure","message":"401 Unauthorized"}` | **ApplicationController** (`doorkeeper_unauthorized_render_options`) | Doorkeeper unauthorized (non-API controllers). |
| `{"message":"Unauthorized","status":"Failure"}` | **ApplicationController** `record_unauthorized` | Generic unauthorized handler. |

## Flow for Business API (e.g. POST …/matters/…/tags or PUT …/v1/tags)

1. **authorize_request!** (before controller action)  
   - If `jwt_token_in_request?` → `jwt_authenticate!` (JWT 401 on failure).  
   - Else if admin token → `admin_token_authenticate!`.  
   - Else if `token_internal` → no render, continues.  
   - Else → `doorkeeper_authorize!` (Doorkeeper 401 on failure).

2. **authorize** (APIController `before_action`)  
   - Calls `authorize_action(authorize_params, { business_uid: context_business.try(:uid) })`.  
   - If false → `render_response APIResponse.unauthorized` → **`{"success":false,"errors":[{"code":"unauthorized","message":"Unauthorized"}]}`**.

So:

- **Doorkeeper 401** → token missing/invalid/not found; fix token or how it’s sent.
- **APIResponse.unauthorized** (message `"Unauthorized"`) → token was accepted; fix **context**: use the correct token type (Staff for staff-scoped endpoints), ensure business_uid matches (e.g. Directory + X-On-Behalf-Of, or Staff token for that business), and avoid expired JWT so the request is not falling back to Doorkeeper with a non-Doorkeeper token.

## References (core)

- `app/controllers/api_controller.rb`: `doorkeeper_unauthorized_render_options`, `authorize`, `authorize_action`
- `app/controllers/application_controller.rb`: `context_business` (from `context_staff.business`), `record_unauthorized`, `doorkeeper_unauthorized_render_options`
- `lib/api/authentication.rb`: `authorize_request!`, `extract_doorkeeper_user`, `current_user`
- `lib/api/jwt_token_authentication.rb`: `jwt_authenticate!`, `get_token_from_request`
- `lib/api_response.rb`: `APIResponse.unauthorized`
