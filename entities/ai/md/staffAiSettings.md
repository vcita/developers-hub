## StaffAiSettings

AI settings configuration for a staff member, controlling which AI features and recommendations are enabled

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| staff_uid | The unique identifier of the staff member these settings belong to | string | Yes |
| ai_recommendations | AI recommendations settings configuration for a staff member | object | Yes |
| created_at | The timestamp when the settings were created, in ISO 8601 format | string |  |
| updated_at | The timestamp when the settings were last updated, in ISO 8601 format | string |  |

**Required fields**: `staff_uid`, `ai_recommendations`

### Ai Recommendations Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| enable | Whether AI recommendations are enabled for this staff member | boolean | Yes |
| sub_options | Specific AI recommendation sub-options that can be enabled or disabled individually | object | Yes |

### Example

JSON

```json
{
  "staff_uid": "f390f1ee-6c54-4b01-90e6-d701748f0852",
  "ai_recommendations": {
    "enable": true,
    "sub_options": {
      "next_best_action": true,
      "estimate": false,
      "scheduling": true
    }
  },
  "created_at": "2025-01-20T14:00:00.000Z",
  "updated_at": "2025-01-20T14:30:00.000Z"
}
```