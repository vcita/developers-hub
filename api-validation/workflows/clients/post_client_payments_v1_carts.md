---
endpoint: POST /client/payments/v1/carts
domain: clients
tags: []
status: success
savedAt: 2026-02-02T21:14:00.945Z
verifiedAt: 2026-02-02T21:14:00.945Z
timesReused: 0
---
# Create Carts

## Summary
Successfully created cart after discovering that entity_type must be one of the valid ACTIVITY_TYPES values. Original request failed because 'deposit' is not a valid entity_type - changed to 'Meeting' which is valid.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | GET /business/clients/v1/matters | Use matter_uid from available parameters | - | Use existing matter from parameters |
| entity_uid | GET /platform/v1/scheduling/appointments | data.appointments[0].id | - | Use existing appointment - no cleanup needed |

### Resolution Steps

**matter_uid**:
1. Call `GET /business/clients/v1/matters`
2. Extract from response: `Use matter_uid from available parameters`

**entity_uid**:
1. Call `GET /platform/v1/scheduling/appointments`
2. Extract from response: `data.appointments[0].id`

```json
{
  "matter_uid": {
    "source_endpoint": "GET /business/clients/v1/matters",
    "extract_from": "Use matter_uid from available parameters",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Use existing matter from parameters"
  },
  "entity_uid": {
    "source_endpoint": "GET /platform/v1/scheduling/appointments",
    "extract_from": "data.appointments[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Use existing appointment - no cleanup needed"
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
  "path": "/client/payments/v1/carts",
  "body": {
    "cart": {
      "currency": "USD",
      "items": [
        {
          "entity_type": "Meeting",
          "entity_uid": "{{resolved.entity_uid}}"
        }
      ],
      "matter_uid": "{{config.params.matter_uid}}"
    }
  }
}
```

## Code Analysis

Source code exploration results from the healing process:

**Service**: core
**Controller**: modules/payments/app/controllers/client/payments/v1/carts_controller.rb (lines 4-14)
**DTO/Model**: modules/payments/app/components/payments/carts_api.rb (lines 11, 567-569)


## Discrepancies Found

Differences between swagger documentation and actual code:

| Aspect | Field | Swagger Says | Code Says | Evidence |
|--------|-------|--------------|-----------|----------|
| validation_rule | entity_type | No enum values documented | Must be one of: ['Invoice', 'Meeting', 'EventAttendance', 'ProductOrder', 'ClientBookingPackage', 'Cart', 'PendingBooking'] | - |


## Swagger Changes Required

Documentation changes needed based on code analysis:

### 1. cart.items.entity_type

- **File**: swagger/client/payments/carts.json
- **Change Type**: add_enum_values
- **Current**: type: string with no enum constraint
- **Should be**: type: string with enum: ['Invoice', 'Meeting', 'EventAttendance', 'ProductOrder', 'ClientBookingPackage', 'Cart', 'PendingBooking']
- **Evidence**: modules/payments/app/components/payments/carts_api.rb:11
  ```
  ACTIVITY_TYPES = ['Invoice', 'Meeting', 'EventAttendance', 'ProductOrder', 'ClientBookingPackage', 'Cart', 'PendingBooking']
  ```
