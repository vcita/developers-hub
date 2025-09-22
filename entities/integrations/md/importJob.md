## ImportJob

Defines an import job for validating or executing bulk data imports, with progress and metadata.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the import job | string | Yes |
| provider_type | The type of import provider | string (enum: `excel`, `import_job`) | Yes |
| provider_data | The data used by the provider to import the records | object | Yes |
| job_type | The type of job operation. 'validate' will go over the lines and return errors, use /v3/integrations/import_job_items to get detailed errors about each line.
'execute' will run the import job. use /v3/integrations/import_job to get the progress of the import task. | string (enum: `validate`, `execute`) | Yes |
| status | Current status of the import job | string (enum: `pending`, `processing`, `done`, `error`) | Yes |
| error_message | Error message if the job failed | string | Yes |
| progress |  | object | Yes |
| created_at | Creation timestamp | string | Yes |
| updated_at | Last update timestamp | string | Yes |
| metadata | Additional metadata for the import job | object |  |

**Required fields**: `uid`, `provider_type`, `provider_data`, `job_type`, `status`, `error_message`, `progress`, `created_at`, `updated_at`

### Progress Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| total | Total number of records to be processed | number | Yes |
| done | Number of records successfully processed | number | Yes |
| error | Number of records that failed processing | number | Yes |
| pending | Number of records pending processing | number | Yes |

### Metadata Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| data_row_index | Index of the data row being processed | number |  |
| locale | Locale setting for the import job | string |  |
| shared_entity_data | Shared entity data for the import job, this data is shared between all the import job items | object |  |

### Example

JSON

```json
{
  "uid": "job-xyz789",
  "provider_type": "excel",
  "provider_data": {
    "entity_type": "products",
    "original_file_name": "import.xlsx"
  },
  "job_type": "execute",
  "status": "processing",
  "error_message": null,
  "progress": {
    "total": 100,
    "done": 42,
    "error": 3,
    "pending": 55
  },
  "metadata": {
    "data_row_index": 5,
    "locale": "en",
    "shared_entity_data": {
      "tax_ids": [
        "12345678yyu90",
        "heuh39759nmf"
      ]
    }
  },
  "created_at": "2023-01-15T08:00:00.000Z",
  "updated_at": "2023-01-15T08:30:00.000Z"
}
```