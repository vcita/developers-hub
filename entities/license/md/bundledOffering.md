## BundledOffering

A bundled offering is an offering that is sold together with another offering. When the parent offering is purchased, the bundled offering is also included in the purchase. This list does not include bundled staff seats

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity identifier | string | Yes |
| created_at | Timestamp indicating when the entity was created | string |  |
| updated_at | Timestamp of the entity's most recent update | string |  |
| offering_uid | Unique identifier for the parent bundled of items | string | Yes |
| bundled_offering_uid | Unique identifier for the bundled item | string | Yes |

**Required fields**: `uid`, `offering_uid`, `bundled_offering_uid`

### Example

JSON

```json
{
  "uid": "bc33f12d-98ee-428f-9f65-12bca589cb21",
  "created_at": "2024-01-01T09:00:00Z",
  "updated_at": "2024-03-20T12:34:56Z",
  "offering_uid": "fc33f32c-95ae-4e8f-9f65-18bba589cb43",
  "bundled_offering_uid": "bc33f12d-98ee-428f-9f65-18bba589cb95"
}
```