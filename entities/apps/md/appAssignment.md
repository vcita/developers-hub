## AppAssignment

Defines assignment of an app to a business, package, or directory, including settings.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | A unique identifier for the app assignment record | string |  |
| created_at | Timestamp when the app assignment was created | string |  |
| updated_at | Timestamp when the app assignment was last updated | string |  |
| assignee_type | The type of entity this app is assigned to | string (enum: `business`, `package`, `directory`) | Yes |
| assignee_uid | The uid of the entity this app is assigned to | string | Yes |
| app_code_name | The unique identifier of the app | string | Yes |
| settings | Settings for the app assignment | object | Yes |

**Required fields**: `assignee_type`, `assignee_uid`, `app_code_name`, `settings`

### Settings Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| assignment_mode | App setting:
 'internal' - App does not show in the app market but still available to use in all relevant integration points;
 'pre_installed' - Define the app as pre-installed for all new accounts, app shows in app market as installed on first appearance. The user will be able to uninstall it later if they wish to. This is relevant only to account with platform app market | string (enum: `internal`, `pre_installed`) | Yes |

### Example

JSON

```json
{
  "uid": "ba7f2e8d-9a1b-4c5d-8e9f-1a2b3c4d5e6f",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "assignee_type": "package",
  "assignee_uid": "6c71874z-4d2b-46q1-bbdd-f8c7e12e66d0",
  "app_code_name": "calendar_sync",
  "settings": {
    "assignment_mode": "pre_installed"
  }
}
```