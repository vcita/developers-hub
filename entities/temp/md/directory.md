## Directory

Legacy/temp directory schema with extended operational fields for migration/testing.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| id | Unique identifier for the directory. | integer | Yes |
| name | Name of the directory. | string | Yes |
| partner_name | Name of the partner associated with the directory. | string |  |
| alias | Alias for the directory. | string |  |
| subdomain | Subdomain associated with the directory. | string |  |
| whitelabel_subdomain | Indicates if the subdomain is whitelabeled. | boolean |  |
| host_mapping | Host mapping for the directory. | string |  |
| host_mapping_verified_at | Timestamp when the host mapping was verified. | string |  |
| ssl_enabled | Indicates if SSL is enabled for the directory. | boolean |  |
| old_host_mapping | Previous host mapping for the directory. | string |  |
| frontage | Frontage information for the directory. | string |  |
| white_label | Indicates if the directory is white-labeled. | boolean |  |
| manual_type | Manual type of the directory. | string |  |
| whitelabel_created_at | Timestamp when the whitelabel was created. | string |  |
| current_subscription_created_at | Timestamp when the current subscription was created. | string |  |
| admin_id | ID of the admin associated with the directory. | integer |  |
| configuration_key | Configuration key for the directory. | string |  |
| created_at | Timestamp when the directory was created. | string | Yes |
| updated_at | Timestamp when the directory was last updated. | string | Yes |
| default_password | Default password for the directory. | string |  |
| branding_theme_id | ID of the branding theme associated with the directory. | integer |  |
| old_type | Previous type of the directory. | string |  |
| billing_type | Billing type of the directory. | string |  |
| managed | Indicates if the directory is managed. | boolean |  |
| uid | Unique identifier for the directory. | string |  |
| members_count | Number of members in the directory. | integer |  |
| can_give_trial | Indicates if the directory can give trials. | boolean |  |
| slim_register | Indicates if slim registration is enabled. | boolean |  |
| management_theme_id | ID of the management theme associated with the directory. | integer |  |
| support_url | Support URL for the directory. | string |  |
| invite_subject | Subject of the invite email. | string |  |
| invite_body | Body of the invite email. | string |  |
| home_url | Home URL for the directory. | string |  |
| faq_url | FAQ URL for the directory. | string |  |
| cancel_page_url | Cancel page URL for the directory. | string |  |
| upgrade_page_url | Upgrade page URL for the directory. | string |  |
| signup_url | Signup URL for the directory. | string |  |
| sms_purchase_url | SMS purchase URL for the directory. | string |  |
| login_url | Login URL for the directory. | string |  |
| backoffice_url | Backoffice URL for the directory. | string |  |
| social_links_on | Indicates if social links are enabled. | boolean |  |
| locale | Locale of the directory. | string |  |
| ultimate_monthly_subscription_id | ID of the ultimate monthly subscription. | integer |  |
| ultimate_annual_subscription_id | ID of the ultimate annual subscription. | integer |  |
| subscriptions_mismatch_at | Timestamp when subscriptions mismatch was detected. | string |  |
| white_label_subscription_id | ID of the white label subscription. | integer |  |
| current_subscription_id | ID of the current subscription. | integer |  |
| redeem_state | Redeem state of the directory. | string |  |
| pending_member_id | ID of the pending member. | integer |  |
| default_package_id | ID of the default package. | integer |  |
| default_self_paid | Indicates if the default is self-paid. | boolean |  |
| rev_share | Revenue share percentage. | integer |  |
| rev_share_tier2 | Revenue share percentage for tier 2. | integer |  |
| banners_visibility | Visibility of banners in the directory. | string |  |
| only_owner_login_redirect | Indicates if only owner login redirect is enabled. | boolean |  |
| paid_total | Total amount paid. | number |  |
| custom_sms_sending_phone_number | Custom SMS sending phone number. | string |  |
| features | Features of the directory. | string |  |
| mobile_app_name | Name of the mobile app. | string |  |
| mobile_app_ios | iOS version of the mobile app. | string |  |
| mobile_app_android | Android version of the mobile app. | string |  |
| email_template_owner_uid | UID of the email template owner. | string |  |
| welcome_engagement_params | Parameters for welcome engagement. | string |  |
| unsubscribe_sms | Indicates if unsubscribe SMS is enabled. | boolean |  |
| disable_analytics | Indicates if analytics are disabled. | boolean |  |
| settings | Settings for the directory. | string |  |
| content_business_id | ID of the content business. | integer |  |
| content_manager_enable | Indicates if content manager is enabled. | boolean |  |
| features_info | Information about features. | string |  |
| time_zone | Time zone of the directory. | string |  |
| paypal_email | PayPal email associated with the directory. | string |  |
| user_identity_manager_enable | Indicates if user identity manager is enabled. | boolean |  |
| urls | Collection of URLs related to the directory. | object |  |

