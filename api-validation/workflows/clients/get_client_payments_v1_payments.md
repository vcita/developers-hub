---
endpoint: GET /client/payments/v1/payments
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:36:13.820Z
verifiedAt: 2026-01-23T08:36:13.820Z
timesReused: 0
---
# Get Payments

## Summary
Successfully resolved client payments endpoint by using client token and adding required matter_uid parameter

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/client/payments/v1/payments?matter_uid=7mxnm58ypxss5f4j"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| matter_uid | Required query parameter not documented in the failing request example | Add matter_uid as a required query parameter in the API documentation and example requests | major |
| authentication | Token type requirement not clearly specified - client endpoints need client token | Specify that /client/ endpoints require client token type authentication | major |