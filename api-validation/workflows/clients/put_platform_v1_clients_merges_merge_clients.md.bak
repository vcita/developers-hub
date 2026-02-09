---
endpoint: PUT /platform/v1/clients/merges/merge_clients
domain: clients
tags: [clients, merges]
status: success
savedAt: 2026-01-26T05:34:29.823Z
verifiedAt: 2026-01-26T05:34:29.823Z
timesReused: 0
---
# Merge Duplicate Clients

## Summary
Merges two or more duplicate clients into one primary client. This endpoint requires query parameters `to_client_uid` and `from_client_uids` with valid, mergeable client UIDs.

## Prerequisites
1. At least two separate clients that represent different contacts (not related to the same contact)
2. Clients cannot have multiple matters - use `GET /platform/v1/clients/merges/possible_merge_master` to verify eligibility

## UID Resolution Procedure

This endpoint requires **TWO different mergeable clients**:
- `to_client_uid`: The destination/primary client (will remain after merge)
- `from_client_uids`: The source client(s) to merge into the primary (comma-separated)

| UID Field | GET Endpoint | Extract From | Create Fresh | Notes |
|-----------|--------------|--------------|--------------|-------|
| to_client_uid | GET /platform/v1/clients | data.clients[0].id | POST /platform/v1/clients | Must be mergeable |
| from_client_uids | GET /platform/v1/clients | data.clients[1].id | POST /platform/v1/clients | Different from to_client_uid |

### Resolution Steps

**Step 1: Get or create two independent clients**

Option A - Use existing clients:
```
GET /platform/v1/clients → Extract data.clients[0].id and data.clients[1].id
```

Option B - Create fresh clients (recommended for testing):
```json
POST /platform/v1/clients
{
  "first_name": "MergeTest1",
  "last_name": "Client",
  "email": "merge-test-1-{{timestamp}}@example.com"
}

POST /platform/v1/clients
{
  "first_name": "MergeTest2", 
  "last_name": "Client",
  "email": "merge-test-2-{{timestamp}}@example.com"
}
```

**Step 2: Verify merge eligibility (optional but recommended)**
```
GET /platform/v1/clients/merges/possible_merge_master?client_ids={{client1_uid}},{{client2_uid}}
```
If returns 200 with `master_ids`, clients can be merged.
If returns 422, clients are related to the same contact and cannot be merged.

**Step 3: Execute the merge**
```
PUT /platform/v1/clients/merges/merge_clients?to_client_uid={{client1_uid}}&from_client_uids={{client2_uid}}
Body: {}
```

## How to Resolve Parameters
The `to_client_uid` and `from_client_uids` are **query parameters**, not path parameters. They must be appended to the URL.

## Critical Learnings

1. **Query parameters are required** - The request will fail with 404 if `to_client_uid` and `from_client_uids` are not provided
2. **Clients must be mergeable** - If clients are related to the same contact (e.g., pets of the same owner), the merge returns 422
3. **Clients with multiple matters cannot be merged** - Returns 422 if any client has more than one matter
4. **Request body must be sent** - Even though empty, the body `{}` must be included

## Request Template

```json
{
  "method": "PUT",
  "path": "/platform/v1/clients/merges/merge_clients?to_client_uid={{to_client_uid}}&from_client_uids={{from_client_uids}}",
  "token_type": "staff",
  "body": {}
}
```
