---
endpoint: "POST /v3/license/directory_offerings/bulk"
domain: platform_administration
tags: [license, bulk]
swagger: swagger/platform_administration/license.json
status: skip
savedAt: 2026-01-28T09:49:24.876Z
verifiedAt: 2026-01-28T09:49:24.876Z
---

# Create Bulk

## Summary
User-approved skip: The endpoint POST /v3/license/directory_offerings/bulk is documented in swagger as 'not yet implemented' and confirmed missing from source code. The DirectoryOfferingsV3Controller only has individual CRUD operations, no bulk endpoints exist.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_bulk
    method: POST
    path: "/v3/license/directory_offerings/bulk"
    expect:
      status: [200, 201]
```
