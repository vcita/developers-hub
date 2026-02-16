## AvailablePhoneNumber

Represents an available phone number that can be purchased, including country and area code.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| country_code | ISO 3166-1 alpha-2 country code indicating the country where the phone number is registered (e.g., "US" for United States, "CA" for Canada). | string | Yes |
| area_code | The area code portion of the phone number. For North American numbers, this is typically a 3-digit code that identifies the geographic region (e.g., 302 for Delaware). | string | Yes |
| phone_number | The complete phone number in E.164 format without formatting (e.g., "12127654321"). This is the actual phone number available for purchase from the telecom provider. | string | Yes |

## Example

JSON

```json
{
  "country_code": "US",
  "area_code": "302",
  "phone_number": "13022440861"
}
```