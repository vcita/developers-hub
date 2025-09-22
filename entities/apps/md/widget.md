## Widget

A widget that can be added to the dashboard to display information or functionality

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the dashboardWidget object | string |  |
| app_code_name | The code name of the app that owns the widget | string |  |
| display_name | The widget display name in different languages | object |  |
| permissions | The permissions required for the widget to show up for a staff member. If it is **null**, no restrictions will be enforced | array<unknown> |  |
| module | The module (FF) requeired for the widget to show up for a staff member | string |  |
| component_data | a configuration object that is passed to the widget to initialize it. Can vary based on the widget class | object |  |
| dimensions | The dimensions of the widget in grid units | object |  |
| created_at | The time the staffWidgetsBoard was created | string |  |
| updated_at | The time the staffWidgetsBoard was last updated | string |  |

### Dimensions Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| min_width | the minimum width of the widget in grid units | integer | Yes |
| min_height | the minimum height of the widget in grid units | integer | Yes |
| height | the default height of the widget | integer |  |
| width | the default width of the widget | integer |  |
| max_width | the maximum width of the widget in grid units | integer | Yes |
| max_height | the maximum height of the widget in grid units | integer | Yes |

### Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "app_code_name": "myappcode",
  "display_name": {
    "en": "Payments",
    "fr": "Paiements"
  },
  "permissions": [
    "payments_edit",
    "payments_read"
  ],
  "module": "Payment",
  "dimensions": {
    "max_height": 2,
    "min_height": 1,
    "height": 2,
    "max_width": 3,
    "min_width": 1,
    "width": 2
  },
  "component_data": {
    "name": "iFrame",
    "config": {
      "url": "www.partnerdomain.com/calendar"
    }
  },
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```