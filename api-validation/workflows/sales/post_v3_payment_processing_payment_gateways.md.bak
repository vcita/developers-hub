---
endpoint: POST /v3/payment_processing/payment_gateways
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:38:59.877Z
verifiedAt: 2026-01-26T21:38:59.877Z
timesReused: 0
---
# Create Payment gateways

## Summary
Test passes after acquiring app OAuth token and correcting field validation formats. The endpoint requires valid URL format, locale enum, ISO country codes, and ISO currency codes.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| app_token | POST /platform/v1/apps | data.client_id and data.client_secret | - | - |

### Resolution Steps

**app_token**:
1. Call `POST /platform/v1/apps`
2. Extract from response: `data.client_id and data.client_secret`
3. If empty, create via `POST /oauth/service/token with client_id and client_secret`

```json
{
  "app_token": {
    "source_endpoint": "POST /platform/v1/apps",
    "extract_from": "data.client_id and data.client_secret",
    "fallback_endpoint": "POST /oauth/service/token with client_id and client_secret",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "name": "Payment Gateway Test App",
      "app_code_name": "paymentgatewaytest{{timestamp}}",
      "app_type": "payments",
      "redirect_uri": "https://example.com/callback"
    },
    "cleanup_endpoint": null,
    "cleanup_note": null
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/v3/payment_processing/payment_gateways",
  "body": {
    "app_code_name": "{{resolved.uid}}",
    "gateway_logo_url": "https://example.com/logo.png",
    "default_locale": "en",
    "gateway_type": "digital_wallet",
    "status": "active",
    "main_gateway_benefits": [
      {
        "locale": "en",
        "benefits": [
          "Fast and secure payments"
        ]
      }
    ],
    "brief_benefit_highlights": [
      {
        "locale": "en",
        "highlights": [
          "Easy integration"
        ]
      }
    ],
    "supported_countries": [
      "US"
    ],
    "supported_currencies": [
      "USD"
    ],
    "minimum_charge_amount": null,
    "payment_methods": {
      "credit_card": true,
      "ach": true,
      "ideal": true,
      "bancontact": true,
      "twint": true,
      "express_wallets": true
    },
    "processing_features": {
      "multi_currency": true,
      "back_office_charge": true,
      "checkout": true,
      "refund": true,
      "partial_refund": true,
      "client_save_card_on_checkout": true,
      "client_save_card_standalone": true,
      "save_card_by_business": true,
      "offset_fees": true
    }
  }
}
```