## AiGenerationFeedback

Captures feedback on AI-generated outputs linked to specific entities.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the AI generation feedback | string | Yes |
| created_at | The timestamp when the feedback was created, in ISO 8601 format | string | Yes |
| updated_at | The timestamp when the feedback was last updated, in ISO 8601 format | string | Yes |
| type | The type of feedback provided | string (enum: `int`, `decimal`, `text`, `boolean`) | Yes |
| value | The feedback value - stored as string regardless of feedback type (e.g., '4.5' for score, 'true' for boolean) | string | Yes |
| entity_type | The type of entity this feedback is related to | string (enum: `AISmartReply`, `AIRecommendation`, `AIRecommendedAction`) | Yes |
| name | The specific name/identifier for the feedback type | string (enum: `[AISmartReply] Business Sent Message UID`, `[AISmartReply] Business Dismiss Reason`) | Yes |
| entity_uid | The unique identifier of the related entity | string | Yes |

### Examples

#### Example 1

JSON

```json
{
  "uid": "fb-decimal-001",
  "created_at": "2025-02-04T14:15:00.000Z",
  "updated_at": "2025-02-04T14:15:00.000Z",
  "type": "decimal",
  "value": "4.5",
  "entity_type": "AIRecommendation",
  "entity_uid": "rec-d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "[AISmartReply] Business Sent Message UID"
}
```

#### Example 2

JSON

```json
{
  "uid": "fb-bool-002",
  "created_at": "2025-02-04T14:20:00.000Z",
  "updated_at": "2025-02-04T14:20:00.000Z",
  "type": "boolean",
  "value": "true",
  "entity_type": "AISmartReply",
  "entity_uid": "sr-123",
  "name": "[AISmartReply] Business Dismiss Reason"
}
```

#### Example 3

JSON

```json
{
  "uid": "fb-text-003",
  "created_at": "2025-02-04T14:25:00.000Z",
  "updated_at": "2025-02-04T14:25:00.000Z",
  "type": "text",
  "value": "Great suggestion",
  "entity_type": "AIRecommendedAction",
  "entity_uid": "action-abc123",
  "name": "[AISmartReply] Business Sent Message UID"
}
```