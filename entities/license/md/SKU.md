## SKU

The SKU represents a service or a features set that can be offered by inTandem/partners to their users.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| type | Type of the SKU. Possible values include: 'package' for the main business subscription; 'app' for marketplace app; 'addon' for text message and staff seats. | string (enum: `package`, `app`, `addon`) | Yes |
| code_name | Unique code of the associated underlying SKU e.g., app code name, package code or adddon code name. Available addons are SMS, staff_seat and module (an external module that is a place holder for a service sold by the partner, for example 'Extended support').  | string | Yes |
| display_name | The SKU's display name | string | Yes |
| created_at | Timestamp indicating when the entity was created. In some types, this date is hard coded and should not be relyed upon for business logic. | string | Yes |
| updated_at | Timestamp of the entity's most recent update. In some types, this date is hard coded and should not be relyed upon for business logic. | string | Yes |

**Required fields**: `uid`, `created_at`, `updated_at`, `type`, `code_name`, `display_name`

### Example

JSON

```json
{
  "type": "package",
  "code_name": "premium",
  "display_name": "Premium",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z"
}
```