## BusinessPhoneNumber

A business-owned phone number with enabled features and lifecycle metadata.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the phone number record. | string |  |
| business_uid | Unique identifier of the business that owns this phone number. | string |  |
| phone_number | The complete phone number in E.164 format without formatting (e.g., "12127654321"). This is the actual phone number that was purchased from the telecom provider. | string |  |
| country_code | ISO 3166-1 alpha-2 country code indicating the country where the phone number is registered (e.g., "US" for United States, "CA" for Canada). | string |  |
| features | List of telephony features to enable for this phone number, (e.g., ["VOICE", "SMS"]). | array of strings |  |
| verification_request_data | Business verification information required for text messaging compliance in the United States and Canada. This data registers your business with mobile carriers to enable SMS messaging capabilities. The verification process helps prevent spam and ensures your business messages are delivered reliably to customers. | ref to verificationRequestData.json |  |
| status | Current operational status of the phone number. | string (enum: `active`, `inactive`, `suspended`) |  |
| verification_status | Indicates the outcome of verifying a phone number's ownership and validity based on business verification data provided. This field applies only to U.S. and Canadian numbers and reflects compliance verification required by telecom regulations. | string (enum: `pending`, `verified`, `failed`) |  |
| created_at | The creation date and time of the phone number record. | string |  |
| updated_at | Updated date and time of the phone number record. | string |  |

## Example

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
  "verification_request_data": {
    "entity_type": "PRIVATE_PROFIT",
    "brand_name": "Acme Corporation",
    "legal_company_name": "Acme Corporation Inc.",
    "contact_first_name": "John",
    "contact_last_name": "Doe",
    "tax_number": "123456789",
    "website_url": "https://www.acmecorp.com",
    "country_code": "US",
    "postal_code": "10001",
    "street": "123 Business Ave",
    "full_address": "123 Business Ave, New York, NY 10001, USA",
    "city": "New York",
    "state": "NY",
    "contact_email": "john.doe@acmecorp.com",
    "contact_phone": "12125551234",
    "mobile_phone": "19175551234"
  },
  "status": "active",
  "verification_status": "verified",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z"
}
```