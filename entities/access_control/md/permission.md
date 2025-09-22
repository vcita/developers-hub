## Permission

An access to capability that can be granted to a Staff member

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| unique_code | The unique identifier of the Permission | string | Yes |
| name | The name of the permission shown to the user in English  | string | Yes |
| description | The description of the permission shown to the user in English | string | Yes |
| position | The display position of the permission in the list of permissions | integer |  |
| is_changable | A flag to indicate if the permission, after assigned, can be edited by the business. By default, permissions are editable but some permissions like business_management.admin_account.manage can not be changed after assigned | boolean |  |
| created_at | Date the BusinessRole was created | string | Yes |
| updated_at | Date the BuinsessRole was last updated | string | Yes |

**Required fields**: `unique_code`, `name`, `description`, `created_at`, `updated_at`

### Example

JSON

```json
{
  "unique_code": "payments.invoices.export",
  "name": "Export Invoices",
  "description": "Can export invoices",
  "position": 1,
  "is_changable": true,
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```