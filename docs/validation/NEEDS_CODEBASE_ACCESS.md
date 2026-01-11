# Codebase Access Requests

**Purpose:** Track endpoints where source code cannot be found and additional codebase access is needed.

**⚠️ CRITICAL:** Do NOT make documentation changes for any endpoint listed here until the source code is available and verified.

---

## Current Requests

### ✅ Phase 3 (Communication) - RESOLVED

**All Phase 3 codebases have been added to the workspace. Deep verification completed.**

| Codebase | Status | Endpoints Verified |
|----------|--------|-------------------|
| voicecalls | ✅ Added | 10 endpoints - voice calls, settings, quotas, recordings, reports |
| phonenumbersmanager | ✅ Added | 5 endpoints - available/business phone numbers |
| notificationscenter | ✅ Added | 7 endpoints - notification templates, staff notifications |
| communication-gw | ✅ Added | 10 endpoints - channels, messages, sessions, oauth |

**Verification Findings:**
- Fixed `RequestDto` required fields in communication.json (all fields are optional per code)
- Fixed `features` parameter in available_phone_numbers (required, not optional)
- Fixed `external_uid` in CreateMessageDto (optional, not required)
- Added missing 500 error responses to business_phone_numbers endpoints

### ✅ Phase 4 (Sales) - RESOLVED

**All Phase 4 codebases have been added to the workspace. Deep verification completed.**

| Codebase | Status | Endpoints Verified |
|----------|--------|-------------------|
| payments | ✅ Added | 5 endpoints - payment_gateways, payment_gateway_assignments |

**Verification Findings:**
- Fixed GET payment_gateways description: Staff tokens are also allowed (not just Directory/Business/Client)
- Verified all DTOs match swagger documentation

### ✅ Phase 5 (Platform Administration) - RESOLVED

**All Phase 5 codebases have been added to the workspace. Deep verification completed.**

| Codebase | Status | Endpoints Verified |
|----------|--------|-------------------|
| subscriptionsmng | ✅ Added | 18 endpoints - offerings, directory_offerings, bundled_offerings, subscriptions, business_carts |
| permissionsmanager | ✅ Added | 17 endpoints - permissions, business_roles, staff_business_roles, staff_permissions, staff_permission_overrides_lists |

**Verification Findings:**
- Fixed POST /business_roles response code: 201 (not 200)
- Fixed POST /staff_business_roles response code: 201 (not 200)
- Added missing DELETE /staff_business_roles/{staff_uid} endpoint to documentation
- Added feature flag documentation for business_roles PUT/DELETE (staff_role_permissions)
- Added 403 Forbidden response for feature flag checks

### Summary

| Phase | Total Blocked | Codebases Needed | Status |
|-------|---------------|------------------|--------|
| Phase 3 (Communication) | 32 endpoints | voice-calls-service, phone-numbers-manager, notifications-center, commgw | ✅ RESOLVED |
| Phase 4 (Sales) | 5 endpoints | payments-service | ✅ RESOLVED |
| Phase 5 (Platform Admin) | 35 endpoints | subscription-manager, permissions-manager | ✅ RESOLVED |
| **Total** | **72 endpoints** | **6 codebases** | ✅ ALL RESOLVED |

**✅ v3 Scheduling endpoints have source code access (availability, resources projects)**
**✅ Phase 3 Communication endpoints have source code access (voicecalls, phonenumbersmanager, notificationscenter, communication-gw projects)**
**✅ Phase 4 Sales endpoints have source code access (payments project)**
**✅ Phase 5 Platform Admin endpoints have source code access (subscriptionsmng, permissionsmanager projects)**

---

## Available Codebases

