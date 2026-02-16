---
endpoint: GET /platform/v1/clients/merges/possible_merge_master
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:27:34.436Z
verifiedAt: 2026-01-26T05:27:34.436Z
timesReused: 0
---
# Get Possible merge master

## Summary
Successfully tested GET /platform/v1/clients/merges/possible_merge_master. The endpoint requires the client_ids query parameter with comma-separated client UIDs. Returns 422 if clients have multiple matters (cannot be merged) or 200 with eligible master_ids if clients can be merged.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_id_1 | GET /platform/v1/clients | data.clients[0].id | ✓ Yes | DELETE /platform/v1/clients/{client_id} |
| client_id_2 | GET /platform/v1/clients | data.clients[1].id | ✓ Yes | DELETE /platform/v1/clients/{client_id} |

### Resolution Steps

**client_id_1**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"first_name":"MergeTest1","last_name":"Client","email":"merge-test-1-{{timestamp}}@example.com","mobile_phone":"+1234567890","address":"123 Test Street","customer_status":"lead"}`
2. Extract UID from creation response: `data.clients[0].id`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /platform/v1/clients/{client_id}`

**client_id_2**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"first_name":"MergeTest2","last_name":"Client","email":"merge-test-2-{{timestamp}}@example.com","mobile_phone":"+1234567891","address":"124 Test Street","customer_status":"lead"}`
2. Extract UID from creation response: `data.clients[1].id`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /platform/v1/clients/{client_id}`

```json
{
  "client_id_1": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[0].id",
    "fallback_endpoint": "POST /platform/v1/clients",
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "first_name": "MergeTest1",
      "last_name": "Client",
      "email": "merge-test-1-{{timestamp}}@example.com",
      "mobile_phone": "+1234567890",
      "address": "123 Test Street",
      "customer_status": "lead"
    },
    "cleanup_endpoint": "DELETE /platform/v1/clients/{client_id}",
    "cleanup_note": "Clean up test clients after test"
  },
  "client_id_2": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[1].id",
    "fallback_endpoint": "POST /platform/v1/clients",
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "first_name": "MergeTest2",
      "last_name": "Client",
      "email": "merge-test-2-{{timestamp}}@example.com",
      "mobile_phone": "+1234567891",
      "address": "124 Test Street",
      "customer_status": "lead"
    },
    "cleanup_endpoint": "DELETE /platform/v1/clients/{client_id}",
    "cleanup_note": "Clean up test clients after test"
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
  "method": "GET",
  "path": "/platform/v1/clients/merges/possible_merge_master?client_ids=vu4b21mvogf0opuh"
}
```