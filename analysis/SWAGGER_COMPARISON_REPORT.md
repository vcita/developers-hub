# Legacy Swagger API Comparison Report

## Executive Summary

This report provides a comprehensive comparison between the endpoints defined in the `/legacy_swagger` folder and their corresponding definitions in the `/swagger/*/legacy` folders.

### Overview Statistics

| Metric | Count |
|--------|-------|
| **Total Endpoints in v1platform.json** | 104 |
| **Total Endpoints in subscription_manager.json** | 1 |
| **Total Endpoints in New Legacy Files** | 96 |
| **Successfully Matched Endpoints** | 95 |
| **Missing Endpoints in New Structure** | 10 |
| **Response Code Mismatches** | 0 |

## Detailed Findings

### ✅ 1. Response Codes Verification

**Result: ALL CORRECT ✓**

All 95 matched endpoints have **identical response codes** between the original legacy_swagger files and the new swagger/*/legacy files. This indicates perfect alignment in error handling and HTTP status code definitions.

### ⚠️ 2. Missing Endpoints

The following **10 endpoints** from `legacy_swagger/v1platform.json` are **NOT found** in the new legacy swagger structure:

#### 1. `POST /system/subscriptions/manual`
- **Source**: `legacy_swagger/subscription_manager.json`
- **Status**: Not found in any swagger/*/legacy files

#### 2. `GET /categories`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 3. `GET /categories/{category_id}/services`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 4. `GET /fields`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 5. `POST /fields`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 6. `DELETE /fields/{field_id}`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 7. `GET /fields/{field_id}`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 8. `PUT /fields/{field_id}`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 9. `GET /forms`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files

