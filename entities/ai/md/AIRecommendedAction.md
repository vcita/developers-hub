## AIRecommendedAction

Represents a recommended action based on AI analysis.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | A unique identifier for the recommended action. | string | Yes |
| action | The type of action recommended. Possible values:<br />- 'reply': Suggests responding to a user message.<br />- 'estimate': Suggests providing a price estimate.<br />- 'schedule': Suggests scheduling an appointment or meeting.<br />- 'acknowledge': No action or artifact is prepared; the user reviews the item and then completes or dismisses it.<br />- 'chat_with_bizai': Hands the item off to BizAI (the business AI chat assistant) to handle on the user's behalf.<br />- 'navigate': Prepares no artifact; the action's CTA takes the user to the page for the recommendation's context (see 'context.context_type'). | string (enum: `reply`, `estimate`, `schedule`, `acknowledge`, `chat_with_bizai`, `navigate`) | Yes |
| display | Contains display-related information for the recommendation. | object |  |
| reason | The reason why this action is recommended, providing context for decision-making. | string |  |
| payload | Additional data related to the recommended action. The structure depends on the action type. | object |  |
| evidence | A list of supporting statements or facts justifying the recommendation. | array of strings |  |
| confidence | A confidence score (0-1) indicating how confident the AI is in this recommendation. | number |  |

### Display Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| btn_text | A human-readable title describing the recommendation. | string |  |

## Example

JSON

```json
{
  "uid": "act-456",
  "action": "reply",
  "display": {
    "btn_text": "Generate Reply"
  },
  "reason": "User needs clarification on pricing",
  "evidence": [
    "User asked for price estimate"
  ],
  "payload": {
    "message": "Hi please send some more details"
  },
  "confidence": 0.85
}
```