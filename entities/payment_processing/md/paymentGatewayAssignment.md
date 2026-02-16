## PaymentGatewayAssignment

A payment gateway assignment entity that defines the relationship between a payment gateway and a directory.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | A unique identifier for the payment gateway assignment record. | string |  |
| gateway_uid | The unique identifier of the payment gateway being assigned. | string | Yes |
| directory_uid | The unique identifier of the directory to which the payment gateway is assigned. | string | Yes |
| created_at | The date and time when the payment gateway assignment was created. | string |  |
| updated_at | The date and time when the payment gateway assignment was last updated. | string |  |

## Example

JSON

```json
{
  "uid": "pga_abc123def456",
  "gateway_uid": "pgw_stripe_v2_789",
  "directory_uid": "dir_main_directory_123",
  "created_at": "2025-01-27T10:08:54.156Z",
  "updated_at": "2025-01-27T10:08:54.156Z"
}
```