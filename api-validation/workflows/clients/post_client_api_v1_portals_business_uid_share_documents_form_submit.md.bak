---
endpoint: POST /client_api/v1/portals/{business_uid}/share_documents_form/submit
domain: clients
tags: [client-api, portals, share-documents-form]
status: skip
savedAt: 2026-01-25T22:22:24.995Z
verifiedAt: 2026-01-25T22:22:24.995Z
timesReused: 0
skipReason: This endpoint requires actual multipart/form-data file uploads with binary content. The API testing framework cannot properly simulate real file uploads - it can only send JSON data. The backend expects file objects with content_type method, not string content.
---
# Create Submit

## Summary
User-approved skip: This endpoint requires actual multipart/form-data file uploads with binary content. The API testing framework cannot properly simulate real file uploads - it can only send JSON data. The backend expects file objects with content_type method, not string content.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

This endpoint requires actual multipart/form-data file uploads with binary content. The API testing framework cannot properly simulate real file uploads - it can only send JSON data. The backend expects file objects with content_type method, not string content.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/client_api/v1/portals/{business_uid}/share_documents_form/submit"
}
```