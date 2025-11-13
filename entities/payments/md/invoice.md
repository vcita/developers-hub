## Invoice

Invoice entity representing a bill or invoice document with line items, payment terms, and client information.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The invoice's unique identifier | string |  |
| created_at | Created date and time | string |  |
| updated_at | Updated date and time | string |  |
| matter_uid | Matter UID. The identify number of the client that the invoice for issued for | string | Yes |
| issue_date | The date the invoice was issued. Issue_date >=Today() | string | Yes |
| due_date | Invoice due date. Expected date for payment. Must be >= issue_date | string | Yes |
| currency | Three-letter ISO currency code (e.g., "USD", "ILS") | string | Yes |
| status | Invoice status. Optional: "DRAFT" or "ISSUED" (default: "ISSUED") | string (enum: `DRAFT`, `ISSUED`, `CANCELLED`) |  |
| unique_number | Invoice unique, sequential number. Two types of numbering: 1. Unique sequence of numbers (1,2,3….) 2. A yearly repeated numbering including a year's prefix (2025-0001, 2025-0002…). Within each year start - rounding the count (2026-0001, 2026-0002,…). Optional, auto-generated if not provided | string |  |
| invoice_title | Invoice title. A document title to appear on top of the PDF. Optional. Default: "INVOICE" | string |  |
| billing_address | Full business billing address, including street, city, state, country, and zipcode | string |  |
| purchase_order | Purchase order number | string |  |
| allow_online_payment | Enable online payment for this specific invoice (allow the client to pay directly from the client portal) | boolean |  |
| allow_partial_payment | Enable partial payment for this specific invoice (allow the client to pay a portion of the invoice amount rather than its full due price) | boolean |  |
| enable_late_fee | Enable late fee on invoice for this specific invoice. (late fee will be added to the invoice automatically when the invoice will become overdue. Not applicable in strict mode where an invoice is a legal binding document and cannot be edited) | boolean |  |
| note | Invoice notes/comments | string |  |
| terms_and_conditions | Payment terms and conditions. appears in the invoice document | string |  |
| additional_recipients | CC email recipients (array of email strings). comma separated | array of strings |  |
| line_item_groups | Array of invoice line item groups. Line item groups allows to group invoice line items per need, while each line item group will have at least a single line item set in it. Optional, used when `add_item_header` feature flag is enabled | array of objects |  |
| display_line_item_groups_total | Display the total price of the items that are nested under a line items group | boolean |  |
| display_line_item_total | Display nested under a group line item price | boolean |  |
| estimate_uid | The unique identifier of the estimate from which invoice was created | string |  |
| line_items | Array of invoice line items. Line items that are not part of the line item groups. Required if line_item_groups not provided, at least one line item required | array of objects |  |

### Line Item Properties

A line item refers to each billable item in the invoice. Invoice total amount will be a sum of all line items. A line item can be added nested under a line items group, or independently in the invoice (not nested)

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| name | Line item name/title | string | Yes |
| quantity | Line item quantity | number | Yes |
| unit_amount | Unit price/amount | number | Yes |
| description | Line item description | string |  |
| entity_uid | UID of related entity (service/product/package) | string |  |
| entity_type | Type of related entity. "Service", "Product", "BookingPackage". If custom item → NULL | string (enum: `Meeting`, `EventAttendance`, `ProductOrder`, `ClientBookingPackage`, `Service`, `Product`, `BookingPackage`) |  |
| uid | Line item UID (for updates) | string |  |
| tax_uids | Array of tax UIDs to apply. Pulled from the taxes set in the business Taxes settings. 0-3 taxes per line item are allowed | array of strings |  |
| discount | Line item discount. Can be a percentage or a fixed amount to be reduced from the line item amount | object |  |
| line_item_index | Line item position/index | number |  |

### Discount Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| discount_type | Type of discount: percentage or fixed amount | string (enum: `percent`, `amount`) | Yes |
| amount | Discount value. If discount_type is 'percent', this is the percentage (e.g., 10 for 10%). If discount_type is 'amount', this is the fixed discount amount | number | Yes |

### Line Item Groups Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| name | Section name | string | Yes |
| line_item_group_index | Section order/index | number | Yes |
| line_items | Array of line items within this section | array of objects | Yes |

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
  "invoice_title": "INVOICE",
  "billing_address": "123 Main St, City, State 12345",
  "purchase_order": "PO-12345",
  "allow_online_payment": true,
  "allow_partial_payment": false,
  "enable_late_fee": false,
  "note": "Thank you for your business",
  "terms_and_conditions": "Payment due within 30 days",
  "additional_recipients": ["accounting@example.com"],
  "display_line_item_groups_total": true,
  "display_line_item_total": true,
  "estimate_uid": null,
  "line_item_groups": [
    {
      "name": "Services",
      "line_item_group_index": 0,
      "line_items": [
        {
          "name": "Consulting Services",
          "quantity": 2,
          "unit_amount": 150.00,
          "description": "Hourly consulting",
          "entity_uid": "service_123",
          "entity_type": "Service",
          "tax_uids": ["tax_uid_1"],
          "discount": {
            "discount_type": "percent",
            "amount": 10
          },
          "line_item_index": 0
        }
      ]
    }
  ],
  "line_items": [
    {
      "name": "Design materials",
      "quantity": 1,
      "unit_amount": 114.00,
      "description": "Design materials",
      "entity_uid": "product_123",
      "entity_type": "Product",
      "tax_uids": ["tax_uid_1"],
      "discount": null,
      "line_item_index": 1
    }
  ]
}
```
