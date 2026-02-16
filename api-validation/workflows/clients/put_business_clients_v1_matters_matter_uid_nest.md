---
endpoint: "PUT /business/clients/v1/matters/{matter_uid}/nest"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: verified
savedAt: "2026-01-26T05:32:51.457Z"
verifiedAt: "2026-01-26T05:32:51.457Z"
timesReused: 0
---

# Update Nest

## Summary
Moves a matter from one contact to another (nesting). The endpoint requires:
- `matter_uid` in path: The matter to move
- `contact_uid` in body: The destination contact to nest under

Based on unit tests (`nest_matters_api_spec.rb`), both contacts should exist with matters.
The source contact is deleted if it has no remaining matters after nesting.

**Important**: If the destination contact already has a client/matter with the same effective name,
the API may return a 422 validation error. This workflow avoids collisions by creating source and
destination clients with different names.

**Important (current backend behavior)**: If the source matter does not have a `name` field, the
nest operation may fail with a 500. This workflow sets a unique matter name before nesting to
avoid that path.

**Original Issue Fixed**: Empty request body `{}` caused 404 "This contact doesn't exist"
**Fix**: Correctly extract `contact_uid` using `$.data.client.id` and send in request body

## Prerequisites

```yaml
steps:
  - id: create_source_client
    description: "Create source client (automatically gets a matter to nest)"
    method: POST
    path: "/platform/v1/clients"
    body:
      first_name: "Nest"
      last_name: "Source"
      email: "nest_source_{{timestamp}}@example.com"
    extract:
      source_client_uid: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort

  - id: get_source_matters
    description: "Get the auto-created matter from source client"
    method: GET
    path: "/business/clients/v1/contacts/{{source_client_uid}}/matters"
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort

  - id: create_matter_name_field
    description: "Create a matter name field (used to set a unique matter name)"
    method: POST
    path: "/platform/v1/fields"
    body:
      type: "name"
      object_type: "matter"
      label: "Matter Name {{timestamp}}"
      required: false
      keep_asking: false
    extract:
      matter_name_field_uid: "$.data.id"
    expect:
      status: [201]
    onFail: abort

  - id: set_source_matter_name
    description: "Set a unique name on the source matter (prevents 500 during nest)"
    method: PUT
    path: "/business/clients/v1/matters/{{matter_uid}}"
    body:
      matter: {"fields":[{"uid":"{{matter_name_field_uid}}","type":"name","value":"MatterNameForNest_{{timestamp}}"}]}
    expect:
      status: [200, 201]
    onFail: abort

  - id: create_destination_client
    description: "Create destination client to nest the matter under"
    method: POST
    path: "/platform/v1/clients"
    body:
      first_name: "Nest"
      last_name: "Destination"
      email: "nest_dest_{{timestamp}}@example.com"
    extract:
      contact_uid: "$.data.client.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_nest
    description: "Nest the matter from source contact to destination contact"
    method: PUT
    path: "/business/clients/v1/matters/{{matter_uid}}/nest"
    body:
      contact_uid: "{{contact_uid}}"
    expect:
      status: [200]
```
