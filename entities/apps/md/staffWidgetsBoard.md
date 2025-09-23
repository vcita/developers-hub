## StaffWidgetsBoard

Defines a staff member's dashboard board layout and its widget sections.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the staffWidgetsBoard object | string |  |
| board_layout_code_name | A string representing the board layout | string (enum: `MainAndSideBar2Columns`) |  |
| type | the grid frame of the layout, determines the layout frame containing the board | string (enum: `home`) |  |
| sections | An array of dashboard sections. Each section contains a set of properties defining it and a list of widgets that will be populated into the section once it is displayed | array of objects |  |
| created_at | The time the staffWidgetsBoard was created | string |  |
| updated_at | The time the staffWidgetsBoard was last updated | string |  |

## Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "board_layout": "MainAndSideBar3Columns",
  "type": "dashboard",
  "sections": [
    {
      "code_name": "Main",
      "widgets": [
        {
          "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
          "app_code_name": "myappcode",
          "display_name": {
            "en": "Payments",
            "fr": "Paiements"
          },
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
              "title": "calendar",
              "url": "www.partnerdomain.com/calendar"
            }
          }
        },
        {
          "uid": "d290f1ee-6c54-4b01-90e6-d701748f03434",
          "app_code_name": "myappcode2",
          "display_name": {
            "en": "Clients",
            "fr": "Clientèle"
          },
          "dimensions": {
            "max_height": 3,
            "min_height": 2,
            "height": 3,
            "max_width": 4,
            "min_width": 1,
            "width": 3
          },
          "component_data": {
            "name": "iFrame",
            "config": {
              "title": "clients",
              "url": "www.partnerdomain.com/clients"
            }
          }
        }
      ]
    }
  ],
  "created_at": "2021-06-20T14:00:00.000Z",
  "updated_at": "2021-07-15T14:00:00.000Z"
}
```