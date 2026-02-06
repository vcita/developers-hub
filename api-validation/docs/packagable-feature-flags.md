# Packagable Feature Flags

Only **packagable** feature flags (listed below) may be included in API documentation, workflow notes, or fix/JIRA outputs. Do **not** document or suggest adding non-packagable feature flags.

## Directive for All Fix Flows (Healer, Fix Documentation, JIRA Prompts)

1. **Do not include feature flags in documentation** unless they are in the packagable list below.
2. **Before treating a feature flag as the cause of a failure**, call or check **`GET /v3/license/features_packages`** (with the same token/business context as the test) to see whether the staff/business has that feature. If the feature is present in the response, the failure is not due to the feature flag.
3. Redundant or non-packagable flags (e.g. `tags_features`) should not be documented; create a JIRA ticket to remove them from code instead.

## Packagable Feature Flags (Canonical List)

Below is the deduplicated list. Use exact names when documenting.

```
3_services_limitation
activate_automatic_campaigns
add_custom_field_service
allow_custom_field_creation
allow_to_send_link
app_market_available
appadvancecampaigneditor_include_in_plan
app.approve
appquickbooks_include_in_plan
arrival_window
auto_reassign
basic_business_features
bizai_chat
bizai_cs_recommendations
bizai_smart_reply
blasts
block_phone_numbers_in_messages
booking_packages
booking_restrictions_per_service
branding
business_hours
bye_zipwip
campaign_recipients_monthly_unlimited
campaign_recipient_quota_breached
campaigns_library
callsandtexting_incude_in_plan
client_portal_credit_cards
cliche_all_features
cliche_client_features
collect reviews
coupons
create_delete_automatic_campaigns
detailed_reports
disable_messages_notifications
documents_enabled
documents quota logic
eligible_for_work_order
enable_client_status_customization
enable_forms_customization
enable_reviews_auto_publishing
emailsignature_include_in_plan
estimates_monthly_unlimited
event_attendees_limit_increased
event_waitlist
external_calendar_sync
external_new_staff_url
free_features
googlereserve_include_in_plan
googlewaysync_include_in_plan
hide_sms_channel_from_marketing
invoicing_features
invoices_monthly_unlimited
joint_availability
lead_gen_features
limit_document_sharing
marketing_module
multi_appointment_client_booking
multistaff_features
mute
no_powered_by
no_promotional_links
notifications_per_service
old_integration_zoom_include_in_plan
online_payment
online_scheduling
outlookwaysync_include_in_plan
partial_booking_packages
payments_feature_estimates
payments_feature_products
payments_module
pdf_customization
phone_support
pkg.ai.smart_reply_advanced
pkg.business_administration.email_templates
pkg.business_administration.getting_started.deny
pkg.business_administration.integrations
pkg.business_administration.quick_actions
pkg.business_administration.registration_wizard.deny
pkg.business_administration.slim_registration_wizard
pkg.bus.pendo.deny
pkg.bizmanagement.promote
pkg.crm.limit_bulk_actions
pkg.documents.promote
pkg.marketing.promote
pkg.payments.promote
pkg.sch.resources
pro_campaigns
purchase_sms_credits
remove_service_limit
reports
review_publishing
review_generation
reviews_respond
save_cards
scheduled_payments
scheduling_features
send_pro_campaigns
setup_wizard_menu_item
single_service_booking
sms_client_reminders
sms_deduct_all_chargeables
sms_enabled
static_page
staff_role_permissions
tatango
tags_feature
ultimate_features
unlimited_clients
unlimited_payments
unlimited_seats
unlimited_services
vcita_payments_features
zoom_packageable
conversiontracking_include_in_plan
dedicated_promotional_number
ace_add_on
api
backoffice_branding
```

Note: **tags_features** (with 's') is redundant; the packagable flag is **tags_feature**. Do not document tags_features; create a JIRA to remove it from code.
