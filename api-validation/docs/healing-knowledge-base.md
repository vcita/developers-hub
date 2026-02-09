# API Validation Healing Knowledge Base

This document captures reusable fix patterns for API validation failures.
When a resolution is confirmed, abstract it here so future healing can reuse it.

## How to use
- Before investigating a failed endpoint, scan for matching symptoms or path patterns.
- If a match exists, apply the documented resolution first.
- Do not create a JIRA ticket if the knowledge base contains a matching resolution.

## Entry template

## Entry - Short Title
- Symptoms:
- Sample endpoints:
- Common path patterns:
- Resolution:

## Entries

## Entry - Missing required fields in request payload
- Symptoms: 400/422/500 with validation messages like "can't be blank", "missing field", or "validation failed" when creating or updating a resource.
- Sample endpoints:
  - POST /business/payments/v1/carts
- Common path patterns: Any endpoint that accepts a request body.
- Resolution: Treat as a documentation/workflow mismatch until proven otherwise. Identify the missing fields by: 1) comparing the workflow request body to the frontend/service request payload; 2) inspecting controller or service code for required params; 3) checking model validations for presence requirements; 4) updating the workflow and swagger to include the required fields. Retest with the corrected payload.

## Entry - fallbackURL gateway mismatch
- Symptoms: "Bad Gateway" response with a not found error, or 422 with response body `{"status":"Error","error":"Unauthorized"}` from APIGW while the same request succeeds on fallback API.
- Sample endpoints:
  - GET /v3/sales/reports/payments_widget
  - GET /v3/sales/reports/forecast_payments
  - POST /platform/v1/invoices
