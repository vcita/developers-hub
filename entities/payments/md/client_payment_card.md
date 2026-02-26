## Client Payment Card

Represents a stored payment card associated with a client. A client payment card holds tokenized card details used for processing payments on behalf of the client, including metadata about the card brand, funding type, expiration, and who initiated the card storage.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the payment card record (e.g., "card_123"). | string |  |
| client_uid | Unique identifier of the client who owns this payment card (e.g., "clt_aaabbbccc112233"). | string | Yes |
| business_uid | Unique identifier of the business this payment card is associated with (e.g., "biz_1234567890"). | string |  |
| default | Indicates whether this is the client's default payment card. Only one card per client can be marked as default. | boolean |  |
| active | Indicates whether the payment card is currently active and available for transactions. | boolean |  |
| card_brand | The card network brand. Possible values: "visa" - Visa, "mastercard" - Mastercard, "amex" - American Express, "discover" - Discover, "diners" - Diners Club, "jcb" - JCB, "unionpay" - UnionPay. | string (enum: `visa`, `mastercard`, `amex`, `discover`, `diners`, `jcb`, `unionpay`) | Yes |
| funding_type | The funding source of the card. Possible values: "credit" - Credit card, "debit" - Debit card, "prepaid" - Prepaid card, "unknown" - Funding type could not be determined. | string (enum: `credit`, `debit`, `prepaid`, `unknown`) | Yes |
| last_four_digits | The last four digits of the card number, used for display purposes only (e.g., "4242"). | string | Yes |
| exp_month | The card's expiration month, as an integer from 1 (January) to 12 (December). | integer | Yes |
| exp_year | The card's expiration year as a four-digit number (e.g., 2028). | integer | Yes |
| cardholder_name | The name of the cardholder as printed on the card (e.g., "Jane Doe"). | string |  |
| staff_uid | Unique identifier of the staff member who added this card on behalf of the client. Null if the card was added by the client directly. | string,null |  |
| staff_name | Display name of the staff member who added the card (e.g., "Jane Smith"). Empty if the card was added by the client. | string |  |
| payment_provider | The payment provider that tokenizes and processes this card. Possible values: "stripe" - Stripe, "square" - Square, "squarepaymentgateway" - Square Payment Gateway. | string (enum: `stripe`, `square`, `squarepaymentgateway`) | Yes |
| initiator | Indicates who initiated the card storage. Possible values: "client" - The client stored the card themselves, "staff" - A staff member stored the card on behalf of the client. | string (enum: `client`, `staff`) | Yes |
| can_be_used_by_staff | Indicates whether this stored card is eligible to be used by staff-initiated payment flows, such as charging the client for services rendered. | boolean |  |
| created_at | The date and time when the payment card record was created, in ISO 8601 format. | string |  |
| updated_at | The date and time when the payment card record was last updated, in ISO 8601 format. | string |  |

## Example

JSON

```json
{
  "uid": "card_123",
  "client_uid": "clt_aaabbbccc112233",
  "business_uid": "biz_1234567890",
  "default": true,
  "active": true,
  "card_brand": "visa",
  "funding_type": "credit",
  "last_four_digits": "4242",
  "exp_month": 12,
  "exp_year": 2028,
  "cardholder_name": "Jane Doe",
  "staff_uid": null,
  "staff_name": "Jane Smith",
  "payment_provider": "stripe",
  "initiator": "client",
  "can_be_used_by_staff": false,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```