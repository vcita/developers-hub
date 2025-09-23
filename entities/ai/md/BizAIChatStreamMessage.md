## BizAIChatStreamMessage

Represents a streamed token chunk for a BizAI chat message, with finish state.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the message | string | Yes |
| delta | Token that is part of the content of the message | string | Yes |
| finish_reason | The reason the stream has finished. If null, the stream is did not finish yet | string | Yes |

## Example

JSON

```json
{
  "uid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "delta": "Hello",
  "finish_reason": null
}
```