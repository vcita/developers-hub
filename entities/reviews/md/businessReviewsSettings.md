## BusinessReviewsSettings

Configures external review sharing settings for a business by platform.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| business_uid | The unique identifier (UID) of the business | string | Yes |
| external_review_site_url | Specifies the external review site URL where the review will be shared. | string |  |
| external_review_site_display_name | Specifies the display name of the external review site receiving the review. | string |  |
| display_platform_review_consent | Whether to prompt clients to leave a public review on Google or Facebook after submitting a review. | boolean |  |
| display_review_sharing_consent | Enables the client to decide whether their review is shared with that external review site. | boolean |  |
| platform_id | The ID of the external review platform (1=Google, 2=Facebook) | integer |  |
| platform_name | The name of the external review platform | string (enum: `Google`, `Facebook`) |  |
| platform_params | Platform-specific parameters needed to properly route the review | object |  |

## Example

JSON

```json
{
  "business_uid": "d290f1ee26c54",
  "display_platform_review_consent": true,
  "display_review_sharing_consent": true,
  "platform_id": 1,
  "platform_name": "Google",
  "platform_params": {
    "place_id": 173897183
  },
  "external_review_site_url": "https://external_review_site_url.com",
  "external_review_site_display_name": "External Review Site Name",
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```