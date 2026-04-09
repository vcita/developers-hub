# Activity Message Types Reference

This document lists all message types returned by the `GET /v3/communication/activity_messages` endpoint, organized by activity type (messageable type).

## Direction Values

| Direction | Description |
|-----------|-------------|
| `pivot_to_client` | Message sent from the business to the client |
| `client_to_pivot` | Message sent from the client to the business |
| `to_pivot` | System notification delivered to the business side |
| `to_client` | System notification delivered to the client side |

## Meeting

| Message Type | Direction | Meaning |
|---|---|---|
| `schedule_invitation` | `pivot_to_client` | Staff scheduled a new appointment with the client. |
| `schedule` | `client_to_pivot` | Client online scheduled a new appointment, and it was auto-approved. |
| `request` | `client_to_pivot` | Client scheduled a meeting online and it is pending business approval. |
| `request_notification` | `pivot_to_client` | Business sent an automatic reply acknowledging the client's meeting request is being handled. |
| `schedule_update` | `pivot_to_client` | Staff updated the meeting details. |
| `updated` | `pivot_to_client` | Staff updated the meeting details. |
| `updated` | `to_pivot` | Business is notified that meeting details were updated. |
| `cancelled` | `pivot_to_client` | Staff cancelled a meeting with the client. |
| `cancelled` | `client_to_pivot` | Client cancelled a meeting online. |
| `accepted` | `pivot_to_client` | Staff approved a pending meeting request from the client. |
| `accepted` | `client_to_pivot` | Client accepted a tentative meeting scheduled by the staff. |
| `rejected` | `pivot_to_client` | Staff declined a meeting request the client made online. |
| `rejected` | `client_to_pivot` | Client declined a meeting. |
| `completed` | `to_pivot` | The appointment was marked as completed. |
| `reschedule` | `client_to_pivot` | Client rescheduled an appointment online. |
| `reschedule` | `to_pivot` | Business is notified that a meeting was rescheduled. |
| `schedule_client_update` | `client_to_pivot` | Client changed the meeting time online. |
| `schedule_client_update_notification` | `pivot_to_client` | Staff is notified of a change the client made to the appointment online. |
| `propose_time` | `pivot_to_client` | Staff is proposing a new time for the appointment to the client. |
| `please_reschedule` | `pivot_to_client` | Business is asking the client to reschedule the appointment online. |
| `invite` | `pivot_to_client` | Business is inviting the client to schedule online. |
| `rsvp_confirmation` | `client_to_pivot` | Client confirmed attendance to a future meeting. |
| `thank_you_note` | `pivot_to_client` | Staff sent a follow-up thank you message after the meeting. |
| `missed_note` | `pivot_to_client` | Client did not attend the meeting, so staff sends a follow-up message. |
| `expired` | `client_to_pivot` | Client's meeting request expired before the business responded — staff is notified. |
| `expired` | `pivot_to_client` | Client's meeting request expired before the business responded — client is notified. |
| `request_cancelled` | `client_to_pivot` | Client cancelled a meeting request they made online. |
| `request_cancelled` | `pivot_to_client` | Business cancelled a meeting invitation that was not yet approved by the client. |
| `tentative` | `to_client` | Client is notified of a tentatively scheduled meeting pending their confirmation. |
| `meeting_reminder` | `to_pivot` | System sends an upcoming appointment reminder to the business. |
| `meeting_reminder` | `to_client` | System sends an upcoming appointment reminder to the client. |
| `meeting_request_reminder` | `to_client` | Client receives a reminder about their pending meeting request. |
| `meeting_request_reminder` | `to_pivot` | Business receives a reminder about a pending meeting request awaiting approval. |
| `schedule_notification` | `to_client` | Client receives a confirmation notification that a meeting was scheduled. |
| `schedule_update_notification` | `to_pivot` | Business receives a notification that meeting details were updated. |
| `cancelled_notification` | `to_pivot` | Business receives a notification that a meeting was cancelled. |
| `cancelled_notification` | `to_client` | Client receives a notification that a meeting was cancelled. |
| `accepted_notification` | `to_pivot` | Business receives a notification that a meeting request was accepted. |
| `accepted_notification` | `to_client` | Client receives a notification that their meeting was accepted. |
| `add_additional_staff` | `to_pivot` | An additional staff member was assigned to the meeting. |
| `remove_additional_staff` | `to_pivot` | An additional staff member was removed from the meeting. |
| `booking_reassigned` | `to_pivot` | The meeting was reassigned to a different staff member. |
| `dispatch_schedule` | `to_pivot` | A meeting was dispatched and assigned to a staff member. |
| `dispatch_cancel` | `to_pivot` | A dispatched meeting assignment was cancelled. |

## Appointment Series

