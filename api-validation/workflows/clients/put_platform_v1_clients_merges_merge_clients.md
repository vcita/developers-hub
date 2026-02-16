---
endpoint: "PUT /platform/v1/clients/merges/merge_clients"
domain: clients
tags: [clients, merges]
swagger: "mcp_swagger/clients.json"
status: verified
savedAt: 2026-02-06T11:04:44.353Z
verifiedAt: 2026-02-06T11:04:44.353Z
timesReused: 0
tokens: [staff]
---

# Merge Clients

## Summary

Merges one or more source clients into a destination client. The merge operation combines client data from `from_client_uids` into `to_client_uid`. Both parameters are required query parameters. The source and destination client UIDs must be distinct.

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Clients merged |
| 404 | Not Found - Missing required query parameters |
| 422 | Unprocessable Entity - Invalid client UIDs |

## Prerequisites

```yaml
steps:
  - id: create_source_client
    description: "Create a source client to merge from"
    method: POST
    path: "/platform/v1/clients"
    body:
      first_name: "Merge"
      last_name: "Source"
      email: "merge_source_{{timestamp}}@example.com"
    extract:
      source_client_uid: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort

  - id: create_dest_client
    description: "Create a destination client to merge into"
    method: POST
    path: "/platform/v1/clients"
    body:
      first_name: "Merge"
      last_name: "Destination"
      email: "merge_dest_{{timestamp}}@example.com"
    extract:
      dest_client_uid: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| to_client_uid | POST /platform/v1/clients | $.data.client.id | Destination client (survives merge) |
| from_client_uids | POST /platform/v1/clients | $.data.client.id | Source client(s) (merged into destination) |

## Test Request

```yaml
steps:
  - id: merge_clients
    description: "Merge source client into destination client"
    method: PUT
    path: "/platform/v1/clients/merges/merge_clients?to_client_uid={{dest_client_uid}}&from_client_uids={{source_client_uid}}"
    expect:
      status: [200]
```

## Parameters Reference

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| to_client_uid | string | Yes | UID of the destination client (data is merged into this client) |
| from_client_uids | string | Yes | Comma-separated UIDs of source clients to merge from |

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| to_client_uid | Required query parameter | Required; controller accesses params['to_client_uid'] directly | merges_controller.rb:12-18 |
| from_client_uids | Required query parameter (comma-separated) | Required; split(',') called on params['from_client_uids'] | merges_controller.rb:12-18 |

## Critical Learnings

1. **Parameters are query params, not body** - Both to_client_uid and from_client_uids go in the URL query string
2. **UIDs must be distinct** - Source and destination must be different clients
3. **404 without params** - Omitting query params returns 404, not 422
