## AvailabilitySlot

Represents a time window and the entities (staff members, resources) available for booking within it. Used in scheduling flows to display bookable times to clients.

## Properties

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| start | string (datetime) | Yes | Start date and time of the availability slot in ISO 8601 format (UTC) |
| end | string (datetime) | Yes | End date and time of the availability slot in ISO 8601 format (UTC) |
| available_entities | array of objects | Yes | List of staff members and/or resources available during this time slot |

### available_entities Object

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| entity_uid | string | Yes | Unique identifier of the available entity (staff or resource) |
| entity_type | string | Yes | Type of entity: `"staff"` or `"resource"` |
| group_entity_type | string | No | Type of group: `"staff"` or `"resource_type"` |
| group_entity_uid | string | No | UID of the resource type (only for resources) |

## Business Rules

1. **Time Format**: All times are returned in UTC (ISO 8601 format)
2. **Slot Duration**: Determined by the `slot_duration` parameter or service default
3. **Slot Interval**: Controlled by `slot_interval` parameter (how frequently slots start)
4. **Padding**: `padding_before` and `padding_after` create buffer time that's blocked but not shown
5. **Past Slots**: Slots in the past are never returned

## Performance Considerations

⚠️ **30 Second Timeout**: This endpoint has a 30-second timeout due to complex availability calculations for certain businesses.

### Best Practices for Performance

1. **Use specific filters**: Provide `staff_uids`, `resource_uids`, or `resource_type_uids` rather than broad queries
2. **Narrow time range**: Keep the date range as short as practical
3. **Cache results**: Consider caching availability for repeated queries
4. **Paginate if needed**: For very busy businesses, query smaller time windows

## Access Requirements

### Token Types
- ✅ Staff Tokens
- ✅ Directory Tokens
- ✅ App Tokens

### Rate Limiting
No specific rate limiting, but the 30-second timeout effectively limits concurrent heavy queries.

## Related Entities

- [Resource](resource.md) - Physical resources that appear in available_entities
- [ResourceType](resourceType.md) - Used to filter availability by resource category
- Staff - Staff members that appear in available_entities
- Service - Services define default slot duration

## Example

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

## API Endpoints

- [GET /v3/scheduling/availability_slots](/reference/get-all-availabilityslots) - Retrieve availability slots

## Common Errors

| Error Code | HTTP Status | Cause | Resolution |
|------------|-------------|-------|------------|
| 400 Bad Request | 400 | Invalid date format | Use ISO 8601 format for start_time/end_time |
| 400 Bad Request | 400 | Unsupported params without slot_duration | Provide slot_duration when using slot_interval, padding_before, or padding_after |
| 504 Gateway Timeout | 504 | Query too complex/slow | Narrow filters or time range |

## Usage Examples

### Finding Available Slots for a Service

```javascript
// Get availability for next 7 days for specific staff
const response = await api.get('/v3/scheduling/availability_slots', {
  params: {
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    staff_uids: 'stf_123,stf_456',
    service_uid: 'srv_789',
    slot_duration: 60  // 60-minute slots
  }
});

const slots = response.data.availability_slots;
const nextAvailable = slots[0];
```

### Checking Availability for Rescheduling

```javascript
// Exclude current booking when checking availability
const response = await api.get('/v3/scheduling/availability_slots', {
  params: {
    start_time: '2025-01-20T00:00:00Z',
    end_time: '2025-01-27T00:00:00Z',
    staff_uids: 'stf_123',
    exclude_booking_uid: 'booking_abc123'  // Current booking to reschedule
  }
});
```
