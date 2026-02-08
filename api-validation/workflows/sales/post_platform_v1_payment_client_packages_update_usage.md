---
endpoint: "POST /platform/v1/payment/client_packages/update_usage"
domain: sales
tags: [packages, payment, usage, redemption]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-02-08T20:00:00.000Z"
verifiedAt: "2026-02-08T20:00:00.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
requiresTestData: true
testDataDescription: "Client must have active package with available credits, and a pending booking for a service included in that package"
---

# Update Client Package Usage

## Summary

Redeems a client package credit by applying it to a pending payment status. The endpoint finds valid packages for the client's conversation/matter that match the service on the booking, then marks the payment status as paid with price 0 and creates a booking credit redemption record.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint reliably.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Package credit applied, payment status marked as paid |
| 422 | Unprocessable Entity - No suitable package, already paid, or no service on booking |
| 401 | Unauthorized - Invalid or missing token |
| 500 | Internal Server Error - Only occurs when an exception is raised in the code path (e.g., invalid payment_status_uid) |

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Uses `current_user.staff.business.uid` for business context |
| Directory | ❌ | Not supported |

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client for the business"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_packages
    description: "Get the list of packages to find one with available credits"
    method: GET
    path: "/platform/v1/payment/packages"
    token: staff
    useFallback: true
    extract:
      package_id: "$.data.packages[0].id"
      package_price: "$.data.packages[0].price"
    expect:
      status: [200]
    onFail: abort

  - id: get_package_detail
    description: "Get the package detail to extract the service it covers"
    method: GET
    path: "/platform/v1/payment/packages/{{package_id}}"
    token: staff
    useFallback: true
    extract:
      service_id: "$.data.package.items[0].services[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: make_service_paid
    description: "Update the package's service to be paid (charge_type=paid, price=50) so bookings generate a PaymentStatus"
    method: PUT
    path: "/v2/settings/services/{{service_id}}"
    token: staff
    useFallback: true
    body:
      price: 50
      charge_type: "paid"
    expect:
      status: [200]
    onFail: abort

  - id: create_booking
    description: "Create a booking using client token (required to bypass form validation) for the paid service"
    method: POST
    path: "/platform/v1/scheduling/bookings"
    token: client
    useFallback: true
    body:
      business_id: "{{business_id}}"
      service_id: "{{service_id}}"
      client_id: "{{client_id}}"
      staff_id: "{{staff_id}}"
      start_time: "{{tomorrow_date}}T21:00:00.000Z"
      time_zone: "UTC"
      booking_type: "appointment"
      form_data:
        fields: {}
        service_fields: {}
        others:
          notes: "Package redemption test booking"
        policies: {}
    extract:
      booking_id: "$.data.booking.id"
    expect:
      status: [200, 201]
    onFail: abort

  - id: get_appointment
    description: "Retrieve the appointment to extract the payment_status_uid and conversation_id"
    method: GET
    path: "/platform/v1/scheduling/appointments/{{booking_id}}"
    token: staff
    useFallback: true
    extract:
      payment_status_uid: "$.data.appointment.payment_status.uid"
      conversation_id: "$.data.appointment.conversation_id"
    expect:
      status: [200]
    onFail: abort

  - id: create_client_package
    description: "Create a client package linked to the same conversation as the booking so credits align"
    method: POST
    path: "/platform/v1/payment/client_packages"
    token: staff
    useFallback: true
    body:
      client_id: "{{client_id}}"
      package_id: "{{package_id}}"
      price: "{{package_price}}"
      valid_from: "{{today_date}}"
      valid_until: "{{next_month_date}}"
      matter_uid: "{{conversation_id}}"
    extract:
      client_package_payment_uid: "$.data.client_package.payment_status_uid"
    expect:
      status: [200, 201]
    onFail: abort

  - id: pay_client_package
    description: "Pay the client package to activate booking credits"
    method: PUT
    path: "/platform/v1/payments/{{client_package_payment_uid}}"
    token: staff
    useFallback: true
    body:
      payment_method: "Cash"
      amount: "{{package_price}}"
    expect:
      status: [200]
    onFail: skip
    skipReason: "Package credits may already be active without explicit payment"
```

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| payment_status_uid | GET /platform/v1/scheduling/appointments/{id} | $.data.appointment.payment_status.uid | Must be from a booking with a priced service |
| matter_uid | GET /platform/v1/scheduling/appointments/{id} | $.data.appointment.conversation_id | Recommended - ensures package credit matching uses the correct conversation |

### Resolution Steps

**payment_status_uid:**
1. Create a booking via `POST /platform/v1/scheduling/bookings` for a service with a price
2. Get the appointment via `GET /platform/v1/scheduling/appointments/{booking_id}`
3. Extract `$.data.appointment.payment_status.uid`
4. The PaymentStatus must be in `pending` state (not already paid)

**matter_uid (conversation_id):**
1. Get the appointment via `GET /platform/v1/scheduling/appointments/{booking_id}`
2. Extract `$.data.appointment.conversation_id`
3. Use this same conversation_id when creating the client package (as `conversation_id` parameter) to ensure the booking credits' `engagement_uid` aligns with the booking's conversation

## Test Request

```yaml
steps:
  - id: update_usage
    description: "Redeem package credit for the booking's payment status"
    method: POST
    path: "/platform/v1/payment/client_packages/update_usage"
    token: staff
    useFallback: true
    body:
      payment_status_uid: "{{payment_status_uid}}"
      matter_uid: "{{conversation_id}}"
    expect:
      status: [200]
