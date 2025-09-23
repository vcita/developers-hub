## AvailabilitySlot

Represents a time window and the entities available for booking within it.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| start | Start date and time of the availability slot | string | Yes |
| end | End date and time of the availability slot | string | Yes |
| available_entities | List of available entities for this time slot | array of objects | Yes |

## Example

JSON

```json
{
  "start": "2025-05-19T10:00:00.000Z",
  "end": "2025-05-19T11:00:00.000Z",
  "available_entities": [
    {
      "entity_uid": "staff-789",
      "entity_type": "staff",
      "group_entity_type": "staff"
    },
    {
      "entity_uid": "res-123",
      "entity_type": "resource",
      "group_entity_type": "resource_type",
      "group_entity_uid": "rt-456"
    },
    {
      "entity_uid": "res-124",
      "entity_type": "resource",
      "group_entity_type": "resource_type",
      "group_entity_uid": "rt-456"
    }
  ]
}
```