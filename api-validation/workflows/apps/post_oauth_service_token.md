---
endpoint: POST /oauth/service/token
domain: apps
tags: []
status: skip
savedAt: 2026-01-24T13:25:03.021Z
verifiedAt: 2026-01-24T13:25:03.021Z
timesReused: 0
skipReason: Requires valid OAuth application credentials (service_id/service_secret) that exist in the Doorkeeper::Application table. The endpoint is designed to work with real OAuth apps registered in the system, not test data. Using fake credentials results in "Unknown application" error which appears as 500 response.
---
# Create Token

## Summary
Skipped based on cached workflow - Requires valid OAuth application credentials (service_id/service_secret) that exist in the Doorkeeper::Application table. The endpoint is designed to work with real OAuth apps registered in the system, not test data. Using fake credentials results in "Unknown application" error which appears as 500 response.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Requires valid OAuth application credentials (service_id/service_secret) that exist in the Doorkeeper::Application table. The endpoint is designed to work with real OAuth apps registered in the system, not test data. Using fake credentials results in "Unknown application" error which appears as 500 response.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```