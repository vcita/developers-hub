## VoiceCallRecording

Metadata for an external call recording, including storage and lifecycle fields.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| external_uid | The unique identifier of the external recording resource | string | Yes |
| external_url | The URL to access the external recording resource | string |  |
| size | The size of the recording in bytes | number | Yes |
| duration | The duration of the recording in seconds | number | Yes |
| started_at | The start date and time of the recording | string | Yes |
| storage_blob | The storage blob identifier if stored in a cloud storage service | string |  |
| created_at | The date and time when the recording entity was created | string |  |
| updated_at | The date and time when the recording entity was last updated | string |  |
| deleted_at | The date and time when the recording was deleted | string |  |

## Example

JSON

```json
{
  "external_uid": "abc123xyz",
  "external_url": "https://example.com/recordings/abc123xyz",
  "size": 1048576,
  "duration": 300,
  "started_at": "2024-03-20T12:34:56Z",
  "storage_blob": "storage_blob_id_123",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z",
  "deleted_at": null
}
```