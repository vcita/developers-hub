## Idp Actor Mapping

Maps an external IDP user to an inTandem platform actor (staff or operator).

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the IDP actor (a user in an IDP integrated with SSO to the inTandem autheriation bridge) | string | Yes |
| idp_user_reference_id | External reference ID of the IDP user, used to link the IDP actor to an external system. | string | Yes |
| actor_type | Type of the actor in the inTandem platform. 'staff' refers to a staff member, while 'operator' refers to an operator in the Operators Portal. | string (enum: `staff`, `operator`) | Yes |
| actor_uid | Unique identifier of the actor in the inTandem platform. This is used to link the IDP actor to a specific staff member or operator. | string | Yes |
| created_at | Creation timestamp | string | Yes |
| updated_at | Last update timestamp | string | Yes |

## Example

JSON

```json
{
  "uid": "12345",
  "idp_user_reference_id": "ext-12345",
  "actor_type": "staff",
  "actor_uid": "staff-67890",
  "created_at": "2023-10-01T12:00:00Z",
  "updated_at": "2023-10-01T12:00:00Z"
}
```