| Codebase | Path | Status | Domains Covered |
|----------|------|--------|-----------------|
| core | `C:\Programming\core` | ✅ Available | Clients, Communication, Sales, Scheduling (v1), Platform Admin, Apps, Reviews |
| aiplatform | `C:\Programming\aiplatform` | ✅ Available | AI (BizAI, Recommendations, Staff AI Settings, Generation Feedback) |
| apigw | `C:\Programming\apigw` | ✅ Available | API Gateway routing (no business logic) |
| client-portal | `C:\Programming\client-portal` | ✅ Available | Frontend only (no API implementation) |
| availability | `C:\Programming\availability` | ✅ Available | Scheduling (v3): availability_slots, business_availabilities |
| resources | `C:\Programming\resources` | ✅ Available | Scheduling (v3): resource_types, resources |
| voicecalls | `C:\Programming\voicecalls` | ✅ Available | Communication (v3): voice_calls, voice_call_settings, voice_call_quotas, voice_call_recordings, reports |
| phonenumbersmanager | `C:\Programming\phonenumbersmanager` | ✅ Available | Communication (v3): available_phone_numbers, business_phone_numbers |
| notificationscenter | `C:\Programming\notificationscenter` | ✅ Available | Communication (v3): notification_templates, staff_notifications |
| communication-gw | `C:\Programming\communication-gw` | ✅ Available | Communication: channels, messages, sessions, oauth |
| payments | `C:\Programming\payments` | ✅ Available | Sales (v3): payment_gateways, payment_gateway_assignments |
| subscriptionsmng | `C:\Programming\subscriptionsmng` | ✅ Available | License (v3): offerings, directory_offerings, bundled_offerings, subscriptions, business_carts |
| permissionsmanager | `C:\Programming\permissionsmanager` | ✅ Available | Access Control (v3): permissions, business_roles, staff_business_roles, staff_permissions, staff_permission_overrides_lists |

---

## ✅ All Codebases Resolved

All previously blocked codebases have been added to the workspace and verified:

### Phase 3 (Communication)

| Codebase | Environment Variable | APIs Covered | Status |
|----------|---------------------|--------------|--------|
| voicecalls | `${VOICECALLS_HOST}` | `/v3/communication/voice_calls`, voice_call_quotas, recordings, settings | ✅ Verified |
| phonenumbersmanager | `${PHONENUMBERSMANAGER_HOST}` | `/v3/communication/available_phone_numbers`, business_phone_numbers | ✅ Verified |
| notificationscenter | `${NOTIFICATIONSCENTER_HOST}` | `/v3/communication/staff_notifications`, notification_templates | ✅ Verified |
| communication-gw | `${COMMGW_HOST}` | `/business/communication/` channels, messages, sessions, oauth | ✅ Verified |

### Phase 4 (Sales)

| Codebase | Environment Variable | APIs Covered | Status |
|----------|---------------------|--------------|--------|
| payments | `${PAYMENTS_HOST}` | `/v3/payment_processing/payment_gateways`, payment_gateway_assignments | ✅ Verified |

### Phase 5 (Platform Administration)

| Codebase | Environment Variable | APIs Covered | Status |
|----------|---------------------|--------------|--------|
| subscriptionsmng | `${SUBSCRIPTIONMNG_HOST}` | `/v3/license/` offerings, subscriptions, business_carts | ✅ Verified |
| permissionsmanager | `${PERMISSIONSMANAGER_HOST}` | `/v3/access_control/` permissions, business_roles, staff_permissions | ✅ Verified |

### Other Codebases (May Need for Future Phases)

| Codebase | Environment Variable | APIs That Need It | Phase |
|----------|---------------------|-------------------|-------|
| authbridge | `${AUTHBRIDGE_HOST}` | `/v3/integrations/idp_actor_mappings`, `/authbridge` | Phase 6 |
| widgets-manager | `${WIDGETS_MANAGER_HOST}` | `/v3/apps/widgets`, staff_widgets_boards | Phase 6 |
| harbor | `${HARBOR_HOST}` | `/v3/integrations/import_jobs`, import_job_items | Phase 6 |
| einvoicing | `${EINVOICING_HOST}` | `/v3/payments/invoices`, credit_notes | Future |

---

## How to Request Access

When you identify an endpoint that needs a codebase not currently available:

1. **Add to this file** with:
   - Endpoint path
   - Domain
   - Expected codebase name
   - Reason why current codebases don't have it

