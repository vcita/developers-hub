---
endpoint: "GET /v3/communication/business_phone_numbers"
domain: communication
tags: [business_phone_numbers]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-27T07:00:00.000Z
verifiedAt: 2026-01-27T07:00:00.000Z
timesReused: 0
tokens: [staff, directory]
---

# List Business Phone Numbers

## Summary
Retrieves a list of business phone numbers for communication purposes. **Token Type**: Requires a **staff token**. Directory tokens are also supported with X-On-Behalf-Of header.

## Test Request
```yaml
steps:
  - id: list_business_phone_numbers
    method: GET
    path: "/v3/communication/business_phone_numbers"
    expect:
      status: 200
```