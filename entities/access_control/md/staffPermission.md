## StaffPermission

an assiged permission to a staff member

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| key | The unique identifier (key) of the StaffPermission | string | Yes |
| allow | A flag indicating if this permission is allowed or denied from this staff member | boolean |  |

## Example

JSON

```json
{
  "key": "payments.invoices.export",
  "allow": true
}
```