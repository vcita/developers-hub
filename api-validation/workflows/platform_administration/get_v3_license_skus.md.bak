---
endpoint: GET /v3/license/skus
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
timesReused: 0
---
# List SKUs

## Summary
Retrieves a list of all available SKUs (Stock Keeping Units) in the license system. SKUs are the foundational product codes that define what can be offered - packages, apps, and addons like SMS or staff seats. This endpoint is essential for obtaining valid SKU values before creating offerings.

## Prerequisites
Requires an **Internal Token** (admin token) to access this endpoint.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| - | - | - | - | - |

### Resolution Steps

No UIDs are required for this GET endpoint. Query parameters can be used to filter results.

```json
{}
```

## How to Resolve Parameters

**Query Parameters:**
- `type` (optional): Filter SKUs by type. Valid values: `package`, `app`, `addon`
- `code_name` (optional): Filter by specific SKU code name
- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Results per page (default: 25, max: 100)
- `sort` (optional): Sort order (default: "updated_at:desc")

## Critical Learnings

### SKU Types and Valid Code Names
- **package**: Main business subscription packages (e.g., "teams", "premium", "essentials")
- **app**: Marketplace apps - SKU code_name matches the app's code name
- **addon**: Additional products like "sms", "staff_seat", "module"

### SKU vs Offering Relationship
- SKUs are the product definitions
- Offerings are the commercial terms for selling SKUs (price, payment type, etc.)
- One SKU can have multiple offerings with different payment types/prices

## Request Template

Use this template for listing SKUs:

```json
{
  "method": "GET",
  "path": "/v3/license/skus",
  "query": {
    "type": "addon",
    "per_page": 25
  }
}
```

### Example: Get Package SKUs

```json
{
  "method": "GET",
  "path": "/v3/license/skus",
  "query": {
    "type": "package"
  }
}
```

### Example: Get Addon SKUs

```json
{
  "method": "GET",
  "path": "/v3/license/skus",
  "query": {
    "type": "addon"
  }
}
```