- Common path patterns:
  - /v3/sales/reports/*
  - /platform/v1/* create/update endpoints
- Resolution: Fix the fallbackURL or routing configuration so the endpoint resolves correctly in the gateway. If the primary gateway is unreliable or returns 422 Unauthorized, set useFallbackApi: true in the workflow to route directly to the fallback URL and add a fallback notice. Use a Staff token against the fallback API to reach core.

## Entry - 401 from Doorkeeper (token missing or invalid)
- Symptoms: Response body `{"success":false,"errors":[{"code":"unauthorized","message":"401 Unauthorized"}]}` or `{"status":"failure","message":"401 Unauthorized"}`.
- Sample endpoints: Add real examples when confirmed.
- Common path patterns: Any API endpoint with Doorkeeper auth.
- Resolution: Token was missing, invalid, or not found. Fix how the token is sent or acquire the correct token. Request never passed authorize_request!.

## Entry - 401 from APIResponse.unauthorized (context mismatch)
- Symptoms: Response body `{"success":false,"errors":[{"code":"unauthorized","message":"Unauthorized"}]}`.
- Sample endpoints: Add real examples when confirmed.
- Common path patterns: Business API endpoints that rely on context_business.
- Resolution: Token was accepted, but business context check failed. Use the correct token type and business context. For Directory tokens, include X-On-Behalf-Of with the target business. For staff-scoped endpoints, use a Staff token for that business.

## Entry - 401 from JWT or client auth (decode or verify failure)
- Symptoms: Response body `{"message":"401 Unauthorized","status":"Failure"}`.
- Sample endpoints: Add real examples when confirmed.
- Common path patterns: Client or JWT protected endpoints.
- Resolution: JWT decode or verify failed, or client token is invalid. Refresh or re-acquire the JWT, and confirm it is valid for the request.

## Entry - 401 from Api::Authentication (directory mismatch)
- Symptoms: Response body `{"error":"Unauthorized"}`.
- Sample endpoints: Add real examples when confirmed.
- Common path patterns: Directory token requests that require X-On-Behalf-Of.
- Resolution: Directory token business does not match X-On-Behalf-Of business. Use a Directory token for the correct directory or fix X-On-Behalf-Of.

## Entry - X-On-Behalf-Of header must be declared in swagger
- Symptoms: Directory token requests return 401 when X-On-Behalf-Of is sent, but succeed when the header is omitted; workflows were adding the header globally instead of per endpoint.
- Sample endpoints:
  - GET /platform/v1/payments
  - POST /platform/v1/payments
  - PUT /platform/v1/payment/settings/update_default_currency
  - GET /platform/v1/clients/{client_id}/estimates
- Common path patterns:
  - /platform/v1/* (legacy v1 endpoints)
  - /platform/v1/clients/* (legacy client list endpoints)
- Resolution: The workflow should only send X-On-Behalf-Of when swagger explicitly declares it (header parameter or description). If an endpoint requires the header, add the `X-On-Behalf-Of` header parameter to its swagger operation so the workflow can detect it. Do not auto-add the header for all directory token requests.

## Entry - 401 from ApplicationController record_unauthorized
- Symptoms: Response body `{"message":"Unauthorized","status":"Failure"}`.
- Sample endpoints: Add real examples when confirmed.
- Common path patterns: Non-API controllers or mixed controller paths.
- Resolution: Generic unauthorized handler. Verify token validity and authorization flow for the controller; recheck token type and context.

## Entry - 403/401/400 on app assignments or cross-directory operations
- Symptoms: Directory token returns 403 Forbidden, 401 Unauthorized, or 400 "You can only create assignments for your own directory" when trying to assign an app, manage app assignments, or perform operations on resources that belong to a different directory.
- Sample endpoints:
  - POST /v3/apps/assignments
  - POST /v3/payment_processing/payment_gateway_assignments
  - PUT /v3/payment_processing/payment_gateways/{uid}
- Common path patterns:
  - /v3/apps/*/assignments
  - /v3/payment_processing/*_assignments
- Resolution (preferred): Create an app that belongs to the current directory with the relevant `app_type` (e.g., `payment_gateway`), then assign it internally via `POST /v3/apps/app_assignments` with `assignment_mode: internal`. This provisions the required resource within the token's own directory, bypassing cross-directory restrictions. Steps: 1) `POST /platform/v1/apps` with directory token and `app_type: ["payment_gateway"]`; 2) `POST /v3/apps/app_assignments` with `assignee_type: business`, `assignee_uid: {{business_id}}`, the app's `app_code_name`, and `settings.assignment_mode: internal`; 3) Use the resulting resource (e.g., fetch payment gateways and use the one now owned by the directory).
- Resolution (alternative): Use an **admin** token (sent as "Admin <token>" rather than "Bearer <token>"). In the workflow, set `token: admin` on the relevant step. Do not waste iterations trying other token types (staff, app) — they will also fail for cross-directory operations.

## Entry - 500 that only triggers in error-handling code (happy path bypass)
- Symptoms: Consistent 500 on every attempt. Backend source inspection reveals the error handler itself is broken (e.g., uses wrong variable name in a `rescue` block). The healer concludes "backend bug, cannot fix" and exhausts all iterations.
- Sample endpoints:
  - POST /platform/v1/payment/client_packages/update_usage
- Common path patterns: Any endpoint. Look for this pattern whenever a 500 persists and the root cause is in a `rescue`/`catch` block rather than in the main logic.
- Resolution: Do NOT give up. A broken error handler only runs when the main code path raises an exception. If all prerequisite data is valid, the main path succeeds and the buggy handler is never reached. Shift focus from "fix the 500" to "construct a valid happy path": ensure every prerequisite step uses `onFail: abort`, verify each extracted variable is non-null, and confirm all referenced entities actually exist before calling the target endpoint.

## Entry - Side-effect resources are only created when conditions are met
- Symptoms: A prerequisite step succeeds (e.g., 200/201), but a field expected in the response is `null` or missing. Downstream steps that depend on that field fail with `[NOT FOUND]` during extraction.
- Sample endpoints:
  - POST /platform/v1/scheduling/bookings (creates a PaymentStatus only when the service has a price > 0)
  - POST /platform/v1/invoices (creates a PaymentStatus only when amount > 0)
- Common path patterns: Any workflow where resource A is created as a **side effect** of creating resource B.
- Resolution: Some resources are only generated as side effects when specific conditions hold (e.g., a PaymentStatus is only created for bookings with a priced service; a conversation is only created when a client has interactions). When a prerequisite step returns null for an expected field, check what conditions trigger the side-effect creation: inspect the backend model callbacks, `after_create` hooks, or controller logic. Then add earlier prerequisite steps to ensure those conditions are met (e.g., update a service to `charge_type: "paid"` and `price > 0` before creating a booking that needs a PaymentStatus).

## Entry - Token type affects validation bypass, not just authorization
- Symptoms: 422 with validation errors (e.g., `FORM_VALIDATION_ERROR`, `"This field cannot be empty"`) even though all required fields are provided. Switching to a different token type makes the same request succeed.
- Sample endpoints:
  - POST /platform/v1/scheduling/bookings (requires client token to skip form field validation)
- Common path patterns: Any endpoint that has different code paths per token type — especially endpoints that serve both staff and client callers.
- Resolution: Some endpoints use the token type to decide which validations to run, not just for authorization. A staff token may trigger form-field validation that a client token bypasses (or vice versa). When a 422 validation error persists despite correct field values, check whether the existing workflow for that endpoint (if any) specifies a different `token` type. Also check the controller source for `current_user.type`-based branching or `before_action` filters that vary by token. Set the correct `token:` on the workflow step.

## Entry - Read-only vs. write routes live on different API paths
- Symptoms: GET on a resource works (200), but POST or PUT to the same path returns 404. The healer cannot create or update the resource.
- Sample endpoints:
  - GET /platform/v1/services (works) vs POST /platform/v1/services (404)
  - Write path: POST/PUT /v2/settings/services
- Common path patterns: `/platform/v1/*` often exposes read-only routes, while write operations live under `/v2/settings/*` or a different namespace.
- Resolution: When POST or PUT returns 404 on a path where GET works, the write route is on a different API path. Check `config/routes.rb` for where `create`/`update` actions are defined — they are often under a `settings` namespace or a different API version. Use the correct write path in the workflow step. Write endpoints are typically on the **fallback API** (`useFallback: true`).

## Entry - Prerequisite data must be cross-entity aligned
- Symptoms: All prerequisite steps pass individually, but the target endpoint returns 422 with a message like "no matching X found" or "X not valid for Y", even though both X and Y exist.
- Sample endpoints:
  - POST /platform/v1/payment/client_packages/update_usage (422 "There is no package to use")
- Common path patterns: Any endpoint that validates **relationships** between entities (e.g., package covers service, coupon applies to product, staff assigned to service).
- Resolution: The endpoint checks that entities reference each other — not just that each entity exists. When provisioning test data, derive dependent IDs from the same parent rather than fetching them independently. For example, if an endpoint needs a service covered by a package: 1) fetch the package first; 2) extract the service ID **from the package's items** (e.g., `$.data.packages[0].items[0].services[0].id`); 3) use that service in downstream steps. Never pick entities from separate list endpoints and assume they are related.

## Entry - YAML arrays in workflow body (supported syntax)
- Note: The workflow YAML parser now supports array syntax in body fields. Both simple value arrays and object arrays work correctly.
- Supported syntax:
  - Simple arrays: `tags:\n    - value1\n    - value2` → `{"tags": ["value1", "value2"]}`
  - Object arrays: `items:\n    - uid: "abc"\n      enabled: true` → `{"items": [{"uid": "abc", "enabled": true}]}`
  - Inline JSON arrays still work: `tags: ["a", "b"]` → `{"tags": ["a", "b"]}`
- Common mistake: If you see `{"- key": "value"}` in the parsed body, the parser is outdated and doesn't support array syntax. Update `parseSimpleYaml` in `executor.js`.

## Entry - Prefer creating prerequisite data over fetching existing records
- Symptoms: Workflow prerequisites use GET to find an existing resource, but the resource's state is wrong (e.g., not due/overdue, already consumed, already matched, wrong status). The workflow passes intermittently — it works when a suitable record happens to exist and fails when it doesn't.
- Sample endpoints:
  - POST /platform/v1/payments/{payment_uid}/match (needs a payment request that is due or overdue — fetching a pending one may find one with a future due date)
  - POST /business/payments/v1/payment_requests/{payment_request_uid}/send_link (needs a pending payment request on an assigned matter)
- Common path patterns: Any endpoint whose prerequisites depend on a resource being in a specific state, temporal condition, or relationship.
- Resolution: **Always prefer creating fresh prerequisite data over fetching existing records.** A GET from a list endpoint gives you whatever happens to be in the database, with no guarantees about state, ownership, or temporal eligibility. Instead, create the resource from scratch so you control its exact state. For example, to get a due-on-receipt payment request, create a product order (POST /business/payments/v1/product_orders) rather than searching for an overdue payment request. This makes workflows deterministic and repeatable regardless of environment state.

## Entry - Endpoint only works with specific entity/payable types
- Symptoms: 422 or 500 with a valid-looking request. The same endpoint works for some records but fails for others. Error messages may say "Invalid" or reference an undefined method on a model object. The healer concludes "backend bug" after testing with the wrong record type.
- Sample endpoints:
  - PUT /platform/v1/payment_statuses/{id}/apply_coupon (only works when payable_type is Meeting, EventAttendance, PendingBooking, or Cart)
- Common path patterns: Any endpoint that operates on a polymorphic parent (e.g., payment requests, activities, notifications) where the backend whitelists which child types are supported.
- Resolution: The failure is not a bug — the endpoint restricts which entity types it supports, and the prerequisite fetched a record with an unsupported type. Check the backend for allowlists (e.g., `ALLOWED_ENTITIES`, `SUPPORTED_TYPES`) and filter the prerequisite query to only return supported types. For example, add `filter[entity_type][in]=Meeting` instead of fetching any pending record. When in doubt, look at how the frontend calls the endpoint to see which entity types it operates on.

## Entry - Payment gateway webhook endpoints require live gateway flow (untestable)
- Symptoms: PUT/POST webhook endpoint returns 422 `no_content` or similar error regardless of token type, body payload, or prerequisite data. The endpoint requires a transient record (e.g., `PaymentProcessRequest`) that is only created as a side effect of a live payment gateway checkout session (e.g., Stripe, PayPal). Unlike the corresponding GET endpoint, the write endpoint has no fallback lookup (e.g., no `PaymentStatus.find_by_uid` fallback).
- Sample endpoints:
  - PUT /platform/v1/payment/checkout/ (requires `PaymentProcessRequest.find_by_url_key` — no `PaymentStatus` fallback)
- Common path patterns:
  - /platform/v1/payment/checkout/* (PUT/POST operations)
  - Any webhook-style endpoint designed for external payment gateway callbacks
- Resolution: Mark the workflow as `status: skipped` with a clear `expectedOutcomeReason` explaining the gateway dependency. Do NOT waste iterations trying different tokens, PaymentRequest UIDs, or PaymentStatus UIDs — the PUT path strictly requires the gateway-created record. The corresponding GET endpoint may have a fallback (e.g., `PaymentStatus.uid`), but do not assume the write endpoint shares it — always check the source code for both paths. If the GET works but the PUT doesn't, this is the likely cause.

## Entry - 500 "Staff can't be blank" when sending payment request link
- Symptoms: 500 with `{"success":false,"errors":[{"message":"Validation failed: Staff can't be blank","code":"unexpected"}]}` during `send_link`.
- Sample endpoints:
  - POST /business/payments/v1/payment_requests/{payment_request_uid}/send_link
- Common path patterns:
  - /business/payments/v1/payment_requests/*/send_link
