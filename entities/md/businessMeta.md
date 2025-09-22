## BusinessMeta

The BusinessMeta schema defines various metadata properties associated with a business entity, including analytics, identity information, state indicators, and categorization tags.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| analytics |  | ref to businessAnalytics.json |  |
| audit | A collection of audit logs for tracking changes or activities. The specific structure of each log is not defined. | array<object> |  |
| external_id | A unique identifier for the business used in external systems. (deperecated, use external_reference_id) | string | Yes |
| external_reference_id | Another identifier used for referencing the business in external or third-party systems. | string | Yes |
| identities | A list of identities associated with the business. This could include various user or entity IDs. | array<string> |  |
| in_setup | Indicates whether the business is in the setup process. True if in setup, false otherwise. | boolean | Yes |
| intents | A list of intents or purposes associated with the business. Defines business objectives or goals. | array<string> |  |
| invite | An invite code or identifier used for inviting users to the business or a specific function. | string |  |
| is_template | Indicates if the current business meta is a template. Templates can be used as a basis for new instances. | boolean | Yes |
| note | A general note or comment about the business. Can be used for additional information not captured elsewhere. | string |  |
| suggested_identities | A list of suggested identities for the business, possibly recommended during setup or integration. | array<string> |  |
| tags | Tags associated with the business for categorization or organization purposes. | array<string> |  |
| template_business_id | If this business meta is based on a template, this is the ID of that template business. | string |  |

**Required fields**: `external_id`, `external_reference_id`, `in_setup`, `is_template`

### Example

JSON

```json
{
  "analytics": {
    "google_client_id": "GA-12345678",
    "mixpanel_id": "mixpanel-12345"
  },
  "audit": [],
  "external_id": "ext-987654321",
  "external_reference_id": "extref-123456789",
  "identities": [
    "user-1234",
    "user-5678"
  ],
  "in_setup": false,
  "intents": [
    "increase-sales",
    "expand-market"
  ],
  "invite": "inviteCode12345",
  "is_template": false,
  "note": "This is a sample business meta for demonstration.",
  "suggested_identities": [
    "suggested-user-123",
    "suggested-user-456"
  ],
  "tags": [
    "retail",
    "online",
    "B2C"
  ],
  "template_business_id": ""
}
```