## BizAIChat

Represents a business AI chat session, including agent, metadata, and audit timestamps.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the chat | string | Yes |
| actor_uid | The unique identifier (UID) of the actor that created the chat | string | Yes |
| agent | Agent associated with the chat | string | Yes |
| metadata | A JSON string used to pass additional information to the chat agent in run time | object | Yes |
| created_at | Date the chat was created | string | Yes |
| updated_at | Date the chat was last updated | string | Yes |

**Required fields**: `uid`, `actor_uid`, `agent`, `metadata`, `created_at`, `updated_at`

### Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "actor_uid": "ghp0f1ee-6c54-4b01-90e6-d701748f0851",
  "agent": "vanilla",
  "metadata": {
    "directory_uid": "k98axtpqg7h1whh6",
    "instruction": "You are a helpful assistant. Answer all questions to the best of your ability."
  },
  "created_at": "2021-07-20T14:00:00.000Z",
  "updated_at": "2021-07-20T14:00:00.000Z"
}
```