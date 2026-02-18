---
endpoint: "POST /business/clients/v1/matters/{matter_uid}/tags"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: skip
skipReason: "Deprecated. Use PUT /business/clients/v1/tags instead."
savedAt: "2026-02-03T18:27:27.713Z"
timesReused: 0
---

# [Deprecated] Create Tag

## Summary
**[Deprecated]** Use **PUT /business/clients/v1/tags** instead (workflow `put_business_clients_v1_tags.md`). This endpoint adds a single tag to one matter (one matter_uid in path, one tag in body); the product uses PUT /v1/tags for bulk add. This workflow requires **tags_feature** (backend returns 401 when disabled), verifies license/features, then fetches a client and matters, then posts the tag. GET /business/clients/v1/matters requires **contact_uid** (same as client_uid) or a filter; without it the controller can 500.

## Prerequisites

```yaml
steps:
  - id: get_license_features
    description: "Ensure business has tags_feature (packagable). POST /matters/.../tags returns 401 if this feature is missing."
    method: GET
    path: "/v3/license/features_packages"
    token: staff
    expect:
      status: [200]
    onFail: abort
  - id: get_client
    description: "Get a client to use as contact_uid for GET matters"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      per_page: 1
    extract:
      client_uid: "$.data.clients[0].uid"
    expect:
      status: [200]
    onFail: abort
  - id: get_matters
    description: "Get a matter for this contact (contact_uid required by API)"
    method: GET
    path: "/business/clients/v1/matters"
    token: staff
    params:
      contact_uid: "{{client_uid}}"
      per_page: 1
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_tags
    method: POST
    path: "/business/clients/v1/matters/{{matter_uid}}/tags"
    body:
      tag: "api-test-tag"
    expect:
      status: [200, 201]
```

## Notes

- **Bulk endpoint**: To add tags to one or more matters in one request, use **PUT /business/clients/v1/tags** with body `{ "new_api": true, "matters": { "uids": ["..."] }, "tags": ["..."] }` — workflow `put_business_clients_v1_tags.md`.
- **tags_feature (required)**: The endpoint is gated by the packagable feature **tags_feature**. The first prerequisite calls **GET /v3/license/features_packages** with the same staff token; if that call succeeds (200), the test environment is expected to have tags_feature for the staff's business. If POST still returns 401, confirm in the features_packages response that `tags_feature` is present for the business; if it is not, the failure is due to the feature gate, not auth or workflow.
- **contact_uid**: The GET matters endpoint expects `contact_uid` (client/contact UID). This workflow obtains it via GET /platform/v1/clients and passes it as `contact_uid` so the prerequisite does not fail.
- **401 Unauthorized**: A 401 here is not always “invalid token”. If the body is `{"success":false,"errors":[{"code":"unauthorized","message":"Unauthorized"}]}`, the token was accepted but the post-auth check failed (e.g. business context mismatch or missing tags_feature). Use a **Staff** token whose business has **tags_feature**; see `api-validation/docs/401-returns-in-core.md`.