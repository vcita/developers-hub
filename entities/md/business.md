## Business

Represents a business account profile, including identity, contact, and web presence.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| account_blocked_at | The date and time when the business account was blocked, in ISO 8601 format. | string |  |
| address | The physical address of the business. | string |  |
| business_category | The category that best describes the business sector. | string |  |
| business_maturity_in_years | The number of years the business has been operational, represented as a string. | string |  |
| country_name | The name of the country where the business is located. | string |  |
| hide_Address | A boolean indicating whether the business address should be hidden in public listings. | boolean |  |
| business_uid | The unique identifier for the business. | string | Yes |
| landing_page | The URL of the business's landing page. | string |  |
| name | The name of the business. | string | Yes |
| phone | The contact phone number for the business. | string |  |
| promotional |  | ref to businessPromotional.json |  |
| short_description | A brief description of the business. | string |  |
| time_zone | The time zone in which the business operates. | string |  |
| website_url | The URL of the business's website. | string |  |

## Example

JSON

```json
{
  "account_blocked_at": "2023-04-15T09:10:11Z",
  "address": "123 Business St, Business City, BC 12345",
  "business_category": "Retail",
  "business_maturity_in_years": "5",
  "country_name": "United States",
  "hide_Address": false,
  "business_uid": "business-12345",
  "landing_page": "http://www.businesswebsite.com",
  "name": "Business Name Inc.",
  "phone": "+1234567890",
  "promotional": {
    "block_count": "2",
    "blocked_at": "2023-01-10T09:10:11Z"
  },
  "short_description": "A leading provider of business services.",
  "time_zone": "America/New_York",
  "website_url": "http://www.businesswebsite.com"
}
```