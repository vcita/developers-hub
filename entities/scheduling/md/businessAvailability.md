## BusinessAvailability

A BusinessBookingSlots entity represents the available booking time slots for a business. It includes an array of available time slots in ISO 8601 format and a unique identifier for the business account.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| booking_slots | Array of available booking time slots in ISO format | array of strings | Yes |
| business_uid | Unique identifier for a business account | string | Yes |

## Example

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