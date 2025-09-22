## OpRole

A role is a named set of capabilities for operators. For example, admin, manager etc.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the BusinessRole | string | Yes |
| created_at | Date the BusinessRole was created | string | Yes |
| updated_at | Date the BusinessRole was last updated | string | Yes |
| code | A unique readable code for the role | string | Yes |
| name | The role name | string | Yes |
| description | The role description | string | Yes |
| capabilities | A list of permissions that are assigned to the role | array<string> | Yes |

**Required fields**: `uid`, `created_at`, `updated_at`, `code`, `name`, `description`, `capabilities`

### Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z",
  "code": "admin",
  "name": "Admin",
  "description": "Admin role. Typically has access to all features in the system",
  "capabilities": [
    "business.read",
    "business.create",
    "business.impersonate",
    "business.impersonate_secure",
    "business.impersonate_in_setup",
    "business.change_plan",
    "business.lock_business",
    "operator.read",
    "operator.create",
    "operator.update",
    "operator.lock_operator",
    "content.manage",
    "content.map_identities_professions",
    "package.manage",
    "package.read"
  ]
}
```