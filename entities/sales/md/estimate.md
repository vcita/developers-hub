## Estimate

A sales estimate document with items, totals, client details, and status.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier for the estimate entity | string |  |
| created_at | Timestamp indicating when the estimate was created | string |  |
| updated_at | Timestamp of the estimate's most recent update | string |  |
| estimate_number | The unique reference number for the estimate | string | Yes |
| estimate_date | Date when the estimate was issued | string | Yes |
| due_date | Date when the estimate is due | string | Yes |
| client_uid | Unique identifier of the client | string |  |
| client_name | The name of the client | string | Yes |
| client_address | The address of the client | string |  |
| address | The address associated with the estimate | string |  |
| amount | Total amount of the estimate | number | Yes |
| currency | Currency used for the estimate | string (enum: `USD`, `EUR`, `GBP`) | Yes |
| status | The current status of the estimate | string (enum: `draft`, `issued`, `approved`, `rejected`, `invoiced`) | Yes |
| items |  | array of objects | Yes |
| note | Additional note regarding the estimate | string |  |
| source_data |  | object |  |
| staff_uid | Identifier for the staff member handling the estimate | string |  |
| title | Title of the estimate | string |  |

### Source Data Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| campaign | Campaign source, if applicable | string |  |
| channel | Channel where the estimate originated | string |  |
| name | Source name | string |  |
| website_url | Website URL related to the estimate | string |  |

## Example

JSON

```json
{
  "uid": "aaabbbccc112233",
  "created_at": "2018-06-14T09:31:21.000",
  "updated_at": "2018-06-14T09:31:21.000",
  "estimate_number": "1",
  "estimate_date": "2020-04-20",
  "due_date": "2020-04-24",
  "client_uid": "1kfvtps4a4wlh3lc",
  "client_name": "Alice Smith",
  "client_address": "Lombard St, San Francisco, CA",
  "address": "habarzel 32\nTel Aviv",
  "amount": 8.8,
  "currency": "USD",
  "status": "draft",
  "items": [
    {
      "title": "Item title",
      "description": "Service Description",
      "quantity": 1,
      "amount": 10,
      "discount": 2,
      "taxes": [
        {
          "name": "10 tax",
          "rate": 10
        }
      ]
    }
  ],
  "note": "Estimate for your service",
  "source_data": {
    "campaign": null,
    "channel": "",
    "name": "client_portal",
    "website_url": null
  },
  "staff_uid": "mg9d34uh92bclwzg",
  "title": "Estimate title"
}
```