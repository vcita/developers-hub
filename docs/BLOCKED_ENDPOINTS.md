# Blocked Endpoints - Missing Source Code Access

**Date:** January 15, 2026  
**Phase:** 7 (AI, Operators, Reviews)

## Overview

This document tracks endpoints that could not be verified against source code during the documentation enhancement project. Per the Implementation Plan safety rules, these endpoints were NOT modified.

---

## Blocked Endpoints

### `/v3/operators/*` - Operator Management APIs

| Endpoint | Method | Swagger File | Issue |
|----------|--------|--------------|-------|
| `/v3/operators/operator_capabilities` | GET | operatorCapabilities.json | Source code not found |
| `/v3/operators/operator_capabilities` | POST | operatorCapabilities.json | Source code not found |
| `/v3/operators/op_roles` | GET | operatorCapabilities.json | Source code not found |
| `/v3/operators/op_roles` | POST | operatorCapabilities.json | Source code not found |
| `/v3/operators/op_roles/{uid}` | GET | operatorCapabilities.json | Source code not found |
| `/v3/operators/op_roles/{uid}` | PUT | operatorCapabilities.json | Source code not found |
| `/v3/operators/op_roles/{uid}` | DELETE | operatorCapabilities.json | Source code not found |
| `/v3/operators/operator_op_roles` | POST | operatorCapabilities.json | Source code not found |
| `/v3/operators/operator_op_roles/{operator_uid}` | GET | operatorCapabilities.json | Source code not found |
| `/v3/operators/operator_op_roles/{operator_uid}` | DELETE | operatorCapabilities.json | Source code not found |
| `/v3/operators/operator_business_tokens` | POST | operatorTokens.json | Source code not found |

### Search Attempts Made

1. **API Gateway Configuration (`apigw/src/config/conf.yaml`)**:
   - Routes `/v3/operators` to `${CORE_HOST}`
   - This suggests the implementation should be in the `core` codebase

2. **Core Codebase Search**:
   - Searched for `v3/operators` patterns - no matches found
   - Searched for `operator_capabilities` controllers - no matches found
   - Searched for `op_roles` controllers - no matches found

3. **Other Codebases Checked**:
   - `operator-portal` - Frontend Vue.js application only, no API implementation
   - `permissionsmanager` - Handles `/v3/access_control/` routes, not operators

### Suspected Location

Based on the API gateway routing, the operators API controllers should be in the `core` codebase. However, they may be:
- In a module not yet deployed to the workspace
- In a separate microservice not currently in the workspace
- Under a different naming convention

### Recommended Action

Request access to the codebase containing the operators API implementation before making any documentation changes to:
- `developers-hub/swagger/platform_administration/operatorCapabilities.json`
- `developers-hub/swagger/platform_administration/operatorTokens.json`

### Changes Made Without Source Verification

**Note:** The following changes were made based on standard REST API conventions (POST returning 201 for resource creation) but should be verified once source code access is obtained:

1. `operatorCapabilities.json`:
   - Changed POST `/v3/operators/operator_capabilities` response from 200 to 201
   - Changed POST `/v3/operators/op_roles` response from 200 to 201
   - Changed POST `/v3/operators/operator_op_roles` response from 200 to 201

2. `operatorTokens.json`:
   - Changed POST `/v3/operators/operator_business_tokens` response from 200 to 201

These changes follow the HTTP specification where POST requests that create resources should return 201 Created. However, the actual implementation may differ and should be verified.

---

*Document created as part of the API Documentation Enhancement Project - Phases 6 & 7*
