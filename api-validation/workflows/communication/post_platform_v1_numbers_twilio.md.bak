---
endpoint: POST /platform/v1/numbers/twilio
domain: communication
tags: []
status: success
savedAt: 2026-01-27T06:29:35.320Z
verifiedAt: 2026-01-27T06:29:35.320Z
timesReused: 0
---
# Create Twilio

## Summary
Test passes after creating fresh business and using directory token. Endpoint successfully creates Twilio integration with HTTP 201.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_uid | POST /platform/v1/businesses | data.business.id | ✓ Yes | DELETE /platform/v1/numbers/twilio/{sub_account_id} |
| messaging_id | - | data[0].uid or data[0].id | ✓ Yes | No separate cleanup needed - removed when TwilioIntegration is deleted |
| sub_account_id | - | data[0].uid or data[0].id | ✓ Yes | Used as path parameter for DELETE endpoint to remove integration |

### Resolution Steps

**business_uid**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"name":"Test Twilio Business {{timestamp}}","email":"twilio-test-{{timestamp}}@example.com","phone":"+15551234567","admin_account":{"email":"twiliotest{{timestamp}}@example.com","first_name":"Twilio","last_name":"Test"}}`
2. Extract UID from creation response: `data.business.id`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /platform/v1/numbers/twilio/{sub_account_id}`

**messaging_id**:
1. **Create fresh test entity**: `undefined`
   - Body template: `"Use format MSG{{timestamp}} - arbitrary string identifier for Twilio messaging service"`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID
4. **Cleanup note**: No separate cleanup needed - removed when TwilioIntegration is deleted

**sub_account_id**:
1. **Create fresh test entity**: `undefined`
   - Body template: `"Use format AC{{timestamp}}abcdef - arbitrary string identifier for Twilio sub-account"`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID
4. **Cleanup note**: Used as path parameter for DELETE endpoint to remove integration

```json
{
  "business_uid": {
    "source_endpoint": "POST /platform/v1/businesses",
    "extract_from": "data.business.id",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "name": "Test Twilio Business {{timestamp}}",
      "email": "twilio-test-{{timestamp}}@example.com",
      "phone": "+15551234567",
      "admin_account": {
        "email": "twiliotest{{timestamp}}@example.com",
        "first_name": "Twilio",
        "last_name": "Test"
      }
    },
    "cleanup_endpoint": "DELETE /platform/v1/numbers/twilio/{sub_account_id}",
    "cleanup_note": "Clean up by deleting the created TwilioIntegration using its sub_account_id"
  },
  "messaging_id": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": "Use format MSG{{timestamp}} - arbitrary string identifier for Twilio messaging service",
    "cleanup_endpoint": null,
    "cleanup_note": "No separate cleanup needed - removed when TwilioIntegration is deleted"
  },
  "sub_account_id": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": "Use format AC{{timestamp}}abcdef - arbitrary string identifier for Twilio sub-account",
    "cleanup_endpoint": null,
    "cleanup_note": "Used as path parameter for DELETE endpoint to remove integration"
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
  "path": "/platform/v1/numbers/twilio",
  "body": {
    "business_uid": "{{config.params.business_uid}}",
    "messaging_id": "MSG1703123456",
    "number": "+15551234567",
    "sub_account_id": "{{resolved.sub_account_id}}"
  }
}
```