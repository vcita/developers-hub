## App

Represents an app that can be installed and used on the inTandem platform.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the app. | string | Yes |
| app_code_name | Unique code name of the app (e.g., "calendar_sync"). | string | Yes |
| name | App display name (e.g., "Calendar Sync"). | string | Yes |
| redirect_uri | The app main landing page. The platform uses this URI when opening the app. | string | Yes |
| app_host | Computed URL used by the platform to open the app (based on `redirect_uri` plus runtime query parameters). | string |  |
| url_params | A list of standard platform context parameters that the platform injects into the query string when building `app_host`. Each value is a predefined key whose value is resolved at runtime by the platform (e.g., selecting "business_uid" causes the caller's business UID to be appended as `?business_uid=...`).<br /><br />This is different from the `additional_params` entry in `extensions`, which defines custom, app-specific key-value pairs that are also appended to the URL. | array of strings |  |
| app_types | A list of app types / integration points associated with the app. This mirrors core's `app_type` field and is related to (and can be derived from) the app's extension configuration.<br /><br />Valid values are based on core validation rules and may include internal-only values. | array of strings |  |
| open_in_new_tab | Whether the app is opened in a new browser tab instead of an in-product iframe. | boolean |  |
| supported_in_mobile | Whether the app is supported in mobile experiences. | boolean |  |
| permissions | A list of permission codes required for certain app capabilities or UI entries (e.g., "can_view_payments"). | array of strings |  |
| trusted | Whether the app can skip the user consent screen when authorizing access. | boolean |  |
| oauth_redirect_uris | An array of URLs to redirect the user to after a successful OAuth login. | array of strings |  |
| assignment_types | How the app is available to the caller. An app can have multiple assignment types simultaneously. Heuristics: `installed` and `internal` cannot happen at the same time. The only combination is `installed` + `directory_offering`. | array of strings | Yes |
| owner | Whether the caller is the owner of the app. For Internal tokens, apps with no owning directory are returned with `owner=true`. | boolean |  |
| app_market | App market metadata shown to users in the app market. | object |  |
| internal | Internal-runtime app metadata used by clients that render the app shell. | object |  |
| extensions | Developer-provided extension configuration entries. Each entry contains a `type` key identifying the extension and a `value` key holding its configuration. Only extensions with non-empty values are included. The array contains at most one entry per `type`. | array of objects |  |
| created_at | Timestamp indicating when the app was created. | string | Yes |
| updated_at | Timestamp indicating when the app was last updated. | string | Yes |

### App Market Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| description | App description texts and logo. | object |  |
| app_features | A list of app features displayed in the app market. | array of strings |  |
| app_screenshot_uris | Links to screenshots or demo videos shown on desktop. | array of strings |  |
| app_mobile_screenshot_uris | Links to screenshots or demo videos shown on mobile. | array of strings |  |
| supported_countries | Countries in which the app is available. Use full country names (e.g., "United States"). Use an empty array for all countries. | array of strings |  |
| locales | Locales supported by the app (e.g., "en", "he"). | array of strings |  |
| privacy_policy_link | Link to the app privacy policy. | string |  |
| contact_support_link | Link to the app contact support page. | string |  |
| personal_connection | Whether each staff member needs to connect separately to the app. | boolean |  |

### Internal Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| api_uri | Link to the application's API. | string |  |
| full_screen | Whether the app is opened in a full screen mode. | boolean |  |
| deep_link | Deep link to an inner product page. | object |  |

## Example

JSON

```json
{
  "uid": "d290f1ee-26c5-4e91-b1a0-4f8b1c2d3e4f",
  "app_code_name": "calendar_sync",
  "name": "Calendar Sync",
  "redirect_uri": "https://calendar-sync.example.com/app",
  "app_host": "https://calendar-sync.example.com/app?business_uid=d290f1ee-26c5-4e91-b1a0-4f8b1c2d3e4f&staff_uid=stf_123&language=en",
  "url_params": [
    "business_uid",
    "staff_uid",
    "language"
  ],
  "app_types": [
    "communication",
    "menu_items"
  ],
  "open_in_new_tab": false,
  "supported_in_mobile": true,
  "permissions": [
    "can_view_payments"
  ],
  "trusted": false,
  "oauth_redirect_uris": [
    "https://calendar-sync.example.com/oauth/callback"
  ],
  "assignment_types": [
    "installed",
    "directory_offering"
  ],
  "app_market": {
    "description": {
      "logo": "https://cdn.example.com/apps/calendar_sync/logo.png",
      "short_description": "Two-way sync between your calendar and inTandem bookings.",
      "text": "Sync bookings to your calendar automatically and avoid double-booking across devices."
    },
    "app_features": [
      "Two-way sync",
      "Conflict detection"
    ],
    "app_screenshot_uris": [
      "https://cdn.example.com/apps/calendar_sync/screenshots/1.png"
    ],
    "app_mobile_screenshot_uris": [
      "https://cdn.example.com/apps/calendar_sync/screenshots/mobile_1.png"
    ],
    "supported_countries": [
      "United States",
      "United Kingdom",
      "Israel"
    ],
    "locales": [
      "en",
      "he"
    ],
    "privacy_policy_link": "https://calendar-sync.example.com/privacy",
    "contact_support_link": "https://calendar-sync.example.com/support",
    "personal_connection": true
  },
  "internal": {
    "api_uri": "https://calendar-sync.example.com/api",
    "full_screen": false,
    "deep_link": {
      "path": "/apps/calendar_sync/settings",
      "path_params": {
        "tab": "connections"
      }
    }
  },
  "owner": true,
  "extensions": [
    {
      "type": "menu_items",
      "value": {
        "subitems": [
          {
            "category": "clients",
            "item_name": {
              "en": "Calendar Sync"
            },
            "route": "calendar-sync",
            "display_order": 0,
            "block_impersonation": false
          }
        ]
      }
    },
    {
      "type": "additional_params",
      "value": {
        "open_channel_communication": true
      }
    },
    {
      "type": "full_screen",
      "value": true
    }
  ],
  "created_at": "2026-02-01T10:30:00Z",
  "updated_at": "2026-02-20T09:15:00Z"
}
```