---
endpoint: "POST /platform/v1/payment/settings"
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-26T20:05:40.839Z
verifiedAt: 2026-01-26T20:05:40.839Z
---

# Create Settings

## Summary
Test passes after using a valid connected payment gateway type. Changed payments_gateway_type from "test_string" to "stripe", and used real payment provider credentials that are already connected.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_settings
    method: POST
    path: "/platform/v1/payment/settings"
    body:
      payment_settings:
        allow_bank_debit_on_checkout: true
        allow_credit_card: true
        allow_express_wallets: true
        allow_view_payments: true
        braintree_access_token: test_string
        braintree_refresh_token: test_string
        client_store_card_for_business_use: true
        currency: USD
        enable_tips_for_bo: true
        enable_tips_for_cp: true
        ewallet_type: paypal
        multiple_currencies: true
        offset_fee_configuration:
          offset_fee_mode: none
          surcharge_fee_enabled: true
          surcharge_fee_rate: 1
          convenience_fee_type: flat
          convenience_fee_value: 1
        payments_enabled: true
        payments_gateway_type: stripe
        paypal_email: test@example.com
        stripe_access_token: fake_stripe_access_token
        stripe_email: fake@fake.com
        terms_and_conditions_type: text
        terms_and_conditions_value: test_string
        tips:
          "0":
            type: percent
            value: 15
          "1":
            type: percent
            value: 20
          "2":
            type: percent
            value: 25
    expect:
      status: [200, 201]
```
