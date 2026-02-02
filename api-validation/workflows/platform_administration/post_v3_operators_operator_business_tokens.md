---
endpoint: "POST /v3/operators/operator_business_tokens"
domain: platform_administration
tags: [operators]
status: skip
savedAt: 2026-01-28T09:50:05.794Z
verifiedAt: 2026-01-28T09:50:05.794Z
---

# Create Operator business tokens

## Summary
User-approved skip: The endpoint POST /v3/operators/operator_business_tokens returns 404 Not Found, and the swagger documentation explicitly warns that it 'may not be implemented'. The alternative endpoint POST /v3/operators/operator_tokens exists but requires different authentication/authorization that cannot be resolved in this test environment.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_operator_business_tokens
    method: POST
    path: "/v3/operators/operator_business_tokens"
    expect:
      status: [200, 201]
```
