---
endpoint: POST /v3/license/offerings
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
timesReused: 0
---
# Create Offerings

## Summary
Creates a new offering in the license system. An offering represents commercial terms for selling a SKU, including pricing, payment type, and other metadata. Requires an **admin token** and a valid SKU from the SKUs endpoint.

## Prerequisites
1. Requires **admin token** for authentication
2. Must obtain a valid SKU code_name from `GET /v3/license/skus` endpoint

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| SKU | GET /v3/license/skus | data.skus[].code_name | No | N/A |

### Resolution Steps

**SKU**:
1. Call `GET /v3/license/skus` with appropriate type filter
2. Extract the `code_name` field from response `data.skus[].code_name`
3. Match the SKU type with the offering type (package SKU for package offering, addon SKU for addon offering)

```json
{
  "SKU": {
    "source_endpoint": "GET /v3/license/skus",
    "extract_from": "data.skus[].code_name",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "SKUs are system entities, no cleanup needed"
  }
}
```

## How to Resolve Parameters

### Step 1: Get SKU List (REQUIRED PRE-REQUEST)
Before creating an offering, you MUST call the SKU endpoint to get valid SKU values:

```
GET /v3/license/skus?type={type}
```

Where `{type}` matches your intended offering type:
- For `type: "package"` offering → call `GET /v3/license/skus?type=package`
- For `type: "addon"` offering → call `GET /v3/license/skus?type=addon`
- For `type: "app"` offering → call `GET /v3/license/skus?type=app`

### Step 2: Extract SKU code_name
From the SKU list response, extract a valid `code_name` value:
```json
{
  "data": {
    "skus": [
      { "code_name": "sms", "type": "addon", ... },
      { "code_name": "staff_seat", "type": "addon", ... }
    ]
  }
}
```

### Step 3: Use SKU in Offering Request
Use the extracted `code_name` as the `SKU` field value in your POST request

## Critical Learnings

### Business Rules

**Type and SKU Relationship:**
- `type: "package"` - Use SKUs from `GET /v3/license/skus?type=package` (e.g., "teams", "premium", "essentials")
- `type: "addon"` - Use SKUs from `GET /v3/license/skus?type=addon` (e.g., "sms", "staff_seat", "module")
- `type: "app"` - Use SKUs from `GET /v3/license/skus?type=app` (SKU matches app code_name)

**Payment Type and Price Rules:**
- `payment_type: "free"` - price MUST be 0
- `payment_type: "monthly"` - price must be > 0
- `payment_type: "annual"` - price must be > 0
- `payment_type: "single_charge"` - price must be > 0
- `payment_type: "external"` - price can be any value (payment handled externally)
- `payment_type: "bundle"` - bundled with another subscription

**Valid Reporting Tags:**
Use hyphen-separated values:
- `business-management`
- `no-payments`
- `no-marketing`
- `no-scheduling`
- `connect`
- `free`
- `ghost`
- `trial`
- `test`

### Common Errors
1. **Invalid SKU**: Using a SKU that doesn't exist or doesn't match the offering type
2. **Price/Payment mismatch**: Using `payment_type: "free"` with non-zero price
3. **Missing required fields**: `type`, `SKU`, `display_name`, `quantity`, `payment_type`, `prices` are all required

## Request Template

Use this template with dynamically resolved SKU:

```json
{
  "method": "POST",
  "path": "/v3/license/offerings",
  "body": {
    "type": "addon",
    "SKU": "{{resolved.SKU}}",
    "display_name": "SMS Pack 100",
    "quantity": 100,
    "payment_type": "monthly",
    "is_active": true,
    "vendor": "inTandem",
    "prices": [
      {
        "price": 5.00,
        "currency": "USD"
      },
      {
        "price": 5.00,
        "currency": "EUR"
      }
    ],
    "trial": 14,
    "reporting_tags": [
      "business-management"
    ]
  }
}
```

### Example: Free Addon Offering

```json
{
  "method": "POST",
  "path": "/v3/license/offerings",
  "body": {
    "type": "addon",
    "SKU": "sms",
    "display_name": "Free SMS Trial",
    "quantity": 10,
    "payment_type": "free",
    "is_active": true,
    "vendor": "inTandem",
    "prices": [
      {
        "price": 0,
        "currency": "USD"
      }
    ]
  }
}
```

### Example: Package Offering

```json
{
  "method": "POST",
  "path": "/v3/license/offerings",
  "body": {
    "type": "package",
    "SKU": "teams",
    "display_name": "Teams Monthly",
    "quantity": 1,
    "payment_type": "monthly",
    "is_active": true,
    "vendor": "inTandem",
    "prices": [
      {
        "price": 49.00,
        "currency": "USD"
      }
    ],
    "trial": 14,
    "reporting_tags": [
      "business-management"
    ]
  }
}
```