- Resolution: The send_link flow creates a conversation message that requires a staff assignment on the matter. If the conversation is unassigned, the message creation fails. Fix the workflow by reassigning the matter to the active staff before calling send_link (e.g., `PUT /business/clients/v1/matters/{matter_uid}/reassign` with `staff_uid`). Retest on the fallback API if APIGW returns 401 for Staff tokens.


## Entry - 422 EXPECTED_ERROR on /business/payments/v1/* (endpoint)
- Symptoms: 422 EXPECTED_ERROR on /business/payments/v1/* (3 endpoints)
- Sample endpoints:
  - GET /business/payments/v1/deposits/{uid}
  - PUT /business/payments/v1/deposits/{uid}
- Common path patterns:
  - /business/payments/v1/*
- Resolution: Fixed endpoint by creating workflow with prerequisite to fetch existing deposit UID. The endpoint works correctly with staff token and returns 200.


## Entry - 0 MISSING_PARAMS_NEED_HEALING on /v2/coupons/{id}/* (fixed)
- Symptoms: 0 MISSING_PARAMS_NEED_HEALING on /v2/coupons/{id}/* (4 endpoints)
- Sample endpoints:
  - POST /v2/coupons/{uid}/expire
  - POST /v2/coupons/{uid}/enable
  - POST /v2/coupons/{uid}/disable
- Common path patterns:
  - /v2/coupons/{id}/*
- Resolution: Fixed POST /v2/coupons/{uid}/expire workflow by correcting the prerequisite step. The issue was a naming collision in coupon creation - updated the workflow to use {{now_timestamp}} for unique coupon names and fixed the UID extraction path to match the verified pattern from the similar GET workflow.


## Entry - 0 MISSING_PARAMS_NEED_HEALING on /v2/coupons/{id} (workflow)
- Symptoms: 0 MISSING_PARAMS_NEED_HEALING on /v2/coupons/{id} (2 endpoints)
- Sample endpoints:
  - GET /v2/coupons/{uid}
  - PUT /v2/coupons/{uid}
- Common path patterns:
  - /v2/coupons/{id}
- Resolution: No fix needed - the workflow was already verified and working correctly. The endpoint successfully returns 200 when retrieving a coupon by UID using a staff token with proper prerequisites.


## Entry - 0 MISSING_PARAMS_NEED_HEALING on /v3/communication/notification_templates/{id} (fixed)
- Symptoms: 0 MISSING_PARAMS_NEED_HEALING on /v3/communication/notification_templates/{id} (2 endpoints)
- Sample endpoints:
  - GET /v3/communication/notification_templates/{uid}
  - PUT /v3/communication/notification_templates/{uid}
- Common path patterns:
  - /v3/communication/notification_templates/{id}
- Resolution: Fixed missing UID parameter by adding prerequisite step to fetch notification template UID from the list endpoint. Updated token type to directory with proper X-On-Behalf-Of header.


## Entry - 0 MISSING_PARAMS_NEED_HEALING on /v3/communication/voice_calls/{id} (created)
- Symptoms: 0 MISSING_PARAMS_NEED_HEALING on /v3/communication/voice_calls/{id} (2 endpoints)
- Sample endpoints:
  - GET /v3/communication/voice_calls/{uid}
  - PUT /v3/communication/voice_calls/{uid}
- Common path patterns:
  - /v3/communication/voice_calls/{id}
- Resolution: Created workflow with prerequisite to fetch voice call UID from list endpoint, then retrieve specific voice call. Uses staff token and returns 200.
