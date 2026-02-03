---
endpoint: "PUT /business/accounts/v1/identities"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/accounts.json
status: success
savedAt: 2026-01-29T08:08:29.450Z
verifiedAt: 2026-01-29T08:08:29.450Z
---

# Update Identities

## Summary
Endpoint works correctly once proper authentication and valid identity UIDs are used. Initial 401 error was due to missing directory token and on-behalf-of header. The "Content manager identity is missing" errors were due to using invalid identity UIDs.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_identities
    method: PUT
    path: "/business/accounts/v1/identities"
    body:
      business:
        execute_verti: true
        identities:
          "0": "{{uid}}"
    expect:
      status: [200, 201]
```
