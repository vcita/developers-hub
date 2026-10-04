## QuotaBalance

A quota balance is the state of one allowance subscription of a business in its current period: what it grants, what was used and what is left. There is one row per allowance and never one combined number; add up the rows of a SKU to know whether the business can still consume it.

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| subscription_uid | The allowance subscription (e.g., "bc33f12d-98ee-428f-9f65-18bba589cb95") | string | Yes |
| business_uid | The business the allowance belongs to (e.g., "ixfxpxc7s7shyf0m") | string | Yes |
| sku | The metered addon SKU (e.g., "ai_credit") | string | Yes |
| period | How the allowance renews. **monthly**: resets every month on the day of the month the subscription was created; **life_long**: a pack that never resets (e.g., "monthly") | string (enum: `monthly`, `life_long`) | Yes |
| unlimited | The allowance has no cap. Usage is still counted, and credit and left are null, so check this flag rather than a special value (e.g., false) | boolean | Yes |
| credit | The units the allowance grants per period; null when unlimited (e.g., 300000) | integer | Yes |
| consumed | The units used in the current period (e.g., 96000) | integer | Yes |
| left | credit minus consumed. Negative when the allowance was overdrawn; null when unlimited, never -1 (e.g., 204000) | integer | Yes |
| resets_at | When a monthly allowance starts its next period; null for life_long (e.g., "2026-10-10T00:00:00Z") | string | Yes |
| expires_at | When a life_long pack expires, if it does; null for monthly (e.g., "2027-02-01T00:00:00Z") | string | Yes |

## Example

JSON

```json
{
  "subscription_uid": "bc33f12d-98ee-428f-9f65-18bba589cb95",
  "business_uid": "ixfxpxc7s7shyf0m",
  "sku": "ai_credit",
  "period": "monthly",
  "unlimited": false,
  "credit": 300000,
  "consumed": 96000,
  "left": 204000,
  "resets_at": "2026-10-10T00:00:00Z",
  "expires_at": null
}
```