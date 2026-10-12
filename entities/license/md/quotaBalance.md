## QuotaBalance

A quota balance is the state of one allowance subscription of a business in its current period: what it grants, what was used and what is left. There is one row per allowance; the combined number per SKU is in the list response's meta.totals. Webhook: when an allowance's left crosses from above zero to zero or below, a model update with class `quota_balance` and event `exhausted` is published, once per allowance per period and never for an unlimited allowance. Register a webhook on entity `quota_balance`, event `exhausted`; its payload is `{ subscription_uid, business_uid, sku, period, window_start, left, exhausted_at }`, where left is how far the allowance went (0 or negative) and exhausted_at is when the usage happened. It is a fact, not an instruction: a business with another allowance left can keep consuming.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| subscription_uid | The allowance subscription (e.g., "bc33f12d-98ee-428f-9f65-18bba589cb95") | string | Yes |
| business_uid | The business the allowance belongs to (e.g., "ixfxpxc7s7shyf0m") | string | Yes |
| sku | The metered addon SKU (e.g., "ai_credit") | string | Yes |
| period | How the allowance renews. **monthly**: resets every month on the day of the month the subscription was created; **life_long**: a pack that never resets (e.g., "monthly") | string (enum: `monthly`, `life_long`) | Yes |
| credit | The units the allowance grants per period; null when the allowance is unlimited (e.g., 300000) | integer | Yes |
| consumed | The units used in the current period (e.g., 96000) | integer | Yes |
| left | credit minus consumed; negative after an overdraw. Null when the allowance is unlimited, which is never reported as -1 (e.g., 204000) | integer | Yes |
| resets_at | When a monthly allowance starts its next period. Null for life_long, and for an allowance that ends on or before that day (e.g., "2026-10-10T00:00:00Z") | string | Yes |
| expires_at | When the allowance ends, for any period; null when it has no end date (e.g., "2027-02-01T00:00:00Z") | string | Yes |

## Example

JSON

```json
{
  "subscription_uid": "bc33f12d-98ee-428f-9f65-18bba589cb95",
  "business_uid": "ixfxpxc7s7shyf0m",
  "sku": "ai_credit",
  "period": "monthly",
  "credit": 300000,
  "consumed": 96000,
  "left": 204000,
  "resets_at": "2026-10-10T00:00:00Z",
  "expires_at": null
}
```