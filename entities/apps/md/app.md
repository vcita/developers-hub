## App

An app that can be installed on the inTandem platform

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| app_code_name | The app's code name. This will be used as the app's unique identifier | string | Yes |
| created_at | The creation date and time of the entity | string |  |
| updated_at | The last updated date and time of the entity | string |  |
| display_name | The app's name. Must be 3 to 25 chars long | string | Yes |
| integration_points | One or more integration points with the platform the app implements. {add link} | array of strings |  |
| menu_item |  | object |  |
| trusted | Trusted grants the app full scope permissions to the business without asking a consent from the user. | boolean |  |
| scopes | Deprecated. | array of strings |  |
| demand_scopes | Deprecated. | array of strings |  |
| managable_permissions_unique_codes | A list of permission unique codes that will appear in the user permissions management screen in case the app is installed for the business. | array of strings |  |
| required_permissions_unique_codes | A list of permission unique codes that a staff needs to be able to interact with the [application](https://developers.intandem.tech/v3.0/reference/available-permissions). | array of strings |  |
| api_uri | Link to the application's API. Used by apps that implements integration_points like Calendar. | string |  |
| require_staff_settings | Whether the app requires each staff member to set the app on her account | boolean |  |
| redirect_uri | A redirect link to take the user when opening the app in the app market | string | Yes |
| open_as | How the open app CTA behaves. Options are 'new_tab','in_place','menu_item' | string | Yes |
| url_params | Parameters that will be passed to the app. Valid values are: impersonate, business_uid, staff_role, staff_uid, payment_permissions, language, package, brand_host | array of strings |  |
| oauth_redirect_uris | An array of URLs to redirect the user to after a successful login. | array of unknowns |  |
| app_marketing |  | ref to appMarketing.json |  |

### Menu Item Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| category | Section of the left menu in which the item will appear, requires the app to declare the **menu_item** integration point. Valid values are: [calendar,clients,payments,documents,campaigns,reputation,my-livesite,social,social_info,app_market,reports,team-chat,advertising,subscriptions] | string (enum: `calendar`, `clients`, `payments`, `documents`, `campaigns`, `reputation`, `my-livesite`, `social`, `social_info`, `app_market`, `reports`, `team-chat`, `advertising`, `subscriptions`) |  |
| item_name | The name that appears for the app in the menu for each language, available languages - German, English, Spanish, French, Hebrew, Italian, Polish, Dutch. | object |  |

## Example

JSON

```json
{}
```