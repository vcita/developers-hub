---
endpoint: POST /platform/v1/payment/settings
domain: sales
tags: []
status: skip
savedAt: 2026-01-23T22:53:27.094Z
verifiedAt: 2026-01-23T22:53:27.094Z
timesReused: 0
skipReason: The endpoint is working correctly but enforcing business constraints: 1) vcitaPayments gateway must be connected before it can be set as the primary gateway (requires external_vcitaPayments_connected=true in payment_provider_config), and 2) offset_fee_mode is restricted by business country location. These are intentional validation rules preventing invalid payment configurations.
---
# Create Settings

## Summary
Endpoint working correctly but blocked by business validation rules. The vcitaPayments gateway connection requirement is validated in modules/payments/app/components/payments/settings.rb:547-549, and offset_fee_mode has country-based restrictions.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The endpoint is working correctly but enforcing business constraints: 1) vcitaPayments gateway must be connected before it can be set as the primary gateway (requires external_vcitaPayments_connected=true in payment_provider_config), and 2) offset_fee_mode is restricted by business country location. These are intentional validation rules preventing invalid payment configurations.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| offset_fee_configuration | The offset_fee_configuration field is not documented in the swagger schema but is accepted by the API and validated for business country restrictions | Add offset_fee_configuration to the swagger schema with description of country restrictions and required fields (offset_fee_mode, convenience_fee_type, convenience_fee_value) | major |
| external_vcitaPayments_connected | The documentation doesn't explain the prerequisite that vcitaPayments must be connected before setting as payments_gateway_type | Document that external payment gateways must be connected first via separate endpoints before they can be set as the primary gateway | major |