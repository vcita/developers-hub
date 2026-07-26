## Navigation Item

Represents a navigation menu item that defines how partners configure their platform navigation structure. Navigation items support hierarchical menus, localized titles, permission-based visibility, and mobile-specific settings.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the navigation item (e.g., "nav-item-abc123"). | string |  |
| parent_uid | The UID of the parent navigation item. Set to null only for the root item, which represents the logo. Only one root item should exist per directory (e.g., "nav-item-parent123" or null). | string |  |
| directory_uid | Unique identifier of the directory (partner) that owns this navigation item. Automatically set from the authenticated token context (e.g., "dir-abc123"). | string |  |
| order | Display order within the parent level. Lower numbers appear first. Items with the same order are sorted by creation time (e.g., 0, 1, 2). | integer | Yes |
| title | Localized titles for the navigation item. Must include at least the 'en' (English) locale. | object | Yes |
| icon | Icon identifier from the platform icon library. For a list of supported icon identifiers, refer to the inTandem UI icon library used by the platform (e.g., "icon-Dashboard_POV", "icon-Settings"). | string |  |
| key | Human-readable unique identifier within the directory. Used by API consumers for programmatic access. Must be stable across title/translation changes (e.g., "dashboard", "settings", "custom_module"). | string | Yes |
| modules | Array of module identifiers required for this item to be visible. Item is shown only if the business has at least one of these modules enabled. The list of enabled modules can be retrieved from the features endpoint (e.g., "https://developers.intandem.tech/reference/get_platform-v1-businesses-business-id-features"). (e.g., ["scheduling", "payments"]). | array of strings |  |
| permissions | Array of permission identifiers required to view this item. Item is shown only if the staff member has at least one of these permissions. To retrieve valid permission codes, use the endpoint (GET "/v3/access_control/permissions"). (e.g., ["payments.invoices.export", "clients.manage"]). | array of strings |  |
| badge_code | Badge code that displays a notification indicator on this navigation item. Supported values are finite and managed by the platform (e.g., "inbox_unread" or null). | string (enum: `inbox_unread`) |  |
| action | Action configuration that defines the behavior when the navigation item is clicked. Actions are handled by the inTandem JS SDK. Every navigation item must have an action. Supported action types: "navigate" (navigates to a page) and "openModal" (opens a modal dialog). | object | Yes |
| available_in_mobile | Whether this navigation item should appear in mobile app navigation. Set to false for desktop-only features (e.g., true, false). | boolean |  |
| favorite_in_mobile | Whether this item appears in the mobile favorites/quick-access section. Only applicable when available_in_mobile is true (e.g., true, false). | boolean |  |
| upsell_handling | Behavior when user lacks required modules/permissions. 'hide' removes the item completely, 'show_upsell' displays it with an upgrade prompt. Null means default behavior (hide). | string (enum: `hide`, `show_upsell`) |  |
| role | Semantic role of the navigation item that can trigger special behavior, e.g. "settings" causes a settings cog icon to be displayed in the full menu screen. Null means no special role (e.g., "settings" or null). | string (enum: `settings`) |  |
| app_code_name | App code name to gate this item by app availability. When set, the item is only visible to staff who have the corresponding app assigned. Must match an existing app's app_code_name. Null means the item is not gated by app availability (e.g., "myapp" or null). | string |  |
| is_bmp | Indicates if this is a Business Management Platform (BMP) sub-menu item. When set to true, BMP children are built by inTandem internal logic. Available for **Directory tokens** via create and update operations (e.g., true, false). | boolean |  |
| expand_by_default | Whether this navigation item's sub-menu renders expanded by default on module landing, so its child items are immediately visible without an extra click. The frontend only expands items that have children. Deep-link behavior is unaffected. Only applies to partner navigation items — BMP items are unaffected. Applies to both desktop and mobile (full-screen menu) (e.g., true, false). | boolean |  |
| show_quick_actions | Whether this navigation item renders with the Quick Actions button at the top of the navigation (same design as the platform default). Only applies to partner navigation items — BMP items are unaffected. Desktop only (e.g., true, false). | boolean |  |
| created_by | Indicates who created this navigation item. Supported values are: "vcita" (created by vcita system), "app" (created by an application or integration), "directory" (created by the directory owner). Null means unknown or legacy value. | string (enum: `vcita`, `app`, `directory`, `null`) |  |
| updated_by | Indicates who last updated this navigation item. Supported values are: "vcita" (updated by vcita system), "app" (updated by an application or integration), "directory" (updated by the directory owner). Null means unknown or legacy value. | string (enum: `vcita`, `app`, `directory`, `null`) |  |
| created_at | The date and time when the navigation item was created, in ISO 8601 format (e.g., "2026-01-15T10:30:00Z"). | string |  |
| updated_at | The date and time when the navigation item was last updated, in ISO 8601 format (e.g., "2026-01-15T14:45:00Z"). | string |  |

### Title Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| en | English title (required). | string | Yes |
| he | Hebrew title (optional). | string |  |

### Action Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| name | Action type identifier. Supported values: "navigate" (navigates to a page using the inTandem JS SDK navigate function, see the [navigate documentation](https://developers.intandem.tech/docs/navigate)), "openModal" (opens a modal dialog using the inTandem JS SDK, see the [openModal documentation](https://developers.intandem.tech/docs/openmodal)). | string (enum: `navigate`, `openModal`) | Yes |
| payload | Action-specific payload. For "navigate": must include 'type' and 'path' (required), and optionally 'new_tab'. For "openModal": must include the modal configuration (e.g., {"modalName": "AppMarket"}). See the inTandem JS SDK documentation for complete parameter specifications. | object | Yes |

## Example

JSON

```json
{
  "uid": "nav-item-abc123",
  "parent_uid": null,
  "directory_uid": "dir-xyz789",
  "order": 1,
  "title": {
    "en": "Dashboard",
    "he": "לוח בקרה"
  },
  "icon": "icon-Dashboard_POV",
  "key": "dashboard",
  "modules": null,
  "permissions": null,
  "badge_code": null,
  "action": {
    "name": "navigate",
    "payload": {
      "type": "relative",
      "path": "/app/dashboard",
      "new_tab": false
    }
  },
  "available_in_mobile": true,
  "favorite_in_mobile": true,
  "upsell_handling": null,
  "role": "settings",
  "app_code_name": null,
  "is_bmp": false,
  "expand_by_default": false,
  "show_quick_actions": false,
  "created_by": "directory",
  "updated_by": "directory",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```