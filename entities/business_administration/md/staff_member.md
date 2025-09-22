## Staff Member

Represents a staff member profile within a business, including identity and settings.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier of the staff member. | string |  |
| first_name | The first name of the staff member. | string | Yes |
| last_name | The last name of the staff member. | string | Yes |
| display_name | The display name of the staff member used for public facing interfaces. | string |  |
| email | The email address of the staff member. | string | Yes |
| professional_title | The professional title or position of the staff member. | string |  |
| business_uid | The unique identifier of the business the staff member belongs to. | string | Yes |
| country_name | The country name for the staff member's mobile number. | string |  |
| mobile_number | The mobile number of the staff member without country code. | string |  |
| photo_url | The URL to the staff member's profile photo. | string |  |
| default_homepage | The default page to navigate to when the staff member logs in. | string (enum: `dashboard`, `inbox`, `calendar`, `clients`, `pos`) |  |
| role | The role or permission level of the staff member. | string | Yes |
| email_signature | The email signature used by the staff member in communications. | string |  |
| business_role_display_name | The display name of the staff member's role within the business. | string |  |
| owner | Indicates whether the staff member is an owner of the business. | boolean |  |
| active | Indicates whether the staff member account is active. | boolean |  |
| blocked_at | The date and time when the staff member was blocked, in ISO 8601 format. | string |  |
| created_at | The date and time when the staff member was created, in ISO 8601 format. | string |  |
| updated_at | The date and time when the staff member was last updated, in ISO 8601 format. | string |  |

**Required fields**: `business_uid`, `first_name`, `last_name`, `email`, `role`

### Example

JSON

```json
{
  "uid": "staff-12345",
  "first_name": "John",
  "last_name": "Doe",
  "display_name": "Dr. John Doe",
  "email": "john.doe@example.com",
  "professional_title": "Senior Consultant",
  "business_uid": "business-12345",
  "country_name": "United States",
  "mobile_number": "2345678901",
  "photo_url": "https://storage.example.com/staff/profile/12345.jpg",
  "default_homepage": "dashboard",
  "role": "admin",
  "email_signature": "Best regards,\nJohn Doe\nSenior Consultant",
  "business_role_display_name": "Business Administrator",
  "owner": true,
  "active": true,
  "blocked_at": null,
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-15T09:30:00Z"
}
```