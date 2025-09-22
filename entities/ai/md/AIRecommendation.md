## AIRecommendation

The AIRecommendation entity.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | A unique identifier for the recommendation. | string | Yes |
| created_at | The timestamp when the recommendation was created, in ISO 8601 format. | string |  |
| updated_at | The timestamp when the recommendation was last updated, in ISO 8601 format. | string |  |
| actions | A list of recommended actions related to this entity. | array<ref to AIRecommendedAction.json> | Yes |
| display | Contains display-related information for the recommendation. | object | Yes |
| reason | A brief explanation of why the recommendation was generated. | string |  |
| context | The context in which the recommendation was generated. | object | Yes |
| target | The target entity for this recommendation, typically representing the user or business involved. | object | Yes |
| status |  | object | Yes |

**Required fields**: `uid`, `actions`, `display`, `context`, `target`, `status`

### Display Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| title | A human-readable title describing the recommendation. | string |  |

### Context Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| context_uid | A unique identifier for the context associated with this recommendation. | string |  |
| context_type | The type of context (e.g., 'matter','client', 'business'). | string (enum: `matter`, `client`, `business`) |  |

### Target Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| target_actor_uid | A unique identifier for the target actor (e.g., a user or business). | string |  |
| target_actor_type | The type of target actor (e.g., 'staff','directory'). | string (enum: `staff`, `directory`) |  |

### Status Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| dismissed | Indicates whether the recommendation has been dismissed. | boolean |  |
| dismissed_source_type |  | string (enum: `user`, `system`) |  |

### Example

JSON

```json
{
  "uid": "rec-123",
  "created_at": "2025-02-04T12:00:00Z",
  "updated_at": "2025-02-04T12:30:00Z",
  "actions": [
    {
      "uid": "act-456",
      "action": "reply",
      "reason": "Clarification needed",
      "display": {
        "btn_text": "Generate Reply"
      },
      "evidence": [
        "User asked for price estimate"
      ],
      "payload": {
        "message": "Hi, I can provide you with a roofing estimate. Please provide me with the address and any other relevant details."
      },
      "confidence": 0.85
    }
  ],
  "context": {
    "context_uid": "ctx-456",
    "context_type": "client"
  },
  "target": {
    "target_actor_uid": "staff-789",
    "target_actor_type": "staff"
  },
  "status": {
    "dismissed": false,
    "dismissed_source_type": "user"
  },
  "description": "An AI-generated recommendation with context, target, actions, and status metadata."
}
```