## QuotaConsumption

A quota consumption is one row of the usage ledger: units of a metered SKU charged to one allowance subscription of a business. Usage is reported through `POST /v3/license/quota_consumptions` or published by internal services on the queue, and the ingest records it asynchronously: a row exists only once it was recorded, and the POST echoes the report without uid, subscription_uid, period and window_start until then. One reported event writes one row per allowance it was charged to, so an event split across a monthly allowance and a pack has two rows sharing its consumption_attempt_uid.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The entity unique identifier (e.g., "5c8bd6f1-3f0e-4d0a-9a57-2b8f0f6d7a31") | string | Yes |
| created_at | When the usage was recorded (e.g., "2026-09-15T10:00:01Z") | string | Yes |
| updated_at | The last updated date and time of the object (e.g., "2026-09-15T10:00:01Z") | string | Yes |
| business_uid | The business the usage was reported for (e.g., "ixfxpxc7s7shyf0m") | string | Yes |
| subscription_uid | The allowance subscription the usage was charged to (e.g., "bc33f12d-98ee-428f-9f65-18bba589cb95") | string | Yes |
| sku | The metered addon SKU (e.g., "ai_credit") | string | Yes |
| period | The period of the allowance that was charged. **monthly**: resets every month on the day of the month the subscription was created; **life_long**: a pack that never resets (e.g., "monthly") | string (enum: `monthly`, `life_long`) | Yes |
| window_start | The UTC day the charged period started on; 1970-01-01 for life_long (e.g., "2026-09-10") | string | Yes |
| quantity | The units charged to this allowance (e.g., 120) | integer | Yes |
| source | The registered service that reported the usage (e.g., "aiagents") | string | Yes |
| actor_uid | The reporting actor's uid, when the publisher sent one; the POST sets it to the reporting App's uid. An App token sees only rows carrying its own uid (e.g., "aiagents") | string |  |
| consumption_attempt_uid | The publisher's own id for the reported event; every row of one event shares it (e.g., "msg_7f3a") | string | Yes |
| occurred_at | When the usage happened, as reported by the publisher (e.g., "2026-09-15T10:00:00Z") | string | Yes |

## Example

JSON

```json
{
  "uid": "5c8bd6f1-3f0e-4d0a-9a57-2b8f0f6d7a31",
  "created_at": "2026-09-15T10:00:01Z",
  "updated_at": "2026-09-15T10:00:01Z",
  "business_uid": "ixfxpxc7s7shyf0m",
  "subscription_uid": "bc33f12d-98ee-428f-9f65-18bba589cb95",
  "sku": "ai_credit",
  "period": "monthly",
  "window_start": "2026-09-10",
  "quantity": 120,
  "source": "aiagents",
  "actor_uid": "aiagents",
  "consumption_attempt_uid": "msg_7f3a",
  "occurred_at": "2026-09-15T10:00:00Z"
}
```