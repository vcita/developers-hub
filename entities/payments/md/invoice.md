## Invoice

Invoice entity representing a bill or invoice document with line items, payment terms, and client information.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The invoice's unique identifier | string |  |
| created_at | Created date and time | string |  |
| updated_at | Updated date and time | string |  |
| matter_uid | Matter/conversation UID | string | Yes |
| issue_date | Invoice issuance date. Must be >= today. | string | Yes |
| due_date | Invoice due date. Expected date for payment. Must be >= issue_date | string | Yes |
| currency | Three-letter ISO currency code (e.g., "USD", "ILS") | string | Yes |
| status | Invoice status | string (enum: `DRAFT`, `ISSUED`, `CANCELLED`) |  |
| unique_number | Invoice unique, sequential number. Two types of numbering: 1. Unique sequence of numbers (1,2,3….) 2. A yearly repeated numbering including a year's prefix (2025-0001, 2025-0002…). Within each year start - rounding the count (2026-0001, 2026-0002,…) | string |  |
| document_title | Invoice title. A document title to appear on top of the PDF. Default: "INVOICE" | string |  |
| billing_address | Business billing address | string |  |
| purchase_order | Purchase order number | string |  |
| allow_online_payment | Enable online payment for this specific invoice | boolean |  |
| allow_partial_payment | Enable partial payments for this specific invoice | boolean |  |
| enable_late_fee | Enable late fee on invoice for this specific invoice | boolean |  |
| note | Invoice notes/comments | string |  |
| terms_and_conditions | Payment terms and conditions. Appears in the invoice document | string |  |
| additional_recipients | CC email recipients (array of email strings) | array of strings |  |
| item_headers | Array of invoice item headers. Item header allows to group invoice items under a header within the invoice's line items. Used when add_item_header feature flag is enabled. At least one of line_items or item_headers must be provided. | array of objects |  |
| display_item_headers_total | Display item_headers total | boolean |  |
| display_items_total | Display items total | boolean |  |
| from_estimate_uid | UID of estimate from which invoice was created | string |  |
| source_name | Source tracking name. Default: "initiated_by_staff" | string |  |
| line_items | Array of invoice items. Items that are not part of the item_headers. At least one of line_items or item_headers must be provided. | array of objects |  |

### Line Item Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| name | Line item name/title | string | Yes |
| quantity | Line item quantity | number | Yes |
| unit_amount | Unit price/amount | number | Yes |
| description | Line item description | string |  |
| entity_uid | UID of related entity (service/product/package) | string |  |
| entity_type | Type of related entity (e.g., "Service", "Product", "BookingPackage") | string |  |
| uid | Line item UID (for updates) | string |  |
| tax_uids | Array of tax UIDs to apply | array of strings |  |
| discount | Line item discount | object |  |
| item_index | Item position/index | number |  |

### Discount Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| percent | Discount percentage | number |  |
| amount | Discount amount | number |  |

### Item Header Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| name | Section name | string | Yes |
| item_header_index | Section order/index | number | Yes |
| items | Array of items within this section | array of objects | Yes |

## Example

JSON

```json
{
  "uid": "inv-aaabbbccc112233",
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z",
  "matter_uid": "matter_123",
  "issue_date": "2024-01-15",
  "due_date": "2024-02-15",
  "currency": "USD",
  "status": "ISSUED",
  "unique_number": "2024-0001",
  "document_title": "INVOICE",
  "billing_address": "123 Main St, City, State 12345",
  "purchase_order": "PO-12345",
  "allow_online_payment": true,
  "allow_partial_payment": false,
  "enable_late_fee": false,
  "note": "Thank you for your business",
  "terms_and_conditions": "Payment due within 30 days",
  "additional_recipients": ["accounting@example.com"],
  "display_items_total": true,
  "display_item_headers_total": false,
  "from_estimate_uid": null,
  "source_name": "initiated_by_staff",
  "line_items": [
    {
      "name": "Consulting Services",
      "quantity": 2,
      "unit_amount": 150.00,
      "description": "Hourly consulting",
      "entity_uid": "service_123",
      "entity_type": "Service",
      "tax_uids": ["tax_uid_1"],
      "discount": null,
      "item_index": 0
    }
  ]
}
```

