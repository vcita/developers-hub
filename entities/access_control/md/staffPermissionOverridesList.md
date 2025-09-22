## StaffPermissionOverridesList

An entity holding the list of permissions that override the default permissions of the BusinessRole assigned to the staff member. When empty role defaults are assigned to the user

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| staff_uid |  | string | Yes |
| permissions | A list of permissions that override the default permissions of the BusinessRole assigned to the staff member | array<object> | Yes |
| created_at | Date the BusinessRole was created | string | Yes |
| updated_at | Date the BuinsessRole was last updated | string | Yes |

**Required fields**: `staff_uid`, `permissions`, `created_at`, `updated_at`

### Example

JSON

```json
{
  "staff_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "permissions": [
    {
      "key": "payments.invoices.export",
      "state": "allow"
    },
    {
      "key": "payments.invoices.import",
      "state": "allow"
    },
    {
      "key": "payments.invoices.view",
      "state": "deny"
    },
    {
      "key": "payments.invoices.delete",
      "state": "deny"
    },
    {
      "key": "payments.invoices.create",
      "state": "allow"
    }
  ],
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```