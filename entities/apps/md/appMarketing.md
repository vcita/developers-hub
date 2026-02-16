## AppMarketing

Marketing metadata for an app, including texts, images, locales and links.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity identifier | string |  |
| created_at | Timestamp indicating when the entity was created | string |  |
| updated_at | Timestamp of the entity's most recent update | string |  |
| app_code_name | The referenced app code name. | string | Yes |
| privacy_policy_link | A link to the apps privacy policy | string | Yes |
| contact_support_link | Link to the app's contact support page | string | Yes |
| terms_of_service_link | Link to the app's terms of service | string | Yes |
| app_screenshot_uris | Links to screenshots of the app. Will be displayed in the app info page on desktop display | array of strings |  |
| app_mobile_screenshot_uris | Links to screenshots of the app. Will be displayed in the app info page on mobile display | array of strings |  |
| market_texting | App marketing texts appearing in the app card and app info page, by language | array of objects | Yes |
| logo | The app's logo URL | string |  |
| locales | Locales supported by the app | array of strings |  |
| supported_countries | Countries in which the app will be available. Empty array for all countries. | array of strings |  |

## Example

JSON

```json
{}
```