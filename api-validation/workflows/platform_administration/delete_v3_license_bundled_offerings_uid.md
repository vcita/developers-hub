---
endpoint: "DELETE /v3/license/bundled_offerings/{uid}"
domain: platform_administration
tags: [license, bundled-offerings]
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: 2026-02-18T12:15:00.000Z
verifiedAt: 2026-02-18T12:15:00.000Z
timesReused: 0
---

# Delete Bundled Offering

## Summary
Deletes a bundled offering relationship. This removes the link between a parent offering and a bundled child offering. **Token Type**: Requires an **admin token**.

## Prerequisites

```yaml
steps:
  - id: get_bundled_offerings
    description: "Fetch existing bundled offerings to get a UID to delete"
    method: GET
    path: "/v3/license/bundled_offerings"
    token: admin
    extract:
      bundled_offering_uid: "$.data.bundled_offerings[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: delete_bundled_offering
    method: DELETE
    path: "/v3/license/bundled_offerings/{{bundled_offering_uid}}"
    token: admin
    expect:
      status: [200, 204]
```