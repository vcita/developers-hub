---
endpoint: "PUT /v3/payment_processing/payment_gateways/{uid}"
domain: sales
tags: []
swagger: "swagger/sales/payment_gateway.json"
status: verified
savedAt: "2026-01-26T22:41:27.128Z"
verifiedAt: "2026-01-26T22:41:27.128Z"
timesReused: 0
---

# Update Payment gateways

## Summary
Test passes after creating an app and payment gateway with valid values. Original test failed due to invalid placeholder values for URL, locale, country codes, and currency codes, plus missing app authentication.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_payment_gateways
    method: PUT
    path: "/v3/payment_processing/payment_gateways/{{uid}}"
    body:
      gateway_logo_url: https://example.com/logo.png
      default_locale: en
      gateway_type: digital_wallet
      status: active
      main_gateway_benefits:
        "0":
          locale: en
          benefits:
            "0": Fast processing
      brief_benefit_highlights:
        "0":
          locale: en
          highlights:
            "0": Secure payments
      supported_countries:
        "0": US
      supported_currencies:
        "0": USD
      minimum_charge_amount: null
      payment_methods:
        credit_card: true
        ach: true
        ideal: true
        bancontact: true
        twint: true
        express_wallets: true
      processing_features:
        multi_currency: true
        back_office_charge: true
        checkout: true
        refund: true
        partial_refund: true
        client_save_card_on_checkout: true
        client_save_card_standalone: true
        save_card_by_business: true
        offset_fees: true
    expect:
      status: [200, 201]
```
