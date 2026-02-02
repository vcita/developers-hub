---
endpoint: "POST /v3/payment_processing/payment_gateways"
domain: sales
tags: []
swagger: swagger/sales/payment_gateway.json
status: success
savedAt: 2026-01-26T21:38:59.877Z
verifiedAt: 2026-01-26T21:38:59.877Z
---

# Create Payment gateways

## Summary
Test passes after acquiring app OAuth token and correcting field validation formats. The endpoint requires valid URL format, locale enum, ISO country codes, and ISO currency codes.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_payment_gateways
    method: POST
    path: "/v3/payment_processing/payment_gateways"
    body:
      app_code_name: "{{uid}}"
      gateway_logo_url: https://example.com/logo.png
      default_locale: en
      gateway_type: digital_wallet
      status: active
      main_gateway_benefits:
        "0":
          locale: en
          benefits:
            "0": Fast and secure payments
      brief_benefit_highlights:
        "0":
          locale: en
          highlights:
            "0": Easy integration
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
