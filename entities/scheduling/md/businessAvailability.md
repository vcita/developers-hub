## BusinessAvailability

Represents the available booking time slots for a business within a date range. Used by directories to display when businesses have availability for scheduling.

## Properties

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| business_uid | string | Yes | Unique identifier for the business account |
| booking_slots | array of strings | Yes | Array of available booking time slots in ISO 8601 format (UTC) |

## Business Rules & Limits

1. **Date Range Limit**: Maximum **7 days** between start and end date
2. **Time Format**: All slots are returned in UTC (ISO 8601 format)
3. **Pagination**: Results are paginated with a maximum of **10 items per page**
4. **Page Numbering**: Pages are **0-based** (first page is `page=0`)

## Access Requirements

### Token Types
- ❌ Staff Tokens - **Not permitted**
- ✅ Directory Tokens - **Required**
- ❌ App Tokens - **Not permitted**
- ❌ Client Tokens - **Not permitted**

⚠️ **Directory Tokens Only**: This endpoint is exclusively for directory-level access. Staff tokens and other token types will receive a **403 Forbidden** error.

### Rate Limiting

This endpoint uses a **distributed lock** per directory to prevent concurrent requests:
- Only one request per directory can be processed at a time
- Concurrent requests receive **429 Too Many Requests**
- Wait a few seconds and retry if you receive 429

### Timeout

- **10 second timeout** for the directory-level endpoint
- If timeout occurs, try reducing the date range or number of businesses

## Related Entities

- [AvailabilitySlot](availabilitySlot.md) - More detailed availability with entity information
- Business - The business whose availability is being queried
- Staff - Staff availability contributes to business availability

## Example

```json
{
  "business_uid": "c4kektjxu9o2nqw6",
  "booking_slots": [
    "2023-03-15T09:00:00Z",
    "2023-03-15T09:30:00Z",
    "2023-03-15T10:00:00Z",
    "2023-03-15T10:30:00Z",
    "2023-03-15T14:00:00Z",
    "2023-03-15T14:30:00Z"
  ]
}
```

## API Endpoints

- [GET /v3/scheduling/business_availabilities](/reference/get-all-businessavailabilities) - List availability for multiple businesses in a directory
- [GET /v3/scheduling/business_availabilities/{business_uid}](/reference/get-businessavailability) - Get availability for a specific business

## Common Errors

| Error Code | HTTP Status | Cause | Resolution |
|------------|-------------|-------|------------|
| 400 Bad Request | 400 | Invalid date format | Use YYYY-MM-DD format for date_start/date_end |
| 400 Bad Request | 400 | Date range exceeds 7 days | Reduce date range to 7 days or less |
| 403 Forbidden | 403 | Non-directory token used | Use a Directory token for authentication |
| 429 Too Many Requests | 429 | Concurrent request in progress | Wait a few seconds and retry |
| 504 Gateway Timeout | 504 | Request exceeded 10s timeout | Reduce date range or query fewer businesses |

## Usage Examples

### Getting Availability for All Businesses in a Directory

```javascript
// Get availability for next 7 days (directory token required)
const response = await api.get('/v3/scheduling/business_availabilities', {
  params: {
    date_start: '2025-01-15',
    date_end: '2025-01-22',  // Max 7 days from start
    page: 0,
    per_page: 10,  // Max 10
    scheduling_enabled: true  // Only businesses with scheduling enabled
  },
  headers: {
    'Authorization': 'Bearer <directory_token>'
  }
});

const businesses = response.data.business_availabilities;
```

### Paginating Through Results

```javascript
// Page through all businesses
let page = 0;
let allBusinesses = [];

while (true) {
  const response = await api.get('/v3/scheduling/business_availabilities', {
    params: {
      date_start: '2025-01-15',
      date_end: '2025-01-22',
      page: page,
      per_page: 10
    }
  });
  
  const businesses = response.data.business_availabilities;
  if (businesses.length === 0) break;
  
  allBusinesses = allBusinesses.concat(businesses);
  page++;
}
```

### Handling Rate Limiting

```javascript
async function getAvailabilityWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await api.get('/v3/scheduling/business_availabilities', { params });
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error;
    }
  }
}
```