#### 10. `PUT /forms`
- **Source**: `legacy_swagger/v1platform.json`
- **Status**: Not found in any swagger/*/legacy files


### ✅ 3. Matched Endpoints by Domain

The following endpoints were successfully matched and verified:

#### Apps Domain
**File**: `swagger/apps/legacy/legacy_v1_apps.json`

**Matched Endpoints**: 8

- `GET /apps` - Response codes: 201
- `GET /apps/{id}` - Response codes: 200
- `POST /apps` - Response codes: 201
- `POST /apps/{id}/assign` - Response codes: 201
- `POST /apps/{id}/install_app` - Response codes: 201, 422
- `POST /apps/{id}/unassign` - Response codes: 201
- `POST /apps/{id}/uninstall_app` - Response codes: 201, 422
- `PUT /apps/{id}` - Response codes: 200

#### Clients Domain
**File**: `swagger/clients/legacy/legacy_v1_clients.json`

**Matched Endpoints**: 15

- `DELETE /clients/{client_id}` - Response codes: 200
- `GET /clients` - Response codes: 200
- `GET /clients/merges/possible_merge_master` - Response codes: 200
- `GET /clients/payment/client_packages/validate` - Response codes: 200, 422
- `GET /clients/{client_id}` - Response codes: 200
- `GET /clients/{client_id}/conversations` - Response codes: 200
- `GET /clients/{client_id}/documents` - Response codes: 200
- `GET /clients/{client_id}/estimates` - Response codes: 200
- `GET /clients/{client_id}/invoices` - Response codes: 201
- `GET /clients/{client_id}/payment/client_packages` - Response codes: 200, 422
- `GET /clients/{client_id}/payments` - Response codes: 201
- `POST /clients` - Response codes: 201
- `POST /clients/payment/client_packages/update_usage` - Response codes: 200, 422
- `PUT /clients/merges/merge_clients` - Response codes: 200
- `PUT /clients/{client_id}` - Response codes: 200

#### Communication Domain
**File**: `swagger/communication/legacy/legacy_v1_communication.json`

**Matched Endpoints**: 6

- `DELETE /numbers/twilio/{sub_account_id}` - Response codes: 200
- `GET /conversations` - Response codes: 200
- `POST /messages` - Response codes: 201
- `POST /numbers/dedicated_numbers/assign` - Response codes: 201
- `POST /numbers/twilio` - Response codes: 201
- `PUT /numbers/dedicated_numbers/set_two_way_texting_status` - Response codes: 200

#### Platform Administration Domain
**File**: `swagger/platform_administration/legacy/legacy_v1_platform.json`

**Matched Endpoints**: 26

- `DELETE /businesses/{business_id}/staffs/{staff_id}` - Response codes: 200
- `DELETE /businesses/{business_id}/staffs/{staff_id}/sessions` - Response codes: 200
- `GET /businesses` - Response codes: 200
- `GET /businesses/validate_login` - Response codes: 200
- `GET /businesses/{business_id}` - Response codes: 200
- `GET /businesses/{business_id}/features` - Response codes: 200
- `GET /businesses/{business_id}/recurly_data` - Response codes: 200
- `GET /businesses/{business_id}/staffs` - Response codes: 200
- `GET /businesses/{business_id}/staffs/{staff_id}` - Response codes: 200
- `GET /businesses/{business_id}/wizards` - Response codes: 200
- `GET /businesses/{business_id}/wizards/{wizard_name}` - Response codes: 200
- `GET /directory/branding` - Response codes: 200
- `GET /scheduling/staff` - Response codes: 200
- `GET /scheduling/staff/{staff_id}` - Response codes: 200
- `GET /tokens` - Response codes: 201
- `GET /webhooks` - Response codes: 200
- `POST /businesses` - Response codes: 200
- `POST /businesses/verify_audience_claim` - Response codes: 200
- `POST /businesses/{business_id}` - Response codes: 200, 400
- `POST /businesses/{business_id}/staffs` - Response codes: 200
- `POST /tokens` - Response codes: 201
- `POST /tokens/revoke` - Response codes: 201
- `POST /webhook/subscribe` - Response codes: 201
- `POST /webhook/unsubscribe` - Response codes: 201
- `PUT /businesses/{business_id}/purchased_items` - Response codes: 200
- `PUT /businesses/{business_id}/wizards/{wizard_name}` - Response codes: 200

#### Sales Domain
**File**: `swagger/sales/legacy/legacy_v1_sales.json`

**Matched Endpoints**: 30

- `DELETE /payment/cards/{card_id}` - Response codes: 200, 422
- `GET /estimates` - Response codes: 200
- `GET /invoices` - Response codes: 201
- `GET /invoices/{invoice_id}` - Response codes: 201
- `GET /payment/checkout/{url_key}` - Response codes: 201
- `GET /payment/packages` - Response codes: 200, 422
- `GET /payment/packages/{package_id}` - Response codes: 200, 422
- `GET /payment/settings` - Response codes: 201
- `GET /payment_statuses/{id}/validate_coupon` - Response codes: 200, 422
- `GET /payments` - Response codes: 201
- `GET /payments/{payment_id}` - Response codes: 201
- `GET /services` - Response codes: 200
- `GET /services/availability` - Response codes: 200
- `GET /services/{service_id}` - Response codes: 200
- `GET /services/{service_id}/availability` - Response codes: 200
- `POST /estimates` - Response codes: 201
- `POST /invoices` - Response codes: 201
- `POST /leadgen` - Response codes: 201
- `POST /payment/cards/sync_card` - Response codes: 201
- `POST /payment/client_packages` - Response codes: 201, 422
- `POST /payment/client_packages/update_usage` - Response codes: 200, 422
- `POST /payment/packages` - Response codes: 201, 422
- `POST /payment/settings` - Response codes: 201
- `POST /payments` - Response codes: 201
- `POST /payments/{payment_uid}/match` - Response codes: 201
- `PUT /payment/checkout/` - Response codes: 201
- `PUT /payment/client_packages/cancel_redemption` - Response codes: 200, 422
- `PUT /payment/packages/{package_id}` - Response codes: 200, 422
- `PUT /payment/settings/update_default_currency` - Response codes: 201
- `PUT /payment_statuses/{id}/apply_coupon` - Response codes: 200, 422

#### Scheduling Domain
**File**: `swagger/scheduling/legacy/legacy_v1_scheduling.json`

**Matched Endpoints**: 10

- `GET /scheduling/appointments` - Response codes: 200
- `GET /scheduling/appointments/{appointment_id}` - Response codes: 200
- `GET /scheduling/bookings` - Response codes: 200
- `GET /scheduling/event_attendances/{event_attendance_uid}` - Response codes: 200
- `GET /scheduling/event_instance/{event_instance_id}` - Response codes: 200
- `POST /scheduling/bookings` - Response codes: 201, 422
- `POST /scheduling/bookings/cancel` - Response codes: 200
- `POST /scheduling/waitlist` - Response codes: 201, 422
- `PUT /scheduling/bookings/{booking_uid}/update_rsvp_state` - Response codes: 200
- `PUT /scheduling/waitlist/cancel` - Response codes: 200


## Recommendations

### 1. Address Missing Endpoints

The 10 missing endpoints should be evaluated:

- **Subscription Manager Endpoint**: The `/system/subscriptions/manual` endpoint from `subscription_manager.json` is not present in the new structure. Verify if this endpoint:
  - Should be migrated to a new legacy file
  - Has been replaced by a v3 API
  - Is intentionally deprecated

- **Categories Endpoints** (2 endpoints): `GET /categories` and `GET /categories/{category_id}/services`
  - Determine if these should be in a separate categories legacy file
  - Check if they've been migrated to v3 APIs

- **Fields Endpoints** (5 endpoints): All CRUD operations for `/fields` and `/fields/{field_id}`
  - Verify migration status to v3
  - Consider creating a fields legacy file if still needed

- **Forms Endpoints** (2 endpoints): `GET /forms` and `PUT /forms`
  - Check if forms API has been migrated to v3
  - Determine if legacy support is still needed

### 2. Field-Level Validation

While response codes match perfectly, the next step should include:
- **Schema validation**: Compare request/response body schemas field-by-field
- **Parameter validation**: Verify all query parameters, path parameters, and headers are identical
- **Description accuracy**: Ensure documentation strings are consistent

### 3. Testing Recommendations

- Create integration tests to verify all matched endpoints behave identically
- Validate that missing endpoints are properly handled (either deprecated or migrated)
- Test edge cases for all error response codes

## Conclusion

The migration of legacy swagger definitions shows **excellent consistency**:
- ✅ **100% response code accuracy** for all matched endpoints
- ✅ **91% endpoint coverage** (95 out of 105 endpoints matched)
- ⚠️ **10 endpoints require attention** for migration or deprecation

The overall quality of the migration is **very high**, with only minor gaps that need to be addressed for complete parity.

---

**Report Generated**: Auto-generated comparison report  
**Tool**: Python-based swagger comparison script  
**Confidence Level**: High (automated comparison of 105 endpoints)
