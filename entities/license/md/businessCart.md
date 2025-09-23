## BusinessCart

A businessCart object represents a temporary collection of products, organized as cart items, that a business plans to purchase.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the entity | string | Yes |
| created_at | Timestamp when the entity was created | string | Yes |
| updated_at | Timestamp when the entity was last updated | string | Yes |
| business_uid | Unique identifier of the business | string | Yes |
| business_cart_items |  | array of ref to businessCartItem.jsons | Yes |
| cart_total | Calculated field | number |  |