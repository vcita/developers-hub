## BusinessRole

A role is a named set of default permissions for a business account. For example, admin, manager etc.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the BusinessRole | string | Yes |
| business_uid | The unique identifier (UID) of the business account | string | Yes |
| code | A unique readable code for the role | string |  |
| name | The role name as it's presented in the UI. By default, it will be assigned from the original permission, but can be overridden for a specific business | string | Yes |
| description | The role description as it’s presented in the UI. By default, it will be assigned from the original permission, but can be overridden for a specific business | string | Yes |
| permissions | A list of permissions that are assigned to the role by default | array<object> | Yes |
| is_editable | A flag to indicate if the role can be edited by the business. By default, system roles are not editable | boolean |  |
| created_at | Date the BusinessRole was created | string | Yes |
| updated_at | Date the BusinessRole was last updated | string | Yes |

**Required fields**: `uid`, `business_uid`, `name`, `description`, `permissions`, `created_at`, `updated_at`

### Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "business_uid": "b290f1ee-6c54-4b01-90e6-d701748f0851",
  "code": "admin",
  "name": "Admin",
  "description": "Admin role. Typically has access to all features in the system",
  "is_editable": true,
  "permissions": [
    {
      "key": "payments.invoices.export",
      "allow": true
    },
    {
      "key": "payments.invoices.import",
      "allow": true
    },
    {
      "key": "payments.invoices.view",
      "allow": true
    },
    {
      "key": "payments.invoices.delete",
      "allow": true
    },
    {
      "key": "payments.invoices.create",
      "allow": true
    }
  ],
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```