---
endpoint: POST /business/payments/v1/payouts
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:11:07.714Z
verifiedAt: 2026-01-27T05:11:07.714Z
timesReused: 0
---
# Create Payouts

## Summary
Test passes after correcting datetime field formats. The API requires ISO8601 datetime format (e.g., '2024-01-01T08:00:00Z') for provider_created_time, provider_updated_time, and processed_time fields.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| provider_payout_id | - | Generated value | ✓ Generated unique identifier | No cleanup needed - payouts are historical records |

### Resolution Steps

**provider_payout_id**:
1. **Create fresh test entity**: `Generated unique identifier`
   - Body template: `"Use unique string like 'test-payout-{{timestamp}}'"`
2. Extract UID from creation response: `Generated value`
3. Run the test with this fresh UID
4. **Cleanup note**: No cleanup needed - payouts are historical records

```json
{
  "provider_payout_id": {
    "source_endpoint": null,
    "extract_from": "Generated value",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "Generated unique identifier",
    "create_body": "Use unique string like 'test-payout-{{timestamp}}'",
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - payouts are historical records"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/business/payments/v1/payouts",
  "body": {
    "payout": {
      "provider_payout_id": "test-payout-1735754449",
      "provider_created_time": "2024-01-01T08:00:00Z",
      "provider_updated_time": "2024-01-01T09:00:00Z",
      "status": "pending",
      "total_amount": 100,
      "net": 95,
      "fee": 5,
      "other": 0,
      "processed_time": "2024-01-01T10:00:00Z",
      "currency": "USD",
      "account_number": "1234567890"
    }
  }
}
```