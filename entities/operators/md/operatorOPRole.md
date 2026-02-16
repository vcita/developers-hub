## OperatorOPRole

Associates an operator with a role, granting them the capabilities defined for that role.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| created_at | Date the StaffBusinessRole was created | string | Yes |
| updated_at | Date the StaffBuinsessRole was last updated | string | Yes |
| operator_uid | The unique identifier (UID) of the Operator | string |  |
| operators_role_uid | A unique identifier (UID) of the associated OperatorsRole | string | Yes |

## Example

JSON

```json
{
  "operator_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "operators_role_uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```