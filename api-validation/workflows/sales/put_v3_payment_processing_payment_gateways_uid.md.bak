---
endpoint: PUT /v3/payment_processing/payment_gateways/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:41:27.128Z
verifiedAt: 2026-01-26T22:41:27.128Z
timesReused: 0
---
# Update Payment gateways

## Summary
Test passes after creating an app and payment gateway with valid values. Original test failed due to invalid placeholder values for URL, locale, country codes, and currency codes, plus missing app authentication.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| app_token | POST /platform/v1/apps | client_id and client_secret from response | - | - |
| payment_gateway_uid | GET /v3/payment_processing/payment_gateways | data.uid from created payment gateway | ✓ POST /v3/payment_processing/payment_gateways | DELETE /v3/payment_processing/payment_gateways/{uid} |

### Resolution Steps

**app_token**:
1. **Create fresh test entity**: `POST /platform/v1/apps`
   - Body template: `{"name":"Test Payment Gateway App","app_code_name":"testpaymentgateway{{timestamp}}","app_type":"widgets","redirect_uri":"https://example.com/callback"}`
2. Extract UID from creation response: `client_id and client_secret from response`
3. Run the test with this fresh UID

**payment_gateway_uid**:
1. **Create fresh test entity**: `POST /v3/payment_processing/payment_gateways`
   - Body template: `{"gateway_name":"Test Gateway","app_code_name":"testpaymentgateway{{timestamp}}","gateway_logo_url":"https://example.com/logo.png","default_locale":"en","gateway_type":"digital_wallet","status":"active"}`
2. Extract UID from creation response: `data.uid from created payment gateway`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /v3/payment_processing/payment_gateways/{uid}`

```json
{
  "app_token": {
    "source_endpoint": "POST /platform/v1/apps",
    "extract_from": "client_id and client_secret from response",
    "fallback_endpoint": "POST /oauth/service/token",
    "create_fresh": false,
    "create_endpoint": "POST /platform/v1/apps",
    "create_body": {
      "name": "Test Payment Gateway App",
      "app_code_name": "testpaymentgateway{{timestamp}}",
      "app_type": "widgets",
      "redirect_uri": "https://example.com/callback"
    },
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "payment_gateway_uid": {
    "source_endpoint": "GET /v3/payment_processing/payment_gateways",
    "extract_from": "data.uid from created payment gateway",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /v3/payment_processing/payment_gateways",
    "create_body": {
      "gateway_name": "Test Gateway",
      "app_code_name": "testpaymentgateway{{timestamp}}",
      "gateway_logo_url": "https://example.com/logo.png",
      "default_locale": "en",
      "gateway_type": "digital_wallet",
      "status": "active"
    },
    "cleanup_endpoint": "DELETE /v3/payment_processing/payment_gateways/{uid}",
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
  "method": "PUT",
  "path": "/v3/payment_processing/payment_gateways/{{resolved.uid}}",
  "body": {
    "gateway_logo_url": "https://example.com/logo.png",
    "default_locale": "en",
    "gateway_type": "digital_wallet",
    "status": "active",
    "main_gateway_benefits": [
      {
        "locale": "en",
        "benefits": [
          "Fast processing"
        ]
      }
    ],
    "brief_benefit_highlights": [
      {
        "locale": "en",
        "highlights": [
          "Secure payments"
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