### Urls Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| support_url | Support URL for the directory. | string |  |
| home_url | Home URL for the directory. | string |  |
| faq_url | FAQ URL for the directory. | string |  |
| cancel_page_url | Cancel page URL for the directory. | string |  |
| upgrade_page_url | Upgrade page URL for the directory. | string |  |
| signup_url | Signup URL for the directory. | string |  |
| sms_purchase_url | SMS purchase URL for the directory. | string |  |
| login_url | Login URL for the directory. | string |  |
| backoffice_url | Backoffice URL for the directory. | string |  |

## Example

JSON

```json
{
  "id": 1,
  "name": "Example Directory",
  "subdomain": "example",
  "whitelabel_subdomain": true,
  "host_mapping": "example.com",
  "host_mapping_verified_at": "2023-10-01T12:00:00Z",
  "ssl_enabled": true,
  "old_host_mapping": "old-example.com",
  "frontage": "Main Street",
  "white_label": true,
  "manual_type": "standard",
  "whitelabel_created_at": "2023-09-01T12:00:00Z",
  "current_subscription_created_at": "2023-09-15T12:00:00Z",
  "admin_id": 123,
  "configuration_key": "config-123",
  "created_at": "2023-08-01T12:00:00Z",
  "updated_at": "2023-10-01T12:00:00Z",
  "default_password": "password123",
  "branding_theme_id": 456,
  "old_type": "legacy",
  "billing_type": "monthly",
  "managed": false,
  "uid": "dir-123",
  "members_count": 10,
  "can_give_trial": true,
  "slim_register": false,
  "management_theme_id": 789,
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
  "invite_subject": "Join our platform",
  "invite_body": "Welcome to our platform. Please join us.",
  "social_links_on": true,
  "locale": "en-US",
  "ultimate_monthly_subscription_id": 101,
  "ultimate_annual_subscription_id": 102,
  "subscriptions_mismatch_at": "2023-10-01T12:00:00Z",
  "white_label_subscription_id": 103,
  "current_subscription_id": 104,
  "redeem_state": "active",
  "pending_member_id": 105,
  "default_package_id": 106,
  "default_self_paid": true,
  "rev_share": 20,
  "rev_share_tier2": 10,
  "banners_visibility": "visible",
  "only_owner_login_redirect": false,
  "paid_total": 1000,
  "custom_sms_sending_phone_number": "+1234567890",
  "features": "basic",
  "mobile_app_name": "Example App",
  "mobile_app_ios": "1.0.0",
  "mobile_app_android": "1.0.0",
  "email_template_owner_uid": "email-123",
  "welcome_engagement_params": "param1=value1&param2=value2",
  "unsubscribe_sms": false,
  "disable_analytics": false,
  "settings": "default",
  "content_business_id": 107,
  "content_manager_enable": true,
  "features_info": "info",
  "time_zone": "America/New_York",
  "paypal_email": "example@paypal.com",
  "user_identity_manager_enable": true,
  "partner_name": "Example Partner",
  "alias": "ex-dir"
}
```