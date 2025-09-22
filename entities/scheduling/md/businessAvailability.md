## BusinessAvailability

Represents a business's available booking time slots.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| booking_slots | Array of available booking time slots in ISO format | array<string> | Yes |
| business_uid | Unique identifier for a business account | string | Yes |

**Required fields**: `booking_slots`, `business_uid`

### Example

JSON

```json
{
  "booking_slots": [
    "2023-03-15T09:00:00Z",
    "2023-03-15T09:30:00Z",
    "2023-03-15T10:00:00Z"
  ],
  "business_uid": "c4kektjxu9o2nqw6"
}
```