---
endpoint: "GET /platform/v1/clients/merges/possible_merge_master"
domain: clients
tags: [clients, merges]
swagger: "swagger/clients/legacy/legacy_v1_clients.json"
status: verified
savedAt: "2026-01-26T05:27:34.436Z"
verifiedAt: "2026-02-06T16:29:51.395Z"
timesReused: 0
tokens: [staff]
---

# Get Possible Merge Master

## Summary

Returns a list of client UIDs eligible to be the primary (master) client in a merge operation. Requires the `client_ids` query parameter with comma-separated client UIDs. The two clients must be independent contacts (not related to the same contact) otherwise the endpoint returns 422. The Platform V1 endpoint returns only `master_ids` (unlike the V2 endpoint which also returns `clients`).

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Returns eligible master client UIDs |
| 404 | Not Found - Client UID doesn't exist |
| 422 | Unprocessable Entity - Clients cannot be merged (e.g., related to same contact, or have multiple matters) |

## Prerequisites

```yaml
steps:
  - id: create_client_a
    description: "Create first client for merge eligibility check"
    method: POST
    path: "/platform/v1/clients"
    body:
      first_name: "MergeCheckA"
      last_name: "Test"
      email: "mergecheck_a_{{now_timestamp}}@example.com"
    extract:
      client_a_uid: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort

  - id: create_client_b
    description: "Create second client for merge eligibility check"
    method: POST
    path: "/platform/v1/clients"
    body:
      first_name: "MergeCheckB"
      last_name: "Test"
      email: "mergecheck_b_{{now_timestamp}}@example.com"
    extract:
      client_b_uid: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| client_a_uid | POST /platform/v1/clients | $.data.client.id | First client to check |
| client_b_uid | POST /platform/v1/clients | $.data.client.id | Second client to check |

### Resolution Steps

**client_a_uid:**
1. Call `POST /platform/v1/clients` with unique email
2. Extract `$.data.client.id` from response

**client_b_uid:**
1. Call `POST /platform/v1/clients` with a different unique email
2. Extract `$.data.client.id` from response
3. Both clients must be independent contacts (different emails ensure different contacts)

## Test Request

```yaml
steps:
  - id: get_possible_merge_master
    description: "Check which clients can be the merge master"
    method: GET
    path: "/platform/v1/clients/merges/possible_merge_master?client_ids={{client_a_uid}},{{client_b_uid}}"
    expect:
      status: [200]
```

## Parameters Reference

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_ids | string | Yes | Comma-separated list of client UIDs to check for merge eligibility (e.g., "uid1,uid2") |

## Critical Learnings

1. **client_ids is required** - Omitting the query parameter causes a 500/404 because the controller calls `params['client_ids'].split(',')` on nil
2. **Clients must be independent contacts** - If clients share the same contact (e.g., same email), the endpoint returns 422
3. **V1 vs V2 response difference** - Platform V1 only returns `{status: 'OK', master_ids: [...]}`. The V2 endpoint returns the full response including a `clients` array
4. **Frontend uses V2** - The Frontage client-merge-service uses the V2 API (via Restangular) which returns both `clients` and `master_ids`

## Notes

- The `master_ids` array contains UIDs of clients eligible to be the primary/master in the merge
- If no clients have merge restrictions, all provided client UIDs are returned as potential masters
- Clients with external entities, too many messages, or multiple matters may be restricted as merge targets
