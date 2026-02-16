## ImportJobItem

Represents a single record processed by an import job, with action and status.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the import job item | string | Yes |
| import_job_uid | Reference to the parent import job | string | Yes |
| action | The action performed for this record | string (enum: `create`, `update`, `skip`) | Yes |
| line_number | Line number in the source file | number | Yes |
| entity | The entity data being imported | object |  |
| status | Current status of the import detail | string (enum: `pending`, `processing`, `done`, `error`) | Yes |
| error_message | Error message if the import failed | string |  |
| created_at | Creation timestamp | string | Yes |
| updated_at | Last update timestamp | string | Yes |

## Example

JSON

```json
{
  "uid": "item-123abc",
  "import_job_uid": "job-xyz789",
  "action": "create",
  "line_number": 42,
  "entity": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "status": "done",
  "error_message": null,
  "created_at": "2023-01-15T08:30:00.000Z",
  "updated_at": "2023-01-15T08:35:00.000Z"
}
```