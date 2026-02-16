## AIRecommendedAction

Represents a recommended action based on AI analysis.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | A unique identifier for the recommended action. | string | Yes |
| action | The type of action recommended. Possible values:
- 'reply': Suggests responding to a user message.
- 'estimate': Suggests providing a price estimate.
- 'schedule': Suggests scheduling an appointment or meeting. | string (enum: `reply`, `estimate`, `schedule`) | Yes |
| display | Contains display-related information for the recommendation. | object |  |
| reason | The reason why this action is recommended, providing context for decision-making. | string | Yes |
| payload | Additional data related to the recommended action. The structure depends on the action type. | object |  |
| evidence | A list of supporting statements or facts justifying the recommendation. | array of strings | Yes |
| context | The context in which the recommendation was generated. | object |  |

### Display Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| btn_text | A human-readable title describing the recommendation. | string |  |

### Context Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| context_uid | A unique identifier for the context associated with this recommendation. | string |  |
| context_type | The type of context (e.g., 'matter','client', 'business'). | string (enum: `matter`, `client`, `business`) |  |

## Example

JSON

```json
{
  "uid": "act-456",
  "action": "reply",
  "display": {
    "btn_text": "Generage Reply"
  },
  "reason": "User needs clarification on pricing",
  "evidence": [
    "User asked for price estimate"
  ],
  "payload": {
    "message": "Hi please send some more details"
  },
  "context": {
    "context_uid": "ctx-456",
    "context_type": "client"
  }
}
```