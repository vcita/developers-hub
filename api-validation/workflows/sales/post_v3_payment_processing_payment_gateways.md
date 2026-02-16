---
endpoint: POST /v3/payment_processing/payment_gateways
domain: sales
tags: []
swagger: swagger/sales/payment_gateway.json
status: pending
savedAt: 2026-01-26T21:38:59.877Z
verifiedAt: 2026-01-26T21:38:59.877Z
timesReused: 0
---

# Create Payment gateway

## Summary
Creates a payment gateway for a payment app using an **Application token**. If the gateway already exists for the app, treat the run as a successful skip. The endpoint requires valid URL format, locale enum, ISO country codes, and ISO currency codes.

## Prerequisites

- Use **GET `/platform/v1/apps`** (Directory token) to locate the gateway app for this directory. Prefer a `payments` app that is internal/pre-installed for the business.
- `params.app_code_name` must match the selected app’s `app_code_name`.
- Generate a valid **Application token** (`tokens.app`) for that app using the OAuth service token flow:
  1) Create or identify the app (Directory token).
  2) Use the app’s `client_id` and `client_secret` to call **POST `/oauth/service/token`**.

```yaml
steps:
  - id: check_app_assignment
    description: "Check whether the payment app is already assigned to the business"
    method: GET
    path: "/v3/apps/app_assignments"
    token: directory
    params:
      assignee_type: business
      assignee_uid: "{{business_uid}}"
      app_code_name: "{{app_code_name}}"
    expect:
      status: 200
    extract:
      app_assignment_uid: "$.data.app_assignments[0].uid"
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_payment_gateways
    description: "Create a payment gateway for the app"
    method: POST
    path: "/v3/payment_processing/payment_gateways"
    token: app
    body:
      app_code_name: "{{app_code_name}}"
      gateway_logo_url: https://example.com/logo.png
      default_locale: en
      gateway_type: digital_wallet
      status: active
      main_gateway_benefits: [{"locale":"en","benefits":["Fast and secure payments"]}]
      brief_benefit_highlights: [{"locale":"en","highlights":["Easy integration"]}]
      supported_countries: ["US"]
      supported_currencies: ["USD"]
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
      status: [200, 201, 400]
```