| Message Type | Direction | Meaning |
|---|---|---|
| `scheduled` | `pivot_to_client` | Business scheduled a recurring appointment series with the client. |
| `scheduled_notification` | `to_pivot` | Business is notified that a recurring appointment series was scheduled. |
| `schedule_update` | `pivot_to_client` | A recurring appointment series time was updated. |
| `schedule_update_notification` | `to_pivot` | Business is notified that a recurring appointment series was updated. |
| `updated` | `pivot_to_client` | Business updated the details of a recurring appointment series. |
| `updated` | `to_pivot` | Business is notified that a recurring appointment series was updated. |
| `cancelled` | `pivot_to_client` | Business cancelled a series of appointments. |
| `cancelled_notification` | `to_pivot` | Business is notified that a recurring appointment series was cancelled. |
| `add_additional_staff` | `to_pivot` | An additional staff member was assigned to the appointment series. |
| `remove_additional_staff` | `to_pivot` | An additional staff member was removed from the appointment series. |
| `booking_reassigned` | `to_pivot` | The appointment series was reassigned to a different staff member. |
| `dispatch_schedule` | `to_pivot` | An appointment series was dispatched and assigned to a staff member. |
| `dispatch_cancel` | `to_pivot` | A dispatched appointment series assignment was cancelled. |

## Linked Booking

| Message Type | Direction | Meaning |
|---|---|---|
| `schedule_invitation` | `pivot_to_client` | Business scheduled several appointments with the client. |
| `cancelled` | `pivot_to_client` | Business cancelled multiple linked meetings with the client. |

## Invoice

| Message Type | Direction | Meaning |
|---|---|---|
| `message_request` | `pivot_to_client` | Staff sent an invoice to the client. |
| `reminder` | `to_pivot` | Business receives a reminder to follow up on an open invoice. |
| `client_reminder` | `to_client` | System sends the client a reminder about an unpaid invoice. |
| `client_reminder` | `pivot_to_client` | Business sends a reminder to the client to pay for an invoice. |

## Estimate

| Message Type | Direction | Meaning |
|---|---|---|
| `request` | `pivot_to_client` | Business sent a new price estimate to the client. |
| `approved` | `client_to_pivot` | Client approved the price estimate. |
| `approved` | `pivot_to_client` | Business sends a confirmed estimate to the client. |
| `rejected` | `client_to_pivot` | Client rejected the price estimate. |
| `rejected` | `pivot_to_client` | Business cancelled a price estimate. |
| `expiring` | `pivot_to_client` | A price estimate is about to expire. |
| `expired` | `to_pivot` | Business is notified that a price estimate has expired. |

## Payment

| Message Type | Direction | Meaning |
|---|---|---|
| `payment_received` | `client_to_pivot` | Client paid online. |
| `payment_received` | `to_pivot` | Business is notified that a payment was received. |
| `payment_received_notification` | `pivot_to_client` | Client received confirmation of their payment. |
| `payment_received_notification` | `to_client` | Client receives a system notification confirming their payment. |
| `receipt_sent` | `to_client` | System notification that a receipt was sent to the client. |
| `receipt_sent` | `pivot_to_client` | A receipt was sent to the client. |
| `receipt_sent` | `to_pivot` | Business is notified that a receipt was sent. |
| `bank_payment` | `to_client` | Client receives confirmation of a bank transfer payment. |
| `payment_refunded_notification` | `to_client` | System notification that a payment refund was processed. |
| `payment_refunded_notification` | `pivot_to_client` | Business refunded a payment to the client. |
| `cancelled` | `to_pivot` | Business is notified that a payment was cancelled. |
| `payment_pending` | `to_pivot` | Business is notified of a pending payment. |
| `payment_failed` | `to_pivot` | Business is notified that a payment attempt failed. |
| `payment_offline_refunded_notification` | `to_pivot` | Business is notified of an offline payment refund. |
| `archived` | `to_pivot` | Business is notified that a payment was archived. |
| `undo_archived` | `to_pivot` | Business is notified that a payment was unarchived. |
| `pending_payment_failed` | `to_pivot` | Business is notified that a pending payment failed. |
| `scheduled_payment_failed` | `to_pivot` | Business is notified that a scheduled payment failed. |

## Payment Status

| Message Type | Direction | Meaning |
|---|---|---|
| `send_link` | `pivot_to_client` | Business sent a payment request link to the client. |

## Payment Card

| Message Type | Direction | Meaning |
|---|---|---|
| `payment_method_added` | `to_pivot` | Business is notified that a client added a payment method on file. |

## Card Request

| Message Type | Direction | Meaning |
|---|---|---|
| `card_requested` | `to_client` | Client receives a request to provide their payment card details. |

## Scheduled Payments Rule

| Message Type | Direction | Meaning |
|---|---|---|
| `scheduled_payments_rule_created` | `pivot_to_client` | Business created a subscription or scheduled payment plan for the client. |

## Event Attendance

