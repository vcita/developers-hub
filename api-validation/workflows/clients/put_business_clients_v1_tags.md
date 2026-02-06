---
endpoint: "PUT /business/clients/v1/tags"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: pending
useFallbackApi: true
---

# Bulk add tags to matters (PUT /v1/tags)

## Summary
Bulk add tags to one or more matters. This workflow matches **Frontage usage**: the CRM bulk-add-tags flow calls **PUT /business/clients/v1/tags** with body `{ new_api: true, matters: { uids: matter_uids }, tags: added_tags }`. In the app, `matter_uids` come from the selected clients' `client.matter_uid`; here we obtain one matter_uid via GET matters. **Requires packagable feature `tags_feature`** (backend returns 401 when disabled).

## Frontend usage (Frontage)
- **File:** `app/assets/frontage/app/crm/actions/client-tags/client-bulk-tags-controller.js.coffee`
- **Add tags:** `Restangular.all("business/clients/v1/tags").customPUT({ new_api: true, matters: { uids: matter_uids }, tags: added_tags })`
- **Remove tags (bulk):** `Restangular.all("business/clients").customDELETE("v1/tags", { new_api: true }, headers, { matters: { uids: matter_uids }, tags: removed_tags })` — i.e. **DELETE /business/clients/v1/tags** with same body shape.
- Used when user selects multiple clients in CRM and adds or removes tags; `matter_uids` are collected from each client's `matter_uid`.

## Prerequisites

```yaml
steps:
  - id: get_license_features
    description: "Ensure business has tags_feature (packagable). PUT /v1/tags returns 401 if this feature is missing."
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
  - id: put_tags
    method: PUT
    path: "/business/clients/v1/tags"
    body:
      new_api: true
      matters:
        uids:
          - "{{matter_uid}}"
      tags:
        - "api-test-tag"
    expect:
      status: [200]
```

## Notes

- **Frontend contract:** Request shape is defined by Frontage (see **Frontend usage** above). Always send `new_api: true`, `matters.uids` (array), and `tags` (array). For bulk remove, use **DELETE /business/clients/v1/tags** with the same body (and optional `new_api: true` query param).
- **Preferred over POST .../matters/{matter_uid}/tags**: The CRM uses PUT/DELETE **/v1/tags** for bulk add/remove. POST `/business/clients/v1/matters/{matter_uid}/tags` is for a single matter and single tag per request.
- **tags_feature (required)**: First prerequisite calls **GET /v3/license/features_packages**; if PUT returns 401, confirm the business has **tags_feature** in the response.
- **401 Unauthorized**: Not always “invalid token”; can be missing **tags_feature**. See `api-validation/docs/401-returns-in-core.md`.
- **Full frontend reference:** `api-validation/docs/clients-tags-api-frontend.md`.
