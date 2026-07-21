## AIRecommendation

The AIRecommendation entity.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | A unique identifier for the recommendation. | string | Yes |
| producer | Upstream agent or partner system that produced this recommendation (for example: 'client_agent', 'lead_capture_agent', 'partner_x'). | string |  |
| business_uid | The unique identifier (UID) of the business that owns this recommendation. Automatically set based on the authenticated token. | string |  |
| created_at | The timestamp when the recommendation was created, in ISO 8601 format. | string |  |
| updated_at | The timestamp when the recommendation was last updated, in ISO 8601 format. | string |  |
| category | Recommendation category set by the producer for interface use: 'needs_attention' (time-sensitive and requires the user's attention) or 'opportunity' (growth-focused value opportunity that does not require immediate action). | string (enum: `needs_attention`, `opportunity`) |  |
| priority | Relative ordering priority within the same category: 'high' (higher priority, surfaced first) or 'standard' (default priority). | string (enum: `high`, `standard`) |  |
| execution_policy | Indicates whether this recommendation is auto-executed by an agent or requires human review: 'auto_execute' (may be executed automatically by the system or an authorized agent) or 'requires_human_approval' (must be reviewed and approved by a human before execution). | string (enum: `auto_execute`, `requires_human_approval`) |  |
| tags | Optional user-facing tags that label the item's urgency, value, or context (for example: 'Hot lead', 'New', 'High value', 'Urgent', 'At risk', 'Follow up'). | array of strings |  |
| due_at | Optional due or target time used for urgency and upcoming behavior, in ISO 8601 format. | string |  |
| expired_at | Optional expiry time used for dismissing or clearing the recommendation, in ISO 8601 format. | string |  |
| actions | A list of recommended actions related to this entity. | array of ref to AIRecommendedAction.jsons | Yes |
| display | Contains display-related information for the recommendation. | object | Yes |
| context | The context in which the recommendation was generated. | object | Yes |
| target | The target entity for this recommendation, typically representing the user or business involved. | object | Yes |
| status | Current lifecycle status of this recommendation, including the source of the latest status update. | object | Yes |

### Display Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| title | A human-readable title describing the recommendation. | string |  |

### Context Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| context_uid | A unique identifier for the context associated with this recommendation. | string |  |
| context_type | The type of context (e.g., 'matter','client', 'business'). | string (enum: `matter`, `client`, `business`) |  |
| context_name | The display name of the context object (referenced by 'context_uid') this recommendation is about, according to its 'context_type' - for example, the client's name when 'context_type' is 'client' (e.g., 'John Smith'). | string |  |

### Target Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| target_actor_uid | A unique identifier for the target actor (e.g., a user or business). | string |  |
| target_actor_type | The type of target actor (e.g., 'staff','directory'). | string (enum: `staff`, `directory`) |  |

### Status Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| state | Lifecycle state of the recommendation: 'active' (available and not yet completed), 'completed' (executed successfully or otherwise resolved), 'dismissed' (explicitly dismissed without resolving the underlying need), 'approved' (approved by the user but not yet at a terminal outcome), or 'snoozed' (deferred to a later time or trigger condition). | string (enum: `active`, `completed`, `dismissed`, `approved`, `snoozed`) |  |
| state_source_type | Source of the current status: 'user' (change via Pulse UI) or 'system' (change by the originating service or agent). | string (enum: `user`, `system`) |  |
| dismissed | Indicates whether the recommendation has been dismissed. | boolean |  |
| dismissed_source_type | The source that dismissed the recommendation. Null when the recommendation has not been dismissed. | string,null (enum: `user`, `system`, `null`) |  |

## Example

JSON

```json
{
  "uid": "rec-123",
  "producer": "client_agent",
  "business_uid": "biz-1234abcd",
  "created_at": "2025-02-04T12:00:00Z",
  "updated_at": "2025-02-04T12:30:00Z",
  "category": "needs_attention",
  "priority": "high",
  "execution_policy": "requires_human_approval",
  "tags": [
    "Hot lead"
  ],
  "due_at": "2026-06-08T09:00:00Z",
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
    "context_type": "client",
    "context_name": "John Smith"
  },
  "target": {
    "target_actor_uid": "staff-789",
    "target_actor_type": "staff"
  },
  "status": {
    "state": "active",
    "state_source_type": "system",
    "dismissed": false,
    "dismissed_source_type": "user"
  },
  "description": "An AI-generated recommendation with context, target, actions, and status metadata."
}
```