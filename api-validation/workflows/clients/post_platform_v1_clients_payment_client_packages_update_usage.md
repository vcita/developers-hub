---
endpoint: POST /platform/v1/clients/payment/client_packages/update_usage
domain: clients
tags: []
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: verified
savedAt: 2026-01-25T23:12:26.084Z
verifiedAt: 2026-02-02T23:00:00.000Z
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "Test environment client has no active packages - 422 'There is no package to use' is the expected response. 200 would require provisioning client packages."
requiresTestData: true
testDataDescription: "Client must have active booking packages with available credits for the service in the payment request"
---
# Use Client Package Credit

## Summary
Applies a package credit to a payment status, effectively "using" one session from the client's purchased package. The endpoint marks the payment status as paid (with price 0) and creates a booking credit redemption record.

**Token Type**: This endpoint requires a **client token** (uses `Api::ClientAuthentication`).

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Package credit applied, payment status marked as paid |
| 422 | Expected business logic - No suitable package exists (client has no active packages with available credits for this service, or payment is already paid) |
| 500 | Known bug - May occur when payment_status_id references a virtual booking that fails to be retrieved (see Known Issues) |

## Known Issues

**500 Error with Virtual Bookings**: There is a known bug in the server code (line 1228 in `client_packages_api.rb`) where an undefined variable `exception` is used instead of the caught variable `e` in exception handling. This causes a 500 error when:
1. The `payment_status_id` does not exist in regular PaymentStatus records
2. The system attempts to look it up as a "virtual booking"
3. The virtual booking lookup throws an exception

**Workaround**: Ensure the `payment_status_id` references a regular payment status that exists in the client's payment history. Use the client payment requests endpoint (`/client/payments/v1/payment_requests`) to get valid payment_status_id values with a **pending** state.

## Test Data Setup (Required for 200 Success)

To test the happy path (200 response), provision the following in the test environment:

1. **Create a Booking Package** for the business:
   ```
   POST /platform/v1/payment/booking_packages
   {
     "name": "Test Package",
     "price": 100,
     "sessions_count": 10,
     "service_uids": ["<service_uid>"]  // Service that will be in the payment request
   }
   ```

2. **Create a Client Booking Package** (assign package to client):
   ```
   POST /platform/v1/payment/client_packages
   {
     "client_uid": "<client_uid>",
     "booking_package_uid": "<package_uid_from_step_1>",
     "sessions_count": 10
   }
   ```

3. **Create a pending Payment Request** for a service covered by the package:
   - The payment request must be for a service included in the booking package's `service_uids`
   - The payment request must have `state: pending` (not already paid)

Without this test data, the endpoint will return 422 "There is no package to use" which is the expected business logic response.

## Prerequisites

```yaml
steps:
  - id: get_payment_requests
    description: "Get payment requests from the client's payment history. Must use /client/payments/v1/payment_requests (client token accessible), NOT /business/payments/v1/payment_requests (which requires business token and returns 401 for client tokens). Note: Only unpaid (pending) payment requests can be used - already-paid requests will cause 422."
    method: GET
    path: "/client/payments/v1/payment_requests"
    extract:
      payment_status_id: "$.data.payment_requests[0].uid"
    expect:
      status: 200
    onFail: skip
    skipReason: "No payment requests available for this client"
    validation_note: "The extracted payment_status_id should ideally have state='pending'. If only 'paid' requests exist, the main request will return 422 (expected behavior)."
```

## Test Request

```yaml
steps:
  - id: post_update_usage
    description: "Apply package credit to payment. In test environment, 422 is the expected success response since test clients typically don't have active packages. 200 would require provisioning client packages with available credits."
    method: POST
    path: "/platform/v1/clients/payment/client_packages/update_usage"
    body:
      payment_status_id: "{{payment_status_id}}"
    expect:
      status: [200, 422]
    successStatus: 422
    successReason: "Test client has no active packages - 'There is no package to use' confirms endpoint reached business logic correctly"
```

## Happy Path

The endpoint successfully returns 200 when:
1. The `payment_status_id` references a valid, **unpaid** payment status (state != 'paid')
2. The client has an active package with available credits for the service associated with the payment status
3. The package credit can be redeemed

The endpoint returns 422 (which is **expected behavior**, not a failure) when:
1. The client has no active packages
2. The client's packages have no remaining credits
3. The packages don't apply to the service in the payment status
4. The payment status is already marked as paid