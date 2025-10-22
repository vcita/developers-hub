## VerificationRequestData

Verification data required for phone numbers to comply with regulations. Contains business and contact information necessary for brand registration.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| entity_type | Legal form of the business | string (enum: `PRIVATE_PROFIT`, `PUBLIC_PROFIT`, `NON_PROFIT`, `SOLE_PROPRIETOR`) | Yes |
| brand_name | Brand name of the company or DBA (Doing Business As) | string | Yes |
| legal_company_name | The legally registered company name | string |  |
| contact_first_name | Business owner's first name | string | Yes |
| contact_last_name | Business owner's last name | string | Yes |
| tax_number | Tax Number/ID/EIN | string |  |
| website_url | Business website URL | string | Yes |
| country_code | ISO3166-Alpha2 country code of registration (e.g., "US", "CA") | string | Yes |
| postal_code | Postal/ZIP code (5 digits for US) | string | Yes |
| street | Street address | string | Yes |
| city | City name | string | Yes |
| state | State/Region (2-letter code for USA) | string | Yes |
| email | Contact email address. Note: Only Yahoo/Gmail addresses or custom domain matching business name are accepted | string | Yes |
| contact_phone | Contact phone number in E.164 format without + prefix | string | Yes |
| mobile_phone | Mobile phone number for brand verification in E.164 format without + prefix | string | Yes |

## Example

JSON

```json
{
  "entity_type": "PRIVATE_PROFIT",
  "brand_name": "Tech Solutions LLC",
  "legal_company_name": "Technology Solutions Limited Liability Company",
  "contact_first_name": "Jane",
  "contact_last_name": "Smith",
  "tax_number": "987654321",
  "website_url": "https://www.techsolutions.com",
  "country_code": "US",
  "postal_code": "94105",
  "street": "456 Market Street",
  "city": "San Francisco",
  "state": "CA",
  "email": "jane.smith@techsolutions.com",
  "contact_phone": "14155551234",
  "mobile_phone": "14155559876"
}
```