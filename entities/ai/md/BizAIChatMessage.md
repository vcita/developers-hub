## BizAIChatMessage

Represents a single message within a BizAI chat, including author role and timestamps.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the message | string | Yes |
| content | The content of the message | string | Yes |
| author_role | The role of the author of the message | string | Yes |
| created_at | The date the message was created | string | Yes |
| updated_at | The date the message was last updated | string | Yes |

## Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "content": "Hello, how can I help you?",
  "author_role": "human",
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```