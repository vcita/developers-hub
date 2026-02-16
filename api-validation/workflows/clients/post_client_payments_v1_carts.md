---
endpoint: "POST /client/payments/v1/carts"
domain: clients
tags: [payments, carts]
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: 2026-02-06T16:03:09.728Z
verifiedAt: 2026-02-06T16:03:09.728Z
timesReused: 0
---
# Create Cart

## Summary

Creates a cart for a client. The `entity_type` field must use capitalized Ruby model names (e.g., "Invoice", "ProductOrder", "Meeting") — lowercase or non-model values like "deposit" or "payment_request" are rejected with a 422. The `entity_uid` must be the actual entity UID (e.g., the Invoice UID), NOT the payment_request UID.

**Token Type**: This endpoint requires a **Client token**.

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client from the business"
    method: GET
    token: directory
    path: "/platform/v1/clients"
    params:
      per_page: "5"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_invoices
    description: "Fetch invoices for the client to find entity_uid and matter_uid"
    method: GET
    token: directory
    path: "/platform/v1/clients/{{client_id}}/invoices"
    params:
      per_page: "10"
    extract:
      entity_uid: "$.data.invoices[0].id"
      matter_uid: "$.data.invoices[0].conversation_id"
      currency: "$.data.invoices[0].currency"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create a cart with an Invoice item"
    method: POST
    path: "/client/payments/v1/carts"
    body:
      cart:
        currency: "{{resolved.currency}}"
        items:
          - entity_type: "Invoice"
            entity_uid: "{{resolved.entity_uid}}"
        matter_uid: "{{resolved.matter_uid}}"
    expect:
      status: [200, 201]
```

## Parameters Reference

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cart.matter_uid | string | Yes | The matter UID to associate with this cart |
| cart.currency | string | Yes | ISO 4217 currency code (e.g., "USD") |
| cart.items | array | Yes | Array of items to add to the cart |
| cart.items[].entity_type | string | Yes | Capitalized model name: Invoice, Meeting, EventAttendance, ProductOrder, ClientBookingPackage, Cart, PendingBooking |
| cart.items[].entity_uid | string | Yes | The actual entity UID (e.g., the Invoice UID from GET /client/payments/v1/invoices). NOT the payment_request UID. |

## Critical Learnings

1. **entity_type must be capitalized**: Use "Invoice" not "invoice", "ProductOrder" not "product_order". These are Ruby model class names.
2. **"deposit" and "payment_request" are NOT valid entity_types**: The backend validates against `ACTIVITY_TYPES = ['Invoice', 'Meeting', 'EventAttendance', 'ProductOrder', 'ClientBookingPackage', 'Cart', 'PendingBooking']`.
3. **entity_uid must be the actual entity UID, NOT the payment_request UID**: When sourcing from payment_requests, use the `payable_uid` field (the actual Invoice/entity UID), not the payment_request's own `uid`. The payment_request `uid` is a PaymentStatus record UID, which is different from the underlying entity UID. Frontend code (frontage and client-portal) uses `payable_uid` from payment_statuses.
4. **Error field naming differs from request field**: When entity_type is "Invoice" and the entity is not found, the API returns `"field": "invoice_uid"` instead of `"field": "entity_uid"`. This is because the backend maps entity_type to specific error field names.
5. **Source code reference**: `CartsAPI::ACTIVITY_TYPES` in `core/modules/payments/app/components/payments/carts_api.rb:11`

## Notes

- The cart wraps multiple payment items into a single payable unit
- The frontage close-balance controller (`close-balance-controller.js.coffee`) creates carts using `ps.payable_uid` and `ps.payable_type` from payment_statuses
- The client-portal creates carts for multi-bookings using `booking.id` and `booking.payment_status.payable_type`
- Currency must match the business currency (or a supported currency if multiple currencies are enabled)
- All items in the cart must belong to the same matter
- Verified: API returned 201 with invoice UID "dg3g449g3gcdpmiz" for entity_type "Invoice"
