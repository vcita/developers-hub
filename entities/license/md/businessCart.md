## BusinessCart

Represents a business cart containing offerings to be purchased and calculated totals.

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the entity | string | Yes |
| created_at | Timestamp when the entity was created | string | Yes |
| updated_at | Timestamp when the entity was last updated | string | Yes |
| business_uid | Unique identifier of the business | string | Yes |
| business_cart_items |  | array<ref to businessCartItem.json> | Yes |
| cart_total | Calculated field | number |  |

**Required fields**: `uid`, `business_uid`, `created_at`, `updated_at`, `business_cart_items`