---
endpoint: POST /platform/v1/businesses/verify_audience_claim
domain: platform_administration
tags: [businesses]
status: skip
savedAt: 2026-01-29T08:16:57.062Z
verifiedAt: 2026-01-29T08:16:57.062Z
timesReused: 0
skipReason: This endpoint requires partners to pre-load audience data via CSV upload or Audiences API (operator-level functionality). The test directory has no pre-loaded audience records, so any unique_validation_identifier will return 'Audience not found'. This is expected behavior, not a bug. Testing this endpoint would require either: 1) Access to operator-level audience management APIs to create test data, or 2) Pre-seeded test audience data for the test directory.
---
# Create Verify audience claim

## Summary
User-approved skip: This endpoint requires partners to pre-load audience data via CSV upload or Audiences API (operator-level functionality). The test directory has no pre-loaded audience records, so any unique_validation_identifier will return 'Audience not found'. This is expected behavior, not a bug. Testing this endpoint would require either: 1) Access to operator-level audience management APIs to create test data, or 2) Pre-seeded test audience data for the test directory.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

This endpoint requires partners to pre-load audience data via CSV upload or Audiences API (operator-level functionality). The test directory has no pre-loaded audience records, so any unique_validation_identifier will return 'Audience not found'. This is expected behavior, not a bug. Testing this endpoint would require either: 1) Access to operator-level audience management APIs to create test data, or 2) Pre-seeded test audience data for the test directory.

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
  "path": "/platform/v1/businesses/verify_audience_claim"
}
```