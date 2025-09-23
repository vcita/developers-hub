## Payment Gateway

Metadata for a payment gateway integration, including locales, supported regions, methods, and processing features.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier (UID) of the payment gateway. | string |  |
| gateway_name | The unique name of the payment gateway initialized when the owning app was created, provided as the name parameter to the App Creation API. | string |  |
| app_code_name | The unique code name of the pre-created gateway's app, created via the API- Creates an app, https://api.vcita.biz/platform/v1/apps | string | Yes |
| gateway_logo_url | The URL to the logo of the gateway. | string | Yes |
| default_locale | Specifies the fallback locale for the gateway's textual content. If a translation or string is missing, this locale will be used by default. | string (enum: `en`, `fr`, `de`, `it`, `pl`, `pt`, `es`, `nl`, `he`, `en_gb`) | Yes |
| gateway_type | Integration type: a payment service provider (e.g., Stripe, Square) that enables merchants to process multiple payment methods, or a digital wallet (e.g., PayPal, Google Pay) that allows consumers to store and use payment credentials | string (enum: `digital_wallet`, `payments_provider`) | Yes |
| status | Indicates the current status of the payment gateway: 'active' (available for use), 'disabled' (not available for use), or 'deprecated' (still available but not recommended for new integrations) | string (enum: `active`, `disabled`, `deprecated`) | Yes |
| created_at | The date and time the payment gateway was created. | string |  |
| updated_at | The date and time the payment gateway was last updated. | string |  |
| main_gateway_benefits | A clear 3-4 bullet list highlighting the unique features and value of the gateway, aimed at encouraging merchants to connect with it. This information is stored per locale. | array of objects | Yes |
| brief_benefit_highlights | A brief, 2-4 word version of the gateway benefits, tailored for compact displays or mobile interfaces. This information is stored per locale. | array of objects | Yes |
| supported_countries | A list of countries supported by the payment gateway, represented using ISO 3166-1 alpha-2 country codes. | array of strings | Yes |
| supported_currencies | A list of currencies supported by the payment gateway, represented using ISO 4217 format. | array of strings | Yes |
| minimum_charge_amount | The minimum value that can be charged using the payment gateway. | number |  |
| payment_methods | The payment methods supported by the gateway. | object | Yes |
| processing_features | The features the payment gateway supports and their current state (enabled/disabled). | object | Yes |

### Payment Methods Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| credit_card | Indicates if the gateway supports credit card payments. | boolean |  |
| ach | Indicates if the gateway supports ACH payments. | boolean |  |
| ideal | Indicates if the gateway supports iDeal payments. | boolean |  |
| bancontact | Indicates if the gateway supports Bancontact payments. | boolean |  |
| twint | Indicates if the gateway supports Twint payments. | boolean |  |

### Processing Features Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| multi_currency | Indicates if the gateway supports multi-currency transactions. | boolean | Yes |
| back_office_charge | Indicates if the gateway allows the SMB to process charges directly from the back office. | boolean | Yes |
| checkout | Indicates whether the payment gateway supports a checkout option initiated from the client portal. This value must always be set to true, as client portal checkout is a core feature. | boolean | Yes |
| refund | Indicates if the gateway supports full online refunds. | boolean | Yes |
| partial_refund | Indicates if the gateway supports partial online refunds. Requires full refunds to be enabled. | boolean | Yes |
| client_save_card_on_checkout | Indicates if clients can save cards on file during a payment flow. | boolean | Yes |
| client_save_card_standalone | Indicates if clients can save cards on file through a standalone flow. | boolean | Yes |
| save_card_by_business | Indicates if the gateway supports saving cards on file from the business side. | boolean | Yes |

## Example

JSON

```json
{
  "uid": "pgw_abc123def456",
  "gateway_name": "stripe_payments_v2",
  "app_code_name": "stripe_payments_v2",
  "gateway_logo_url": "https://cdn.stripe.com/logo.png",
  "default_locale": "en",
  "gateway_type": "payments_provider",
  "status": "active",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-20T14:45:00.000Z",
  "main_gateway_benefits": [
    {
      "locale": "en",
      "benefits": [
        "Accept payments from 195+ countries",
        "Industry-leading fraud protection",
        "Fast payouts in 2-7 business days",
        "24/7 customer support"
      ]
    },
    {
      "locale": "es",
      "benefits": [
        "Acepta pagos de más de 195 países",
        "Protección líder contra fraudes",
        "Pagos rápidos en 2-7 días hábiles",
        "Soporte al cliente 24/7"
      ]
    }
  ],
  "brief_benefit_highlights": [
    {
      "locale": "en",
      "highlights": [
        "Global reach",
        "Fraud protection",
        "Fast payouts"
      ]
    },
    {
      "locale": "es",
      "highlights": [
        "Alcance global",
        "Protección fraude",
        "Pagos rápidos"
      ]
    }
  ],
  "supported_countries": [
    "US",
    "CA",
    "GB",
    "AU",
    "DE",
    "FR",
    "ES",
    "IT"
  ],
  "supported_currencies": [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD"
  ],
  "minimum_charge_amount": 0.5,
  "payment_methods": {
    "credit_card": true,
    "ach": true,
    "ideal": true,
    "bancontact": false,
    "twint": false
  },
  "processing_features": {
    "multi_currency": true,
    "back_office_charge": true,
    "checkout": true,
    "refund": true,
    "partial_refund": true,
    "client_save_card_on_checkout": true,
    "client_save_card_standalone": true,
    "save_card_by_business": true
  }
}
```