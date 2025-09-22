## DirectoryOffering

Grants a directory permission to sell a specific offering.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity identifier | string | Yes |
| created_at | Timestamp indicating when the entity was created | string |  |
| updated_at | Timestamp of the entity's most recent update | string |  |
| directory_uid | Unique identifier for a directory. Defines which directory is authorized to sell this offering. | string | Yes |
| offering_uid | Unique identifier for an offering. Defines an offering the directory is authorized to sell. | string | Yes |

**Required fields**: `uid`, `directory_uid`, `offering_uid`

### Example

JSON

```json
{
  "uid": "bc33f12d-98ee-428f-9f65-18bba589cb95",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z",
  "directory_uid": "98ees428fq9f65tyh",
  "offering_uid": "3f12fb61-98ee-428f-9f65-18bba589cb95"
}
```