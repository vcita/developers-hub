---
endpoint: "POST /platform/v1/payment/cards/sync_card"
domain: sales
tags: [payments, cards, stripe, sync]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-02-08T11:31:40.000Z"
verifiedAt: "2026-02-08T11:31:40.000Z"
timesReused: 0
---

# Create Sync Card

## Summary

Syncs a payment card from an external payment gateway (like Stripe) to the platform. This endpoint requires **payment gateway configuration** and **valid client data**. The card details must be unique - the API prevents duplicate cards based on exp_month, exp_year, and last_4 digits.

**Token Type**: This endpoint requires a **Staff token** when using the fallback API.

## Prerequisites

```yaml
steps:
  - id: set_stripe_credentials
    description: "Seed Stripe credentials so the gateway is considered connected"
    method: POST
    path: "/platform/v1/payment/settings"
    token: staff
    body:
      payment_settings:
        stripe_user_id: "acct_test_123"
        stripe_access_token: "sk_test_123"
    expect:
      status: [200, 201]
    onFail: abort

  - id: set_gateway_type
    description: "Set the active gateway type after connection is present"
    method: POST
    path: "/platform/v1/payment/settings"
    token: staff
    body:
      payment_settings:
        payments_gateway_type: stripe
        payments_enabled: true
        allow_credit_card: true
    expect:
      status: [200, 201]
    onFail: abort

  - id: create_fresh_client
    description: "Create a new client for card sync (avoids card limit issues)"
    method: POST
    path: "/platform/v1/clients"
    token: staff
    body:
      first_name: "Test"
      last_name: "Card Client"
      email: "testcard{{timestamp}}@example.com"
    extract:
      client_id: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_sync_card
    description: "Sync a unique payment card from external gateway"
    method: POST
    path: "/platform/v1/payment/cards/sync_card"
    body:
      client_id: "{{client_id}}"
      customer_id: cus_test_customer_456
      details:
        exp_month: 3
        exp_year: 2030
        last_4: "{{timestamp | slice: -4}}"
        cardholder_name: Test User
        card_brand: visa
      default: false
      external_card_id: "card_test_unique_{{timestamp}}"
    expect:
      status: [200, 201]
```

## Parameters Reference

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_id | string | Yes | Client UID (not legacy ID) |
| customer_id | string | Yes | External gateway customer ID (e.g., Stripe cus_...) |
| external_card_id | string | Yes | External gateway card ID (e.g., Stripe card_... or pm_...) |
| default | boolean | No | Whether this is the default card (false if not specified) |
| details | object | Yes | Card information object |

### Details Object Properties

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| exp_month | number | Yes | Expiration month (1-12) |
| exp_year | number | Yes | Expiration year (YYYY) |
| last_4 | string | Yes | Last 4 digits of the card |
| cardholder_name | string | Yes | Name on the card |
| card_brand | string | Yes | Card brand (visa, mastercard, etc.) |

## Response Codes

| Status | Meaning |
|--------|------------|
| 201 | Success - Card synced successfully |
| 422 | Validation Error - Missing required fields or duplicate card |
| 422 | Unauthorized - Invalid token or missing payment gateway setup |

## Critical Learnings

1. **Fallback API Required**: This endpoint only works through the fallback API URL
2. **Payment Gateway Setup**: Business must have connected payment gateway (Stripe, etc.)
3. **Unique Cards**: Duplicate prevention based on exp_month, exp_year, and last_4 combination
4. **Client ID Format**: Uses the client UID format, not legacy hash ID
5. **External IDs**: Both customer_id and external_card_id must be valid external gateway identifiers
6. **Card Limit**: Existing clients may hit card limits; using fresh clients avoids this issue

## Notes

- The `details` object contains the actual card information displayed to users
- Cards are automatically marked as active when synced
- The `default` field will be set to true automatically if this is the client's first card
- Staff member who syncs the card is recorded in the audit trail
- Use unique card details (exp_month, exp_year, last_4) to avoid duplicate card errors
- Creating a fresh client prevents hitting existing card limits during testing