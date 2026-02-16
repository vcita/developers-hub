---
endpoint: PUT /v3/access_control/staff_permission_overrides_lists/{staff_uid}
domain: platform_administration
tags: [access_control, permissions]
status: success
savedAt: 2026-01-29T21:00:00.000Z
verifiedAt: 2026-01-29T21:00:00.000Z
timesReused: 0
---
# Update Staff Permission Overrides List

## Summary
Update permission overrides for a staff member. This workflow creates a new staff, retrieves their assigned business role, extracts the permissions from that role, and then sets permission overrides for the staff member.

## Prerequisites
- Valid Staff Token with permissions to manage staff and access control
- Business must have at least one BusinessRole defined

## Workflow Steps

### Step 1: Create a New Staff Member
Create a new staff member to get a fresh staff_uid.

**Endpoint**: `POST /platform/v1/businesses/{business_uid}/staffs`

```json
{
  "method": "POST",
  "path": "/platform/v1/businesses/{{params.business_uid}}/staffs",
  "token_type": "staff",
  "body": {
    "meta": {
      "invite": "false"
    },
    "staff": {
      "email": "test.permissions.{{timestamp}}@example.com",
      "display_name": "Test Permissions User",
      "first_name": "Test",
      "last_name": "Permissions",
      "role": "user"
    }
  }
}
```

**Extract**: `staff_uid` from `response.data.staff.uid`

### Step 2: Get Staff Business Role
Retrieve the business role assigned to the staff member to get the business_role_uid.

**Endpoint**: `GET /v3/access_control/staff_business_roles/{staff_uid}`

```json
{
  "method": "GET",
  "path": "/v3/access_control/staff_business_roles/{{resolved.staff_uid}}",
  "token_type": "staff"
}
```

**Extract**: `business_role_uid` from `response.data.business_role_uid`

### Step 3: Get Business Role Permissions
Retrieve the business role to get its default permissions.

**Endpoint**: `GET /v3/access_control/business_roles/{uid}`

```json
{
  "method": "GET",
  "path": "/v3/access_control/business_roles/{{resolved.business_role_uid}}",
  "token_type": "staff"
}
```

**Extract**: `permissions` array from `response.data.permissions`

### Step 4: Update Staff Permission Overrides List
Update the staff permission overrides using permissions from the business role.

**Endpoint**: `PUT /v3/access_control/staff_permission_overrides_lists/{staff_uid}`

```json
{
  "method": "PUT",
  "path": "/v3/access_control/staff_permission_overrides_lists/{{resolved.staff_uid}}",
  "token_type": "staff",
  "body": {
    "permissions": [
      {
        "key": "{{resolved.permissions[0].key}}",
        "state": "allow"
      }
    ]
  }
}
```

## How to Resolve Parameters

| Parameter | Source | Path |
|-----------|--------|------|
| `staff_uid` | Step 1 Response | `data.staff.uid` |
| `business_role_uid` | Step 2 Response | `data.business_role_uid` |
| `permissions` | Step 3 Response | `data.permissions` |

## Critical Learnings

1. **Staff must exist first**: The staff_uid path parameter must belong to an existing staff member in the business
2. **Permission keys must be valid**: The permission keys in the request body must match existing permissions (can be retrieved from `GET /v3/access_control/permissions`)
3. **State values**: Valid states are `allow`, `deny`, or `inherit` (inherit removes the override)
4. **Permissions come from BusinessRole**: To use valid permission keys, first get the BusinessRole's permissions

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "PUT",
  "path": "/v3/access_control/staff_permission_overrides_lists/{{resolved.staff_uid}}",
  "token_type": "staff",
  "body": {
    "permissions": [
      {
        "key": "payments.invoices.export",
        "state": "allow"
      },
      {
        "key": "payments.invoices.view",
        "state": "deny"
      }
    ]
  }
}
```

## Example Full Flow

```javascript
// Step 1: Create staff
const staffResponse = await POST('/platform/v1/businesses/{business_uid}/staffs', {
  meta: { invite: "false" },
  staff: { email: "test@example.com", display_name: "Test", first_name: "Test", last_name: "User", role: "user" }
});
const staff_uid = staffResponse.data.staff.uid;

// Step 2: Get staff's business role
const staffRoleResponse = await GET(`/v3/access_control/staff_business_roles/${staff_uid}`);
const business_role_uid = staffRoleResponse.data.business_role_uid;

// Step 3: Get business role permissions
const roleResponse = await GET(`/v3/access_control/business_roles/${business_role_uid}`);
const permissions = roleResponse.data.permissions;

// Step 4: Update permission overrides (using first permission from role)
const overrideResponse = await PUT(`/v3/access_control/staff_permission_overrides_lists/${staff_uid}`, {
  permissions: [
    { key: permissions[0].key, state: "allow" }
  ]
});
```