| Message Type | Direction | Meaning |
|---|---|---|
| `event_attendance_invite` | `pivot_to_client` | Staff invited the client to register for an event or class. |
| `event_attendance_register_notification` | `pivot_to_client` | Staff registered a client for an event or class. |
| `event_attendance_client_register` | `client_to_pivot` | Client registered for an event or class online. |
| `event_attendance_business_cancel` | `pivot_to_client` | Staff cancelled a client's registration to an event or class. |
| `event_attendance_client_cancel` | `client_to_pivot` | Client cancelled their registration to an event or class online. |
| `event_attendance_client_cancel_notification` | `pivot_to_client` | Staff is notified that a client cancelled their event or class registration. |
| `event_attendance_rescheduled` | `pivot_to_client` | Business changed the time of an event or class. |
| `event_attendance_event_cancelled` | `pivot_to_client` | Business cancelled an event or class. |
| `rsvp_confirmation` | `client_to_pivot` | Client confirmed arrival to an event or class. |
| `event_attendance_reminder` | `to_client` | Client receives a reminder about an upcoming event or class. |
| `booking_reassigned` | `to_pivot` | An event registration was reassigned to a different staff member. |

## Event Series Attendance

| Message Type | Direction | Meaning |
|---|---|---|
| `event_series_attendance_invite` | `pivot_to_client` | Business invited the client to join a series of events or classes. |
| `event_series_attendance_updated` | `pivot_to_client` | Business updated the details of a series of events or classes. |
| `event_series_attendance_cancelled` | `pivot_to_client` | Business cancelled a client's attendance to a series of events or classes. |
| `booking_reassigned` | `to_pivot` | An event series registration was reassigned to a different staff member. |

## Waitlist

| Message Type | Direction | Meaning |
|---|---|---|
| `register_to_event_waitlist` | `client_to_pivot` | Client requested to join a waitlist for an upcoming event or class. |
| `register_to_event_waitlist` | `to_client` | Client receives confirmation of their waitlist registration. |
| `register_to_event_waitlist` | `pivot_to_client` | Business registered a client to a waitlist for an event or class. |
| `register_to_event_waitlist` | `to_pivot` | Business is notified that a client registered to a waitlist. |
| `text` | `pivot_to_client` | Business offers a waitlisted client a spot in the event or class. |
| `cancel_waitlist_registration` | `to_pivot` | Business is notified that a client cancelled their waitlist registration. |

## Client Booking Package

| Message Type | Direction | Meaning |
|---|---|---|
| `package_added` | `pivot_to_client` | Business added a package of services to the client's profile. |
| `package_purchased` | `client_to_pivot` | Client purchased a package of services online. |
| `resend_link` | `pivot_to_client` | Business sent a link to purchase a package to the client. |

## Product Order

| Message Type | Direction | Meaning |
|---|---|---|
| `product_added` | `pivot_to_client` | Business added a new product to the client's CRM card. |

## Announcement

| Message Type | Direction | Meaning |
|---|---|---|
| `custom` | `pivot_to_client` | Business sent an invitation to take online actions through the client portal. |
| `close_open_payments` | `pivot_to_client` | Business sent a link to the client portal for payment. |
| `livesite` | `pivot_to_client` | Business is inviting the client to take online actions on their website. |
| `recover_document` | `pivot_to_client` | Business invites the client to re-share a document online. |

## Document

| Message Type | Direction | Meaning |
|---|---|---|
| `document` | `client_to_pivot` | Client shared a document with the business. |

## Review

| Message Type | Direction | Meaning |
|---|---|---|
| `submit_review` | `client_to_pivot` | Client submitted an online review for the business. |

## Voice Call

| Message Type | Direction | Meaning |
|---|---|---|
| `call` | `client_to_pivot` | Client called the business over the phone (regardless of the call outcome). |

## General (No Specific Activity Type)

These message types have no associated messageable type and represent general communication or system events.

| Message Type | Direction | Meaning |
|---|---|---|
| `text` | `client_to_pivot` | Client replied to the staff. |
| `text` | `pivot_to_client` | Staff replied to the client. |
| `text` | `to_pivot` | A text message was received via an external messaging channel (e.g., Facebook, WhatsApp). |
| `api` | `client_to_pivot` | Client contacted the business (via API-initiated communication). |
| `general_question` | `client_to_pivot` | Client submitted a contact form. |
| `business_text` | `client_to_pivot` | Client replied via SMS to the business. |
| `document` | `client_to_pivot` | Client shared a file with the business. |
| `document` | `pivot_to_client` | Business shared a file with the client. |
| `close_open_payments` | `pivot_to_client` | Business sent a request to the client to pay all open payments. |
| `document_client_pending_approval` | `pivot_to_client` | Business sent a document for client approval. |
| `system` | `client_to_pivot` | Internal CRM activity update. |
| `activity` | `client_to_pivot` | Internal CRM activity recorded for the client. |
| `matter_assigned` | `to_pivot` | A client conversation was assigned to a staff member. |
| `sent_notification` | `to_client` | System notification confirming that a message was sent. |
| `document_client_notification` | `to_client` | Client receives a notification that a document was shared with them. |
| `engagement_reminder` | `to_pivot` | Business receives a reminder to follow up on a client conversation. |
