---
endpoint: "POST /client_api/v1/portals/{business_uid}/share_documents_form/submit"
domain: clients
tags: [client-api, portals, share-documents-form]
swagger: swagger/clients/legacy/client_communication.json
status: skip
savedAt: 2026-01-25T22:22:24.995Z
verifiedAt: 2026-01-25T22:22:24.995Z
---

# Create Submit

## Summary
User-approved skip: This endpoint requires actual multipart/form-data file uploads with binary content. The API testing framework cannot properly simulate real file uploads - it can only send JSON data. The backend expects file objects with content_type method, not string content.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_submit
    method: POST
    path: "/client_api/v1/portals/{business_uid}/share_documents_form/submit"
    expect:
      status: [200, 201]
```
