## OperatorCapability

An ability in the system that can be granted to an operator (internal and external)

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| created_at | Timestamp indicating when the entity was created | string | Yes |
| updated_at | Timestamp of the entity's most recent update | string | Yes |
| unique_code | The unique identifier of the Permission | string | Yes |
| name | The name of the permission shown to the user in English  | string | Yes |
| description | The description of the permission shown to the user in English | string | Yes |

## Example

JSON

```json
{
  "unique_code": "business.read",
  "name": "Read Business",
  "description": "Can view business details",
  "is_changable": true,
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```