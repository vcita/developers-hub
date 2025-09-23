## Directory

The Directory entity.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier for the directory. | string | Yes |
| name | Name of the directory. Used only internally | string | Yes |
| partner_name | Name of the partner associated with the directory. This will be used as brand name in the platform | string |  |
| alias | Alias for the directory. | string |  |
| subdomain | Subdomain associated with the directory. The subdomain will be available at subdomain.vcita.com (or subdomain.myclients.io), required in order to configure host-mapping DNS | string |  |
| whitelabel_subdomain | Indicates if the subdomain is whitelabeled. Force whitelabel domain (subdomain.myclients.io) only if host mapping not configured  | boolean |  |
| host_mapping | Host mapping for the directory. The whitelabel host, vendor must configure the DNS record to point to the configured subdomain.vcita.com or subdomain.myclients.io | string |  |
| created_at | Timestamp when the directory was created. | string | Yes |
| updated_at | Timestamp when the directory was last updated. | string | Yes |
| urls | Collection of setup URLs related to the directory. | object |  |

### Urls Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| support_url | Support URL for the directory. | string |  |
| home_url | Home URL for the directory. | string |  |
| faq_url | FAQ URL for the directory. | string |  |
| cancel_page_url | Checkout Cancel page URL for the directory. | string |  |
| upgrade_page_url | Upgrade page URL for the directory. When user is directed to upgrade, the platform will redirect to this URL | string |  |
| signup_url | Signup URL for the directory. When user is directed to signup, the platform will redirect to this URL | string |  |
| sms_purchase_url | SMS purchase URL for the directory. When user is directed to purchase SMS, the platform will redirect to this URL | string |  |
| login_url | Login URL for the directory. When user is directed to login, the platform will redirect to this URL | string |  |
| backoffice_url | Operator Portal Backoffice URL for the directory. | string |  |

## Example

JSON

```json
{
  "uid": "dir-123",
  "name": "Example Directory",
  "partner_name": "Example Partner",
  "alias": "ex-dir",
  "subdomain": "example",
  "whitelabel_subdomain": true,
  "host_mapping": "example.com",
  "created_at": "2023-08-01T12:00:00Z",
  "updated_at": "2023-10-01T12:00:00Z",
  "urls": {
    "support_url": "https://support.example.com",
    "home_url": "https://home.example.com",
    "faq_url": "https://faq.example.com",
    "cancel_page_url": "https://cancel.example.com",
    "upgrade_page_url": "https://upgrade.example.com",
    "signup_url": "https://signup.example.com",
    "sms_purchase_url": "https://sms.example.com",
    "login_url": "https://login.example.com",
    "backoffice_url": "https://backoffice.example.com"
  },
  "description": "Defines a partner directory (brand/tenant) and its core configuration and URLs."
}
```