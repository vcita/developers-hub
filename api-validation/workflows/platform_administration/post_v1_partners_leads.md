---
endpoint: "POST /v1/partners/leads"
domain: platform_administration
tags: [partners]
swagger: swagger/platform_administration/legacy/partners-api.json
status: skip
savedAt: 2026-01-28T15:36:23.878Z
verifiedAt: 2026-01-28T15:36:23.878Z
---

# Create Leads

## Summary
User-approved skip: Infrastructure issue - Both API gateways (primary and fallback) are returning HTTP 526 'Invalid SSL certificate' errors. This is a server-side SSL configuration problem that cannot be resolved at the API client level. The error indicates that the SSL certificates presented by both api gateways are either expired, invalid, or don't match the domain names. This requires infrastructure team intervention to fix the SSL certificate configuration.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_leads
    method: POST
    path: "/v1/partners/leads"
    expect:
      status: [200, 201]
```
