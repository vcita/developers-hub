---
endpoint: "POST /v3/license/directory_offerings"
domain: platform_administration
tags: [license, directory-offerings]
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-02-10T19:37:23.078Z"
verifiedAt: "2026-02-10T19:37:23.078Z"
timesReused: 0
---

# Create Directory Offering

## Summary
Creates a DirectoryOffering linking a directory to an offering. **Token Type**: Requires an **admin token**.

Each directory can only have one DirectoryOffering per `offering_uid` (uniqueness constraint). The combination of `directory_uid` and `offering_uid` must be unique.

## Prerequisites

```yaml
steps:
  - id: get_offerings
    description: "Fetch offerings to get an available offering UID"
    method: GET
    path: "/v3/license/offerings"
    token: admin
    extract:
      offering_uid: "$.data.offerings[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_directory_offerings
    method: POST
    path: "/v3/license/directory_offerings"
    token: admin
    body:
      directory_uid: "test_directory_{{now_timestamp}}"
      offering_uid: "{{offering_uid}}"
    expect:
      status: [200, 201]
```