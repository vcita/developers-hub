## StaffBusinessRole

A StaffBusinessRole is an assignment of a BusinessRole to a staff member, defining their permissions within a business account. For example, admin, manager etc.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| staff_uid | The unique identifier (UID) of the staff member | string | Yes |
| business_role_uid | A unique identifier (UID) of the associated BusinessRole | string | Yes |
| created_at | Date the StaffBusinessRole was created | string | Yes |
| updated_at | Date the StaffBuinsessRole was last updated | string | Yes |

## Example

JSON

```json
{
  "staff_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "business_role_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```