```

## Parameters Reference

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| payment_status_uid | string | Yes | Payment status UID of the booking to redeem. The controller also accepts `payment_status_id` as an alias. |
| matter_uid | string | No | Matter/Conversation UID. If not provided, the system resolves it from the PaymentStatus's client. |

## Critical Learnings

1. **Happy path works**: The 500 error from the `exception` vs `e` bug only triggers when the main code path throws an exception (e.g., nil PaymentStatus). When all data is valid, the code succeeds with 200 and never hits the buggy rescue block.
2. **Staff Token Required**: Only staff tokens work. The controller uses `current_user.staff.business.uid` for authorization.
3. **Fallback API Required**: Must use fallback API URL as main gateway doesn't support this endpoint reliably.
4. **PaymentStatus must have a service**: The code calls `ps.payable.try(:service).try(:uid)` - if the payable has no service (e.g., invoice without a service), it returns 422 "There is no package to use".
5. **Package matching**: The system finds packages via `get_matter_valid_packages` which checks `engagement_uid` (matter_uid), valid dates, active status, available credits, and either matching service UID or pack_type 4 (all-services).
6. **Parameter name**: The swagger defines `payment_status_uid` but the controller accepts both `payment_status_uid` and `payment_status_id` (frontend uses the latter).
7. **Client UID not needed**: The controller always passes `client_uid: nil` to `update_usage` - the client is resolved from the PaymentStatus record.
8. **Engagement UID alignment is critical**: The client package's booking credits must have `engagement_uid` matching the booking's conversation. Create the booking FIRST, extract `conversation_id` from the appointment, then create the client package with that `conversation_id`. Without this, `get_matter_valid_packages` returns empty and the endpoint returns 422.
9. **Create client_package response uses `payment_status_uid`**: The decorator returns `payment_status_uid` (not `payment_status_id`). Extraction path must be `$.data.client_package.payment_status_uid`.
10. **Frontend always sends matter_uid**: Both Angular and Vuetage pass `matter_uid` (from `appointment.conversation_uid` or `client.matter_uid`) to ensure the correct conversation is used for package matching.
11. **Booking start_time must be within business hours**: The test business operates from ~20:00 UTC (not 17:00 UTC). Use `{{tomorrow_date}}T21:00:00.000Z` to construct a time within business hours. The `{{tomorrow_datetime}}` variable (17:00 UTC) is outside this business's availability window.
12. **Package list vs detail endpoint**: The list endpoint `GET /platform/v1/payment/packages` does NOT include `items` or `services`. Use the detail endpoint `GET /platform/v1/payment/packages/{id}` to extract `service_id` from `$.data.package.items[0].services[0].id`.
13. **Create client_package uses `matter_uid` not `conversation_id`**: The controller reads `params[:matter_uid]` as the explicit parameter. Passing `conversation_id` causes a 500 error because it's included in the model attributes hash as an unknown attribute.

## Known Issues

### Issue: 500 Error with Invalid PaymentStatus

**Description**: When `payment_status_uid` references a non-existent record, `PaymentStatus.find_by_uid` returns nil, and `ps.client.uid` throws NoMethodError. This is caught by the controller's `rescue_from Exception` handler, returning 500.

**Root Cause**: No nil check after `find_by_uid`. Additionally, a separate rescue block at line ~1228 in `client_packages_api.rb` uses `exception` instead of the caught variable `e`.

**Workaround**: Ensure `payment_status_uid` references a valid, existing PaymentStatus record from a real booking.

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| Required field | `payment_status_uid` required | Also accepts `payment_status_id` | Controller: `params[:payment_status_uid] \|\| params[:payment_status_id]` |
| Parameter name | Only `payment_status_uid` and `matter_uid` | Frontend sends `client_id` and `new_api` too, but controller ignores them | Controller passes `client_uid: nil` always |

## Notes

- The frontend (Vuetage and Angular) calls this endpoint as part of the "Redeem Package" action on an appointment
- Frontend sends `payment_status_id`, `client_id`, and `matter_uid` - but only `payment_status_id` is actually used by the backend
- After successful redemption, the PaymentStatus state changes to `:paid` with price 0
- A `BookingCreditRedemption` record is created linking the credit to the booking
- For `PendingBooking` payables, `AfterCheckout` processing is triggered after redemption
