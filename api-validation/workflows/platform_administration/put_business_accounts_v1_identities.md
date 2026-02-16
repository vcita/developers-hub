---
endpoint: "PUT /business/accounts/v1/identities"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/accounts.json"
status: verified
savedAt: "2026-02-10T12:00:00.000Z"
verifiedAt: "2026-02-10T12:00:00.000Z"
timesReused: 0
---

# Update Business Identities

## Summary
Update business identities to optimize business terminology, settings, and content. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

> **Note**: The `identities` array must contain valid ContentManagerIdentity UIDs (16-character strings) that exist in the database. Passing an empty array or a non-existent UID will return 422 "Content manager identity is missing".

## Prerequisites

```yaml
steps:
  - id: get_current_identities
    description: "Fetch the business's current content manager identities to get a valid identity UID"
    method: GET
    path: "/business/accounts/v1/identities"
    token: directory
    extract:
      identity_uid: "$.data.business.identities[0]"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_identities
    method: PUT
    path: "/business/accounts/v1/identities"
    token: directory
    body:
      business:
        identities:
          - "{{identity_uid}}"
        execute_verti: false
    expect:
      status: [200, 201]
```