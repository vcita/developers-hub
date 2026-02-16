---
endpoint: POST /v3/access_control/business_roles
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T10:51:45.143Z
verifiedAt: 2026-01-28T10:51:45.143Z
timesReused: 0
---
# Create Business roles

## Summary
Successfully created BusinessRole after resolving permission validation issues. The endpoint requires valid permission keys from GET /v3/access_control/permissions, and has hierarchical permission validation rules.

## Prerequisites

**IMPORTANT**: This endpoint requires TWO separate feature flags to be enabled:

### 1. Permissions Visibility Feature
- Enables GET /v3/access_control/permissions to return a non-empty list
- Without this, the permissions list will be empty

### 2. Role Configuration Feature  
- Enables creation and management of business roles
- Without this, POST/PUT operations return 403: "The staff role configuration feature is disabled"
- **Note**: A business can have permissions visible but still not have role configuration enabled

### Feature Check
Before testing this endpoint:
1. Verify GET /v3/access_control/permissions returns a non-empty list of permissions
2. Attempt a test POST to verify the role configuration feature is enabled

### Required Features
- Feature key: `roles_and_permissions_config` (for role creation/management)
- If not enabled, contact your administrator to enable this feature for the test business
- New businesses created via API may need additional feature enablement by an administrator

## Uniqueness Constraints

### Role Code Must Be Unique

**CRITICAL**: The `code` field must be unique across all business roles. Common codes like `admin`, `senior_manager`, `owner`, `staff` typically already exist as default roles.

**Before creating a role:**
1. Call `GET /v3/access_control/business_roles` to fetch existing roles
2. Extract all existing codes from `data.business_roles[].code`
3. Generate a unique code that does NOT match any existing code
4. Recommended: Use timestamp-based codes like `test_role_{timestamp}` (e.g., `test_role_1706455200000`)

**Common Default Roles to Avoid:**
- `admin`
- `owner`
- `staff`
- `senior_manager`
- `manager`
- `employee`

```json
{
  "existing_roles_check": {
    "source_endpoint": "GET /v3/access_control/business_roles",
    "extract_from": "data.business_roles[].code",
    "purpose": "Ensure generated code is unique",
    "strategy": "Generate timestamp-based code like test_role_{timestamp}"
  }
}
```

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| permissions[].key | GET /v3/access_control/permissions | data.permissions[].unique_code | - | Permission keys are system-defined and don't require cleanup |
| existing_codes (avoid) | GET /v3/access_control/business_roles | data.business_roles[].code | - | Used to generate unique code |

### Resolution Steps

**permissions[].key**:
1. Call `GET /v3/access_control/permissions`
2. Extract from response: `data.permissions[].unique_code`

**code (must be unique)**:
1. Call `GET /v3/access_control/business_roles`
2. Extract existing codes from: `data.business_roles[].code`
3. Generate a unique code NOT in the existing codes list
4. Use format: `test_role_{timestamp}` where timestamp is current epoch milliseconds

```json
{
  "permissions[].key": {
    "source_endpoint": "GET /v3/access_control/permissions",
    "extract_from": "data.permissions[].unique_code",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Permission keys are system-defined and don't require cleanup"
  },
  "code": {
    "uniqueness_check": {
      "source_endpoint": "GET /v3/access_control/business_roles",
      "extract_from": "data.business_roles[].code",
      "strategy": "generate_unique",
      "format": "test_role_{timestamp}"
    }
  }
}
```

## How to Resolve Parameters

**Step 1: Verify Feature is Enabled**
Call `GET /v3/access_control/permissions` and verify the response contains a non-empty list of permissions. If the list is empty, the roles_and_permissions feature is not enabled for this business.

**Step 2: Get Valid Permission Keys**
From the permissions list, extract category permissions (2 parts like `payments.manage`) and extended permissions (3 parts like `payments.invoices.export`).

**Step 3: Build Permission List with Hierarchy**
When including extended permissions, always include their parent category permission first. For example, to use `payments.invoices.export`, you must also include `payments.manage` with `allow: true`.

## Critical Learnings

1. **Feature Flag Required**: The business must have `roles_and_permissions` feature enabled. Without it, the endpoint returns 403 "The staff role configuration feature is disabled" and GET /v3/access_control/permissions returns empty.

2. **Permission Hierarchy**: Extended permissions (3 parts) require their category permission (2 parts) to be enabled. Example: `payments.invoices.export` requires `payments.manage`.

3. **Empty Permissions List**: If GET /v3/access_control/permissions returns an empty array, the feature is not enabled - do not attempt to create business roles.

4. **Validation Order**: The API validates permission hierarchy before creating the role. If a category permission is missing, it returns 400 with message like "Permission X must have category Y permission enabled".

5. **Role Code Must Be Unique**: The `code` field is a unique identifier for each business role. Using common codes like `admin`, `owner`, `staff`, `manager`, or `senior_manager` will result in a 500 error if those roles already exist (typically as default system roles). **Always generate timestamp-based unique codes** like `test_role_1706455200000` to avoid conflicts.

## Request Template

Use this template with dynamically resolved UIDs:

**IMPORTANT**: The `code` field MUST be unique. Use a timestamp-based code to ensure uniqueness.

```json
{
  "method": "POST",
  "path": "/v3/access_control/business_roles",
  "body": {
    "code": "test_role_{timestamp}",
    "name": "Test Role {timestamp}",
    "description": "Test role created for API validation with timestamp-based unique identifier",
    "is_editable": true,
    "permissions": [
      {
        "key": "campaigns.manage",
        "allow": true
      },
      {
        "key": "payments.manage",
        "allow": true
      },
      {
        "key": "payments.client_payments.manage",
        "allow": true
      }
    ]
  }
}
```

**Note**: Replace `{timestamp}` with the current epoch milliseconds (e.g., `test_role_1706455200000`). Do NOT use common role codes like `admin`, `owner`, `staff`, `manager`, `senior_manager` as these typically already exist.