2. **Stop work** on that endpoint

3. **Notify** the project owner to add the codebase to the workspace

---

## Resolution Log

| Date | Codebase | Added By | Endpoints Unblocked |
|------|----------|----------|---------------------|
| 2026-01-11 | core | Initial | Multiple v1 endpoints |
| 2026-01-11 | aiplatform | User | AI domain |
| 2026-01-11 | apigw | User | - |
| 2026-01-11 | client-portal | User | - |
| 2026-01-11 | availability | User | 3 endpoints: `/v3/scheduling/availability_slots`, `/v3/scheduling/business_availabilities`, `/v3/scheduling/business_availabilities/{business_uid}` |
| 2026-01-11 | resources | User | 10 endpoints: all `/v3/scheduling/resource_types` and `/v3/scheduling/resources` endpoints |
| 2026-01-11 | voicecalls | User | 10 endpoints: `/v3/communication/voice_calls`, voice_call_settings, voice_call_quotas, voice_call_recordings, reports |
| 2026-01-11 | phonenumbersmanager | User | 5 endpoints: `/v3/communication/available_phone_numbers`, business_phone_numbers |
| 2026-01-11 | notificationscenter | User | 7 endpoints: `/v3/communication/notification_templates`, staff_notifications |
| 2026-01-11 | communication-gw | User | 10 endpoints: `/business/communication/` channels, messages, sessions, oauth |
| 2026-01-11 | payments | User | 5 endpoints: `/v3/payment_processing/payment_gateways`, payment_gateway_assignments |
| 2026-01-11 | subscriptionsmng | User | 18 endpoints: `/v3/license/` offerings, directory_offerings, bundled_offerings, subscriptions, business_carts |
| 2026-01-11 | permissionsmanager | User | 17 endpoints: `/v3/access_control/` permissions, business_roles, staff_business_roles, staff_permissions, staff_permission_overrides_lists |

---

## Notes

```
2026-01-11: User added availability and resources projects. All v3 scheduling endpoints now have source code access.
2026-01-11: Deep verification of Phases 3-5 revealed 67 endpoints in external microservices that cannot be verified without codebase access.
           - Phase 3: 32 endpoints (voice-calls, phone-numbers, notifications-center, commgw)
           - Phase 4: 5 endpoints (payments-service)
           - Phase 5: 30 endpoints (subscription-manager, permissions-manager)
           
           Documentation changes were made (error codes added) but parameter/response field accuracy CANNOT be confirmed.

2026-01-11: User added Phase 3 codebases (voicecalls, phonenumbersmanager, notificationscenter, communication-gw).
           - Deep verification completed for all 32 Phase 3 endpoints
           - Found and fixed 4 discrepancies:
             1. communication.json: RequestDto/UpdateRequestDto had all fields marked as required, but code has all @IsOptional()
             2. business_phone_numbers.json: features parameter marked as optional, but code has @IsNotEmpty() (required)
             3. communication.json (legacy): external_uid marked as required, but code has @IsOptional()
             4. business_phone_numbers.json: Missing 500 error responses on several endpoints
           - Phase 3 is now fully verified against source code

2026-01-11: User added Phase 4 and 5 codebases (payments, subscriptionsmng, permissionsmanager).
           - Deep verification completed for all Phase 4 (5 endpoints) and Phase 5 (35 endpoints)
           - Found and fixed discrepancies:
             Phase 4 (payments):
             1. payment_gateway.json: GET description missing Staff tokens as allowed actors
             
             Phase 5 (permissionsmanager):
             1. access_control.json: POST /business_roles returned 200, should be 201
             2. access_control.json: POST /staff_business_roles returned 200, should be 201
             3. access_control.json: Missing DELETE /staff_business_roles/{staff_uid} endpoint entirely
             4. access_control.json: Missing 403 response for feature flag checks on PUT/DELETE business_roles
             5. access_control.json: Added x-vcita-feature-flags for staff_role_permissions requirement
           - Phases 4 and 5 are now fully verified against source code
```
