## OperatorBusinessToken

The OperatorBusinessToken entity.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the BusinessRole | string | Yes |
| created_at | Date the BusinessRole was created | string | Yes |
| expire_at | Date that the token expires | string | Yes |
| acting_as_uid | Actor unique id. Either operator uid when acting as the operator, or staff uid when acting on behalf of a staff member | string |  |
| acting_as | The type of the actor, operator - acting as the operator; staff - acting on behlaf of a staff member | string (enum: `operator`, `staff`) |  |
| jwt_token |  | string | Yes |

**Required fields**: `uid`, `created_at`, `expire_at`, `actor_type`, `actor_uid`, `jwt_token`

### Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "created_at": "2024-07-20T14:00:00.000Z",
  "updated_at": "2024-07-29T14:00:00.000Z",
  "acting_as": "staff",
  "acting_as_uid": "bc33f12d98ee",
  "jwt_token": "token_string"
}
```