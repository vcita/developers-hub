## BusinessPhoneNumber

A business-owned phone number with enabled features and lifecycle metadata.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the phone number record. | string |  |
| business_uid | Unique identifier of the business that owns this phone number. | string |  |
| phone_number | The complete phone number in E.164 format without formatting (e.g., "12127654321"). This is the actual phone number that was purchased from the telecom provider. | string |  |
| country_code | ISO 3166-1 alpha-2 country code indicating the country where the phone number is registered (e.g., "US" for United States, "CA" for Canada). | string |  |
| features | List of telephony features to enable for this phone number, (e.g., ["VOICE", "SMS"]). | array<string> |  |
| status | Current operational status of the phone number. | string (enum: `active`, `inactive`, `suspended`) |  |
| created_at | The creation date and time of the phone number record. | string |  |
| updated_at | Updated date and time of the phone number record. | string |  |

### Example

JSON

```json
{
  "uid": "number123",
  "business_uid": "business123abc",
  "phone_number": "12127654321",
  "country_code": "US",
  "features": [
    "VOICE",
    "SMS"
  ],
  "status": "active",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z"
}
```